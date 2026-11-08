import { logout, setSessionExpired } from '@/reducers/authSlice';

export const SESSION_EXPIRED_MESSAGE = 'Your session has expired, please log in again';

/** Reads `exp` (seconds) from a JWT. Returns null when the token can't be decoded. */
export const getTokenExpiryMs = (token: string | null | undefined): number | null => {
  try {
    const payload = token?.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '='));
    const exp = JSON.parse(json)?.exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
};

/** Cross-tab signal: other tabs show the same screen instead of silently redirecting. */
export const SESSION_EXPIRED_EVENT_KEY = 'session_expired_event';

/**
 * Clears the token right away (so nothing else can be saved with it) and shows the
 * Session Expired screen; the user leaves it with "Go to login".
 * Safe to call many times (e.g. several parallel requests all getting 401).
 */
export const expireSession =
  (message: string = SESSION_EXPIRED_MESSAGE) =>
  (dispatch: (action: any) => any, getState: () => any) => {
    if (getState()?.auth?.sessionExpiredBackdrop) return; // already showing
    // Set before removing the token so other tabs know why it disappeared.
    localStorage.setItem(SESSION_EXPIRED_EVENT_KEY, JSON.stringify({ message, at: Date.now() }));
    dispatch(setSessionExpired(message));
    dispatch(logout());
  };
