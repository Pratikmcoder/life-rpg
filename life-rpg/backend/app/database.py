import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings

_client: AsyncIOMotorClient = None


def get_client() -> AsyncIOMotorClient:
    return _client


async def connect_db():
    global _client
    settings = get_settings()
    
    # Configure TLS/SSL for MongoDB Atlas on Windows
    kwargs = {}
    if "mongodb+srv://" in settings.mongodb_uri or "ssl=true" in settings.mongodb_uri.lower() or "tls=true" in settings.mongodb_uri.lower() or ".mongodb.net" in settings.mongodb_uri:
        kwargs["tlsCAFile"] = certifi.where()
    
    try:
        _client = AsyncIOMotorClient(settings.mongodb_uri, **kwargs)
        # Ping to verify connection
        await _client.admin.command("ping")
        print(f"✅ Connected to MongoDB: {settings.mongodb_db_name}")
    except Exception as e:
        print(f"⚠️ Initial connection failed ({e}). Retrying with TLS fallback...")
        kwargs["tlsAllowInvalidCertificates"] = True
        _client = AsyncIOMotorClient(settings.mongodb_uri, **kwargs)
        await _client.admin.command("ping")
        print(f"✅ Connected to MongoDB (TLS fallback): {settings.mongodb_db_name}")


async def close_db():
    global _client
    if _client:
        _client.close()
        print("🔌 MongoDB connection closed")


def get_db():
    settings = get_settings()
    return _client[settings.mongodb_db_name]


# Collection accessors
def users_col():
    return get_db()["users"]

def characters_col():
    return get_db()["characters"]

def quests_col():
    return get_db()["quests"]

def quest_logs_col():
    return get_db()["quest_logs"]

def ledger_col():
    return get_db()["ledger"]

def items_col():
    return get_db()["items"]

def inventory_col():
    return get_db()["inventory"]

def equipped_items_col():
    return get_db()["equipped_items"]

def bosses_col():
    return get_db()["bosses"]

def boss_fight_logs_col():
    return get_db()["boss_fight_logs"]

def badges_col():
    return get_db()["badges"]

def user_badges_col():
    return get_db()["user_badges"]
