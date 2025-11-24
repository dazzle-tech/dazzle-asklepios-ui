import React, { useEffect, useState } from 'react';
import { Panel } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import './styles.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import QuickPatient from './QuickPatient';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import CreateNewPatient from './CreateNewPatient';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less';
const RegistrationWizard = () => {
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const [quickPatientModalOpen, setQuickPatientModalOpen] = useState(false);


  // Effects
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        localStorage.removeItem('divElement');
        localStorage.removeItem('pageCode');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(null));
    };
  }, [location.pathname, dispatch]);

  return (
    <Panel>
      <div className='patient-facility-btns'>
        <MyButton
          onClick={() => setOpen(true)}
          radius="15px"
          prefixIcon={() => <FontAwesomeIcon icon={faUserPlus} />}
        >
          Create New Patient
        </MyButton>
        <MyButton
          appearance="ghost"
          onClick={() => setQuickPatientModalOpen(true)}
          radius="15px"
          prefixIcon={() => <FontAwesomeIcon icon={faBolt} />}
        >
          Quick Patient
        </MyButton>
      </div>
      <CreateNewPatient open={open} setOpen={setOpen} />
      <QuickPatient open={quickPatientModalOpen} setOpen={setQuickPatientModalOpen} />

    </Panel>
  );
};

export default RegistrationWizard;