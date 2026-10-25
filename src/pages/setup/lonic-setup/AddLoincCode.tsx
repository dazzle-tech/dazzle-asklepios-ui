import React from 'react';
import { Form } from 'rsuite';
import { FaBarcode } from 'react-icons/fa';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useEnumOptions } from '@/services/enumsApi';

const AddLoincCode = ({ open, setOpen, loincCode, setLoincCode, handleSave, width }) => {
  const loincCategoryOptions = useEnumOptions('LoincCategory');

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const conjureFormContent = () => (
    <Form fluid>
      <MyInput
        width="100%"
        fieldName="code"
        record={loincCode}
        setRecord={setLoincCode}
        required
      />
      <MyInput
        width="100%"
        fieldName="category"
        fieldType="select"
        selectData={loincCategoryOptions ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={loincCode}
        setRecord={setLoincCode}
        required
      />
      <MyInput
        width="100%"
        fieldName="description"
        fieldType="textarea"
        record={loincCode}
        setRecord={setLoincCode}
        required
      />
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="New LOINC Code"
      position="right"
      content={() => <div dir={dir}>{conjureFormContent()}</div>}
      actionButtonLabel="Create"
      actionButtonFunction={handleSave}
      steps={[{ title: 'LOINC Code Info', icon: <FaBarcode /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};

export default AddLoincCode;
