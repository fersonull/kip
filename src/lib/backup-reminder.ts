import * as Notifications from 'expo-notifications';

import { reminderDates, TIMES } from './morning';

const ID = 'kip.backup-reminder';
const ids = Array.from({ length: TIMES }, (_, i) => `${ID}.${i}`);
// High importance: shows as a banner. Android never raises an existing channel's importance, so changing it needs a new id.
const CHANNEL = 'backup-reminders';
export const BACKUP_ROUTE = '/settings/backup';

// Without a handler, a reminder that fires while Kip is open is dropped, and it never comes back.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

/** Next morning, then every few days until a backup. Same ids each time, so a new change restarts the series. */
// ponytail: an ignored series can stack up to TIMES copies in the shade; Kip can't run code when one fires to clear the last.
export async function remindBackup() {
  await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Backup reminders', importance: Notifications.AndroidImportance.HIGH });
  for (const [i, date] of reminderDates(new Date()).entries()) {
    await Notifications.scheduleNotificationAsync({
      identifier: ids[i],
      // Shows on the lock screen: never name a login here.
      content: { title: 'Time for a backup', body: 'You have changes in Kip that aren’t backed up yet.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL },
    });
  }
}

/** Stops the series and clears any reminder still sitting in the shade. */
export async function cancelBackupReminder() {
  for (const id of ids) {
    await Notifications.cancelScheduledNotificationAsync(id);
    await Notifications.dismissNotificationAsync(id);
  }
}

/** True when a reminder opened Kip or was tapped. */
export const isBackupReminder = (r: Notifications.NotificationResponse | null) => !!r?.notification.request.identifier.startsWith(ID);
