# PV3 MQTT Data Collector

This script subscribes to your Powervault P3's MQTT topics and stores the data via the PV3 Monitor API.

## Installation

### 1. Install Dependencies

```bash
cd ~/pv3-monitor/collector
pip3 install --break-system-packages -r requirements.txt
```

### 2. Configure Environment

Edit the systemd service file if needed:
```bash
nano pv3-collector.service
```

Update these environment variables:
- `MQTT_HOST` - Your P3's IP address (default: 192.168.1.215)
- `P3_DEVICE_ID` - Your P3's device ID (default: PV001001DEV)
- `API_URL` - Backend API URL (default: http://localhost:8800)

### 3. Install Service

```bash
chmod +x install.sh
./install.sh
```

Or manually:
```bash
sudo cp pv3-collector.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable pv3-collector
sudo systemctl start pv3-collector
```

## Usage

### Check Status
```bash
sudo systemctl status pv3-collector
```

### View Logs
```bash
sudo journalctl -u pv3-collector -f
```

### Restart Service
```bash
sudo systemctl restart pv3-collector
```

### Stop Service
```bash
sudo systemctl stop pv3-collector
```

## Testing Locally

Before installing as a service, test the collector:

```bash
cd ~/pv3-monitor/collector
export MQTT_HOST=192.168.1.215
export P3_DEVICE_ID=PV001001DEV
export API_URL=http://localhost:8800
python3 mqtt_collector.py
```

Press Ctrl+C to stop.

## How It Works

The collector:
1. Subscribes to `pv/PV3/{device_id}/#`
2. Parses each MQTT message
3. Transforms data to API format
4. POSTs to the backend API
5. Backend stores in TimescaleDB and broadcasts via WebSocket

## Supported Topics

- `bms/soc` → State of Charge
- `inverter/measurements` → Voltage, current, power
- `inverter/alarms` → Alarm states + temperatures
- `inverter/charge` → Battery charge/discharge power
- `pylontech/info` → Battery health (SOH, cycles, cells)
- `ffr/measurements` → CT readings (grid, house, aux)
- `schedule/event` → Current schedule state
- `m4/maxpower` → Power limits
- `eps/status` → EPS reserve and mode

