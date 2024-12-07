/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "@/app/config/firebase-config";

export const useNotifications = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      const permission = await Notification.permission;
      setIsEnabled(permission === "granted");
    };
    checkPermission();
  }, []);

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setIsEnabled(permission === "granted");

      if (permission === "granted") {
        const messaging = getMessaging(app);
        const newToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });
        if (newToken) {
          setToken(newToken);
          return newToken;
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
    return null;
  };

  return { requestPermission, token, isEnabled };
};

// export const useNotifications = () => {
//   const [token, setToken] = useState<string | null>(null);
//   const [isEnabled, setIsEnabled] = useState(false);

//   useEffect(() => {
//     const checkPermission = async () => {
//       const permission = await Notification.permission;
//       setIsEnabled(permission === "granted");

//       if (permission === "granted") {
//         const messaging = getMessaging(app);
//         try {
//           const currentToken = await getToken(messaging, {
//             vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
//           });
//           if (currentToken) {
//             setToken(currentToken);
//           }
//         } catch (error) {
//           console.error("Error retrieving token:", error);
//         }
//       }
//     };

//     checkPermission();
//   }, []);

//   const requestPermission = async () => {
//     try {
//       const permission = await Notification.requestPermission();
//       if (permission === "granted") {
//         const messaging = getMessaging(app);
//         const newToken = await getToken(messaging, {
//           vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
//         });

//         if (newToken) {
//           console.log("Notification permission granted. Token:", newToken);
//           setToken(newToken);
//           setIsEnabled(true);
//           return newToken;
//         }
//       }
//     } catch (error) {
//       console.error("Notification permission error:", error);
//     }
//     return null;
//   };

//   return { requestPermission, token, isEnabled };
// };
