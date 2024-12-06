import { useState, useEffect } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "@/app/config/firebase-config";

export const useNotifications = () => {
  const [token, setToken] = useState<string | null>(null);

  const requestPermission = () => {
    Notification.requestPermission()
      .then((permission) => {
        if (permission === "granted") {
          const messaging = getMessaging(app);
          return getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          });
        }
      })
      .then((token) => {
        if (token) {
          console.log("Notification permission granted. Token:", token);
          setToken(token);
        }
      })
      .catch((error) => {
        console.error("Notification permission error:", error);
      });
  };

  useEffect(() => {
    const messaging = getMessaging(app);
    const unsubscribe = onMessage(messaging, (payload) => {
      new Notification(payload.notification?.title || "New Message", {
        body: payload.notification?.body,
      });
    });

    return () => unsubscribe();
  }, []);

  return { requestPermission, token };
};
