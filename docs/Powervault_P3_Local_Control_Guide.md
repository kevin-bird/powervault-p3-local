# Powervault P3 Local Control Technical Guide

## Direct Inverter Control via Voltronic P18 Protocol

**Date:** 14 December 2025  
**Unit:** P3-1164 (Iconica 5500W / Voltronic InfiniSolar E 5.5KW)

---

## Executive Summary

Your Powervault P3 contains a **Voltronic InfiniSolar E 5.5KW** inverter which uses the **P18 serial protocol** for communication. This guide covers three approaches to gain local control:

| Approach | Difficulty | Cost | Time | Recommended |
|----------|-----------|------|------|-------------|
| **A: SD Card Extraction** | Easy | £0 | 30 min | ✅ **Best first step** |
| **B: Direct USB/Serial Connection** | Medium | £10-20 | 1-2 hours | ✅ For full control |
| **C: Serial Line Intercept** | Hard | £20-30 | 2-4 hours | Only if needed |

---

## MQTT Control Testing Results (December 2024)

### Summary: MQTT is Read-Only

Extensive testing has confirmed that the M4's MQTT broker is **publish-only** - it broadcasts data but does not accept commands via MQTT publish.

### What We Tested

| Test | Result |
|------|--------|
| Publish to `schedule/event` | ❌ Ignored - schedule unchanged |
| Publish to `eps_schedule/event` | ❌ Ignored |
| Publish to `groups/powervault/schedule` | ❌ Ignored |
| Publish to various `*/command`, `*/control`, `*/set` topics | ❌ No response |

### MQTT Topics Discovered

**Schedule Topics (Read-Only):**
```
pv/PV3/<ID>/schedule/event
  {"time": "2025-12-18T07:46:49", "event": 0, "setpoint": 0}
  
  Event codes:
  0 = Idle
  1 = Charge
  2 = Discharge
  3 = Force Charge
  4 = Force Discharge

pv/PV3/<ID>/eps_schedule/event
  {"reserved_soc": 0, "time": "...", "event": "off"}
```

**New Topics Found:**
```
pv/PV3/<ID>/m4/maxpower
  {"ChgPower": 4792, "DchgPower": -6750}  # Current power limits in W

pv/PV3/<ID>/ffrcontroller/state
  {"State": 0}  # FFR controller status

pv/PV3/<ID>/eps/status
  {"Reserve": 20, "Mode": 0}  # EPS reserve SoC %

pv/PV3/<ID>/bms/soc (per module)
  {"module_addr": 4, "StateOfCharge": 8200}  # Individual module SoC (÷100 for %)
```

### Cloud Command Path (from Powervault Logs)

Historical logs from Powervault show commands arrive via:
```
Topic: groups/powervault/ffr-low/schedule
Saved to: /data/appconfigs/cloudconnection/state_schedules/ffr_schedule.json
```

This confirms the M4 receives commands from the **cloud** on specific topics, not the local MQTT broker.

### Conclusion

Local MQTT control is **not possible** without:
1. Shell access to edit config files directly
2. Understanding the cloud authentication to spoof commands
3. Reverse engineering the internal command processing

**Serial console access is the most promising next step.**

---

## Part 1: The SD Card Approach (Easiest)

> **Note:** Testing has shown the M4 boots from **eMMC**, not SD card. The SD slot appears unused or only for updates. Serial console access is now the recommended approach.

### Why This is the Best First Step

The M4 controller is a **custom NXP i.MX ARM board** running embedded Linux. The filesystem contains:
- Flask application source code (Python)
- Authentication credentials/tokens
- MQTT configuration
- SSH keys and passwords
- Possibly the serial protocol implementation

### What You'll Need

- Micro SD card reader (or SD adapter)
- Linux computer (your energy server works perfectly)
- 10-15 minutes of physical access to the P3

### Step-by-Step Extraction

