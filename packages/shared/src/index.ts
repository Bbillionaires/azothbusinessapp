// =============================================================================
// @local-first-rewards/shared — Public API
// =============================================================================

// Types
export type { UserRole, UserTier, Profile, ProfileInsert, ProfileUpdate, UserSettings, UserSettingsUpdate, ProfileWithSettings, ProfilePublic, TierInfo } from './types/user.js';
export type { BusinessStatus, VerificationLevel, VerificationRequestStatus, SocialPlatform, DayOfWeek, DayHours, BusinessHours, Business, BusinessInsert, BusinessUpdate, BusinessPhoto, BusinessVideo, BusinessService, BusinessSocial, BusinessFollower, VerificationDocument, BusinessVerificationRequest, BusinessFull, BusinessCard, BusinessCategory } from './types/business.js';
export { BUSINESS_CATEGORIES } from './types/business.js';
export type { ReceiptStatus, ReceiptFraudFlag, ReceiptLineItem, OcrData, Receipt, ReceiptInsert, FingerprintHashType, ReceiptFingerprint, ReceiptWithBusiness, ReceiptSummary, ReceiptUploadPayload } from './types/receipt.js';
export type { RewardType, RedemptionStatus, TransactionType, PointsReferenceType, RewardCatalogItem, RewardCatalogInsert, RewardRedemption, PointsTransaction, RewardCatalogWithBusiness, RedemptionWithReward, PointsLedgerEntry, PointsBalance } from './types/rewards.js';
export type { EventType, EventStatus, RsvpStatus, Event, EventInsert, EventUpdate, EventRsvp, EventWithOrganizer, EventCard, EventTypeConfig } from './types/events.js';
export type { JobType, SalaryType, ApplicationStatus, JobPosting, JobPostingInsert, JobPostingUpdate, JobApplication, JobApplicationInsert, UserResume, JobPostingWithBusiness, JobCard, ApplicationWithJob, JobTypeConfig } from './types/jobs.js';
export type { LegendTier, LeaderboardPeriod, LeaderboardCategory, UserBadge, BadgeType, Achievement, AchievementCriteriaType, AchievementCriteria, UserAchievement, UserAchievementWithDetails, LeaderboardEntry, LeaderboardEntryWithProfile, SpendingStreak, CommunityLegend, CommunityLegendWithProfile } from './types/badges.js';

// Constants
export { BADGE_DEFINITIONS, getBadgeDefinition, getBadgesByCategory } from './constants/badges.js';
export type { BadgeDefinition, BadgeLevelDefinition } from './constants/badges.js';
export { POINTS_CONFIG, TIER_THRESHOLDS, LEGEND_TIER_THRESHOLDS, getTierInfo, getPointsToNextTier, getTierProgressPct, calculateReceiptPoints, TIER_MAP } from './constants/points.js';

// Utils
export * from './utils/formatting.js';
