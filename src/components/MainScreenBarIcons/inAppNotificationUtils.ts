import { InAppNotificationRecipientParams } from '@/services/notification-management/notificationService';
import { NotificationResponseVM, NotificationStatus } from '@/types/model-types-new';

export const getInAppRecipientFromUser = (
  user: { id?: number; key?: string | number; recipientType?: string | null } | null
): InAppNotificationRecipientParams | null => {
  const rawId = user?.id ?? user?.key;
  if (rawId == null || rawId === '') return null;

  const recipientId = Number(rawId);
  if (Number.isNaN(recipientId)) return null;

  return {
    recipientType: String(user?.recipientType ?? 'USER').toUpperCase(),
    recipientId,
  };
};

export const isUnreadInAppNotification = (status?: NotificationStatus | null): boolean =>
  Boolean(status) && status !== 'READ';

export const formatNotificationTimeAgo = (date?: string | Date | null): string => {
  if (!date) return '-';

  const timestamp = new Date(date).getTime();
  if (Number.isNaN(timestamp)) return '-';

  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return 'Just now';

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

export const getInAppNotificationBody = (notification: NotificationResponseVM): string => {
  const body = notification.body?.trim();
  if (!body) return '';

  return body.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
};

export const getInAppNotificationPreview = (notification: NotificationResponseVM): string => {
  if (notification.title?.trim()) return notification.title.trim();

  const body = getInAppNotificationBody(notification);
  if (body) return body;

  if (notification.code?.trim()) return notification.code.trim();
  return 'Notification';
};
