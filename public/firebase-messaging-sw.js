/* eslint-disable no-undef */
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyB1RKvnA-dKlTlj7r7tQOch77b6Q9DFEms",
  authDomain: "icc-covoitturage.firebaseapp.com",
  projectId: "icc-covoitturage",
  storageBucket: "icc-covoitturage.firebasestorage.app",
  messagingSenderId: "505815730527",
  appId: "1:505815730527:web:cbefb27af4d36b27ffceea",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  try {
    console.log("Received background message:", payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: "/icon-192x192.png", 
      badge: "/badge-72x72.png", 
      vibrate: [200, 100, 200], 
      tag: payload.data?.tag || "default", 
    };

    return self.registration.showNotification(
      notificationTitle,
      notificationOptions
    );
  } catch (error) {
    console.error("Erreur de visualisation de notifications :", error);
  }
});
