import React, { useEffect, useState } from "react";
import { messaging } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";
import toast from "react-hot-toast";

const VAPID_KEY = "BJ4bXhXOf_ZHWqC_aiEz505uAFcsWfJUBjArlPOD38aRPPn5s6MhRtlUbaI6XHSvB0NJDdealjWDR5SaXhiW7JA";

const PushNotificationButton = ({ token, onTokenSaved, permission }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!messaging || !token) return;

    const setupNotifications = async () => {
      try {
        if (Notification.permission === "default") {
          const result = await Notification.requestPermission();
          if (result !== "granted") {
            console.warn("🔔 Notifications blocked by user");
            return;
          }
        }

        if (Notification.permission === "granted") {
          const registration = await navigator.serviceWorker.ready;

          const fcmToken = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
          });

          if (fcmToken) {
            console.log("🚀 FCM Token Ready:", fcmToken);

            const res = await fetch("http://localhost:8080/auth/update-profile", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
              },
              body: JSON.stringify({ deviceToken: fcmToken }),
            });

            if (res.ok) {
              setIsSubscribed(true);
              if (onTokenSaved) onTokenSaved();
            }
          }
        }
      } catch (err) {
        console.error("❌ Notification Setup Error:", err);
      }
    };

    setupNotifications();

    // Foreground listener using react-hot-toast for "Professional" look
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("📩 Foreground Message:", payload);

      const title = payload.notification?.title || payload.data?.title || "Mission Update";
      const body = payload.notification?.body || payload.data?.body || "Strategic objectives have been updated.";
      const icon = payload.notification?.icon || "/logo192.png";
      const image = payload.notification?.image || payload.data?.image;

      // 🔊 Play Professional Notification Sound
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3");
        audio.volume = 0.6;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.warn("🔈 Sound blocked by browser policy until user interacts with the page.", e);
            // Fallback: try another sound or just log
          });
        }
      } catch (err) {
        console.error("Failed to play notification sound:", err);
      }

      // Trigger Rich Native Desktop Notification
      if (Notification.permission === "granted") {
        const notificationOptions = {
          body: body,
          icon: icon,
          badge: "/logo192.png",
          image: image,
          vibrate: [200, 100, 200],
          tag: 'todo-pro-notification',
          renotify: true,
          requireInteraction: true, // Keep it on screen until user acts
          silent: false, // Let the OS play its sound
          data: payload.data
        };

        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title, notificationOptions);
          });
        } else {
          new Notification(title, notificationOptions);
        }
      }

      // Professional Custom Toast
      toast.custom((t) => (
        <div
          className={`${t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-8 border-indigo-600 overflow-hidden`}
          onClick={() => {
            toast.dismiss(t.id);
            window.focus();
            if (payload.data?.url) window.location.href = payload.data.url;
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="flex-1 w-0 p-5">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <img
                  className="h-12 w-12 rounded-xl object-cover shadow-lg border border-gray-100"
                  src={icon}
                  alt="App Logo"
                />
              </div>
              <div className="ml-4 flex-1">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">Todo Pro • Just Now</p>
                </div>
                <p className="text-sm font-black text-gray-900 leading-tight">
                  {title}
                </p>
                <p className="mt-1 text-xs text-gray-500 font-medium">
                  {body}
                </p>
                {image && (
                  <img src={image} className="mt-3 rounded-lg w-full h-24 object-cover shadow-inner" alt="Preview" />
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col border-l border-gray-100 bg-gray-50/50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.dismiss(t.id);
              }}
              className="flex-1 px-4 flex items-center justify-center text-xs font-black text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all uppercase vertical-text"
              style={{ writingMode: 'vertical-rl' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ), {
        duration: 6000,
        position: 'top-right',
      });
    });

    return () => unsubscribe();
  }, [token, onTokenSaved, permission]);

  return null;
};

export default PushNotificationButton;