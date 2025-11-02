export type SportType = 'football' | 'badminton' | 'volley' | 'pingpong' | 'rugby'

export interface SportConfig {
  id: SportType
  name: string
  icon: string
  maxPlayers: number
  minPlayers: number
  description: string
  color: string
  terrainImage: string
}

export const SPORTS_CONFIG: Record<SportType, SportConfig> = {
  football: {
    id: 'football',
    name: 'Football',
    icon: '/images/fox_football.jpg',
    maxPlayers: 12,
    minPlayers: 8,
    description: 'Match de football à 5 contre 5 avec remplaçants',
    color: 'bg-green-500',
    terrainImage: '/images/terrain_football.png'
  },
  badminton: {
    id: 'badminton',
    name: 'Badminton',
    icon: '/images/fox_badminton.png',
    maxPlayers: 4,
    minPlayers: 2,
    description: 'Parties de badminton en simple ou double',
    color: 'bg-yellow-500',
    terrainImage: '/images/terrain_badminton.png'
  },
  volley: {
    id: 'volley',
    name: 'Volleyball',
    icon: '/images/fox_volley.png',
    maxPlayers: 12,
    minPlayers: 6,
    description: 'Match de volleyball 6 contre 6',
    color: 'bg-orange-500',
    terrainImage: '/images/terrain_volley.png'
  },
  pingpong: {
    id: 'pingpong',
    name: 'Ping-Pong',
    icon: '/images/fox_pingpong.png',
    maxPlayers: 4,
    minPlayers: 2,
    description: 'Tournoi de ping-pong en simple ou double',
    color: 'bg-red-500',
    terrainImage: '/images/table_ping_pong.png'
  },
  rugby: {
    id: 'rugby',
    name: 'Rugby',
    icon: '/images/fox_rugbypng.png',
    maxPlayers: 15,
    minPlayers: 10,
    description: 'Match de rugby à XV',
    color: 'bg-purple-500',
    terrainImage: '/images/terrain_rugby.png'
  }
}

export const getSportConfig = (sport: SportType): SportConfig => {
  return SPORTS_CONFIG[sport]
}

export const getAllSports = (): SportConfig[] => {
  return Object.values(SPORTS_CONFIG)
}