from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import bindparam, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter(prefix="/api/devices/{device_id}", tags=["history"])

SOLAR_DEVICE_IDS = ("solar_garden_room", "solar_loft")
SOLAR_METRIC_TO_DEVICE_ID = {
    "solar_garden_room_power": "solar_garden_room",
    "solar_loft_power": "solar_loft",
}


@router.get("/history/grouped")
async def get_history_grouped(
    device_id: str,
    start: datetime = Query(
        default_factory=lambda: datetime.now(timezone.utc) - timedelta(hours=24),
        description="Start time (ISO8601)",
    ),
    end: datetime = Query(
        default_factory=lambda: datetime.now(timezone.utc),
        description="End time (ISO8601)",
    ),
    metrics: str = Query(
        default="soc,battery_capacity,grid_power,house_power,battery_power,battery_voltage,grid_voltage,cell_temp_avg",
        description="Comma-separated metric names",
    ),
    resolution: str = Query(
        default="1m",
        description="Bucket resolution: 1m, 15m, 1h",
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Get historical measurement data from PostgreSQL.
    Returns downsampled grouped records (one per bucket) compatible with IndexedDB charts.
    Uses last-known value per metric within each bucket.
    """
    metric_list = [m.strip() for m in metrics.split(",") if m.strip()]
    if not metric_list:
        raise HTTPException(status_code=400, detail="metrics cannot be empty")

    if resolution == "1m":
        bucket_expr = "date_trunc('minute', public.measurements.timestamp)"
    elif resolution == "15m":
        bucket_expr = (
            "date_trunc('hour', public.measurements.timestamp) + "
            "(floor(extract(minute from public.measurements.timestamp) / 15) * interval '15 minutes')"
        )
    elif resolution == "1h":
        bucket_expr = "date_trunc('hour', public.measurements.timestamp)"
    else:
        raise HTTPException(status_code=400, detail="resolution must be one of: 1m, 15m, 1h")

    query = text(
        f"""
with filtered as (
  select
    {bucket_expr} as bucket_ts,
    public.measurements.metric_name,
    public.measurements.metric_value,
    public.measurements.timestamp
  from public.measurements
  where public.measurements.device_id = :device_id
    and public.measurements.metric_name in :metric_names
    and public.measurements.timestamp >= :start
    and public.measurements.timestamp <= :end
),
latest as (
  select distinct on (filtered.bucket_ts, filtered.metric_name)
    filtered.bucket_ts,
    filtered.metric_name,
    filtered.metric_value
  from filtered
  order by filtered.bucket_ts, filtered.metric_name, filtered.timestamp desc
)
select
  latest.bucket_ts,
  latest.metric_name,
  latest.metric_value
from latest
order by latest.bucket_ts asc;
"""
    ).bindparams(bindparam("metric_names", expanding=True))

    result = await db.execute(
        query,
        {
            "device_id": device_id,
            "metric_names": metric_list,
            "start": start,
            "end": end,
        },
    )

    solar_by_bucket: dict[str, float] = {}
    solar_garden_by_bucket: dict[str, float] = {}
    solar_loft_by_bucket: dict[str, float] = {}
    wants_solar_total = "solar_power" in metric_list
    wants_solar_breakdown = any(m in metric_list for m in SOLAR_METRIC_TO_DEVICE_ID)

    if wants_solar_total or wants_solar_breakdown:
        solar_query = text(
            f"""
with filtered as (
  select
    {bucket_expr} as bucket_ts,
    public.measurements.device_id,
    public.measurements.metric_value,
    public.measurements.timestamp
  from public.measurements
  where public.measurements.device_id in :solar_device_ids
    and public.measurements.metric_name = 'active_power'
    and public.measurements.timestamp >= :start
    and public.measurements.timestamp <= :end
),
latest as (
  select distinct on (filtered.bucket_ts, filtered.device_id)
    filtered.bucket_ts,
    filtered.device_id,
    filtered.metric_value
  from filtered
  order by filtered.bucket_ts, filtered.device_id, filtered.timestamp desc
)
select
  latest.bucket_ts,
  latest.device_id,
  greatest(latest.metric_value, 0) as solar_w
from latest
order by latest.bucket_ts asc;
"""
        ).bindparams(bindparam("solar_device_ids", expanding=True))

        solar_result = await db.execute(
            solar_query,
            {
                "solar_device_ids": SOLAR_DEVICE_IDS,
                "start": start,
                "end": end,
            },
        )

        for bucket_ts, solar_device_id, solar_w in solar_result.fetchall():
            key = bucket_ts.isoformat()
            watts = float(solar_w or 0)

            if solar_device_id == "solar_garden_room":
                solar_garden_by_bucket[key] = watts
            elif solar_device_id == "solar_loft":
                solar_loft_by_bucket[key] = watts

            if wants_solar_total:
                solar_by_bucket[key] = solar_garden_by_bucket.get(key, 0) + solar_loft_by_bucket.get(key, 0)

    # Build records (one per bucket)
    records: dict[str, dict] = {}
    for bucket_ts, metric_name, metric_value in result.fetchall():
        key = bucket_ts.isoformat()
        if key not in records:
            records[key] = {
                "timestamp": bucket_ts.isoformat(),
                "grid_power": None,
                "house_power": None,
                "battery_power": None,
                "solar_power": None,
                "solar_garden_room_power": None,
                "solar_loft_power": None,
                "aux_power": None,
                "battery_soc": None,
                "battery_usable": None,
                "battery_voltage": None,
                "grid_voltage": None,
                "cell_temp_avg": None,
            }

        if metric_name == "soc":
            records[key]["battery_soc"] = metric_value
        elif metric_name == "battery_capacity":
            records[key]["battery_usable"] = metric_value
        elif metric_name == "house_power":
            records[key]["house_power"] = metric_value
            records[key]["battery_power"] = metric_value
        elif metric_name in records[key]:
            records[key][metric_name] = metric_value

    if wants_solar_total or wants_solar_breakdown:
        for key, record in records.items():
            if wants_solar_total:
                record["solar_power"] = solar_by_bucket.get(key)
            if "solar_garden_room_power" in metric_list:
                record["solar_garden_room_power"] = solar_garden_by_bucket.get(key)
            if "solar_loft_power" in metric_list:
                record["solar_loft_power"] = solar_loft_by_bucket.get(key)

    if (wants_solar_total or wants_solar_breakdown) and not records:
        all_solar_keys = set(solar_by_bucket.keys()) | set(solar_garden_by_bucket.keys()) | set(solar_loft_by_bucket.keys())
        for key in all_solar_keys:
            records[key] = {
                "timestamp": key,
                "grid_power": None,
                "house_power": None,
                "battery_power": None,
                "solar_power": solar_by_bucket.get(key) if wants_solar_total else None,
                "solar_garden_room_power": solar_garden_by_bucket.get(key) if "solar_garden_room_power" in metric_list else None,
                "solar_loft_power": solar_loft_by_bucket.get(key) if "solar_loft_power" in metric_list else None,
                "aux_power": None,
                "battery_soc": None,
                "battery_usable": None,
                "battery_voltage": None,
                "grid_voltage": None,
                "cell_temp_avg": None,
            }

    return [records[key] for key in sorted(records.keys())]


@router.get("/history/summary")
async def get_daily_summary(
    device_id: str,
    date: datetime = Query(
        default_factory=lambda: datetime.now(timezone.utc).date(),
        description="Date for summary (YYYY-MM-DD)",
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get daily energy summary for a specific date."""
    start = datetime.combine(date, datetime.min.time()).replace(tzinfo=timezone.utc)
    end = start + timedelta(days=1)

    result = await db.execute(
        select(Measurement)
        .where(
            and_(
                Measurement.device_id == device_id,
                Measurement.metric_name.in_(["grid_power", "house_power"]),
                Measurement.timestamp >= start,
                Measurement.timestamp < end,
            )
        )
        .order_by(Measurement.timestamp)
    )
    measurements = result.scalars().all()

    grid_import_kwh = 0.0
    grid_export_kwh = 0.0
    battery_charge_kwh = 0.0
    battery_discharge_kwh = 0.0

    data_points = {}
    for m in measurements:
        ts = m.timestamp
        if ts not in data_points:
            data_points[ts] = {}
        data_points[ts][m.metric_name] = m.metric_value

    timestamps = sorted(data_points.keys())
    for i in range(len(timestamps) - 1):
        current_ts = timestamps[i]
        next_ts = timestamps[i + 1]
        interval_hours = (next_ts - current_ts).total_seconds() / 3600

        current = data_points[current_ts]
        grid_power = current.get("grid_power", 0)
        battery_power = current.get("house_power", 0)

        if grid_power > 0:
            grid_import_kwh += (grid_power / 1000) * interval_hours
        else:
            grid_export_kwh += abs(grid_power / 1000) * interval_hours

        if battery_power > 0:
            battery_charge_kwh += (battery_power / 1000) * interval_hours
        else:
            battery_discharge_kwh += abs(battery_power / 1000) * interval_hours

    return {
        "date": date.isoformat(),
        "grid_import_kwh": round(grid_import_kwh, 2),
        "grid_export_kwh": round(grid_export_kwh, 2),
        "battery_charge_kwh": round(battery_charge_kwh, 2),
        "battery_discharge_kwh": round(battery_discharge_kwh, 2),
    }
