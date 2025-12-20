from datetime import datetime

from sqlalchemy import String, DateTime, Float, ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Measurement(Base):
    """Time-series measurement data from P3 devices.
    
    This table stores all sensor readings from the P3.
    For TimescaleDB, this should be converted to a hypertable.
    """

    __tablename__ = "measurements"

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
    metric_name: Mapped[str] = mapped_column(String(100), index=True)
    metric_value: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(20), nullable=True)
    source_topic: Mapped[str] = mapped_column(String(100), nullable=True)

    __table_args__ = (
        Index("ix_measurements_device_time", "device_id", "timestamp"),
        Index("ix_measurements_device_metric", "device_id", "metric_name"),
    )
