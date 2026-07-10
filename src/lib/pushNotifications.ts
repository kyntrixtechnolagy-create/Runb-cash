import { supabase } from './supabase';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const subscribeToPushNotifications = async (userId: string): Promise<{success: boolean, error?: string}> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported in this browser.');
    return { success: false, error: 'Browser does not support Web Push' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        console.warn('VAPID public key is missing.');
        return { success: false, error: 'VAPID public key missing from Env Vars' };
      }
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
    }

    // Save to Supabase
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth') as ArrayBuffer))),
          p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh') as ArrayBuffer)))
        },
        { onConflict: 'endpoint' }
      );

    if (error) {
      console.error('Error saving push subscription to Supabase:', error);
      return { success: false, error: 'Database save failed: ' + error.message };
    }
    
    return { success: true };
  } catch (err: any) {
    console.error('Failed to subscribe to push notifications:', err);
    return { success: false, error: err.message || 'Subscription failed' };
  }
};
