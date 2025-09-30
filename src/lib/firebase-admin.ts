import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore }        from 'firebase-admin/firestore';
import { getAuth }             from 'firebase-admin/auth';

console.log('⚙️ Admin project:', process.env.ADMIN_PROJECT_ID);

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId:  process.env.ADMIN_PROJECT_ID,
      clientEmail: process.env.ADMIN_CLIENT_EMAIL,
      privateKey:  process.env.ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminDb   = getFirestore();
export const adminAuth = getAuth();
