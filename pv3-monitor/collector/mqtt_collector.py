#!/usr/bin/env python3
"""
PV3 MQTT Data Collector

Subscribes to Powervault P3 MQTT topics and stores data via the PV3 Monitor API.
"""

import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from typing import Any

import paho.mqtt.client as mqtt
import requests

# Configuration
MQTT_HOST = os.getenv("MQTT_HOST", "192.168.1.215")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
P3_DEVICE_ID = os.getenv("P3_DEVICE_ID", "PV001001DEV")
API_URL = os.getenv("API_URL", "http://localhost:8800")

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("/var/log/pv3_collector.log") if os.access("/var/log", os.W_OK) else logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("pv3_collector")


class PV3Collector:
    """MQTT collector for Powervault P3 data."""

    def __init__(self):
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.connected = False
        self._last_soc: float | None = None

        # Outlier filter: ignore any single SOC sample that jumps more than this many percentage points.
        # Intended to smooth rare bad readings (~1 in 20) that are ~10% off.
        self._soc_outlier_threshold_percent = 1.0

    def on_connect(
        self,
        client: mqtt.Client,
        userdata: Any,
        flags: mqtt.ConnectFlags,
        rc: mqtt.ReasonCode,
        properties: mqtt.Properties | None,
    ):
        """Handle MQTT connection."""
        if rc == 0:
            logger.info(f"Connected to MQTT broker at {MQTT_HOST}:{MQTT_PORT}")
            self.connected = True
            # Subscribe to all P3 topics
            topic = f"pv/PV3/{P3_DEVICE_ID}/#"
            client.subscribe(topic)
            logger.info(f"Subscribed to {topic}")
        else:
            logger.error(f"Failed to connect to MQTT broker: {rc}")
            self.connected = False

    def on_disconnect(
        self,
        client: mqtt.Client,
        userdata: Any,
        flags: mqtt.DisconnectFlags,
        rc: mqtt.ReasonCode,
        properties: mqtt.Properties | None,
    ):
        """Handle MQTT disconnection."""
        logger.warning(f"Disconnected from MQTT broker: {rc}")
        self.connected = False

    def on_message(
        self,
        client: mqtt.Client,
        userdata: Any,
        msg: mqtt.MQTTMessage,
    ):
        """Handle incoming MQTT messages."""
        try:
            # Extract topic suffix
            topic_parts = msg.topic.split("/")
            if len(topic_parts) >= 4:
                topic_suffix = "/".join(topic_parts[3:])
            else:
                return

            # Parse JSON payload
            try:
                payload = json.loads(msg.payload.decode())
            except json.JSONDecodeError:
                logger.error(f"Failed to parse JSON from {msg.topic}")
                return

            # Route to appropriate handler
            if topic_suffix == "bms/soc":
                self.handle_soc(payload, msg.topic)
            elif topic_suffix == "inverter/measurements":
                self.handle_inverter_measurements(payload, msg.topic)
            elif topic_suffix == "inverter/alarms":
                self.handle_inverter_alarms(payload, msg.topic)
            elif topic_suffix == "inverter/charge":
                self.handle_inverter_charge(payload, msg.topic)
            elif topic_suffix == "pylontech/info":
                self.handle_pylontech_info(payload, msg.topic)
            elif topic_suffix == "ffr/measurements":
                self.handle_ffr_measurements(payload, msg.topic)
            elif topic_suffix == "schedule/event":
                self.handle_schedule_event(payload, msg.topic)
            elif topic_suffix == "m4/maxpower":
                self.handle_maxpower(payload, msg.topic)
            elif topic_suffix == "eps/status":
                self.handle_eps_status(payload, msg.topic)
            elif topic_suffix == "eps_schedule/event":
                self.handle_eps_schedule(payload, msg.topic)
            elif topic_suffix == "safetycheck/state":
                self.handle_safetycheck(payload, msg.topic)

        except Exception as e:
            logger.error(f"Error processing message from {msg.topic}: {e}", exc_info=True)

    def post_measurements(self, measurements: list[dict], source_topic: str):
        """POST measurements to API."""
        if not measurements:
            return
            
        try:
            url = f"{API_URL}/api/devices/{P3_DEVICE_ID}/measurements/batch"
            response = self.session.post(url, json=measurements)
            response.raise_for_status()
            logger.debug(f"Stored {len(measurements)} measurements from {source_topic}")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 422:
                logger.error(f"Validation error from {source_topic}: {e.response.text}")
                logger.debug(f"Problematic data: {measurements}")
            else:
                logger.error(f"HTTP error storing measurements from {source_topic}: {e}")
        except Exception as e:
            logger.error(f"Failed to store measurements from {source_topic}: {e}")

    def post_alarms(self, alarm_states: dict[str, bool]):
        """POST alarm states to API."""
        try:
            url = f"{API_URL}/api/devices/{P3_DEVICE_ID}/alarms"
            response = self.session.post(url, json=alarm_states)
            response.raise_for_status()
            logger.debug(f"Updated {len(alarm_states)} alarm states")
        except Exception as e:
            logger.error(f"Failed to update alarm states: {e}")

    # Topic Handlers

    def handle_soc(self, payload: dict | list, topic: str):
        """Handle bms/soc messages."""
        # BMS SoC is a list of measurements
        if isinstance(payload, list):
            for item in payload:
                if item.get("measurement") == "StateOfCharge":
                    value = item.get("value")
                    if value is not None:
                        # Convert from integer (1100 = 11.00%)
                        soc = value / 100.0
                        if self._last_soc is not None and abs(soc - self._last_soc) > self._soc_outlier_threshold_percent:
                            logger.warning(
                                "SOC outlier detected: prev=%.2f%% new=%.2f%% (Δ=%.2f%%). Keeping previous SOC.",
                                self._last_soc,
                                soc,
                                abs(soc - self._last_soc),
                            )
                            self.post_measurements(
                                [
                                    {
                                        "metric_name": "soc_raw",
                                        "metric_value": soc,
                                        "unit": "%",
                                        "source_topic": topic,
                                    },
                                    {
                                        "metric_name": "soc",
                                        "metric_value": self._last_soc,
                                        "unit": "%",
                                        "source_topic": topic,
                                    },
                                ],
                                topic,
                            )
                        else:
                            self._last_soc = soc
                            self.post_measurements(
                                [
                                    {
                                        "metric_name": "soc",
                                        "metric_value": soc,
                                        "unit": "%",
                                        "source_topic": topic,
                                    }
                                ],
                                topic,
                            )
                    return
        else:
            # Legacy dict format support
            usable_soc = payload.get("usable_soc") or payload.get("StateOfCharge")
            if usable_soc is not None:
                soc = usable_soc / 100.0
                if self._last_soc is not None and abs(soc - self._last_soc) > self._soc_outlier_threshold_percent:
                    logger.warning(
                        "SOC outlier detected (legacy): prev=%.2f%% new=%.2f%% (Δ=%.2f%%). Keeping previous SOC.",
                        self._last_soc,
                        soc,
                        abs(soc - self._last_soc),
                    )
                    self.post_measurements(
                        [
                            {
                                "metric_name": "soc_raw",
                                "metric_value": soc,
                                "unit": "%",
                                "source_topic": topic,
                            },
                            {
                                "metric_name": "soc",
                                "metric_value": self._last_soc,
                                "unit": "%",
                                "source_topic": topic,
                            },
                        ],
                        topic,
                    )
                else:
                    self._last_soc = soc
                    self.post_measurements(
                        [
                            {
                                "metric_name": "soc",
                                "metric_value": soc,
                                "unit": "%",
                                "source_topic": topic,
                            }
                        ],
                        topic,
                    )

    def handle_inverter_measurements(self, payload: list[dict], topic: str):
        """Handle inverter/measurements messages."""
        measurements = []
        
        for item in payload:
            channel = item.get("channel", "")
            measurement = item.get("measurement", "")
            value = item.get("value")
            unit = item.get("unit", "")

            if value is None:
                continue

            # Map channels and measurements to metric names
            if channel == "BATTERY":
                if measurement == "Voltage":
                    measurements.append({
                        "metric_name": "battery_voltage",
                        "metric_value": value / 1000.0,  # mV to V
                        "unit": "V",
                        "source_topic": topic,
                    })
                elif measurement == "ChargeCurrent":
                    measurements.append({
                        "metric_name": "battery_current",
                        "metric_value": value / 1000.0,  # mA to A
                        "unit": "A",
                        "source_topic": topic,
                    })
                elif measurement == "Capacity":
                    measurements.append({
                        "metric_name": "battery_capacity",
                        "metric_value": value,
                        "unit": "%",
                        "source_topic": topic,
                    })
            elif channel == "GRID":
                if measurement == "Voltage" and item.get("type") == "Ac":
                    measurements.append({
                        "metric_name": "grid_voltage",
                        "metric_value": value / 1000.0,
                        "unit": "V",
                        "source_topic": topic,
                    })
                elif measurement == "Frequency":
                    measurements.append({
                        "metric_name": "grid_frequency",
                        "metric_value": value / 1000.0,
                        "unit": "Hz",
                        "source_topic": topic,
                    })
                elif measurement == "Power" and item.get("type") == "Active":
                    measurements.append({
                        "metric_name": "grid_power",
                        "metric_value": value / 1000.0,  # mW to W
                        "unit": "W",
                        "source_topic": topic,
                    })

        if measurements:
            self.post_measurements(measurements, topic)

    def handle_inverter_alarms(self, payload: dict, topic: str):
        """Handle inverter/alarms messages."""
        # Extract alarm flags (excluding temperature fields)
        exclude_keys = ["timestamp", "warnings_summary", "inverter_temperature", "boost_temperature", "inner_temperature"]
        alarm_states = {}
        measurements = []

        for key, value in payload.items():
            if key in exclude_keys:
                # Store temperatures as measurements
                if "temperature" in key:
                    try:
                        temp_value = float(value)
                        measurements.append({
                            "metric_name": key,
                            "metric_value": temp_value,
                            "unit": "C",
                            "source_topic": topic,
                        })
                    except (ValueError, TypeError):
                        pass
            else:
                # Alarm flag
                alarm_states[key] = value == "1"

        if alarm_states:
            self.post_alarms(alarm_states)
        
        if measurements:
            self.post_measurements(measurements, topic)

    def handle_inverter_charge(self, payload: dict, topic: str):
        """Handle inverter/charge messages."""
        power = payload.get("power")
        if power is not None:
            self.post_measurements([{
                "metric_name": "battery_power",
                "metric_value": power,
                "unit": "W",
                "source_topic": topic,
            }], topic)

    def handle_pylontech_info(self, payload: list[dict], topic: str):
        """Handle pylontech/info messages."""
        measurements = []

        for item in payload:
            measurement_type = item.get("measurement")
            value_type = item.get("type")
            value = item.get("value")

            if value is None:
                continue

            # Map Pylontech measurements
            if measurement_type == "StateOfHealth":
                if value_type == "Avg":
                    measurements.append({
                        "metric_name": "soh",
                        "metric_value": float(value),
                        "unit": "%",
                        "source_topic": topic,
                    })
                elif value_type == "Min":
                    measurements.append({
                        "metric_name": "soh_min",
                        "metric_value": float(value),
                        "unit": "%",
                        "source_topic": topic,
                    })
            elif measurement_type == "CycleNumber":
                if value_type == "Avg":
                    measurements.append({
                        "metric_name": "cycle_count_avg",
                        "metric_value": float(value),
                        "unit": "cycles",
                        "source_topic": topic,
                    })
                elif value_type == "Max":
                    measurements.append({
                        "metric_name": "cycle_count_max",
                        "metric_value": float(value),
                        "unit": "cycles",
                        "source_topic": topic,
                    })
            elif measurement_type == "CellTemperature":
                if value_type == "Avg":
                    measurements.append({
                        "metric_name": "cell_temp_avg",
                        "metric_value": value / 1000.0,  # mC to C
                        "unit": "C",
                        "source_topic": topic,
                    })
                elif value_type == "Max":
                    measurements.append({
                        "metric_name": "cell_temp_max",
                        "metric_value": value / 1000.0,
                        "unit": "C",
                        "source_topic": topic,
                    })
                elif value_type == "Min":
                    measurements.append({
                        "metric_name": "cell_temp_min",
                        "metric_value": value / 1000.0,
                        "unit": "C",
                        "source_topic": topic,
                    })
            elif measurement_type == "BMSTemperature":
                if value_type == "Avg":
                    measurements.append({
                        "metric_name": "bms_temp_avg",
                        "metric_value": value / 1000.0,
                        "unit": "C",
                        "source_topic": topic,
                    })
                elif value_type == "Max":
                    measurements.append({
                        "metric_name": "bms_temp_max",
                        "metric_value": value / 1000.0,
                        "unit": "C",
                        "source_topic": topic,
                    })
            elif measurement_type == "CellVoltage":
                if value_type == "Max":
                    measurements.append({
                        "metric_name": "cell_voltage_max",
                        "metric_value": float(value),
                        "unit": "mV",
                        "source_topic": topic,
                    })
                elif value_type == "Min":
                    measurements.append({
                        "metric_name": "cell_voltage_min",
                        "metric_value": float(value),
                        "unit": "mV",
                        "source_topic": topic,
                    })
            elif measurement_type == "ModuleVoltage" and value_type == "Avg":
                measurements.append({
                    "metric_name": "module_voltage_avg",
                    "metric_value": value / 1000.0,  # mV to V
                    "unit": "V",
                    "source_topic": topic,
                })
            elif measurement_type == "Current" and value_type == "Total":
                measurements.append({
                    "metric_name": "battery_current_total",
                    "metric_value": value / 1000.0,  # mA to A
                    "unit": "A",
                    "source_topic": topic,
                })
            elif measurement_type == "ChargeVoltageLimit":
                measurements.append({
                    "metric_name": "charge_voltage_limit",
                    "metric_value": value / 1000.0,  # mV to V
                    "unit": "V",
                    "source_topic": topic,
                })
            elif measurement_type == "DischargeVoltageLimit":
                measurements.append({
                    "metric_name": "discharge_voltage_limit",
                    "metric_value": value / 1000.0,  # mV to V
                    "unit": "V",
                    "source_topic": topic,
                })
            elif measurement_type == "ChargeCurrentLimit":
                measurements.append({
                    "metric_name": "charge_current_limit",
                    "metric_value": value / 1000.0,  # mA to A
                    "unit": "A",
                    "source_topic": topic,
                })
            elif measurement_type == "DischargeCurrentLimit":
                measurements.append({
                    "metric_name": "discharge_current_limit",
                    "metric_value": abs(value / 1000.0),  # mA to A, make positive
                    "unit": "A",
                    "source_topic": topic,
                })

        if measurements:
            self.post_measurements(measurements, topic)

    def handle_ffr_measurements(self, payload: list[dict], topic: str):
        """Handle ffr/measurements messages (CT clamp data)."""
        measurements = []

        for item in payload:
            channel = item.get("channel")
            measurement = item.get("measurement")
            value = item.get("value")

            if value is None or measurement != "Power" or item.get("type") != "Active":
                continue

            # Map FFR channels to metrics (SWAPPED: LOCAL=house, HOUSE=grid)
            if channel == "LOCAL":
                # LOCAL CT actually measures house consumption
                measurements.append({
                    "metric_name": "house_power",
                    "metric_value": value / 1000.0,  # mW to W
                    "unit": "W",
                    "source_topic": topic,
                })
            elif channel == "HOUSE":
                # HOUSE CT actually measures grid (positive = import, negative = export)
                measurements.append({
                    "metric_name": "grid_power",
                    "metric_value": value / 1000.0,
                    "unit": "W",
                    "source_topic": topic,
                })
            elif channel == "AUX1":
                measurements.append({
                    "metric_name": "aux_power",
                    "metric_value": value / 1000.0,
                    "unit": "W",
                    "source_topic": topic,
                })

        if measurements:
            self.post_measurements(measurements, topic)

    def handle_schedule_event(self, payload: dict, topic: str):
        """Handle schedule/event messages."""
        event = payload.get("event")
        setpoint = payload.get("setpoint")
        
        measurements = []
        if event is not None:
            measurements.append({
                "metric_name": "schedule_event",
                "metric_value": event,
                "unit": "",
                "source_topic": topic,
            })
        if setpoint is not None:
            measurements.append({
                "metric_name": "schedule_setpoint",
                "metric_value": setpoint,
                "unit": "W",
                "source_topic": topic,
            })
        
        if measurements:
            self.post_measurements(measurements, topic)

    def handle_maxpower(self, payload: dict | list, topic: str):
        """Handle m4/maxpower messages."""
        # Maxpower can be a dict or list
        if isinstance(payload, list):
            if not payload:
                return
            payload = payload[0]
            
        measurements = []
        
        chg_power = payload.get("ChgPower")
        dchg_power = payload.get("DchgPower")
        
        if chg_power is not None:
            measurements.append({
                "metric_name": "max_charge_power",
                "metric_value": float(chg_power),
                "unit": "W",
                "source_topic": topic,
            })
        if dchg_power is not None:
            measurements.append({
                "metric_name": "max_discharge_power",
                "metric_value": float(dchg_power),
                "unit": "W",
                "source_topic": topic,
            })
        
        if measurements:
            self.post_measurements(measurements, topic)

    def handle_eps_status(self, payload: dict | list, topic: str):
        """Handle eps/status messages."""
        # EPS status can be a dict or list
        if isinstance(payload, list):
            if not payload:
                return
            payload = payload[0]
        
        measurements = []
        
        reserve = payload.get("Reserve")
        mode = payload.get("Mode")
        
        if reserve is not None:
            measurements.append({
                "metric_name": "eps_reserve",
                "metric_value": float(reserve),
                "unit": "%",
                "source_topic": topic,
            })
        if mode is not None:
            measurements.append({
                "metric_name": "eps_mode",
                "metric_value": float(mode),
                "unit": "",
                "source_topic": topic,
            })
        
        if measurements:
            self.post_measurements(measurements, topic)

    def handle_eps_schedule(self, payload: dict | list, topic: str):
        """Handle eps_schedule/event messages."""
        if isinstance(payload, list):
            if not payload:
                return
            payload = payload[0]
        
        measurements = []
        
        reserved_soc = payload.get("reserved_soc")
        event = payload.get("event")
        
        if reserved_soc is not None:
            measurements.append({
                "metric_name": "eps_schedule_reserve",
                "metric_value": float(reserved_soc),
                "unit": "%",
                "source_topic": topic,
            })
        if event is not None:
            # Convert on/off to 1/0
            event_value = 1.0 if event == "on" else 0.0
            measurements.append({
                "metric_name": "eps_schedule_event",
                "metric_value": event_value,
                "unit": "",
                "source_topic": topic,
            })
        
        if measurements:
            self.post_measurements(measurements, topic)

    def handle_safetycheck(self, payload: dict | list, topic: str):
        """Handle safetycheck/state messages."""
        if isinstance(payload, list):
            if not payload:
                return
            payload = payload[0]
        
        measurements = []
        
        # Extract any power limits or safety check values
        for key, value in payload.items():
            if isinstance(value, (int, float)):
                measurements.append({
                    "metric_name": f"safetycheck_{key}",
                    "metric_value": float(value),
                    "unit": "",
                    "source_topic": topic,
                })
        
        if measurements:
            self.post_measurements(measurements, topic)

    def run(self):
        """Start the collector."""
        logger.info(f"Starting PV3 MQTT Collector")
        logger.info(f"MQTT Broker: {MQTT_HOST}:{MQTT_PORT}")
        logger.info(f"Device ID: {P3_DEVICE_ID}")
        logger.info(f"API URL: {API_URL}")

        # Connect to MQTT broker
        while True:
            try:
                self.client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
                self.client.loop_forever()
            except KeyboardInterrupt:
                logger.info("Shutting down...")
                self.client.disconnect()
                break
            except Exception as e:
                logger.error(f"Connection error: {e}")
                logger.info("Retrying in 10 seconds...")
                time.sleep(10)


if __name__ == "__main__":
    collector = PV3Collector()
    collector.run()

