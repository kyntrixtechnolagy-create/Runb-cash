import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import webpush from "npm:web-push";
import { createClient } from "npm:@supabase/supabase-js";
import { initializeApp, cert, getApps } from "npm:firebase-admin/app";
import { getMessaging } from "npm:firebase-admin/messaging";

// Initialize Firebase Admin if Service Account is provided
let firebaseInitialized = false;
let firebaseInitError = 'None';
let serviceAccountPreview = 'Not Set';
try {
  const serviceAccountStr = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
  if (serviceAccountStr) {
    serviceAccountPreview = serviceAccountStr.substring(0, 15) + '...';
    const serviceAccount = JSON.parse(serviceAccountStr);
    
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    }
    firebaseInitialized = true;
  } else {
    firebaseInitError = 'FIREBASE_SERVICE_ACCOUNT is missing or empty in Deno.env';
  }
} catch (error: any) {
  firebaseInitError = error.message || String(error);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' 
      } 
    });
  }

  try {
    const { targetUserId, title, body, url } = await req.json();

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'Missing targetUserId' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let subscriptions: any[] = [];
    if (targetUserId === 'ALL_TOKENS') {
      const { data } = await supabase.from('push_subscriptions').select('*');
      subscriptions = data || [];
    } else if (targetUserId === 'ALL_OWNERS') {
      // Find all owners
      const { data: owners } = await supabase.from('users').select('id').eq('role', 'OWNER');
      if (owners && owners.length > 0) {
        const ownerIds = owners.map(o => o.id);
        const { data: subs } = await supabase.from('push_subscriptions').select('*').in('user_id', ownerIds);
        subscriptions = subs || [];
      }
    } else {
      const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('user_id', targetUserId);
      subscriptions = subs || [];
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscriptions found for user' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY');

    if (vapidPublic && vapidPrivate) {
      webpush.setVapidDetails(
        'mailto:admin@kyntrix.com',
        vapidPublic,
        vapidPrivate
      );
    }

    const payload = JSON.stringify({
      title: title || 'New Notification',
      body: body || 'You have a new update in Runb-cash.',
      url: url || '/'
    });

    const sendPromises = subscriptions.map(sub => {
      if (sub.auth === 'native') {
        // Send via Firebase Cloud Messaging for Capacitor native apps
        if (!firebaseInitialized) {
          console.error("Firebase Admin not initialized. Please set FIREBASE_SERVICE_ACCOUNT in edge function secrets.");
          return Promise.resolve();
        }
        
        return getMessaging().send({
          token: sub.endpoint,
          notification: {
            title: title || 'New Notification',
            body: body || 'You have a new update in Runb-cash.'
          },
          data: {
            url: url || '/'
          }
        })
        .then((res: any) => ({ endpoint: sub.endpoint, success: true, response: res }))
        .catch((e: any) => ({ endpoint: sub.endpoint, success: false, error: e.message }));
      } else {
        // Send via Web Push for Browsers
        if (!vapidPublic || !vapidPrivate) {
          console.error('VAPID keys are missing for web push');
          return Promise.resolve();
        }
        return webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          payload
        ).catch(e => {
          console.error('Failed to send to web endpoint:', sub.endpoint, e);
          // If gone (410), we could delete the subscription from the DB
        });
      }
    });

    const results = await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true, count: subscriptions.length, firebaseInitialized, firebaseInitError, serviceAccountPreview, results }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
