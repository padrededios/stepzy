/**
 * Match-related type definitions
 */

export interface MatchPlayer {
  id: string;
  userId: string;
  matchId: string;
  status: 'confirmed' | 'waiting';
  joinedAt: Date;
  user: {
    id: string;
    pseudo: string;
    avatar: string | null;
  };
}

export interface Match {
  id: string;
  date: Date;
  sport: string;
  maxPlayers: number;
  status: 'open' | 'full' | 'cancelled' | 'completed';
  description?: string;
  players: MatchPlayer[];
  waitingList: MatchPlayer[];
}

export interface MatchActivity extends Match {
  currentPlayers: number;
  isParticipant: boolean;
  isWaitingList: boolean;
}

export type MatchStatus = 'open' | 'full' | 'cancelled' | 'completed';
export type PlayerStatus = 'confirmed' | 'waiting';