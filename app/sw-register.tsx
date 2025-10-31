'use client';

import { useEffect } from 'react';

export function SWRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registriert:', registration);
        })
        .catch((error) => {
          console.error('Service Worker Registrierung fehlgeschlagen:', error);
        });
    }
  }, []);

  return null;
}

