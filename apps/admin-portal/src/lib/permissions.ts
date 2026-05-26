import type { AdminRole } from './supabase';

// Permissions matrix
const PERMISSIONS = {
  // Receipt management
  reviewReceipts: ['admin_staff', 'admin_manager', 'super_admin'],
  bulkReviewReceipts: ['admin_manager', 'super_admin'],

  // Business management
  viewBusinesses: ['admin_staff', 'admin_manager', 'super_admin'],
  manageBusinesses: ['admin_manager', 'super_admin'],
  approveVerification: ['admin_manager', 'super_admin'],

  // User management
  viewUsers: ['admin_staff', 'admin_manager', 'super_admin'],
  manageUsers: ['admin_manager', 'super_admin'],
  suspendUsers: ['admin_manager', 'super_admin'],

  // Verification
  manageVerification: ['admin_manager', 'super_admin'],

  // Disputes
  viewDisputes: ['admin_staff', 'admin_manager', 'super_admin'],
  resolveDisputes: ['admin_manager', 'super_admin'],

  // Rewards
  viewRewards: ['admin_manager', 'super_admin'],
  manageRewards: ['admin_manager', 'super_admin'],

  // Advertising
  viewAdvertising: ['admin_manager', 'super_admin'],
  manageAdvertising: ['admin_manager', 'super_admin'],

  // Legends
  viewLegends: ['admin_manager', 'super_admin'],
  manageLegends: ['admin_manager', 'super_admin'],

  // Analytics
  viewAnalytics: ['admin_manager', 'super_admin'],
  viewFullAnalytics: ['super_admin'],

  // Fraud
  viewFraud: ['admin_manager', 'super_admin'],
  manageFraud: ['super_admin'],

  // Audit logs
  viewAuditLogs: ['super_admin'],

  // System settings
  accessSettings: ['super_admin'],

  // Notifications
  sendNotifications: ['admin_manager', 'super_admin'],

  // Exports
  exportData: ['super_admin'],

  // Reporting
  viewReports: ['admin_staff', 'admin_manager', 'super_admin'],
  exportReports: ['admin_manager', 'super_admin'],
} as const satisfies Record<string, readonly AdminRole[]>;

type Permission = keyof typeof PERMISSIONS;

function hasPermission(role: AdminRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

// Granular permission checkers
export function canReviewReceipts(role: AdminRole): boolean {
  return hasPermission(role, 'reviewReceipts');
}

export function canBulkReviewReceipts(role: AdminRole): boolean {
  return hasPermission(role, 'bulkReviewReceipts');
}

export function canViewBusinesses(role: AdminRole): boolean {
  return hasPermission(role, 'viewBusinesses');
}

export function canManageBusinesses(role: AdminRole): boolean {
  return hasPermission(role, 'manageBusinesses');
}

export function canApproveVerification(role: AdminRole): boolean {
  return hasPermission(role, 'approveVerification');
}

export function canViewUsers(role: AdminRole): boolean {
  return hasPermission(role, 'viewUsers');
}

export function canManageUsers(role: AdminRole): boolean {
  return hasPermission(role, 'manageUsers');
}

export function canSuspendUsers(role: AdminRole): boolean {
  return hasPermission(role, 'suspendUsers');
}

export function canManageVerification(role: AdminRole): boolean {
  return hasPermission(role, 'manageVerification');
}

export function canViewDisputes(role: AdminRole): boolean {
  return hasPermission(role, 'viewDisputes');
}

export function canResolveDisputes(role: AdminRole): boolean {
  return hasPermission(role, 'resolveDisputes');
}

export function canManageRewards(role: AdminRole): boolean {
  return hasPermission(role, 'manageRewards');
}

export function canViewAdvertising(role: AdminRole): boolean {
  return hasPermission(role, 'viewAdvertising');
}

export function canManageAdvertising(role: AdminRole): boolean {
  return hasPermission(role, 'manageAdvertising');
}

export function canViewLegends(role: AdminRole): boolean {
  return hasPermission(role, 'viewLegends');
}

export function canManageLegends(role: AdminRole): boolean {
  return hasPermission(role, 'manageLegends');
}

export function canViewAnalytics(role: AdminRole): boolean {
  return hasPermission(role, 'viewAnalytics');
}

export function canViewFraud(role: AdminRole): boolean {
  return hasPermission(role, 'viewFraud');
}

export function canManageFraud(role: AdminRole): boolean {
  return hasPermission(role, 'manageFraud');
}

export function canViewAuditLogs(role: AdminRole): boolean {
  return hasPermission(role, 'viewAuditLogs');
}

export function canAccessSettings(role: AdminRole): boolean {
  return hasPermission(role, 'accessSettings');
}

export function canExportReports(role: AdminRole): boolean {
  return hasPermission(role, 'exportReports');
}

export function canSendNotifications(role: AdminRole): boolean {
  return hasPermission(role, 'sendNotifications');
}

export function canExportData(role: AdminRole): boolean {
  return hasPermission(role, 'exportData');
}

// Role display helpers
export const ROLE_LABELS: Record<AdminRole, string> = {
  admin_staff: 'Staff',
  admin_manager: 'Manager',
  super_admin: 'Super Admin',
};

export const ROLE_COLORS: Record<AdminRole, string> = {
  admin_staff: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  admin_manager: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  super_admin: 'bg-brand-green-500/20 text-brand-green-400 border-brand-green-500/30',
};

// Navigation items gated by role
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  permission?: Permission;
}

export function getNavItems(role: AdminRole): NavItem[] {
  const allItems: Array<NavItem & { minRole?: AdminRole[] }> = [
    { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    {
      label: 'Receipts',
      href: '/receipts',
      icon: 'Receipt',
      permission: 'reviewReceipts',
    },
    {
      label: 'Businesses',
      href: '/businesses',
      icon: 'Building2',
      permission: 'viewBusinesses',
    },
    {
      label: 'Disputes',
      href: '/disputes',
      icon: 'MessageSquareWarning',
      permission: 'viewDisputes',
    },
    {
      label: 'Users',
      href: '/users',
      icon: 'Users',
      permission: 'viewUsers',
    },
    {
      label: 'Verification',
      href: '/verification',
      icon: 'BadgeCheck',
      permission: 'manageVerification',
    },
    {
      label: 'Rewards',
      href: '/rewards',
      icon: 'Gift',
      permission: 'manageRewards',
    },
    {
      label: 'Advertising',
      href: '/advertising',
      icon: 'Megaphone',
      permission: 'viewAdvertising',
    },
    {
      label: 'Legends',
      href: '/legends',
      icon: 'Star',
      permission: 'viewLegends',
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: 'BarChart3',
      permission: 'viewAnalytics',
    },
    {
      label: 'Fraud',
      href: '/fraud',
      icon: 'ShieldAlert',
      permission: 'viewFraud',
    },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: 'Bell',
      permission: 'sendNotifications',
    },
    {
      label: 'Exports',
      href: '/exports',
      icon: 'Download',
      permission: 'exportData',
    },
    {
      label: 'Audit Log',
      href: '/audit',
      icon: 'ScrollText',
      permission: 'viewAuditLogs',
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: 'Settings',
      permission: 'accessSettings',
    },
  ];

  return allItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(role, item.permission);
  });
}
