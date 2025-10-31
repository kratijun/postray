'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// GPS-Position Marker - Gelbes Postauto
const gpsIcon = L.divIcon({
  className: 'gps-marker',
  html: `<div style="background-color: #FFD700; width: 40px; height: 40px; border-radius: 8px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 24px; animation: pulse 2s infinite;">🚐</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

interface Address {
  id: string;
  street: string;
  houseNumber: string;
  lat: number;
  lng: number;
  status: 'OPEN' | 'DELIVERED' | 'UNCLEAR';
  notes?: string;
}

interface MapViewProps {
  addresses: Address[];
  onAddressClick: (address: Address) => void;
  gpsPosition?: [number, number] | null;
  bounds?: { north: number; south: number; east: number; west: number } | null;
  followGPS?: boolean;
  onFollowToggle?: (follow: boolean) => void;
}

// Komponente für Bounds-Zentrierung
function FitBounds({ bounds }: { bounds: { north: number; south: number; east: number; west: number } }) {
  const map = useMap();
  
  useEffect(() => {
    const leafletBounds = L.latLngBounds(
      [bounds.south, bounds.west],
      [bounds.north, bounds.east]
    );
    map.fitBounds(leafletBounds, {
      padding: [50, 50],
      maxZoom: 16,
    });
  }, [map, bounds]);
  
  return null;
}

// Komponente für Follow-Modus (Karte folgt GPS-Position)
function FollowGPS({ gpsPosition, follow }: { gpsPosition?: [number, number] | null; follow: boolean }) {
  const map = useMap();
  
  useEffect(() => {
    if (follow && gpsPosition) {
      map.setView(gpsPosition, map.getZoom());
    }
  }, [map, gpsPosition, follow]);
  
  return null;
}

export default function MapView({
  addresses,
  onAddressClick,
  gpsPosition,
  bounds,
  followGPS = false,
  onFollowToggle,
}: MapViewProps) {
  // Berechne Center aus bounds oder verwende GPS/Fallback
  const getInitialCenter = (): [number, number] => {
    if (bounds) {
      // Zentrum der Bounds
      return [
        (bounds.north + bounds.south) / 2,
        (bounds.east + bounds.west) / 2,
      ];
    }
    if (gpsPosition) {
      return gpsPosition;
    }
    return [48.2082, 16.3738]; // Wien als Fallback
  };

  const [mapCenter] = useState<[number, number]>(getInitialCenter());

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={mapCenter}
        zoom={bounds ? 13 : 16}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={true}
        maxZoom={19}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {bounds && <FitBounds bounds={bounds} />}
        {gpsPosition && <FollowGPS gpsPosition={gpsPosition} follow={followGPS} />}
        {gpsPosition && (
          <Marker position={gpsPosition} icon={gpsIcon}>
            <Popup>Ihre aktuelle Position</Popup>
          </Marker>
        )}
        {/* Address markers removed for performance */}
      </MapContainer>
      
      {/* Follow-Button */}
      {gpsPosition && onFollowToggle && (
        <button
          onClick={() => onFollowToggle(!followGPS)}
          className={`absolute top-20 right-4 z-[1000] px-4 py-2 rounded-lg shadow-lg transition-all ${
            followGPS
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {followGPS ? '📍 Fixiert' : '📍 Fixieren'}
        </button>
      )}
    </div>
  );
}

