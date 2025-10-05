import { SportType } from '../constants/index.js';

/**
 * User-related type definitions
 */
interface User {
    id: string;
    email: string;
    pseudo: string;
    avatar?: string | null;
    role: 'user' | 'root';
}
interface UserStats {
    totalMatches: number;
    confirmedMatches: number;
    waitingMatches: number;
    completedMatches: number;
}
interface UserProfile extends User {
    stats?: UserStats;
    badges?: string[];
    joinedAt?: Date;
    lastActive?: Date;
}
type UserRole = 'user' | 'root';

/**
 * Match-related type definitions
 */
interface MatchPlayer {
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
interface Match {
    id: string;
    date: Date;
    sport: string;
    maxPlayers: number;
    status: 'open' | 'full' | 'cancelled' | 'completed';
    description?: string;
    players: MatchPlayer[];
    waitingList: MatchPlayer[];
}
interface MatchActivity extends Match {
    currentPlayers: number;
    isParticipant: boolean;
    isWaitingList: boolean;
}
type MatchStatus = 'open' | 'full' | 'cancelled' | 'completed';
type PlayerStatus = 'confirmed' | 'waiting';

/**
 * Types pour le système d'activités récurrentes
 */

type RecurringType = 'weekly' | 'monthly';
type SessionStatus = 'active' | 'cancelled' | 'completed';
type ParticipantStatus = 'interested' | 'confirmed' | 'waiting';
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
interface Activity {
    id: string;
    name: string;
    description?: string;
    sport: SportType;
    minPlayers: number;
    maxPlayers: number;
    createdBy: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    recurringDays: DayOfWeek[];
    recurringType: RecurringType;
    startTime: string;
    endTime: string;
    creator: {
        id: string;
        pseudo: string;
        avatar: string | null;
    };
    sessions?: ActivitySession[];
}
interface ActivitySession {
    id: string;
    activityId: string;
    date: Date;
    status: SessionStatus;
    maxPlayers: number;
    isCancelled: boolean;
    createdAt: Date;
    updatedAt: Date;
    activity?: Activity;
    participants?: ActivityParticipant[];
    currentParticipants?: number;
    confirmedParticipants?: number;
    waitingParticipants?: number;
}
interface ActivityParticipant {
    id: string;
    sessionId: string;
    userId: string;
    status: ParticipantStatus;
    joinedAt: Date;
    session?: ActivitySession;
    user: {
        id: string;
        pseudo: string;
        avatar: string | null;
    };
}
interface CreateActivityData {
    name: string;
    description?: string;
    sport: SportType;
    minPlayers: number;
    maxPlayers: number;
    recurringDays: DayOfWeek[];
    recurringType: RecurringType;
    startTime: string;
    endTime: string;
}
interface UpdateActivityData {
    name?: string;
    description?: string;
    minPlayers?: number;
    maxPlayers?: number;
    recurringDays?: DayOfWeek[];
    recurringType?: RecurringType;
}
interface UpdateSessionData {
    maxPlayers?: number;
    isCancelled?: boolean;
}
interface ActivityWithStats extends Activity {
    totalSessions: number;
    upcomingSessions: number;
    totalParticipants: number;
    averageParticipation: number;
}
interface SessionWithParticipants extends ActivitySession {
    participants: ActivityParticipant[];
    currentParticipants: number;
    confirmedParticipants: number;
    waitingParticipants: number;
    userParticipation?: ActivityParticipant | null;
}
interface ActivityFilters {
    sport?: SportType;
    createdBy?: string;
    isPublic?: boolean;
    recurringType?: RecurringType;
    recurringDays?: DayOfWeek[];
}
interface SessionFilters {
    activityId?: string;
    status?: SessionStatus;
    dateFrom?: Date;
    dateTo?: Date;
    hasSpots?: boolean;
}
declare const DAY_LABELS: Record<DayOfWeek, string>;
declare const RECURRING_TYPE_LABELS: Record<RecurringType, string>;
declare const PARTICIPANT_STATUS_LABELS: Record<ParticipantStatus, string>;

/**
 * Main type exports for the application
 */

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
interface CreateUserData {
    email: string;
    password: string;
    pseudo: string;
    avatar?: string;
    role?: 'user' | 'root';
}
interface UpdateUserData {
    pseudo?: string;
    avatar?: string;
    email?: string;
}
interface LoginData {
    email: string;
    password: string;
}

export { type Activity, type ActivityFilters, type ActivityParticipant, type ActivitySession, type ActivityWithStats, type ApiResponse, type CreateActivityData, type CreateUserData, DAY_LABELS, type DayOfWeek, type LoginData, type Match, type MatchActivity, type MatchPlayer, type MatchStatus, PARTICIPANT_STATUS_LABELS, type ParticipantStatus, type PlayerStatus, RECURRING_TYPE_LABELS, type RecurringType, type SessionFilters, type SessionStatus, type SessionWithParticipants, SportType, type UpdateActivityData, type UpdateSessionData, type UpdateUserData, type User, type UserProfile, type UserRole, type UserStats };
