import type { JoggingSession, AppState } from '../types/interfaces';

export class StorageService {
  private readonly SESSIONS_KEY = 'joggingSessions';
  private readonly APP_STATE_KEY = 'joggingAppState';
  private readonly BACKUP_KEY = 'joggingSessionsBackup';

  /**
   * Save sessions to localStorage
   */
  saveSessions(sessions: JoggingSession[]): boolean {
    try {
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
      return true;
    } catch (error) {
      console.error('Failed to save sessions:', error);
      return false;
    }
  }

  /**
   * Load sessions from localStorage
   */
  loadSessions(): JoggingSession[] {
    try {
      const savedSessions = localStorage.getItem(this.SESSIONS_KEY);
      return savedSessions ? JSON.parse(savedSessions) : [];
    } catch (error) {
      console.error('Failed to load sessions:', error);
      return [];
    }
  }

  /**
   * Save current app state
   */
  saveAppState(state: AppState): boolean {
    try {
      localStorage.setItem(this.APP_STATE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      console.error('Failed to save app state:', error);
      return false;
    }
  }

  /**
   * Load app state from localStorage
   */
  loadAppState(): AppState | null {
    try {
      const savedState = localStorage.getItem(this.APP_STATE_KEY);
      return savedState ? JSON.parse(savedState) : null;
    } catch (error) {
      console.error('Failed to load app state:', error);
      return null;
    }
  }

  /**
   * Clear saved app state
   */
  clearAppState(): void {
    try {
      localStorage.removeItem(this.APP_STATE_KEY);
    } catch (error) {
      console.error('Failed to clear app state:', error);
    }
  }

  /**
   * Create backup of sessions with timestamp
   */
  createBackup(sessions: JoggingSession[]): boolean {
    try {
      const backup = {
        timestamp: Date.now(),
        sessions: sessions,
        version: '1.0'
      };
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
      return true;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return false;
    }
  }

  /**
   * Load backup from localStorage
   */
  loadBackup(): { timestamp: number; sessions: JoggingSession[]; version: string } | null {
    try {
      const backup = localStorage.getItem(this.BACKUP_KEY);
      return backup ? JSON.parse(backup) : null;
    } catch (error) {
      console.error('Failed to load backup:', error);
      return null;
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Estimate available storage (most browsers have ~5-10MB limit)
      const estimated = 5 * 1024 * 1024; // 5MB estimate
      const available = Math.max(0, estimated - used);
      const percentage = (used / estimated) * 100;

      return { used, available, percentage };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Clear all app data
   */
  clearAllData(): void {
    try {
      localStorage.removeItem(this.SESSIONS_KEY);
      localStorage.removeItem(this.APP_STATE_KEY);
      localStorage.removeItem(this.BACKUP_KEY);
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  }
}

export const storageService = new StorageService();