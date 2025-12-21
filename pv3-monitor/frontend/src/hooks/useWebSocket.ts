import { useState, useEffect, useRef, useCallback } from 'react'
import type { WebSocketMessage } from '../types/websocket'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://192.168.1.6:8800'

interface UseWebSocketReturn {
  connected: boolean
  lastMessage: WebSocketMessage | null
  send: (message: string) => void
}

export function useWebSocket(deviceId: string): UseWebSocketReturn {
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    const ws = new WebSocket(`${WS_URL}/api/ws/devices/${deviceId}`)

    ws.onopen = () => {
      setConnected(true)
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      try {
        // Handle text messages (like "pong")
        if (event.data === 'pong') {
          return
        }
        
        const message = JSON.parse(event.data) as WebSocketMessage
        if (message.type !== 'heartbeat') {
          setLastMessage(message)
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e)
      }
    }

    ws.onclose = () => {
      setConnected(false)
      console.log('WebSocket disconnected')
      
      // Attempt to reconnect after 5 seconds
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect()
      }, 5000)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    wsRef.current = ws
  }, [deviceId])

  const send = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message)
    }
  }, [])

  useEffect(() => {
    connect()

    // Send ping every 25 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      send('ping')
    }, 25000)

    return () => {
      clearInterval(pingInterval)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      wsRef.current?.close()
    }
  }, [connect, send])

  return { connected, lastMessage, send }
}

