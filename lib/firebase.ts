console.log("ENV DEBUG START");
console.log("API KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
console.log("AUTH DOMAIN:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log("PROJECT ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log("STORAGE BUCKET:", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
console.log("MESSAGING ID:", process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
console.log("APP ID:", process.env.NEXT_PUBLIC_FIREBASE_APP_ID);
console.log("ENV DEBUG END");

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import type { FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
console.log(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
console.log(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
console.log(process.env.NEXT_PUBLIC_FIREBASE_APP_ID);

// Initialize Firebase app (only if not already initialized)
let app: FirebaseApp;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth: Auth = getAuth(app);

export const db: Firestore = getFirestore(app);
