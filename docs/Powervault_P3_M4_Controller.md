# Powervault P3 M4 Controller

## Overview

The M4 is the main controller board in the Powervault P3 battery system. It manages all communications between the inverter, battery management system (BMS), CTs, and the cloud platform.

**Important**: The M4 is NOT a Raspberry Pi. It is a custom-designed embedded controller board manufactured specifically for Powervault.

---

## Hardware Specifications

### Processor

| Component | Details |
|-----------|---------|
| **CPU** | NXP/Freescale i.MX series ARM processor |
| **Architecture** | ARM Cortex-A (32-bit) |
| **Manufacturer** | NXP Semiconductors (formerly Freescale) |
| **Memory** | Onboard RAM (likely 256MB-512MB DDR3) |
| **Storage** | eMMC flash (boots from eMMC, not SD card) |

### Network & Communications

| Component | Location | Purpose |
|-----------|----------|---------|
| **Ethernet Port** | Edge, with Pulse H5007NL magnetics | Main network connection (192.168.1.x) |
| **DB9 Serial Port** | Bottom edge | RS232 - Console access or inverter comms |
| **RJ11/RJ12 Jack** | Edge | RS485 to Pylontech BMS |
| **USB Ports** | Edge | Firmware updates / debug access |

### I/O Connections

| Component | Location | Purpose |
|-----------|----------|---------|
| **Green Terminal Blocks** | Top edge | CT clamp inputs (LOCAL, HOUSE, AUX1) |
| **Rotary Hex Switch** | Edge (labelled 0-F) | RS485 address or configuration mode |
| **TE Connectivity Relay** | Board centre | Power switching |
| **Pin Headers** | Various | Internal connections to inverter, FFR board |

### Board Identifiers

| Label | Value | Notes |
|-------|-------|-------|
| **MAC Address** | 001F7Bxxxxxx | On green sticker |
| **Serial/Barcode** | 0O5I982 | White barcode label |
| **QC Markings** | -OK, 1227-OK, 505782 | Handwritten test notes |

---

## Operating System

The M4 runs **embedded Linux**, not a standard desktop distribution.

### Likely OS Options

| Distribution | Probability | Notes |
|--------------|-------------|-------|
| **Yocto Project** | High | Common for commercial ARM products |
| **Buildroot** | Medium | Lightweight embedded Linux |
| **OpenWrt** | Low | Possible given network functionality |

### Evidence of Linux

- Runs Mosquitto MQTT broker on port 1883
- Python/Flask-based web API on port 443
- Standard TCP/IP networking stack
- i.MX processors are designed for embedded Linux

---

## Network Services

The M4 exposes the following network services:

| Port | Protocol | Service | Authentication |
|------|----------|---------|----------------|
| **1883** | TCP | MQTT (Mosquitto) | None required |
| **443** | TCP | HTTPS Web API | Token-based (cloud) |
| **22** | TCP | SSH (unconfirmed) | Unknown |

### MQTT Broker

The M4 runs an unauthenticated MQTT broker accessible on the local network:

```bash
mosquitto_sub -h <M4_IP> -t 'pv/#' -v
```

**Published Topics:**
- `pv/PV3/<DEVICE_ID>/inverter/measurements` - Inverter readings
- `pv/PV3/<DEVICE_ID>/inverter/alarms` - Alarm states
- `pv/PV3/<DEVICE_ID>/inverter/charge` - Battery charge power
- `pv/PV3/<DEVICE_ID>/pylontech/info` - Battery health data
- `pv/PV3/<DEVICE_ID>/schedule/event` - Current schedule state
- `pv/PV3/<DEVICE_ID>/ffr/measurements` - CT measurements
- `pv/PV3/<DEVICE_ID>/bms/soc` - State of charge

---

## Serial Console Access

### DB9 Serial Port

The DB9 port on the board may provide:

1. **Linux Console Access** - Direct shell login
2. **Inverter Communication** - P18 protocol to Iconica

