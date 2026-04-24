import { useRef, useCallback, useEffect, useState } from 'react'

const WS_BASE = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'

const RECONNECT_DELAYS = [500, 1000, 2000, 4000, 8000, 16000]

/**
 * Generic WebSocket hook with auto-reconnect and exponential backoff.
 *
 * @param {string} path — WebSocket path (e.g. '/ws/tutor/abc-123')
 * @param {object} options
 * @param {function} options.onMessage — called with parsed JSON for each message
 * @param {function} options.onStatusChange — called with 'connected' | 'reconnecting' | 'disconnected'
 * @param {boolean} options.autoConnect — connect immediately (default true)
 */
export default function useWebSocket(path, { onMessage, onStatusChange, autoConnect = true } = {}) {
  const wsRef = useRef(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef(null)
  const mountedRef = useRef(true)
  const [status, setStatus] = useState('disconnected')

  const updateStatus = useCallback((s) => {
    setStatus(s)
    onStatusChange?.(s)
  }, [onStatusChange])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const url = `${WS_BASE}${path}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) return
      reconnectAttemptRef.current = 0
      updateStatus('connected')
    }

    ws.onmessage = (event) => {
      if (!mountedRef.current) return
      try {
        const data = JSON.parse(event.data)
        onMessage?.(data)
      } catch {
        // Non-JSON message — ignore
      }
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      const attempt = reconnectAttemptRef.current
      if (attempt < RECONNECT_DELAYS.length) {
        updateStatus('reconnecting')
        const delay = RECONNECT_DELAYS[attempt]
        reconnectAttemptRef.current = attempt + 1
        reconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connect()
        }, delay)
      } else {
        updateStatus('disconnected')
      }
    }

    ws.onerror = () => {
      // onclose will fire after this
    }
  }, [path, onMessage, updateStatus])

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimerRef.current)
    reconnectAttemptRef.current = RECONNECT_DELAYS.length // prevent reconnects
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    updateStatus('disconnected')
  }, [updateStatus])

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
      return true
    }
    return false
  }, [])

  useEffect(() => {
    mountedRef.current = true
    if (autoConnect && path) connect()
    return () => {
      mountedRef.current = false
      clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [path, autoConnect, connect])

  return { status, send, connect, disconnect }
}
