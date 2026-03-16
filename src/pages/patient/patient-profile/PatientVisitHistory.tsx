import React from 'react';
import { Drawer } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import './styles.less';
import PatientVisitHistoryTable from './PatientVisitHistoryTable';

const PatientVisitHistory = ({ visitHistoryModel, localPatient, setVisitHistoryModel }) => {
  return (
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
  );
};

export default PatientVisitHistory;