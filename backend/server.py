"""
DealLakay Alert — companion backend.

IMPORTANT SCOPE NOTE
--------------------
This backend intentionally does NOT store demands, users, or marketplace data.
The DealLakay Alert mobile app keeps demands/auth on-device (mock service layer)
and is architected to connect to the real DealLakay API later.

The ONLY responsibility of this service is to act as a secure relay for push
notifications (Emergent managed push service). The device push token and the
push key never live on the frontend.
"""
from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ---------------------------------------------------------------------------
# Push relay (Emergent managed push service)
# ---------------------------------------------------------------------------
PUSH_BASE_URL = "https://integrations.emergentagent.com"
# NOTE: value is set automatically by the Emergent deployment pipeline.
# Never edit / mint / rotate this manually.
PUSH_KEY = os.environ.get("EMERGENT_PUSH_KEY", "placeholder")

_push_client = httpx.AsyncClient(
    base_url=PUSH_BASE_URL,
    headers={"X-Push-Key": PUSH_KEY},
    timeout=10.0,
)

app = FastAPI(title="DealLakay Alert API")
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"service": "deallakay-alert", "status": "ok"}


@api_router.get("/health")
async def health():
    return {"status": "healthy"}


# --- Push notifications --------------------------------------------------
class RegisterPushBody(BaseModel):
    user_id: str
    platform: str  # "android" | "ios"
    device_token: str


@api_router.post("/register-push", status_code=201)
async def register_push(body: RegisterPushBody):
    resp = await _push_client.post("/api/v1/push/users/register", json=body.model_dump())
    if resp.status_code == 401:
        raise HTTPException(500, "EMERGENT_PUSH_KEY missing or invalid")
    if resp.status_code >= 500:
        raise HTTPException(502, "Push provider unavailable")
    resp.raise_for_status()
    return {"status": "registered"}


async def send_push(recipients: list[str], data: dict, idempotency_key: str | None = None) -> None:
    """Relay a push notification to the Emergent managed push service.

    Call this from event handlers where the recipient is likely offline
    (e.g. a vendor responded to a demand, a demand expired). Always wrap the
    call in try/except so a push failure never blocks the primary operation.
    """
    if not recipients:
        return
    if len(recipients) > 100:
        raise ValueError("max 100 recipients per /trigger call; chunk before sending")
    if "title" not in data or "message" not in data:
        raise ValueError("data must include title and message")
    payload: dict = {"recipients": recipients, "data": data}
    if idempotency_key:
        payload["$idempotency_key"] = idempotency_key
    resp = await _push_client.post("/api/v1/push/trigger", json=payload)
    if resp.status_code == 401:
        raise HTTPException(500, "EMERGENT_PUSH_KEY missing or invalid")
    if resp.status_code >= 500:
        raise HTTPException(502, "Push provider unavailable")
    resp.raise_for_status()


class TestPushBody(BaseModel):
    user_id: str
    title: str = "DealLakay Alert"
    message: str = "Test notification"


@api_router.post("/send-test-push")
async def send_test_push(body: TestPushBody):
    """Convenience endpoint to verify push delivery end-to-end after a build."""
    try:
        await send_push(
            recipients=[body.user_id],
            data={"title": body.title, "message": body.message, "action_url": "/alerts"},
        )
    except Exception as e:  # noqa: BLE001 - never crash caller
        logger.warning(f"Test push failed (non-blocking): {e}")
        return {"status": "error", "detail": str(e)}
    return {"status": "sent"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_push_client():
    await _push_client.aclose()
