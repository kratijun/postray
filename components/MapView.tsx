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

// Komponente für Zoom-Tracking und Viewport-Marker
function SmartMarkers({ 
  addresses, 
  onAddressClick 
}: { 
  addresses: Address[]; 
  onAddressClick: (address: Address) => void;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [viewportBounds, setViewportBounds] = useState<L.LatLngBounds | null>(null);

  useEffect(() => {
    const updateZoom = () => setZoom(map.getZoom());
    const updateBounds = () => setViewportBounds(map.getBounds());
    
    map.on('zoomend', updateZoom);
    map.on('moveend', updateBounds);
    updateBounds(); // Initial bounds
    
    return () => {
      map.off('zoomend', updateZoom);
      map.off('moveend', updateBounds);
    };
  }, [map]);

  // Nur Marker bei hohem Zoom zeigen (ab 17)
  if (zoom < 17 || !viewportBounds) {
    return null;
  }

  // Filtere Adressen die im aktuellen Viewport sind
  const visibleAddresses = addresses.filter(addr => {
    return viewportBounds.contains([addr.lat, addr.lng]);
  });

  return (
    <>
        {visibleAddresses.map((address) => (
          <Marker
            key={address.id}
            position={[address.lat, address.lng]}
            icon={createAddressIcon(address.street, address.houseNumber)}
            eventHandlers={{
              click: () => onAddressClick(address),
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">
                  {address.street} {address.houseNumber}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
    </>
  );
}

// Icon für Hausnummern mit Straßenname
function createAddressIcon(street: string, houseNumber: string) {
  // Kürze Straßennamen für bessere Lesbarkeit
  const shortStreet = street.length > 12 ? street.substring(0, 10) + '...' : street;
  
  return L.divIcon({
    className: 'house-number-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        min-width: 60px;
        max-width: 120px;
        padding: 8px 10px;
        border-radius: 8px;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        font-weight: bold;
        text-align: center;
      ">
        <div style="font-size: 10px; line-height: 1.2; opacity: 0.95;">
          ${shortStreet}
        </div>
        <div style="font-size: 16px; line-height: 1;">
          ${houseNumber}
        </div>
      </div>
    `,
    iconSize: [80, 50],
    iconAnchor: [40, 50],
  });
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
        maxZoom={18}
        minZoom={10}
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
        <SmartMarkers addresses={addresses} onAddressClick={onAddressClick} />
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

