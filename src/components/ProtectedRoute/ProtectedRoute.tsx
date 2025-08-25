import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import React from 'react';
// import { useAutoLoginQuery } from '@/services/authService';
import { useDispatch } from 'react-redux';
import { setSessionExpiredBackdrop } from '../../reducers/authSlice';

function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // const [checkId, setCheckId] = useState(0);

  // const {
  //   data: autoLoginResponse,
  //   isLoading: autoLoginIsLoading,
  //   isFetching: autoLoginIsFetching
  // } = useAutoLoginQuery(checkId);

  // useEffect(() => {
  //   setCheckId(prev => prev === 1 ? 0 : 1); 
  // }, [location]);

  // useEffect(() => {
  //   if (!autoLoginIsLoading && !autoLoginIsFetching) {
  //     if (!autoLoginResponse?.user) {
  //       navigate('/login', { replace: true });
  //     }
  //   }
  // }, [autoLoginResponse, autoLoginIsLoading, autoLoginIsFetching, navigate]);

  // if (autoLoginIsLoading || autoLoginIsFetching) {
  //   return <>Loading...</>;
  // }

  // if (autoLoginResponse?.user) {
  //   return children;
  // }

  // مؤقتاً، عرض الأطفال مباشرة بدون autoLogin
  return children;
}

export default ProtectedRoute;