// =============================================================================
// BusinessFilters — filter chip strip + modal for map view
// =============================================================================

import React from 'react';
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

export interface FilterOption {
  key: string;
  label: string;
}

export const FILTER_OPTIONS: FilterOption[] = [
  { key: 'local', label: '🏠 Local Owned' },
  { key: 'community', label: '🤝 Community Owned' },
  { key: 'hiring_now', label: '🟢 Hiring Now' },
  { key: 'free_today', label: '🎁 Free Today' },
  { key: 'events', label: '📅 Events' },
  { key: 'veteran', label: '🎖 Veteran Owned' },
  { key: 'woman_owned', label: '♀ Woman Owned' },
  { key: 'verified', label: '✔ Verified' },
];

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
  visible: boolean;
  activeFilters: string[];
  onToggleFilter: (key: string) => void;
  onClose: () => void;
  onClear: () => void;
}

export function BusinessFilters({
  visible,
  activeFilters,
  onToggleFilter,
  onClose,
  onClear,
}: BusinessFiltersProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.drawer}>
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>Filter Businesses</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.drawerContent}>
          <View style={styles.chipGroup}>
            {FILTER_OPTIONS.map((f) => (
              <FilterChip
                key={f.key}
                label={f.label}
                active={activeFilters.includes(f.key)}
                onToggle={() => onToggleFilter(f.key)}
              />
            ))}
          </View>
        </ScrollView>

        <View style={styles.drawerFooter}>
          <Button label="Clear All" variant="outline" onPress={onClear} style={styles.footerBtn} />
          <Button label="Done" onPress={onClose} style={styles.footerBtn} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
