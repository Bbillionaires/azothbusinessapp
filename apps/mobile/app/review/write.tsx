import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  SafeAreaView, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
const REVIEW_CATEGORIES = [
  'Quality', 'Service', 'Value', 'Atmosphere', 'Cleanliness', 'Community Impact',
];

export default function WriteReviewScreen() {
  const { business_id, business_name } = useLocalSearchParams<{ business_id: string; business_name: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loginMsg}>Sign in to write a review</Text>
          <Pressable onPress={() => router.push('/(auth)/login')} style={styles.loginBtn}>
            <Text style={styles.loginBtnText}>Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  function toggleTag(tag: string) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  async function handleSubmit() {
    if (!rating) { Alert.alert('Rating Required', 'Please select a star rating.'); return; }
    if (body.length < 20) { Alert.alert('Review Too Short', 'Please write at least 20 characters.'); return; }
    if (!business_id) { Alert.alert('Error', 'Business not found.'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      business_id,
      reviewer_id: user.id,
      rating,
      title: title || null,
      body,
      tags: tags.length > 0 ? tags : null,
      status: 'pending',
    });

    if (error) {
      if (error.code === '23505') {
        Alert.alert('Already Reviewed', 'You have already reviewed this business.');
      } else {
        Alert.alert('Error', error.message);
      }
    } else {
      Alert.alert('Review Submitted!', 'Thank you for your review. It helps the community!', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    }
    setSubmitting(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Write a Review</Text>
        <Pressable onPress={handleSubmit} style={[styles.submitBtn, (!rating || body.length < 20) && styles.submitBtnDisabled]} disabled={submitting || !rating || body.length < 20}>
          {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitText}>Post</Text>}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.bizName}>{business_name ?? 'Business'}</Text>

        {/* Star rating */}
        <View style={styles.starsSection}>
          <Text style={styles.sectionLabel}>Your Rating *</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map(star => (
              <Pressable key={star} onPress={() => setRating(star)} style={styles.starBtn}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={36}
                  color={star <= rating ? '#D4AF37' : '#D1D5DB'}
                />
              </Pressable>
            ))}
          </View>
          {rating > 0 && <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>}
        </View>

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Review Title (optional)</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Summarize your experience"
            placeholderTextColor="#AAA"
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />
        </View>

        {/* Body */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Your Review *</Text>
          <TextInput
            style={styles.bodyInput}
            placeholder="Tell others about your experience. What did you like? How was the service? Would you recommend it?"
            placeholderTextColor="#AAA"
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={6}
            maxLength={2000}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, body.length < 20 && styles.charCountWarn]}>
            {body.length}/2000 {body.length < 20 ? `(${20 - body.length} more to go)` : ''}
          </Text>
        </View>

        {/* Tags */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Tags (optional)</Text>
          <View style={styles.tagGrid}>
            {REVIEW_CATEGORIES.map(tag => (
              <Pressable key={tag} onPress={() => toggleTag(tag)} style={[styles.tag, tags.includes(tag) && styles.tagActive]}>
                <Text style={[styles.tagText, tags.includes(tag) && styles.tagTextActive]}>{tag}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={16} color="#888" />
          <Text style={styles.disclaimerText}>Your review will be visible immediately and helps the local community.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loginMsg: { fontSize: 16, color: '#555', marginBottom: 16 },
  loginBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#1B4332', borderRadius: 10 },
  loginBtnText: { color: '#fff', fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  cancelBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  cancelText: { fontSize: 15, color: '#666' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  submitBtn: { paddingHorizontal: 16, paddingVertical: 6, backgroundColor: '#1B4332', borderRadius: 8 },
  submitBtnDisabled: { backgroundColor: '#9CA3AF' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  content: { padding: 20, gap: 20 },
  bizName: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  starsSection: { alignItems: 'center', gap: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 },
  stars: { flexDirection: 'row', gap: 4 },
  starBtn: { padding: 4 },
  ratingLabel: { fontSize: 14, color: '#D4AF37', fontWeight: '700' },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#444' },
  titleInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#1A1A1A', backgroundColor: '#fff' },
  bodyInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#1A1A1A', backgroundColor: '#fff', minHeight: 140 },
  charCount: { fontSize: 11, color: '#AAA', textAlign: 'right' },
  charCountWarn: { color: '#EA580C' },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  tagActive: { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  tagText: { fontSize: 13, color: '#555', fontWeight: '500' },
  tagTextActive: { color: '#fff' },
  disclaimer: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12 },
  disclaimerText: { flex: 1, fontSize: 12, color: '#888', lineHeight: 18 },
});
