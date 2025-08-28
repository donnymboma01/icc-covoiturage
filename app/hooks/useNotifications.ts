/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "@/app/config/firebase-config";


export const useNotifications = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);

  const isIOSDevice = () => {
    return (
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      /iPad|iPhone|iPod/.test(navigator.userAgent) 
    );
  };

  const requestPermission = async () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      console.log("Window or navigator not available");
      return null;
    }

    try {
      console.log("Starting FCM permission request");

      if (!("Notification" in window)) {
        console.error("Ce navigateur ne supporte pas les notifications");
        return null;
      }

      if (!("serviceWorker" in navigator)) {
        console.error("Ce navigateur ne supporte pas les service workers");
        return null;
      }

      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );
      console.log("Service Worker registered successfully:", registration);

      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      console.log("Notification permission:", permission);

      if (permission === "granted") {
        const messaging = getMessaging(app);
        const currentToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (currentToken) {
          console.log("FCM token obtained:", currentToken);
          setToken(currentToken);
          setIsEnabled(true);
          return currentToken;
        } else {
          console.error("Aucun token FCM généré");
        }
      } else {
        console.error("Permission de notification refusée:", permission);
      }

      return null;
    } catch (error) {
      console.error("Error requesting permission:", error);
      return null;
    }
  };

  return { requestPermission, token, isEnabled };
};


const checkServiceWorkerRegistration = async () => {
  if (typeof navigator === 'undefined') {
    throw new Error("Navigator not available");
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker not supported");
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    throw new Error("Service Worker not registered");
  }

  return registration;
};

const initializeMessaging = async () => {
  try {
    const registration = await checkServiceWorkerRegistration();
    const messaging = getMessaging(app);
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return currentToken;
  } catch (error) {
    console.error("Error initializing messaging:", error);
    throw error;
  }
};
