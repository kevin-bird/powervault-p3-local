from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal
import os
import logging
import json
from pathlib import Path

from app.services.server_collector import (
    start_server_collector,
    stop_server_collector,
    get_collector_status,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/settings", tags=["settings"])


class CollectionSettings(BaseModel):
    """Settings for data collection."""
    collection_mode: Literal["browser", "server"] = "browser"
    collection_interval_seconds: int = Field(default=5, ge=1, le=60)
    mqtt_host: str = "192.168.1.215"
    mqtt_port: int = 1883
    device_id: str = "PV001001DEV"


class AllSettings(BaseModel):
    """All application settings including .env fields."""
    # Collection
    collection_mode: Literal["browser", "server"] = "browser"
    collection_interval_seconds: int = Field(default=5, ge=1, le=60)
    
    # MQTT
    mqtt_host: str
    mqtt_port: int
    device_id: str
    
    # Database (some read-only)
    postgres_user: str
    postgres_db: str
    
    # API (read-only, requires restart)
    api_host: str
    api_port: int
    
    # Frontend (read-only)
    vite_api_url: str
    vite_ws_url: str


_settings_file = Path(os.getenv("SETTINGS_FILE", "/app/runtime_settings.json"))
if _settings_file.exists():
    _current_settings = CollectionSettings.model_validate_json(_settings_file.read_text(encoding="utf-8"))
else:
    _current_settings = CollectionSettings()


@router.get("/collection", response_model=CollectionSettings)
async def get_collection_settings():
    """Get current collection settings."""
    return _current_settings


@router.put("/collection", response_model=CollectionSettings)
async def update_collection_settings(settings: CollectionSettings):
    """Update collection settings and start/stop collector as needed."""
    global _current_settings
    
    old_mode = _current_settings.collection_mode
    old_interval = _current_settings.collection_interval_seconds
    _current_settings = settings
    _settings_file.write_text(json.dumps(_current_settings.model_dump()), encoding="utf-8")
    
    # Handle mode change
    if settings.collection_mode == "server" and old_mode != "server":
        # Start server collector
        logger.info(f"Switching to server mode")
        await start_server_collector(
            settings.mqtt_host, 
            settings.device_id, 
            settings.mqtt_port,
            settings.collection_interval_seconds
        )
    elif settings.collection_mode == "browser" and old_mode == "server":
        # Stop server collector
        logger.info(f"Switching to browser mode")
        await stop_server_collector()
    elif settings.collection_mode == "server" and old_interval != settings.collection_interval_seconds:
        # Interval changed - restart collector
        logger.info(f"Collection interval changed to {settings.collection_interval_seconds}s")
        await stop_server_collector()
        await start_server_collector(
            settings.mqtt_host,
            settings.device_id,
            settings.mqtt_port,
            settings.collection_interval_seconds
        )
    
    return _current_settings


@router.get("/status")
async def get_collection_status():
    """Get current collection status."""
    status = get_collector_status()
    return {
        **status,
        "mode": _current_settings.collection_mode,
    }


@router.get("", response_model=AllSettings)
async def get_all_settings():
    """Get all application settings including .env values."""
    return AllSettings(
        # Collection settings
        collection_mode=_current_settings.collection_mode,
        collection_interval_seconds=_current_settings.collection_interval_seconds,
        
        # MQTT
        mqtt_host=_current_settings.mqtt_host,
        mqtt_port=_current_settings.mqtt_port,
        device_id=_current_settings.device_id,
        
        # Database
        postgres_user=os.getenv("POSTGRES_USER", "pv3monitor"),
        postgres_db=os.getenv("POSTGRES_DB", "pv3monitor"),
        
        # API
        api_host=os.getenv("API_HOST", "0.0.0.0"),
        api_port=int(os.getenv("API_PORT", "8800")),
        
        # Frontend
        vite_api_url=os.getenv("VITE_API_URL", "http://192.168.1.6:8800"),
        vite_ws_url=os.getenv("VITE_WS_URL", "ws://192.168.1.6:8800"),
    )


@router.put("", response_model=AllSettings)
async def update_all_settings(settings: AllSettings):
    """Update all settings (only collection settings are mutable at runtime)."""
    global _current_settings
    
    # Update collection settings
    collection = CollectionSettings(
        collection_mode=settings.collection_mode,
        collection_interval_seconds=settings.collection_interval_seconds,
        mqtt_host=settings.mqtt_host,
        mqtt_port=settings.mqtt_port,
        device_id=settings.device_id,
    )
    
    await update_collection_settings(collection)
    
    # Note: Other settings require .env file changes and restart
    # Return current state
    return await get_all_settings()

