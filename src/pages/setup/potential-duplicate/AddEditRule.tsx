import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import MyInput from '@/components/MyInput';
import { HiDocumentDuplicate } from 'react-icons/hi2';
import { Form } from 'rsuite';
import './styles.less';
const AddEditRule = ({ open, setOpen, width, candidate, setCandidate, handleSave }) => {
  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
             <div className="container-of-three-fields-potintial">
              <div className="container-of-field-potintial">
            <MyInput
              width="100%"
              fieldName="lastName"
              fieldType="checkbox"
              record={candidate}
              setRecord={setCandidate}
            />
            </div>
             <div className="container-of-field-potintial">
            <MyInput
            width="100%"
              fieldLable="Date Of birthd"
              fieldName="dob"
              fieldLabel="DOB"
              fieldType="checkbox"
              record={candidate}
              setRecord={setCandidate}
            />
            </div>
            <div className="container-of-field-potintial">
              <MyInput
            width="100%"
              fieldLable="Six At birthd"
              fieldName="gender"
              fieldType="checkbox"
              record={candidate}
              setRecord={setCandidate}
            />         
            </div>
           </div>
           <br/>
             <div className="container-of-three-fields-potintial">
             <div className="container-of-field-potintial">
            <MyInput
            width="100%"
              fieldName="documentNo"
              fieldLabel="Document Number"
              fieldType="checkbox"
              record={candidate}
              setRecord={setCandidate}
            />
            </div>
             <div className="container-of-field-potintial">
            <MyInput
            width="100%"
              fieldLable="Mobile Number"
              fieldName="mobileNumber"
              fieldType="checkbox"
              record={candidate}
              setRecord={setCandidate}
            />
            </div>
            </div>
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={candidate?.key ? 'Edit Rule' : 'New Rule'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={candidate?.key ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Rule Info', icon: <HiDocumentDuplicate /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditRule;
