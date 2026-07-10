import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import webpush from "npm:web-push";
import { createClient } from "npm:@supabase/supabase-js";

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

    let subscriptions = [];
    
    if (targetUserId === 'ALL_OWNERS') {
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

    if (!vapidPublic || !vapidPrivate) {
      throw new Error('VAPID keys are missing from Edge Function secrets.');
    }

    webpush.setVapidDetails(
      'mailto:admin@kyntrix.com',
      vapidPublic,
      vapidPrivate
    );

    const payload = JSON.stringify({
      title: title || 'New Notification',
      body: body || 'You have a new update in Runb-cash.',
      url: url || '/'
    });

    const sendPromises = subscriptions.map(sub => 
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        },
        payload
      ).catch(e => {
        console.error('Failed to send to endpoint:', sub.endpoint, e);
        // If gone (410), we could delete the subscription from the DB
      })
    );

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true, count: subscriptions.length }), {
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
