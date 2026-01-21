'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { ChatMessage, TypingIndicator } from '@stepzy/shared'
import { useChatContext } from '@/contexts/ChatContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const WS_URL = API_URL.replace('http', 'ws')

interface UseChatReturn {
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  connected: boolean
  typingUsers: Map<string, string> // userId -> pseudo
  sendMessage: (content: string) => Promise<void>
  setTyping: (isTyping: boolean) => void
  markAsRead: () => Promise<void>
  loadMore: () => Promise<void>
  hasMore: boolean
}

export function useChat(roomId: string | null): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map())
  const [hasMore, setHasMore] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get refresh function from context
  const { refreshUnreadCounts } = useChatContext()

  // Fetch messages
  const fetchMessages = useCallback(async (before?: string) => {
    if (!roomId) return

    try {
      const params = new URLSearchParams()
      params.append('limit', '50')
      if (before) params.append('before', before)

      const response = await fetch(
        `${API_URL}/api/chat/rooms/${roomId}/messages?${params}`,
        { credentials: 'include' }
      )

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des messages')
      }

      const data = await response.json()
      if (data.success) {
        const parsedMessages = data.data.map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
          updatedAt: new Date(msg.updatedAt)
        }))

        if (before) {
          // Load more - prepend old messages
          setMessages(prev => [...parsedMessages, ...prev])
        } else {
          // Initial load
          setMessages(parsedMessages)
        }

        setHasMore(parsedMessages.length === 50)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      console.error('Error fetching messages:', err)
    } finally {
      setLoading(false)
    }
  }, [roomId])

  // Load more messages
  const loadMore = useCallback(async () => {
    if (!hasMore || messages.length === 0) return

    const oldestMessage = messages[0]
    await fetchMessages(oldestMessage.createdAt.toISOString())
  }, [hasMore, messages, fetchMessages])

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!roomId || !content.trim()) return

    try {
      const response = await fetch(
        `${API_URL}/api/chat/rooms/${roomId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ content: content.trim() })
        }
      )

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message')
      }

      // Add message to local state from API response
      const data = await response.json()
      if (data.success && data.data) {
        const newMessage = {
          ...data.data,
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt)
        }
        setMessages(prev => [...prev, newMessage])
      }
    } catch (err) {
      console.error('Error sending message:', err)
      throw err
    }
  }, [roomId])

  // Set typing indicator
  const setTyping = useCallback((isTyping: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    wsRef.current.send(JSON.stringify({
      type: 'typing',
      data: { isTyping }
    }))

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false)
      }, 3000)
    }
  }, [])

  // Mark room as read
  const markAsRead = useCallback(async () => {
    if (!roomId) return

    try {
      await fetch(`${API_URL}/api/chat/rooms/${roomId}/read`, {
        method: 'PUT',
        credentials: 'include'
      })

      // Refresh unread counts immediately
      await refreshUnreadCounts()
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }, [roomId, refreshUnreadCounts])

  // WebSocket connection
  useEffect(() => {
    if (!roomId) return

    let isMounted = true
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connectWebSocket = () => {
      if (!isMounted) return

      try {
        // Get session token from cookies
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [key, ...valueParts] = cookie.trim().split('=')
          acc[key] = valueParts.join('=')
          return acc
        }, {} as Record<string, string>)

        const sessionToken = cookies['better-auth.session_token']
        if (!sessionToken) {
          // No token, skip WebSocket (REST API still works)
          return
        }

        const wsUrl = `${WS_URL}/ws/chat/${roomId}?token=${encodeURIComponent(sessionToken)}`

        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          if (!isMounted) {
            ws.close()
            return
          }
          setConnected(true)
        }

        ws.onmessage = (event) => {
          if (!isMounted) return

          try {
            const message = JSON.parse(event.data)

            switch (message.type) {
              case 'message':
                // New message received - check for duplicates
                const newMsg = {
                  ...message.data,
                  createdAt: new Date(message.data.createdAt),
                  updatedAt: new Date(message.data.updatedAt)
                }
                setMessages(prev => {
                  // Avoid duplicates (in case message was added via REST response)
                  if (prev.some(m => m.id === newMsg.id)) return prev
                  return [...prev, newMsg]
                })
                break

              case 'typing':
                const { userId, pseudo, isTyping } = message.data as TypingIndicator
                setTypingUsers(prev => {
                  const newMap = new Map(prev)
                  if (isTyping) {
                    newMap.set(userId, pseudo)
                  } else {
                    newMap.delete(userId)
                  }
                  return newMap
                })
                break

              case 'error':
                // WebSocket errors are not critical - REST API still works
                console.warn('[Chat] WebSocket server error:', message.data)
                break
            }
          } catch (err) {
            console.warn('[Chat] Error parsing WebSocket message:', err)
          }
        }

        ws.onerror = () => {
          // WebSocket errors are not critical - REST API still works
          console.warn('[Chat] WebSocket connection error (REST API still available)')
        }

        ws.onclose = () => {
          if (!isMounted) return
          setConnected(false)
          // Only reconnect if still mounted and after delay
          reconnectTimeout = setTimeout(connectWebSocket, 5000)
        }
      } catch (err) {
        console.warn('[Chat] WebSocket setup error:', err)
      }
    }

    connectWebSocket()

    return () => {
      isMounted = false
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [roomId])

  // Initial fetch
  useEffect(() => {
    if (roomId) {
      fetchMessages()
    }
  }, [roomId, fetchMessages])

  // Mark as read when entering room
  useEffect(() => {
    if (roomId) {
      markAsRead()
    }
  }, [roomId, markAsRead])

  return {
    messages,
    loading,
    error,
    connected,
    typingUsers,
    sendMessage,
    setTyping,
    markAsRead,
    loadMore,
    hasMore
  }
}
