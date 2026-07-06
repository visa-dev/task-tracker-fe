import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws'

let stompClient = null

/**
 * Connects to the backend STOMP/SockJS endpoint.
 * onConnected: called once the connection is established.
 */
function connect(onConnected) {
  if (stompClient && stompClient.active) {
    return stompClient
  }

  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 5000,
    onConnect: () => {
      if (onConnected) onConnected()
    },
    onStompError: (frame) => {
      console.error('STOMP error', frame)
    },
  })

  stompClient.activate()
  return stompClient
}

function disconnect() {
  if (stompClient) {
    stompClient.deactivate()
    stompClient = null
  }
}

/**
 * Subscribes to /topic/tasks. The payload is a sanitized
 * { action: 'CREATE' | 'UPDATE' | 'DELETE', taskId } event only -
 * callers are expected to refetch data themselves (RBAC is enforced server-side on refetch).
 */
function subscribeToTasks(callback) {
  if (!stompClient || !stompClient.connected) return null

  return stompClient.subscribe('/topic/tasks', (message) => {
    try {
      const payload = JSON.parse(message.body)
      callback(payload)
    } catch (err) {
      console.error('Failed to parse task event', err)
    }
  })
}

export default { connect, disconnect, subscribeToTasks }
