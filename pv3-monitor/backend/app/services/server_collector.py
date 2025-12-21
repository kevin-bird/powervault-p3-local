import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Optional
import asyncio_mqtt as aiomqtt
import paho.mqtt.client as paho
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_maker
from app.models.measurement import Measurement
from app.models.device import Device

logger = logging.getLogger(__name__)

# aiomqtt with paho-mqtt>=2.1.0 lacks message_retry_set; add no-op to avoid AttributeError
if not hasattr(paho.Client, "message_retry_set"):
    setattr(paho.Client, "message_retry_set", lambda self, *_, **__: None)


class ServerMQTTCollector:
    """Server-side MQTT collector that runs 24/7 independent of browser."""
    
    def __init__(self, broker_host: str, device_id: str, port: int = 1883, interval: int = 5):
        self.broker_host = broker_host
        self.device_id = device_id
        self.port = port
        self.interval = interval  # Store interval in seconds
        self.running = False
        self.current_data = {}
        self.last_store = None
        self.messages_received = 0
        
    async def start(self):
        """Start the MQTT collector service."""
        self.running = True
        logger.info(f"Starting server MQTT collector for {self.device_id} at {self.broker_host}:{self.port}")
        logger.info(f"Collection interval: {self.interval} seconds")
        
        while self.running:
            try:
                async with aiomqtt.Client(self.broker_host, self.port) as client:
                    topic = f"pv/PV3/{self.device_id}/#"
                    await client.subscribe(topic)
                    logger.info(f"Subscribed to {topic}")
                    
                    async for message in client.messages:
                        await self.handle_message(message)
                        
            except aiomqtt.MqttError as e:
                logger.error(f"MQTT connection error: {e}. Reconnecting in 5s...")
                await asyncio.sleep(5)
            except Exception as e:
                logger.error(f"Unexpected error in collector: {e}. Reconnecting in 5s...")
                await asyncio.sleep(5)
    
    async def stop(self):
        """Stop the collector."""
        self.running = False
        logger.info("Server MQTT collector stopped")
    
    async def handle_message(self, message):
        """Process incoming MQTT message and update current_data."""
        topic = str(message.topic)
        self.messages_received += 1
        
        try:
            payload = json.loads(message.payload.decode())
        except json.JSONDecodeError:
            return
        
        # Extract topic suffix
        topic_parts = topic.split("/")
        if len(topic_parts) >= 4:
            topic_suffix = "/".join(topic_parts[3:])
        else:
            return
        
        # Parse based on topic (reuse logic from standalone collector)
        try:
            if topic_suffix == "bms/soc":
                await self._parse_soc(payload)
            elif topic_suffix == "inverter/measurements":
                await self._parse_inverter_measurements(payload)
            elif topic_suffix == "ffr/measurements":
                await self._parse_ffr_measurements(payload)
            elif topic_suffix == "pylontech/info":
                await self._parse_pylontech_info(payload)
            elif topic_suffix == "inverter/charge":
                await self._parse_charge(payload)
            elif topic_suffix == "schedule/event":
                await self._parse_schedule(payload)
        except Exception as e:
            logger.error(f"Error parsing {topic}: {e}")
        
        # Store measurement if interval has passed
        await self._maybe_store_measurement()
    
    async def _parse_soc(self, payload):
        """Parse bms/soc messages."""
        if isinstance(payload, list) and payload:
            payload = payload[0]
        value = payload.get("value")
        if value is not None:
            self.current_data["soc"] = value / 100.0
    
    async def _parse_inverter_measurements(self, payload):
        """Parse inverter/measurements."""
        for item in payload:
            channel = item.get("channel")
            measurement = item.get("measurement")
            value = item.get("value")
            
            if value is None:
                continue
            
            if channel == "BATTERY":
                if measurement == "Voltage":
                    self.current_data["battery_voltage"] = value / 1000.0
                elif measurement == "ChargeCurrent":
                    self.current_data["battery_current"] = value / 1000.0
                elif measurement == "Capacity":
                    self.current_data["battery_capacity"] = value
            elif channel == "GRID":
                if measurement == "Voltage":
                    self.current_data["grid_voltage"] = value / 1000.0
                elif measurement == "Frequency":
                    self.current_data["grid_frequency"] = value / 1000.0
    
    async def _parse_ffr_measurements(self, payload):
        """Parse ffr/measurements (CT clamps)."""
        for item in payload:
            channel = item.get("channel")
            measurement = item.get("measurement")
            value = item.get("value")
            
            if value is None or measurement != "Power":
                continue
            
            # Note: LOCAL=house, HOUSE=grid (swapped)
            if channel == "LOCAL":
                self.current_data["house_power"] = value / 1000.0
            elif channel == "HOUSE":
                self.current_data["grid_power"] = value / 1000.0
    
    async def _parse_pylontech_info(self, payload):
        """Parse pylontech/info."""
        if not isinstance(payload, list):
            return
        
        for item in payload:
            measurement = item.get("measurement")
            value_type = item.get("type")
            value = item.get("value")
            
            if value is None:
                continue
            
            if measurement == "CellTemperature" and value_type == "Avg":
                self.current_data["cell_temp_avg"] = value / 1000.0
            elif measurement == "StateOfHealth" and value_type == "Avg":
                self.current_data["soh"] = value
    
    async def _parse_charge(self, payload):
        """Parse inverter/charge."""
        power = payload.get("power")
        if power is not None:
            self.current_data["battery_power"] = power
    
    async def _parse_schedule(self, payload):
        """Parse schedule/event."""
        event = payload.get("event")
        if event is not None:
            self.current_data["schedule_event"] = event
    
    async def _maybe_store_measurement(self):
        """Store measurement if interval has passed."""
        now = datetime.now(timezone.utc)
        
        if self.last_store and (now - self.last_store).total_seconds() < self.interval:
            return
        
        self.last_store = now
        
        # Store in database
        try:
            async with async_session_maker() as session:
                # Ensure device exists
                result = await session.execute(
                    select(Device).where(Device.device_id == self.device_id)
                )
                device = result.scalar_one_or_none()
                if not device:
                    device = Device(device_id=self.device_id)
                    session.add(device)
                    await session.commit()
                
                # Store all current measurements as individual records
                for metric_name, metric_value in self.current_data.items():
                    if metric_value is not None:
                        measurement = Measurement(
                            device_id=self.device_id,
                            timestamp=now,
                            metric_name=metric_name,
                            metric_value=float(metric_value),
                            unit="",  # Could be improved
                            source_topic="server_collector",
                        )
                        session.add(measurement)
                
                await session.commit()
                logger.debug(f"Stored {len(self.current_data)} measurements")
                
        except Exception as e:
            logger.error(f"Failed to store measurement: {e}")


