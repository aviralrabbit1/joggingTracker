import type { JoggingSession, Position } from '../types/interfaces';
import { locationService } from './locationService';

export class SessionService {
  // Create a new jogging session
  createSession(): JoggingSession {
    return {
      id: this.generateSessionId(),
      startTime: Date.now(),
      positions: [],
      distance: 0,
      duration: 0,
      avgPace: 0
    };
  }

  // Complete a session with final calculations
  completeSession(session: JoggingSession, endTime?: number): JoggingSession {
    const finalEndTime = endTime || Date.now();
    const totalDuration = Math.max(0, finalEndTime - session.startTime);
    const distance = locationService.calculateDistance(session.positions);
    const avgPace = distance > 0 ? (totalDuration / 1000 / 60) / (distance / 1000) : 0;

    return {
      ...session,
      endTime: finalEndTime,
      distance,
      duration: totalDuration,
      avgPace
    };
  }

  // Add position to session
  addPositionToSession(session: JoggingSession, position: Position): JoggingSession {
    console.log('➕ Adding position to session:', position);
    console.log('📊 Session before update:', {
      id: session.id,
      positionCount: session.positions.length,
      currentDistance: session.distance
    });
    
    const updatedSession = {
      ...session,
      positions: [...session.positions, position]
    };
    
    console.log('📊 Session after update:', {
      id: updatedSession.id,
      positionCount: updatedSession.positions.length
    });
    
    return {
      ...session,
      positions: [...session.positions, position]
    };
  }

  // Calculate current session statistics
  calculateCurrentStats(session: JoggingSession, startTime: number, isPaused: boolean, pausedTime: number): {
    duration: number;
    distance: number;
    pace: number;
    speed: number;
  } {
    console.log('📈 Calculating current stats for session with', session.positions.length, 'positions');
    
    const now = Date.now();
    let duration: number;
    
    if (isPaused) {
      duration = Math.max(0, pausedTime - startTime);
    } else {
      duration = Math.max(0, now - startTime);
    }

    const distance = locationService.calculateDistance(session.positions);
    console.log('📏 Calculated distance:', distance, 'meters');
    
    const durationInMinutes = duration / 1000 / 60;
    const distanceInKm = distance / 1000;
    const pace = distanceInKm > 0 ? durationInMinutes / distanceInKm : 0;
    const speed = pace > 0 ? 60 / pace : 0;

    const stats = {
      duration,
      distance,
      pace,
      speed
    };
    
    console.log('📊 Final stats:', stats);
    
    return {
      duration,
      distance,
      pace,
      speed
    };
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Format duration in milliseconds to readable string
  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  }

  // Format distance in meters to readable string
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  }

  // Format pace in minutes per kilometer
  formatPace(pace: number): string {
    if (pace === 0 || !isFinite(pace)) return '0:00';
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Format date timestamp to readable string
  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  // Calculate session statistics for multiple sessions
  calculateOverallStats(sessions: JoggingSession[]): {
    totalDistance: number;
    totalDuration: number;
    avgPace: number;
    totalSessions: number;
  } {
    const totalDistance = sessions.reduce((sum, session) => sum + session.distance, 0);
    const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
    const avgPace = sessions.length > 0 
      ? sessions.reduce((sum, session) => sum + session.avgPace, 0) / sessions.length 
      : 0;

    return {
      totalDistance,
      totalDuration,
      avgPace,
      totalSessions: sessions.length
    };
  }

  // Filter sessions by date range
  filterSessionsByDateRange(sessions: JoggingSession[], startDate: Date, endDate: Date): JoggingSession[] {
    return sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  }

  // Get sessions from last N days
  getRecentSessions(sessions: JoggingSession[], days: number): JoggingSession[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= cutoffDate;
    });
  }
}

export const sessionService = new SessionService();