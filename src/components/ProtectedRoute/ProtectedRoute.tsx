import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import React from 'react';
import { useAutoLoginQuery } from '@/services/authService';
import { useAppSelector } from '@/hooks';
import { useDispatch } from 'react-redux';
import { setSessionExpiredBackdrop } from '../../reducers/authSlice';

function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [checkId, setCheckId] = useState(0);
  const {
    data: autoLoginResponse,
    isLoading: autoLoginIsLoading,
    isFetching: autoLoginIsFetching
  } = useAutoLoginQuery(checkId);

  useEffect(() => {
    setCheckId(checkId === 1 ? 0 : 1);
    if (!localStorage.getItem('access_token')) {
      dispatch(setSessionExpiredBackdrop(true));
    } 
  }, [location]);

  useEffect(() => {
    // plan: if there is no valid user, navigate back to login
    if (!autoLoginResponse && !autoLoginIsLoading && !autoLoginIsFetching) {
      navigate('/login');
    }
  }, [autoLoginResponse, autoLoginIsLoading, autoLoginIsFetching]);

  // TODO:: uncomment this when there is proper loading
  // if (isLoading)
  //     return (
  //         <>Loading...</>
  //     );

  if (autoLoginResponse) return children;
}

export default ProtectedRoute;
