import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChild } from '@fortawesome/free-solid-svg-icons';

const AddEditAnthropometric = ({
  open,
  setOpen,
  width,
  anthropometric,
  setAnthropometric
}) => {

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
         <Form layout='inline' fluid>
           <MyInput 
             fieldName='length'
             record={anthropometric}
             setRecord={setAnthropometric}
             rightAddon="cm"
             fieldType='number'
           />
           <MyInput 
             fieldName='weight'
             record={anthropometric}
             setRecord={setAnthropometric}
             rightAddon="cm"
             fieldType='number'
           />
           <MyInput 
             fieldName='headCircumference'
             record={anthropometric}
             setRecord={setAnthropometric}
             rightAddon="cm"
             fieldType='number'
           />
           <MyInput 
             fieldName='bmi'
             fieldLabel="BMI For Age Percentile"
             record={anthropometric}
             setRecord={setAnthropometric}
             rightAddon="%"
             disabled
           />
           <MyInput 
             fieldName='weightForAge'
             record={anthropometric}
             setRecord={setAnthropometric}
             disabled
             column
           />
           <MyInput 
             fieldName='lengthForAge'
             record={anthropometric}
             setRecord={setAnthropometric}
             disabled
             column
           />
           <MyInput 
             fieldName='hc'
             fieldLabel="HC For Age"
             record={anthropometric}
             setRecord={setAnthropometric}
             disabled
             column
           />
         </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={anthropometric?.key ? 'Edit Anthropometric' : 'New Anthropometric'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={anthropometric?.key ? 'Save' : 'Create'}
      steps={[{ title: 'Anthropometric', icon: <FontAwesomeIcon icon={faChild} /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditAnthropometric;
