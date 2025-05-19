import React, { useEffect } from 'react';
import { Notification, toaster } from 'rsuite';
import { useDispatch, useSelector } from 'react-redux';
import { clearNotification } from '@/utils/uiReducerActions';
import './styles.less'
const MyToast = () => {
  const uiSlice = useSelector((state) => state.ui);
  const dispatch = useDispatch();

  useEffect(() => {
    if (uiSlice.msg) {
      toaster.push(
        <Notification type={uiSlice.sev}  
         header={<span style={{ fontSize: '14px'}}>{uiSlice.sev.toUpperCase()}</span>}
          className='notifcation-style '
          closable>
          {uiSlice.msg}
        </Notification>,
        { placement: 'topEnd' }
      );
      dispatch(clearNotification());
    }
  }, [uiSlice.msg, uiSlice.sev, dispatch]);

  return null;
};

export default MyToast;
