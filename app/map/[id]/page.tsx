'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { initDB, getAddresses, saveAddresses } from '@/lib/indexeddb';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

interface Address {
  id: string;
  street: string;
  houseNumber: string;
  lat: number;
  lng: number;
  status: 'OPEN' | 'DELIVERED' | 'UNCLEAR';
  notes?: string;
}

interface Rayon {
  id: string;
  name: string;
  bounds: string | { north: number; south: number; east: number; west: number };
}

export default function MapPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rayonId = params.id as string;

  const [rayon, setRayon] = useState<Rayon | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [gpsPosition, setGpsPosition] = useState<[number, number] | null>(null);
  const [followGPS, setFollowGPS] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session && rayonId) {
      loadRayon();
      initDB();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, rayonId]);

  useEffect(() => {
    // GPS-Position abrufen
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          setGpsPosition([position.coords.latitude, position.coords.longitude]);
        },
        (err) => {
          console.error('GPS-Fehler:', err);
        },
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    }
  }, []);

  const loadRayon = async () => {
    try {
      const response = await fetch(`/api/rayons/${rayonId}`);
      if (response.ok) {
        const data = await response.json();
        const bounds = typeof data.bounds === 'string' ? JSON.parse(data.bounds) : data.bounds;
        setRayon({ ...data, bounds });
        setAddresses(data.addresses || []);

        // Adressen in IndexedDB speichern für Offline-Nutzung
        if (data.addresses && data.addresses.length > 0) {
          await initDB();
          await saveAddresses(data.addresses, rayonId);
        }
      } else {
        setError('Rayon nicht gefunden');
      }
    } catch (err) {
      // Versuche aus IndexedDB zu laden
      try {
        await initDB();
        const dbAddresses = await getAddresses(rayonId);
        if (dbAddresses.length > 0) {
          setAddresses(dbAddresses as Address[]);
        } else {
          setError('Fehler beim Laden des Rayons');
        }
      } catch (dbErr) {
        setError('Fehler beim Laden des Rayons');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleAddressClick = (address: Address) => {
    // Einfach die Marker zeigen, keine Aktion erforderlich
  };


  if (status === 'loading' || loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-pulse text-gray-500">Lade Karte...</div>
      </div>
    );
  }

  if (!rayon) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-red-600 dark:text-red-400">{error || 'Rayon nicht gefunden'}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {rayon.name}
          </h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Zurück
          </button>
        </div>
      </div>

      {/* Karte */}
      <div className="flex-1 relative">
        {typeof window !== 'undefined' && rayon && (
          <MapView
            addresses={addresses}
            onAddressClick={handleAddressClick}
            gpsPosition={gpsPosition}
            bounds={typeof rayon.bounds === 'object' ? rayon.bounds : null}
            followGPS={followGPS}
            onFollowToggle={setFollowGPS}
          />
        )}
      </div>

    </div>
  );
}

