import MyModal from '@/components/MyModal/MyModal';
import React, { useState } from 'react';
import './styles.less';
import { GrScheduleNew } from 'react-icons/gr';
import PatientInfoCard from '@/components/PatientInfoCard';
import ProfileSidebar from '../ProfileSidebar';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCodeMerge } from '@fortawesome/free-solid-svg-icons';
const MergePatient = ({ open, setOpen, patient }) => {
  const [searchedPatient, setSearchedPatient] = useState({});
  const [refetchData, setRefetchData] = useState(false);
  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <div className="merge" style={{ display: 'flex', gap: '5px', height: '300px' }}>
            <ProfileSidebar
              expand={true}
              setExpand={() => {}}
              windowHeight={200}
              setLocalPatient={setSearchedPatient}
              refetchData={refetchData}
              setRefetchData={setRefetchData}
              title=""
              direction="right"
              showButton={false}
            />
            <PatientInfoCard patient={searchedPatient} />
          </div>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Merge Patient"
      position="center"
      content={conjureFormContent}
      hideActionBtn
      steps={[{ title: 'Merge Patient', icon: <GrScheduleNew /> }]}
      size="md"
      bodyheight="500px"
      footerButtons={
        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faCodeMerge} />}>Merge</MyButton>
      }
    />
  );
};
export default MergePatient;
