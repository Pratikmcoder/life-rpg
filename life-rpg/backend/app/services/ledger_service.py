from datetime import datetime, timezone
from bson import ObjectId
from app.database import ledger_col


async def append_ledger(
    user_id: ObjectId,
    event_type: str,
    rune_delta: int = 0,
    echo_delta: int = 0,
    source_type: str = "system",
    source_id: ObjectId = None,
    metadata: dict = None,
    session=None,
):
    """Append an immutable ledger event. Never call update on ledger documents."""
    doc = {
        "user_id": user_id,
        "event_type": event_type,
        "rune_delta": rune_delta,
        "echo_delta": echo_delta,
        "source_type": source_type,
        "source_id": source_id,
        "metadata": metadata or {},
        "timestamp": datetime.now(timezone.utc),
    }
    await ledger_col().insert_one(doc, session=session)
