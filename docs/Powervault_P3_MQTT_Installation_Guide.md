# Powervault P3 MQTT Integration for Home Assistant

## Complete Installation Guide

This guide provides full instructions for integrating your Powervault P3 battery system with Home Assistant via MQTT.

---

## Prerequisites

- Home Assistant installed and running
- MQTT broker accessible (the P3 has a built-in broker at port 1883)
- MQTT integration configured in Home Assistant
- HACS installed (for Power Flow Card Plus - optional)

### MQTT Broker Configuration

Add this to your Home Assistant MQTT configuration:

```yaml
# configuration.yaml
mqtt:
  broker: 192.168.1.215  # Your P3 IP address
  port: 1883
  # No username/password required
```

---

## Step 1: Add MQTT Sensors

Add the following to your `mqtt.yaml` file (or create it and include it in configuration.yaml with `mqtt: !include mqtt.yaml`).

### Core Battery & Inverter Sensors

```yaml
sensor:
  # =======================
  # BATTERY (Inverter Reported)
  # =======================
  - name: "P3 Battery Voltage"
    unique_id: p3_battery_voltage_v
    state_topic: "pv/PV3/PV001001DEV/inverter/measurements"
    value_template: >
      {{ ((value_json
            | selectattr('channel','eq','BATTERY')
            | selectattr('measurement','eq','Voltage')
            | map(attribute='value') | list | first | default(0)) | float(0) / 1000) | round(2) }}
    unit_of_measurement: "V"
    device_class: voltage
    state_class: measurement

  - name: "P3 Battery Current"
    unique_id: p3_battery_current_a
    state_topic: "pv/PV3/PV001001DEV/inverter/measurements"
    value_template: >
      {{ ((value_json
            | selectattr('channel','eq','BATTERY')
            | selectattr('measurement','eq','ChargeCurrent')
            | map(attribute='value') | list | first | default(0)) | float(0) / 1000) | round(3) }}
    unit_of_measurement: "A"
    device_class: current
    state_class: measurement

  - name: "P3 Battery Capacity"
    unique_id: p3_battery_capacity_pct
    state_topic: "pv/PV3/PV001001DEV/inverter/measurements"
    value_template: >
      {{ (value_json
            | selectattr('channel','eq','BATTERY')
            | selectattr('measurement','eq','Capacity')
            | map(attribute='value') | list | first | default(0)) | float(0) }}
    unit_of_measurement: "%"
    device_class: battery
    state_class: measurement

  # =======================
  # GRID
  # =======================
  - name: "PV3 Grid Active Power"
    unique_id: pv3_grid_active_power_w
    state_topic: "pv/PV3/PV001001DEV/inverter/measurements"
    value_template: >
      {{ ((value_json
            | selectattr('channel','eq','GRID')
            | selectattr('measurement','eq','Power')
            | selectattr('type','eq','Active')
            | map(attribute='value') | list | first | default(0)) | float(0) / 1000) | round(1) }}
    unit_of_measurement: "W"
    device_class: power
    state_class: measurement

  - name: "PV3 Grid Voltage"
    unique_id: pv3_grid_voltage_v
    state_topic: "pv/PV3/PV001001DEV/inverter/measurements"
    value_template: >
      {{ ((value_json
            | selectattr('channel','eq','GRID')
            | selectattr('measurement','eq','Voltage')
            | selectattr('type','eq','Ac')
            | map(attribute='value') | list | first | default(0)) | float(0) / 1000) | round(1) }}
    unit_of_measurement: "V"
    device_class: voltage
    state_class: measurement

  - name: "PV3 Grid Frequency"
    unique_id: pv3_grid_frequency_hz
    state_topic: "pv/PV3/PV001001DEV/inverter/measurements"
    value_template: >
      {{ ((value_json
            | selectattr('channel','eq','GRID')
            | selectattr('measurement','eq','Frequency')
            | map(attribute='value') | list | first | default(0)) | float(0) / 1000) | round(2) }}
    unit_of_measurement: "Hz"
    device_class: frequency
    state_class: measurement

  # =======================
  # INVERTER CHARGE
  # =======================
  - name: "PV3 Inverter Charge Power"
    unique_id: pv3_inverter_charge_power_w
    state_topic: "pv/PV3/PV001001DEV/inverter/charge"
    value_template: "{{ value_json.power | float(0) }}"
    unit_of_measurement: "W"
    device_class: power
    state_class: measurement
```

### Schedule Sensors

