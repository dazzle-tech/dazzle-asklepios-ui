type ApiErrorPayload = {
  detail?: string;
  message?: string;
  title?: string;
  properties?: {
    message?: string;
  };
  errors?: unknown[];
};

const parseEmbeddedWaseelPayload = (text: string): ApiErrorPayload | null => {
  if (!text?.trim()) {
    return null;
  }

  const candidates: string[] = [];

  const jsonStart = text.indexOf('{"');
  if (jsonStart >= 0) {
    let jsonPart = text.slice(jsonStart).trim();
    if (jsonPart.endsWith('"')) {
      jsonPart = jsonPart.slice(0, -1);
    }
    candidates.push(jsonPart.replace(/\\"/g, '"'));
  }

  candidates.push(text.replace(/\\"/g, '"'));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as ApiErrorPayload;
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch {
      // try next candidate
    }
  }

  return null;
};

const firstWaseelError = (payload: ApiErrorPayload | null): string => {
  if (!payload) {
    return '';
  }

  if (Array.isArray(payload.errors)) {
    for (const item of payload.errors) {
      if (typeof item === 'string' && item.trim()) {
        return item.trim();
      }
    }
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message.trim();
  }

  return '';
};

/** Extracts a readable Waseel message from API / Spring error payloads. */
export const extractWaseelErrorMessage = (response: any): string => {
  try {
    const data = (response?.data ?? response?.error?.data ?? null) as ApiErrorPayload | string | null;

    if (typeof data === 'string') {
      const embedded = firstWaseelError(parseEmbeddedWaseelPayload(data));
      if (embedded) {
        return embedded;
      }

      return data.trim();
    }

    const directMessage =
      data?.properties?.message ??
      (typeof data?.message === 'string' && !data.message.startsWith('error.http.')
        ? data.message
        : '');

    if (typeof directMessage === 'string' && directMessage.trim()) {
      return directMessage.replace(/^error\./i, '').trim();
    }

    const detail = data?.detail ?? data?.title;
    if (typeof detail === 'string' && detail.trim()) {
      const embedded = firstWaseelError(parseEmbeddedWaseelPayload(detail));
      if (embedded) {
        return embedded;
      }

      if (!detail.startsWith('404 Not Found on POST request')) {
        return detail.trim();
      }
    }
  } catch {
    // ignore
  }

  return '';
};