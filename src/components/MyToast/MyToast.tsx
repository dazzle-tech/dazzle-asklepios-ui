import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { clearNotification } from '@/utils/uiReducerActions';

const MyToast = () => {
  const uiSlice = useSelector((state: any) => state.ui);
  const dispatch = useDispatch();

  useEffect(() => {
    if (uiSlice.msg) {
      toast(uiSlice.msg, {
        type: uiSlice.sev,
        autoClose: uiSlice.msgLife ? uiSlice.msgLife : 2000
      });
      dispatch(clearNotification());
    }
  }, [uiSlice.msg, uiSlice.sev]);

  return (
    <ToastContainer
      position="top-right"
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss={false}
      pauseOnHover={false}
      theme="dark"
    />
  );
};

export default MyToast;
