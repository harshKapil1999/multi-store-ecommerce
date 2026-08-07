import 'server-only';

import { createRemoteJWKSet, jwtVerify } from 'jose';

const GOOGLE_SECURE_TOKEN_KEYS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export type FirebaseIdToken = {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
};

export async function verifyFirebaseIdToken(idToken: string) {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();

  if (!projectId) {
    throw new Error('Firebase project ID is not configured on the server.');
  }

  const { payload } = await jwtVerify(idToken, GOOGLE_SECURE_TOKEN_KEYS, {
    algorithms: ['RS256'],
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
  });

  if (!payload.sub) {
    throw new Error('Firebase ID token does not contain a user ID.');
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    email_verified: payload.email_verified === true,
    name: typeof payload.name === 'string' ? payload.name : undefined,
  } satisfies FirebaseIdToken;
}
