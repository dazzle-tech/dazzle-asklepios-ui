import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { RootState } from '@/store';
import { logout, setToken } from '@/reducers/authSlice';
import { isPublicAuthFreePath } from '@/config/publicRoutes';

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

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

    if ((!token && !storedToken) || sessionExpiredBackdrop) {
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
  }, [dispatch, navigate]);

  if (isCheckingAuth && !isPublicPage) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;