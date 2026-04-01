import MyInput from '@/components/MyInput';
import React, { useEffect } from 'react';
import { Form } from 'rsuite';
const AddEditQuestione = ({ question, setQuestion }) => {

  const answerOptions = [
    { value: 'textfield', label: 'Text Field' },
    { value: 'lov', label: 'LOV' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'toggle', label: 'Toggle' }
  ];

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <Form fluid dir={dir}>
      <MyInput
        width="100%"
        fieldName="questionNumber"
        record={question}
        setRecord={setQuestion}
      />
      <MyInput
        width="100%"
        fieldType="textarea"
        fieldName="questionContent"
        record={question}
        setRecord={setQuestion}
      />
      <MyInput
        width={550}
        fieldName="answerOption"
        fieldType="select"
        selectData={answerOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={question}
        setRecord={setQuestion}
      />
      {
        question?.answerOption == "lov" && (
      <MyInput
        width="100%"
        fieldName="lovCode"
        record=""
        setRecord=""
      />
        )
     }
    </Form>
  );
};
export default AddEditQuestione;
