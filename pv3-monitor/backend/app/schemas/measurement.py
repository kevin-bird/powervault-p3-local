from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class MeasurementCreate(BaseModel):
    """Schema for creating a measurement."""

    timestamp: datetime | None = None
    metric_name: str
    metric_value: float
    unit: str | None = None
    source_topic: str | None = None


class MeasurementResponse(BaseModel):
    """Schema for measurement response."""

    id: int
    device_id: str
    timestamp: datetime
    metric_name: str
    metric_value: float
    unit: str | None
    source_topic: str | None

    class Config:
        from_attributes = True


class MeasurementHistoryQuery(BaseModel):
    """Schema for querying measurement history."""

    metrics: list[str]
    start: datetime
    end: datetime
    resolution: Literal["raw", "1m", "5m", "15m", "1h"] = "1m"


class CurrentMeasurements(BaseModel):
    """Schema for current measurement values."""

    device_id: str
    timestamp: datetime
    
    # Battery State
    soc: float | None = None
    battery_voltage: float | None = None
    battery_current: float | None = None
    battery_current_total: float | None = None
    battery_capacity: float | None = None
    battery_power: float | None = None
    
    # Battery Health
    soh: float | None = None
    soh_min: float | None = None
    cycle_count_avg: float | None = None
    cycle_count_max: float | None = None
    cell_voltage_max: float | None = None
    cell_voltage_min: float | None = None
    module_voltage_avg: float | None = None
    
    # Temperatures
    cell_temp_avg: float | None = None
    cell_temp_max: float | None = None
    cell_temp_min: float | None = None
    bms_temp_avg: float | None = None
    bms_temp_max: float | None = None
    inverter_temp: float | None = None
    boost_temp: float | None = None
    inner_temp: float | None = None
    
    # Power Flow
    grid_power: float | None = None
    house_power: float | None = None
    solar_power: float | None = None
    aux_power: float | None = None
    solar_garden_room_power: float | None = None
    solar_loft_power: float | None = None
    
    # Grid
    grid_voltage: float | None = None
    grid_frequency: float | None = None
    
    # Limits
    max_charge_power: float | None = None
    max_discharge_power: float | None = None
    charge_voltage_limit: float | None = None
    discharge_voltage_limit: float | None = None
    charge_current_limit: float | None = None
    discharge_current_limit: float | None = None
    
    # Schedule
    schedule_event: int | None = None
    schedule_setpoint: float | None = None
    
    # EPS
    eps_reserve: float | None = None
    eps_mode: float | None = None
