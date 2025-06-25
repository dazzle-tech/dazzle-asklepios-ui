import React from 'react';
import {
  useGetLovValuesByCodeQuery,
} from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { GrCatalog } from "react-icons/gr";
import MyModal from '@/components/MyModal/MyModal';
const AddEditCatalog = ({ open, setOpen, diagnosticsTestCatalogHeader, setDiagnosticsTestCatalogHeader,departmentListResponse, width,handleSave }) => {
  // Fetch test Type Lov Response
  const { data: testTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DIAG_TEST-TYPES');

  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
           <MyInput
              width="100%"
              fieldName="typeLkey"
              fieldType="select"
              selectData={testTypeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={diagnosticsTestCatalogHeader}
              setRecord={setDiagnosticsTestCatalogHeader}
            />
            <MyInput
              width="100%"
              fieldName="departmentKey"
              fieldType="select"
              selectData={departmentListResponse?.object ?? []}
              selectDataLabel="name"
              selectDataValue="key"
              record={diagnosticsTestCatalogHeader}
              setRecord={setDiagnosticsTestCatalogHeader}
               menuMaxHeight={200}
            />
            <MyInput
              width="100%"
              fieldName="description"
              fieldLabel="Catalog Name"
              record={diagnosticsTestCatalogHeader}
              setRecord={setDiagnosticsTestCatalogHeader}
            />
          </Form>
        );
      
    }
  };
  return (
    <MyModal
      actionButtonLabel={diagnosticsTestCatalogHeader?.key ? 'Save' : 'Create'} 
      actionButtonFunction={handleSave}
      open={open}
      setOpen={setOpen}
      position="right"
      title={diagnosticsTestCatalogHeader?.key ? 'Edit Catalog' : 'New Catalog'}
      content={conjureFormContentOfMainModal}
      steps={[
        {
          title: 'Catalog Info',
          icon: <GrCatalog />,
        }
      ]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditCatalog;
