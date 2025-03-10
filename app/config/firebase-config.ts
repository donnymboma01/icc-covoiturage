/* eslint-disable @typescript-eslint/no-unused-vars */
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: "icc-covoitturage.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: "G-Q8MYSV9F7G",
};


// const app = initializeApp(firebaseConfig);
// const messaging = typeof window !== "undefined" ? getMessaging(app) : null;
// const db = typeof window !== "undefined" ? getFirestore(app) : null;
// const storage = getStorage(app);

// export { app, messaging, db };
const app = initializeApp(firebaseConfig);
const messaging = typeof window !== "undefined" ? getMessaging(app) : null;
const db = typeof window !== "undefined" ? getFirestore(app) : null;
const storage = typeof window !== "undefined" ? getStorage(app) : null;
const auth = typeof window !== "undefined" ? getAuth(app) : null;

export { app, messaging, db, storage, auth };

