// TelephonicConsultationUI.tsx
import React, { useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import { Checkbox } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import BlockIcon from '@rsuite/icons/Block';
import { MdModeEdit } from 'react-icons/md';
import CheckIcon from '@rsuite/icons/Check';
import DetailsTele from './DetailsTele';
import './styles.less';

const TelephonicConsultation = () => {

  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [consultationOrders, setConsultationOrder] = useState({});

  const patient = { key: 'patient1', name: 'John Doe' };
  const encounter = { key: 'encounter1', date: '2025-09-15' };

  const tableData = [
    {
      id: 1,
      physician: 'Dr. John Doe',
      result: 'Normal',
      callDateTime: '2025-09-15 10:30',
      cancellationReason: '',
      cancelledBy: 'Nurse Admin',
      cancelledAt: '2025-09-15 11:00',
      createdBy: 'Dr. Smith',
      createdAt: '2025-09-15 10:00'
    },
    {
      id: 2,
      physician: 'Dr. Jane Smith',
      result: 'Follow-up Needed',
      callDateTime: '2025-09-14 14:00',
      cancellationReason: 'Patient unavailable',
      cancelledBy: 'Nurse Admin',
      cancelledAt: '2025-09-14 14:30',
      createdBy: 'Dr. Brown',
      createdAt: '2025-09-14 13:50'
    }
  ];

  const tableColumns = [
    {
      key: 'select',
      title: '#',
      render: (row: any, index: number) => <Checkbox />
    },
    { key: 'physician', title: 'Physician', render: (row: any) => row.physician },
    { key: 'result', title: 'Result', render: (row: any) => row.result },
    {
      key: 'callDateTime',
      title: 'Call Date/Time',
      dataKey: 'callDateTime',
      width: 220,
      render: row => (
        <>
          {row.physician}
          <br />
          <span className="date-table-style">{row.callDateTime}</span>
        </>
      )
    },

    {
      key: 'cancellationReason',
      title: 'Cancellation Reason',
      render: (row: any) => row.cancellationReason
    },
    {
      key: 'cancelledAtBy',
      title: 'Cancelled At/By',
      dataKey: 'cancelledAtBy',
      width: 220,
      render: row => (
        <>
          {row.cancelledBy}
          <br />
          <span className="date-table-style">{row.cancelledAt}</span>
        </>
      )
    },
    {
      key: 'createdByAt',
      title: 'Created By/At',
      dataKey: 'createdByAt',
      width: 220,
      render: row => (
        <>
          {row.createdBy}
          <br />
          <span className="date-table-style">{row.createdAt}</span>
        </>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: () => (
        <div className="icons-consultation-main-container">
          <MdModeEdit size={24} fill="var(--primary-gray)" />
        </div>
      )
    }
  ];


  const tablebuttons = (<>
  <div className='table-buttons-left-part-handle-positions'>
        <MyButton prefixIcon={() => <BlockIcon />}>Cancel</MyButton>
        <MyButton appearance="ghost" prefixIcon={() => <FontAwesomeIcon icon={faPrint} />}>
          Print
        </MyButton>
        <Checkbox>Show Cancelled</Checkbox>
</div>
        <div className="bt-right">
          <MyButton onClick={() => setOpenDetailsModal(true)}>Add Consultation</MyButton>
        </div>
      </>);

  return (
    <div>
      <div>
        <MyTable
          columns={tableColumns}
          data={tableData}
          loading={false}
          tableButtons={tablebuttons}
          page={0}
          rowsPerPage={5}
          totalCount={tableData.length}
        />
      </div>

<DetailsTele
        patient={patient}
        encounter={encounter}
        consultationOrders={consultationOrders}
        setConsultationOrder={setConsultationOrder}
        open={openDetailsModal}
        setOpen={setOpenDetailsModal}
        refetchCon={() => console.log('refetch called')}
        editing={false}
        edit={false}
      />
    </div>
  );
};

export default TelephonicConsultation;
