// =============================================================================
// BusinessFilters — filter chip strip + expandable drawer
// =============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '../../lib/theme';
import { Button } from '../ui/Button';
import { BUSINESS_CATEGORIES } from '../../../../packages/shared/src/types/business';

export interface FilterState {
  isLocalOwned: boolean;
  isCommunityOwned: boolean;
  isVeteranOwned: boolean;
  isWomanOwned: boolean;
  hiringNow: boolean;
  hasFreeToday: boolean;
  hasUpcomingEvent: boolean;
  category: string | null;
}

export const DEFAULT_FILTERS: FilterState = {
  isLocalOwned: false,
  isCommunityOwned: false,
  isVeteranOwned: false,
  isWomanOwned: false,
  hiringNow: false,
  hasFreeToday: false,
  hasUpcomingEvent: false,
  category: null,
};

interface FilterChipProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

function FilterChip({ label, active, onToggle }: FilterChipProps) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[styles.chip, active && styles.chipActive]}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

interface BusinessFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const QUICK_FILTERS: Array<{ key: keyof FilterState; label: string }> = [
  { key: 'isLocalOwned', label: 'Local Owned' },
  { key: 'isCommunityOwned', label: 'Community Owned' },
  { key: 'hiringNow', label: 'Hiring Now' },
  { key: 'hasFreeToday', label: 'Free Today' },
  { key: 'hasUpcomingEvent', label: 'Event Today' },
  { key: 'isVeteranOwned', label: 'Veteran Owned' },
  { key: 'isWomanOwned', label: 'Woman Owned' },
];

const CATEGORY_LABELS: Record<string, string> = {
  food_drink: 'Food & Drink',
  retail: 'Retail',
  services: 'Services',
  health_wellness: 'Health & Wellness',
  beauty: 'Beauty',
  automotive: 'Automotive',
  home_garden: 'Home & Garden',
  entertainment: 'Entertainment',
  education: 'Education',
  nonprofit: 'Nonprofit',
  professional: 'Professional',
  technology: 'Technology',
  real_estate: 'Real Estate',
  financial: 'Financial',
  childcare: 'Childcare',
  fitness: 'Fitness',
  arts_crafts: 'Arts & Crafts',
  pet_services: 'Pet Services',
  travel: 'Travel',
  other: 'Other',
};

export function BusinessFilters({ filters, onChange }: BusinessFiltersProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<FilterState>(filters);

  const activeCount = Object.entries(filters).filter(([k, v]) =>
    k === 'category' ? v !== null : v === true
  ).length;

  const toggle = (key: keyof FilterState) => {
    if (key === 'category') return;
    onChange({ ...filters, [key]: !filters[key] });
  };

  const applyDraft = () => {
    onChange(draftFilters);
    setDrawerOpen(false);
  };

  const resetAll = () => {
    onChange(DEFAULT_FILTERS);
    setDraftFilters(DEFAULT_FILTERS);
  };

  return (
    <>
      <View style={styles.stripRow}>
        {/* Filter button */}
        <TouchableOpacity
          style={[styles.filterButton, activeCount > 0 && styles.filterButtonActive]}
          onPress={() => {
            setDraftFilters(filters);
            setDrawerOpen(true);
          }}
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={activeCount > 0 ? Colors.textInverse : Colors.primary}
          />
          {activeCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Quick chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScroll}
        >
          {QUICK_FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              active={filters[f.key] as boolean}
              onToggle={() => toggle(f.key)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Full drawer modal */}
      <Modal
        visible={drawerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <SafeAreaView style={styles.drawer}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Filter Businesses</Text>
            <TouchableOpacity onPress={() => setDrawerOpen(false)}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.drawerContent}>
            <Text style={styles.sectionTitle}>Ownership</Text>
            <View style={styles.chipGroup}>
              {(['isLocalOwned', 'isCommunityOwned', 'isVeteranOwned', 'isWomanOwned'] as const).map(
                (key) => (
                  <FilterChip
                    key={key}
                    label={QUICK_FILTERS.find((f) => f.key === key)?.label ?? key}
                    active={draftFilters[key]}
                    onToggle={() =>
                      setDraftFilters((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                  />
                )
              )}
            </View>

            <Text style={styles.sectionTitle}>Discovery</Text>
            <View style={styles.chipGroup}>
              {(['hiringNow', 'hasFreeToday', 'hasUpcomingEvent'] as const).map((key) => (
                <FilterChip
                  key={key}
                  label={QUICK_FILTERS.find((f) => f.key === key)?.label ?? key}
                  active={draftFilters[key]}
                  onToggle={() =>
                    setDraftFilters((prev) => ({ ...prev, [key]: !prev[key] }))
                  }
                />
              ))}
            </View>

            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.chipGroup}>
              {BUSINESS_CATEGORIES.map((cat) => (
                <FilterChip
                  key={cat}
                  label={CATEGORY_LABELS[cat] ?? cat}
                  active={draftFilters.category === cat}
                  onToggle={() =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      category: prev.category === cat ? null : cat,
                    }))
                  }
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.drawerFooter}>
            <Button label="Clear All" variant="outline" onPress={resetAll} style={styles.footerBtn} />
            <Button label="Apply Filters" onPress={applyDraft} style={styles.footerBtn} />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  stripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  filterButton: {
    width: 40,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...Shadows.sm,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.gold,
    borderRadius: Radius.full,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  chipScroll: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  chip: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  chipLabelActive: {
    color: Colors.textInverse,
  },

  // Drawer
  drawer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  drawerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  drawerContent: {
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  drawerFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  footerBtn: {
    flex: 1,
  },
});
