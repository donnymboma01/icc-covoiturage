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

      // Special handling for iOS
      if (isIOSDevice()) {
        const messaging = getMessaging(app);
        const currentToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });

        if (currentToken) {
          console.log("iOS FCM token obtained:", currentToken);
          setToken(currentToken);
          setIsEnabled(true);
          return currentToken;
        }
        return null;
      }

      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js"
        );
        console.log("Service Worker registered", registration);

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const messaging = getMessaging(app);
          const currentToken = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
          });

          if (currentToken) {
            setToken(currentToken);
            setIsEnabled(true);
            return currentToken;
          }
        }
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
