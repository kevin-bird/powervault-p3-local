# PV3 Monitor - MQTT to Dashboard Mapping

Current data snapshot: 2025-12-20 06:22:50 UTC

## Power Flow Display

| Dashboard Label | Database Metric | Current Value | MQTT Source | Notes |
|----------------|-----------------|---------------|-------------|-------|
| **Grid Power** | `grid_power` | -406.464 W | `ffr/measurements` LOCAL Power Active | ✓ Correct (negative = exporting) |
| Grid Voltage | `grid_voltage` | 225.8 V | `inverter/measurements` GRID Voltage Ac | ✓ Correct |
| Grid State | - | "Exporting" | Calculated from grid_power | ✓ Correct |
| **House Power** | `house_power` | 11.736 W | `ffr/measurements` HOUSE Power Active | ✓ Correct |
| **Battery SoC** | `soc` | 97.0% | `bms/soc` StateOfCharge | ✓ Correct |
| Battery Voltage | `battery_voltage` | 49.8 V | `inverter/measurements` BATTERY Voltage | ✓ Correct |
| Battery State | - | "Discharging" | Calculated from battery_power | ✓ Correct (591W positive = discharging) |
| **Solar Power** | `solar_power` | null | - | Not available (no solar panels) |
| Schedule | `schedule_event` | 0.0 | `schedule/event` event | ✓ Correct (0 = Idle) |
| Health | `soh` | 92% | `pylontech/info` StateOfHealth Avg | ✓ Correct |

## Battery Status Section

| Dashboard Label | Database Metric | Current Value | MQTT Source | Notes |
|----------------|-----------------|---------------|-------------|-------|
| Current | `battery_current` | 0.0 A | `inverter/measurements` BATTERY ChargeCurrent | ⚠️ Shows 0A but battery_current_total = -10.23A |
| Current (Total) | `battery_current_total` | -10.23 A | `pylontech/info` Current Total | ✓ More accurate, should use this |
| Usable Capacity | `battery_capacity` | 77% | `inverter/measurements` BATTERY Capacity | ✓ Correct |
| Max Charge Power | `max_charge_power` | null | `m4/maxpower` ChgPower | ❌ Not being collected |
| Max Discharge Power | `max_discharge_power` | null | `m4/maxpower` DchgPower | ❌ Not being collected |

## Battery Health Section

| Dashboard Label | Database Metric | Current Value | MQTT Source | Notes |
|----------------|-----------------|---------------|-------------|-------|
| State of Health | `soh` | 92% | `pylontech/info` StateOfHealth Avg | ✓ Correct |
| SOH Min | `soh_min` | 92% | `pylontech/info` StateOfHealth Min | ✓ Correct |
| Cycles (Avg) | `cycle_count_avg` | 844 | `pylontech/info` CycleNumber Avg | ✓ Correct |
| Cycles (Max) | `cycle_count_max` | 877 | `pylontech/info` CycleNumber Max | ✓ Correct |
| Cell Voltage Max | `cell_voltage_max` | 3,317 mV | `pylontech/info` CellVoltage Max | ✓ Correct |
| Cell Voltage Min | `cell_voltage_min` | 3,315 mV | `pylontech/info` CellVoltage Min | ✓ Correct |
| Voltage Spread | - | 2 mV | Calculated (max - min) | ✓ Correct |
| Module Voltage | `module_voltage_avg` | 49.746 V | `pylontech/info` ModuleVoltage Avg | ✓ Correct |

## Temperature Section

| Dashboard Label | Database Metric | Current Value | MQTT Source | Notes |
|----------------|-----------------|---------------|-------------|-------|
| Cell Temp Avg | `cell_temp_avg` | 20.1°C | `pylontech/info` CellTemperature Avg | ✓ Correct |
| Cell Temp Max | `cell_temp_max` | 20.9°C | `pylontech/info` CellTemperature Max | ✓ Correct |
| Cell Temp Min | `cell_temp_min` | 19.4°C | `pylontech/info` CellTemperature Min | ✓ Correct |
| BMS Temp | `bms_temp_avg` | 20.3°C | `pylontech/info` BMSTemperature Avg | ✓ Correct |
| BMS Temp Max | `bms_temp_max` | 20.8°C | `pylontech/info` BMSTemperature Max | ✓ Correct |
| Inverter Temp | `inverter_temp` | null | `inverter/alarms` inverter_temperature | ❌ Topic not publishing |
| Boost Temp | `boost_temp` | null | `inverter/alarms` boost_temperature | ❌ Topic not publishing |
| Inner Temp | `inner_temp` | null | `inverter/alarms` inner_temperature | ❌ Topic not publishing |

