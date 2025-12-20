import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Callable

import paho.mqtt.client as mqtt

from app.config import settings

logger = logging.getLogger(__name__)


class MQTTService:
    """MQTT client service for receiving P3 data."""

    def __init__(self) -> None:
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect

        self.connected = False
        self.message_handlers: dict[str, Callable] = {}
        self._loop: asyncio.AbstractEventLoop | None = None

    def set_event_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """Set the asyncio event loop for callbacks."""
        self._loop = loop

    def register_handler(self, topic_suffix: str, handler: Callable) -> None:
        """Register a handler for a specific topic suffix."""
        self.message_handlers[topic_suffix] = handler

    def _on_connect(
        self,
        client: mqtt.Client,
        userdata: object,
        flags: mqtt.ConnectFlags,
        rc: mqtt.ReasonCode,
        properties: mqtt.Properties | None,
    ) -> None:
        """Handle MQTT connection."""
        if rc == 0:
            logger.info("Connected to MQTT broker")
            self.connected = True
            # Subscribe to all P3 topics for the configured device
            topic = f"pv/PV3/{settings.p3_device_id}/#"
            client.subscribe(topic)
            logger.info(f"Subscribed to {topic}")
        else:
            logger.error(f"Failed to connect to MQTT broker: {rc}")

    def _on_disconnect(
        self,
        client: mqtt.Client,
        userdata: object,
        flags: mqtt.DisconnectFlags,
        rc: mqtt.ReasonCode,
        properties: mqtt.Properties | None,
    ) -> None:
        """Handle MQTT disconnection."""
        logger.warning(f"Disconnected from MQTT broker: {rc}")
        self.connected = False

    def _on_message(
        self,
        client: mqtt.Client,
        userdata: object,
        msg: mqtt.MQTTMessage,
    ) -> None:
        """Handle incoming MQTT messages."""
        try:
            # Extract topic suffix (e.g., "bms/soc" from "pv/PV3/PV001001DEV/bms/soc")
            topic_parts = msg.topic.split("/")
            if len(topic_parts) >= 4:
                topic_suffix = "/".join(topic_parts[3:])
            else:
                topic_suffix = msg.topic

            # Parse JSON payload
            try:
                payload = json.loads(msg.payload.decode())
            except json.JSONDecodeError:
                payload = msg.payload.decode()

            # Find and call appropriate handler
            handler = self._find_handler(topic_suffix)
            if handler and self._loop:
                asyncio.run_coroutine_threadsafe(
                    handler(settings.p3_device_id, topic_suffix, payload),
                    self._loop,
                )

        except Exception as e:
            logger.error(f"Error processing MQTT message: {e}")

    def _find_handler(self, topic_suffix: str) -> Callable | None:
        """Find the appropriate handler for a topic."""
        # Try exact match first
        if topic_suffix in self.message_handlers:
            return self.message_handlers[topic_suffix]

        # Try prefix match
        for pattern, handler in self.message_handlers.items():
            if topic_suffix.startswith(pattern):
                return handler

        return None

    def connect(self) -> None:
        """Connect to the MQTT broker."""
        logger.info(f"Connecting to MQTT broker at {settings.mqtt_host}:{settings.mqtt_port}")
        self.client.connect(settings.mqtt_host, settings.mqtt_port, keepalive=60)
        self.client.loop_start()

    def disconnect(self) -> None:
        """Disconnect from the MQTT broker."""
        logger.info("Disconnecting from MQTT broker")
        self.client.loop_stop()
        self.client.disconnect()
        self.connected = False


# Topic handler functions
async def handle_soc(device_id: str, topic: str, payload: dict) -> None:
    """Handle bms/soc messages."""
    logger.debug(f"SOC update for {device_id}: {payload}")
    # TODO: Store measurement and broadcast to WebSocket clients


async def handle_inverter_measurements(device_id: str, topic: str, payload: list) -> None:
    """Handle inverter/measurements messages."""
    logger.debug(f"Inverter measurements for {device_id}: {len(payload)} readings")
    # TODO: Parse and store measurements


async def handle_inverter_alarms(device_id: str, topic: str, payload: dict) -> None:
    """Handle inverter/alarms messages."""
    logger.debug(f"Alarms update for {device_id}")
    # TODO: Update alarm states and create events for changes


async def handle_pylontech_info(device_id: str, topic: str, payload: list) -> None:
    """Handle pylontech/info messages."""
    logger.debug(f"Pylontech info for {device_id}")
    # TODO: Store battery health metrics


async def handle_ffr_measurements(device_id: str, topic: str, payload: list) -> None:
    """Handle ffr/measurements messages."""
    logger.debug(f"FFR measurements for {device_id}: {len(payload)} channels")
    # TODO: Store grid/house/aux power measurements


async def handle_schedule_event(device_id: str, topic: str, payload: dict) -> None:
    """Handle schedule/event messages."""
    logger.debug(f"Schedule event for {device_id}: event={payload.get('event')}")
    # TODO: Store schedule state


# Global MQTT service instance
mqtt_service = MQTTService()


def setup_mqtt_handlers() -> None:
    """Register all MQTT topic handlers."""
    mqtt_service.register_handler("bms/soc", handle_soc)
    mqtt_service.register_handler("inverter/measurements", handle_inverter_measurements)
    mqtt_service.register_handler("inverter/alarms", handle_inverter_alarms)
    mqtt_service.register_handler("pylontech/info", handle_pylontech_info)
    mqtt_service.register_handler("ffr/measurements", handle_ffr_measurements)
    mqtt_service.register_handler("schedule/event", handle_schedule_event)

