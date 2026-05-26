import StatsCard from '@/components/ui/StatsCard';
import {
  Users,
  Building2,
  Receipt,
  ShieldAlert,
  Coins,
  DollarSign,
  Megaphone,
  MessageSquareWarning,
} from 'lucide-react';

interface PlatformStats {
  totalUsers: number;
  newUsersToday: number;
  totalBusinesses: number;
  activeBusinesses: number;
  pendingBusinesses: number;
  receiptsPendingReview: number;
  receiptsFlaggedFraud: number;
  pointsIssuedToday: number;
  revenueThisMonth: number;
  activeAdCampaigns: number;
  openDisputes: number;
}

interface PlatformStatsGridProps {
  stats: PlatformStats;
}

export default function PlatformStatsGrid({ stats }: PlatformStatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatsCard
        title="Total Users"
        value={stats.totalUsers}
        subtitle={`+${stats.newUsersToday} today`}
        icon={Users}
        iconColor="text-blue-400"
        iconBg="bg-blue-500/10"
        trend={{ value: `${stats.newUsersToday} new today`, positive: true }}
      />
      <StatsCard
        title="Total Businesses"
        value={stats.totalBusinesses}
        subtitle={`${stats.activeBusinesses} active · ${stats.pendingBusinesses} pending`}
        icon={Building2}
        iconColor="text-purple-400"
        iconBg="bg-purple-500/10"
      />
      <StatsCard
        title="Receipts Pending"
        value={stats.receiptsPendingReview}
        subtitle="Awaiting review"
        icon={Receipt}
        iconColor="text-yellow-400"
        iconBg="bg-yellow-500/10"
      />
      <StatsCard
        title="Fraud Flagged"
        value={stats.receiptsFlaggedFraud}
        subtitle="High risk receipts"
        icon={ShieldAlert}
        iconColor="text-red-400"
        iconBg="bg-red-500/10"
      />
      <StatsCard
        title="Points Issued Today"
        value={stats.pointsIssuedToday.toLocaleString()}
        icon={Coins}
        iconColor="text-amber-400"
        iconBg="bg-amber-500/10"
      />
      <StatsCard
        title="Revenue This Month"
        value={`$${stats.revenueThisMonth.toLocaleString()}`}
        icon={DollarSign}
        iconColor="text-green-400"
        iconBg="bg-green-500/10"
      />
      <StatsCard
        title="Active Ad Campaigns"
        value={stats.activeAdCampaigns}
        icon={Megaphone}
        iconColor="text-pink-400"
        iconBg="bg-pink-500/10"
      />
      <StatsCard
        title="Open Disputes"
        value={stats.openDisputes}
        icon={MessageSquareWarning}
        iconColor="text-orange-400"
        iconBg="bg-orange-500/10"
      />
    </div>
  );
}
