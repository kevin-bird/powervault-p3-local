from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.measurement import Measurement
from app.models.device import Device
from app.schemas.measurement import MeasurementResponse, CurrentMeasurements, MeasurementCreate
from app.routers.websocket import broadcast_measurement_update

router = APIRouter(prefix="/api/devices/{device_id}", tags=["measurements"])

SOLAR_DEVICE_IDS = ("solar_garden_room", "solar_loft")


@router.get("/current", response_model=CurrentMeasurements)
async def get_current_measurements(
    device_id: str,
    db: AsyncSession = Depends(get_db),
) -> CurrentMeasurements:
    """Get latest values for all metrics for a device."""
    # Get the most recent measurement for each metric
    subquery = (
        select(
            Measurement.metric_name,
            func.max(Measurement.timestamp).label("max_ts"),
        )
        .where(Measurement.device_id == device_id)
        .group_by(Measurement.metric_name)
        .subquery()
    )

    result = await db.execute(
        select(Measurement)
        .join(
            subquery,
            (Measurement.metric_name == subquery.c.metric_name)
            & (Measurement.timestamp == subquery.c.max_ts),
        )
        .where(Measurement.device_id == device_id)
    )
    measurements = result.scalars().all()

    if not measurements:
        raise HTTPException(status_code=404, detail="No measurements found")

    # Build response from latest measurements
    current = CurrentMeasurements(
        device_id=device_id,
        timestamp=max(m.timestamp for m in measurements),
    )

    # Map metric names to response fields (direct mapping)
    for m in measurements:
        if hasattr(current, m.metric_name):
            setattr(current, m.metric_name, m.metric_value)

    # Include Enphase solar breakdown (Garden Room + Loft) when requesting the main PV device.
    if device_id == "PV001001DEV":
        solar_subquery = (
            select(
                Measurement.device_id,
                func.max(Measurement.timestamp).label("max_ts"),
            )
            .where(Measurement.device_id.in_(SOLAR_DEVICE_IDS))
            .where(Measurement.metric_name == "active_power")
            .group_by(Measurement.device_id)
            .subquery()
        )

        solar_result = await db.execute(
            select(Measurement.device_id, Measurement.metric_value)
            .join(
                solar_subquery,
                (Measurement.device_id == solar_subquery.c.device_id)
                & (Measurement.timestamp == solar_subquery.c.max_ts),
            )
            .where(Measurement.metric_name == "active_power")
        )

        garden_room_w = 0.0
        loft_w = 0.0
        for solar_device_id, value in solar_result.fetchall():
            watts = float(value)
            watts_clamped = watts if watts > 0 else 0.0
            if solar_device_id == "solar_garden_room":
                garden_room_w = watts_clamped
            elif solar_device_id == "solar_loft":
                loft_w = watts_clamped

        current.solar_garden_room_power = garden_room_w
        current.solar_loft_power = loft_w
        current.solar_power = garden_room_w + loft_w

    return current


@router.get("/metrics/{metric}", response_model=MeasurementResponse | None)
async def get_metric(
    device_id: str,
    metric: str,
    db: AsyncSession = Depends(get_db),
) -> Measurement | None:
    """Get the current value of a specific metric."""
    result = await db.execute(
        select(Measurement)
        .where(Measurement.device_id == device_id)
        .where(Measurement.metric_name == metric)
        .order_by(desc(Measurement.timestamp))
        .limit(1)
    )
    measurement = result.scalar_one_or_none()
    if not measurement:
        raise HTTPException(status_code=404, detail="Metric not found")
    return measurement


@router.get("/history", response_model=list[MeasurementResponse])
async def get_history(
    device_id: str,
    metrics: str = Query(..., description="Comma-separated metric names"),
    start: datetime = Query(
        default_factory=lambda: datetime.now(timezone.utc) - timedelta(hours=24),
        description="Start time",
    ),
    end: datetime = Query(
        default_factory=lambda: datetime.now(timezone.utc),
        description="End time",
    ),
    db: AsyncSession = Depends(get_db),
) -> list[Measurement]:
    """Get historical measurements for specified metrics."""
    metric_list = [m.strip() for m in metrics.split(",")]

    result = await db.execute(
        select(Measurement)
        .where(Measurement.device_id == device_id)
        .where(Measurement.metric_name.in_(metric_list))
        .where(Measurement.timestamp >= start)
        .where(Measurement.timestamp <= end)
        .order_by(Measurement.timestamp)
    )
    return list(result.scalars().all())


@router.post("/measurements", response_model=MeasurementResponse, status_code=201)
async def create_measurement(
    device_id: str,
    measurement_data: MeasurementCreate,
    db: AsyncSession = Depends(get_db),
) -> Measurement:
    """Store a single measurement."""
    # Ensure device exists or create it
    result = await db.execute(
        select(Device).where(Device.device_id == device_id)
    )
    device = result.scalar_one_or_none()
    if not device:
        device = Device(device_id=device_id)
        db.add(device)
        await db.commit()

    # Create measurement
    measurement = Measurement(
        device_id=device_id,
        timestamp=measurement_data.timestamp or datetime.now(timezone.utc),
        metric_name=measurement_data.metric_name,
        metric_value=measurement_data.metric_value,
        unit=measurement_data.unit,
        source_topic=measurement_data.source_topic,
    )
    db.add(measurement)
    await db.commit()
    await db.refresh(measurement)

    # Broadcast to WebSocket clients
    await broadcast_measurement_update(
        device_id,
        {
            measurement_data.metric_name: measurement_data.metric_value,
            "timestamp": measurement.timestamp.isoformat(),
        },
    )

    return measurement


@router.post("/measurements/batch", status_code=201)
async def create_measurements_batch(
    device_id: str,
    measurements_data: list[MeasurementCreate],
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Store multiple measurements in a batch."""
    # Ensure device exists or create it
    result = await db.execute(
        select(Device).where(Device.device_id == device_id)
    )
    device = result.scalar_one_or_none()
    if not device:
        device = Device(device_id=device_id)
        db.add(device)
        await db.commit()

    # Create measurements
    measurements = []
    broadcast_data = {"timestamp": datetime.now(timezone.utc).isoformat()}
    
    for measurement_data in measurements_data:
        measurement = Measurement(
            device_id=device_id,
            timestamp=measurement_data.timestamp or datetime.now(timezone.utc),
            metric_name=measurement_data.metric_name,
            metric_value=measurement_data.metric_value,
            unit=measurement_data.unit,
            source_topic=measurement_data.source_topic,
        )
        measurements.append(measurement)
        broadcast_data[measurement_data.metric_name] = measurement_data.metric_value

    db.add_all(measurements)
    await db.commit()

    # Broadcast to WebSocket clients
    await broadcast_measurement_update(device_id, broadcast_data)

    return {"created": len(measurements), "device_id": device_id}

