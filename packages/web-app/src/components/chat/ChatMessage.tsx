'use client'

import Image from 'next/image'
import type { ChatMessage as ChatMessageType } from '@stepzy/shared'

interface ChatMessageProps {
  message: ChatMessageType
  isOwnMessage: boolean
  showAvatar: boolean // Show avatar only for first message in a group
  showTimestamp: boolean // Show timestamp only for last message in a group
}

export function ChatMessage({ message, isOwnMessage, showAvatar, showTimestamp }: ChatMessageProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`flex items-end gap-2 mb-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar - Only show if not own message and showAvatar is true */}
      {!isOwnMessage && showAvatar ? (
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src={message.sender.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(message.sender.pseudo)}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`}
            alt={message.sender.pseudo}
            width={32}
            height={32}
            className="object-cover"
          />
        </div>
      ) : !isOwnMessage && !showAvatar ? (
        <div className="w-8" /> // Spacer to align messages
      ) : null}

      {/* Message bubble */}
      <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Sender name - Only show for other users' first message in group */}
        {!isOwnMessage && showAvatar && (
          <span className="text-xs text-gray-500 mb-1 ml-3">
            {message.sender.pseudo}
          </span>
        )}

        {/* Message content */}
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwnMessage
              ? 'bg-blue-500 text-white rounded-br-sm'
              : 'bg-gray-200 text-gray-900 rounded-bl-sm'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>

          {/* Moderation indicator */}
          {message.isModerated && (
            <p className="text-xs mt-1 opacity-75 italic">
              Message modéré
            </p>
          )}
        </div>

        {/* Timestamp - Only show for last message in group */}
        {showTimestamp && (
          <span className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'mr-2' : 'ml-2'}`}>
            {formatTime(message.createdAt)}
          </span>
        )}
      </div>
    </div>
  )
}
