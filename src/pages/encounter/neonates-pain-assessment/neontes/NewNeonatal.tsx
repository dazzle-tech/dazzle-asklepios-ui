import React, { useState } from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBaby } from '@fortawesome/free-solid-svg-icons';
import '../style.less';

const NewNeonatal = ({ open, setOpen, patient, encounter, edit, refetch }) => {
  const [neonatalData, setNeonatalData] = useState<any[]>([]);
  const [record, setRecord] = useState<any>({});
  // Handle Save
  const handleAddNeonatal = () => {
    setNeonatalData([
      ...neonatalData,
      { ...record, createdAt: new Date().toLocaleString(), createdBy: 'User' }
    ]);
    setOpen(false);
    setRecord({});
    refetch?.();
  };

  // Modal Content
  const content = (
    <Form fluid>
      <div className="flex-row-5-1 ">
        <MyInput
          width={120}
          fieldName="type"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={[
            { label: 'Acute', value: 'Acute' },
            { label: 'Chronic', value: 'Chronic' }
          ]}
          selectDataLabel="label"
          selectDataValue="value"
        />
        <MyInput
          width={120}
          fieldName="cryingIrritability"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={[
            { label: 'None', value: 'None' },
            { label: 'Irritable', value: 'Irritable' }
          ]}
          selectDataLabel="label"
          selectDataValue="value"
        />
        <MyInput
          width={120}
          fieldName="behaviorState"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={[
            { label: 'Calm', value: 'Calm' },
            { label: 'Disturbed', value: 'Disturbed' }
          ]}
          selectDataLabel="label"
          selectDataValue="value"
        />
      </div>
      <div className="flex-row-5-1 ">
        <MyInput
          width={120}
          fieldName="facialExpression"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={[
            { label: 'Relaxed', value: 'Relaxed' },
            { label: 'Tense', value: 'Tense' }
          ]}
          selectDataLabel="label"
          selectDataValue="value"
        />
        <MyInput
          width={120}
          fieldName="extremities"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={[
            { label: 'Normal', value: 'Normal' },
            { label: 'Rigid', value: 'Rigid' }
          ]}
          selectDataLabel="label"
          selectDataValue="value"
        />
        <MyInput
          width={120}
          fieldName="vitalSigns"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={[
            { label: 'Stable', value: 'Stable' },
            { label: 'Unstable', value: 'Unstable' }
          ]}
          selectDataLabel="label"
          selectDataValue="value"
        />
      </div>
      <MyInput
        width={'100%'}
        fieldName="totalScore"
        fieldType="number"
        record={record}
        setRecord={setRecord}
        disabled={true}
      />
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add Neonatal Assessment"
      actionButtonLabel="Save"
      size="27vw"
      actionButtonFunction={handleAddNeonatal}
      position="right"
      isDisabledActionBtn={edit}
      steps={[
        {
          title: 'Add Neonatal Assessment',
          icon: <FontAwesomeIcon icon={faBaby} />
        }
      ]}
      content={content}
    />
  );
};

export default NewNeonatal;
