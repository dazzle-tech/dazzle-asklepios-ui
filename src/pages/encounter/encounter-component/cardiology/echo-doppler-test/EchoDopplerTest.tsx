import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { Checkbox } from 'rsuite';
import PlusIcon from '@rsuite/icons/Plus';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import Translate from '@/components/Translate';
import EchoDopplerTestModal from './EchoDopplerTestModal';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';

const EchoDopplerTest = ({ patient, encounter, edit }) => {
  const [selectedRow, setSelectedRow] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [echoTestObject, setEchoTestObject] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleAddClick = () => {
    setEchoTestObject({});
    setOpenModal(true);
  };

  const [echoData, setEchoData] = useState([
  {
    key: 1,
    testIndication: 'Chest Pain',
    echotype: 'Transthoracic Echo',
    referringphysician: 'Dr. Smith',
    finalimpression: 'Normal function',
    recommendation: 'Follow-up in 6 months',
    cardiologist: 'Dr. Heart',
    createdBy: 'Nurse Jane',
    createdAt: '2025-08-20 10:30 AM',
    canceledBy: 'Admin Joe',
    canceledAt: '2025-08-21 09:15 AM',
    cancellationResult: 'Patient rescheduled'
  },
  {
    key: 2,
    testIndication: 'Shortness of breath',
    echotype: 'Transesophageal Echo',
    referringphysician: 'Dr. Adams',
    finalimpression: 'Mild regurgitation',
    recommendation: 'Cardiology consult',
    cardiologist: 'Dr. Valve',
    createdBy: 'Nurse Sam',
    createdAt: '2025-08-19 11:45 AM',
    canceledBy: '',
    canceledAt: '',
    cancellationResult: ''
  }
]);


  const columns: ColumnConfig[] = [
    {
      key: 'testIndication',
      title: 'Test Indication ',
      dataKey: 'testIndication',
      width: 150
    },
    {
      key: 'echotype',
      title: 'Echo Type',
      dataKey: 'echotype',
      width: 200
    },
    {
      key: 'referringphysician',
      title: 'Referring Physician',
      dataKey: 'referringphysician',
      width: 200
    },
        {
      key: 'finalimpression',
      title: 'Final Impression',
      dataKey: 'finalimpression',
      width: 200
    },
        {
      key: 'recommendation',
      title: 'Recommendation',
      dataKey: 'recommendation',
      width: 200
    },
{
  key: 'cardiologist',
  title: 'Cardiologist',
  dataKey: 'cardiologist',
  width: 200
},
{
  key: 'createdByAt',
  title: 'Created By/At',
  dataKey: 'createdByAt',
  expandable: true,
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
  key: 'canceledByAt',
  title: 'Canceled By/At',
  dataKey: 'canceledByAt',
  expandable: true,
  width: 220,
  render: row => (
    <>
      {row.canceledBy}
      <br />
      <span className="date-table-style">{row.canceledAt}</span>
    </>
  )
},
{
  key: 'cancellationResult',
  title: 'Cancellation Result',
  expandable: true,
  dataKey: 'cancellationResult',

  width: 220,
  render: row => (
    <>
      {row.cancellationResult}
    </>
  )
}
  ];



  


  const tablebuttons = (<>
  
  <MyButton
        onClick={() => {
          console.log('Cancel clicked');
        }}
        prefixIcon={() => <CloseOutlineIcon />}
        disabled={!edit ? !selectedRow : false}
      >
        <Translate>Cancel</Translate>
      </MyButton>

      <Checkbox checked={showCancelled} onChange={(_, checked) => setShowCancelled(checked)}>
        Show Cancelled
      </Checkbox>

      
      <div className="bt-right">
        <MyButton
          prefixIcon={() => <PlusIcon />}
          disabled={edit}
          onClick={handleAddClick}
        >
          Add
        </MyButton>


      </div>

      </>);

  return (
    <>
      <MyTable
        data={echoData}
        columns={columns}
        loading={false}
        tableButtons={tablebuttons}
        rowClassName={(row) => (row?.key === selectedRow?.key ? 'selected-row' : '')}
        onRowClick={(row) => setSelectedRow(row)}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={echoData.length}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      <EchoDopplerTestModal
        open={openModal}
        setOpen={setOpenModal}
        patient={patient}
        encounter={encounter}
        echoTestObject={echoTestObject}
        refetch={() => {
          console.log("Refetch after save");
        }}
        edit={false}
      />
    </>
  );
};

export default EchoDopplerTest;
