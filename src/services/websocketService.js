import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const WS_URL = import.meta.env.VITE_WS_URL

let stompClient = null


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
