// ========================================
// Composable — useSocket
// Socket.IO client management
// ========================================

import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export const useSocket = () => {
  const config = useRuntimeConfig()

  const connect = (token?: string) => {
    if (socket?.connected) return socket

    socket = io(config.public.socketUrl, {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      console.log('🔌 Socket connected')
    })

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected')
    })

    return socket
  }

  const disconnect = () => {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  }

  const getSocket = () => socket

  const on = (event: string, callback: (...args: any[]) => void) => {
    socket?.on(event, callback)
  }

  const emit = (event: string, data?: any) => {
    socket?.emit(event, data)
  }

  return { connect, disconnect, getSocket, on, emit }
}
