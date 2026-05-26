import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  TextInput, ActivityIndicator, SafeAreaView, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

const RECENT_KEY = 'recent_searches';
const MAX_RECENT = 8;

type SearchTab = 'businesses' | 'events' | 'jobs' | 'deals';

type BizResult = { id: string; name: string; category: string; city: string; state: string; verification_level: string | null };
type EventResult = { id: string; title: string; start_at: string; businesses: { name: string } | null };
type JobResult = { id: string; title: string; type: string; is_remote: boolean; businesses: { name: string; city: string } | null };
type DealResult = { id: string; title: string; offer_type: string; discount_percent: number | null; businesses: { name: string } | null };

type Results = {
  businesses: BizResult[];
  events: EventResult[];
  jobs: JobResult[];
  deals: DealResult[];
};

const TABS: { key: SearchTab; label: string; icon: string }[] = [
  { key: 'businesses', label: 'Businesses', icon: '🏪' },
  { key: 'events', label: 'Events', icon: '📅' },
  { key: 'jobs', label: 'Jobs', icon: '💼' },
  { key: 'deals', label: 'Deals', icon: '🏷️' },
];

export default function SearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('businesses');
  const [results, setResults] = useState<Results>({ businesses: [], events: [], jobs: [], deals: [] });
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    inputRef.current?.focus();
    loadRecent();
  }, []);

  async function loadRecent() {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    if (raw) setRecentSearches(JSON.parse(raw));
  }

  async function saveRecent(term: string) {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  }

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults({ businesses: [], events: [], jobs: [], deals: [] }); return; }
    setLoading(true);
    const like = `%${q}%`;

    const [bizRes, eventRes, jobRes, dealRes] = await Promise.all([
      supabase.from('businesses').select('id, name, category, city, state, verification_level')
        .ilike('name', like).eq('status', 'active').limit(10),
      supabase.from('events').select('id, title, start_at, businesses(name)')
        .ilike('title', like).eq('status', 'published').gte('start_at', new Date().toISOString()).limit(10),
      supabase.from('job_postings').select('id, title, type, is_remote, businesses(name, city)')
        .ilike('title', like).eq('is_active', true).limit(10),
      supabase.from('business_offers').select('id, title, offer_type, discount_percent, businesses(name)')
        .ilike('title', like).eq('is_active', true).limit(10),
    ]);

    setResults({
      businesses: (bizRes.data ?? []) as BizResult[],
      events: (eventRes.data ?? []) as EventResult[],
      jobs: (jobRes.data ?? []) as JobResult[],
      deals: (dealRes.data ?? []) as DealResult[],
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (query.length >= 2) search(query); }, 300);
    return () => clearTimeout(t);
  }, [query, search]);

  function handleSubmit() {
    if (query.trim()) { saveRecent(query.trim()); Keyboard.dismiss(); }
  }

  function handleRecent(term: string) {
    setQuery(term);
    search(term);
  }

  async function clearRecent() {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_KEY);
  }

  const activeCount = results[activeTab].length;
  const showRecent = query.length < 2;

  return (
    <SafeAreaView style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#666" />
        </Pressable>
        <View style={styles.inputWrap}>
          <Ionicons name="search-outline" size={18} color="#AAA" style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search businesses, events, jobs..."
            placeholderTextColor="#AAA"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#AAA" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Tabs */}
      {!showRecent && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
          {TABS.map(t => {
            const count = results[t.key].length;
            return (
              <Pressable key={t.key} onPress={() => setActiveTab(t.key)} style={[styles.tab, activeTab === t.key && styles.tabActive]}>
                <Text style={styles.tabEmoji}>{t.icon}</Text>
                <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>{t.label}</Text>
                {count > 0 && <View style={[styles.tabCount, activeTab === t.key && styles.tabCountActive]}><Text style={[styles.tabCountText, activeTab === t.key && styles.tabCountTextActive]}>{count}</Text></View>}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {loading && <View style={styles.loadingBar}><ActivityIndicator size="small" color="#1B4332" /></View>}

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {showRecent ? (
          <View style={styles.recentSection}>
            {recentSearches.length > 0 ? (
              <>
                <View style={styles.recentHeader}>
                  <Text style={styles.recentTitle}>Recent Searches</Text>
                  <Pressable onPress={clearRecent}><Text style={styles.clearText}>Clear</Text></Pressable>
                </View>
                {recentSearches.map(term => (
                  <Pressable key={term} onPress={() => handleRecent(term)} style={styles.recentItem}>
                    <Ionicons name="time-outline" size={16} color="#AAA" />
                    <Text style={styles.recentItemText}>{term}</Text>
                    <Ionicons name="arrow-up-outline" size={14} color="#AAA" style={{ transform: [{ rotate: '45deg' }] }} />
                  </Pressable>
                ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>Search Local First Rewards™</Text>
                <Text style={styles.emptyText}>Find local businesses, upcoming events, job openings, and exclusive deals near you.</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.resultsSection}>
            {activeCount === 0 && !loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>😔</Text>
                <Text style={styles.emptyTitle}>No {TABS.find(t => t.key === activeTab)?.label} Found</Text>
                <Text style={styles.emptyText}>Try a different search term.</Text>
              </View>
            ) : null}

            {/* Business results */}
            {activeTab === 'businesses' && results.businesses.map(biz => (
              <Pressable key={biz.id} onPress={() => router.push(`/business/${biz.id}`)} style={styles.resultRow}>
                <View style={styles.resultIcon}><Text style={styles.resultIconText}>🏪</Text></View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle}>{biz.name}</Text>
                  <Text style={styles.resultSub}>{biz.category} · {biz.city}, {biz.state}</Text>
                </View>
                {biz.verification_level && <Ionicons name="shield-checkmark" size={16} color="#1B4332" />}
                <Ionicons name="chevron-forward" size={14} color="#DDD" />
              </Pressable>
            ))}

            {/* Event results */}
            {activeTab === 'events' && results.events.map(event => (
              <Pressable key={event.id} onPress={() => router.push(`/events/${event.id}`)} style={styles.resultRow}>
                <View style={styles.resultIcon}><Text style={styles.resultIconText}>📅</Text></View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle}>{event.title}</Text>
                  <Text style={styles.resultSub}>
                    {event.businesses?.name} · {new Date(event.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#DDD" />
              </Pressable>
            ))}

            {/* Job results */}
            {activeTab === 'jobs' && results.jobs.map(job => (
              <Pressable key={job.id} onPress={() => router.push(`/jobs/${job.id}`)} style={styles.resultRow}>
                <View style={styles.resultIcon}><Text style={styles.resultIconText}>💼</Text></View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle}>{job.title}</Text>
                  <Text style={styles.resultSub}>
                    {job.businesses?.name} · {job.is_remote ? 'Remote' : job.businesses?.city ?? ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#DDD" />
              </Pressable>
            ))}

            {/* Deal results */}
            {activeTab === 'deals' && results.deals.map(deal => (
              <Pressable key={deal.id} onPress={() => router.push(`/offers`)} style={styles.resultRow}>
                <View style={styles.resultIcon}><Text style={styles.resultIconText}>🏷️</Text></View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle}>{deal.title}</Text>
                  <Text style={styles.resultSub}>
                    {deal.businesses?.name}
                    {deal.discount_percent ? ` · ${deal.discount_percent}% off` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#DDD" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 8 },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, gap: 6 },
  searchIcon: {},
  input: { flex: 1, fontSize: 15, color: '#1A1A1A' },
  tabScroll: { maxHeight: 48, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tabContent: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: '#F3F4F6', gap: 4 },
  tabActive: { backgroundColor: '#1B4332' },
  tabEmoji: { fontSize: 12 },
  tabLabel: { fontSize: 12, fontWeight: '600', color: '#666' },
  tabLabelActive: { color: '#fff' },
  tabCount: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabCountText: { fontSize: 9, fontWeight: '700', color: '#555' },
  tabCountTextActive: { color: '#fff' },
  loadingBar: { height: 2, backgroundColor: '#E6F0EC', justifyContent: 'center', alignItems: 'center', paddingVertical: 8 },
  recentSection: { padding: 16 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  recentTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  clearText: { fontSize: 13, color: '#1B4332', fontWeight: '600' },
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  recentItemText: { flex: 1, fontSize: 14, color: '#555' },
  emptyState: { paddingVertical: 60, alignItems: 'center', paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 6, textAlign: 'center' },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
  resultsSection: { paddingVertical: 8 },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F9F6F0', gap: 12 },
  resultIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  resultIconText: { fontSize: 16 },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  resultSub: { fontSize: 12, color: '#888', marginTop: 1 },
});
