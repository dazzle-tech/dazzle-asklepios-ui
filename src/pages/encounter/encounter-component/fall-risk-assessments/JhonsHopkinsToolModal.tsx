import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import { Col, Form, Row } from 'rsuite';
import MyInput from '@/components/MyInput';


const JohnsHopkinsToolModal = ({
  open,
  setOpen,
  onSave,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  onSave: () => void;
}) => {
  const ModalContent = ( <><Form fluid><Row>
  <div className="first-full-inputs-jhons-hopkins-tool">
    <div className="first-input-section-jhons-hopkins">
      <MyInput
        width={'100%'}
        fieldType="select"
        fieldLabel="Fall History (within 6 months)"
        fieldName="fallHistory"
        selectData={[{ label: 'Yes', key: 1 }, { label: 'No', key: 2 }]}
        selectDataLabel="label"
        selectDataValue="key"
        record={''}
        setRecord={''}
      />
      <MyInput
        width={'100%'}
        fieldType="select"
        fieldLabel="On sedatives, hypnotics, anticonvulsants, opioids"
        fieldName="sedatives"
        selectData={[{ label: 'Yes', key: 1 }, { label: 'No', key: 2 }]}
        selectDataLabel="label"
        selectDataValue="key"
        record={''}
        setRecord={''}
      />
      <MyInput
        width={'100%'}
        fieldType="select"
        fieldLabel="Elimination (urgency/incontinence)"
        fieldName="elimination"
        selectData={[
          { label: 'Urgency/frequency', key: 1 },
          { label: 'Incontinence', key: 2 },
          { label: 'Both', key: 3 },
          { label: 'None', key: 4 },
        ]}
        selectDataLabel="label"
        selectDataValue="key"
        record={''}
        setRecord={''}
      />
    </div>

    <div className="first-input-section-jhons-hopkins">
      <MyInput
        width={'100%'}
        fieldType="select"
        fieldLabel="Patient Care Equipment"
        fieldName="equipment"
        selectData={[
          { label: '1 piece', key: 1 },
          { label: '2 pieces', key: 2 },
          { label: 'More than 3 pieces', key: 3 },
          { label: 'None', key: 4 },
        ]}
        selectDataLabel="label"
        selectDataValue="key"
        record={''}
        setRecord={''}
      />
      <MyInput
        width={'100%'}
        fieldType="select"
        fieldLabel="Mobility"
        fieldName="mobility"
        selectData={[
          { label: 'Requires assistance/supervision', key: 1 },
          { label: 'Unsteady gait', key: 2 },
          { label: 'Impaired', key: 3 },
          { label: 'Normal', key: 4 },
        ]}
        selectDataLabel="label"
        selectDataValue="key"
        record={''}
        setRecord={''}
      />
      <MyInput
        width={'100%'}
        fieldType="select"
        fieldLabel="Cognition"
        fieldName="cognition"
        selectData={[
          { label: 'Altered awareness', key: 1 },
          { label: 'Impaired judgment', key: 2 },
          { label: 'Impulsive', key: 3 },
          { label: 'Oriented', key: 4 },
        ]}
        selectDataLabel="label"
        selectDataValue="key"
        record={''}
        setRecord={''}
      />
      <MyInput
        width={'100%'}
        fieldType="select"
        fieldLabel="Age"
        fieldName="age"
        selectData={[
          { label: '≥ 80 years', key: 1 },
          { label: '70–79 years', key: 2 },
          { label: '60–69 years', key: 3 },
          { label: '50–59 years', key: 4 },
          { label: '< 50 years', key: 5 },
        ]}
        selectDataLabel="label"
        selectDataValue="key"
        record={''}
        setRecord={''}
      />
    </div>
  </div>
</Row>
 </Form></>);

return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Order Items"
      steps={[{ title: 'Order Items' }]}
      size="30vw"
      position="right"
      actionButtonLabel="Save"
      actionButtonFunction={onSave}
      content={ModalContent}
    />
  );
};

export default JohnsHopkinsToolModal;