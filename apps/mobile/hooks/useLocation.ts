// =============================================================================
// useLocation — convenience hook wrapping the location store
// =============================================================================

import { useLocationStore } from '../store/locationStore';

export function useLocation() {
  const coordinates = useLocationStore((s) => s.coordinates);
  const city = useLocationStore((s) => s.city);
  const state = useLocationStore((s) => s.state);
  const permissionStatus = useLocationStore((s) => s.permissionStatus);
  const isLoading = useLocationStore((s) => s.isLoading);
  const error = useLocationStore((s) => s.error);
  const requestPermission = useLocationStore((s) => s.requestPermission);
  const getCurrentLocation = useLocationStore((s) => s.getCurrentLocation);

  const hasPermission = permissionStatus === 'granted';
  const locationLabel = city && state ? `${city}, ${state}` : city ?? state ?? 'Your Area';

  return {
    coordinates,
    city,
    state,
    locationLabel,
    permissionStatus,
    hasPermission,
    isLoading,
    error,
    requestPermission,
    getCurrentLocation,
  };
}
