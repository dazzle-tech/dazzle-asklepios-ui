import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { Checkbox } from 'rsuite';
import PlusIcon from '@rsuite/icons/Plus';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import Translate from '@/components/Translate';
import EchoDopplerTestModal from './EchoDopplerTestModal'; // 👈 استيراد المودال

const EchoDopplerTest = ({ patient, encounter, edit }) => {
  const [echoData, setEchoData] = useState([]); // Placeholder data
  const [selectedRow, setSelectedRow] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);

  const [openModal, setOpenModal] = useState(false); // 👈 التحكم بالمودال
  const [echoTestObject, setEchoTestObject] = useState(null); // 👈 للـ add/edit

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

  const columns: ColumnConfig[] = [
    {
      key: 'testDate',
      title: 'Test Date',
      dataKey: 'testDate',
      width: 150
    },
    {
      key: 'testType',
      title: 'Test Type',
      dataKey: 'testType',
      width: 200
    },
    {
      key: 'result',
      title: 'Result',
      dataKey: 'result',
      width: 200
    }
  ];

  const tableFilters = (
    <div className="bt-div">
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
          onClick={handleAddClick} // 👈 التفعيل هنا
        >
          Add
        </MyButton>
      </div>
    </div>
  );

  return (
    <>
      <MyTable
        data={echoData}
        columns={columns}
        filters={tableFilters}
        loading={false}
        rowClassName={(row) => (row?.key === selectedRow?.key ? 'selected-row' : '')}
        onRowClick={(row) => setSelectedRow(row)}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={echoData.length}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      {/* 👇 المودال */}
      <EchoDopplerTestModal
        open={openModal}
        setOpen={setOpenModal}
        patient={patient}
        encounter={encounter}
        echoTestObject={echoTestObject}
        refetch={() => {
          // 👇 لاحقاً ضع هنا refetch API call
          console.log("Refetch after save");
        }}
        edit={false} // 👈 يمكن التحكم فيه لاحقًا
      />
    </>
  );
};

export default EchoDopplerTest;