```
┌─────────────────────────────────────────────────────────────┐
│                    POWERVAULT P3 INTERIOR                   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              M4 CONTROLLER (Top Right)              │   │
│   │                                                     │   │
│   │    ┌──────────────┐                                 │   │
│   │    │ Raspberry Pi │                                 │   │
│   │    │              │                                 │   │
│   │    │   ┌──────┐   │  ◄── Micro SD card slot        │   │
│   │    │   │ SD   │   │      (on underside of Pi)      │   │
│   │    │   └──────┘   │                                 │   │
│   │    │              │                                 │   │
│   │    └──────────────┘                                 │   │
│   │                                                     │   │
│   │    Serial/USB connection to Iconica ────────────►   │   │
│   │                                                     │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Physical Steps

1. **Power down the P3** at the isolator
2. **Remove the front cover** (likely 4-6 screws)
3. **Locate the M4 controller** (top right, Raspberry Pi board)
4. **Photograph everything** before touching (especially cable positions)
5. **Gently remove the Micro SD card** from the Pi's underside
6. **Do NOT disconnect any cables yet** - just the SD card

#### Reading the SD Card

```bash
# Insert SD card into your Linux machine
# It will likely appear as /dev/sdb or /dev/mmcblk0

# List partitions
lsblk

# Mount the main partition (usually the larger one)
sudo mkdir -p /mnt/pv3_sd
sudo mount /dev/sdb2 /mnt/pv3_sd  # Adjust device as needed

# Also mount boot partition if present
sudo mkdir -p /mnt/pv3_boot
sudo mount /dev/sdb1 /mnt/pv3_boot
```

#### Key Files to Extract

```bash
# Create backup directory
mkdir -p ~/pv3_backup

# Copy everything important
sudo cp -r /mnt/pv3_sd/etc ~/pv3_backup/
sudo cp -r /mnt/pv3_sd/home ~/pv3_backup/
sudo cp -r /mnt/pv3_sd/opt ~/pv3_backup/
sudo cp -r /mnt/pv3_sd/var/www ~/pv3_backup/ 2>/dev/null
sudo cp -r /mnt/pv3_sd/srv ~/pv3_backup/ 2>/dev/null

# Look for the Flask application
find /mnt/pv3_sd -name "*.py" -type f 2>/dev/null | head -50
find /mnt/pv3_sd -name "app.py" -o -name "main.py" -o -name "flask*" 2>/dev/null

# Find configuration files
find /mnt/pv3_sd -name "*.conf" -o -name "*.json" -o -name "*.yaml" 2>/dev/null

# Extract password hashes
sudo cat /mnt/pv3_sd/etc/shadow

# Look for SSH keys
sudo ls -la /mnt/pv3_sd/home/*/.ssh/ 2>/dev/null
sudo cat /mnt/pv3_sd/etc/ssh/sshd_config
```

#### Cracking/Bypassing Authentication

```bash
# Option 1: Add your SSH key
sudo mkdir -p /mnt/pv3_sd/home/pi/.ssh
sudo sh -c 'cat ~/.ssh/id_rsa.pub >> /mnt/pv3_sd/home/pi/.ssh/authorized_keys'
sudo chmod 700 /mnt/pv3_sd/home/pi/.ssh
sudo chmod 600 /mnt/pv3_sd/home/pi/.ssh/authorized_keys

# Option 2: Reset the pi user password
# Generate new password hash
openssl passwd -6 -salt xyz "your_new_password"
# Edit /mnt/pv3_sd/etc/shadow and replace pi's hash

# Option 3: Enable root login
sudo sed -i 's/#PermitRootLogin.*/PermitRootLogin yes/' /mnt/pv3_sd/etc/ssh/sshd_config
```

#### Finding Flask API Authentication

```bash
# Search for authentication code
grep -r "401\|Unauthorized\|token\|auth\|password\|secret" /mnt/pv3_sd/opt/ 2>/dev/null
grep -r "401\|Unauthorized\|token\|auth\|password\|secret" /mnt/pv3_sd/srv/ 2>/dev/null
grep -r "401\|Unauthorized\|token\|auth\|password\|secret" /mnt/pv3_sd/home/ 2>/dev/null

# Look for API keys or tokens
grep -r "api_key\|API_KEY\|Bearer\|JWT" /mnt/pv3_sd/ 2>/dev/null

# Find the web server code
find /mnt/pv3_sd -name "*.py" -exec grep -l "flask\|Flask\|app.route" {} \;
```

#### Understanding the Serial Connection

```bash
# Look for serial port configuration
grep -r "ttyUSB\|ttyAMA\|serial\|/dev/tty" /mnt/pv3_sd/ 2>/dev/null

# Find inverter communication code
grep -r "inverter\|iconica\|voltronic\|QPIGS\|POP\|PCP" /mnt/pv3_sd/ 2>/dev/null

