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

console.log("🔥 Service Worker Firebase Messaging initialisé");

messaging.onBackgroundMessage((payload) => {
  try {
    console.log("📨 Message reçu en arrière-plan:", payload);
    
    const notificationTitle = payload.notification?.title || "Nouvelle notification";
    const notificationOptions = {
      body: payload.notification?.body || "Vous avez une nouvelle notification",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      vibrate: [200, 100, 200],
      tag: payload.data?.tag || "default",
      requireInteraction: true, 
      silent: false, 
      data: payload.data, 
    };

    console.log("🔔 Affichage de la notification:", notificationTitle, notificationOptions);
    
    return self.registration.showNotification(
      notificationTitle,
      notificationOptions
    );
  } catch (error) {
    console.error("❌ Erreur de visualisation de notifications:", error);
  }
});


self.addEventListener('notificationclick', function(event) {
  console.log('🖱️ Clic sur notification:', event.notification);
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
