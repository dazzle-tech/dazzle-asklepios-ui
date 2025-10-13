import React, { useState } from 'react';
import MainScreenBar from '../MainScreenBarIcons/MainScreenBar';
import MainScreenBarFilters from '../MainScreenBarIcons/MainScreenBarFilters';
import { Stack } from 'rsuite';
import ChangePassword from './ChangePassword';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { closeChangePassword, closeEditProfile } from '@/utils/uiReducerActions';
import EditProfile from './EditProfile';
import RegistrationWizard from '@/pages/patient/facility-patient-list/RegistrationWizard';
const Header = ({ expand, setExpand, setExpandNotes }) => {
  const dispatch = useDispatch();
   const [displaySearch, setDisplaySearch] = useState<boolean>(true);
  const showChangePassword = useSelector((state: RootState) => state.ui.showChangePassword);
  const handleCloseChangePassword = () => {
    dispatch(closeChangePassword());
  };

  const showEditProfile = useSelector((state: RootState) => state.ui.showEditProfile);
  const handleCloseEditProfile = () => {
    dispatch(closeEditProfile());
  };

  const pageCode = useSelector((state: RootState) => state.div?.pageCode);
  return (
    <>
      <Stack className={`header ${expand ? 'expand' : ''}`} spacing={8}>
        <MainScreenBarFilters displaySearch={displaySearch} setDisplaySearch={setDisplaySearch}/>
        <div className="headerItem">
          {pageCode === 'P_Facility' || pageCode === 'ER_Triage' ? <RegistrationWizard /> : <></>}
          <div className="main-screen-bar-icons-main-container-header">
            <MainScreenBar setExpandNotes={setExpandNotes} displaySearch={displaySearch} setDisplaySearch={setDisplaySearch}/>
          </div>
        </div>
      </Stack>
      <ChangePassword open={showChangePassword} onClose={handleCloseChangePassword} />
      <EditProfile open={showEditProfile} onClose={handleCloseEditProfile} />
    </>
  );
};

export default Header;
