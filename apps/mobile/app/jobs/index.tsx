import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  RefreshControl, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

type Job = {
  id: string; title: string; description: string | null; type: string;
  location: string | null; is_remote: boolean; salary_min: number | null;
  salary_max: number | null; salary_type: string | null; experience_level: string | null;
  created_at: string; businesses: { name: string; city: string; state: string; logo_url?: string } | null;
};

const JOB_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  full_time: { label: 'Full-time', color: '#166534', bg: '#DCFCE7' },
  part_time: { label: 'Part-time', color: '#1e40af', bg: '#DBEAFE' },
  contract: { label: 'Contract', color: '#7C3AED', bg: '#EDE9FE' },
  internship: { label: 'Internship', color: '#D97706', bg: '#FEF3C7' },
  temporary: { label: 'Temporary', color: '#6B7280', bg: '#F3F4F6' },
  volunteer: { label: 'Volunteer', color: '#059669', bg: '#D1FAE5' },
};

const EXPERIENCE_CONFIG: Record<string, string> = {
  entry: 'Entry Level', mid: 'Mid Level', senior: 'Senior', executive: 'Executive',
};

const FILTERS = [
  { key: 'all', label: 'All Jobs' },
  { key: 'full_time', label: 'Full-time' },
  { key: 'part_time', label: 'Part-time' },
  { key: 'contract', label: 'Contract' },
  { key: 'remote', label: 'Remote' },
  { key: 'entry', label: 'Entry Level' },
];

function formatSalary(min: number | null, max: number | null, type: string | null): string {
  if (!min && !max) return '';
  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
  const suffix = type === 'hourly' ? '/hr' : type === 'monthly' ? '/mo' : '/yr';
  if (min && max) return `${fmt(min)} – ${fmt(max)}${suffix}`;
  if (min) return `${fmt(min)}+${suffix}`;
  return `Up to ${fmt(max!)}${suffix}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return `${Math.floor(weeks / 4)}mo ago`;
}

export default function JobsScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchJobs = useCallback(async () => {
    const now = new Date().toISOString();
    let query = supabase
      .from('job_postings')
      .select('*, businesses(name, city, state)')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false })
      .limit(30);

    if (filter === 'remote') {
      query = query.eq('is_remote', true);
    } else if (filter === 'entry') {
      query = query.eq('experience_level', 'entry');
    } else if (filter !== 'all') {
      query = query.eq('type', filter);
    }

    const { data } = await query;
    if (data) setJobs(data as Job[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Local Jobs</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {FILTERS.map(f => (
          <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.filterChip, filter === f.key && styles.filterChipActive]}>
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#1B4332" /></View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B4332" />}
          contentContainerStyle={styles.list}
        >
          {jobs.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💼</Text>
              <Text style={styles.emptyTitle}>No Jobs Found</Text>
              <Text style={styles.emptyText}>Local businesses haven't posted jobs yet. Check back soon!</Text>
            </View>
          ) : (
            <>
              <Text style={styles.resultsCount}>{jobs.length} position{jobs.length !== 1 ? 's' : ''} found</Text>
              {jobs.map(job => {
                const typeConfig = JOB_TYPE_CONFIG[job.type] ?? { label: job.type, color: '#6B7280', bg: '#F3F4F6' };
                const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
                const initials = (job.businesses?.name ?? 'B').split(' ').map(w => w[0]).slice(0, 2).join('');

                return (
                  <Pressable key={job.id} onPress={() => router.push(`/jobs/${job.id}`)} style={styles.card}>
                    {/* Logo placeholder */}
                    <View style={styles.logoBox}>
                      <Text style={styles.logoText}>{initials}</Text>
                    </View>

                    <View style={styles.cardContent}>
                      <View style={styles.cardTop}>
                        <View style={[styles.typeBadge, { backgroundColor: typeConfig.bg }]}>
                          <Text style={[styles.typeLabel, { color: typeConfig.color }]}>{typeConfig.label}</Text>
                        </View>
                        {job.is_remote && (
                          <View style={styles.remoteBadge}>
                            <Text style={styles.remoteText}>Remote</Text>
                          </View>
                        )}
                        {job.experience_level && (
                          <Text style={styles.expLevel}>{EXPERIENCE_CONFIG[job.experience_level] ?? job.experience_level}</Text>
                        )}
                      </View>

                      <Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text>
                      <Text style={styles.companyName}>{job.businesses?.name}</Text>

                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={12} color="#888" />
                        <Text style={styles.locationText}>
                          {job.is_remote ? 'Remote' : `${job.businesses?.city ?? ''}, ${job.businesses?.state ?? ''}`.trim().replace(/^,\s*|,\s*$/, '')}
                        </Text>
                      </View>

                      {salary ? (
                        <Text style={styles.salary}>{salary}</Text>
                      ) : null}

                      <View style={styles.cardFooter}>
                        <Text style={styles.postedDate}>Posted {timeAgo(job.created_at)}</Text>
                        <View style={styles.applyBtn}>
                          <Text style={styles.applyText}>View & Apply →</Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  header: { backgroundColor: '#1B4332', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  filterScroll: { maxHeight: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  filterContent: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  filterChipActive: { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#666' },
  filterTextActive: { color: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  list: { padding: 16, gap: 12 },
  resultsCount: { fontSize: 13, color: '#888', marginBottom: 4 },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 32 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', gap: 12 },
  logoBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#E6F0EC', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  logoText: { fontSize: 16, fontWeight: '800', color: '#1B4332' },
  cardContent: { flex: 1 },
  cardTop: { flexDirection: 'row', gap: 6, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  typeLabel: { fontSize: 10, fontWeight: '700' },
  remoteBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: '#DBEAFE' },
  remoteText: { fontSize: 10, fontWeight: '700', color: '#1e40af' },
  expLevel: { fontSize: 10, color: '#888', fontWeight: '500' },
  jobTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  companyName: { fontSize: 12, color: '#1B4332', fontWeight: '600', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
  locationText: { fontSize: 12, color: '#888' },
  salary: { fontSize: 13, fontWeight: '700', color: '#1B4332', marginBottom: 6 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  postedDate: { fontSize: 11, color: '#AAA' },
  applyBtn: { paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#E6F0EC', borderRadius: 10 },
  applyText: { fontSize: 12, fontWeight: '700', color: '#1B4332' },
});
