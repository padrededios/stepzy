/**
 * User-related type definitions
 */

export interface User {
  id: string;
  email: string;
  pseudo: string;
  avatar?: string | null;
  role: 'user' | 'root';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserStats {
  totalMatches: number;
  confirmedMatches: number;
  waitingMatches: number;
  completedMatches: number;
}

export interface UserProfile extends User {
  stats?: UserStats;
  badges?: string[];
  joinedAt?: Date;
  lastActive?: Date;
}

export type UserRole = 'user' | 'root';