```yaml
  # =======================
  # SCHEDULE
  # =======================
  - name: "PV3 Schedule Event"
    unique_id: pv3_schedule_event_new
    state_topic: "pv/PV3/PV001001DEV/schedule/event"
    value_template: >
      {% set events = {0: 'Idle', 1: 'Charge', 2: 'Discharge', 3: 'Force Charge', 4: 'Force Discharge'} %}
      {{ events.get(value_json.event | int, 'Event ' ~ value_json.event) }}
    icon: mdi:calendar-clock

  - name: "PV3 Schedule Setpoint"
    unique_id: pv3_schedule_setpoint_new
    state_topic: "pv/PV3/PV001001DEV/schedule/event"
    value_template: "{{ value_json.setpoint | default(0) }}"
    unit_of_measurement: "W"
    device_class: power
    state_class: measurement
    icon: mdi:target
```

### Inverter Temperature Sensors (from Alarms Topic)

```yaml
  # =======================
  # INVERTER TEMPERATURES
  # =======================
  - name: "PV3 Inverter Temp"
    unique_id: pv3_inverter_temp_new
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ value_json.inverter_temperature | default(0) | float }}"
    unit_of_measurement: "°C"
    device_class: temperature
    state_class: measurement

  - name: "PV3 Boost Temp"
    unique_id: pv3_boost_temp_new
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ value_json.boost_temperature | default(0) | float }}"
    unit_of_measurement: "°C"
    device_class: temperature
    state_class: measurement

  - name: "PV3 Inner Temp"
    unique_id: pv3_inner_temp_new
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ value_json.inner_temperature | default(0) | float }}"
    unit_of_measurement: "°C"
    device_class: temperature
    state_class: measurement
```

### Pylontech Battery Health Sensors

