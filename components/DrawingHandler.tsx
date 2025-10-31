'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface DrawingHandlerProps {
  onBoundsChange: (bounds: L.LatLngBounds | null) => void;
  isDrawingMode: boolean;
}

export default function DrawingHandler({ 
  onBoundsChange,
  isDrawingMode
}: DrawingHandlerProps) {
  const map = useMap();
  const rectangleRef = useRef<L.Rectangle | null>(null);
  const startPointRef = useRef<L.LatLng | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    // Wenn nicht im Zeichnungsmodus, nichts tun
    if (!isDrawingMode) {
      // Sicherstellen, dass Drag aktiviert ist
      if (map.dragging && !map.dragging.enabled()) {
        map.dragging.enable();
      }
      return;
    }

    const onMouseDown = (e: L.LeafletMouseEvent) => {
      // Verhindere Zeichnen bei Rechtsklick oder mit Modifier-Tasten
      if (e.originalEvent.button !== 0 || e.originalEvent.ctrlKey || e.originalEvent.metaKey) {
        return;
      }

      // Verhindere Karten-Drag während des Zeichnens
      if (map.dragging && map.dragging.enabled()) {
        map.dragging.disable();
      }
      
      isDrawingRef.current = true;
      startPointRef.current = e.latlng;
      
      // Altes Rechteck entfernen
      if (rectangleRef.current) {
        map.removeLayer(rectangleRef.current);
        rectangleRef.current = null;
      }
      onBoundsChange(null);

      // Verhindere weiteres Event-Handling
      L.DomEvent.stopPropagation(e.originalEvent);
      L.DomEvent.preventDefault(e.originalEvent);

      const onMouseMove = (moveEvent: L.LeafletMouseEvent) => {
        if (!isDrawingRef.current || !startPointRef.current) return;

        // Verhindere Karten-Drag während des Zeichnens
        L.DomEvent.stopPropagation(moveEvent.originalEvent);
        L.DomEvent.preventDefault(moveEvent.originalEvent);

        const newBounds = L.latLngBounds([startPointRef.current, moveEvent.latlng]);

        if (rectangleRef.current) {
          map.removeLayer(rectangleRef.current);
        }

        rectangleRef.current = L.rectangle(newBounds, {
          color: '#f59e0b',
          weight: 4,
          fillColor: '#fbbf24',
          fillOpacity: 0.25,
          dashArray: '10, 5',
          interactive: false,
        }).addTo(map);

        onBoundsChange(newBounds);
      };

      const onMouseUp = () => {
        isDrawingRef.current = false;
        startPointRef.current = null;
        
        // Karten-Drag wieder aktivieren
        if (map.dragging && !map.dragging.enabled()) {
          map.dragging.enable();
        }
        
        map.off('mousemove', onMouseMove);
        map.off('mouseup', onMouseUp);
      };

      map.on('mousemove', onMouseMove);
      map.on('mouseup', onMouseUp);
    };

    map.on('mousedown', onMouseDown);

    return () => {
      map.off('mousedown', onMouseDown);
      if (rectangleRef.current) {
        map.removeLayer(rectangleRef.current);
      }
      // Sicherstellen, dass Drag wieder aktiviert ist
      if (map.dragging && !map.dragging.enabled()) {
        map.dragging.enable();
      }
    };
  }, [map, onBoundsChange, isDrawingMode]);

  return null;
}

