from app.routers.devices import router as devices_router
from app.routers.measurements import router as measurements_router
from app.routers.alarms import router as alarms_router
from app.routers.websocket import router as websocket_router

__all__ = [
    "devices_router",
    "measurements_router",
    "alarms_router",
    "websocket_router",
]
