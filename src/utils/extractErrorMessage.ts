/** Extracts a user-facing message from RTK Query / API error responses. */
export const extractErrorMessage = (response: any): string => {
  try {
    const data = response?.data ?? response?.error?.data ?? null;
    const rawMessage =
      (typeof data === 'string' ? data : null) ??
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
