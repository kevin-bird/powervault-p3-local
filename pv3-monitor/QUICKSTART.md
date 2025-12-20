# PV3 Monitor - Quick Start Guide

## System Status

All services are running on kevin@energy (192.168.1.6)

| Service | Status | URL/Port |
|---------|--------|----------|
| Frontend | Running | http://192.168.1.6:5173 |
| Backend API | Running | http://192.168.1.6:8800 |
| API Docs | Running | http://192.168.1.6:8800/docs |
| Database | Running | localhost:5433 (internal) |
| MQTT Collector | Running | Systemd service |
| P3 Connection | Connected | 192.168.1.215:1883 |

## Access the Dashboard

Open in your browser:
```
http://192.168.1.6:5173
```

## Current Data Being Collected

- Battery Voltage: 47.6V
- Battery Current: 0.0A
- Grid Power: -676W (exporting to grid)
- House Power: 32W
- Cell Temperature: 17.7°C
- State of Health: 92%
- Schedule Event: 0 (Idle)

## Manage Services

### Docker Services (API + Frontend)

```bash
# View all container status
docker compose -f ~/pv3-monitor/docker-compose.yml ps

# View backend logs
docker compose -f ~/pv3-monitor/docker-compose.yml logs -f backend

# View frontend logs  
docker compose -f ~/pv3-monitor/docker-compose.yml logs -f frontend

# Restart services
docker compose -f ~/pv3-monitor/docker-compose.yml restart

# Stop all
docker compose -f ~/pv3-monitor/docker-compose.yml down
```

### MQTT Collector Service

```bash
# Check status
sudo systemctl status pv3-collector

# View live logs
sudo journalctl -u pv3-collector -f

# Restart
sudo systemctl restart pv3-collector

# Stop
sudo systemctl stop pv3-collector

# Start
sudo systemctl start pv3-collector
```

## API Examples

### Get Current Measurements

```bash
curl http://localhost:8800/api/devices/PV001001DEV/current | python3 -m json.tool
```

### Get Historical Data

```bash
# Get power data for last hour
curl "http://localhost:8800/api/devices/PV001001DEV/history?metrics=grid_power,house_power,battery_power&start=2025-12-19T22:00:00Z&end=2025-12-19T23:59:00Z" | python3 -m json.tool
```

### Get Alarm Status

```bash
curl http://localhost:8800/api/devices/PV001001DEV/alarms | python3 -m json.tool
```

## Troubleshooting

### Collector Not Storing Data

Check logs for errors:
```bash
sudo journalctl -u pv3-collector -n 50
```

### API Not Responding

Check backend container:
```bash
docker compose -f ~/pv3-monitor/docker-compose.yml logs backend --tail 50
```

### Frontend Not Loading

Check frontend container:
```bash
docker compose -f ~/pv3-monitor/docker-compose.yml logs frontend --tail 20
```

### No Data in Dashboard

1. Verify collector is running: `sudo systemctl status pv3-collector`
2. Check API has data: `curl http://localhost:8800/api/devices/PV001001DEV/current`
3. Check browser console for errors (F12)

## Known Issues

Some metrics show `null` because:
- `soc` - Topic `bms/soc` format needs verification
- `battery_power` - Topic `inverter/charge` might be list format
- `inverter_temp` - Topic `inverter/alarms` might need different parsing
- `solar_power` - Not available if no solar panels

These can be fixed by examining actual MQTT messages:
```bash
mosquitto_sub -h 192.168.1.215 -t 'pv/PV3/PV001001DEV/bms/soc' -C 1
mosquitto_sub -h 192.168.1.215 -t 'pv/PV3/PV001001DEV/inverter/charge' -C 1
mosquitto_sub -h 192.168.1.215 -t 'pv/PV3/PV001001DEV/inverter/alarms' -C 1
```

## Next Steps

1. Fix null metrics by examining actual MQTT payloads
2. Add historical charts (Phase 6)
3. Add alarm banner when alarms active
4. Add energy totals (daily/weekly/monthly)
5. Add authentication (when needed for remote access)

