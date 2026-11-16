import { useCallback, useEffect, useRef, useState } from 'react';

/** Shared across tabs so activity in one tab keeps the others alive. */
export const LAST_ACTIVITY_KEY = 'lastActivity';

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'wheel',
  'scroll',
  'touchstart'
];

/** Avoid hammering localStorage (and cross-tab storage events) on every mouse move. */
const WRITE_THROTTLE_MS = 5000;
const CHECK_INTERVAL_MS = 1000;

const readLastActivity = (): number => {
  const value = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
  return Number.isFinite(value) && value > 0 ? value : 0;
};

export const markActivity = () => {
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
};

interface UseIdleTimeoutOptions {
  /** Only track while a user is signed in. */
  enabled: boolean;
  timeoutMs: number;
  warningMs: number;
  onTimeout: () => void;
}

/**
 * Tracks user inactivity. Returns whether the warning should show, the seconds
 * left before timeout, and `stayActive` to dismiss the warning and reset the timer.
 */
export const useIdleTimeout = ({ enabled, timeoutMs, warningMs, onTimeout }: UseIdleTimeoutOptions) => {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const lastWriteRef = useRef(0);
  const warningRef = useRef(false);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const stayActive = useCallback(() => {
    markActivity();
    lastWriteRef.current = Date.now();
    warningRef.current = false;
    setShowWarning(false);
  }, []);

  useEffect(() => {
    if (!enabled || timeoutMs <= 0) {
      warningRef.current = false;
      setShowWarning(false);
      return;
    }

    // First run in this tab with no recorded activity: start counting from now.
    if (!readLastActivity()) markActivity();

    const handleActivity = () => {
      // While the warning is open, only the explicit "Stay signed in" button counts.
      if (warningRef.current) return;
      const now = Date.now();
      if (now - lastWriteRef.current < WRITE_THROTTLE_MS) return;
      lastWriteRef.current = now;
      markActivity();
    };

    const check = () => {
      const remaining = timeoutMs - (Date.now() - readLastActivity());
      if (remaining <= 0) {
        warningRef.current = false;
        setShowWarning(false);
        onTimeoutRef.current();
        return;
      }
      const inWarning = remaining <= warningMs;
      warningRef.current = inWarning;
      setShowWarning(inWarning);
      setSecondsLeft(Math.ceil(remaining / 1000));
    };

    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));
    const interval = window.setInterval(check, CHECK_INTERVAL_MS);
    // Re-check immediately when the tab becomes visible again (e.g. after sleep).
    document.addEventListener('visibilitychange', check);
    check();

    return () => {
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, handleActivity));
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', check);
    };
  }, [enabled, timeoutMs, warningMs]);

  return { showWarning, secondsLeft, stayActive };
};

/** How often a kept-alive page refreshes the shared activity timestamp. */
const KEEP_ALIVE_INTERVAL_MS = 10000;

/**
 * Keeps the session from timing out for inactivity while the calling page is
 * mounted, e.g. wall-mounted monitoring boards nobody touches.
 *
 * It refreshes the shared `lastActivity` timestamp, so every open tab of this
 * browser stays signed in too (they all share one token). On unmount it marks
 * activity once more, so leaving the page starts a fresh idle countdown instead
 * of logging the user out immediately. Token expiry still applies.
 */
export const useKeepSessionAlive = () => {
  useEffect(() => {
    markActivity();
    const interval = window.setInterval(markActivity, KEEP_ALIVE_INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
      markActivity();
    };
  }, []);
};