# Check for protocol implementation
find /mnt/pv3_sd -name "*.py" -exec grep -l "serial\|Serial\|pyserial" {} \;
```

---

## Part 2: Direct Connection to Inverter

### Identifying Available Ports on the Iconica

The Iconica 5500W has several communication interfaces:

```
┌─────────────────────────────────────────────────────────────┐
│                   ICONICA 5500W INVERTER                    │
│                      (Front Panel)                          │
│                                                             │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│   │   USB   │  │  RS232  │  │ RS485/  │  │ Intelli-│       │
│   │  Type B │  │  DB9 or │  │ BMS     │  │  gent   │       │
│   │         │  │  RJ45   │  │ Port    │  │  Slot   │       │
│   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
│        │            │            │            │             │
│   For PC/Pi    For M4      For Battery   For Modbus        │
│   connection   Controller  BMS (CAN)     Card (meter)      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Option A: USB Connection (Preferred)

The USB port presents as a **HID device** on Linux.

#### Hardware Required

- USB Type-A to Type-B cable (like a printer cable)
- Raspberry Pi or Linux computer

#### Connection Steps

```bash
# 1. Connect USB cable from your Pi/computer to inverter USB port

# 2. Check if device appears
lsusb | grep -i "0665"  # Voltronic USB vendor ID
# Should show: Bus 00x Device 00y: ID 0665:5161 Cypress Semiconductor USB ...

# 3. Find the device file
ls -la /dev/hidraw*
# Usually /dev/hidraw0

# 4. Set permissions
sudo chmod 666 /dev/hidraw0
# Or create udev rule for persistence:
echo 'ATTRS{idVendor}=="0665", ATTRS{idProduct}=="5161", MODE="0666", SYMLINK+="inverter"' | \
  sudo tee /etc/udev/rules.d/99-voltronic.rules
sudo udevadm control --reload-rules
```

### Option B: RS232 Serial Connection

If USB is occupied by M4, you may need to use RS232.

#### Hardware Required

| Item | Approx Cost | Notes |
|------|-------------|-------|
| USB to RS232 adapter | £8-15 | FTDI chip recommended |
| RS232 cable/adapter | £5-10 | DB9 or RJ45 depending on inverter |
| Null modem adapter | £3-5 | May be needed |

#### Wiring (if RJ45 connector)

```
RJ45 Pin    Function     USB-RS232 Adapter
────────    ────────     ─────────────────
Pin 1       GND          GND
Pin 2       GND          GND  
Pin 3       TX           RX (cross over)
Pin 4       RX           TX (cross over)
Pin 5-8     Not used     -

Note: TX/RX may need swapping - try both if no response
```

#### Connection Settings

```
Baud Rate:  2400 (some models use 9600 or 19200)
Data Bits:  8
Stop Bits:  1
Parity:     None
Flow Ctrl:  None
```

### Option C: Intercept Existing M4 Connection

If M4 is using the only available port, you can intercept it.

#### Method 1: Y-Splitter (Listen Only)

```
                    ┌──────────────┐
Inverter ──────────►│  Y-Splitter  │
    RS232           │              │
                    │  ┌───────────┼──► M4 Controller (original)
                    │  │           │
                    │  └───────────┼──► Your Pi (listen only)
                    └──────────────┘

Note: This only lets you READ data, not send commands
```

#### Method 2: Man-in-the-Middle (Full Control)

```
                    ┌──────────────────┐
Inverter ──────────►│    Your Pi       │──────────► M4 Controller
    RS232           │  (serial proxy)  │    RS232
                    │                  │
                    │  Passes through  │
                    │  + logs traffic  │
                    │  + can inject    │
                    └──────────────────┘
```

**Hardware for MITM:**
- 2x USB-RS232 adapters (one for inverter, one for M4)
- Your Raspberry Pi or similar

**Software (Python serial proxy):**