```yaml
  # =======================
  # STATE OF HEALTH
  # =======================
  - name: "PV3 Battery SOH"
    unique_id: pv3_battery_soh_corrected
    state_topic: "pv/PV3/PV001001DEV/pylontech/info"
    value_template: >
      {% set item = value_json[0] if value_json is iterable and value_json | length > 0 else {} %}
      {% if item.measurement == 'StateOfHealth' and item.type == 'Avg' %}
        {{ item.value }}
      {% else %}
        {{ states('sensor.pv3_battery_soh') | default('unknown') }}
      {% endif %}
    unit_of_measurement: "%"
    icon: mdi:battery-heart-variant

  - name: "PV3 Battery SOH Min"
    unique_id: pv3_battery_soh_min
    state_topic: "pv/PV3/PV001001DEV/pylontech/info"
    value_template: >
      {% set item = value_json[0] if value_json is iterable and value_json | length > 0 else {} %}
      {% if item.measurement == 'StateOfHealth' and item.type == 'Min' %}
        {{ item.value }}
      {% else %}
        {{ states('sensor.pv3_battery_soh_min') | default('unknown') }}
      {% endif %}
    unit_of_measurement: "%"
    icon: mdi:battery-heart-variant

  # =======================
  # CYCLE COUNT
  # =======================
  - name: "PV3 Battery Cycles Avg"
    unique_id: pv3_battery_cycles_avg
    state_topic: "pv/PV3/PV001001DEV/pylontech/info"
    value_template: >
      {% set item = value_json[0] if value_json is iterable and value_json | length > 0 else {} %}
      {% if item.measurement == 'CycleNumber' and item.type == 'Avg' %}
        {{ item.value }}
      {% else %}
        {{ states('sensor.pv3_battery_cycles_avg') | default('unknown') }}
      {% endif %}
    icon: mdi:battery-sync
    state_class: total_increasing

  - name: "PV3 Battery Cycles Max"
    unique_id: pv3_battery_cycles_max
    state_topic: "pv/PV3/PV001001DEV/pylontech/info"
    value_template: >
      {% set item = value_json[0] if value_json is iterable and value_json | length > 0 else {} %}
      {% if item.measurement == 'CycleNumber' and item.type == 'Max' %}
        {{ item.value }}
      {% else %}
        {{ states('sensor.pv3_battery_cycles_max') | default('unknown') }}
      {% endif %}
    icon: mdi:battery-sync
    state_class: total_increasing

  # =======================
  # CELL VOLTAGES
  # =======================
  - name: "PV3 Cell Voltage Max"
    unique_id: pv3_cell_voltage_max
    state_topic: "pv/PV3/PV001001DEV/pylontech/info"
    value_template: >
      {% set item = value_json[0] if value_json is iterable and value_json | length > 0 else {} %}
      {% if item.measurement == 'CellVoltage' and item.type == 'Max' %}
        {{ item.value }}
      {% else %}
        {{ states('sensor.pv3_cell_voltage_max') | default('unknown') }}
      {% endif %}
    unit_of_measurement: "mV"
    device_class: voltage
    state_class: measurement
    icon: mdi:battery-plus

  - name: "PV3 Cell Voltage Min"
    unique_id: pv3_cell_voltage_min
    state_topic: "pv/PV3/PV001001DEV/pylontech/info"
    value_template: >
      {% set item = value_json[0] if value_json is iterable and value_json | length > 0 else {} %}
      {% if item.measurement == 'CellVoltage' and item.type == 'Min' %}
        {{ item.value }}
      {% else %}
        {{ states('sensor.pv3_cell_voltage_min') | default('unknown') }}
      {% endif %}
    unit_of_measurement: "mV"
    device_class: voltage
    state_class: measurement
    icon: mdi:battery-minus

  # =======================
  # CELL TEMPERATURES
  # =======================
  - name: "PV3 Cell Temp Avg"
    unique_id: pv3_cell_temp_avg
    state_topic: "pv/PV3/PV001001DEV/pylontech/info"
    value_template: >
      {% set item = value_json[0] if value_json is iterable and value_json | length > 0 else {} %}
      {% if item.measurement == 'CellTemperature' and item.type == 'Avg' %}
        {{ (item.value / 1000) | round(1) }}
      {% else %}
        {{ states('sensor.pv3_cell_temp_avg') | default('unknown') }}
      {% endif %}
    unit_of_measurement: "°C"
    device_class: temperature
    state_class: measurement

  - name: "PV3 Cell Temp Max"
    unique_id: pv3_cell_temp_max
    state_topic: "pv/PV3/PV001001DEV/pylontech/info"
    value_template: >
      {% set item = value_json[0] if value_json is iterable and value_json | length > 0 else {} %}
      {% if item.measurement == 'CellTemperature' and item.type == 'Max' %}
        {{ (item.value / 1000) | round(1) }}
      {% else %}
        {{ states('sensor.pv3_cell_temp_max') | default('unknown') }}
      {% endif %}
    unit_of_measurement: "°C"
    device_class: temperature
    state_class: measurement

  - name: "PV3 Cell Temp Min"
    unique_id: pv3_cell_temp_min
    state_topic: "pv/PV3/PV001001DEV/pylontech/info"
    value_template: >
      {% set item = value_json[0] if value_json is iterable and value_json | length > 0 else {} %}
      {% if item.measurement == 'CellTemperature' and item.type == 'Min' %}
        {{ (item.value / 1000) | round(1) }}
      {% else %}
        {{ states('sensor.pv3_cell_temp_min') | default('unknown') }}
      {% endif %}
    unit_of_measurement: "°C"
    device_class: temperature
    state_class: measurement

  # =======================
  # BMS TEMPERATURE
  # =======================
  - name: "PV3 BMS Temp Avg"
    unique_id: pv3_bms_temp_avg
    state_topic: "pv/PV3/PV001001DEV/pylontech/info"
    value_template: >
      {% set item = value_json[0] if value_json is iterable and value_json | length > 0 else {} %}
      {% if item.measurement == 'BMSTemperature' and item.type == 'Avg' %}
        {{ (item.value / 1000) | round(1) }}
      {% else %}
        {{ states('sensor.pv3_bms_temp_avg') | default('unknown') }}
      {% endif %}
    unit_of_measurement: "°C"
    device_class: temperature
    state_class: measurement

  # =======================
  # MODULE VOLTAGE & CURRENT
  # =======================
  - name: "PV3 Module Voltage Avg"
    unique_id: pv3_module_voltage_avg
    state_topic: "pv/PV3/PV001001DEV/pylontech/info"
    value_template: >
      {% set item = value_json[0] if value_json is iterable and value_json | length > 0 else {} %}
      {% if item.measurement == 'ModuleVoltage' and item.type == 'Avg' %}
        {{ (item.value / 1000) | round(2) }}
      {% else %}
        {{ states('sensor.pv3_module_voltage_avg') | default('unknown') }}
      {% endif %}
    unit_of_measurement: "V"
    device_class: voltage
    state_class: measurement

  - name: "PV3 Battery Current Total"
    unique_id: pv3_battery_current_total
    state_topic: "pv/PV3/PV001001DEV/pylontech/info"
    value_template: >
      {% set item = value_json[0] if value_json is iterable and value_json | length > 0 else {} %}
      {% if item.measurement == 'Current' and item.type == 'Total' %}
        {{ (item.value / 1000) | round(2) }}
      {% else %}
        {{ states('sensor.pv3_battery_current_total') | default('unknown') }}
      {% endif %}
    unit_of_measurement: "A"
    device_class: current
    state_class: measurement

  # =======================
  # CHARGE/DISCHARGE LIMITS
  # =======================
  - name: "PV3 Charge Voltage Limit"
    unique_id: pv3_charge_voltage_limit
    state_topic: "pv/PV3/PV001001DEV/pylontech/info"
    value_template: >
      {% set item = value_json[0] if value_json is iterable and value_json | length > 0 else {} %}
      {% if item.measurement == 'ChargeVoltageLimit' %}
        {{ (item.value / 1000) | round(2) }}
      {% else %}
        {{ states('sensor.pv3_charge_voltage_limit') | default('unknown') }}
      {% endif %}
    unit_of_measurement: "V"
    device_class: voltage

  - name: "PV3 Discharge Voltage Limit"
    unique_id: pv3_discharge_voltage_limit
    state_topic: "pv/PV3/PV001001DEV/pylontech/info"
    value_template: >
      {% set item = value_json[0] if value_json is iterable and value_json | length > 0 else {} %}
      {% if item.measurement == 'DischargeVoltageLimit' %}
        {{ (item.value / 1000) | round(2) }}
      {% else %}
        {{ states('sensor.pv3_discharge_voltage_limit') | default('unknown') }}
      {% endif %}
    unit_of_measurement: "V"
    device_class: voltage

  - name: "PV3 Charge Current Limit"
    unique_id: pv3_charge_current_limit
    state_topic: "pv/PV3/PV001001DEV/pylontech/info"
    value_template: >
      {% set item = value_json[0] if value_json is iterable and value_json | length > 0 else {} %}
      {% if item.measurement == 'ChargeCurrentLimit' %}
        {{ (item.value / 1000) | round(1) }}
      {% else %}
        {{ states('sensor.pv3_charge_current_limit') | default('unknown') }}
      {% endif %}
    unit_of_measurement: "A"
    device_class: current

  - name: "PV3 Discharge Current Limit"
    unique_id: pv3_discharge_current_limit
    state_topic: "pv/PV3/PV001001DEV/pylontech/info"
    value_template: >
      {% set item = value_json[0] if value_json is iterable and value_json | length > 0 else {} %}
      {% if item.measurement == 'DischargeCurrentLimit' %}
        {{ (item.value / 1000 * -1) | round(1) }}
      {% else %}
        {{ states('sensor.pv3_discharge_current_limit') | default('unknown') }}
      {% endif %}
    unit_of_measurement: "A"
    device_class: current
```

