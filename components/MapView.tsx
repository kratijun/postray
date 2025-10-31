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

  // Gruppiere Adressen nach Straße
  const streetsMap = new Map<string, Address[]>();
  visibleAddresses.forEach(addr => {
    if (!streetsMap.has(addr.street)) {
      streetsMap.set(addr.street, []);
    }
    streetsMap.get(addr.street)!.push(addr);
  });

  // Berechne Durchschnittsposition und Richtung für jede Straße
  const streetMarkers = Array.from(streetsMap.entries()).map(([street, addrs]) => {
    const avgLat = addrs.reduce((sum, addr) => sum + addr.lat, 0) / addrs.length;
    const avgLng = addrs.reduce((sum, addr) => sum + addr.lng, 0) / addrs.length;
    
    // Berechne Richtung der Straße basierend auf den Adressen
    let bearing = 0;
    if (addrs.length >= 2) {
      // Sortiere nach Distanz von einem Referenzpunkt
      const sorted = addrs.sort((a, b) => (a.lat + a.lng) - (b.lat + b.lng));
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      
      // Berechne Winkel zwischen erster und letzter Adresse
      bearing = Math.atan2(last.lng - first.lng, last.lat - first.lat) * 180 / Math.PI;
    }
    
    return { street, position: [avgLat, avgLng] as [number, number], count: addrs.length, bearing };
  });

  return (
    <>
      {/* Straßenmarker - ALWAYS angezeigt ab Zoom 17 */}
      {zoom >= 17 && streetMarkers.map(({ street, position, count, bearing }) => (
        <Marker
          key={`street-${street}`}
          position={position}
          icon={createStreetIcon(street, count, bearing)}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{street}</p>
              <p className="text-gray-600">{count} Adressen</p>
            </div>
          </Popup>
        </Marker>
      ))}
      
      {/* Hausnummer-Marker nur bei max Zoom */}
      {zoom >= 18 && visibleAddresses.map((address) => (
        <Marker
          key={address.id}
          position={[address.lat, address.lng]}
          icon={createHouseNumberIcon(address.houseNumber)}
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

// Icon für Straßennamen mit Rotation
function createStreetIcon(street: string, count: number, bearing: number) {
  // Kürze Straßennamen für bessere Lesbarkeit
  const shortStreet = street.length > 18 ? street.substring(0, 16) + '...' : street;
  
  return L.divIcon({
    className: 'street-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        min-width: 120px;
        padding: 8px 14px;
        border-radius: 12px;
        border: 3px solid white;
        box-shadow: 0 3px 12px rgba(0,0,0,0.6);
        transform: rotate(${bearing}deg);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        font-weight: bold;
        text-align: center;
        white-space: nowrap;
      ">
        <div style="font-size: 12px; line-height: 1.3;">
          🛣️ ${shortStreet}
        </div>
        <div style="font-size: 9px; opacity: 0.95; font-weight: normal;">
          ${count} Adressen
        </div>
      </div>
    `,
    iconSize: [120, 50],
    iconAnchor: [60, 25],
    popupAnchor: [0, -25],
  });
}

// Icon für Hausnummern (ohne Straßennamen)
function createHouseNumberIcon(houseNumber: string) {
  return L.divIcon({
    className: 'house-number-marker',
    html: `<div style="background-color: #ef4444; color: white; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold;">${houseNumber}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
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

