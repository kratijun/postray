'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Dynamische Imports für Client-only Komponenten
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Rectangle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Rectangle),
  { ssr: false }
);

// Komponenten dynamisch importieren (Client-only)
const DrawingHandler = dynamic(() => import('@/components/DrawingHandler'), { ssr: false });
const MapCenter = dynamic(() => import('@/components/MapCenter'), { ssr: false });


export default function CreateRayonPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [rayonName, setRayonName] = useState('');
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null); // null = noch nicht geladen
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    // GPS-Position sofort abrufen - nur im Browser
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setGpsLoading(true);
      let timeoutCleared = false;

      const timeoutId = setTimeout(() => {
        if (!timeoutCleared) {
          console.log('GPS-Timeout - verwende Fallback');
          setMapCenter([48.2082, 16.3738]);
          setGpsLoading(false);
        }
      }, 3000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          timeoutCleared = true;
          clearTimeout(timeoutId);
          const pos: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          console.log('GPS-Position erhalten:', pos);
          setMapCenter(pos);
          setGpsLoading(false);
        },
        (err) => {
          timeoutCleared = true;
          clearTimeout(timeoutId);
          console.error('GPS-Fehler:', err);
          // Fallback zu Wien nur wenn GPS fehlschlägt
          setMapCenter([48.2082, 16.3738]);
          setGpsLoading(false);
        },
        {
          enableHighAccuracy: false, // false = schneller
          timeout: 2000,
          maximumAge: 60000, // Erlaube 1 Minute alte Position
        }
      );
    } else if (typeof window !== 'undefined') {
      // Kein GPS verfügbar - Fallback zu Wien
      setMapCenter([48.2082, 16.3738]);
      setGpsLoading(false);
    } else {
      // SSR - Fallback zu Wien
      setMapCenter([48.2082, 16.3738]);
      setGpsLoading(false);
    }
  }, []);

  const handleBoundsChange = useCallback((newBounds: L.LatLngBounds | null) => {
    setBounds(newBounds);
  }, []);

  const handleCreateRayon = async () => {
    if (!rayonName.trim()) {
      setError('Bitte geben Sie einen Namen ein');
      return;
    }

    if (!bounds) {
      setError('Bitte wählen Sie ein Gebiet auf der Karte aus');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Rayon erstellen
      const boundsData = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      };

      const rayonResponse = await fetch('/api/rayons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: rayonName, bounds: boundsData }),
      });

      if (!rayonResponse.ok) {
        throw new Error('Fehler beim Erstellen des Rayons');
      }

      const rayon = await rayonResponse.json();

      // Hausnummern von Overpass API abrufen
      const overpassResponse = await fetch('/api/overpass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bounds: boundsData }),
      });

      if (overpassResponse.ok) {
        const { addresses } = await overpassResponse.json();

        if (addresses.length > 0) {
          // Adressen speichern
          await fetch('/api/addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rayonId: rayon.id,
              addresses: addresses.map((addr: any) => ({
                ...addr,
                status: 'OPEN',
              })),
            }),
          });
        }
      }

      router.push(`/map/${rayon.id}`);
    } catch (err) {
      setError('Fehler beim Erstellen des Rayons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || gpsLoading || !mapCenter) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🗺️</div>
          <div className="animate-pulse text-gray-700 dark:text-gray-300 font-semibold text-lg mb-2">
            Lade Karte...
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            GPS-Position wird ermittelt...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 p-6 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent dark:from-primary-400 dark:to-primary-300">
                Neuen Rayon erstellen
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Definieren Sie Ihr Zustellgebiet auf der Karte
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
            >
              ✕ Abbrechen
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <span className="flex items-center gap-2">
                  <span>📝</span>
                  <span>Rayon-Name</span>
                </span>
              </label>
              <input
                type="text"
                value={rayonName}
                onChange={(e) => setRayonName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all shadow-sm"
                placeholder="z.B. Stadtteil Nord, Route 1..."
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setIsDrawingMode(!isDrawingMode)}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all transform ${
                  isDrawingMode
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg scale-105'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {isDrawingMode ? (
                    <>
                      <span>✓</span>
                      <span>Zeichnungsmodus aktiv</span>
                    </>
                  ) : (
                    <>
                      <span>✏️</span>
                      <span>Rechteck zeichnen</span>
                    </>
                  )}
                </span>
              </button>
            </div>

            <div className={`text-sm px-4 py-3 rounded-xl transition-all ${
              isDrawingMode && bounds
                ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                : isDrawingMode
                ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                : 'bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {isDrawingMode && bounds ? '✅' : isDrawingMode ? '🗺️' : '💡'}
                </span>
                <span>
                  {isDrawingMode
                    ? bounds
                      ? 'Gebiet ausgewählt! Klicken Sie auf "Rayon erstellen" um fortzufahren.'
                      : 'Ziehen Sie ein Rechteck auf der Karte, um Ihr Zustellgebiet zu markieren.'
                    : 'Aktivieren Sie den Zeichnungsmodus, um ein Rechteck zu zeichnen.'}
                </span>
              </div>
            </div>

            <button
              onClick={handleCreateRayon}
              disabled={loading || !bounds || !rayonName.trim()}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Erstelle Rayon...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Rayon erstellen</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 relative">
        {typeof window !== 'undefined' && mapCenter && (
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapCenter center={mapCenter} />
            <DrawingHandler onBoundsChange={handleBoundsChange} isDrawingMode={isDrawingMode} />
            {bounds && (
              <Rectangle
                bounds={bounds}
                pathOptions={{
                  color: '#f59e0b',
                  weight: 4,
                  fillColor: '#fbbf24',
                  fillOpacity: 0.25,
                  dashArray: '10, 5',
                }}
              />
            )}
          </MapContainer>
        )}
      </div>
    </div>
  );
}

