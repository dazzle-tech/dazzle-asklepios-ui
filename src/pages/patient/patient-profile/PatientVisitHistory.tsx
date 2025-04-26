
import Translate from '@/components/Translate';
const { Column, HeaderCell, Cell } = Table;
import React, { useState } from 'react';
import { Drawer, Table } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { useGetEncountersQuery } from '@/services/encounterService';
import { initialListRequest, ListRequest } from '@/types/types';
import PatientQuickAppointment from './PatientQuickAppoinment/PatientQuickAppointment';
import MyTable from '@/components/MyTable';
import './styles.less'
const PatientVisitHistory = ({ visitHistoryModel, localPatient, setVisitHistoryModel, quickAppointmentModel, setQuickAppointmentModel }) => {
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [visitHistoryListRequest, setVisitHistoryListRequest] = useState<ListRequest>({
    ...initialListRequest,
    sortBy: 'plannedStartDate',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: localPatient.key || undefined
      }]
  });
  const { data: visiterHistoryResponse, isLoading } = useGetEncountersQuery(visitHistoryListRequest);
  const tableColumns = [
    {
      key: 'visitId',
      title: <Translate>key</Translate>,
      flexGrow: 4,
      render: (rowData: any) => (
        <a
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setSelectedVisit(rowData);
            setQuickAppointmentModel(true);
          }}
        >
          {rowData.visitId}
        </a>
      )
    },
    {
      key: 'plannedStartDate',
      title: <Translate>Date</Translate>,
      flexGrow: 4,
      dataKey: 'plannedStartDate'
    },
    {
      key: 'departmentName',
      title: <Translate>Department</Translate>,
      flexGrow: 4,
      dataKey: 'departmentName'
    },
    {
      key: 'physician',
      title: <Translate>Physician</Translate>,
      flexGrow: 4,
      render: (rowData: any) => rowData.practitionerObject?.practitionerFullName
    },
    {
      key: 'priority',
      title: <Translate>Priority</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData.encounterPriorityLvalue
          ? rowData.encounterPriorityLvalue.lovDisplayVale
          : rowData.encounterPriorityLkey
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData.encounterStatusLvalue
          ? rowData.encounterStatusLvalue.lovDisplayVale
          : rowData.encounterStatusLkey
    }
  ];
  return (
    <div className='drawer-container'>
        <Drawer
          size="md"
          placement={'right'}
          open={visitHistoryModel}
          onClose={() => setVisitHistoryModel(false)}
        >
          <Drawer.Header>
            <Drawer.Title>{localPatient?.firstName}'s{' '}Visits history</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <MyTable
              data={visiterHistoryResponse?.object ?? []}
              columns={tableColumns}
              height={580}
              loading={isLoading}
            />
          </Drawer.Body>
        </Drawer>
      {quickAppointmentModel ? <PatientQuickAppointment quickAppointmentModel={quickAppointmentModel} localPatient={localPatient} setQuickAppointmentModel={setQuickAppointmentModel} localVisit={selectedVisit} /> : <></>}
    </div>
  );
};

export default PatientVisitHistory;
