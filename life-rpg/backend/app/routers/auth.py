from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Response, Request, status, Depends
from bson import ObjectId

from app.models.auth import RegisterRequest, LoginRequest, ChangePasswordRequest
from app.database import users_col, characters_col, inventory_col, items_col
from app.utils.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)
from app.services.rpg_engine import compute_base_stats
from app.dependencies import get_current_user
from app.config import get_settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _set_refresh_cookie(response: Response, token: str):
    settings = get_settings()
    is_prod = settings.environment == "production"
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=is_prod,
        samesite="none" if is_prod else "lax",
        max_age=settings.refresh_token_expire_days * 86400,
        path="/api/auth/refresh",
    )


@router.post("/register", status_code=201)
async def register(body: RegisterRequest, response: Response):
    col = users_col()

    # Uniqueness check
    existing = await col.find_one(
        {"$or": [{"email": body.email.lower()}, {"username": body.username}]}
    )
    if existing:
        field = "email" if existing.get("email") == body.email.lower() else "username"
        raise HTTPException(status_code=409, detail=f"{field} already in use")

    # Create user
    now = datetime.now(timezone.utc)
    password_hash = hash_password(body.password)
    refresh_token = create_refresh_token("")  # temp; regenerated below

    user_doc = {
        "username": body.username,
        "email": body.email.lower(),
        "password_hash": password_hash,
        "created_at": now,
        "updated_at": now,
        "last_login": now,
        "is_active": True,
        "refresh_token_hash": None,
        "timezone": "UTC",
    }
    result = await col.insert_one(user_doc)
    user_id = result.inserted_id

    # Generate real tokens now that we have user_id
    access_token = create_access_token(str(user_id))
    refresh_token = create_refresh_token(str(user_id))
    rt_hash = hash_password(refresh_token)
    await col.update_one({"_id": user_id}, {"$set": {"refresh_token_hash": rt_hash}})

    # Create character document
    base_stats = compute_base_stats(1)
    char_doc = {
        "user_id": user_id,
        "name": body.username,   # default name = username; user changes on onboarding
        "grace_level": 1,
        "total_runes": 0,
        "current_runes": 0,
        "echoes": 0,
        **base_stats,
        "effective_vigor": base_stats["base_vigor"],
        "effective_strength": base_stats["base_strength"],
        "effective_poise": base_stats["base_poise"],
        "current_hp": base_stats["base_vigor"],
        "streak": 0,
        "streak_last_updated": "",
        "daily_runes_today": 0,
        "runes_for_today_date": "",
        "bosses_defeated": [],
        "quest_completions_total": 0,
        "onboarding_complete": False,
        "created_at": now,
        "updated_at": now,
        "timezone": "UTC",
    }
    await characters_col().insert_one(char_doc)

    # Grant starter items
    starter_keys = ["worn_shield", "iron_sword"]
    for key in starter_keys:
        item = await items_col().find_one({"item_key": key})
        if item:
            await inventory_col().update_one(
                {"user_id": user_id, "item_id": item["_id"]},
                {"$setOnInsert": {"user_id": user_id, "item_id": item["_id"],
                                   "quantity": 1, "acquired_at": now}},
                upsert=True,
            )

    _set_refresh_cookie(response, refresh_token)
    return {
        "user_id": str(user_id),
        "username": body.username,
        "email": body.email.lower(),
        "access_token": access_token,
    }


@router.post("/login")
async def login(body: LoginRequest, response: Response):
    col = users_col()
    user = await col.find_one({"email": body.email.lower(), "is_active": True})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)
    rt_hash = hash_password(refresh_token)

    now = datetime.now(timezone.utc)
    await col.update_one(
        {"_id": user["_id"]},
        {"$set": {"refresh_token_hash": rt_hash, "last_login": now, "updated_at": now}},
    )

    # Lazy streak expiry check
    from app.services.streak_service import reset_streak_if_expired
    char = await characters_col().find_one({"user_id": user["_id"]})
    if char:
        await reset_streak_if_expired(char)

    _set_refresh_cookie(response, refresh_token)
    return {
        "user_id": user_id,
        "username": user["username"],
        "access_token": access_token,
    }


@router.post("/refresh")
async def refresh_token_endpoint(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")

    user_id = decode_token(token, token_type="refresh")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = await users_col().find_one({"_id": ObjectId(user_id), "is_active": True})
    if not user or not user.get("refresh_token_hash"):
        raise HTTPException(status_code=401, detail="Session invalidated")

    if not verify_password(token, user["refresh_token_hash"]):
        raise HTTPException(status_code=401, detail="Refresh token mismatch")

    # Rotate tokens
    new_access = create_access_token(user_id)
    new_refresh = create_refresh_token(user_id)
    new_rt_hash = hash_password(new_refresh)

    await users_col().update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"refresh_token_hash": new_rt_hash, "updated_at": datetime.now(timezone.utc)}},
    )

    _set_refresh_cookie(response, new_refresh)
    return {"access_token": new_access}


@router.post("/logout")
async def logout(response: Response, current_user: dict = Depends(get_current_user)):
    await users_col().update_one(
        {"_id": current_user["_id"]},
        {"$set": {"refresh_token_hash": None, "updated_at": datetime.now(timezone.utc)}},
    )
    response.delete_cookie("refresh_token", path="/api/auth/refresh")
    return {"message": "Logged out successfully"}


@router.patch("/password")
async def change_password(
    body: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    new_hash = hash_password(body.new_password)
    await users_col().update_one(
        {"_id": current_user["_id"]},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.now(timezone.utc)}},
    )
    return {"message": "Password updated successfully"}