```python
#!/usr/bin/env python3
"""
Serial proxy for intercepting Powervault M4 <-> Iconica communication
"""
import serial
import threading
import logging
from datetime import datetime

# Configuration
INVERTER_PORT = '/dev/ttyUSB0'  # Connection to inverter
M4_PORT = '/dev/ttyUSB1'        # Connection to M4 controller
BAUD_RATE = 2400
LOG_FILE = '/var/log/pv3_serial.log'

logging.basicConfig(
    filename=LOG_FILE,
    level=logging.DEBUG,
    format='%(asctime)s %(message)s'
)

def forward(src, dst, name):
    """Forward data from src to dst, logging everything"""
    while True:
        try:
            data = src.read(1)
            if data:
                # Accumulate until CR (end of command)
                buffer = data
                while not buffer.endswith(b'\r'):
                    buffer += src.read(1)
                
                logging.info(f"{name}: {buffer.hex()} = {buffer}")
                dst.write(buffer)
        except Exception as e:
            logging.error(f"{name} error: {e}")

def main():
    inverter = serial.Serial(INVERTER_PORT, BAUD_RATE, timeout=1)
    m4 = serial.Serial(M4_PORT, BAUD_RATE, timeout=1)
    
    # Forward in both directions
    t1 = threading.Thread(target=forward, args=(inverter, m4, "INV->M4"))
    t2 = threading.Thread(target=forward, args=(m4, inverter, "M4->INV"))
    
    t1.start()
    t2.start()
    
    print("Serial proxy running. Press Ctrl+C to stop.")
    t1.join()
    t2.join()

if __name__ == '__main__':
    main()
```

---

## Part 3: P18 Protocol Command Reference

### Communication Format

All P18 commands follow this structure:

```
^Pnnncommand<CR>
│││││
│││└┴─── Command string
││└───── Length of command + CR (3 digits)
│└────── 'P' for commands, 'S' for settings, 'D' for data
└─────── Start character (caret)

Response: (data...CRC<CR>
```

### Essential Commands for Battery Control

#### Query Commands (Read Status)

| Command | Description | Example Response |
|---------|-------------|------------------|
| `^P003PI` | Protocol ID | `(PI18` |
| `^P005PIRI` | Device rated info | Detailed specs |
| `^P003GS` | General status | Full status dump |
| `^P004MOD` | Operating mode | Current mode |
| `^P005BATS` | Battery status | SOC, voltage, current |
| `^P003ET` | Total energy | kWh totals |
| `^P004FLAG` | Device flags | Enabled features |

#### Status Query (Most Important)

```bash
# Send: ^P003GS
# Response contains:
#   - Grid voltage/frequency
#   - AC output voltage/frequency  
#   - Load watts/VA/percent
#   - Battery voltage/current/SOC
#   - Charging current
#   - Temperature
#   - PV voltage/current/power
#   - Operating mode flags
```

### Control Commands (Write Settings)

#### Output Source Priority

| Command | Priority | Description |
|---------|----------|-------------|
| `^S007POP00` | UTI | Utility first (grid priority) |
| `^S007POP01` | SOL | Solar first |
| `^S007POP02` | SBU | Solar → Battery → Utility |

**For your Octopus Go schedule:**
- 02:00-05:30: `^S007POP00` (force grid charging)
- 05:30-23:30: `^S007POP02` (battery/solar priority)

#### Charger Source Priority

| Command | Priority | Description |
|---------|----------|-------------|
| `^S007PCP00` | CSO | Utility first |
| `^S007PCP01` | SNU | Solar first |
| `^S007PCP02` | OSO | Solar + Utility |
| `^S007PCP03` | ONL | Solar only |

#### Battery Charging Settings

```bash
# Set max charging current (e.g., 60A)
^S010MUCHGC060

# Set AC charging current (e.g., 30A) 
^S010MCHGC030

# Set battery re-charge voltage (when to start charging from grid)
# 48V system: 44-51V
^S008PBCV48

# Set battery re-discharge voltage (when to switch back to battery)
# 48V system: 48-58V  
^S008PBDV54

# Set battery cut-off voltage (low voltage disconnect)
^S008PSDV45.0

# Set float voltage
^S009PBFT53.5

# Set bulk/CV voltage
^S009PCVV54.0
```

#### AC Charge Time Window (Force Charge Schedule)

```bash
# Enable AC charging during time window
^S013PCHT1,02:00,05:30

# Disable AC charge time
^S006PCHT0

# Set AC charge time bucket (alternative)
^S012ACCT02:0005:30
```

#### Battery Discharge Control

```bash
# Set max discharge current (e.g., 120A)
^S013PBATMAXDISC120

# Enable/disable battery discharge
^S010PBATCD111
# Format: PBATCD<a><b><c>
#   a: Enable grid charge (0/1)
#   b: Enable discharge to load (0/1)
#   c: Enable feed-in to grid (0/1)

# Examples:
^S010PBATCD111  # All enabled
^S010PBATCD100  # Grid charge only (force charge mode)
^S010PBATCD011  # Discharge enabled, no grid charge
^S010PBATCD000  # All disabled (hold battery)
```

