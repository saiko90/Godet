// Petit magasin clé → valeur dans IndexedDB (navigateur) pour le garage hors ligne : dernier parc, dossiers des
// machines et saisies en attente. Toute erreur (navigation privée, stockage refusé) est silencieuse : sans magasin,
// le garage fonctionne comme avant, simplement sans mémoire hors ligne.
const DB = 'godet-hors-ligne';
const STORE = 'kv';

let opening: Promise<IDBDatabase | null> | null = null;

function open(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  opening ??= new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => {
        const db = req.result;
        // Une autre version (autre onglet) demande la base : on la libère.
        db.onversionchange = () => {
          db.close();
          opening = null;
        };
        resolve(db);
      };
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return opening;
}

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest | null): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise<T | undefined>((resolve) => {
        if (!db) return resolve(undefined);
        try {
          const tx = db.transaction(STORE, mode);
          const req = work(tx.objectStore(STORE));
          tx.oncomplete = () => resolve(req ? (req.result as T) : undefined);
          tx.onerror = () => resolve(undefined);
          tx.onabort = () => resolve(undefined);
        } catch {
          resolve(undefined);
        }
      }),
  );
}

export function idbGet<T>(key: string): Promise<T | undefined> {
  return run<T>('readonly', (s) => s.get(key));
}

export function idbSet(key: string, value: unknown): Promise<void> {
  return run<void>('readwrite', (s) => s.put(value, key)).then(() => undefined);
}

export function idbDel(key: string): Promise<void> {
  return run<void>('readwrite', (s) => s.delete(key)).then(() => undefined);
}

/** Efface tout (déconnexion : rien ne reste sur un appareil partagé). */
export function idbClear(): Promise<void> {
  return run<void>('readwrite', (s) => s.clear()).then(() => undefined);
}
