import React from 'react';
import { Drawer } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import './styles.less';
import PatientVisitHistoryTable from './PatientVisitHistoryTable';

const PatientVisitHistory = ({ visitHistoryModel, localPatient, setVisitHistoryModel }) => {

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
  <div dir={dir}>
    <div className="drawer-container">
      <Drawer
        size="md"
        placement={'right'}
        open={visitHistoryModel}
        onClose={() => setVisitHistoryModel(false)}
      >
        <Drawer.Header>
          <Drawer.Title>{localPatient?.firstName}'s Visits history</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <PatientVisitHistoryTable localPatient={localPatient} />
        </Drawer.Body>
      </Drawer>
    </div>
  </div>
  );
};

export default PatientVisitHistory;