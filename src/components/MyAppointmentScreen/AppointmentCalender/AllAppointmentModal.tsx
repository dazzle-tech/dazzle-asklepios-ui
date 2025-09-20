import React, { useState } from 'react';
import AppointmentCalender from './AppointmentCalender';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIdCard, faTable } from '@fortawesome/free-solid-svg-icons';
import '../MyAppointmentScreen.less';
import MyAppointmentScreenTable from './MyAppointmentScreenTable';
import MyAppointmentScreenCard from './MyAppointmentScreenCard';
import SectionContainer from '@/components/SectionsoContainer';

const AllAppointmentModal = () => {
  const [viewMode, setViewMode] = useState('table');

  return (
    <>
      <AppointmentCalender />

      <div className="icons-2" style={{ textAlign: 'center', margin: '20px 0' }}>
        <FontAwesomeIcon
          icon={faIdCard}
          className={`fa-icon ${viewMode === 'card' ? 'active' : ''}`}
          style={{ cursor: 'pointer', fontSize: 20, marginRight: 10 }}
          onClick={() => setViewMode('card')}
        />
        <FontAwesomeIcon
          icon={faTable}
          className={`fa-icon ${viewMode === 'table' ? 'active' : ''}`}
          style={{ cursor: 'pointer', fontSize: 20 }}
          onClick={() => setViewMode('table')}
        />
      </div>

      <div className="appointment-data-view">
        {viewMode === 'table' ? (
          <SectionContainer title={<></>} content={<MyAppointmentScreenTable />} />
        ) : (
          <SectionContainer title={<></>} content={<MyAppointmentScreenCard />} />
        )}
      </div>
    </>
  );
};

export default AllAppointmentModal;
