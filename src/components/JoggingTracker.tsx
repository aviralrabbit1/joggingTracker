import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, MapPin, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import CanvasBoard from './CanvasBoard';
import SessionHistory from './SessionHistory';
import IdleSaveTask from './IdleSaveTask';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { useSessionPersistence } from '../hooks/useSessionPersistence';
import { sessionService } from '../services/sessionService';
import type { JoggingSession, Position } from '../types/interfaces';

const JoggingTracker: React.FC = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSession, setCurrentSession] = useState<JoggingSession | null>(null);
  
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Custom hooks
  const {
    currentPosition,
    locationPermission,
    isRequestingPermission,
    error: locationError,
    requestLocationPermission,
    startTracking: startLocationTracking,
    stopTracking: stopLocationTracking,
    setError: setLocationError
  } = useLocationTracking();

  const {
    sessions,
    addSession,
    saveAppState,
    loadAppState,
    clearAppState
  } = useSessionPersistence();

  // Restore state from localStorage on mount
  useEffect(() => {
    const savedState = loadAppState();
    if (savedState && savedState.isTracking && savedState.currentSession) {
      setIsTracking(savedState.isTracking);
      setIsPaused(savedState.isPaused);
      setCurrentSession(savedState.currentSession);
      startTimeRef.current = savedState.startTime;
      pausedTimeRef.current = savedState.pausedTime;
      
      // Show restoration notification
      setLocationError('Session restored from previous page refresh');
      setTimeout(() => setLocationError(''), 3000);
    }
  }, [loadAppState, setLocationError]);

  // Save state whenever tracking state changes
  useEffect(() => {
    saveAppState({
      isTracking,
      isPaused,
      currentSession,
      startTime: startTimeRef.current,
      pausedTime: pausedTimeRef.current
    });
  }, [isTracking, isPaused, currentSession, saveAppState]);

  // Handle beforeunload (page refresh/close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isTracking) {
        e.preventDefault();
        e.returnValue = 'You have an active jogging session. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isTracking]);

  // Handle location updates during tracking
  const handleLocationUpdate = (position: Position) => {
    console.log('🎯 Location update received in JoggingTracker:', position);
    
    if (currentSession && isTracking && !isPaused) {
      console.log('📝 Adding position to current session');
      setCurrentSession(prev => 
        prev ? sessionService.addPositionToSession(prev, position) : null
      );
    } else {
      console.log('⏸️ Not adding position - tracking state:', { isTracking, isPaused, hasSession: !!currentSession });
    }
  };

  // Start tracking
  const startTracking = async () => {
    // Check location permission first
    if (locationPermission !== 'granted') {
      const granted = await requestLocationPermission();
      if (!granted) return;
    }

    const newSession = sessionService.createSession();
    setCurrentSession(newSession);
    setIsTracking(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    setLocationError('');
    
    // Start location tracking
    startLocationTracking(handleLocationUpdate);
    
    // Play start sound
  };

  // Pause/Resume tracking
  const pauseTracking = async () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    
    if (newPausedState) {
      pausedTimeRef.current = Date.now();
      stopLocationTracking();
    } else {
      const pauseDuration = Date.now() - pausedTimeRef.current;
      startTimeRef.current += pauseDuration;
      startLocationTracking(handleLocationUpdate);
    }
  };

  // Stop tracking
  const stopTracking = async () => {
    if (currentSession) {
      const completedSession = sessionService.completeSession(currentSession);
      addSession(completedSession);
      setCurrentSession(null);
    }
    
    setIsTracking(false);
    setIsPaused(false);
    stopLocationTracking();
    
    // Clear saved state
    clearAppState();
    
    // Play stop sound
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Jogging Tracker
        </h1>
        <p className="text-gray-600 mt-2">Track your runs with real-time GPS and visual route mapping</p>
      </div>

      {/* Location Permission Request */}
      {locationPermission !== 'granted' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <MapPin className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Location Access Required</h3>
          </div>
          <p className="text-blue-800 mb-4">
            To track your jogging route and provide accurate distance measurements, we need access to your location.
          </p>
          <button
            onClick={requestLocationPermission}
            disabled={isRequestingPermission || locationPermission === 'denied'}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all ${
              locationPermission === 'denied'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRequestingPermission ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Requesting Permission...</span>
              </>
            ) : locationPermission === 'denied' ? (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>Permission Denied</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Enable Location Access</span>
              </>
            )}
          </button>
          {locationPermission === 'denied' && (
            <p className="text-sm text-red-600 mt-2">
              Please enable location access in your browser settings and refresh the page.
            </p>
          )}
        </div>
      )}

      {/* Error Message */}
      {locationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>{locationError}</span>
          </div>
        </div>
      )}

      {/* Main Tracking Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Controls and Stats */}
        <div className="space-y-6">
          {/* Control Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <span>Session Control</span>
            </h2>
            
            <div className="flex space-x-4">
              {!isTracking ? (
                <button
                  onClick={startTracking}
                  disabled={locationPermission !== 'granted'}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 transform hover:scale-105 ${
                    locationPermission !== 'granted'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                  }`}
                >
                  <Play className="h-5 w-5" />
                  <span>Start Run</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={pauseTracking}
                    className={`flex-1 py-3 px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 ${
                      isPaused 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700' 
                        : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700'
                    }`}
                  >
                    {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                  <button
                    onClick={stopTracking}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:from-red-600 hover:to-red-700 transition-all duration-200"
                  >
                    <Square className="h-5 w-5" />
                    <span>Stop</span>
                  </button>
                </>
              )}
            </div>

            {/* Status Indicator */}
            <div className="mt-4 flex items-center justify-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isTracking 
                  ? isPaused 
                    ? 'bg-yellow-400 animate-pulse' 
                    : 'bg-green-400 animate-pulse'
                  : 'bg-gray-300'
              }`}></div>
              <span className="text-sm text-gray-600">
                {isTracking 
                  ? isPaused 
                    ? 'Paused' 
                    : 'Tracking Active'
                  : 'Ready to Start'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Route Canvas */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            <span>Route Map</span>
          </h2>
          <CanvasBoard 
            positions={currentSession?.positions || []}
            currentPosition={currentPosition}
          />
        </div>
      </div>

      {/* Session History */}
      <SessionHistory sessions={sessions} />

      {/* Auto Save Component */}
      <IdleSaveTask/>
    </div>
  );
};

export default JoggingTracker;