### Connection Settings (to try)

| Parameter | Value |
|-----------|-------|
| **Baud Rate** | 115200 (try also 9600, 19200) |
| **Data Bits** | 8 |
| **Parity** | None |
| **Stop Bits** | 1 |
| **Flow Control** | None |

### Testing Serial Connection

```bash
# Install minicom/screen
sudo apt install minicom screen

# Connect with screen
sudo screen /dev/ttyUSB0 115200

# Or with minicom
sudo minicom -D /dev/ttyUSB0 -b 115200
```

**Expected Output:**
- U-Boot bootloader messages (on power-up)
- Linux kernel boot log
- Login prompt: `powervault login:` or `root@powervault:~#`

---

## Hardware Access Points

### For Local Control Project

| Method | Access Point | Potential Use |
|--------|--------------|---------------|
| **MQTT** | Port 1883 | Read-only monitoring (working) |
| **DB9 Serial** | RS232 port | Console access or P18 inverter control |
| **USB** | USB ports | Serial debug or firmware |
| **Web API** | Port 443 | Control (requires auth bypass) |

### Rotary Hex Switch

The rotary switch (labelled 0-9, A-F) may control:
- RS485 device address
- Boot mode selection
- Engineering/debug mode

**Current position should be noted before changing.**

---

## Internal Connections

### To Iconica Inverter

The M4 communicates with the Iconica 5500W inverter (Voltronic InfiniSolar E 5.5KW) via:
- Internal ribbon cable or pin header
- Likely RS232 or TTL serial
- Uses P18 protocol for control commands

### To Pylontech BMS

- RS485 connection via RJ11/RJ12 jack
- CAN bus alternative possible
- Reads SOC, SOH, cell voltages, temperatures

### To FFR Metering Board

- Internal connection via pin headers
- Reads CT measurements (LOCAL, HOUSE, AUX1)
- Grid frequency monitoring for FFR services

---

## Boot Process

Based on i.MX architecture, the typical boot sequence is:

1. **Power On** - i.MX ROM code executes
2. **U-Boot** - Bootloader initialises hardware
3. **Linux Kernel** - Loads from eMMC
4. **Root Filesystem** - Mounts from eMMC partition
5. **Services Start** - MQTT, web server, control daemons

### Recovery Mode

Holding certain buttons or setting the rotary switch during power-on may enter:
- U-Boot command line
- Recovery/update mode
- Engineering mode

---

## Photos

### Main Board (Front View)

Key visible components:
- NXP/Freescale i.MX processor (centre)
- Pulse H5007NL Ethernet magnetics (top right)
- TE Connectivity relay (top left, blue)
- DB9 serial port (bottom)
- RJ45 Ethernet (bottom right)

### Edge Connectors (Side View)

From top to bottom:
- Green terminal blocks (CT inputs)
- Multiple RJ45 ports with orange magnetics
- Rotary hex switch (789ABCDEF0123456)
- USB ports
- Additional RJ connectors

---

## Next Steps for Local Control

### Priority 1: Serial Console
1. Connect USB-to-serial adapter to DB9 port
2. Try 115200 8N1, power cycle the unit
3. Capture boot log and login prompt

### Priority 2: USB Debug
1. Connect USB cable to M4 USB ports
2. Check for new serial devices: `ls /dev/ttyUSB* /dev/ttyACM*`
3. Check dmesg for enumeration

### Priority 3: Direct Inverter Access
1. Locate inverter serial connection on board
2. Tap into P18 serial line
3. Send control commands directly

---

## Related Documents

- [Powervault P3 MQTT Guide](./Powervault_P3_MQTT_Guide.md)
- [Powervault P3 Local Control Guide](./Powervault_P3_Local_Control_Guide.md)
- [P18 Protocol Reference](./P18_Protocol_Reference.md)

---

*Document created: December 2024*
*Based on physical inspection of Powervault P3 unit (P3-1164)*
