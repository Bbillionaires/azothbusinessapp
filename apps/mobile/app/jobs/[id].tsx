import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { THEME } from '../../lib/theme';

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-Time',
  part_time: 'Part-Time',
  contract: 'Contract',
  volunteer: 'Volunteer',
  internship: 'Internship',
};

const JOB_TYPE_COLORS: Record<string, string> = {
  full_time: '#16A34A',
  part_time: '#2563EB',
  contract: '#D97706',
  volunteer: '#7C3AED',
  internship: '#0891B2',
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [applied, setApplied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Placeholder — fetch from Supabase in production
  const job = {
    id,
    title: 'Barista & Customer Service',
    type: 'part_time',
    business_name: "Greenwood Coffee Co.",
    business_logo: null,
    location: 'Jacksonville, FL',
    is_remote: false,
    salary_min: 14,
    salary_max: 18,
    salary_type: 'hourly',
    description: "We're looking for an enthusiastic barista to join our team at Greenwood Coffee Co. You'll be crafting specialty drinks, building relationships with our amazing regulars, and representing a local business that truly cares about our community.",
    requirements: [
      'Customer service experience preferred',
      'Coffee/barista experience a plus (will train)',
      'Friendly, outgoing personality',
      'Available weekday mornings and weekends',
      'Food handler certification or willingness to obtain',
    ],
    benefits: [
      'Competitive pay + tips',
      'Free drinks every shift',
      'Flexible scheduling',
      'Career growth opportunities',
      'Team events and community involvement',
    ],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 28).toISOString(),
    application_count: 12,
  };

  const handleApply = () => {
    if (applied) return;
    Alert.alert(
      'Apply for this Job',
      'Your profile and resume will be sent to the employer.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Application',
          onPress: () => {
            setApplied(true);
            Alert.alert('Application Submitted!', "We've sent your profile to the employer. Good luck!");
          },
        },
      ]
    );
  };

  const salaryLabel =
    job.salary_type === 'hourly'
      ? `$${job.salary_min}–$${job.salary_max}/hr`
      : `$${(job.salary_min / 1000).toFixed(0)}k–$${(job.salary_max / 1000).toFixed(0)}k/yr`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={THEME.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={() => setSaved(!saved)}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={saved ? THEME.colors.primary : THEME.colors.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Job title card */}
          <View style={styles.titleCard}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>{job.business_name[0]}</Text>
            </View>
            <View style={styles.titleInfo}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.businessName}>{job.business_name}</Text>
              <View style={styles.metaRow}>
                <View style={[styles.typeBadge, { backgroundColor: JOB_TYPE_COLORS[job.type] + '20' }]}>
                  <Text style={[styles.typeText, { color: JOB_TYPE_COLORS[job.type] }]}>
                    {JOB_TYPE_LABELS[job.type]}
                  </Text>
                </View>
                <Text style={styles.metaText}>📍 {job.is_remote ? 'Remote' : job.location}</Text>
              </View>
            </View>
          </View>

          {/* Quick stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statValue}>{salaryLabel}</Text>
              <Text style={styles.statLabel}>Compensation</Text>
            </View>
            <View style={[styles.statBox, styles.statBorder]}>
              <Text style={styles.statIcon}>👥</Text>
              <Text style={styles.statValue}>{job.application_count}</Text>
              <Text style={styles.statLabel}>Applicants</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>⏰</Text>
              <Text style={styles.statValue}>{format(new Date(job.created_at), 'MMM d')}</Text>
              <Text style={styles.statLabel}>Posted</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About the Role</Text>
            <Text style={styles.description}>{job.description}</Text>
          </View>

          {/* Requirements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            {job.requirements.map((req, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>{req}</Text>
              </View>
            ))}
          </View>

          {/* Benefits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Benefits & Perks</Text>
            {job.benefits.map((benefit, i) => (
              <View key={i} style={styles.checkRow}>
                <Ionicons name="checkmark-circle" size={18} color={THEME.colors.primary} />
                <Text style={styles.checkText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Expires */}
          <Text style={styles.expiresText}>
            Application deadline: {format(new Date(job.expires_at), 'MMMM d, yyyy')}
          </Text>

          {/* Apply button */}
          <TouchableOpacity
            style={[styles.applyBtn, applied && styles.applyBtnApplied]}
            onPress={handleApply}
            disabled={applied}
          >
            <Ionicons
              name={applied ? 'checkmark-circle' : 'briefcase-outline'}
              size={20}
              color="#fff"
            />
            <Text style={styles.applyBtnText}>
              {applied ? 'Application Submitted' : 'Apply Now'}
            </Text>
          </TouchableOpacity>

          {!applied && (
            <TouchableOpacity style={styles.uploadResumeBtn}>
              <Ionicons name="document-attach-outline" size={18} color={THEME.colors.primary} />
              <Text style={styles.uploadResumeText}>Upload Resume First</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backBtn: { padding: 4 },
  saveBtn: { padding: 4 },
  body: { padding: 16, gap: 16 },
  titleCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    alignItems: 'flex-start',
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  titleInfo: { flex: 1, gap: 4 },
  jobTitle: { fontSize: 20, fontWeight: '800', color: THEME.colors.text },
  businessName: { fontSize: 14, color: THEME.colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeText: { fontSize: 12, fontWeight: '700' },
  metaText: { fontSize: 13, color: THEME.colors.textSecondary },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 2 },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: THEME.colors.border },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 15, fontWeight: '700', color: THEME.colors.text },
  statLabel: { fontSize: 11, color: THEME.colors.textSecondary },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: THEME.colors.text },
  description: { fontSize: 15, color: THEME.colors.text, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.colors.primary, marginTop: 7 },
  bulletText: { flex: 1, fontSize: 14, color: THEME.colors.text, lineHeight: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  checkText: { flex: 1, fontSize: 14, color: THEME.colors.text, lineHeight: 20 },
  expiresText: { fontSize: 13, color: THEME.colors.textSecondary, textAlign: 'center' },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  applyBtnApplied: { backgroundColor: '#16A34A' },
  applyBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  uploadResumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    padding: 14,
    gap: 6,
    marginBottom: 32,
  },
  uploadResumeText: { color: THEME.colors.primary, fontWeight: '600', fontSize: 15 },
});
