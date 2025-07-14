import { useState, useEffect, useRef } from 'react';
import { locationPermissionService, LocationPermissionService } from '../services/LocationPermissionService';
import type { LocationPermissionState, Position } from '../types/interfaces';

export const useLocationTracking = () => {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [locationPermission, setLocationPermission] = useState<LocationPermissionState>('prompt');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [error, setError] = useState<string>('');
  const isTrackingRef = useRef(false);

  // Check location permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      const permission = await locationPermissionService.checkLocationPermission();
      setLocationPermission(permission);
      
      // Setup permission change listener
      await locationPermissionService.setupPermissionListener(setLocationPermission);
    };
    
    checkPermission();
  }, []);

  // Request location permission
  const requestLocationPermission = async (): Promise<boolean> => {
    setIsRequestingPermission(true);
    setError('');

    const result = await locationPermissionService.requestLocationPermission();
    
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

    locationPermissionService.startWatching(
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
    locationPermissionService.stopWatching();
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