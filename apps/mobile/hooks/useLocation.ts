// =============================================================================
// useLocation — expo-location with permission request and reverse geocoding
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LatLng {
  lat: number;
  lng: number;
}

export interface UseLocationResult {
  location: LatLng | null;
  city: string | null;
  locationLabel: string;
  hasPermission: boolean;
  loading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
  requestPermission: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [city, setCity]         = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const resolveLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Request foreground permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        setHasPermission(false);
        setError('Location permission was denied.');
        return;
      }
      setHasPermission(true);

      // 2. Get current position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: LatLng = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setLocation(coords);

      // 3. Reverse geocode for city name
      try {
        const [place] = await Location.reverseGeocodeAsync({
          latitude:  coords.lat,
          longitude: coords.lng,
        });
        if (place) {
          setCity(place.city ?? place.subregion ?? place.region ?? null);
        }
      } catch {
        // Non-fatal — location is still valid without city name
      }
    } catch (err: any) {
      setError(err?.message ?? 'Unable to determine your location.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Request permission and fetch location on mount
  useEffect(() => {
    resolveLocation();
  }, [resolveLocation]);

  const locationLabel = city ?? (location ? `${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}` : 'Locating…');

  return {
    location,
    city,
    locationLabel,
    hasPermission,
    loading,
    error,
    refreshLocation: resolveLocation,
    requestPermission: resolveLocation,
  };
}
