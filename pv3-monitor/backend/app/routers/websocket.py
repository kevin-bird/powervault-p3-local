import asyncio
import json
from typing import Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["websocket"])


class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""

    def __init__(self) -> None:
        self.active_connections: dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, device_id: str) -> None:
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        if device_id not in self.active_connections:
            self.active_connections[device_id] = set()
        self.active_connections[device_id].add(websocket)

    def disconnect(self, websocket: WebSocket, device_id: str) -> None:
        """Remove a WebSocket connection."""
        if device_id in self.active_connections:
            self.active_connections[device_id].discard(websocket)
            if not self.active_connections[device_id]:
                del self.active_connections[device_id]

    async def broadcast(self, device_id: str, message: dict) -> None:
        """Broadcast a message to all connections for a device."""
        if device_id not in self.active_connections:
            return

        disconnected = set()
        for connection in self.active_connections[device_id]:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)

        # Clean up disconnected clients
        for conn in disconnected:
            self.active_connections[device_id].discard(conn)


# Global connection manager instance
manager = ConnectionManager()


@router.websocket("/api/ws/devices/{device_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    device_id: str,
) -> None:
    """WebSocket endpoint for real-time device updates."""
    await manager.connect(websocket, device_id)

    try:
        while True:
            # Keep connection alive, handle incoming messages if needed
            try:
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=30.0,
                )
                # Handle ping/pong or other client messages
                if data == "ping":
                    await websocket.send_text("pong")
            except asyncio.TimeoutError:
                # Send heartbeat
                await websocket.send_json({"type": "heartbeat"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, device_id)
    except Exception:
        manager.disconnect(websocket, device_id)


async def broadcast_measurement_update(
    device_id: str,
    data: dict,
) -> None:
    """Broadcast a measurement update to connected clients."""
    await manager.broadcast(
        device_id,
        {
            "type": "MEASUREMENT_UPDATE",
            "device_id": device_id,
            "data": data,
        },
    )


async def broadcast_alarm_update(
    device_id: str,
    alarm_name: str,
    is_active: bool,
) -> None:
    """Broadcast an alarm update to connected clients."""
    await manager.broadcast(
        device_id,
        {
            "type": "ALARM_UPDATE",
            "device_id": device_id,
            "alarm_name": alarm_name,
            "is_active": is_active,
        },
    )

