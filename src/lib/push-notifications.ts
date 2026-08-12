import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

export const registerPushNotifications = async (userId: string) => {
  if (Capacitor.getPlatform() === 'web') {
    console.log('Push notifications are not supported on web platform for now.');
    return;
  }

  let permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== 'granted') {
    console.error('Push notification permission denied.');
    return;
  }

  await PushNotifications.register();

  PushNotifications.addListener('registration', async (token) => {
    console.log('Push registration success, token: ' + token.value);
    
    // Save token to Supabase
    const { error } = await supabase
      .from('device_tokens')
      .upsert({
        user_id: userId,
        token: token.value,
        platform: Capacitor.getPlatform(),
      }, { onConflict: 'token' });

    if (error) {
      console.error('Error saving device token:', error);
    }
  });

  PushNotifications.addListener('registrationError', (error: any) => {
    console.error('Error on registration: ' + JSON.stringify(error));
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received: ' + JSON.stringify(notification));
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Push action performed: ' + JSON.stringify(notification));
    const data = notification.notification.data;
    if (data.url) {
      // Redirect to specific URL if provided
      window.location.href = data.url;
    }
  });
};
