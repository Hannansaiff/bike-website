"""Administrative activity log (demo – in memory, not tamper-proof)."""
from app.core.utils import now_iso, paginate, sort_records, text_match
from app.repositories.base import activity_repo

DEFAULT_ACTOR = "Demo Admin"


def log(action: str, entity: str, entity_id, description: str, actor: str | None = None) -> dict:
    return activity_repo.add({
        "action": action,
        "entity": entity,
        "entity_id": entity_id,
        "description": description,
        "actor": actor or DEFAULT_ACTOR,
        "timestamp": now_iso(),
    })


def list_logs(q=None, entity=None, action=None, page=1, page_size=25):
    rows = activity_repo.all()
    rows = [r for r in rows if text_match(r, q, ["description", "actor", "entity"])]
    if entity:
        rows = [r for r in rows if r["entity"] == entity]
    if action:
        rows = [r for r in rows if r["action"] == action]
    rows = sort_records(rows, "-timestamp")
    return paginate(rows, page, page_size)


def recent(limit=8):
    return sort_records(activity_repo.all(), "-timestamp")[:limit]
