/**
 * Authentication Library - Better-auth v1.3.8
 * 
 * This file centralizes all authentication functionality using better-auth library.
 * 
 * Available functions from better-auth (via ./config and ./utils):
 * - auth.api.signUp(): User registration with email/password validation
 * - auth.api.signIn(): User login with credentials verification  
 * - auth.api.signOut(): Logout and session cleanup
 * - auth.api.getSession(): Retrieve current user session from request
 * - auth.api.updateUser(): Update user profile information
 * - auth.api.changePassword(): Change user password with validation
 * - auth.api.deleteUser(): Delete user account and cleanup
 * - auth.api.sendVerificationEmail(): Send email verification
 * - auth.api.verifyEmail(): Verify email with token
 * - auth.api.sendPasswordResetEmail(): Send password reset email
 * - auth.api.resetPassword(): Reset password with token
 * - auth.api.revokeSession(): Revoke specific session
 * - auth.api.listSessions(): List all user sessions
 * - auth.api.admin.createUser(): Admin function to create users
 * - auth.api.admin.deleteUser(): Admin function to delete users
 * - auth.api.admin.listUsers(): Admin function to list all users
 * - auth.api.admin.updateUser(): Admin function to update user data
 * 
 * Utility functions (via ./utils):
 * - validateUserRole(): Check if user has required role
 * - isAuthenticated(): Check if user is authenticated
 * - requireAuth(): Middleware to require authentication
 * - requireAdmin(): Middleware to require admin role
 * - hashPassword(): Hash password with bcrypt
 * - verifyPassword(): Verify password against hash
 * 
 * Configuration includes:
 * - PostgreSQL database adapter (Prisma)
 * - Email/password authentication
 * - Admin role management
 * - Rate limiting protection
 * - OpenAPI documentation generation
 */

// Export principal pour l'authentification
export { auth } from './config';
export * from './utils';

// Types pour l'authentification
export interface User {
  id: string;
  email: string;
  pseudo: string;
  avatar?: string | null;
  role: 'user' | 'root';
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: User;
  session: {
    token: string;
    expiresAt: Date;
  };
}

export interface SignUpData {
  email: string;
  password: string;
  pseudo: string;
  avatar?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Constantes
export const AUTH_ROUTES = {
  SIGN_IN: '/login',
  SIGN_UP: '/register',
  SIGN_OUT: '/api/auth/sign-out',
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
} as const;

export const USER_ROLES = {
  USER: 'user',
  ROOT: 'root',
} as const;
