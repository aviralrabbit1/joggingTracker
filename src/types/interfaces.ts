interface Position {
  lat: number;
  lng: number;
  timestamp: number;
}

interface JoggingSession {
  id: string;
  startTime: number;
  endTime?: number;
  positions: Position[];
  distance: number;
  duration: number;
  avgPace: number;
}

interface AppState {
  isTracking: boolean;
  isPaused: boolean;
  currentSession: JoggingSession | null;
  startTime: number;
  pausedTime: number;
}

interface RouteCanvasProps {
  positions: Position[];
  currentPosition: Position | null;
}

interface SessionStatsProps {
  session: JoggingSession;
  isTracking: boolean;
  isPaused: boolean;
  startTime: number;
  pausedTime: number;
}

export type {
  Position,
  JoggingSession,
  AppState,
  RouteCanvasProps,
  SessionStatsProps
};
