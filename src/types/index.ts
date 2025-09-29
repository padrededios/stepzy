/**
 * Main type exports for the application
 */

// Re-export all types from specific modules
export * from './user';
export * from './match';

// Common API types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form data types
export interface CreateUserData {
  email: string;
  password: string;
  pseudo: string;
  avatar?: string;
  role?: 'user' | 'root';
}

export interface UpdateUserData {
  pseudo?: string;
  avatar?: string;
  email?: string;
}

export interface LoginData {
  email: string;
  password: string;
}
