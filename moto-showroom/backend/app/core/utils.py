"""Small shared helpers (dates, slugs, phone normalisation, pagination)."""
import math
import re
from datetime import date, datetime, timezone

PK_MOBILE_RE = re.compile(r"^(?:\+92|0092|0)?(3\d{9})$")


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def today() -> date:
    return date.today()


def today_iso() -> str:
    return date.today().isoformat()


def parse_date(value) -> date | None:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return date.fromisoformat(str(value)[:10])


def slugify(text: str) -> str:
    text = re.sub(r"[^a-zA-Z0-9]+", "-", str(text).strip().lower())
    return text.strip("-") or "item"


def normalize_phone(phone: str) -> str | None:
    """Return a Pakistani mobile number as 03XXXXXXXXX, or None if invalid."""
    cleaned = re.sub(r"[\s\-()]", "", phone or "")
    match = PK_MOBILE_RE.match(cleaned)
    if not match:
        return None
    return "0" + match.group(1)


def format_phone(phone: str) -> str:
    p = normalize_phone(phone) or phone
    return f"{p[:4]}-{p[4:]}" if len(p) == 11 else p


def paginate(items: list, page: int = 1, page_size: int = 12, max_size: int = 100):
    page_size = max(1, min(int(page_size or 12), max_size))
    total = len(items)
    pages = max(1, math.ceil(total / page_size))
    page = max(1, min(int(page or 1), pages))
    start = (page - 1) * page_size
    meta = {"page": page, "page_size": page_size, "total": total, "pages": pages}
    return items[start:start + page_size], meta


def text_match(record: dict, query: str, fields) -> bool:
    if not query:
        return True
    q = query.strip().lower()
    for f in fields:
        value = record.get(f)
        if value is None:
            continue
        if isinstance(value, (list, tuple)):
            value = " ".join(map(str, value))
        if q in str(value).lower():
            return True
    return False


def sort_records(items: list, sort: str | None, default: str | None = None) -> list:
    """Sort by `field` or `-field` (descending). None values go last."""
    key = sort or default
    if not key:
        return items
    reverse = key.startswith("-")
    field = key.lstrip("-")

    def k(r):
        v = r.get(field)
        if isinstance(v, str):
            v = v.lower()
        return (v is None, v if v is not None else 0)

    if reverse:
        # newest-inserted first on ties (keeps "latest" lists intuitive)
        items = list(reversed(items))
    present = [r for r in items if r.get(field) is not None]
    missing = [r for r in items if r.get(field) is None]
    present.sort(key=k, reverse=reverse)
    return present + missing


def month_key(d) -> str:
    d = parse_date(d)
    return f"{d.year}-{d.month:02d}"


def month_range(start: date, end: date) -> list[str]:
    out = []
    y, m = start.year, start.month
    while (y, m) <= (end.year, end.month):
        out.append(f"{y}-{m:02d}")
        m += 1
        if m > 12:
            y, m = y + 1, 1
    return out
