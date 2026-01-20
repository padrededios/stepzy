'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChatRooms } from '@/hooks/useChatRooms'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { ChatRoomList } from '@/components/chat/ChatRoomList'
import { ChatRoom } from '@/components/chat/ChatRoom'

export default function MessagesPage() {
  const user = useCurrentUser()
  const router = useRouter()
  const { rooms, unreadCounts, loading } = useChatRooms()
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

  const selectedRoom = rooms.find(r => r.id === selectedRoomId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des conversations...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Desktop layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Sidebar - Room list */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            {unreadCounts && unreadCounts.total > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {unreadCounts.total} message{unreadCounts.total > 1 ? 's' : ''} non lu{unreadCounts.total > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <ChatRoomList
              rooms={rooms}
              selectedRoomId={selectedRoomId}
              onSelectRoom={setSelectedRoomId}
            />
          </div>
        </div>

        {/* Main content - Chat room */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <ChatRoom room={selectedRoom} currentUserId={user.id} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Sélectionnez une conversation
                </h2>
                <p className="text-gray-600">
                  Choisissez un salon pour commencer à discuter
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden flex flex-col h-full">
        {!selectedRoomId ? (
          // Show room list on mobile when no room selected
          <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              {unreadCounts && unreadCounts.total > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {unreadCounts.total} message{unreadCounts.total > 1 ? 's' : ''} non lu{unreadCounts.total > 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              <ChatRoomList
                rooms={rooms}
                selectedRoomId={selectedRoomId}
                onSelectRoom={setSelectedRoomId}
              />
            </div>
          </div>
        ) : selectedRoom ? (
          // Show chat room when selected on mobile
          <div className="flex flex-col h-full">
            {/* Back button */}
            <div className="border-b border-gray-200 bg-white p-4 flex items-center gap-3">
              <button
                onClick={() => setSelectedRoomId(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Retour"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-gray-900">{selectedRoom.activityName}</h2>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <ChatRoom room={selectedRoom} currentUserId={user.id} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