### Alarm Sensors

```yaml
  # =======================
  # ALARM COUNT & LIST
  # =======================
  - name: "PV3 Alarm Count"
    unique_id: pv3_alarm_count_new
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: >
      {% set ns = namespace(count=0) %}
      {% for key, val in value_json.items() %}
        {% if val == '1' %}
          {% set ns.count = ns.count + 1 %}
        {% endif %}
      {% endfor %}
      {{ ns.count }}
    icon: mdi:alert-circle

  - name: "PV3 Alarm List"
    unique_id: pv3_alarm_list_fixed
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: >
      {% set ns = namespace(alarms=[]) %}
      {% set exclude = ['timestamp', 'warnings_summary', 'inverter_temperature', 'boost_temperature', 'inner_temperature'] %}
      {% for key, val in value_json.items() %}
        {% if val == '1' and key not in exclude %}
          {% set ns.alarms = ns.alarms + [key | replace('_', ' ') | title] %}
        {% endif %}
      {% endfor %}
      {{ ns.alarms | join(', ') if ns.alarms else 'None' }}
    icon: mdi:alert-circle-outline

  - name: "PV3 Warnings Summary"
    unique_id: pv3_warnings_summary
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ value_json.warnings_summary }}"
    icon: mdi:alert-outline

  # =======================
  # INDIVIDUAL ALARMS
  # =======================
  - name: "PV3 Alarm Fan Lock"
    unique_id: pv3_alarm_fan_lock
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.fan_lock == '1' else 'OFF' }}"
    icon: mdi:fan-alert

  - name: "PV3 Alarm Initial Fail"
    unique_id: pv3_alarm_initial_fail
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.initial_fail == '1' else 'OFF' }}"
    icon: mdi:alert-circle

  - name: "PV3 Alarm Battery Weak"
    unique_id: pv3_alarm_battery_weak
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.battery_weak == '1' else 'OFF' }}"
    icon: mdi:battery-alert

  - name: "PV3 Alarm Grid Voltage OOR"
    unique_id: pv3_alarm_grid_voltage_oor
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.grid_ip_voltage_outofrange == '1' else 'OFF' }}"
    icon: mdi:flash-triangle

  - name: "PV3 Alarm Grid Freq OOR"
    unique_id: pv3_alarm_grid_freq_oor
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.grid_ip_freq_outofrange == '1' else 'OFF' }}"
    icon: mdi:sine-wave

  - name: "PV3 Alarm Battery Discharge Low"
    unique_id: pv3_alarm_battery_discharge_low
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.battery_discharge_low == '1' else 'OFF' }}"
    icon: mdi:battery-arrow-down

  - name: "PV3 Alarm Battery Low"
    unique_id: pv3_alarm_battery_low
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.battery_low == '1' else 'OFF' }}"
    icon: mdi:battery-low

  - name: "PV3 Alarm PV Loss"
    unique_id: pv3_alarm_pv_loss
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.pv_loss == '1' else 'OFF' }}"
    icon: mdi:solar-power-variant-outline

  - name: "PV3 Alarm PV1 Loss"
    unique_id: pv3_alarm_pv1_loss
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.pv1_loss == '1' else 'OFF' }}"
    icon: mdi:solar-power-variant-outline

  - name: "PV3 Alarm PV2 Loss"
    unique_id: pv3_alarm_pv2_loss
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.pv2_loss == '1' else 'OFF' }}"
    icon: mdi:solar-power-variant-outline

  - name: "PV3 Alarm PV Low"
    unique_id: pv3_alarm_pv_low
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.pv_low == '1' else 'OFF' }}"
    icon: mdi:solar-power

  - name: "PV3 Alarm Grid Freq Under"
    unique_id: pv3_alarm_grid_freq_under
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.grid_freq_under_limit == '1' else 'OFF' }}"
    icon: mdi:sine-wave

  - name: "PV3 Alarm Grid Freq Over"
    unique_id: pv3_alarm_grid_freq_over
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.grid_freq_over_limit == '1' else 'OFF' }}"
    icon: mdi:sine-wave

  - name: "PV3 Alarm Grid Voltage Under"
    unique_id: pv3_alarm_grid_voltage_under
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.grid_voltage_under_limit == '1' else 'OFF' }}"
    icon: mdi:flash-triangle-outline

  - name: "PV3 Alarm Grid Voltage Over"
    unique_id: pv3_alarm_grid_voltage_over
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.grid_voltage_over_limit == '1' else 'OFF' }}"
    icon: mdi:flash-triangle

  - name: "PV3 Alarm Feeding Voltage Over"
    unique_id: pv3_alarm_feeding_voltage_over
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.feeding_av_voltage_over == '1' else 'OFF' }}"
    icon: mdi:flash-alert

  - name: "PV3 Alarm Ground Loss"
    unique_id: pv3_alarm_ground_loss
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.ground_loss == '1' else 'OFF' }}"
    icon: mdi:electric-switch-closed

  - name: "PV3 Alarm External Flash Fail"
    unique_id: pv3_alarm_external_flash_fail
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.external_flash_fail == '1' else 'OFF' }}"
    icon: mdi:memory

  - name: "PV3 Alarm Battery Under"
    unique_id: pv3_alarm_battery_under
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.battery_under == '1' else 'OFF' }}"
    icon: mdi:battery-outline

  - name: "PV3 Alarm Overload"
    unique_id: pv3_alarm_overload
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.overload == '1' else 'OFF' }}"
    icon: mdi:flash-alert

  - name: "PV3 Alarm Islanding Detect"
    unique_id: pv3_alarm_islanding_detect
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.islanding_detect == '1' else 'OFF' }}"
    icon: mdi:island

  - name: "PV3 Alarm No Battery"
    unique_id: pv3_alarm_no_battery
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.no_battery == '1' else 'OFF' }}"
    icon: mdi:battery-off

  - name: "PV3 Alarm Over Temperature"
    unique_id: pv3_alarm_over_temperature
    state_topic: "pv/PV3/PV001001DEV/inverter/alarms"
    value_template: "{{ 'ON' if value_json.over_temperature == '1' else 'OFF' }}"
    icon: mdi:thermometer-alert
```

