import { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { backgroundTaskService } from '../services/backgroundTask';
import type { JoggingSession, AppState } from '../types/interfaces';

export const useSessionPersistence = () => {
  const [sessions, setSessions] = useState<JoggingSession[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);

  // Load sessions on mount
  useEffect(() => {
    const loadedSessions = storageService.loadSessions();
    setSessions(loadedSessions);
  }, []);

  // Auto-save sessions when they change
  useEffect(() => {
    if (sessions.length === 0) return;

    const saveToStorage = () => {
      setSaveStatus('saving');
      const success = storageService.saveSessions(sessions);
      
      if (success) {
        setSaveStatus('saved');
        setLastSaveTime(Date.now());
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    };

    // Use background task service for saving
    backgroundTaskService.scheduleTask(saveToStorage, 'background');
  }, [sessions]);

  // Setup periodic backup
  useEffect(() => {
    const backupTaskId = backgroundTaskService.setupAutoSave(
      () => sessions,
      (sessionsData) => storageService.createBackup(sessionsData),
      30000 // Every 30 seconds
    );

    return () => {
      if (backupTaskId) {
        backgroundTaskService.clearQueue();
      }
    };
  }, [sessions]);

  // Save app state
  const saveAppState = useCallback((state: AppState): void => {
    backgroundTaskService.scheduleTask(() => {
      storageService.saveAppState(state);
    }, 'background');
  }, []);

  // Load app state
  const loadAppState = useCallback((): AppState | null => {
    return storageService.loadAppState();
  }, []);

  // Clear app state
  const clearAppState = useCallback((): void => {
    storageService.clearAppState();
  }, []);

  // Add new session
  const addSession = useCallback((session: JoggingSession): void => {
    setSessions(prev => [...prev, session]);
  }, []);

  // Get storage info
  const getStorageInfo = useCallback(() => {
    return storageService.getStorageInfo();
  }, []);

  // Format last save time
  const formatLastSaveTime = useCallback((): string => {
    if (!lastSaveTime) return 'Never';
    
    const now = Date.now();
    const diff = now - lastSaveTime;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(lastSaveTime).toLocaleTimeString();
  }, [lastSaveTime]);

  return {
    sessions,
    setSessions,
    addSession,
    saveStatus,
    lastSaveTime,
    formatLastSaveTime,
    saveAppState,
    loadAppState,
    clearAppState,
    getStorageInfo
  };
};