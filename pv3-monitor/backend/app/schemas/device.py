from datetime import datetime

from pydantic import BaseModel


class DeviceCreate(BaseModel):
    """Schema for creating a new device."""

    device_id: str
    name: str | None = None
    capacity_kwh: float | None = None


class DeviceUpdate(BaseModel):
    """Schema for updating a device."""

    name: str | None = None
    capacity_kwh: float | None = None


class DeviceResponse(BaseModel):
    """Schema for device response."""

    id: int
    device_id: str
    name: str | None
    capacity_kwh: float | None
    created_at: datetime
    last_seen_at: datetime

    class Config:
        from_attributes = True