---

## Step 2: Install Power Flow Card Plus (Optional)

For the power flow visualisation:

1. Open HACS in Home Assistant
2. Go to **Frontend**
3. Search for **Power Flow Card Plus**
4. Click **Install**
5. Restart Home Assistant
6. Clear browser cache (Ctrl+Shift+R)

---

## Step 3: Create the Dashboard

### Option A: Create via UI

1. Go to **Settings → Dashboards**
2. Click **Add Dashboard**
3. Name it "Powervault MQTT"
4. Set URL to `powervault-mqtt`
5. Click **Create**
6. Open the new dashboard
7. Click **3 dots (⋮)** → **Edit dashboard**
8. Click **3 dots** → **Raw configuration editor**
9. Paste the dashboard YAML below
10. Click **Save**

### Option B: Add to existing dashboard

1. Open your dashboard
2. Click **3 dots (⋮)** → **Edit dashboard**
3. Click **3 dots** → **Raw configuration editor**
4. Paste the dashboard YAML below
5. Click **Save**

---

## Dashboard YAML

```yaml
type: sections
max_columns: 4
title: Powervault MQTT
path: powervault-mqtt
sections:
  - type: grid
    cards:
      - type: heading
        heading: ⚡ Powervault P3
        heading_style: title
      - type: horizontal-stack
        cards:
          - type: gauge
            entity: sensor.pv3_battery_soc
            name: Battery SoC
            min: 0
            max: 100
            needle: true
            severity:
              green: 60
              yellow: 30
              red: 0
          - type: gauge
            entity: sensor.pv3_battery_soh
            name: State of Health
            min: 0
            max: 100
            needle: true
            severity:
              green: 80
              yellow: 60
              red: 40
          - type: gauge
            entity: sensor.pv3_grid_voltage
            name: Grid Voltage
            min: 210
            max: 260
            needle: true
            severity:
              green: 225
              yellow: 240
              red: 250

  - type: grid
    cards:
      - type: heading
        heading: 🔄 Power Flow
      - type: custom:power-flow-card-plus
        entities:
          battery:
            entity: sensor.pv3_inverter_charge_power
            state_of_charge: sensor.pv3_battery_soc
            state_of_charge_unit: "%"
            name: Battery
          grid:
            entity: sensor.pv3_grid_active_power
            name: Grid
          home:
            entity: sensor.pv3_house_active_power_3
            name: House
        clickable_entities: true
        display_zero_lines:
          mode: show
        use_new_flow_rate_model: true
        w_decimals: 0
        kw_decimals: 2
        min_flow_rate: 0.75
        max_flow_rate: 6
        watt_threshold: 1000

  - type: grid
    cards:
      - type: heading
        heading: 🔋 Battery
      - type: entities
        show_header_toggle: false
        entities:
          - entity: sensor.pv3_battery_soc
            name: State of Charge
          - entity: sensor.p3_battery_voltage
            name: Voltage
          - entity: sensor.p3_battery_current
            name: Current
          - entity: sensor.p3_battery_capacity
            name: Usable Capacity %

  - type: grid
    cards:
      - type: heading
        heading: 💚 Battery Health (Pylontech)
      - type: entities
        show_header_toggle: false
        entities:
          - entity: sensor.pv3_battery_soh
            name: State of Health
          - entity: sensor.pv3_battery_soh_min
            name: SOH Min
          - entity: sensor.pv3_battery_cycles_avg
            name: Cycles (Avg)
          - entity: sensor.pv3_battery_cycles_max
            name: Cycles (Max)
          - entity: sensor.pv3_module_voltage_avg
            name: Module Voltage (Avg)
          - entity: sensor.pv3_battery_current_total
            name: Battery Current (Total)

  - type: grid
    cards:
      - type: heading
        heading: 🔌 Cell Voltages
      - type: entities
        show_header_toggle: false
        entities:
          - entity: sensor.pv3_cell_voltage_max
            name: Cell Voltage Max
          - entity: sensor.pv3_cell_voltage_min
            name: Cell Voltage Min

  - type: grid
    cards:
      - type: heading
        heading: 🌡️ Battery Temperatures
      - type: entities
        show_header_toggle: false
        entities:
          - entity: sensor.pv3_cell_temp_avg
            name: Cell Temp Avg
          - entity: sensor.pv3_cell_temp_max
            name: Cell Temp Max
          - entity: sensor.pv3_cell_temp_min
            name: Cell Temp Min
          - entity: sensor.pv3_bms_temp_avg
            name: BMS Temp Avg

  - type: grid
    cards:
      - type: heading
        heading: 🔥 Inverter Temperatures
      - type: entities
        show_header_toggle: false
        entities:
          - entity: sensor.pv3_inverter_temp
            name: Inverter Temp
          - entity: sensor.pv3_boost_temp
            name: Boost Temp
          - entity: sensor.pv3_inner_temp
            name: Inner Temp

  - type: grid
    cards:
      - type: heading
        heading: 📊 Power Limits
      - type: entities
        show_header_toggle: false
        entities:
          - entity: sensor.pv3_battery_power_rating
            name: Battery Power Rating
          - entity: sensor.pv3_max_charge_power
            name: Max Charge Power
          - entity: sensor.pv3_max_discharge_power
            name: Max Discharge Power
          - type: divider
          - entity: sensor.pv3_safetycheck_max_charge_power_3
            name: SafetyCheck Charge (kW)
          - entity: sensor.pv3_safetycheck_max_discharge_power_3
            name: SafetyCheck Discharge (kW)

  - type: grid
    cards:
      - type: heading
        heading: 🔒 Battery Limits (Pylontech)
      - type: entities
        show_header_toggle: false
        entities:
          - entity: sensor.pv3_charge_voltage_limit
            name: Charge Voltage Limit
          - entity: sensor.pv3_discharge_voltage_limit
            name: Discharge Voltage Limit
          - entity: sensor.pv3_charge_current_limit
            name: Charge Current Limit
          - entity: sensor.pv3_discharge_current_limit
            name: Discharge Current Limit

  - type: grid
    cards:
      - type: heading
        heading: 📅 Schedule
      - type: entities
        show_header_toggle: false
        entities:
          - entity: sensor.pv3_schedule_event
            name: Schedule Event
          - entity: sensor.pv3_schedule_setpoint
            name: Schedule Setpoint (W)

  - type: grid
    cards:
      - type: heading
        heading: ⚡ Grid & EPS
      - type: entities
        show_header_toggle: false
        entities:
          - entity: sensor.pv3_grid_active_power
            name: Inverter Grid CT
          - entity: sensor.pv3_grid_voltage
            name: Grid Voltage
          - entity: sensor.pv3_grid_frequency
            name: Grid Frequency
          - entity: sensor.pv3_eps_grid_loss
            name: EPS Grid Loss (0=OK)

  - type: grid
    cards:
      - type: heading
        heading: 📡 Inverter Measurements
      - type: entities
        show_header_toggle: false
        entities:
          - entity: sensor.pv3_local_active_power_3
            name: Inverter AC Output
          - entity: sensor.pv3_house_active_power_3
            name: PV Internal CT
          - entity: sensor.pv3_inverter_charge_power
            name: Battery Charge Rate

  - type: grid
    cards:
      - type: heading
        heading: 🔌 AUX1 External CT
      - type: entities
        show_header_toggle: false
        entities:
          - entity: sensor.pv3_aux1_current_2
            name: AUX1 CT Current
          - entity: sensor.pv3_aux1_apparent_power_2
            name: AUX1 CT Power

  - type: grid
    cards:
      - type: heading
        heading: ⚠️ Alarms & Warnings
      - type: entities
        show_header_toggle: false
        entities:
          - entity: sensor.pv3_alarm_count
            name: Active Alarm Count
          - entity: sensor.pv3_alarm_list
            name: Active Alarms
          - entity: sensor.pv3_warnings_summary
            name: Warnings Summary
          - type: divider
          - entity: sensor.pv3_alarm_overload
            name: Overload
          - entity: sensor.pv3_alarm_over_temperature
            name: Over Temperature
          - entity: sensor.pv3_alarm_battery_low
            name: Battery Low
          - entity: sensor.pv3_alarm_battery_weak
            name: Battery Weak
          - entity: sensor.pv3_alarm_no_battery
            name: No Battery
          - type: divider
          - entity: sensor.pv3_alarm_pv_loss
            name: PV Loss
          - entity: sensor.pv3_alarm_pv1_loss
            name: PV1 Loss
          - entity: sensor.pv3_alarm_pv2_loss
            name: PV2 Loss
          - type: divider
          - entity: sensor.pv3_alarm_grid_voltage_over
            name: Grid Voltage Over
          - entity: sensor.pv3_alarm_grid_voltage_under
            name: Grid Voltage Under
          - entity: sensor.pv3_alarm_ground_loss
            name: Ground Loss

  - type: grid
    cards:
      - type: heading
        heading: 📈 SoC & Health History
      - type: history-graph
        hours_to_show: 24
        entities:
          - entity: sensor.pv3_battery_soc
            name: SoC
          - entity: sensor.pv3_battery_soh
            name: SOH

  - type: grid
    cards:
      - type: heading
        heading: 📈 Power History
      - type: history-graph
        hours_to_show: 24
        entities:
          - entity: sensor.pv3_local_active_power_3
            name: Inverter AC Output
          - entity: sensor.pv3_inverter_charge_power
            name: Battery Charge Rate
          - entity: sensor.pv3_grid_active_power
            name: Inverter Grid CT

  - type: grid
    cards:
      - type: heading
        heading: 📈 Cell Voltage History
      - type: history-graph
        hours_to_show: 24
        entities:
          - entity: sensor.pv3_cell_voltage_max
            name: Max Cell
          - entity: sensor.pv3_cell_voltage_min
            name: Min Cell

  - type: grid
    cards:
      - type: heading
        heading: 📈 Temperature History
      - type: history-graph
        hours_to_show: 24
        entities:
          - entity: sensor.pv3_cell_temp_avg
            name: Cell Temp
          - entity: sensor.pv3_inverter_temp
            name: Inverter Temp
          - entity: sensor.pv3_bms_temp_avg
            name: BMS Temp

cards: []
```

