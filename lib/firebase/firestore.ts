import {
    type Firestore,
    getFirestore,
    initializeFirestore,
    memoryLocalCache,
} from 'firebase/firestore';

import { firebaseApp } from '@/lib/firebase/app';

// React Native has no IndexedDB/LocalStorage, so Firestore's persistent
// (IndexedDB-backed) cache is unavailable here — the SDK warns and falls back
// to memory on its own. Ask for the memory cache explicitly instead.
let db: Firestore;
try {
  db = initializeFirestore(firebaseApp, {
    localCache: memoryLocalCache(),
  });
} catch {
  // Already initialized (e.g. hot reload) — return existing instance
  db = getFirestore(firebaseApp);
}

export const firebaseDb = db;
