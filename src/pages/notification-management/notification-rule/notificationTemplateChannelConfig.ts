import { NotificationTemplateChannel } from '@/types/model-types-new';

export interface NotificationTemplateChannelFieldConfig {
  subject: boolean;
  title: boolean;
  body: boolean;
  toRecipientRule: boolean;
  ccRecipientRule: boolean;
  bccRecipientRule: boolean;
  phoneRecipientRule: boolean;
  whatsappTemplateName: boolean;
  whatsappLanguageCode: boolean;
  whatsappParameters: boolean;
  whatsappTemplateCategory: boolean;
  whatsappMetaTemplateFooter: boolean;
  whatsappMetaTemplateButtons: boolean;
  whatsappHeaderType: boolean;
  whatsappMetaTemplateId: boolean;
  whatsappTemplateStatus: boolean;
  whatsappTemplateVersion: boolean;
  requireSubject: boolean;
  requireTitle: boolean;
  requireBody: boolean;
  requireToRecipientRule: boolean;
  requirePhoneRecipientRule: boolean;
  requireWhatsappTemplateName: boolean;
  requireWhatsappLanguageCode: boolean;
  requireWhatsappTemplateCategory: boolean;
}

const NO_WHATSAPP_FIELDS = {
  whatsappTemplateName: false,
  whatsappLanguageCode: false,
  whatsappParameters: false,
  whatsappTemplateCategory: false,
  whatsappMetaTemplateFooter: false,
  whatsappMetaTemplateButtons: false,
  whatsappHeaderType: false,
  whatsappMetaTemplateId: false,
  whatsappTemplateStatus: false,
  whatsappTemplateVersion: false,
  requireWhatsappTemplateName: false,
  requireWhatsappLanguageCode: false,
  requireWhatsappTemplateCategory: false,
};

const WHATSAPP_FIELDS = {
  whatsappTemplateName: true,
  whatsappLanguageCode: true,
  whatsappParameters: true,
  whatsappTemplateCategory: true,
  whatsappMetaTemplateFooter: true,
  whatsappMetaTemplateButtons: true,
  whatsappHeaderType: true,
  whatsappMetaTemplateId: true,
  whatsappTemplateStatus: true,
  whatsappTemplateVersion: true,
  requireWhatsappTemplateName: true,
  requireWhatsappLanguageCode: true,
  requireWhatsappTemplateCategory: true,
};

const CHANNEL_FIELD_CONFIG: Record<NotificationTemplateChannel, NotificationTemplateChannelFieldConfig> = {
  EMAIL: {
    subject: true,
    title: false,
    body: true,
    toRecipientRule: true,
    ccRecipientRule: true,
    bccRecipientRule: true,
    phoneRecipientRule: false,
    ...NO_WHATSAPP_FIELDS,
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
    ...NO_WHATSAPP_FIELDS,
    requireSubject: false,
    requireTitle: false,
    requireBody: true,
    requireToRecipientRule: false,
    requirePhoneRecipientRule: true,
  },
  WHATSAPP: {
    subject: true,
    title: false,
    body: true,
    toRecipientRule: false,
    ccRecipientRule: false,
    bccRecipientRule: false,
    phoneRecipientRule: true,
    ...WHATSAPP_FIELDS,
    requireSubject: false,
    requireTitle: false,
    requireBody: true,
    requireToRecipientRule: false,
    requirePhoneRecipientRule: true,
  },
  IN_APP: {
    subject: false,
    title: true,
    body: true,
    toRecipientRule: true,
    ccRecipientRule: false,
    bccRecipientRule: false,
    phoneRecipientRule: false,
    ...NO_WHATSAPP_FIELDS,
    requireSubject: false,
    requireTitle: true,
    requireBody: true,
    requireToRecipientRule: true,
    requirePhoneRecipientRule: false,
  },
  PUSH: {
    subject: false,
    title: true,
    body: true,
    toRecipientRule: true,
    ccRecipientRule: false,
    bccRecipientRule: false,
    phoneRecipientRule: false,
    ...NO_WHATSAPP_FIELDS,
    requireSubject: false,
    requireTitle: true,
    requireBody: true,
    requireToRecipientRule: true,
    requirePhoneRecipientRule: false,
  },
};

export const getNotificationTemplateChannelConfig = (
  channel: NotificationTemplateChannel
): NotificationTemplateChannelFieldConfig => CHANNEL_FIELD_CONFIG[channel];
