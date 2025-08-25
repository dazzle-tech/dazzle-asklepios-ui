import { useAppSelector } from '@/hooks';
import React from 'react';
import { IconButton } from 'rsuite';
import ArrowLeftLine from '@rsuite/icons/ArrowLeftLine';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { setSessionExpiredBackdrop } from '@/reducers/authSlice';
const SessionExpiredBackdrop = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionExpired = useAppSelector(state => state.auth.sessionExpiredBackdrop);

  return (
    <>
      {sessionExpired && location.pathname !== '/login' && (
        <div
          style={{
            position: 'fixed',
            top: '0%',
            left: '0%',
            zIndex: 1001,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            color: 'white',
            textAlign: 'center',
            paddingTop: '30vh'
          }}
        >
          <h1>Session Expired</h1>
          <IconButton
            icon={<ArrowLeftLine />}
            appearance="primary"
            onClick={() => {
              navigate('/login');
              // dispatch(setSessionExpiredBackdrop(false));
            }}
          >
            Take me back to Login
          </IconButton>
        </div>
      )}
    </>
  );
};

export default SessionExpiredBackdrop;
