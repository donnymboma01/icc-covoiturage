/* eslint-disable @typescript-eslint/no-unused-vars */
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getMessaging} from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: "G-Q8MYSV9F7G",
};

const app = initializeApp(firebaseConfig);
// Pour Jason & Djedou : le messaging est utilisé pour les notifications.
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
// const analytics = getAnalytics(app); --> On ne l'utilisera pas parce que nous allons probablement avoir une partie admin de nous-meme.

export { app, messaging };
