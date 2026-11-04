import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { FaMicroscope } from 'react-icons/fa';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

const AddEditAnalyzer = ({ open, setOpen, width, analyzer, setAnalyzer, handleSave }) => {
  // Fetch Analyzer Type Lov response
  const { data: AnalyzerTypeLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_CATEGORIES');

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              required
              width="100%"
              fieldName="code"
              record={analyzer}
              setRecord={setAnalyzer}
            />
            <MyInput
              required
              width="100%"
              menuMaxHeight={200}
              fieldName="type"
              fieldType="select"
              selectData={AnalyzerTypeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              disableByField="isValid"
              selectDataValue="key"
              record={analyzer}
              setRecord={setAnalyzer}
            />
          </Form>
        );
    }
  };

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={analyzer?.id ? 'Edit Analyzer' : 'New Analyzer'}
      position="right"
      content={(stepNumber) => (<div dir={dir}>{conjureFormContent(stepNumber)}</div>)}
      actionButtonLabel={analyzer?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Analyzer Info', icon: <FaMicroscope /> }]}
      size={'40vw'}
    />
  );
};
export default AddEditAnalyzer;
