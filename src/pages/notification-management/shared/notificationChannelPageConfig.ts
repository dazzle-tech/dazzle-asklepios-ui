import { NotificationChannel } from '@/types/model-types-new';

export interface NotificationChannelPageConfig {
  channel: NotificationChannel;
  pageCode: string;
  pageTitle: string;
  modalTitle: string;
  showRecipientEmailFilter: boolean;
  showRecipientPhoneFilter: boolean;
  showSubjectColumn: boolean;
  showTitleColumn: boolean;
  showEmailColumns: boolean;
  showPhoneColumns: boolean;
  bodyPreviewAsHtml: boolean;
  bodyViewAsHtml: boolean;
}

export const NOTIFICATION_CHANNEL_PAGE_CONFIG: Record<
  NotificationChannel,
  NotificationChannelPageConfig
> = {
  EMAIL: {
    channel: 'EMAIL',
    pageCode: 'Email_Notification',
    pageTitle: 'Email Notification',
    modalTitle: 'Email Notification Details',
    showRecipientEmailFilter: true,
    showRecipientPhoneFilter: false,
    showSubjectColumn: true,
    showTitleColumn: false,
    showEmailColumns: true,
    showPhoneColumns: false,
    bodyPreviewAsHtml: true,
    bodyViewAsHtml: true,
  },
  SMS: {
    channel: 'SMS',
    pageCode: 'SMS_Notification',
    pageTitle: 'SMS Notification',
    modalTitle: 'SMS Notification Details',
    showRecipientEmailFilter: false,
    showRecipientPhoneFilter: true,
    showSubjectColumn: false,
    showTitleColumn: false,
    showEmailColumns: false,
    showPhoneColumns: true,
    bodyPreviewAsHtml: false,
    bodyViewAsHtml: false,
  },
  IN_APP: {
    channel: 'IN_APP',
    pageCode: 'In_App_Notification',
    pageTitle: 'In-App Notification',
    modalTitle: 'In-App Notification Details',
    showRecipientEmailFilter: false,
    showRecipientPhoneFilter: false,
    showSubjectColumn: false,
    showTitleColumn: true,
    showEmailColumns: false,
    showPhoneColumns: false,
    bodyPreviewAsHtml: false,
    bodyViewAsHtml: false,
  },
  WHATSAPP: {
    channel: 'WHATSAPP',
    pageCode: 'WhatsApp_Notification',
    pageTitle: 'WhatsApp Notification',
    modalTitle: 'WhatsApp Notification Details',
    showRecipientEmailFilter: false,
    showRecipientPhoneFilter: true,
    showSubjectColumn: true,
    showTitleColumn: false,
    showEmailColumns: false,
    showPhoneColumns: true,
    bodyPreviewAsHtml: false,
    bodyViewAsHtml: false,
  },
};

export const getNotificationChannelPageConfig = (channel: NotificationChannel) =>
  NOTIFICATION_CHANNEL_PAGE_CONFIG[channel];
