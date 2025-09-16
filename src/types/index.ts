// Types pour l'application futsal
export type UserRole = 'user' | 'root';

export type MatchStatus = 'scheduled' | 'cancelled' | 'completed';

export type PlayerStatus = 'titulaire' | 'remplaçant';

export interface User {
  id: string;
  email: string;
  pseudo: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  date: Date;
  status: MatchStatus;
  createdAt: Date;
  updatedAt: Date;
  players: MatchPlayer[];
}

export interface MatchPlayer {
  id: string;
  userId: string;
  matchId: string;
  status: PlayerStatus;
  joinedAt: Date;
  user: User;
  match: Match;
}

// Types pour les opérations CRUD
export interface CreateUserData {
  email: string;
  password: string;
  pseudo: string;
  avatar?: string;
  role?: UserRole;
}

export interface CreateMatchData {
  date: Date;
  status?: MatchStatus;
}

export interface JoinMatchData {
  userId: string;
  matchId: string;
}
