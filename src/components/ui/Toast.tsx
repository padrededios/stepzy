'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const styles = {
    success: {
      bg: 'bg-gradient-to-r from-teal-600 to-teal-700',
      iconBg: 'bg-green-400',
      textColor: 'text-white'
    },
    error: {
      bg: 'bg-gradient-to-r from-rose-600 to-red-700',
      iconBg: 'bg-red-400',
      textColor: 'text-white'
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-600 to-blue-700',
      iconBg: 'bg-blue-400',
      textColor: 'text-white'
    }
  }

  const icons = {
    success: (
      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    )
  }

  const style = styles[type]

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${style.bg} rounded-xl shadow-2xl px-6 py-4 flex items-start space-x-4 animate-slide-in-right max-w-md min-w-[320px]`}
      role="alert"
    >
      {/* Icon Circle */}
      <div className={`flex-shrink-0 ${style.iconBg} rounded-full p-2`}>
        {icons[type]}
      </div>

      {/* Message */}
      <div className="flex-1 pt-1">
        <p className={`font-medium ${style.textColor} text-base leading-tight`}>
          {message}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="flex-shrink-0 text-white/80 hover:text-white transition-colors mt-1"
        aria-label="Fermer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}