// =============================================================================
// Location Store — Zustand
// =============================================================================

import { create } from 'zustand';
import * as Location from 'expo-location';

interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

interface LocationState {
  coordinates: Coordinates | null;
  city: string | null;
  state: string | null;
  permissionStatus: Location.PermissionStatus | null;
  isLoading: boolean;
  error: string | null;

  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<void>;
  reverseGeocode: (coords: Coordinates) => Promise<void>;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  coordinates: null,
  city: null,
  state: null,
  permissionStatus: null,
  isLoading: false,
  error: null,

  requestPermission: async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    set({ permissionStatus: status });
    if (status === 'granted') {
      await get().getCurrentLocation();
      return true;
    }
    return false;
  },

  getCurrentLocation: async () => {
    set({ isLoading: true, error: null });
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords: Coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };
      set({ coordinates: coords });
      await get().reverseGeocode(coords);
    } catch (err) {
      set({ error: 'Unable to get your location.' });
    } finally {
      set({ isLoading: false });
    }
  },

  reverseGeocode: async (coords) => {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      if (results.length > 0) {
        const r = results[0];
        set({
          city: r?.city ?? r?.subregion ?? null,
          state: r?.region ?? null,
        });
      }
    } catch (err) {
      console.error('Reverse geocode failed:', err);
    }
  },
}));
