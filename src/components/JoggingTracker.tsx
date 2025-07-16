import React, { useState } from 'react';
import { History, MapPin, Clock, Zap, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { sessionService } from '../services/sessionService';
import type { JoggingSession } from '../types/interfaces';

const SessionHistory: React.FC<JoggingSession[]> = (sessions) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const overallStats = sessionService.calculateOverallStats(sessions);

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
          <History className="h-5 w-5 text-blue-500" />
          <span>Session History</span>
        </h2>
        <div className="text-center py-8 text-gray-500">
          <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No jogging sessions yet. Start your first run!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center space-x-2">
          <History className="h-5 w-5 text-blue-500" />
          <span>Session History</span>
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {sessions.length}
          </span>
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-900">
            {sessionService.formatDistance(overallStats.totalDistance)}
          </div>
          <div className="text-sm text-blue-700">Total Distance</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-900">
            {sessionService.formatDuration(overallStats.totalDuration)}
          </div>
          <div className="text-sm text-purple-700">Total Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-900">
            {sessionService.formatPace(overallStats.avgPace)}/km
          </div>
          <div className="text-sm text-green-700">Avg Pace</div>
        </div>
      </div>

      {/* Session List */}
      {isExpanded && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sessions.slice().reverse().map((session, index) => (
            <div
              key={session.id}
              className={`border rounded-lg p-4 transition-all cursor-pointer ${
                selectedSession === session.id 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedSession(selectedSession === session.id ? null : session.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Run #{sessions.length - index}</div>
                    <div className="text-sm text-gray-500 flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{sessionService.formatDate(session.startTime)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-right">
                  <div>
                    <div className="text-sm font-semibold">
                      {sessionService.formatDistance(session.distance)}
                    </div>
                    <div className="text-xs text-gray-500">Distance</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">
                      {sessionService.formatDuration(session.duration)}
                    </div>
                    <div className="text-xs text-gray-500">Duration</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">
                      {sessionService.formatPace(session.avgPace)}/km
                    </div>
                    <div className="text-xs text-gray-500">Pace</div>
                  </div>
                </div>
              </div>

              {/* Expanded Session Details */}
              {selectedSession === session.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <span>GPS Points: {session.positions.length}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-orange-500" />
                      <span>Speed: {session.avgPace > 0 ? (60 / session.avgPace).toFixed(1) : '0.0'} km/h</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>Started: {new Date(session.startTime).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-purple-500" />
                      <span>Ended: {session.endTime ? new Date(session.endTime).toLocaleTimeString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionHistory;