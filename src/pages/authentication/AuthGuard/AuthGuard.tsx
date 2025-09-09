import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store';
import { logout, checkTokenValidity } from '@/reducers/authSlice';

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, sessionExpiredBackdrop } = useSelector((state: RootState) => state.auth);


  useEffect(() => {
    dispatch(checkTokenValidity());
  }, [dispatch]);

 
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(checkTokenValidity());
    }, 60000); 

    return () => clearInterval(interval);
  }, [dispatch]);


  useEffect(() => {
    if (!token || sessionExpiredBackdrop) {
      dispatch(logout());
      navigate('/login', { replace: true });
    }
  }, [token, sessionExpiredBackdrop, dispatch, navigate]);

  return <>{children}</>;
};

export default AuthGuard;
