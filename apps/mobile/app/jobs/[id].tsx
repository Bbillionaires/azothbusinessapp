import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Linking, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { THEME } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useApply } from '../../hooks/useJobs';

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-Time', part_time: 'Part-Time',
  contract: 'Contract', volunteer: 'Volunteer', internship: 'Internship',
};
const JOB_TYPE_COLORS: Record<string, string> = {
  full_time: '#16A34A', part_time: '#2563EB', contract: '#D97706',
  volunteer: '#7C3AED', internship: '#0891B2',
};

interface JobData {
  id: string; title: string; description: string | null;
  type: string; location: string | null; is_remote: boolean;
  salary_min: number | null; salary_max: number | null;
  salary_type: string | null; requirements: string[] | null;
  benefits: string[] | null; external_apply_url: string | null;
  created_at: string; expires_at: string | null;
  businesses: { name: string; city: string | null; state: string | null } | null;
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverNote, setCoverNote] = useState('');

  const { apply, applied, loading: applying } = useApply(id as string);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('job_postings')
        .select('*, businesses(name, city, state)')
        .eq('id', id as string)
        .single();
      if (data) setJob(data as JobData);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}><ActivityIndicator size="large" color="#1B4332" /></View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity style={styles.backBtnPlain} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={THEME.colors.text} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Job not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleApply = () => {
    if (applied) return;
    if (job.external_apply_url) {
      Linking.openURL(job.external_apply_url);
    } else {
      setShowApplyModal(true);
    }
  };

  const handleSubmitApplication = async () => {
    const { error } = await apply(coverNote.trim() || undefined);
    setShowApplyModal(false);
    setCoverNote('');
    if (error) {
      Alert.alert('Application Failed', error);
    } else {
      Alert.alert(
        'Application Submitted!',
        `Your application for ${job.title} at ${job.businesses?.name ?? 'this company'} has been submitted.`,
        [{ text: 'OK' }]
      );
    }
  };

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null;
    const suffix = job.salary_type === 'hourly' ? '/hr' : '/yr';
    const fmt = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(0)}k` : `$${n}`;
    if (job.salary_min && job.salary_max) return `${fmt(job.salary_min)}–${fmt(job.salary_max)}${suffix}`;
    if (job.salary_min) return `${fmt(job.salary_min)}+${suffix}`;
    return `Up to ${fmt(job.salary_max!)}${suffix}`;
  };

  const salaryLabel = formatSalary();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={THEME.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Job title card */}
          <View style={styles.titleCard}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>{(job.businesses?.name ?? job.title)[0]?.toUpperCase()}</Text>
            </View>
            <View style={styles.titleInfo}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.businessName}>{job.businesses?.name}</Text>
              <View style={styles.metaRow}>
                <View style={[styles.typeBadge, { backgroundColor: (JOB_TYPE_COLORS[job.type] ?? '#888') + '20' }]}>
                  <Text style={[styles.typeText, { color: JOB_TYPE_COLORS[job.type] ?? '#888' }]}>
                    {JOB_TYPE_LABELS[job.type] ?? job.type}
                  </Text>
                </View>
                {job.is_remote ? (
                  <Text style={styles.metaText}>🌐 Remote</Text>
                ) : (
                  <Text style={styles.metaText}>
                    📍 {job.location ?? [job.businesses?.city, job.businesses?.state].filter(Boolean).join(', ')}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Quick stats */}
          <View style={styles.statsRow}>
            {salaryLabel && (
              <View style={styles.statBox}>
                <Text style={styles.statIcon}>💰</Text>
                <Text style={styles.statValue}>{salaryLabel}</Text>
                <Text style={styles.statLabel}>Compensation</Text>
              </View>
            )}
            <View style={[styles.statBox, salaryLabel ? styles.statBorder : undefined]}>
              <Text style={styles.statIcon}>⏰</Text>
              <Text style={styles.statValue}>{format(new Date(job.created_at), 'MMM d')}</Text>
              <Text style={styles.statLabel}>Posted</Text>
            </View>
            {job.expires_at && (
              <View style={[styles.statBox, styles.statBorder]}>
                <Text style={styles.statIcon}>📅</Text>
                <Text style={styles.statValue}>{format(new Date(job.expires_at), 'MMM d')}</Text>
                <Text style={styles.statLabel}>Deadline</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {job.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About the Role</Text>
              <Text style={styles.description}>{job.description}</Text>
            </View>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Requirements</Text>
              {job.requirements.map((req, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>{req}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Benefits & Perks</Text>
              {job.benefits.map((benefit, i) => (
                <View key={i} style={styles.checkRow}>
                  <Ionicons name="checkmark-circle" size={18} color={THEME.colors.primary} />
                  <Text style={styles.checkText}>{benefit}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Apply button */}
          <TouchableOpacity
            style={[styles.applyBtn, (applied || applying) && styles.applyBtnDisabled]}
            onPress={handleApply}
            disabled={applied || applying}
          >
            {applying ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name={applied ? 'checkmark-circle' : 'briefcase-outline'}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.applyBtnText}>
                  {applied ? 'Applied' : job.external_apply_url ? 'Apply Now' : 'Apply In-App'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* In-app apply modal */}
      <Modal
        visible={showApplyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApplyModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply for {job.title}</Text>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <Ionicons name="close" size={24} color={THEME.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Applying to {job.businesses?.name ?? 'this company'}
            </Text>
            <Text style={styles.inputLabel}>Cover Note (optional)</Text>
            <TextInput
              style={styles.coverInput}
              placeholder="Tell the employer why you're a great fit..."
              placeholderTextColor={THEME.colors.textSecondary}
              multiline
              numberOfLines={5}
              value={coverNote}
              onChangeText={setCoverNote}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitApplication}>
              <Text style={styles.submitBtnText}>Submit Application</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: THEME.colors.textSecondary },
  backBtnPlain: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: THEME.colors.border },
  backBtn: { padding: 4 },
  body: { padding: 16, gap: 16 },
  titleCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 14, alignItems: 'flex-start' },
  logoPlaceholder: { width: 56, height: 56, borderRadius: 12, backgroundColor: THEME.colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  titleInfo: { flex: 1, gap: 4 },
  jobTitle: { fontSize: 20, fontWeight: '800', color: THEME.colors.text },
  businessName: { fontSize: 14, color: THEME.colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeText: { fontSize: 12, fontWeight: '700' },
  metaText: { fontSize: 13, color: THEME.colors.textSecondary },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  statBox: { flex: 1, alignItems: 'center', gap: 2 },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: THEME.colors.border },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 15, fontWeight: '700', color: THEME.colors.text },
  statLabel: { fontSize: 11, color: THEME.colors.textSecondary },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: THEME.colors.text },
  description: { fontSize: 15, color: THEME.colors.text, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.colors.primary, marginTop: 8, flexShrink: 0 },
  bulletText: { flex: 1, fontSize: 14, color: THEME.colors.text, lineHeight: 20 },
  checkRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkText: { flex: 1, fontSize: 14, color: THEME.colors.text, lineHeight: 20 },
  applyBtn: { backgroundColor: THEME.colors.primary, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 },
  applyBtnDisabled: { opacity: 0.6 },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: THEME.colors.text, flex: 1 },
  modalSubtitle: { fontSize: 14, color: THEME.colors.textSecondary },
  inputLabel: { fontSize: 14, fontWeight: '600', color: THEME.colors.text },
  coverInput: {
    borderWidth: 1, borderColor: THEME.colors.border, borderRadius: 10,
    padding: 12, fontSize: 15, color: THEME.colors.text, minHeight: 100,
    backgroundColor: THEME.colors.background,
  },
  submitBtn: { backgroundColor: THEME.colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