---

## Step 4: Restart Home Assistant

After adding all sensors to mqtt.yaml:

1. Go to **Developer Tools → YAML**
2. Click **Check Configuration**
3. If valid, click **Restart**

Or via command line:
```bash
ha core restart
```

---

## Sensor Reference

| Sensor | Description | Unit |
|--------|-------------|------|
| `pv3_battery_soc` | Battery State of Charge | % |
| `pv3_battery_soh` | Battery State of Health | % |
| `pv3_battery_cycles_avg` | Average Cycle Count | cycles |
| `pv3_battery_cycles_max` | Maximum Cycle Count | cycles |
| `pv3_cell_voltage_max` | Maximum Cell Voltage | mV |
| `pv3_cell_voltage_min` | Minimum Cell Voltage | mV |
| `pv3_cell_temp_avg` | Average Cell Temperature | °C |
| `pv3_bms_temp_avg` | BMS Temperature | °C |
| `pv3_inverter_temp` | Inverter Temperature | °C |
| `pv3_grid_active_power` | Grid Power (+ import, - export) | W |
| `pv3_grid_voltage` | Grid Voltage | V |
| `pv3_grid_frequency` | Grid Frequency | Hz |
| `pv3_inverter_charge_power` | Battery Charge/Discharge Power | W |
| `pv3_schedule_event` | Current Schedule Mode | text |
| `pv3_schedule_setpoint` | Schedule Power Setpoint | W |
| `pv3_alarm_count` | Number of Active Alarms | count |
| `pv3_alarm_list` | List of Active Alarm Names | text |

