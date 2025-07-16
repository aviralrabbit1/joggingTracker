import React, { useEffect, useRef } from 'react'
import type { RouteCanvasProps } from '../types/interfaces'

const CanvasBoard: React.FC<RouteCanvasProps> = ({ positions, currentPosition }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    if (positions.length === 0) {
      // Draw placeholder
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, rect.width, rect.height);
      
      ctx.fillStyle = '#9ca3af';
      ctx.font = '16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Start tracking to see your route', rect.width / 2, rect.height / 2);
      return;
    }

    // Calculate bounds
    const lats = positions.map(p => p.lat);
    const lngs = positions.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Add padding
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;
    const padding = 0.1;
    
    const paddedMinLat = minLat - latRange * padding;
    const paddedMaxLat = maxLat + latRange * padding;
    const paddedMinLng = minLng - lngRange * padding;
    const paddedMaxLng = maxLng + lngRange * padding;

    // Convert lat/lng to canvas coordinates
    const latToY = (lat: number) => {
      return rect.height - ((lat - paddedMinLat) / (paddedMaxLat - paddedMinLat)) * rect.height;
    };

    const lngToX = (lng: number) => {
      return ((lng - paddedMinLng) / (paddedMaxLng - paddedMinLng)) * rect.width;
    };

    // Draw background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * rect.width;
      const y = (i / 10) * rect.height;
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    // Draw route path
    if (positions.length > 1) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Create gradient for the path
      const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(1, '#8b5cf6');
      ctx.strokeStyle = gradient;

      ctx.beginPath();
      const firstPos = positions[0];
      ctx.moveTo(lngToX(firstPos.lng), latToY(firstPos.lat));

      for (let i = 1; i < positions.length; i++) {
        const pos = positions[i];
        ctx.lineTo(lngToX(pos.lng), latToY(pos.lat));
      }
      ctx.stroke();

      // Draw start marker
      const startPos = positions[0];
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(lngToX(startPos.lng), latToY(startPos.lat), 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add start label
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('START', lngToX(startPos.lng), latToY(startPos.lat) - 12);
    }

    // Draw current position
    if (currentPosition) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(lngToX(currentPosition.lng), latToY(currentPosition.lat), 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add pulsing effect
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lngToX(currentPosition.lng), latToY(currentPosition.lat), 12, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Add current position label
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('YOU', lngToX(currentPosition.lng), latToY(currentPosition.lat) - 18);
    }

  }, [positions, currentPosition]);

  return (
    <div className="relative w-full h-80 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default CanvasBoard