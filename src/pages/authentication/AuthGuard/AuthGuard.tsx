import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch, useStore } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { RootState } from '@/store';
import { logout, setSessionExpired, setToken } from '@/reducers/authSlice';
import { SESSION_EXPIRED_EVENT_KEY, SESSION_EXPIRED_MESSAGE } from '@/utils/sessionExpiry';
import { isPublicAuthFreePath } from '@/config/publicRoutes';

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const store = useStore<RootState>();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const { token, sessionExpiredBackdrop } = useSelector(
    (state: RootState) => state.auth
  );

  const isLoginPage = location.pathname === '/login';

  const isPublicPage = isPublicAuthFreePath(location.pathname);

  useEffect(() => {
    const storedToken = localStorage.getItem('id_token');

    if (!token && storedToken) {
      dispatch(setToken(storedToken));
    }

    setIsCheckingAuth(false);
  }, []);

  useEffect(() => {
    if (token && isLoginPage) {
      navigate('/', { replace: true });
    }
  }, [token, isLoginPage, navigate]);

  useEffect(() => {
    if (isCheckingAuth) return;
    if (isPublicPage) return;

    const storedToken = localStorage.getItem('id_token');

    // While the Session Expired screen is up, stay put: its "Go to login" button navigates.
    if (sessionExpiredBackdrop) return;

    if (!token && !storedToken) {
      dispatch(logout());
      navigate('/login', { replace: true });
    }
  }, [
    isCheckingAuth,
    isPublicPage,
    token,
    sessionExpiredBackdrop,
    dispatch,
    navigate,
  ]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Another tab's session expired: show the same screen here.
      if (event.key === SESSION_EXPIRED_EVENT_KEY && event.newValue) {
        let message = SESSION_EXPIRED_MESSAGE;
        try {
          message = JSON.parse(event.newValue)?.message || message;
        } catch {
          /* keep default message */
        }
        if (!store.getState().auth.sessionExpiredBackdrop) dispatch(setSessionExpired(message));
        dispatch(logout());
        return;
      }

      // Token removed because of an expiry screen: don't redirect, the screen handles it.
      if (event.key === 'id_token' && event.newValue === null && store.getState().auth.sessionExpiredBackdrop) {
        dispatch(logout());
        return;
      }

      if (
        (event.key === 'id_token' && event.newValue === null) ||
        event.key === 'logout_event'
      ) {
        dispatch(logout());
        navigate('/login', { replace: true });
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => window.removeEventListener('storage', handleStorageChange);
  }, [dispatch, navigate, store]);

  if (isCheckingAuth && !isPublicPage) {
    return null;
  }

  const storedToken = localStorage.getItem('id_token');

  if (!isPublicPage && !token && !storedToken) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;