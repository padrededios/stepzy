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
    code: string;
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
interface JoinActivityByCodeData {
    code: string;
}
interface ActivityCodeResponse {
    activity: Activity;
    alreadyMember: boolean;
}
interface ActivityCodeInfo {
    name: string;
    sport: SportType;
    creator: {
        pseudo: string;
        avatar: string | null;
    };
    minPlayers: number;
    maxPlayers: number;
    recurringDays: DayOfWeek[];
    recurringType: RecurringType;
}
declare const DAY_LABELS: Record<DayOfWeek, string>;
declare const RECURRING_TYPE_LABELS: Record<RecurringType, string>;
declare const PARTICIPANT_STATUS_LABELS: Record<ParticipantStatus, string>;

/**
 * Types pour le système de notifications
 */
type NotificationType = 'match_created' | 'match_updated' | 'match_cancelled' | 'match_reminder' | 'match_joined' | 'match_left' | 'waiting_list_promoted' | 'session_confirmed' | 'session_cancelled' | 'session_reminder' | 'new_sessions_available' | 'announcement' | 'system';
interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    read: boolean;
    matchId?: string | null;
    activityId?: string | null;
    sessionId?: string | null;
    createdAt: Date;
    updatedAt: Date;
    match?: {
        id: string;
        date: Date;
        status: string;
    };
    activity?: {
        id: string;
        name: string;
        sport: string;
    };
    session?: {
        id: string;
        date: Date;
    };
}
interface NotificationFilters {
    unreadOnly?: boolean;
    type?: NotificationType;
    limit?: number;
    offset?: number;
}
interface NotificationResponse {
    notifications: Notification[];
    total: number;
}
interface UnreadCount {
    count: number;
}
interface WSNotificationMessage {
    type: 'notification' | 'connected' | 'error';
    data?: Notification | {
        message: string;
    };
}

/**
 * Types pour le système de chat
 */

interface ChatRoom {
    id: string;
    activityId: string;
    createdAt: Date;
    updatedAt: Date;
    activity?: {
        id: string;
        name: string;
        sport: SportType;
        creator?: {
            id: string;
            pseudo: string;
            avatar: string | null;
        };
    };
}
interface ChatMessage {
    id: string;
    roomId: string;
    senderId: string;
    content: string;
    originalContent?: string | null;
    isModerated: boolean;
    createdAt: Date;
    updatedAt: Date;
    sender: {
        id: string;
        pseudo: string;
        avatar: string | null;
    };
}
interface ChatRoomReadStatus {
    id: string;
    roomId: string;
    userId: string;
    lastReadAt: Date;
    lastMessageId?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
interface ChatRoomWithStats extends ChatRoom {
    activityName: string;
    sport: SportType;
    messageCount: number;
    unreadCount?: number;
}
type WSChatMessageType = 'message' | 'typing' | 'read' | 'error' | 'connected';
interface WSChatMessage {
    type: WSChatMessageType;
    data?: ChatMessage | TypingIndicator | ErrorMessage;
}
interface TypingIndicator {
    userId: string;
    pseudo: string;
    isTyping: boolean;
}
interface ErrorMessage {
    message: string;
}
interface SendMessageRequest {
    content: string;
}
interface TypingRequest {
    isTyping: boolean;
}
interface UnreadCounts {
    rooms: Array<{
        roomId: string;
        activityId: string;
        activityName: string;
        unreadCount: number;
    }>;
    total: number;
}
interface GetMessagesOptions {
    limit?: number;
    before?: string;
}

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

export { type Activity, type ActivityCodeInfo, type ActivityCodeResponse, type ActivityFilters, type ActivityParticipant, type ActivitySession, type ActivityWithStats, type ApiResponse, type ChatMessage, type ChatRoom, type ChatRoomReadStatus, type ChatRoomWithStats, type CreateActivityData, type CreateUserData, DAY_LABELS, type DayOfWeek, type ErrorMessage, type GetMessagesOptions, type JoinActivityByCodeData, type LoginData, type Match, type MatchActivity, type MatchPlayer, type MatchStatus, type Notification, type NotificationFilters, type NotificationResponse, type NotificationType, PARTICIPANT_STATUS_LABELS, type ParticipantStatus, type PlayerStatus, RECURRING_TYPE_LABELS, type RecurringType, type SendMessageRequest, type SessionFilters, type SessionStatus, type SessionWithParticipants, SportType, type TypingIndicator, type TypingRequest, type UnreadCount, type UnreadCounts, type UpdateActivityData, type UpdateSessionData, type UpdateUserData, type User, type UserProfile, type UserRole, type UserStats, type WSChatMessage, type WSChatMessageType, type WSNotificationMessage };
