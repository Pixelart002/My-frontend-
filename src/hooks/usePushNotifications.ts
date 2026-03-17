"use client";

import { useEffect, useState } from "react";

export function usePushNotifications() {
 const [permission, setPermission] = useState < NotificationPermission > ("default");
 const [subscription, setSubscription] = useState < PushSubscription | null > (null);
 
 useEffect(() => {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
  setPermission(Notification.permission);
  
  // Register service worker
  navigator.serviceWorker.register("/sw.js").then((reg) => {
   reg.pushManager.getSubscription().then((sub) => {
    setSubscription(sub);
   });
  });
 }, []);
 
 const subscribe = async () => {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return;
  
  const perm = await Notification.requestPermission();
  setPermission(perm);
  if (perm !== "granted") return;
  
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
   userVisibleOnly: true,
   applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });
  setSubscription(sub);
  // Send sub to backend to store
  return sub;
 };
 
 const unsubscribe = async () => {
  if (!subscription) return;
  await subscription.unsubscribe();
  setSubscription(null);
 };
 
 return { permission, subscription, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string) {
 const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
 const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
 const rawData = window.atob(base64);
 return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}