import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import (
    devices_router,
    measurements_router,
    alarms_router,
    websocket_router,
)
from app.services.mqtt_client import mqtt_service, setup_mqtt_handlers

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown."""
    # Startup
    logger.info("Starting PV3 Monitor API")

    # Initialize database
    await init_db()
    logger.info("Database initialized")

    # Setup MQTT handlers and connect
    setup_mqtt_handlers()
    mqtt_service.set_event_loop(asyncio.get_event_loop())
    mqtt_service.connect()
    logger.info("MQTT client connected")

    yield

    # Shutdown
    logger.info("Shutting down PV3 Monitor API")
    mqtt_service.disconnect()


app = FastAPI(
    title="PV3 Monitor API",
    description="API for monitoring Powervault P3 battery systems",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://192.168.1.6:5173",
        "http://energy:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(devices_router)
app.include_router(measurements_router)
app.include_router(alarms_router)
app.include_router(websocket_router)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "PV3 Monitor API",
        "version": "0.1.0",
        "status": "running",
        "mqtt_connected": mqtt_service.connected,
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "mqtt_connected": mqtt_service.connected,
    }
