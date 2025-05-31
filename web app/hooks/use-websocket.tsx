"use client"

import { useState, useEffect, useRef } from "react"
import { useDetectionStore } from "@/store/detection-store"

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("Checking backend...")
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 3
  const backendCheckRef = useRef<boolean>(false)
  const { addDetection } = useDetectionStore()

  // Check if backend is available before attempting WebSocket connection
  const checkBackendAvailability = async (): Promise<boolean> => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

      const response = await fetch("http://localhost:8000/health", {
        signal: controller.signal,
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      clearTimeout(timeoutId)
      return response.ok
    } catch (error) {
      // Backend is not available
      return false
    }
  }

  const connect = async () => {
    // Don't attempt to connect if we've exceeded max attempts
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setConnectionStatus("Backend offline")
      return
    }

    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof WebSocket === "undefined") {
      setConnectionStatus("WebSocket not supported")
      return
    }

    // First check if backend is available
    if (!backendCheckRef.current) {
      setConnectionStatus("Checking backend...")
      const isBackendAvailable = await checkBackendAvailability()
      backendCheckRef.current = true

      if (!isBackendAvailable) {
        setConnectionStatus("Backend offline")
        reconnectAttemptsRef.current = maxReconnectAttempts // Prevent further attempts
        return
      }
    }

    try {
      setConnectionStatus("Connecting...")
      const ws = new WebSocket("ws://localhost:8000/ws")
      wsRef.current = ws

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close()
          setConnectionStatus("Connection timeout")
        }
      }, 5000) // 5 second timeout

      ws.onopen = () => {
        clearTimeout(connectionTimeout)
        setIsConnected(true)
        setConnectionStatus("Connected")
        reconnectAttemptsRef.current = 0 // Reset attempts on successful connection
        console.log("WebSocket connected successfully")
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === "connection_established") {
            console.log("WebSocket connection established:", data.message)
          } else if (data.type === "pong") {
            // Handle ping/pong for keep-alive
            console.log("Received pong from server")
          } else if (data.id && data.timestamp) {
            // This is a detection result
            console.log("Received detection:", data)
            addDetection(data)
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout)
        setIsConnected(false)

        // Determine close reason
        let closeReason = "Disconnected"
        if (event.code === 1006) {
          closeReason = "Connection lost"
        } else if (event.code === 1000) {
          closeReason = "Normal closure"
        } else if (event.code === 1001) {
          closeReason = "Going away"
        }

        setConnectionStatus(closeReason)
        console.log(`WebSocket closed: ${closeReason} (code: ${event.code})`)

        // Only attempt to reconnect if it wasn't a normal closure and we haven't exceeded attempts
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000) // Exponential backoff, max 10s

          setConnectionStatus(`Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`)

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setConnectionStatus("Backend offline")
        }
      }

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout)
        // Don't log the error object as it's not useful and causes console noise
        console.warn("WebSocket connection failed - backend may be offline")
        setConnectionStatus("Connection failed")

        // Close the connection to trigger onclose handler
        if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
          ws.close()
        }
      }
    } catch (error) {
      console.warn("Failed to create WebSocket connection - backend offline")
      setConnectionStatus("Backend offline")
      reconnectAttemptsRef.current = maxReconnectAttempts // Prevent further attempts
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "Manual disconnect") // Normal closure
      wsRef.current = null
    }

    setIsConnected(false)
    setConnectionStatus("Disconnected")
    reconnectAttemptsRef.current = 0
    backendCheckRef.current = false
  }

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message))
        return true
      } catch (error) {
        console.error("Error sending WebSocket message:", error)
        return false
      }
    }
    return false
  }

  const reconnect = async () => {
    disconnect()
    reconnectAttemptsRef.current = 0
    backendCheckRef.current = false
    setTimeout(connect, 1000)
  }

  // Ping/pong for keep-alive (only when connected)
  useEffect(() => {
    if (!isConnected) return

    const pingInterval = setInterval(() => {
      if (sendMessage({ type: "ping" })) {
        console.log("Sent ping to server")
      }
    }, 30000) // Ping every 30 seconds

    return () => clearInterval(pingInterval)
  }, [isConnected])

  useEffect(() => {
    // Only attempt to connect if we're in a browser environment
    if (typeof window !== "undefined") {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [])

  return {
    isConnected,
    connectionStatus,
    sendMessage,
    reconnect,
    disconnect,
  }
}
