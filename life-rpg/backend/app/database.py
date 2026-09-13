import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings

_client: AsyncIOMotorClient = None


def get_client() -> AsyncIOMotorClient:
    return _client


async def connect_db():
    global _client
    settings = get_settings()
    
    uri = settings.mongodb_uri
    kwargs = {}
    
    # Only use TLS/certifi for MongoDB Atlas connections
    is_atlas = "mongodb+srv://" in uri or ".mongodb.net" in uri
    if is_atlas:
        try:
            import certifi
            kwargs["tlsCAFile"] = certifi.where()
        except ImportError:
            pass  # certifi not available, let driver handle TLS
    
    try:
        _client = AsyncIOMotorClient(uri, **kwargs)
        # Ping to verify connection
        await _client.admin.command("ping")
        print(f"✅ Connected to MongoDB: {settings.mongodb_db_name}")
    except Exception as e:
        if is_atlas:
            print(f"⚠️ Initial connection failed ({e}). Retrying with TLS fallback...")
            kwargs["tlsAllowInvalidCertificates"] = True
            _client = AsyncIOMotorClient(uri, **kwargs)
            await _client.admin.command("ping")
            print(f"✅ Connected to MongoDB (TLS fallback): {settings.mongodb_db_name}")
        else:
            raise


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
