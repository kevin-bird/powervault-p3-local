# Powervault P3 Local Control & Monitoring

Community project for local monitoring and control of Powervault P3 battery systems after the company entered administration in November 2024.

> ⚠️ **Disclaimer**: This is an unofficial community project. Use at your own risk. Modifying your battery system may void warranties and could be dangerous if done incorrectly.

## Background

Powervault Ltd entered administration in November 2024, leaving P3 owners uncertain about the future of cloud services and remote management. This project documents how to monitor and potentially control your P3 locally, independent of cloud services.

## What Works

| Feature | Status | Notes |
|---------|--------|-------|
| **MQTT Monitoring** | ✅ Working | Full read access to all system data |
| **Home Assistant Integration** | ✅ Working | Complete sensor suite + dashboards |
| **Battery Health Data** | ✅ Working | SOH, cycles, cell voltages, temperatures |
| **Inverter Alarms** | ✅ Working | All 22 alarm states monitored |
| **Schedule Monitoring** | ✅ Working | See current charge/discharge events |
| **MQTT Control** | ❌ Not Working | M4 ignores local MQTT publishes |
| **Local Control** | 🔄 In Progress | Serial console access needed |

### MQTT Control Testing

We've confirmed that publishing to MQTT topics **does not** control the P3:
- The M4 ignores locally published messages
- Commands must come from the cloud via authenticated connection
- Schedule files are stored at `/data/appconfigs/cloudconnection/state_schedules/`

**Next step:** Serial console access to edit config files directly.

## Quick Start

### 1. Find Your P3's IP Address

Check your router's DHCP client list for a device with MAC starting with `00:1F:7B`.

### 2. Test MQTT Connection

```bash
mosquitto_sub -h <YOUR_P3_IP> -t 'pv/#' -v
```

If you see JSON data flowing, MQTT is working!

### 3. Add to Home Assistant

See [Home Assistant Integration Guide](docs/Powervault_P3_MQTT_Installation_Guide.md) for full instructions.

## Documentation

| Document | Description |
|----------|-------------|
| [MQTT Installation Guide](docs/Powervault_P3_MQTT_Installation_Guide.md) | Complete Home Assistant setup |
| [M4 Controller Details](docs/Powervault_P3_M4_Controller.md) | Hardware documentation |
| [Local Control Guide](docs/Powervault_P3_Local_Control_Guide.md) | Investigation into direct control |

## Home Assistant Files

Ready-to-use configuration files:

| File | Description |
|------|-------------|
| [mqtt_sensors.yaml](home-assistant/mqtt/mqtt_sensors.yaml) | All MQTT sensor definitions |
| [alarm_sensors.yaml](home-assistant/mqtt/alarm_sensors.yaml) | Individual alarm sensors |
| [pylontech_sensors.yaml](home-assistant/mqtt/pylontech_sensors.yaml) | Battery health sensors |
| [dashboard.yaml](home-assistant/dashboard/powervault_dashboard.yaml) | Complete Lovelace dashboard |

## MQTT Topics Reference

The P3's M4 controller publishes to these topics:

| Topic | Data |
|-------|------|
| `pv/PV3/<ID>/inverter/measurements` | Voltage, current, power readings |
| `pv/PV3/<ID>/inverter/alarms` | Alarm states + temperatures |
| `pv/PV3/<ID>/inverter/charge` | Battery charge/discharge power |
| `pv/PV3/<ID>/pylontech/info` | Battery health (SOH, cycles, cells) |
| `pv/PV3/<ID>/schedule/event` | Current schedule state (event 0-4, setpoint) |
| `pv/PV3/<ID>/eps_schedule/event` | EPS schedule (reserved_soc, event on/off) |
| `pv/PV3/<ID>/ffr/measurements` | CT readings (grid, house, aux) |
| `pv/PV3/<ID>/bms/soc` | State of charge |
| `pv/PV3/<ID>/m4/maxpower` | Current charge/discharge power limits |
| `pv/PV3/<ID>/eps/status` | EPS reserve SoC and mode |
| `pv/PV3/<ID>/safetycheck/state` | Safety check status |

### Schedule Event Codes

| Code | Meaning |
|------|---------|
| 0 | Idle |
| 1 | Charge |
| 2 | Discharge |
| 3 | Force Charge |
| 4 | Force Discharge |

## Hardware Overview

The P3 consists of:

- **M4 Controller** - Custom ARM board (NXP i.MX) running embedded Linux
- **Iconica Inverter** - Rebranded Voltronic InfiniSolar E 5.5KW (P18 protocol)
- **Pylontech Batteries** - US2000/US3000 modules with CAN/RS485 BMS
- **FFR Metering** - CT clamps for grid/house/aux power measurement

## System Specifications (Example: P3-1164)

| Specification | Value |
|---------------|-------|
| Capacity | 12 kWh (6x Pylontech modules) |
| Inverter | 5.5 kW continuous |
| State of Health | 92% |
| Cycle Count | 840-874 cycles |
| MQTT Port | 1883 (no authentication) |
| Web API | Port 443 (authentication required) |

## Contributing

Contributions welcome! If you've discovered anything about:
- P18 protocol commands that work
- Web API authentication
- Serial console access
- Additional MQTT topics

Please open an issue or pull request.

## Community

- [Powervault Owners Facebook Group](https://www.facebook.com/groups/powervaultowners)
- GitHub Issues for technical discussion

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

## Acknowledgements

- Powervault owners community for sharing information
- Contributors who've helped document the system
- Everyone working to keep their P3 systems running locally

---

*This project is not affiliated with Powervault Ltd or its administrators.*