### CRC Calculation

P18 protocol uses CRC-XMODEM (polynomial 0x1021):

```python
def calculate_crc(data: bytes) -> int:
    """Calculate CRC-XMODEM for P18 protocol"""
    crc = 0
    for byte in data:
        crc ^= byte << 8
        for _ in range(8):
            if crc & 0x8000:
                crc = (crc << 1) ^ 0x1021
            else:
                crc <<= 1
            crc &= 0xFFFF
    return crc

def encode_command(cmd: str) -> bytes:
    """Encode a P18 command with CRC"""
    # Add length prefix
    length = len(cmd) + 1  # +1 for CR
    full_cmd = f"^P{length:03d}{cmd}"
    
    # Calculate CRC
    crc = calculate_crc(full_cmd.encode())
    crc_high = (crc >> 8) & 0xFF
    crc_low = crc & 0xFF
    
    # Build final command
    return full_cmd.encode() + bytes([crc_high, crc_low]) + b'\r'
```

---

## Part 4: Complete Python Control Library

### Installation

```bash
pip install pyserial --break-system-packages
```

### Full Control Script

```python
#!/usr/bin/env python3
"""
Powervault P3 / Iconica 5500W / InfiniSolar Direct Control
Uses Voltronic P18 Protocol
"""

import serial
import time
import struct
from typing import Optional, Dict, Any

class PowervaultP3:
    def __init__(self, port: str = '/dev/hidraw0', is_usb: bool = True):
        """
        Initialize connection to inverter
        
        Args:
            port: Device path (/dev/hidraw0 for USB, /dev/ttyUSB0 for serial)
            is_usb: True for USB HID, False for RS232
        """
        self.port = port
        self.is_usb = is_usb
        self.device = None
        
    def connect(self):
        """Open connection to inverter"""
        if self.is_usb:
            # USB HID connection
            self.device = open(self.port, 'r+b', buffering=0)
        else:
            # RS232 serial connection
            self.device = serial.Serial(
                self.port,
                baudrate=2400,
                bytesize=8,
                parity='N',
                stopbits=1,
                timeout=2
            )
    
    def disconnect(self):
        """Close connection"""
        if self.device:
            self.device.close()
            self.device = None
    
    def _crc16_xmodem(self, data: bytes) -> int:
        """Calculate CRC-XMODEM"""
        crc = 0
        for byte in data:
            crc ^= byte << 8
            for _ in range(8):
                if crc & 0x8000:
                    crc = (crc << 1) ^ 0x1021
                else:
                    crc <<= 1
                crc &= 0xFFFF
        return crc
    
    def _encode_command(self, cmd: str) -> bytes:
        """Encode command with length prefix and CRC"""
        length = len(cmd) + 1
        full_cmd = f"^P{length:03d}{cmd}"
        crc = self._crc16_xmodem(full_cmd.encode())
        return full_cmd.encode() + struct.pack('>H', crc) + b'\r'
    
    def _send_command(self, cmd: str) -> str:
        """Send command and receive response"""
        encoded = self._encode_command(cmd)
        
        if self.is_usb:
            # USB HID requires 8-byte packets
            for i in range(0, len(encoded), 8):
                packet = encoded[i:i+8].ljust(8, b'\x00')
                self.device.write(packet)
            time.sleep(0.1)
            
            # Read response
            response = b''
            while True:
                chunk = self.device.read(8)
                if not chunk:
                    break
                response += chunk
                if b'\r' in chunk:
                    break
        else:
            # RS232 serial
            self.device.write(encoded)
            response = self.device.read_until(b'\r')
        
        # Parse response (remove CRC and CR)
        if response.startswith(b'('):
            return response[1:-3].decode('ascii', errors='ignore')
        return response.decode('ascii', errors='ignore')
    
    # === Query Methods ===
    
    def get_status(self) -> Dict[str, Any]:
        """Get general status (GS command)"""
        response = self._send_command('GS')
        # Parse response into dict
        # Format varies by firmware - this is a general parser
        return {'raw': response}
    
    def get_battery_status(self) -> Dict[str, Any]:
        """Get battery status"""
        response = self._send_command('BATS')
        return {'raw': response}
    
    def get_protocol_id(self) -> str:
        """Get protocol version"""
        return self._send_command('PI')
    
    def get_mode(self) -> str:
        """Get current operating mode"""
        return self._send_command('MOD')
    
    # === Control Methods ===
    
    def set_output_priority(self, priority: str):
        """
        Set output source priority
        
        Args:
            priority: 'UTI' (utility first), 'SOL' (solar first), 'SBU' (solar-battery-utility)
        """
        codes = {'UTI': '00', 'SOL': '01', 'SBU': '02'}
        if priority not in codes:
            raise ValueError(f"Invalid priority. Use: {list(codes.keys())}")
        return self._send_command(f'POP{codes[priority]}')
    
    def set_charger_priority(self, priority: str):
        """
        Set charger source priority
        
        Args:
            priority: 'UTI' (utility first), 'SOL' (solar first), 
                     'MIX' (solar+utility), 'ONL' (solar only)
        """
        codes = {'UTI': '00', 'SOL': '01', 'MIX': '02', 'ONL': '03'}
        if priority not in codes:
            raise ValueError(f"Invalid priority. Use: {list(codes.keys())}")
        return self._send_command(f'PCP{codes[priority]}')
    
    def set_charge_current(self, amps: int):
        """Set maximum charging current (total)"""
        return self._send_command(f'MUCHGC{amps:03d}')
    
    def set_ac_charge_current(self, amps: int):
        """Set AC (grid) charging current"""
        return self._send_command(f'MCHGC{amps:03d}')
    
    def set_battery_recharge_voltage(self, volts: float):
        """Set voltage at which to start grid charging"""
        return self._send_command(f'PBCV{volts:.1f}')
    
    def set_battery_redischarge_voltage(self, volts: float):
        """Set voltage at which to return to battery mode"""
        return self._send_command(f'PBDV{volts:.1f}')
    
    def set_battery_cutoff_voltage(self, volts: float):
        """Set low voltage disconnect"""
        return self._send_command(f'PSDV{volts:.1f}')
    
    def set_charge_time(self, start: str, end: str, enable: bool = True):
        """
        Set AC charge time window
        
        Args:
            start: Start time (HH:MM format)
            end: End time (HH:MM format)
            enable: Enable or disable the time window
        """
        if enable:
            return self._send_command(f'CHT1,{start},{end}')
        else:
            return self._send_command('CHT0')
    
    def set_battery_discharge_control(self, 
                                       grid_charge: bool = True,
                                       discharge_load: bool = True,
                                       feed_in_grid: bool = False):
        """
        Control battery charge/discharge behavior
        
        Args:
            grid_charge: Allow charging from grid
            discharge_load: Allow discharging to load
            feed_in_grid: Allow feeding back to grid
        """
        flags = f"{int(grid_charge)}{int(discharge_load)}{int(feed_in_grid)}"
        return self._send_command(f'BATCD{flags}')
    
    def force_charge(self):
        """Enable force charge mode (charge from grid immediately)"""
        self.set_output_priority('UTI')
        self.set_charger_priority('UTI')
        self.set_battery_discharge_control(grid_charge=True, discharge_load=False)
    
    def normal_mode(self):
        """Return to normal solar-battery priority mode"""
        self.set_output_priority('SBU')
        self.set_charger_priority('SOL')
        self.set_battery_discharge_control(grid_charge=False, discharge_load=True)


# === Example Usage ===

if __name__ == '__main__':
    # Connect via USB
    pv = PowervaultP3('/dev/hidraw0', is_usb=True)
    
    # Or via RS232
    # pv = PowervaultP3('/dev/ttyUSB0', is_usb=False)
    
    try:
        pv.connect()
        
        # Get status
        print("Protocol:", pv.get_protocol_id())
        print("Mode:", pv.get_mode())
        print("Status:", pv.get_status())
        
        # Set Octopus Go schedule
        # Force charge from 02:00 to 05:30
        pv.set_charge_time('02:00', '05:30', enable=True)
        
        # Switch to force charge
        pv.force_charge()
        
        # After off-peak, return to normal
        # pv.normal_mode()
        
    finally:
        pv.disconnect()
```

