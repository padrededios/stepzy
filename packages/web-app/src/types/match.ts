/**
 * Match-related type definitions
 */

import { SportType } from '@/config/sports';
import { User } from './user';

export interface MatchPlayer {
  id: string;
  userId: string;
  matchId: string;
  status: 'confirmed' | 'waiting';
  joinedAt: Date;
  user: Partial<User> & { id: string; pseudo: string };
}

export interface Match {
  id: string;
  date: Date;
  sport: SportType;
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