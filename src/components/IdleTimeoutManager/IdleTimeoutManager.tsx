import React, { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { logout } from '@/reducers/authSlice';
import { isPublicAuthFreePath } from '@/config/publicRoutes';
import { expireSession, getTokenExpiryMs } from '@/utils/sessionExpiry';
import MyModal from '@/components/MyModal/MyModal';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import Translate from '@/components/Translate';
import config from '../../../app-config';

const TOKEN_CHECK_INTERVAL_MS = 5000;

const IdleTimeoutManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAppSelector(state => state.auth.token);

  const timeoutMs = Math.max(0, Number(config.idleTimeoutMinutes) || 0) * 60 * 1000;
  // Never let the warning window exceed the timeout itself.
  const warningMs = Math.min(Math.max(0, Number(config.idleWarningSeconds) || 0) * 1000, timeoutMs);

  const enabled =
    !!token && location.pathname !== '/login' && !isPublicAuthFreePath(location.pathname);

  // Manual "Logout" from the warning dialog: no message needed.
  const handleLogout = useCallback(() => {
    dispatch(logout());
    // Tells other open tabs (via AuthGuard's storage listener) to log out too.
    localStorage.setItem('logout_event', Date.now().toString());
    navigate('/login', { replace: true });
  }, [dispatch, navigate]);

  const onTimeout = useCallback(
    () => dispatch(expireSession('You were logged out due to inactivity') as any),
    [dispatch]
  );

  // Log out as soon as the JWT itself expires, even if no request is sent.
  useEffect(() => {
    if (!enabled) return;
    const expiresAt = getTokenExpiryMs(token);
    if (!expiresAt) return;
    const check = () => {
      if (Date.now() >= expiresAt) dispatch(expireSession() as any);
    };
    const interval = window.setInterval(check, TOKEN_CHECK_INTERVAL_MS);
    // Catch up immediately after the laptop wakes / tab becomes visible.
    document.addEventListener('visibilitychange', check);
    check();
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', check);
    };
  }, [enabled, token, dispatch]);

  const { showWarning, secondsLeft, stayActive } = useIdleTimeout({
    enabled,
    timeoutMs,
    warningMs,
    onTimeout
  });

  if (!enabled) return null;

  return (
    <MyModal
      open={showWarning}
      // Closing the dialog (X / Esc) counts as "I'm still here".
      setOpen={open => {
        if (!open) stayActive();
      }}
      title={<Translate>Are you still there?</Translate>}
      icon={faClock}
      size="30vw"
      bodyheight="auto"
      content={
        <>
          <Translate>Your session will end due to inactivity in</Translate>{' '}
          <b>{secondsLeft}</b> <Translate>seconds</Translate>.
        </>
      }
      cancelButtonLabel="Logout"
      handleCancelFunction={handleLogout}
      actionButtonLabel="Stay signed in"
      actionButtonFunction={stayActive}
    />
  );
};

export default IdleTimeoutManager;
