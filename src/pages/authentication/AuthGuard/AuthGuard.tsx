import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store';
import { logout, checkTokenValidity } from '@/reducers/authSlice';

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, sessionExpiredBackdrop } = useSelector((state: RootState) => state.auth);

  // Check token validity on component mount
  useEffect(() => {
    dispatch(checkTokenValidity());
  }, [dispatch]);

  // Re-check token validity every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(checkTokenValidity());
    }, 60000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Listen for logout from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'id_token' && event.newValue === null) {
        dispatch(logout());
        navigate('/login', { replace: true });
      }

      if (event.key === 'logout_event') {
        dispatch(logout());
        navigate('/login', { replace: true });
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [dispatch, navigate]);

  // Redirect to login if token is missing or session expired
  useEffect(() => {
    if (!token || sessionExpiredBackdrop) {
      dispatch(logout());
      navigate('/login', { replace: true });
    }
  }, [token, sessionExpiredBackdrop, dispatch, navigate]);

  return <>{children}</>;
};

export default AuthGuard;