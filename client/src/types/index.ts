// Chat UI Overhaul - Main Type Exports
// Re-export all types from individual modules for easy importing

export * from './chat';

// Additional common types that might be used across the application
export interface User {
  id: string;
  _id?: string; // MongoDB compatibility
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  role?: 'user' | 'admin' | 'moderator';
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

export interface ErrorState {
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
}

export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
}

// UI Component Props Types
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface ClickableComponentProps extends BaseComponentProps {
  onClick?: (event: React.MouseEvent) => void;
  disabled?: boolean;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  };
}

export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Notification Types
export interface NotificationData {
  id: string;
  type: 'message' | 'mention' | 'reaction' | 'system';
  title: string;
  body: string;
  data?: any;
  timestamp: Date;
  isRead: boolean;
}

// Search Types
export interface SearchResult {
  id: string;
  type: 'chat' | 'message' | 'user';
  title: string;
  subtitle?: string;
  content?: string;
  highlight?: string;
  metadata?: any;
}

export interface SearchFilters {
  type?: 'all' | 'chats' | 'messages' | 'users';
  dateRange?: {
    start: Date;
    end: Date;
  };
  chatId?: string;
  userId?: string;
}

// Theme Types
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  colors: ThemeColors;
  fontSize: 'small' | 'medium' | 'large';
  borderRadius: number;
  spacing: number;
}

// Settings Types
export interface UserSettings {
  theme: ThemeConfig;
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    desktop: boolean;
    email: boolean;
  };
  privacy: {
    readReceipts: boolean;
    lastSeen: boolean;
    onlineStatus: boolean;
    profilePhoto: 'everyone' | 'contacts' | 'nobody';
  };
  chat: {
    enterToSend: boolean;
    mediaAutoDownload: boolean;
    linkPreviews: boolean;
    emojiSuggestions: boolean;
  };
  language: string;
  timezone: string;
}

// Device/Platform Types
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux';
  browser?: string;
  version?: string;
  userAgent: string;
}

// Geolocation Types
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

export interface AddressData {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formattedAddress: string;
}

// Contact Types
export interface ContactInfo {
  name: string;
  phone?: string;
  email?: string;
  organization?: string;
  avatar?: string;
}

// Media Types
export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  size: number;
  thumbnail?: string;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event Types
export interface CustomEvent<T = any> {
  type: string;
  data: T;
  timestamp: Date;
  source?: string;
}

// Cache Types
export interface CacheEntry<T = any> {
  data: T;
  timestamp: Date;
  expiresAt?: Date;
  key: string;
}

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number; // Time to live in milliseconds
  cleanupInterval: number;
}

// Performance Types
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
  networkLatency?: number;
  timestamp: Date;
}

// Accessibility Types
export interface A11yConfig {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
}