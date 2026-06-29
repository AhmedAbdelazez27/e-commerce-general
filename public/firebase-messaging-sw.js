/* eslint-disable no-undef */
/**
 * Firebase messaging service worker.
 * Config must match `src/environments/firebase.config.ts`.
 */
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyB21xbzOEjSCYZuM4W_G8TG75YqhNIhcwg',
  authDomain: 'compass-ecommerce-10225.firebaseapp.com',
  projectId: 'compass-ecommerce-10225',
  storageBucket: 'compass-ecommerce-10225.firebasestorage.app',
  messagingSenderId: '79905495448',
  appId: '1:79905495448:web:34bf4516f3dcfcf66733ed',
  measurementId: 'G-MM0DEE6L0M',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'Notification';
  const body = payload.notification?.body || payload.data?.body || '';
  const icon = payload.notification?.icon || '/images/Logo.png';

  self.registration.showNotification(title, {
    body,
    icon,
    data: payload.data || {},
  });

  // Notify any open app tabs so in-app state (badge, dropdown) updates immediately.
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
    for (const client of windowClients) {
      client.postMessage({
        type: 'FCM_PUSH',
        notification: payload.notification || {},
        data: payload.data || {},
      });
    }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.targetUrl || '/notifications';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    }),
  );
});
