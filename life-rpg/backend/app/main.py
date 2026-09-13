from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database import connect_db, close_db
from app.seed.seed_db import init_indexes, seed_static_catalogs

from app.routers import (
    auth,
    character,
    quests,
    shop,
    inventory,
    bosses,
    badges,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    settings = get_settings()
    print(f"🌟 Starting Life RPG Backend [{settings.environment}]")
    try:
        await connect_db()
        await init_indexes()
        await seed_static_catalogs()
    except Exception as e:
        print(f"⚠️ Database connection/seeding during startup failed (will retry on requests if DB becomes available): {e}")
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title="Life RPG API",
    description="Backend API for Life RPG dark-fantasy gamified productivity web app",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()

# Allowed origins
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://liferpg-web.up.railway.app"
]
if settings.allowed_origins:
    for orig in settings.allowed_origins.split(","):
        orig_clean = orig.strip()
        if orig_clean and orig_clean not in origins:
            origins.append(orig_clean)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "life-rpg-api",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": settings.environment,
    }


# Include all feature routers
app.include_router(auth.router)
app.include_router(character.router)
app.include_router(quests.router)
app.include_router(shop.router)
app.include_router(inventory.router)
app.include_router(bosses.router)
app.include_router(badges.router)