---

## MQTT Topics Reference

| Topic | Description |
|-------|-------------|
| `pv/PV3/PV001001DEV/inverter/measurements` | Inverter readings (battery, grid) |
| `pv/PV3/PV001001DEV/inverter/charge` | Battery charge power |
| `pv/PV3/PV001001DEV/inverter/alarms` | Alarm states and temperatures |
| `pv/PV3/PV001001DEV/pylontech/info` | Battery health data (SOH, cycles, cells) |
| `pv/PV3/PV001001DEV/schedule/event` | Current schedule state |
| `pv/PV3/PV001001DEV/bms/soc` | Battery SoC |
| `pv/PV3/PV001001DEV/ffr/measurements` | FFR power measurements |

---

## Troubleshooting

### Sensors showing "unknown"
- Wait 1-2 minutes for MQTT messages to arrive
- Check MQTT broker connection in Home Assistant
- Verify the P3 IP address is correct

### Power Flow Card not showing
- Ensure HACS is installed
- Install Power Flow Card Plus from HACS Frontend
- Clear browser cache after installation

### Test MQTT connection
```bash
mosquitto_sub -h 192.168.1.215 -t 'pv/#' -v
```

---

## Notes

- Replace `192.168.1.215` with your actual P3 IP address
- The P3's MQTT broker requires no authentication
- Sensor values update every few seconds
- Some Pylontech sensors only update when the measurement type matches (may take a few seconds)

---

*Guide created: December 2024*
*Powervault P3 MQTT Integration for Home Assistant*
