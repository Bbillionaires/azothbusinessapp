import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocationStore } from '../../store/locationStore';
import { useBusinesses } from '../../hooks/useBusinesses';
import { BusinessCard } from '../../components/business/BusinessCard';
import { BusinessFilters } from '../../components/business/BusinessFilters';
import { SearchBar } from '../../components/ui/SearchBar';
import { THEME } from '../../lib/theme';
import type { BusinessSummary as Business } from '../../hooks/useBusinesses';

const { height } = Dimensions.get('window');

const CATEGORY_ICONS: Record<string, string> = {
  restaurant: '🍽️',
  retail: '🛍️',
  services: '🔧',
  health: '🏥',
  beauty: '💇',
  fitness: '💪',
  entertainment: '🎭',
  education: '📚',
  nonprofit: '🤝',
  default: '📍',
};

const FILTERS = [
  { key: 'hiring_now', label: '🟢 Hiring', field: 'hiring_now' },
  { key: 'free_today', label: '🎁 Free Today', field: 'has_free_today' },
  { key: 'events', label: '📅 Events', field: 'has_upcoming_event' },
  { key: 'local', label: '🏠 Local', field: 'is_local_owned' },
  { key: 'community', label: '🤝 Community', field: 'is_community_owned' },
  { key: 'veteran', label: '🎖 Veteran', field: 'is_veteran_owned' },
  { key: 'verified', label: '✔ Verified', field: 'verification_level' },
];

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const { location } = useLocationStore();
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false);

  const initialRegion: Region = {
    latitude: location?.latitude ?? 30.3322,
    longitude: location?.longitude ?? -81.6557,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const { data: businesses = [], loading: isLoading } = useBusinesses({
    lat: initialRegion.latitude,
    lng: initialRegion.longitude,
    radius_miles: 10,
    search_query: searchQuery || undefined,
    filter_badges: activeFilters.length > 0 ? activeFilters : undefined,
  });

  const toggleFilter = useCallback((key: string) => {
    setActiveFilters(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  }, []);

  const centerOnUser = useCallback(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 800);
    }
  }, [location]);

  const getMarkerEmoji = (business: Business) => {
    return CATEGORY_ICONS[business.category ?? ''] ?? CATEGORY_ICONS.default;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search bar overlay */}
      <View style={styles.searchOverlay}>
        <TouchableOpacity style={styles.searchBarPressable} onPress={() => router.push('/search')} activeOpacity={0.8}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search businesses near you..."
            style={styles.searchBar}
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, activeFilters.length > 0 && styles.filterBtnActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={20} color={activeFilters.length > 0 ? '#fff' : THEME.colors.primary} />
          {activeFilters.length > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilters.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.activeFilterScroll}
          contentContainerStyle={styles.activeFilterContent}
        >
          {activeFilters.map(key => {
            const filter = FILTERS.find(f => f.key === key);
            return (
              <TouchableOpacity
                key={key}
                style={styles.activeFilterChip}
                onPress={() => toggleFilter(key)}
              >
                <Text style={styles.activeFilterText}>{filter?.label}</Text>
                <Ionicons name="close" size={14} color="#fff" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={styles.clearFiltersBtn}
            onPress={() => setActiveFilters([])}
          >
            <Text style={styles.clearFiltersText}>Clear all</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {businesses.map(business => (
          <Marker
            key={business.id}
            coordinate={{
              latitude: business.latitude ?? 0,
              longitude: business.longitude ?? 0,
            }}
            onPress={() => {
              setSelectedBusiness(business);
              setBottomSheetExpanded(false);
            }}
          >
            <View style={[
              styles.markerContainer,
              selectedBusiness?.id === business.id && styles.markerSelected,
            ]}>
              <Text style={styles.markerEmoji}>{getMarkerEmoji(business)}</Text>
            </View>
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutName} numberOfLines={1}>{business.name}</Text>
                <Text style={styles.calloutCategory}>{business.category}</Text>
                {business.average_rating ? (
                  <Text style={styles.calloutRating}>⭐ {business.average_rating.toFixed(1)}</Text>
                ) : null}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* My location button */}
      <TouchableOpacity style={styles.locationBtn} onPress={centerOnUser}>
        <Ionicons name="locate" size={22} color={THEME.colors.primary} />
      </TouchableOpacity>

      {/* Bottom sheet */}
      <View style={[styles.bottomSheet, bottomSheetExpanded && styles.bottomSheetExpanded]}>
        <TouchableOpacity
          style={styles.bottomSheetHandle}
          onPress={() => {
            setBottomSheetExpanded(!bottomSheetExpanded);
            setSelectedBusiness(null);
          }}
        >
          <View style={styles.handleBar} />
          <Text style={styles.bottomSheetTitle}>
            {selectedBusiness
              ? selectedBusiness.name
              : `${businesses.length} businesses nearby`}
          </Text>
        </TouchableOpacity>

        {selectedBusiness ? (
          <View style={styles.selectedBusinessContainer}>
            <BusinessCard
              business={selectedBusiness}
              onPress={() => router.push(`/business/${selectedBusiness.id}`)}
            />
            <TouchableOpacity
              style={styles.directionsBtn}
              onPress={() => {/* open maps */}}
            >
              <Ionicons name="navigate" size={16} color="#fff" />
              <Text style={styles.directionsBtnText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        ) : bottomSheetExpanded ? (
          <ScrollView style={styles.businessList} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <Text style={styles.loadingText}>Loading businesses...</Text>
            ) : businesses.length === 0 ? (
              <Text style={styles.emptyText}>No businesses found in this area</Text>
            ) : (
              businesses.map(b => (
                <BusinessCard
                  key={b.id}
                  business={b}
                  onPress={() => router.push(`/business/${b.id}`)}
                />
              ))
            )}
          </ScrollView>
        ) : null}
      </View>

      {/* Filter modal */}
      <BusinessFilters
        visible={showFilters}
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        onClose={() => setShowFilters(false)}
        onClear={() => setActiveFilters([])}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchOverlay: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    gap: 8,
  },
  searchBarPressable: { flex: 1 },
  searchBar: { flex: 1 },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  filterBtnActive: { backgroundColor: THEME.colors.primary },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: THEME.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  activeFilterScroll: {
    position: 'absolute',
    top: 155,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  activeFilterContent: { paddingHorizontal: 16, gap: 8 },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activeFilterText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  clearFiltersBtn: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearFiltersText: { color: THEME.colors.primary, fontSize: 13, fontWeight: '600' },
  map: { flex: 1 },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
  },
  markerSelected: {
    borderColor: THEME.colors.gold,
    transform: [{ scale: 1.2 }],
    backgroundColor: THEME.colors.primaryLight,
  },
  markerEmoji: { fontSize: 20 },
  callout: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  calloutName: { fontWeight: '700', fontSize: 14, color: THEME.colors.text },
  calloutCategory: { color: THEME.colors.textSecondary, fontSize: 12, marginTop: 2 },
  calloutRating: { fontSize: 12, marginTop: 4 },
  locationBtn: {
    position: 'absolute',
    right: 16,
    bottom: height * 0.35 + 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomSheetExpanded: { maxHeight: height * 0.65 },
  bottomSheetHandle: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.border,
    marginBottom: 8,
  },
  bottomSheetTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  selectedBusinessContainer: { padding: 16 },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    gap: 6,
  },
  directionsBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  businessList: { flex: 1 },
  loadingText: { textAlign: 'center', padding: 20, color: THEME.colors.textSecondary },
  emptyText: { textAlign: 'center', padding: 20, color: THEME.colors.textSecondary },
});
