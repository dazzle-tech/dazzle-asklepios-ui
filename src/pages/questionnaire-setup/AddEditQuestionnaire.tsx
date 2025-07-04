import React from 'react';
import MyInput from '@/components/MyInput';
import { Form, Radio, RadioGroup } from 'rsuite';
import { BiQuestionMark } from 'react-icons/bi';
import MyModal from '@/components/MyModal/MyModal';
import './styles.less';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
const AddEditQuestionnaire = ({ open, setOpen, questionnaire, setQuestionnaire, width }) => {
  const { data: questionnaireTypeLovQueryResponse } =
    useGetLovValuesByCodeQuery('QUESTIONNAIRE_TYPE');

  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              width="100%"
              fieldName="questionnaireName"
              selectData={[]}
              selectDataLabel=""
              selectDataValue=""
              record={questionnaire}
              setRecord={setQuestionnaire}
            />
            <MyInput
              width="100%"
              fieldName=""
              fieldType="select"
              selectData={questionnaireTypeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              fieldLabel="Type"
              selectDataValue="key"
              record=""
              setRecord=""
            />
            <label>Sequence Or Full View</label>
            <RadioGroup name="radio-group-inline" inline >
              <Radio value="sequence">Sequence</Radio>
              <Radio value="fv">Full View</Radio>
            </RadioGroup>
          </Form>
        );
    }
  };

  return (
    <MyModal
      actionButtonLabel={questionnaire?.key ? 'Save' : 'Create'}
      open={open}
      setOpen={setOpen}
      position="right"
      title={questionnaire?.key ? 'Edit Questionnaire' : 'New Questionnaire'}
      content={conjureFormContentOfMainModal}
      steps={[
        {
          title: 'Basic Info',
          icon: <BiQuestionMark />
        }
      ]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditQuestionnaire;
