from datetime import datetime

from sqlalchemy import String, DateTime, Boolean, ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Alarm(Base):
    """Current alarm state for a device.
    
    Stores the latest state of all alarm flags.
    """

    __tablename__ = "alarms"

    id: Mapped[int] = mapped_column(primary_key=True)
    device_id: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("devices.device_id"),
        index=True,
    )
    alarm_name: Mapped[str] = mapped_column(String(50), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        Index("ix_alarms_device_name", "device_id", "alarm_name", unique=True),
    )


class AlarmEvent(Base):
    """Historical alarm events.
    
    Records when alarms are triggered and cleared.
    """

    __tablename__ = "alarm_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    device_id: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("devices.device_id"),
        index=True,
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
    )
    alarm_name: Mapped[str] = mapped_column(String(50))
    event_type: Mapped[str] = mapped_column(String(20))  # 'triggered' or 'cleared'

    __table_args__ = (
        Index("ix_alarm_events_device_time", "device_id", "timestamp"),
    )
