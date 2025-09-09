import React, { useState } from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBaby } from '@fortawesome/free-solid-svg-icons';
import '../style.less';

const NewFlacc = ({ open, setOpen, patient, encounter, edit, refetch }) => {
  const [flaccData, setFlaccData] = useState<any[]>([]);
  const [record, setRecord] = useState<any>({});

  // Handle Save
  const handleAddFlacc = () => {
    setFlaccData([
      ...flaccData,
      { ...record, createdAt: new Date().toLocaleString(), createdBy: 'User' }
    ]);
    setOpen(false);
    setRecord({});
    refetch?.();
  };

  // Modal Content
  const content = (
    <Form fluid>
      <div className="flex-row-5 ">
        <MyInput
          width={120}
          fieldName="face"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={[
            { label: 'Relaxed', value: 'Relaxed' },
            { label: 'Grimace', value: 'Grimace' }
          ]}
          selectDataLabel="label"
          selectDataValue="value"
        />
        <MyInput
          width={120}
          fieldName="legs"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={[
            { label: 'Normal', value: 'Normal' },
            { label: 'Restless', value: 'Restless' }
          ]}
          selectDataLabel="label"
          selectDataValue="value"
        />
        <MyInput
          width={120}
          fieldName="activity"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={[
            { label: 'Calm', value: 'Calm' },
            { label: 'Arched', value: 'Arched' }
          ]}
          selectDataLabel="label"
          selectDataValue="value"
        />
      </div>

      <div className="flex-row-5 ">
        <MyInput
          width={120}
          fieldName="cry"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={[
            { label: 'None', value: 'None' },
            { label: 'Moan', value: 'Moan' }
          ]}
          selectDataLabel="label"
          selectDataValue="value"
        />
        <MyInput
          width={120}
          fieldName="consolability"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={[
            { label: 'Content', value: 'Content' },
            { label: 'Difficult', value: 'Difficult' }
          ]}
          selectDataLabel="label"
          selectDataValue="value"
        />
        <MyInput
          width={120}
          fieldName="painDescription"
          fieldType="text"
          record={record}
          setRecord={setRecord}
        />
      </div>

      <MyInput
        width="100%"
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
      title="Add FLACC Record"
      actionButtonLabel="Save"
      size="27vw"
      actionButtonFunction={handleAddFlacc}
      position="right"
      isDisabledActionBtn={edit}
      steps={[
        {
          title: 'Add FLACC Record',
          icon: <FontAwesomeIcon icon={faBaby} />
        }
      ]}
      content={content}
    />
  );
};

export default NewFlacc;
