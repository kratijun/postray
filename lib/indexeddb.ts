// IndexedDB Service für Offline-Speicherung
import { openDB, IDBPDatabase } from 'idb';

interface AddressValue {
  id: string;
  rayonId: string;
  street: string;
  houseNumber: string;
  lat: number;
  lng: number;
  status: 'OPEN' | 'DELIVERED' | 'UNCLEAR';
  notes?: string;
  synced: boolean;
}

interface SyncQueueValue {
  id: string;
  type: 'update' | 'create';
  addressId: string;
  data: Record<string, unknown>;
  timestamp: number;
}

type PostRayDB = {
  addresses: AddressValue;
  syncQueue: SyncQueueValue;
};

let db: IDBPDatabase | null = null;

export async function initDB(): Promise<IDBPDatabase> {
  if (db) return db;

  db = await openDB('postray-db', 1, {
    upgrade(db) {
      // Addresses Store
      const addressStore = db.createObjectStore('addresses', {
        keyPath: 'id',
      });
      addressStore.createIndex('by-rayon', 'rayonId');
      addressStore.createIndex('by-synced', 'synced');

      // Sync Queue Store
      db.createObjectStore('syncQueue', {
        keyPath: 'id',
      });
    },
  });

  return db;
}

export async function saveAddresses(addresses: any[], rayonId: string) {
  const database = await initDB();
  const tx = database.transaction('addresses', 'readwrite');

  for (const addr of addresses) {
    await tx.store.put({
      ...addr,
      synced: true,
    });
  }

  await tx.done;
}

export async function getAddresses(rayonId: string) {
  const database = await initDB();
  const index = database.transaction('addresses').store.index('by-rayon');
  return await index.getAll(rayonId);
}

export async function updateAddress(addressId: string, updates: Record<string, unknown>) {
  const database = await initDB();
  const address = await database.get('addresses', addressId);

  if (address) {
    const updated = {
      ...address,
      ...updates,
      synced: false,
    };
    await database.put('addresses', updated);

    // Zur Sync-Queue hinzufügen
    await database.put('syncQueue', {
      id: `sync-${Date.now()}-${Math.random()}`,
      type: 'update',
      addressId,
      data: updates,
      timestamp: Date.now(),
    });
  }
}

export async function syncPendingChanges() {
  if (!navigator.onLine) return;

  const database = await initDB();
  const queue = await database.getAll('syncQueue');

  for (const item of queue) {
    try {
      const response = await fetch(`/api/addresses/${item.addressId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data),
      });

      if (response.ok) {
        // Aus Queue entfernen
        await database.delete('syncQueue', item.id);

        // Adresse als synchronisiert markieren
        const address = await database.get('addresses', item.addressId);
        if (address) {
          await database.put('addresses', {
            ...address,
            synced: true,
          });
        }
      }
    } catch (error) {
      console.error('Sync-Fehler:', error);
    }
  }
}

// Sync bei Online-Verbindung
if (typeof window !== 'undefined') {
  window.addEventListener('online', syncPendingChanges);
}