---

## Part 5: Home Assistant Integration

### Using the Control Script with Home Assistant

Create a shell script wrapper:

```bash
#!/bin/bash
# /usr/local/bin/pv3_control.sh

SCRIPT_DIR="/opt/powervault"
PYTHON="/usr/bin/python3"

case "$1" in
    force_charge)
        $PYTHON $SCRIPT_DIR/control.py --force-charge
        ;;
    normal)
        $PYTHON $SCRIPT_DIR/control.py --normal-mode
        ;;
    status)
        $PYTHON $SCRIPT_DIR/control.py --status
        ;;
    *)
        echo "Usage: $0 {force_charge|normal|status}"
        exit 1
        ;;
esac
```

### Home Assistant Configuration

```yaml
# configuration.yaml

shell_command:
  pv3_force_charge: "/usr/local/bin/pv3_control.sh force_charge"
  pv3_normal_mode: "/usr/local/bin/pv3_control.sh normal"

automation:
  # Octopus Go: Force charge at 02:00
  - alias: "PV3 Octopus Go Start"
    trigger:
      - platform: time
        at: "02:00:00"
    action:
      - service: shell_command.pv3_force_charge
  
  # Octopus Go: Return to normal at 05:30
  - alias: "PV3 Octopus Go End"
    trigger:
      - platform: time
        at: "05:30:00"
    action:
      - service: shell_command.pv3_normal_mode

# Input buttons for manual control
input_button:
  pv3_force_charge:
    name: "Force Charge Battery"
    icon: mdi:battery-charging
  
  pv3_normal_mode:
    name: "Normal Mode"
    icon: mdi:battery
```