# Global collector instance
_collector: Optional[ServerMQTTCollector] = None
_collector_task: Optional[asyncio.Task] = None


async def start_server_collector(broker_host: str, device_id: str, port: int = 1883, interval: int = 5):
    """Start the global server collector."""
    global _collector, _collector_task
    
    if _collector and _collector.running:
        logger.warning("Server collector already running")
        return
    
    _collector = ServerMQTTCollector(broker_host, device_id, port, interval)
    _collector_task = asyncio.create_task(_collector.start())
    logger.info("Server collector task created")


async def stop_server_collector():
    """Stop the global server collector."""
    global _collector, _collector_task
    
    if _collector:
        await _collector.stop()
        _collector = None
    
    if _collector_task:
        _collector_task.cancel()
        try:
            await _collector_task
        except asyncio.CancelledError:
            pass
        _collector_task = None
    
    logger.info("Server collector stopped and cleaned up")


def get_collector_status() -> dict:
    """Get current collector status."""
    global _collector
    return {
        "running": _collector is not None and _collector.running,
        "last_store": _collector.last_store.isoformat() if _collector and _collector.last_store else None,
        "messages_received": _collector.messages_received if _collector else 0,
        "mqtt_host": _collector.broker_host if _collector else None,
        "device_id": _collector.device_id if _collector else None,
        "interval": _collector.interval if _collector else None,
    }

