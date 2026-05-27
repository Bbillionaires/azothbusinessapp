import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, Radius, FontSize } from '../../lib/theme';

interface JobApplication {
  id: string;
  status: string;
  cover_letter: string | null;
  applied_at: string;
  job_posting: {
    id: string;
    title: string;
    employment_type: string;
    salary_range: string | null;
    business: {
      id: string;
      name: string;
      city: string;
      state: string;
    };
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending:   { label: 'Applied',    color: '#3B82F6', icon: 'time-outline' },
  reviewed:  { label: 'Reviewed',   color: '#8B5CF6', icon: 'eye-outline' },
  interview: { label: 'Interview',  color: '#F59E0B', icon: 'calendar-outline' },
  offered:   { label: 'Offered',    color: Colors.success, icon: 'checkmark-circle-outline' },
  rejected:  { label: 'Not Moving Forward', color: Colors.error, icon: 'close-circle-outline' },
  withdrawn: { label: 'Withdrawn',  color: Colors.textSecondary, icon: 'remove-circle-outline' },
};

export default function JobApplicationsScreen() {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    async function load() {
      const { data } = await supabase
        .from('job_applications')
        .select(`
          id, status, cover_letter, applied_at,
          job_posting:job_postings(
            id, title, employment_type, salary_range,
            business:businesses(id, name, city, state)
          )
        `)
        .eq('user_id', user!.id)
        .order('applied_at', { ascending: false });
      setApplications((data ?? []) as JobApplication[]);
      setLoading(false);
    }
    load();
  }, [user]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Job Applications</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : applications.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="briefcase-outline" size={48} color={Colors.border} />
          <Text style={styles.emptyTitle}>No applications yet</Text>
          <Text style={styles.emptyText}>Browse local job listings and apply today.</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/jobs')}>
            <Text style={styles.browseBtnText}>Browse Jobs</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={applications}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const config = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/jobs/${item.job_posting.id}`)}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.jobTitle}>{item.job_posting.title}</Text>
                    <Text style={styles.businessName}>{item.job_posting.business.name}</Text>
                    <Text style={styles.locationText}>
                      {item.job_posting.business.city}, {item.job_posting.business.state}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
                    <Ionicons name={config.icon as any} size={14} color={config.color} />
                    <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.metaText}>
                    {item.job_posting.employment_type?.replace('_', ' ')}
                    {item.job_posting.salary_range ? ` · ${item.job_posting.salary_range}` : ''}
                  </Text>
                  <Text style={styles.dateText}>
                    Applied {new Date(item.applied_at).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  backBtn: { padding: 4 },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  loader: { marginTop: 40 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  browseBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 24, paddingVertical: 12, marginTop: Spacing.sm },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  list: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  jobTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  businessName: { fontSize: FontSize.sm, color: Colors.primary, marginTop: 2, fontWeight: '600' },
  locationText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.sm ?? 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaText: { fontSize: FontSize.xs ?? 11, color: Colors.textSecondary, textTransform: 'capitalize' },
  dateText: { fontSize: FontSize.xs ?? 11, color: Colors.textSecondary },
});
