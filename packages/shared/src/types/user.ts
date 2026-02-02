/**
 * User-related type definitions
 */

export interface User {
  id: string;
  email: string;
  pseudo: string;
  avatar?: string | null;
  role: 'user' | 'root';
}

export interface SportStat {
  sport: string;
  totalMatches: number;
  completedMatches: number;
  cancelledMatches: number;
  hoursPlayed: number;
}

export interface MonthlyActivity {
  month: string;
  matches: number;
}

export interface UserStats {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  activeSessions: number;
  attendanceRate: number;
  favoriteTime: string;
  currentStreak: number;
  longestStreak: number;
  totalHours: number;
  sportStats: SportStat[];
  monthlyActivity: MonthlyActivity[];
  uniqueSports: number;
}

export interface UserProfile extends User {
  stats?: UserStats;
  badges?: string[];
  joinedAt?: Date;
  lastActive?: Date;
}

export type UserRole = 'user' | 'root';