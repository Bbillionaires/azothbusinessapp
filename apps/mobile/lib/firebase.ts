// =============================================================================
// Firebase Cloud Messaging — push notification setup
// =============================================================================

import messaging from '@react-native-firebase/messaging';
import { supabase } from './supabase';

/**
 * Request FCM permission, retrieve the device token, and persist it to the
 * user_settings row so the backend can target this device.
 *
 * Returns the FCM token, or undefined if permission was denied.
 */
export async function registerForPushNotifications(
  userId: string
): Promise<string | undefined> {
  const authStatus = await messaging().requestPermission();

  if (
    authStatus !== messaging.AuthorizationStatus.AUTHORIZED &&
    authStatus !== messaging.AuthorizationStatus.PROVISIONAL
  ) {
    return undefined;
  }

  const token = await messaging().getToken();

  // Persist the token so edge functions can send targeted notifications
  await supabase
    .from('user_settings')
    .update({ fcm_token: token })
    .eq('user_id', userId);

  return token;
}

/**
 * Register foreground and background message handlers.
 * Call once near app startup (e.g. inside the root _layout).
 */
export function setupNotificationHandlers(): void {
  // Foreground handler — app is open and running
  messaging().onMessage(async (remoteMessage) => {
    console.log('FCM foreground:', remoteMessage);
  });

  // Background / quit handler — app is in the background or closed
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('FCM background:', remoteMessage);
  });
}
