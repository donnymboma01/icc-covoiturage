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
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
