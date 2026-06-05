// =============================================================================
// Push notification setup using expo-notifications (replaces Firebase FCM)
// =============================================================================

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(
  userId: string
): Promise<string | undefined> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return undefined;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  await supabase
    .from('user_settings')
    .update({ fcm_token: token })
    .eq('user_id', userId);

  return token;
}

export function setupNotificationHandlers(): void {
  Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification);
  });

  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification tapped:', response);
  });
}
