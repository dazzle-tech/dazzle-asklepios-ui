import { NotificationSearchDTO } from '@/types/model-types-new';

export type NotificationFiltersState = {
  code: string;
  status: string;
  priority: string;
  language: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  providerStatus: string;
  providerMessageId: string;
  dateFrom: Date | null;
  dateTo: Date | null;
};

export const getToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const getInitialFiltersState = (): NotificationFiltersState => {
  const today = getToday();
  return {
    code: '',
    status: '',
    priority: '',
    language: '',
    recipientName: '',
    recipientEmail: '',
    recipientPhone: '',
    providerStatus: '',
    providerMessageId: '',
    dateFrom: new Date(today),
    dateTo: new Date(today),
  };
};

export const toInstantParam = (
  value: Date | string | null | undefined,
  endOfDay = false
): string | undefined => {
  if (!value) return undefined;

  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date.toISOString();
};

export const buildSearchParamsFromFilters = (
  obj: NotificationFiltersState
): NotificationSearchDTO => {
  const cleaned: NotificationSearchDTO = {};

  if (obj.code.trim()) cleaned.code = obj.code.trim();
  if (obj.status) cleaned.status = obj.status as NotificationSearchDTO['status'];
  if (obj.priority) cleaned.priority = obj.priority as NotificationSearchDTO['priority'];
  if (obj.language.trim()) cleaned.language = obj.language.trim();
  if (obj.recipientName.trim()) cleaned.recipientName = obj.recipientName.trim();
  if (obj.recipientEmail.trim()) cleaned.recipientEmail = obj.recipientEmail.trim();
  if (obj.recipientPhone.trim()) cleaned.recipientPhone = obj.recipientPhone.trim();
  if (obj.providerStatus.trim()) cleaned.providerStatus = obj.providerStatus.trim();
  if (obj.providerMessageId.trim()) cleaned.providerMessageId = obj.providerMessageId.trim();

  const dateFrom = toInstantParam(obj.dateFrom);
  const dateTo = toInstantParam(obj.dateTo, true);
  if (dateFrom) cleaned.dateFrom = dateFrom;
  if (dateTo) cleaned.dateTo = dateTo;

  return cleaned;
};

export const formatEmailList = (emails?: string[] | null, fallback?: string | null) => {
  if (emails?.length) return emails.join(', ');
  return fallback || '-';
};

export const formatPhoneValue = (row: {
  toPhone?: string | null;
  recipientPhone?: string | null;
}) => row.toPhone || row.recipientPhone || '-';

export const getBodyPreview = (body?: string | null, asHtml = false) => {
  const value = body?.trim() ?? '';
  if (!value) return '';
  if (!asHtml) return value;
  return value.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
};
