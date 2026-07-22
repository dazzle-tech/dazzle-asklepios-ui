import { NotificationTemplateChannel, RecipientRule, WhatsAppButton } from '@/types/model-types-new';
import { formatEnumString } from '@/utils';

export const RECIPIENT_RULE_VALUES: RecipientRule[] = [
  'PATIENT_EMAIL',
  'PATIENT_PHONE',
  'PRACTITIONER_EMAIL',
  'PRACTITIONER_PHONE',
  'PRACTITIONER_USER',
  'DEPARTMENT_USERS',
  'CURRENT_USER',
  'CURRENT_USER_PHONE',
  'CREATED_BY_USER',
  'CREATED_BY_USER_PHONE',
  'DATA',
  'STATIC',
];

export const CUSTOM_RECIPIENT_RULE_TYPES: RecipientRule[] = ['DATA', 'STATIC'];

export const PREDEFINED_RECIPIENT_RULES = RECIPIENT_RULE_VALUES.filter(
  (rule): rule is Exclude<RecipientRule, 'DATA' | 'STATIC'> =>
    rule !== 'DATA' && rule !== 'STATIC'
);

const ALLOWED_RECIPIENT_RULES = new Set<string>(PREDEFINED_RECIPIENT_RULES);

export const RECIPIENT_RULE_LABEL_OVERRIDES: Record<string, string> = {
  DATA: 'Data Field (DATA:)',
  STATIC: 'Static Value (STATIC:)',
};

export const buildRecipientRuleTypeOptions = (
  values: string[] = RECIPIENT_RULE_VALUES
): { label: string; value: string }[] =>
  values.map(rule => ({
    value: rule,
    label: RECIPIENT_RULE_LABEL_OVERRIDES[rule] ?? rule.replace(/_/g, ' '),
  }));

export const isCustomRecipientRuleType = (ruleType: string): boolean =>
  CUSTOM_RECIPIENT_RULE_TYPES.includes(ruleType as RecipientRule);

export const formatRecipientRulePart = (part: string): string => {
  const value = part.trim();
  if (!value) return '';

  if (value.startsWith('DATA:')) {
    return `${formatEnumString('DATA')}: ${value.slice('DATA:'.length).trim()}`;
  }

  if (value.startsWith('STATIC:')) {
    return `${formatEnumString('STATIC')}: ${value.slice('STATIC:'.length).trim()}`;
  }

  return formatEnumString(value);
};

export const formatRecipientRuleDisplay = (rule?: string | null): string => {
  if (!rule?.trim()) return '';

  return rule
    .split(',')
    .map(formatRecipientRulePart)
    .filter(Boolean)
    .join(', ');
};

const isValidRecipientRulePart = (value: string): boolean => {
  if (ALLOWED_RECIPIENT_RULES.has(value)) return true;

  if (value.startsWith('DATA:')) {
    return value.slice('DATA:'.length).trim().length > 0;
  }

  if (value.startsWith('STATIC:')) {
    return value.slice('STATIC:'.length).trim().length > 0;
  }

  return false;
};

export const validateRecipientRuleFormat = (rule?: string | null): string | null => {
  if (!rule?.trim()) return null;

  for (const part of rule.split(',')) {
    const value = part.trim();
    if (value.startsWith('DATA:') && !value.slice('DATA:'.length).trim()) {
      return 'DATA recipient rule requires a field name';
    }

    if (value.startsWith('STATIC:') && !value.slice('STATIC:'.length).trim()) {
      return 'STATIC recipient rule requires a value';
    }

    if (!isValidRecipientRulePart(value)) {
      return `Unsupported recipient rule: ${value}`;
    }
  }

  return null;
};

export const stripHtmlBody = (html?: string | null): string =>
  html?.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim() ?? '';

export const isHtmlBodyEmpty = (html?: string | null): boolean => !stripHtmlBody(html);

export const parseWhatsappParameters = (
  value?: string | string[] | null
): string[] => {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }

  if (!value?.trim()) {
    return [];
  }

  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
};

export const formatWhatsappParameters = (value?: string[] | null): string =>
  (value ?? []).join(', ');

export const formatWhatsappButtons = (
  buttons?: {
    type?: string | null;
    text?: string | null;
    url?: string | null;
    phoneNumber?: string | null;
    couponCode?: string | null;
    flowId?: string | null;
  }[] | null
): string => {
  if (!buttons?.length) return '';

  return buttons
    .map(button => {
      const type = button.type ? formatEnumString(button.type) : 'Button';
      const text = button.text?.trim();
      const details = [button.url, button.phoneNumber, button.couponCode, button.flowId]
        .map(value => value?.trim())
        .filter(Boolean)
        .join(' | ');
      if (text && details) return `${type}: ${text} (${details})`;
      if (text) return `${type}: ${text}`;
      if (details) return `${type}: ${details}`;
      return type;
    })
    .filter(Boolean)
    .join(', ');
};

