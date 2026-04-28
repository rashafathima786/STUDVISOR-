from fastapi import APIRouter
from backend.api.routes.auth import router as auth_router
from backend.api.routes.ai_engine import router as ai_engine_router
from backend.api.routes.search import router as search_router
from backend.api.routes.extended_routes import websocket_router, chat_stream_router
from backend.api.routes.features import analytics_router
from backend.api.routes.misc_routes import bunk_alerts_router

router = APIRouter(tags=["Core Domain"]) # No prefix for core auth usually, but can be /api/core

router.include_router(auth_router, prefix="/auth", tags=["Auth"])
router.include_router(ai_engine_router, prefix="/ai", tags=["AI Engine"])
router.include_router(search_router, prefix="/search", tags=["Search"])
router.include_router(websocket_router, prefix="/ws", tags=["Websockets"])
router.include_router(chat_stream_router, prefix="/stream", tags=["Streaming"])
router.include_router(analytics_router, prefix="/system-analytics", tags=["System Analytics"])
router.include_router(bunk_alerts_router, prefix="/alerts", tags=["Bunk Alerts"])
