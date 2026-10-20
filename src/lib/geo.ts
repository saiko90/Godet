'use client';

// Position GPS d'une saisie : demandée à l'ouverture de la fenêtre (pas d'attente à l'enregistrement), une seule fois,
// jamais en arrière-plan. Sans autorisation ou sans signal, la saisie s'enregistre simplement sans position.
import { useEffect, useState } from 'react';
import type { GeoFix } from '@/lib/repo/types';

export type GeoState = 'off' | 'locating' | 'ok' | 'denied' | 'unavailable';

export function useGeoFix(enabled: boolean): { state: GeoState; fix: GeoFix | null } {
  const [result, setResult] = useState<{ state: GeoState; fix: GeoFix | null }>({ state: 'off', fix: null });

  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      queueMicrotask(() => setResult({ state: 'unavailable', fix: null }));
      return;
    }
    let alive = true;
    queueMicrotask(() => alive && setResult((r) => (r.fix ? r : { state: 'locating', fix: null })));
    // Une position fraîche et précise ; on garde la meilleure reçue pendant quelques secondes.
    const watch = navigator.geolocation.watchPosition(
      (p) => {
        if (!alive) return;
        const fix: GeoFix = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Number.isFinite(p.coords.accuracy) ? p.coords.accuracy : null };
        setResult((r) => (r.fix && (r.fix.accuracy ?? Infinity) <= (fix.accuracy ?? Infinity) ? r : { state: 'ok', fix }));
      },
      (e) => {
        if (!alive) return;
        setResult((r) => (r.fix ? r : { state: e.code === e.PERMISSION_DENIED ? 'denied' : 'unavailable', fix: null }));
      },
      { enableHighAccuracy: true, maximumAge: 120_000, timeout: 20_000 },
    );
    const stop = window.setTimeout(() => navigator.geolocation.clearWatch(watch), 30_000);
    return () => {
      alive = false;
      window.clearTimeout(stop);
      navigator.geolocation.clearWatch(watch);
    };
  }, [enabled]);

  return enabled ? result : { state: 'off', fix: null };
}

/** Lien vers la carte (OpenStreetMap), lisible sur tous les appareils. */
export function mapUrl(lat: number, lng: number): string {
  const la = lat.toFixed(6);
  const ln = lng.toFixed(6);
  return `https://www.openstreetmap.org/?mlat=${la}&mlon=${ln}#map=17/${la}/${ln}`;
}