## Power Limits Section

| Dashboard Label | Database Metric | Current Value | MQTT Source | Notes |
|----------------|-----------------|---------------|-------------|-------|
| Max Charge (M4) | `max_charge_power` | null | `m4/maxpower` ChgPower | ❌ Not being collected |
| Max Discharge (M4) | `max_discharge_power` | null | `m4/maxpower` DchgPower | ❌ Not being collected |
| Charge Voltage Limit | `charge_voltage_limit` | 53.25 V | `pylontech/info` ChargeVoltageLimit | ✓ Correct |
| Discharge Voltage Limit | `discharge_voltage_limit` | 45.0 V | `pylontech/info` DischargeVoltageLimit | ✓ Correct |
| Charge Current Limit | `charge_current_limit` | 60.0 A | `pylontech/info` ChargeCurrentLimit | ✓ Correct |
| Discharge Current Limit | `discharge_current_limit` | 150.0 A | `pylontech/info` DischargeCurrentLimit | ✓ Correct |

## Inverter Details Section

| Dashboard Label | Database Metric | Current Value | MQTT Source | Notes |
|----------------|-----------------|---------------|-------------|-------|
| AC Output | `grid_power` | 406.464 W | `ffr/measurements` LOCAL (absolute value) | ✓ Correct |
| Grid CT | `grid_power` | -406.464 W | `ffr/measurements` LOCAL Power Active | ✓ Correct |
| Battery Charge Rate | `battery_power` | 591 W | `inverter/charge` power | ✓ Correct (positive = discharging) |
| AUX1 Power | `aux_power` | -1.48 W | `ffr/measurements` AUX1 Power Active | ✓ Correct |
| Grid Frequency | `grid_frequency` | 50.0 Hz | `inverter/measurements` GRID Frequency | ✓ Correct |

## Grid Status Section

| Dashboard Label | Database Metric | Current Value | MQTT Source | Notes |
|----------------|-----------------|---------------|-------------|-------|
| Grid Voltage | `grid_voltage` | 225.8 V | `inverter/measurements` GRID Voltage Ac | ✓ Correct |
| Grid Frequency | `grid_frequency` | 50.0 Hz | `inverter/measurements` GRID Frequency | ✓ Correct |
| AUX1 CT Power | `aux_power` | -1.48 W | `ffr/measurements` AUX1 Power Active | ✓ Correct |

## EPS Status Section

| Dashboard Label | Database Metric | Current Value | MQTT Source | Notes |
|----------------|-----------------|---------------|-------------|-------|
| EPS Mode | `eps_mode` | null | `eps/status` Mode | ❌ Not being collected |
| EPS Reserve | `eps_reserve` | null | `eps/status` Reserve | ❌ Not being collected |

---

## Issues Found

### 1. Battery Current Discrepancy
- **Problem**: Battery Status shows "Current: 0.0 A" but battery is actually flowing -10.23A
- **Root Cause**: Using `battery_current` (inverter reading) instead of `battery_current_total` (Pylontech BMS)
- **Fix**: Update dashboard to use `battery_current_total` or show both

### 2. Max Charge/Discharge Power Missing
- **Problem**: Shows "-" for both
- **Root Cause**: `m4/maxpower` topic handler not storing data correctly
- **MQTT Format**: `[{"ChgPower": 4792, "DchgPower": -6750}]` (it's a list, not dict!)
- **Fix**: Update collector to handle list format

### 3. Inverter Temperatures Missing
- **Problem**: All show null
- **Root Cause**: `inverter/alarms` topic not publishing or not being received
- **Action**: Verify topic is publishing with `mosquitto_sub`

### 4. EPS Status Missing
- **Problem**: Both null
- **Root Cause**: `eps/status` handler fixed for list format but data may not be publishing
- **Action**: Verify topic is publishing

---

## Recommended Fixes

**Priority 1: Battery Current**
- Change Battery Status to display `battery_current_total` (-10.23A) instead of `battery_current` (0.0A)

**Priority 2: Max Power Limits**
- Fix `m4/maxpower` collector parser to handle list format

**Priority 3: Verify Missing Topics**
```bash
# Check if these topics are publishing
mosquitto_sub -h 192.168.1.215 -t 'pv/PV3/PV001001DEV/m4/maxpower' -C 1
mosquitto_sub -h 192.168.1.215 -t 'pv/PV3/PV001001DEV/inverter/alarms' -C 1  
mosquitto_sub -h 192.168.1.215 -t 'pv/PV3/PV001001DEV/eps/status' -C 1
```

Would you like me to implement these fixes?

