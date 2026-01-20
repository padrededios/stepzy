'use client'

import { useState, KeyboardEvent, useRef, useEffect } from 'react'

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>
  onTyping: (isTyping: boolean) => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, onTyping, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  const handleSend = async () => {
    if (!message.trim() || sending || disabled) return

    setSending(true)
    try {
      await onSendMessage(message)
      setMessage('')
      onTyping(false)
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (value: string) => {
    setMessage(value)

    // Trigger typing indicator
    if (value.trim()) {
      onTyping(true)
    } else {
      onTyping(false)
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez un message..."
            disabled={disabled || sending}
            rows={1}
            className="w-full px-4 py-2 border border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            style={{ maxHeight: '120px' }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!message.trim() || sending || disabled}
          className="flex-shrink-0 bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          aria-label="Envoyer"
        >
          {sending ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Appuyez sur Entrée pour envoyer, Shift + Entrée pour une nouvelle ligne
      </p>
    </div>
  )
}
