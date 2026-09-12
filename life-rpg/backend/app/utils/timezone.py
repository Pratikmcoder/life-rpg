from datetime import date, datetime, timezone
import pytz


def get_user_today(tz_str: str) -> str:
    """Return today's date string YYYY-MM-DD in user's timezone."""
    try:
        tz = pytz.timezone(tz_str)
    except Exception:
        tz = pytz.utc
    return datetime.now(tz).strftime("%Y-%m-%d")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)
