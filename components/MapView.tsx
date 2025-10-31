'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Marker-Icons fixieren (Leaflet Standard-Icons)
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

// Status-Farben für Marker
const statusColors = {
  OPEN: '#ef4444',
  DELIVERED: '#22c55e',
  UNCLEAR: '#eab308',
};

// Custom Marker-Icon erstellen
function createStatusIcon(status: 'OPEN' | 'DELIVERED' | 'UNCLEAR') {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${statusColors[status]}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

// GPS-Position Marker
const gpsIcon = L.divIcon({
  className: 'gps-marker',
  html: `<div style="background-color: #3b82f6; width: 32px; height: 32px; border-radius: 50%; border: 4px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); animation: pulse 2s infinite;"></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Map-Zentrierung auf GPS-Position
function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

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

export default function MapView({
  addresses,
  onAddressClick,
  gpsPosition,
  bounds,
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
        zoom={bounds ? 13 : 15}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {bounds && <FitBounds bounds={bounds} />}
        {gpsPosition && (
          <Marker position={gpsPosition} icon={gpsIcon}>
            <Popup>Ihre aktuelle Position</Popup>
          </Marker>
        )}
        {addresses.map((address) => (
          <Marker
            key={address.id}
            position={[address.lat, address.lng]}
            icon={createStatusIcon(address.status)}
            eventHandlers={{
              click: () => onAddressClick(address),
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">
                  {address.street} {address.houseNumber}
                </p>
                <p className="text-gray-600 capitalize">{address.status.toLowerCase()}</p>
                {address.notes && (
                  <p className="text-gray-500 mt-1">{address.notes}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

