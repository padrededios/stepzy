'use client'

import { useEffect, useRef, useMemo } from 'react'
import { useChat } from '@/hooks/useChat'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import type { ChatRoomWithStats } from '@stepzy/shared'

interface ChatRoomProps {
  room: ChatRoomWithStats
  currentUserId: string
}

export function ChatRoom({ room, currentUserId }: ChatRoomProps) {
  const {
    messages,
    loading,
    error,
    connected,
    typingUsers,
    sendMessage,
    setTyping,
    loadMore,
    hasMore
  } = useChat(room.id)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = useRef<number>(0)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      const container = messagesContainerRef.current
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100

        // Auto-scroll only if user is near bottom
        if (isNearBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  }, [messages])

  // Restore scroll position after loading more
  useEffect(() => {
    const container = messagesContainerRef.current
    if (container && prevScrollHeightRef.current > 0) {
      const newScrollHeight = container.scrollHeight
      const scrollDiff = newScrollHeight - prevScrollHeightRef.current
      container.scrollTop += scrollDiff
      prevScrollHeightRef.current = 0
    }
  }, [messages.length])

  // Handle scroll to load more
  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (container && container.scrollTop < 100 && hasMore && !loading) {
      prevScrollHeightRef.current = container.scrollHeight
      loadMore()
    }
  }

  // Group messages by sender and time
  const groupedMessages = useMemo(() => {
    return messages.map((message, index) => {
      const prevMessage = index > 0 ? messages[index - 1] : null
      const nextMessage = index < messages.length - 1 ? messages[index + 1] : null

      const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId ||
        (message.createdAt.getTime() - prevMessage.createdAt.getTime()) > 60000 // 1 min

      const showTimestamp = !nextMessage || nextMessage.senderId !== message.senderId ||
        (nextMessage.createdAt.getTime() - message.createdAt.getTime()) > 60000 // 1 min

      return {
        message,
        showAvatar,
        showTimestamp,
        isOwnMessage: message.senderId === currentUserId
      }
    })
  }, [messages, currentUserId])

  // Format typing users
  const typingText = useMemo(() => {
    const users = Array.from(typingUsers.values())
    if (users.length === 0) return null
    if (users.length === 1) return `${users[0]} est en train d'écrire...`
    if (users.length === 2) return `${users[0]} et ${users[1]} sont en train d'écrire...`
    return `${users.length} personnes sont en train d'écrire...`
  }, [typingUsers])

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-gray-900">{room.activityName}</h2>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50"
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun message
              </h3>
              <p className="text-gray-600">
                Soyez le premier à envoyer un message !
              </p>
            </div>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="text-center py-2">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                >
                  {loading ? 'Chargement...' : 'Charger plus de messages'}
                </button>
              </div>
            )}

            {groupedMessages.map(({ message, showAvatar, showTimestamp, isOwnMessage }) => (
              <ChatMessage
                key={message.id}
                message={message}
                isOwnMessage={isOwnMessage}
                showAvatar={showAvatar}
                showTimestamp={showTimestamp}
              />
            ))}

            {/* Typing indicator */}
            {typingText && (
              <div className="text-sm text-gray-500 italic px-3 py-2">
                {typingText}
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={sendMessage}
        onTyping={setTyping}
      />
    </div>
  )
}
