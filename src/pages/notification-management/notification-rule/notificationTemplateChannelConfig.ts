import { NotificationTemplateChannel } from '@/types/model-types-new';

export interface NotificationTemplateChannelFieldConfig {
  subject: boolean;
  title: boolean;
  body: boolean;
  toRecipientRule: boolean;
  ccRecipientRule: boolean;
  bccRecipientRule: boolean;
  phoneRecipientRule: boolean;
  requireSubject: boolean;
  requireTitle: boolean;
  requireBody: boolean;
  requireToRecipientRule: boolean;
  requirePhoneRecipientRule: boolean;
}

const CHANNEL_FIELD_CONFIG: Record<NotificationTemplateChannel, NotificationTemplateChannelFieldConfig> = {
  EMAIL: {
    subject: true,
    title: false,
    body: true,
    toRecipientRule: true,
    ccRecipientRule: true,
    bccRecipientRule: true,
    phoneRecipientRule: false,
    requireSubject: true,
    requireTitle: false,
    requireBody: true,
    requireToRecipientRule: true,
    requirePhoneRecipientRule: false,
  },
  SMS: {
    subject: false,
    title: false,
    body: true,
    toRecipientRule: false,
    ccRecipientRule: false,
    bccRecipientRule: false,
    phoneRecipientRule: true,
    requireSubject: false,
    requireTitle: false,
    requireBody: true,
    requireToRecipientRule: false,
    requirePhoneRecipientRule: true,
  },
  WHATSAPP: {
    subject: true,
    title: false,
    body: false,
    toRecipientRule: false,
    ccRecipientRule: false,
    bccRecipientRule: false,
    phoneRecipientRule: true,
    requireSubject: false,
    requireTitle: false,
    requireBody: false,
    requireToRecipientRule: false,
    requirePhoneRecipientRule: true,
  },
  IN_APP: {
    subject: false,
    title: true,
    body: true,
    toRecipientRule: false,
    ccRecipientRule: false,
    bccRecipientRule: false,
    phoneRecipientRule: false,
    requireSubject: false,
    requireTitle: true,
    requireBody: true,
    requireToRecipientRule: false,
    requirePhoneRecipientRule: false,
  },
};

export const getNotificationTemplateChannelConfig = (
  channel: NotificationTemplateChannel
): NotificationTemplateChannelFieldConfig => CHANNEL_FIELD_CONFIG[channel];
