'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { formatDate, formatTime } from '@/lib/utils/date'
import { User, Match, MatchPlayer } from '@/types'

interface MatchViewProps {
  match: Match
  currentUser: User
  onMatchUpdate?: () => void
  onError?: (message: string) => void
}

const MatchView: React.FC<MatchViewProps> = ({ 
  match, 
  currentUser, 
  onMatchUpdate,
  onError 
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])


  const handlePlayerClick = (playerId: string, userId: string) => {
    if (userId === currentUser.id) {
      setSelectedPlayer(playerId === selectedPlayer ? null : playerId)
    }
  }

  const handleLeaveMatch = async () => {
    setIsLoading(true)
    try {
      // Essayer d'abord l'API des sessions d'activités, puis l'API des matches traditionnels
      let response = await fetch(`/api/activities/sessions/${match.id}/leave`, {
        method: 'DELETE'
      })

      // Si ça ne fonctionne pas, essayer l'API des matches traditionnels
      if (!response.ok) {
        response = await fetch(`/api/matches/${match.id}/leave`, {
          method: 'DELETE'
        })
      }

      if (response.ok) {
        setSelectedPlayer(null)
        onMatchUpdate?.()
      } else {
        const data = await response.json()
        onError?.(data.error || 'Erreur lors de l\'action')
      }
    } catch (error) {
      onError?.('Erreur lors de l\'action')
    } finally {
      setIsLoading(false)
    }
  }

  const distributePlayersInTeams = () => {
    const teamA = []
    const teamB = []
    
    for (let i = 0; i < match.players.length; i++) {
      if (i % 2 === 0) {
        teamA.push(match.players[i])
      } else {
        teamB.push(match.players[i])
      }
    }

    return { teamA, teamB }
  }

  const { teamA, teamB } = distributePlayersInTeams()

  const PlayerAvatar = ({ 
    player, 
    position, 
    team 
  }: { 
    player?: MatchPlayer
    position: number
    team: 'A' | 'B'
  }) => {
    if (!player) {
      return (
        <div 
          data-testid="empty-position"
          className="w-12 h-12 rounded-full border-2 border-gray-300 border-dashed flex items-center justify-center bg-gray-100"
        >
          <span className="text-gray-400 text-xs">{position}</span>
        </div>
      )
    }

    const isCurrentUser = player.user.id === currentUser.id
    const isSelected = selectedPlayer === player.id

    return (
      <div 
        data-testid={`team-${team.toLowerCase()}-player-${position}`}
        className="relative"
      >
        <div
          className={`
            w-12 h-12 rounded-full border-2 cursor-pointer transition-all duration-200
            ${isCurrentUser ? 'border-blue-500 hover:border-blue-600' : 'border-gray-300'}
            ${isSelected ? 'ring-4 ring-blue-300' : ''}
          `}
          onClick={() => handlePlayerClick(player.id, player.user.id)}
        >
          <Image
            src={player.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.user.pseudo)}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`}
            alt={`${player.user.pseudo} avatar`}
            width={48}
            height={48}
            className="rounded-full"
          />
        </div>
        <div className="text-center mt-1">
          <span className="text-xs font-medium text-gray-700">
            {player.user.pseudo}
          </span>
        </div>
        
        {isSelected && isCurrentUser && (
          <div className="absolute top-14 left-1/2 transform -translate-x-1/2 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-max">
            <button
              onClick={handleLeaveMatch}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
            >
              {player.status === 'confirmed' ? 'Quitter le match' : 'Quitter la liste d\'attente'}
            </button>
          </div>
        )}
      </div>
    )
  }

  const PingPongTable = () => (
    <div
      data-testid="pingpong-table"
      className="relative bg-blue-600 rounded-lg p-4 min-h-[400px] mb-6"
      style={{
        backgroundImage: `
          linear-gradient(90deg, white 0%, transparent 2%, transparent 98%, white 100%),
          linear-gradient(0deg, white 0%, transparent 2%, transparent 98%, white 100%)
        `
      }}
    >
      {/* Net */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-white"></div>

      {/* Center line across the net */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>

      {/* Team A (Left side) */}
      <div
        data-testid="team-a-side"
        className="absolute left-4 top-4 bottom-4 w-1/2 flex flex-col justify-center items-center"
      >
        <div className="text-white font-bold mb-4">Équipe A</div>
        <div className="grid grid-cols-1 gap-8">
          {[...Array(2)].map((_, index) => (
            <div key={index} data-testid={`position-a-${index + 1}`}>
              <PlayerAvatar
                player={teamA[index]}
                position={index + 1}
                team="A"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Team B (Right side) */}
      <div
        data-testid="team-b-side"
        className="absolute right-4 top-4 bottom-4 w-1/2 flex flex-col justify-center items-center"
      >
        <div className="text-white font-bold mb-4">Équipe B</div>
        <div className="grid grid-cols-1 gap-8">
          {[...Array(2)].map((_, index) => (
            <div key={index} data-testid={`position-b-${index + 1}`}>
              <PlayerAvatar
                player={teamB[index]}
                position={index + 3}
                team="B"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const FootballField = () => (
    <div 
      data-testid="football-field"
      className="relative bg-green-500 rounded-lg p-4 min-h-[400px] mb-6"
      style={{
        backgroundImage: `
          linear-gradient(90deg, white 0%, transparent 2%, transparent 98%, white 100%),
          linear-gradient(0deg, white 0%, transparent 2%, transparent 98%, white 100%)
        `
      }}
    >
      {/* Center circle */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
      
      {/* Center line */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-white"></div>

      {/* Team A (Left side) */}
      <div 
        data-testid="team-a-side"
        className="absolute left-4 top-4 bottom-4 w-1/2 flex flex-col justify-around items-center"
      >
        <div className="text-white font-bold mb-2">Équipe A</div>
        <div className="grid grid-cols-2 gap-4 flex-1 content-around">
          {[...Array(6)].map((_, index) => (
            <div key={index} data-testid={`position-a-${index + 1}`}>
              <PlayerAvatar 
                player={teamA[index]} 
                position={index + 1}
                team="A"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Team B (Right side) */}
      <div 
        data-testid="team-b-side"
        className="absolute right-4 top-4 bottom-4 w-1/2 flex flex-col justify-around items-center"
      >
        <div className="text-white font-bold mb-2">Équipe B</div>
        <div className="grid grid-cols-2 gap-4 flex-1 content-around">
          {[...Array(6)].map((_, index) => (
            <div key={index} data-testid={`position-b-${index + 1}`}>
              <PlayerAvatar 
                player={teamB[index]} 
                position={index + 7}
                team="B"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const WaitingList = () => (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Liste d'attente</h3>
      
      {match.waitingList.length === 0 ? (
        <p className="text-gray-500 text-sm">Aucun joueur en attente</p>
      ) : (
        <div className="space-y-3">
          {match.waitingList.map((player, index) => (
            <div 
              key={player.id}
              className="flex items-center space-x-3 p-2 bg-white rounded-lg"
            >
              <div className="relative">
                <div
                  className={`
                    w-10 h-10 rounded-full border-2 cursor-pointer
                    ${player.user.id === currentUser.id ? 'border-blue-500' : 'border-gray-300'}
                  `}
                  onClick={() => handlePlayerClick(player.id, player.user.id)}
                >
                  <Image
                    src={player.user.avatar}
                    alt={`${player.user.pseudo} avatar`}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                </div>
                
                {selectedPlayer === player.id && player.user.id === currentUser.id && (
                  <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-max">
                    <button
                      onClick={handleLeaveMatch}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                      Quitter la liste d'attente
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="font-medium text-gray-800">{player.user.pseudo}</div>
                <div className="text-sm text-gray-500">{index + 1}ère position</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const MatchInfo = () => (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex justify-center items-center mb-4">
        <div className="text-center">
          {match.status === 'full' && (
            <span className="inline-block px-3 py-2 bg-red-100 text-red-700 text-sm rounded-full font-medium">
              Match complet
            </span>
          )}
          {match.status === 'cancelled' && (
            <span
              data-testid="cancelled-indicator"
              className="inline-block px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-full font-medium"
            >
              Match annulé
            </span>
          )}
          {match.status === 'open' && match.players.length < match.maxPlayers && (
            <span className="inline-block px-3 py-2 bg-green-100 text-green-700 text-sm rounded-full font-medium">
              Places disponibles
            </span>
          )}
        </div>
      </div>
    </div>
  )

  const BadmintonCourt = () => (
    <div
      data-testid="badminton-court"
      className="relative bg-orange-400 rounded-lg p-4 min-h-[400px] mb-6"
      style={{
        backgroundImage: `
          linear-gradient(90deg, white 0%, transparent 2%, transparent 98%, white 100%),
          linear-gradient(0deg, white 0%, transparent 2%, transparent 98%, white 100%)
        `
      }}
    >
      {/* Net */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white transform -translate-y-0.5"></div>

      {/* Team A (Top side) */}
      <div
        data-testid="team-a-side"
        className="absolute left-4 right-4 top-4 h-1/2 flex flex-col justify-center items-center"
      >
        <div className="text-white font-bold mb-4">Équipe A</div>
        <div className="grid grid-cols-2 gap-8">
          {[...Array(2)].map((_, index) => (
            <div key={index} data-testid={`position-a-${index + 1}`}>
              <PlayerAvatar
                player={teamA[index]}
                position={index + 1}
                team="A"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Team B (Bottom side) */}
      <div
        data-testid="team-b-side"
        className="absolute left-4 right-4 bottom-4 h-1/2 flex flex-col justify-center items-center"
      >
        <div className="text-white font-bold mb-4">Équipe B</div>
        <div className="grid grid-cols-2 gap-8">
          {[...Array(2)].map((_, index) => (
            <div key={index} data-testid={`position-b-${index + 1}`}>
              <PlayerAvatar
                player={teamB[index]}
                position={index + 3}
                team="B"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const VolleyballCourt = () => (
    <div
      data-testid="volleyball-court"
      className="relative bg-yellow-500 rounded-lg p-4 min-h-[400px] mb-6"
      style={{
        backgroundImage: `
          linear-gradient(90deg, white 0%, transparent 2%, transparent 98%, white 100%),
          linear-gradient(0deg, white 0%, transparent 2%, transparent 98%, white 100%)
        `
      }}
    >
      {/* Net */}
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-white transform -translate-y-0.5"></div>

      {/* Team A (Top side) */}
      <div
        data-testid="team-a-side"
        className="absolute left-4 right-4 top-4 h-1/2 flex flex-col justify-center items-center"
      >
        <div className="text-white font-bold mb-4">Équipe A</div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} data-testid={`position-a-${index + 1}`}>
              <PlayerAvatar
                player={teamA[index]}
                position={index + 1}
                team="A"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Team B (Bottom side) */}
      <div
        data-testid="team-b-side"
        className="absolute left-4 right-4 bottom-4 h-1/2 flex flex-col justify-center items-center"
      >
        <div className="text-white font-bold mb-4">Équipe B</div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} data-testid={`position-b-${index + 1}`}>
              <PlayerAvatar
                player={teamB[index]}
                position={index + 7}
                team="B"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const RugbyField = () => (
    <div
      data-testid="rugby-field"
      className="relative bg-green-600 rounded-lg p-4 min-h-[400px] mb-6"
      style={{
        backgroundImage: `
          linear-gradient(90deg, white 0%, transparent 2%, transparent 98%, white 100%),
          linear-gradient(0deg, white 0%, transparent 2%, transparent 98%, white 100%)
        `
      }}
    >
      {/* Center line */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white transform -translate-y-0.5"></div>

      {/* Team A (Top side) */}
      <div
        data-testid="team-a-side"
        className="absolute left-4 right-4 top-4 h-1/2 flex flex-col justify-center items-center"
      >
        <div className="text-white font-bold mb-4">Équipe A</div>
        <div className="grid grid-cols-5 gap-3">
          {[...Array(8)].map((_, index) => (
            <div key={index} data-testid={`position-a-${index + 1}`}>
              <PlayerAvatar
                player={teamA[index]}
                position={index + 1}
                team="A"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Team B (Bottom side) */}
      <div
        data-testid="team-b-side"
        className="absolute left-4 right-4 bottom-4 h-1/2 flex flex-col justify-center items-center"
      >
        <div className="text-white font-bold mb-4">Équipe B</div>
        <div className="grid grid-cols-5 gap-3">
          {[...Array(8)].map((_, index) => (
            <div key={index} data-testid={`position-b-${index + 1}`}>
              <PlayerAvatar
                player={teamB[index]}
                position={index + 9}
                team="B"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const getSportField = () => {
    switch (match.sport) {
      case 'pingpong':
        return <PingPongTable />
      case 'badminton':
        return <BadmintonCourt />
      case 'volley':
        return <VolleyballCourt />
      case 'rugby':
        return <RugbyField />
      case 'football':
      default:
        return <FootballField />
    }
  }

  const EmptyState = () => (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <div className="text-gray-400 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-600 mb-2">Aucun joueur inscrit</h3>
      <p className="text-gray-500">Soyez le premier à rejoindre ce match !</p>
    </div>
  )


  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div data-testid="loading-indicator" className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div
      data-testid={isMobile ? 'mobile-layout' : 'desktop-layout'}
      className="max-w-4xl mx-auto p-4"
    >
      <MatchInfo />

      {/* Toujours afficher le terrain, même sans joueurs */}
      {getSportField()}

      {/* Afficher la liste d'attente */}
      <WaitingList />

      {/* Message d'encouragement si aucun joueur */}
      {match.players.length === 0 && match.waitingList.length === 0 && (
        <div className="text-center py-6 bg-blue-50 rounded-lg mt-4">
          <div className="text-blue-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-blue-600 mb-1">Aucun joueur inscrit</h3>
          <p className="text-blue-500 text-sm">Soyez le premier à rejoindre cette activité !</p>
        </div>
      )}
    </div>
  )
}

export default MatchView