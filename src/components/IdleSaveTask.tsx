import React, { useEffect, useState } from 'react';
import { Save, Cloud, CloudOff, CheckCircle } from 'lucide-react';
import { backgroundTaskService } from '../services/backgroundTask';
import type { JoggingSession } from '../types/interfaces';

const AutoSave: React.FC<JoggingSession[]> = ( sessions ) => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
  const [queueStatus, setQueueStatus] = useState(backgroundTaskService.getQueueStatus());

  useEffect(() => {
    // Auto-save sessions using background tasks
    const saveToLocalStorage = () => {
      try {
        setSaveStatus('saving');
        localStorage.setItem('joggingSessions', JSON.stringify(sessions));
        setSaveStatus('saved');
        setLastSaveTime(Date.now());
        
        // Reset status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Failed to save sessions:', error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    };

    // Schedule save task
    backgroundTaskService.scheduleTask(saveToLocalStorage, 'background');
  }, [sessions]);

  // Periodic backup save using Background Tasks API
  useEffect(() => {
    const performBackgroundSave = () => {
      backgroundTaskService.scheduleTask(() => {
        try {
          // Create a backup with timestamp
          const backup = {
            timestamp: Date.now(),
            sessions: sessions,
            version: '1.0'
          };
          localStorage.setItem('joggingSessionsBackup', JSON.stringify(backup));
        } catch (error) {
          console.error('Background backup failed:', error);
        }
      }, 'background');
    };

    // Perform background save every 30 seconds
    const interval = setInterval(() => {
      performBackgroundSave();
      setQueueStatus(backgroundTaskService.getQueueStatus());
    }, 30000);
    
    return () => clearInterval(interval);
  }, [sessions]);

  const formatLastSaveTime = (): string => {
    if (!lastSaveTime) return 'Never';
    
    const now = Date.now();
    const diff = now - lastSaveTime;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(lastSaveTime).toLocaleTimeString();
  };

  const getStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Cloud className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'saved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <CloudOff className="h-4 w-4 text-red-500" />;
      default:
        return <Save className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Save failed';
      default:
        return 'Auto-save active';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <div className="text-sm font-medium text-gray-700">
              {getStatusText()}
            </div>
            <div className="text-xs text-gray-500">
              Last saved: {formatLastSaveTime()}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm font-medium text-gray-700">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </div>
          <div className="text-xs text-gray-500">
            Background sync enabled
          </div>
        </div>
      </div>

      {/* Background Tasks API Status */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Background Tasks API:</span>
          <span className={queueStatus.supported === 'scheduler' ? 'text-green-600' : 'text-orange-600'}>
            {queueStatus.supported === 'scheduler' ? 'Supported' : `Fallback (${queueStatus.supported})`}
          </span>
        </div>
        {queueStatus.pending > 0 && (
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>Pending tasks:</span>
            <span>{queueStatus.pending}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoSave;