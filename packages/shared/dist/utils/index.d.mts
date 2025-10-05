/**
 * Utilities for date formatting and manipulation
 */
declare const formatDate: (date: Date | string) => string;
declare const formatTime: (date: Date | string) => string;
declare const formatDateTime: (date: Date | string) => string;
declare const formatDateShort: (date: Date | string) => string;
declare const isToday: (date: Date | string) => boolean;
declare const isFuture: (date: Date | string) => boolean;
declare const isPast: (date: Date | string) => boolean;
declare const getTimeUntil: (date: Date | string) => string | null;

export { formatDate, formatDateShort, formatDateTime, formatTime, getTimeUntil, isFuture, isPast, isToday };
