import {
    type Firestore,
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
} from 'firebase/firestore';

import { firebaseApp } from '@/lib/firebase/app';

let db: Firestore;
try {
  db = initializeFirestore(firebaseApp, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  // Already initialized (e.g. hot reload) — return existing instance
  db = getFirestore(firebaseApp);
}

export const firebaseDb = db;
