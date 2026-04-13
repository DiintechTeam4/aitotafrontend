import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

export function useSocket(user) {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!user?._id) return
    const url = import.meta.env.VITE_WHATSAI_SOCKET_URL || 'http://localhost:5000'
    const s = io(url, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnectionAttempts: 5,
    })
    s.on('connect', () => { setConnected(true); s.emit('join', user._id) })
    s.on('disconnect', () => setConnected(false))
    setSocket(s)
    return () => { s.emit('leave', user._id); s.disconnect(); setSocket(null) }
  }, [user?._id])

  return { socket, connected }
}
