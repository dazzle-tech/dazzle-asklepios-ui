import React from 'react';
import { Modal } from 'rsuite';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserClock } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setSessionExpiredBackdrop } from '@/reducers/authSlice';
import { SESSION_EXPIRED_MESSAGE } from '@/utils/sessionExpiry';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import '../DeletionConfirmationModal/styles.less';
import './styles.less';

const SCREEN_COLOR = 'var(--primary-blue)';

/**
 * Full-screen notice shown when the session ends (token expired / 401 / inactivity).
 * The token is already cleared when this shows; the only way forward is "Go to login".
 */
const SessionExpiredBackdrop = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionExpiredBackdrop, sessionExpiredReason } = useAppSelector(state => state.auth);
  const mode = useAppSelector(state => state.ui.mode);

  const open = sessionExpiredBackdrop && location.pathname !== '/login';

  const goToLogin = () => {
    dispatch(setSessionExpiredBackdrop(false));
    navigate('/login', { replace: true });
  };

  return (
    <Modal
      open={open}
      backdrop="static"
      keyboard={false}
      size="30vw"
      className={`delete-modal session-expired-modal ${mode}`}
      backdropClassName="session-expired-backdrop"
    >
      <Modal.Header closeButton={false}>
        <div className="delete-circle-wrapper" style={{ ['--circle-color' as any]: SCREEN_COLOR }}>
          <div className="delete-circle-inner" style={{ backgroundColor: SCREEN_COLOR }}>
            <FontAwesomeIcon icon={faUserClock} />
          </div>
        </div>
      </Modal.Header>
      <Modal.Body>
        <div className="body-delete-modal session-expired-body">
          <h5>
            <Translate>Session Expired</Translate>
          </h5>
          <span>
            <Translate>{sessionExpiredReason || SESSION_EXPIRED_MESSAGE}</Translate>
          </span>
        </div>
      </Modal.Body>
      <Modal.Footer className="footer-delete-modal">
        <MyButton backgroundColor={SCREEN_COLOR} onClick={goToLogin}>
          Go to login
        </MyButton>
      </Modal.Footer>
    </Modal>
  );
};

export default SessionExpiredBackdrop;
