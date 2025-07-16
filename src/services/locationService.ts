import type { Position } from '../types/interfaces';

export type LocationPermissionState = 'prompt' | 'granted' | 'denied';

export class LocationService {
  private watchId: number | null = null;
  private onPositionUpdate?: (position: Position) => void;
  private onError?: (error: string) => void;

  /**
   * Check current location permission status
   */
  async checkLocationPermission(): Promise<LocationPermissionState> {
    if (!('permissions' in navigator)) {
      return 'prompt';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state as LocationPermissionState;
    } catch (error) {
      console.error('Error checking location permission:', error);
      return 'prompt';
    }
  }

  /**
   * Request location permission from user
   */
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

  /**
   * Start watching position changes
   */
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

    console.log('🚀 Starting location watching with options:', options);

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        console.log('📍 Raw GPS position received:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString()
        });

        const newPosition: Position = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
        };
        
        console.log('✅ Position accepted and processed:', newPosition);
        this.onPositionUpdate?.(newPosition);
      },
      (err) => {
        console.error('❌ Geolocation error:', err);
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

  /**
   * Stop watching position changes
   */
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Calculate distance between two positions using Haversine formula
   */
  calculateDistance(positions: Position[]): number {
    console.log('🧮 Calculating distance for positions:', positions.length);
    
    if (positions.length < 2) return 0;
    
    // More lenient filtering for mobile devices
    const filteredPositions = this.filterClosePositions(positions, 1);
    
    console.log('📏 Filtered positions:', filteredPositions.length, 'from', positions.length);
    
    if (filteredPositions.length < 2) return 0;
    
    let distance = 0;
    for (let i = 1; i < filteredPositions.length; i++) {
      const lat1 = filteredPositions[i - 1].lat;
      const lng1 = filteredPositions[i - 1].lng;
      const lat2 = filteredPositions[i].lat;
      const lng2 = filteredPositions[i].lng;
      
      const R = 6371000; // Earth's radius in meters
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const segmentDistance = R * c;
      
      console.log(`📐 Segment ${i}: ${segmentDistance.toFixed(2)}m`);
      
      // More lenient distance validation for mobile
      if (segmentDistance < 200 && segmentDistance > 0.1) {
        distance += segmentDistance;
      } else {
        console.warn(`⚠️ Segment distance rejected: ${segmentDistance.toFixed(2)}m`);
      }
    }
    
    console.log('🏁 Total calculated distance:', distance.toFixed(2), 'meters');
    return distance;
  }

  /**
   * Filter out positions that are too close together
   */
  private filterClosePositions(positions: Position[], minDistance: number): Position[] {
    if (positions.length === 0) return [];
    
    const filtered = [positions[0]];
    console.log('🔍 Starting position filtering with minDistance:', minDistance);
    
    for (let i = 1; i < positions.length; i++) {
      const lastPos = filtered[filtered.length - 1];
      const currentPos = positions[i];
      
      const distance = this.calculateDistanceBetweenTwoPoints(
        lastPos.lat, lastPos.lng,
        currentPos.lat, currentPos.lng
      );
      
      console.log(`📏 Distance from last point: ${distance.toFixed(2)}m`);
      
      if (distance >= minDistance) {
        filtered.push(currentPos);
        console.log('✅ Position added to filtered array');
      } else {
        console.log('❌ Position too close, skipped');
      }
    }
    
    console.log('🎯 Filtered result:', filtered.length, 'positions from', positions.length);
    return filtered;
  }

  /**
   * Calculate distance between two specific points
   */
  private calculateDistanceBetweenTwoPoints(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Setup permission change listener
   */
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

export const locationService = new LocationService();