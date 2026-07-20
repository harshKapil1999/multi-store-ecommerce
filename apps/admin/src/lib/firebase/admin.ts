import 'server-only';

import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function getPrivateKey() {
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
}

export function getFirebaseAdminAuth() {
  const app = getApps()[0] || initializeApp({
    credential:
      process.env.FIREBASE_CLIENT_EMAIL && getPrivateKey()
        ? cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: getPrivateKey(),
          })
        : applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });

  return getAuth(app);
}

export async function verifyFirebaseIdToken(idToken: string) {
  return getFirebaseAdminAuth().verifyIdToken(idToken);
}
