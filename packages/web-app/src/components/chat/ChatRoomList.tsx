'use client'

import Image from 'next/image'
import { SPORTS_CONFIG } from '@stepzy/shared'
import type { ChatRoomWithStats, SportType } from '@stepzy/shared'

interface ChatRoomListProps {
  rooms: ChatRoomWithStats[]
  selectedRoomId: string | null
  onSelectRoom: (roomId: string) => void
}

export function ChatRoomList({ rooms, selectedRoomId, onSelectRoom }: ChatRoomListProps) {
  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-4">💬</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucun salon de discussion
        </h3>
        <p className="text-gray-600 text-sm">
          Les salons apparaissent automatiquement lorsque vous rejoignez une activité
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200">
      {rooms.map((room) => {
        const isSelected = room.id === selectedRoomId
        const sportConfig = SPORTS_CONFIG[room.sport as SportType]

        return (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
              isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Sport icon */}
                <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
                  {sportConfig?.icon ? (
                    <Image
                      src={sportConfig.icon}
                      alt={sportConfig.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full text-xl">⚽</span>
                  )}
                </div>

                {/* Room info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {room.activityName}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    {room.messageCount === 0
                      ? 'Aucun message'
                      : `${room.messageCount} message${room.messageCount > 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>

              {/* Unread badge */}
              {room.unreadCount && room.unreadCount > 0 && (
                <div className="flex-shrink-0 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {room.unreadCount > 9 ? '9+' : room.unreadCount}
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
