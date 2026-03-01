import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import type { FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

let app: FirebaseApp;

if (typeof window !== "undefined") {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
} else {
  // Prevent Firebase from initializing during SSR
  app = {} as FirebaseApp;
}

export const auth: Auth = typeof window !== "undefined"
  ? getAuth(app)
  : ({} as Auth);

export const db: Firestore = typeof window !== "undefined"
  ? getFirestore(app)
  : ({} as Firestore);