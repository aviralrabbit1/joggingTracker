import { useState, useEffect, useRef } from 'react';
import { locationService, type LocationPermissionState } from '../services/locationService';
import type { Position } from '../types/interfaces';

export const useLocationTracking = () => {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [locationPermission, setLocationPermission] = useState<LocationPermissionState>('prompt');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [error, setError] = useState<string>('');
  const isTrackingRef = useRef(false);

  // Check location permission on mount
  useEffect(() => {
    let cleanupListener: (() => void) | undefined;

    const checkPermission = async () => {
      const permission = await locationService.checkLocationPermission();
      setLocationPermission(permission);
      
      // Setup permission change listener and store cleanup
      const maybeCleanup = await locationService.setupPermissionListener(setLocationPermission);
      cleanupListener = typeof maybeCleanup === 'function' ? maybeCleanup : undefined;
    };
    
    checkPermission();

    // Cleanup listener on unmount
    return () => {
      if (cleanupListener) {
        cleanupListener();
      }
    };
  }, []);

  // Request location permission
  const requestLocationPermission = async (): Promise<boolean> => {
    setIsRequestingPermission(true);
    setError('');

    const result = await locationService.requestLocationPermission();
    
    setIsRequestingPermission(false);
    
    if (result.success) {
      setLocationPermission('granted');
      if (result.position) {
        setCurrentPosition(result.position);
      }
      return true;
    } else {
      setLocationPermission('denied');
      setError(result.error || 'Failed to get location permission');
      return false;
    }
  };

  // Start location tracking
  const startTracking = (onPositionUpdate: (position: Position) => void): void => {
    if (locationPermission !== 'granted') {
      setError('Location permission not granted');
      return;
    }

    isTrackingRef.current = true;
    setError('');

    locationService.startWatching(
      (position) => {
        setCurrentPosition(position);
        onPositionUpdate(position);
        setError(''); // Clear any previous errors
      },
      (errorMessage) => {
        setError(errorMessage);
        if (errorMessage.includes('permission denied')) {
          setLocationPermission('denied');
        }
      }
    );
  };

  // Stop location tracking
  const stopTracking = (): void => {
    isTrackingRef.current = false;
    locationService.stopWatching();
  };

  return {
    currentPosition,
    locationPermission,
    isRequestingPermission,
    error,
    requestLocationPermission,
    startTracking,
    stopTracking,
    setError
  };
};