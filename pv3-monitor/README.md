# PV3 Monitor

A full-stack web application for monitoring Powervault P3 battery systems via MQTT. Built with FastAPI, React/TypeScript, and TimescaleDB.

![PV3 Monitor Dashboard](https://img.shields.io/badge/status-active-success)
![Docker](https://img.shields.io/badge/docker-ready-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- Real-time monitoring via MQTT and WebSocket
- Historical data charts with browser-based storage
- Battery health tracking (SOH, cycles, cell voltages)
- Power flow visualization with animated indicators
- Temperature monitoring (cells, BMS, inverter)
- Alarm and warning system
- Energy totals (daily import/export/charge/discharge)
- Mobile-optimized responsive design
- Dark theme UI
- Export historical data to CSV

## System Requirements

### Debian/Ubuntu Server

- Debian 11+ or Ubuntu 20.04+
- Docker 20.10+
- Docker Compose v2.0+
- 2GB RAM minimum
- 10GB disk space
- Network access to Powervault P3 on local network

### Powervault P3

- P3 unit with MQTT broker enabled (default)
- Network connectivity to server
- Device ID (found in MQTT topics, e.g., `PV001001DEV`)

## Installation on Debian

### 1. Install Docker and Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

Log out and back in for group membership to take effect.

### 2. Clone the Repository

```bash
cd ~
git clone https://github.com/kevin-bird/powervault-p3-local.git
cd powervault-p3-local/pv3-monitor
```

### 3. Configure Environment

```bash
# Copy environment template
cp env.example .env

# Edit configuration
nano .env
```

Update these values in `.env`:

```bash
# Your P3's IP address
MQTT_HOST=192.168.1.215

# Your P3's device ID (check MQTT topics)
P3_DEVICE_ID=PV001001DEV

# API port (change if 8800 is in use)
API_PORT=8800

# Frontend URLs (use your server's IP)
VITE_API_URL=http://192.168.1.6:8800
VITE_WS_URL=ws://192.168.1.6:8800
```

### 4. Start Docker Services

```bash
# Build and start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### 5. Install MQTT Collector Service

The collector runs as a systemd service to capture MQTT data and send it to the API.

```bash
cd collector

# Install Python dependencies
pip3 install --break-system-packages -r requirements.txt

# Make scripts executable
chmod +x install.sh mqtt_collector.py

# Install systemd service
./install.sh
```

Enter your sudo password when prompted.

### 6. Verify Installation

Check all services are running:

```bash
# Docker containers
docker compose ps

# Collector service
sudo systemctl status pv3-collector

# API health
curl http://localhost:8800/health
```

Expected response:
```json
{"status":"healthy","mqtt_connected":true}
```

### 7. Access the Dashboard

Open your browser and navigate to:

```
http://YOUR_SERVER_IP:5173
```

Example: `http://192.168.1.6:5173`

## Architecture

```
Powervault P3 (MQTT) → Collector Service → API (FastAPI) → Database (TimescaleDB)
                                              ↓
                                         WebSocket
                                              ↓
                                    Frontend (React) → Browser
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 5173 | React dashboard |
| Backend API | 8800 | FastAPI REST + WebSocket |
| Database | 5433 | PostgreSQL/TimescaleDB (internal) |
| MQTT Collector | - | Systemd service |

## Managing Services

### Docker Services

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Restart a service
docker compose restart backend
docker compose restart frontend

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Rebuild after code changes
docker compose up -d --build
```

### MQTT Collector

```bash
# Check status
sudo systemctl status pv3-collector

# Start/stop/restart
sudo systemctl start pv3-collector
sudo systemctl stop pv3-collector
sudo systemctl restart pv3-collector

# View logs
sudo journalctl -u pv3-collector -f

# View recent errors
sudo journalctl -u pv3-collector -n 50
```

## Data Storage

### TimescaleDB (Server)
- Real-time measurements from MQTT collector
- Full historical data
- Accessible via API

### IndexedDB (Browser)
- Last 7 days of minute-level data
- Used for historical charts
- Automatic cleanup of old data
- ~5-10 MB storage

## Configuration

### Environment Variables

See `env.example` for all available options:

- `MQTT_HOST` - P3 IP address
- `MQTT_PORT` - MQTT port (default: 1883)
- `P3_DEVICE_ID` - Your P3 device ID
- `DATABASE_URL` - PostgreSQL connection string
- `API_PORT` - Backend API port
- `VITE_API_URL` - Frontend API endpoint
- `VITE_WS_URL` - WebSocket endpoint

### Changing Ports

If default ports conflict with existing services:

1. Edit `.env` file
2. Edit `docker-compose.yml` port mappings
3. Restart services: `docker compose down && docker compose up -d`

## Troubleshooting

### Dashboard Shows "Failed to fetch"

1. Check API is running: `curl http://localhost:8800/health`
2. Check CORS settings in `backend/app/main.py`
3. Verify `VITE_API_URL` uses correct server IP
4. Restart frontend: `docker compose restart frontend`

### No Data in Dashboard

1. Check collector is running: `sudo systemctl status pv3-collector`
2. Check collector logs: `sudo journalctl -u pv3-collector -f`
3. Verify MQTT connection: `mosquitto_sub -h YOUR_P3_IP -t 'pv/#' -v`
4. Check API has data: `curl http://localhost:8800/api/devices/PV001001DEV/current`

### Collector Not Starting

1. Check Python dependencies: `pip3 list | grep -E 'paho|requests'`
2. Check API is accessible: `curl http://localhost:8800/`
3. View error logs: `sudo journalctl -u pv3-collector -n 50`

### Frontend Container Won't Start

1. Check port 5173 is free: `sudo lsof -i :5173`
2. View container logs: `docker compose logs frontend`
3. Rebuild: `docker compose up -d --build frontend`

### Database Connection Issues

1. Check database is healthy: `docker compose ps db`
2. Check port 5433 is free: `sudo lsof -i :5433`
3. View database logs: `docker compose logs db`

## Development

### Backend Development

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run locally (without Docker)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8800
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

### Collector Development

```bash
cd collector

# Test locally
python3 mqtt_collector.py

# Monitor output
# Press Ctrl+C to stop
```

## API Documentation

Interactive API documentation available at:

```
http://YOUR_SERVER_IP:8800/docs
```

### Key Endpoints

- `GET /api/devices` - List all devices
- `GET /api/devices/{id}/current` - Current measurements
- `GET /api/devices/{id}/history` - Historical data
- `POST /api/devices/{id}/measurements/batch` - Store measurements
- `GET /api/devices/{id}/alarms` - Alarm status
- `WS /api/ws/devices/{id}` - WebSocket real-time updates

## Updating

### Pull Latest Changes

```bash
cd ~/powervault-p3-local/pv3-monitor
git pull origin main
```

### Update Backend

```bash
docker compose down
docker compose up -d --build backend
```

### Update Frontend

```bash
docker compose down
docker compose up -d --build frontend
```

### Update Collector

```bash
cd collector
sudo systemctl stop pv3-collector
# Update files from git
sudo systemctl start pv3-collector
```

## Backup

### Database Backup

```bash
# Backup database
docker compose exec db pg_dump -U pv3monitor pv3monitor > backup_$(date +%Y%m%d).sql

# Restore database
cat backup_20250120.sql | docker compose exec -T db psql -U pv3monitor pv3monitor
```

### Configuration Backup

```bash
# Backup .env and docker-compose.yml
cp .env .env.backup
cp docker-compose.yml docker-compose.yml.backup
```

## Uninstall

```bash
# Stop and remove all containers
cd ~/powervault-p3-local/pv3-monitor
docker compose down -v

# Remove collector service
sudo systemctl stop pv3-collector
sudo systemctl disable pv3-collector
sudo rm /etc/systemd/system/pv3-collector.service
sudo systemctl daemon-reload

# Remove project directory
cd ~
rm -rf powervault-p3-local/pv3-monitor
```

## Project Structure

```
pv3-monitor/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py      # App entry point
│   │   ├── models/      # Database models
│   │   ├── routers/     # API endpoints
│   │   ├── schemas/     # Pydantic schemas
│   │   └── services/    # MQTT client
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API client, IndexedDB
│   │   └── types/       # TypeScript types
│   ├── package.json
│   └── Dockerfile
├── collector/           # MQTT data collector
│   ├── mqtt_collector.py
│   ├── pv3-collector.service
│   └── install.sh
├── docker-compose.yml   # Orchestration
├── env.example          # Configuration template
└── README.md
```

## Technology Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy, Paho-MQTT
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts
- **Database**: PostgreSQL 16, TimescaleDB
- **Message Broker**: Eclipse Mosquitto (optional, connects to P3 directly)
- **Storage**: IndexedDB (Dexie.js) for browser-side historical data

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) in the parent repository.

## License

MIT License - see [LICENSE](../LICENSE) file.

## Acknowledgements

- Powervault owners community for MQTT topic documentation
- [powervault-p3-local](https://github.com/kevin-bird/powervault-p3-local) project for Home Assistant integration guides

## Support

- GitHub Issues: [Report bugs or request features](https://github.com/kevin-bird/powervault-p3-local/issues)
- Community: [Powervault Owners Facebook Group](https://www.facebook.com/groups/powervaultowners)

---

**Note**: This is an unofficial community project for monitoring Powervault P3 systems after the company entered administration. Use at your own risk.

