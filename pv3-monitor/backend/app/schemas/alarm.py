from datetime import datetime

from pydantic import BaseModel


class AlarmResponse(BaseModel):
    """Schema for alarm response."""

    id: int
    device_id: str
    alarm_name: str
    is_active: bool
    updated_at: datetime

    class Config:
        from_attributes = True


class AlarmEventResponse(BaseModel):
    """Schema for alarm event response."""

    id: int
    device_id: str
    timestamp: datetime
    alarm_name: str
    event_type: str

    class Config:
        from_attributes = True


class AlarmStatus(BaseModel):
    """Schema for current alarm status overview."""

    device_id: str
    active_count: int
    active_alarms: list[str]
    all_alarms: dict[str, bool]
    updated_at: datetime
