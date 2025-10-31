'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useTheme } from '../theme-provider';

interface Rayon {
  id: string;
  name: string;
  createdAt: string;
  _count: {
    addresses: number;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [rayons, setRayons] = useState<Rayon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      loadRayons();
    }
  }, [session]);

  const loadRayons = async () => {
    try {
      const response = await fetch('/api/rayons');
      if (response.ok) {
        const data = await response.json();
        setRayons(data);
      } else {
        setError('Fehler beim Laden der Rayons');
      }
    } catch (err) {
      setError('Fehler beim Laden der Rayons');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (rayonId: string) => {
    if (!confirm('Möchten Sie diesen Rayon wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/rayons/${rayonId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRayons(rayons.filter((r) => r.id !== rayonId));
      } else {
        alert('Fehler beim Löschen des Rayons');
      }
    } catch (err) {
      alert('Fehler beim Löschen des Rayons');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Lade...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent dark:from-primary-400 dark:to-primary-300">
                PostRay
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Willkommen zurück, {session.user?.email?.split('@')[0]}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:scale-110"
                aria-label="Theme wechseln"
              >
                <span className="text-xl">{theme === 'dark' ? '☀️' : '🌙'}</span>
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Meine Rayons
            </h2>
            <Link
              href="/map/create"
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              <span>Neuen Rayon erstellen</span>
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Verwalten Sie Ihre Zustellgebiete und sehen Sie alle Adressen auf einen Blick
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {rayons.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl p-12 text-center border border-gray-200/50 dark:border-gray-700/50">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Noch keine Rayons vorhanden
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Erstellen Sie Ihren ersten Rayon, um zu beginnen
              </p>
              <Link
                href="/map/create"
                className="inline-block bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                Ersten Rayon erstellen
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rayons.map((rayon) => (
              <div
                key={rayon.id}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {rayon.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-lg">📍</span>
                        <span>{rayon._count.addresses} Adressen</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                      <span className="text-xl">🗺️</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-6">
                    <Link
                      href={`/map/${rayon.id}`}
                      className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium px-4 py-3 rounded-xl text-center transition-all transform hover:scale-105 shadow-md hover:shadow-lg"
                    >
                      Öffnen
                    </Link>
                    <button
                      onClick={() => handleDelete(rayon.id)}
                      className="px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

