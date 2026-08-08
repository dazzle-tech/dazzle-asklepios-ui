/** Extracts a user-facing message from RTK Query / API error responses. */
import { extractWaseelErrorMessage } from './extractWaseelErrorMessage';

export { extractWaseelErrorMessage } from './extractWaseelErrorMessage';

export const extractErrorMessage = (response: any): string => {
  try {
    const waseelMessage = extractWaseelErrorMessage(response);
    if (waseelMessage) {
      return waseelMessage;
    }

    const data = response?.data ?? response?.error?.data ?? null;
    const rawMessage =
      (typeof data === 'string' ? data : null) ??
      data?.properties?.message ??
      data?.message ??
      data?.detail ??
      data?.title ??
      response?.error?.message ??
      response?.message ??
      '';

    return typeof rawMessage === 'string' ? rawMessage.replace(/^error\./i, '').trim() : '';
  } catch {
    return '';
  }
};