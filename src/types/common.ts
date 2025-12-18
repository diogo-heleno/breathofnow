/**
 * Common Types - Shared across all Breath of Now apps
 */

// ============================================
// BASE TYPES
// ============================================

/**
 * Base interface for all entities with timestamps
 */
export interface BaseEntity {
  id?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for syncable items
 */
export interface SyncableEntity extends BaseEntity {
  syncedAt?: Date;
  syncStatus: 'pending' | 'synced' | 'conflict';
  deletedAt?: Date;
}

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface UserProfile extends User {
  tier: 'free' | 'pro';
  locale: string;
  selectedApps: string[];
  stripeCustomerId?: string;
  subscriptionEndDate?: Date;
}

// ============================================
// APP TYPES
// ============================================

export type AppId = 
  | 'expenses' 
  | 'investments' 
  | 'fitlog' 
  | 'strava' 
  | 'recipes' 
  | 'labels';

export type AppStatus = 'available' | 'beta' | 'coming-soon';

export interface AppInfo {
  id: AppId;
  name: string;
  nameKey: string; // i18n key
  descriptionKey: string; // i18n key
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  bgColor: string; // Tailwind bg color class
  status: AppStatus;
  route: string;
}

// ============================================
// SUBSCRIPTION TYPES
// ============================================

export type SubscriptionTier = 'free' | 'pro';

export interface Subscription {
  tier: SubscriptionTier;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
}

// ============================================
// SYNC TYPES
// ============================================

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';
export type SyncDirection = 'push' | 'pull' | 'both';

export interface SyncResult {
  success: boolean;
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
  timestamp: Date;
}

export interface SyncQueueItem {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  table: string;
  localId: number;
  data?: unknown;
  timestamp: Date;
  retryCount: number;
}

// ============================================
// PRICING TYPES
// ============================================

export type PriceTier = 'high' | 'medium' | 'low';

export interface RegionalPricing {
  country: string;
  currency: string;
  tier: PriceTier;
  multiplier: number;
}

export interface PricePoint {
  monthly: number;
  yearly: number;
  lifetime?: number;
  currency: string;
}

// ============================================
// UI TYPES
// ============================================

export type Theme = 'light' | 'dark' | 'system';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// FILTER & SORT TYPES
// ============================================

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// ============================================
// FORM TYPES
// ============================================

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'date' | 'select' | 'checkbox' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// ============================================
// LOCALE TYPES
// ============================================

export type Locale = 'en' | 'pt' | 'es' | 'fr';

export interface LocaleConfig {
  code: Locale;
  name: string;
  nativeName: string;
  dateFormat: string;
  numberFormat: {
    decimal: string;
    thousand: string;
  };
  currency: string;
}

// ============================================
// EXPORT TYPES
// ============================================

export type ExportFormat = 'json' | 'csv' | 'xlsx' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  dateRange?: DateRange;
  includeDeleted?: boolean;
}

// ============================================
// IMPORT TYPES
// ============================================

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export interface ImportMapping {
  sourceColumn: string;
  targetField: string;
  transform?: (value: unknown) => unknown;
}
