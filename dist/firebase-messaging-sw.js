// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA-2qvZ7aSkD1B704a7xIQjlOnHVUIx-aY",
  authDomain: "todo-app-e34f5.firebaseapp.com",
  projectId: "todo-app-e34f5",
  storageBucket: "todo-app-e34f5.firebasestorage.app",
  messagingSenderId: "262967842543",
  appId: "1:262967842543:web:592b289a80d6c59e91ed1a",
});

const messaging = firebase.messaging();

// Professional Background Handler
messaging.onBackgroundMessage((payload) => {
  console.log('📬 [SW] Background Message:', payload);
  
  const title = payload.notification?.title || payload.data?.title || 'Mission Update';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new update in your dashboard.',
    icon: payload.notification?.icon || '/logo192.png',
    badge: '/logo192.png',
    image: payload.notification?.image || payload.data?.image, // Large image support
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.url || payload.notification?.click_action || '/dashboard'
    },
    tag: 'mission-update', // Groups notifications
    renotify: true,
    requireInteraction: true, // Professional standard for mission-critical apps
    actions: [
      {
        action: 'open_url',
        title: 'View Update',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  };

  return self.registration.showNotification(title, notificationOptions);
});

// Professional Click Handling
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification Clicked:', event.notification.tag);
  
  event.notification.close();

  if (event.action === 'close') return;

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