export const sanitizeWhatsappTemplateNameInput = (value?: string | null): string => {
  if (!value) return '';

  return value
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
};

export const normalizeWhatsappTemplateName = (value?: string | null): string => {
  if (!value) return '';

  return sanitizeWhatsappTemplateNameInput(value)
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const toOptionalString = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const toOptionalEnum = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeWhatsappButton = (button: WhatsAppButton): WhatsAppButton => ({
  type: toOptionalEnum(button.type),
  text: toOptionalString(button.text),
  url: toOptionalString(button.url),
  phoneNumber: toOptionalString(button.phoneNumber),
  couponCode: toOptionalString(button.couponCode),
  flowId: toOptionalString(button.flowId),
});

export const normalizeNotificationTemplatePayload = <
  T extends NotificationTemplateFormValues & {
    whatsappTemplateCategory?: string | null;
    whatsappHeaderType?: string | null;
    whatsappMetaTemplateFooter?: string | null;
    whatsappMetaTemplateButtons?: WhatsAppButton[] | null;
  },
>(
  dto: T
): T => ({
  ...dto,
  subject: toOptionalString(dto.subject),
  title: toOptionalString(dto.title),
  body: toOptionalString(dto.body),
  toRecipientRule: toOptionalString(dto.toRecipientRule),
  ccRecipientRule: toOptionalString(dto.ccRecipientRule),
  bccRecipientRule: toOptionalString(dto.bccRecipientRule),
  phoneRecipientRule: toOptionalString(dto.phoneRecipientRule),
  whatsappLanguageCode: toOptionalEnum(dto.whatsappLanguageCode),
  whatsappTemplateCategory: toOptionalEnum(dto.whatsappTemplateCategory),
  whatsappHeaderType: toOptionalEnum(dto.whatsappHeaderType),
  whatsappMetaTemplateFooter: toOptionalString(dto.whatsappMetaTemplateFooter),
  whatsappMetaTemplateButtons: dto.whatsappMetaTemplateButtons?.length
    ? dto.whatsappMetaTemplateButtons.map(normalizeWhatsappButton)
    : null,
});

export interface NotificationTemplateFormValues {
  language?: string | null;
  subject?: string | null;
  title?: string | null;
  body?: string | null;
  toRecipientRule?: string | null;
  ccRecipientRule?: string | null;
  bccRecipientRule?: string | null;
  phoneRecipientRule?: string | null;
  whatsappTemplateName?: string | null;
  whatsappLanguageCode?: string | null;
  whatsappParameters?: string[] | null;
  whatsappTemplateCategory?: string | null;
  whatsappHeaderType?: string | null;
  whatsappMetaTemplateFooter?: string | null;
  whatsappMetaTemplateButtons?: WhatsAppButton[] | null;
}

export const validateNotificationTemplate = (
  channel: NotificationTemplateChannel,
  dto: NotificationTemplateFormValues
): string[] => {
  const errors: string[] = [];

  if (!dto.language?.trim()) {
    errors.push('Language can’t be empty');
  }

  if (channel === 'EMAIL') {
    if (!dto.toRecipientRule?.trim()) {
      errors.push('Email to recipient rule is required');
    }
    if (!dto.subject?.trim()) {
      errors.push('Email subject is required');
    }
    if (isHtmlBodyEmpty(dto.body)) {
      errors.push('Email body is required');
    }
  }

  if (channel === 'SMS' || channel === 'WHATSAPP') {
    if (!dto.phoneRecipientRule?.trim()) {
      errors.push('Phone recipient rule is required for SMS/WhatsApp');
    }
  }

  if (channel === 'WHATSAPP') {
    if (!dto.whatsappTemplateName?.trim()) {
      errors.push('WhatsApp template name is required');
    } else if (!/^[a-z0-9_]+$/.test(dto.whatsappTemplateName.trim())) {
      errors.push('WhatsApp template name must contain only lowercase letters, numbers, and underscores');
    }
    if (!dto.whatsappLanguageCode?.trim()) {
      errors.push('WhatsApp language code is required');
    }
    if (!dto.body?.trim()) {
      errors.push('WhatsApp body is required');
    }
  }

  if (channel === 'SMS') {
    if (!dto.body?.trim()) {
      errors.push('SMS body is required');
    }
  }

  if (channel === 'IN_APP') {
    if (!dto.toRecipientRule?.trim()) {
      errors.push('In-app to recipient rule is required');
    }
    if (!dto.title?.trim()) {
      errors.push('Notification title is required');
    }
    if (!dto.body?.trim()) {
      errors.push('Notification body is required');
    }
  }

  for (const rule of [
    dto.toRecipientRule,
    dto.ccRecipientRule,
    dto.bccRecipientRule,
    dto.phoneRecipientRule,
  ]) {
    const formatError = validateRecipientRuleFormat(rule);
    if (formatError) {
      errors.push(formatError);
    }
  }

  return errors;
};
