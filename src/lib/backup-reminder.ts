import * as Notifications from 'expo-notifications';

import { nextMorning } from './morning';

const ID = 'kip.backup-reminder';
// High importance: shows as a banner. Android never raises an existing channel's importance, so changing it needs a new id.
const CHANNEL = 'backup-reminders';
export const BACKUP_ROUTE = '/settings/backup';

// Without a handler, a reminder that fires while Kip is open is dropped, and it never comes back.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

/** One pending reminder at most: scheduling again under the same id replaces it. */
export async function remindBackup() {
  await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Backup reminders', importance: Notifications.AndroidImportance.HIGH });
  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    // Shows on the lock screen: never name a login here.
    content: { title: 'Time for a backup', body: 'You have changes in Kip that aren’t backed up yet.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: nextMorning(new Date()), channelId: CHANNEL },
  });
}

export const cancelBackupReminder = () => Notifications.cancelScheduledNotificationAsync(ID);

/** True when the reminder notification opened Kip or was tapped. */
export const isBackupReminder = (r: Notifications.NotificationResponse | null) => r?.notification.request.identifier === ID;
