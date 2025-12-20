#!/bin/bash
# Installation script for PV3 MQTT Collector

set -e

echo "Installing PV3 MQTT Collector..."

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install --break-system-packages -r requirements.txt

# Make collector executable
chmod +x mqtt_collector.py

# Install systemd service
echo "Installing systemd service..."
sudo cp pv3-collector.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable pv3-collector
sudo systemctl start pv3-collector

echo "Installation complete!"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status pv3-collector   # Check status"
echo "  sudo systemctl restart pv3-collector  # Restart service"
echo "  sudo journalctl -u pv3-collector -f   # View logs"

