import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store';
import { logout, checkTokenValidity } from '@/reducers/authSlice';

// ==================
// AuthGuard Component
// ==================
// This component protects routes by checking if the user is authenticated.
// - It validates the token when the component mounts.
// - It re-checks the token periodically (every 60 seconds).
// - If the token is invalid or session is expired, it logs the user out and redirects to login.
// Wrap protected routes with <AuthGuard> ... </AuthGuard>.
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, sessionExpiredBackdrop } = useSelector((state: RootState) => state.auth);

  // Check token validity on component mount
  useEffect(() => {
    dispatch(checkTokenValidity());
  }, [dispatch]);

  // Re-check token validity every 60 seconds (to auto-logout on expiration)
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(checkTokenValidity());
    }, 60000); // 1 minute

    return () => clearInterval(interval); // cleanup on unmount
  }, [dispatch]);

  // Redirect to login if token is missing or session expired
  useEffect(() => {
    if (!token || sessionExpiredBackdrop) {
      dispatch(logout());
      navigate('/login', { replace: true });
    }
  }, [token, sessionExpiredBackdrop, dispatch, navigate]);

  // Render child components if authenticated
  return <>{children}</>;
};

export default AuthGuard;
