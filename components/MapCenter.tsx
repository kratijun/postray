'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

interface MapCenterProps {
  center: [number, number];
}

export default function MapCenter({ center }: MapCenterProps) {
  const map = useMap();
  const centerRef = useRef<[number, number] | null>(null);
  
  useEffect(() => {
    // Nur zentrieren wenn sich die Position ändert
    if (!centerRef.current || 
        (centerRef.current[0] !== center[0] || centerRef.current[1] !== center[1])) {
      map.setView(center, map.getZoom(), {
        animate: false,
      });
      centerRef.current = center;
    }
  }, [map, center]);
  
  return null;
}