---

## Part 6: Decision Tree - What To Do

```
                        START
                          │
                          ▼
              ┌───────────────────────┐
              │  Can you physically   │
              │  access the P3?       │
              └───────────┬───────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
             YES                      NO
              │                       │
              ▼                       ▼
    ┌─────────────────┐     ┌─────────────────────┐
    │ Extract SD card │     │ Wait until you can, │
    │ (30 minutes)    │     │ or try remote SSH   │
    └────────┬────────┘     │ brute force (risky) │
             │              └─────────────────────┘
             ▼
    ┌─────────────────┐
    │ Found Flask     │
    │ auth code?      │
    └────────┬────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
   YES                NO
    │                 │
    ▼                 ▼
  ┌─────────────┐   ┌─────────────────────────┐
  │ Use local   │   │ Look for direct USB/    │
  │ web API!    │   │ serial port on inverter │
  │ (easiest)   │   └────────────┬────────────┘
  └─────────────┘                │
                                 ▼
                    ┌─────────────────────────┐
                    │ USB port visible and    │
                    │ not used by M4?         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
                   YES                        NO
                    │                         │
                    ▼                         ▼
           ┌──────────────┐        ┌──────────────────┐
           │ Connect USB  │        │ Serial intercept │
           │ Use P18      │        │ (MITM) required  │
           │ protocol     │        │ More complex     │
           └──────────────┘        └──────────────────┘
```

---

## Summary: Recommended Action Plan

### Phase 1: SD Card (Do This First)
1. Power down P3
2. Remove SD card from M4 Raspberry Pi
3. Copy entire card image
4. Extract Flask app and find authentication method
5. Add your SSH key for future access
6. Reinstall SD card

### Phase 2: Assess Connection Options
1. With SSH access, examine how M4 talks to inverter
2. Check if USB port is available on inverter front
3. If USB free: connect directly
4. If USB occupied: consider serial intercept or sharing

### Phase 3: Implement Control
1. Install control script on your energy server
2. Configure Home Assistant automation
3. Test with manual commands first
4. Implement Octopus Go schedule

### Fallback: If All Else Fails
- The existing schedule will keep running after cloud dies
- Modbus card + energy meter (£205 total) gives self-consumption control
- Full inverter replacement remains an option (£800-1400)

---

## Quick Reference Card

### P18 Commands Cheat Sheet

```
Query Status:        ^P003GS
Battery Status:      ^P005BATS
Set Priority UTI:    ^S007POP00
Set Priority SBU:    ^S007POP02
Set Charger Solar:   ^S007PCP01
Force Charge:        ^S010PBATCD100
Normal Discharge:    ^S010PBATCD011
Set Charge Time:     ^S013PCHT1,02:00,05:30
```

### Serial Settings

```
Baud:    2400 (or 9600/19200)
Bits:    8
Parity:  None
Stop:    1
Flow:    None
```

### USB Device

```
Vendor:  0665 (Cypress/Voltronic)
Product: 5161
Device:  /dev/hidraw0
```

---

*Document Version 1.0 - 14 December 2025*
