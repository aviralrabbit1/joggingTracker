import type { Position, LocationPermissionState } from "../../types/interfaces";

export class LocationPermissionService {
  private watchId: number | null = null;
  private onPositionUpdate?: (position: Position) => void;
  private onError?: (error: string) => void;

  // Check current location permission status
  async checkLocationPermission(): Promise<LocationPermissionState> {
    if (!('permissions' in navigator)) {
      return 'prompt';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state as LocationPermissionState;
    } catch (error) {
      console.error('Could not access location permission:', error);
      return 'prompt';
    }
  }

  // Request location permission from user
  async requestLocationPermission(): Promise<{ success: boolean; position?: Position; error?: string }> {
    if (!('geolocation' in navigator)) {
      return {
        success: false,
        error: 'Geolocation is not supported by this browser.'
      };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: Position = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now()
          };
          resolve({ success: true, position: pos });
        },
        (err) => {
          let errorMessage = '';
          if (err.code === err.PERMISSION_DENIED) {
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            errorMessage = 'Location information is unavailable. Please check your GPS settings.';
          } else if (err.code === err.TIMEOUT) {
            errorMessage = 'Location request timed out. Please try again.';
          } else {
            errorMessage = `Location error: ${err.message}`;
          }
          resolve({ success: false, error: errorMessage });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  // Start watching position changes
  startWatching(
    onPositionUpdate: (position: Position) => void,
    onError: (error: string) => void
  ): void {
    if (!('geolocation' in navigator)) {
      onError('Geolocation is not supported by this browser.');
      return;
    }

    this.onPositionUpdate = onPositionUpdate;
    this.onError = onError;

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newPosition: Position = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now()
        };
        this.onPositionUpdate?.(newPosition);
      },
      (err) => {
        let errorMessage = '';
        if (err.code === err.PERMISSION_DENIED) {
          errorMessage = 'Location permission denied. Please enable location access.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information is unavailable. Please check your GPS settings.';
        } else if (err.code === err.TIMEOUT) {
          errorMessage = 'Location request timed out. Please try again.';
        } else {
          errorMessage = `Location error: ${err.message}`;
        }
        this.onError?.(errorMessage);
      },
      options
    );
  }

  // Stop watching position changes
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Calculate distance between two positions using Haversine formula
  calculateDistance(positions: Position[]): number {
    if (positions.length < 2) return 0;
    
    let distance = 0;
    const R = 6371000; // Earth's radius in meters
    for (let i = 1; i < positions.length; i++) {
      const lat1 = positions[i - 1].lat;
      const lng1 = positions[i - 1].lng;
      const lat2 = positions[i].lat;
      const lng2 = positions[i].lng;
      
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distance += R * c;
    }
    
    return distance;
  }

  // Setup permission change listener
  async setupPermissionListener(callback: (state: LocationPermissionState) => void): Promise<void> {
    if (!('permissions' in navigator)) return;

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      permission.addEventListener('change', () => {
        callback(permission.state as LocationPermissionState);
      });
    } catch (error) {
      console.error('Error setting up permission listener:', error);
    }
  }
}

export const locationPermissionService = new LocationPermissionService();