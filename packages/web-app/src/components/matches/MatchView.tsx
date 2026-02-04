'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { User, Match, MatchPlayer } from '@/types'
import { getSportConfig } from '@/config/sports'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { api } from '@/lib/api/client'

interface MatchViewProps {
  match: Match
  currentUser: User
  creatorId?: string
  sessionId?: string
  onMatchUpdate?: () => void
  onError?: (message: string) => void
}

// Player avatar component used both on field and in substitutes
function PlayerAvatarContent({
  player,
  size = 'md',
}: {
  player: MatchPlayer
  size?: 'sm' | 'md'
}) {
  const sizeClasses = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12'

  return (
    <div className="flex flex-col items-center">
      <div className={`${sizeClasses} rounded-full overflow-hidden border-2 border-white shadow-md`}>
        <Image
          src={
            player.user.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.user.pseudo)}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`
          }
          alt={`${player.user.pseudo}`}
          width={size === 'sm' ? 40 : 48}
          height={size === 'sm' ? 40 : 48}
          className="rounded-full object-cover"
        />
      </div>
      <span className="text-xs font-semibold text-white mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] text-center max-w-[70px] truncate">
        {player.user.pseudo}
      </span>
    </div>
  )
}

// Draggable substitute player
function DraggableSubstitute({
  player,
  isCreator,
  isSelected,
  onClick,
}: {
  player: MatchPlayer
  isCreator: boolean
  isSelected: boolean
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sub-${player.id}`,
    data: { player, type: 'substitute' },
    disabled: !isCreator,
  })

  return (
    <div
      ref={setNodeRef}
      {...(isCreator ? { ...listeners, ...attributes } : {})}
      className={`
        flex items-center gap-3 p-2 rounded-lg transition-all
        ${isCreator ? 'cursor-grab active:cursor-grabbing' : ''}
        ${isDragging ? 'opacity-30' : ''}
        ${isSelected ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-white hover:bg-gray-50'}
      `}
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 shrink-0">
        <Image
          src={
            player.user.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.user.pseudo)}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`
          }
          alt={player.user.pseudo}
          width={40}
          height={40}
          className="rounded-full object-cover"
        />
      </div>
      <span className="text-sm font-medium text-gray-800">{player.user.pseudo}</span>
    </div>
  )
}

// Droppable field player (can receive a substitute drop)
function DroppableFieldPlayer({
  player,
  position,
  isCreator,
  isSwapMode,
  selectedFieldPlayerId,
  onClickForSwap,
  onLeave,
  isCurrentUser,
  isLoading,
}: {
  player?: MatchPlayer
  position: number
  isCreator: boolean
  isSwapMode: boolean
  selectedFieldPlayerId: string | null
  onClickForSwap: (playerId: string) => void
  onLeave: () => void
  isCurrentUser: boolean
  isLoading: boolean
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: player ? `field-${player.id}` : `empty-${position}`,
    data: { player, type: 'field' },
    disabled: !isCreator || !player,
  })

  const [showMenu, setShowMenu] = useState(false)
  const isSelected = player && selectedFieldPlayerId === player.id

  if (!player) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center">
          <span className="text-white/40 text-xs">{position}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      className={`
        relative flex flex-col items-center transition-all
        ${isOver ? 'scale-110 ring-4 ring-yellow-400 rounded-full' : ''}
        ${isSelected ? 'scale-105 ring-4 ring-blue-400 rounded-full' : ''}
        ${isCreator && isSwapMode ? 'cursor-pointer' : ''}
      `}
      onClick={(e) => {
        e.stopPropagation()
        if (isCreator && isSwapMode) {
          onClickForSwap(player.id)
        } else if (isCreator || isCurrentUser) {
          setShowMenu(!showMenu)
        }
      }}
    >
      <div className={`w-12 h-12 rounded-full overflow-hidden border-2 shadow-md ${isCurrentUser ? 'border-blue-400' : 'border-white'}`}>
        <Image
          src={
            player.user.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.user.pseudo)}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`
          }
          alt={player.user.pseudo}
          width={48}
          height={48}
          className="rounded-full object-cover"
        />
      </div>
      <span className="text-xs font-semibold text-white mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] text-center max-w-[70px] truncate">
        {player.user.pseudo}
      </span>

      {/* Context menu */}
      {showMenu && !isSwapMode && (
        <div className="absolute top-14 left-1/2 transform -translate-x-1/2 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-max">
          {isCurrentUser && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(false)
                onLeave()
              }}
              disabled={isLoading}
              className="block w-full text-left text-red-600 hover:text-red-700 hover:bg-red-50 font-medium text-sm px-3 py-1.5 rounded"
            >
              Quitter le match
            </button>
          )}
          {isCreator && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(false)
                onClickForSwap(player.id)
              }}
              className="block w-full text-left text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium text-sm px-3 py-1.5 rounded"
            >
              Remplacer par...
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const MatchView: React.FC<MatchViewProps> = ({
  match,
  currentUser,
  creatorId,
  sessionId,
  onMatchUpdate,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [selectedFieldPlayerId, setSelectedFieldPlayerId] = useState<string | null>(null)
  const [swapMode, setSwapMode] = useState(false)
  const [draggedPlayer, setDraggedPlayer] = useState<MatchPlayer | null>(null)

  const isCreator = !!creatorId && currentUser.id === creatorId

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (swapMode && selectedFieldPlayerId) {
        // Don't close swap mode on outside click
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [swapMode, selectedFieldPlayerId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const handleLeaveMatch = async () => {
    setIsLoading(true)
    try {
      let response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/sessions/${match.id}/leave`,
        { method: 'POST', credentials: 'include' }
      )

      if (!response.ok) {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/matches/${match.id}/leave`,
          { method: 'DELETE', credentials: 'include' }
        )
      }

      if (response.ok) {
        onMatchUpdate?.()
      } else {
        const data = await response.json()
        onError?.(data.error || 'Erreur lors de l\'action')
      }
    } catch {
      onError?.('Erreur lors de l\'action')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwapPlayers = useCallback(
    async (fieldPlayerId: string, substitutePlayerId: string) => {
      if (!sessionId) return
      setIsLoading(true)
      try {
        const result = await api.post(`/api/sessions/${sessionId}/swap-players`, {
          fieldPlayerId,
          substitutePlayerId,
        })
        if (result.success) {
          setSelectedFieldPlayerId(null)
          setSwapMode(false)
          onMatchUpdate?.()
        } else {
          onError?.(result.error || 'Erreur lors du remplacement')
        }
      } catch {
        onError?.('Erreur lors du remplacement')
      } finally {
        setIsLoading(false)
      }
    },
    [sessionId, onMatchUpdate, onError]
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setDraggedPlayer(active.data.current?.player || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedPlayer(null)

    if (!over || !active.data.current || !over.data.current) return

    const draggedType = active.data.current.type
    const targetType = over.data.current.type

    // Only allow substitute -> field swap
    if (draggedType === 'substitute' && targetType === 'field' && over.data.current.player) {
      const substitutePlayer = active.data.current.player as MatchPlayer
      const fieldPlayer = over.data.current.player as MatchPlayer
      handleSwapPlayers(fieldPlayer.id, substitutePlayer.id)
    }
  }

  const handleFieldPlayerClickForSwap = (playerId: string) => {
    if (!isCreator) return

    if (!swapMode) {
      // Enter swap mode and select this field player
      setSwapMode(true)
      setSelectedFieldPlayerId(playerId)
    } else if (selectedFieldPlayerId === playerId) {
      // Deselect
      setSwapMode(false)
      setSelectedFieldPlayerId(null)
    } else {
      // Select different field player
      setSelectedFieldPlayerId(playerId)
    }
  }

  const handleSubstituteClickForSwap = (substituteId: string) => {
    if (!isCreator || !swapMode || !selectedFieldPlayerId) return
    handleSwapPlayers(selectedFieldPlayerId, substituteId)
  }

  const cancelSwapMode = () => {
    setSwapMode(false)
    setSelectedFieldPlayerId(null)
  }

  // Distribute players into two halves for the vertical layout
  const confirmedPlayers = match.players
  const substitutes = match.waitingList

  const halfCount = Math.ceil(confirmedPlayers.length / 2)
  const topHalfPlayers = confirmedPlayers.slice(0, halfCount)
  const bottomHalfPlayers = confirmedPlayers.slice(halfCount)

  // Get sport-specific layout config
  const getFieldLayout = () => {
    const maxPerTeam = Math.ceil(match.maxPlayers / 2)
    switch (match.sport) {
      case 'football':
        return { topSlots: maxPerTeam, bottomSlots: maxPerTeam, cols: maxPerTeam <= 3 ? maxPerTeam : 3 }
      case 'badminton':
        return { topSlots: Math.ceil(match.maxPlayers / 2), bottomSlots: Math.floor(match.maxPlayers / 2), cols: 2 }
      case 'volley':
        return { topSlots: maxPerTeam, bottomSlots: maxPerTeam, cols: 3 }
      case 'pingpong':
        return { topSlots: Math.ceil(match.maxPlayers / 2), bottomSlots: Math.floor(match.maxPlayers / 2), cols: 2 }
      case 'rugby':
        return { topSlots: maxPerTeam, bottomSlots: maxPerTeam, cols: 5 }
      default:
        return { topSlots: maxPerTeam, bottomSlots: maxPerTeam, cols: 3 }
    }
  }

  const layout = getFieldLayout()
  const sportConfig = getSportConfig(match.sport)

  const VerticalField = () => (
    <div
      data-testid={`${match.sport}-field`}
      className="relative rounded-2xl overflow-hidden mb-4"
      style={{
        backgroundImage: `url(${sportConfig.terrainImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: isMobile ? '450px' : '550px',
      }}
    >
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Top half - Team A */}
      <div
        data-testid="team-a-side"
        className="relative flex flex-col items-center justify-center px-4 pt-6 pb-2"
        style={{ minHeight: isMobile ? '200px' : '250px' }}
      >
        <div className="text-white/80 font-bold text-sm mb-3 tracking-wider uppercase drop-shadow-lg">
          {match.sport === 'pingpong' ? 'Joueur(s) 1' : 'Équipe A'}
        </div>
        <div
          className={`grid gap-4 justify-items-center`}
          style={{ gridTemplateColumns: `repeat(${Math.min(layout.cols, layout.topSlots)}, minmax(0, 1fr))` }}
        >
          {[...Array(layout.topSlots)].map((_, index) => (
            <DroppableFieldPlayer
              key={`a-${index}`}
              player={topHalfPlayers[index]}
              position={index + 1}
              isCreator={isCreator}
              isSwapMode={swapMode}
              selectedFieldPlayerId={selectedFieldPlayerId}
              onClickForSwap={handleFieldPlayerClickForSwap}
              onLeave={handleLeaveMatch}
              isCurrentUser={topHalfPlayers[index]?.user.id === currentUser.id}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Center divider */}
      <div className="relative flex items-center justify-center py-2">
        <div className="w-3/4 h-px bg-white/30" />
        <div className="absolute w-16 h-16 rounded-full border border-white/30" />
      </div>

      {/* Bottom half - Team B */}
      <div
        data-testid="team-b-side"
        className="relative flex flex-col items-center justify-center px-4 pt-2 pb-6"
        style={{ minHeight: isMobile ? '200px' : '250px' }}
      >
        <div
          className={`grid gap-4 justify-items-center`}
          style={{ gridTemplateColumns: `repeat(${Math.min(layout.cols, layout.bottomSlots)}, minmax(0, 1fr))` }}
        >
          {[...Array(layout.bottomSlots)].map((_, index) => (
            <DroppableFieldPlayer
              key={`b-${index}`}
              player={bottomHalfPlayers[index]}
              position={layout.topSlots + index + 1}
              isCreator={isCreator}
              isSwapMode={swapMode}
              selectedFieldPlayerId={selectedFieldPlayerId}
              onClickForSwap={handleFieldPlayerClickForSwap}
              onLeave={handleLeaveMatch}
              isCurrentUser={bottomHalfPlayers[index]?.user.id === currentUser.id}
              isLoading={isLoading}
            />
          ))}
        </div>
        <div className="text-white/80 font-bold text-sm mt-3 tracking-wider uppercase drop-shadow-lg">
          {match.sport === 'pingpong' ? 'Joueur(s) 2' : 'Équipe B'}
        </div>
      </div>
    </div>
  )

  const SubstitutesBench = () => {
    if (substitutes.length === 0) return null

    return (
      <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <h3 className="text-base font-semibold text-gray-800">
            Remplaçants ({substitutes.length})
          </h3>
          {isCreator && (
            <span className="text-xs text-gray-500 ml-auto">
              Glissez un remplaçant sur un joueur pour l&apos;échanger
            </span>
          )}
        </div>

        {swapMode && selectedFieldPlayerId && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-700">
              Sélectionnez un remplaçant pour effectuer l&apos;échange
            </span>
            <button
              onClick={cancelSwapMode}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Annuler
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {substitutes.map((player) => (
            <DraggableSubstitute
              key={player.id}
              player={player}
              isCreator={isCreator}
              isSelected={swapMode && !!selectedFieldPlayerId}
              onClick={() => handleSubstituteClickForSwap(player.id)}
            />
          ))}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div data-testid="loading-indicator" className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        data-testid={isMobile ? 'mobile-layout' : 'desktop-layout'}
        className="max-w-lg mx-auto p-4"
      >
        {/* Vertical field */}
        <VerticalField />

        {/* Substitutes bench */}
        <SubstitutesBench />

        {/* Empty state */}
        {match.players.length === 0 && match.waitingList.length === 0 && (
          <div className="text-center py-6 bg-blue-50 rounded-lg mt-4">
            <div className="text-blue-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-blue-600 mb-1">Aucun joueur inscrit</h3>
            <p className="text-blue-500 text-sm">Soyez le premier à rejoindre cette activité !</p>
          </div>
        )}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {draggedPlayer && (
          <div className="opacity-80">
            <PlayerAvatarContent player={draggedPlayer} size="md" />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

export default MatchView
