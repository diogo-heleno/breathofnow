/**
 * Types Index - Export all types for easy importing
 * 
 * Note: Some types like AppId and AppStatus are defined in multiple places
 * for backward compatibility. Use the ones from 'common' for new code.
 */

// Common types (prefer these for new code)
export type {
  BaseEntity,
  SyncableEntity,
  User,
  UserProfile,
  Subscription,
  SyncStatus,
  SyncDirection,
  SyncResult,
  SyncQueueItem,
  PriceTier,
  RegionalPricing,
  PricePoint,
  Theme,
  Toast,
  ApiResponse,
  PaginatedResponse,
  SortDirection,
  SortConfig,
  DateRange,
  FormField,
  Locale,
  LocaleConfig,
  ExportFormat,
  ExportOptions,
  ImportResult,
  ImportMapping,
  // Common AppId and AppStatus
  AppId as CommonAppId,
  AppStatus as CommonAppStatus,
  AppInfo,
  SubscriptionTier,
} from './common';

// FitLog-specific types
export * from './fitlog';

// Pricing-specific types (includes legacy AppId and AppStatus)
export * from './pricing';
