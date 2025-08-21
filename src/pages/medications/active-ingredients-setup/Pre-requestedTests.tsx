import React, { useState } from 'react';
import { Form } from 'rsuite';
import { MdDelete } from 'react-icons/md';
import { useGetDiagnosticsTestListQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less';
import { initialListRequest, ListRequest } from '@/types/types';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { ApDiagnosticTest } from '@/types/model-types';
import { newApDiagnosticTest } from '@/types/model-types-constructor';
const PreRequestedTests = () => {
  const [diagnosticTest, setDiagnosticTest] = useState<ApDiagnosticTest>({
    ...newApDiagnosticTest
  });
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<ApDiagnosticTest>({
    ...newApDiagnosticTest
  });
  const [openConfirmDeleteTest, setOpenConfirmDeleteTest] = useState<boolean>(false);

  const [listTestRequest] = useState<ListRequest>({ ...initialListRequest });
  // Fetch diagnostic tests list responsive
  const { data: testsList, isFetching } = useGetDiagnosticsTestListQuery(listTestRequest);
  
  // dummy data
  const data = [
    { key: "0", testType: 'Blood', testName: 'Complete Blood Count' },
    { key: "1", testType: 'Imaging', testName: 'Chest X-Ray' },
    { key: "2", testType: 'Urine', testName: 'Routine Urine Test' }
  ];

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && selectedDiagnostic && rowData.key === selectedDiagnostic.key) {
      return 'selected-row';
    } else return '';
  };

  // Icons column (Delete)
  const iconsForActions = () => (
    <div className="container-of-icons">
      <MdDelete
        className="icons-style"
        title="Delete"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => {
          setOpenConfirmDeleteTest(true);
        }}
      />
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'testType',
      title: <Translate>Test Type</Translate>
    },
    {
      key: 'testName',
      title: <Translate>Test Name</Translate>
    },
    {
      key: 'icons',
      title: <Translate>Actions</Translate>,
      render: () => iconsForActions()
    }
  ];

  return (
    <Form fluid>
      <div className='container-of-header-actions-pre-requested-tests'>
        <MyInput
          width={200}
          fieldName="typeLkey"
          fieldType="select"
          selectData={testsList?.object ?? []}
          selectDataLabel="testName"
          selectDataValue="key"
          record={diagnosticTest}
          setRecord={setDiagnosticTest}
          menuMaxHeight={100}
        />
        <MyButton width='80px'>Save</MyButton>
      </div>
      <MyTable
        height={450}
        data={data}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setSelectedDiagnostic(rowData);
        }}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteTest}
        setOpen={setOpenConfirmDeleteTest}
        itemToDelete="Test"
        actionButtonFunction={() => setOpenConfirmDeleteTest(false)}
        actionType="delete"
      />
    </Form>
  );
};

export default PreRequestedTests;
