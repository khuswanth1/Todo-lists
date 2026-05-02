import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyA-2qvZ7aSkD1B704a7xIQjlOnHVUIx-aY",
  authDomain: "todo-app-e34f5.firebaseapp.com",
  projectId: "todo-app-e34f5",
  storageBucket: "todo-app-e34f5.firebasestorage.app",
  messagingSenderId: "262967842543",
  appId: "1:262967842543:web:592b289a80d6c59e91ed1a",
  measurementId: "G-5CZ2YRE6JT"
};

const app = initializeApp(firebaseConfig);

let messaging = null;

try {
  const supported = await isSupported();
  if (supported) {
    messaging = getMessaging(app);
  }
} catch (err) {
  console.error("Firebase Messaging not supported or failed to initialize:", err);
}

export { messaging };



