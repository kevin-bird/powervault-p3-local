from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.alarm import Alarm, AlarmEvent
from app.models.device import Device
from app.schemas.alarm import AlarmResponse, AlarmEventResponse, AlarmStatus
from app.routers.websocket import broadcast_alarm_update

router = APIRouter(prefix="/api/devices/{device_id}/alarms", tags=["alarms"])


@router.get("", response_model=AlarmStatus)
async def get_alarm_status(
    device_id: str,
    db: AsyncSession = Depends(get_db),
) -> AlarmStatus:
    """Get current alarm status for a device."""
    result = await db.execute(
        select(Alarm).where(Alarm.device_id == device_id)
    )
    alarms = result.scalars().all()

    if not alarms:
        raise HTTPException(status_code=404, detail="No alarm data found")

    active_alarms = [a.alarm_name for a in alarms if a.is_active]
    all_alarms = {a.alarm_name: a.is_active for a in alarms}
    latest_update = max(a.updated_at for a in alarms)

    return AlarmStatus(
        device_id=device_id,
        active_count=len(active_alarms),
        active_alarms=active_alarms,
        all_alarms=all_alarms,
        updated_at=latest_update,
    )


@router.get("/history", response_model=list[AlarmEventResponse])
async def get_alarm_history(
    device_id: str,
    start: datetime = Query(
        default_factory=lambda: datetime.now(timezone.utc) - timedelta(days=7),
        description="Start time",
    ),
    end: datetime = Query(
        default_factory=lambda: datetime.now(timezone.utc),
        description="End time",
    ),
    db: AsyncSession = Depends(get_db),
) -> list[AlarmEvent]:
    """Get alarm event history for a device."""
    result = await db.execute(
        select(AlarmEvent)
        .where(AlarmEvent.device_id == device_id)
        .where(AlarmEvent.timestamp >= start)
        .where(AlarmEvent.timestamp <= end)
        .order_by(AlarmEvent.timestamp.desc())
    )
    return list(result.scalars().all())


@router.get("/{alarm_name}", response_model=AlarmResponse)
async def get_alarm(
    device_id: str,
    alarm_name: str,
    db: AsyncSession = Depends(get_db),
) -> Alarm:
    """Get specific alarm status."""
    result = await db.execute(
        select(Alarm)
        .where(Alarm.device_id == device_id)
        .where(Alarm.alarm_name == alarm_name)
    )
    alarm = result.scalar_one_or_none()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    return alarm


@router.post("", status_code=201)
async def update_alarms(
    device_id: str,
    alarm_states: dict[str, bool],
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Update alarm states for a device."""
    # Ensure device exists or create it
    result = await db.execute(
        select(Device).where(Device.device_id == device_id)
    )
    device = result.scalar_one_or_none()
    if not device:
        device = Device(device_id=device_id)
        db.add(device)
        await db.commit()

    updated_count = 0
    events_created = 0

    for alarm_name, is_active in alarm_states.items():
        # Get existing alarm state
        result = await db.execute(
            select(Alarm)
            .where(Alarm.device_id == device_id)
            .where(Alarm.alarm_name == alarm_name)
        )
        alarm = result.scalar_one_or_none()

        if alarm:
            # Check if state changed
            if alarm.is_active != is_active:
                alarm.is_active = is_active
                updated_count += 1

                # Create alarm event
                event = AlarmEvent(
                    device_id=device_id,
                    alarm_name=alarm_name,
                    event_type="triggered" if is_active else "cleared",
                )
                db.add(event)
                events_created += 1

                # Broadcast to WebSocket clients
                await broadcast_alarm_update(device_id, alarm_name, is_active)
        else:
            # Create new alarm
            alarm = Alarm(
                device_id=device_id,
                alarm_name=alarm_name,
                is_active=is_active,
            )
            db.add(alarm)
            updated_count += 1

            # Create initial event if active
            if is_active:
                event = AlarmEvent(
                    device_id=device_id,
                    alarm_name=alarm_name,
                    event_type="triggered",
                )
                db.add(event)
                events_created += 1

                # Broadcast to WebSocket clients
                await broadcast_alarm_update(device_id, alarm_name, is_active)

    await db.commit()

    return {
        "device_id": device_id,
        "alarms_updated": updated_count,
        "events_created": events_created,
    }

