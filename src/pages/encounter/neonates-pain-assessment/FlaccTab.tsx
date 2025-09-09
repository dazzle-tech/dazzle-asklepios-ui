import React, { useState } from 'react';
import { Checkbox, Form } from 'rsuite';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faPlus, faBaby } from '@fortawesome/free-solid-svg-icons';
import './style.less';

const FlaccTab = () => {
  const [flaccData, setFlaccData] = useState<any[]>([]);
  const [openFlaccModal, setOpenFlaccModal] = useState(false);
  const [showCanceled, setShowCanceled] = useState(true);
  const [record, setRecord] = useState<any>({});

  const flaccColumns = [
    { key: 'totalScore', title: 'Total Score' },
    { key: 'face', title: 'Face' },
    { key: 'legs', title: 'Legs' },
    { key: 'activity', title: 'Activity' },
    { key: 'cry', title: 'Cry' },
    { key: 'consolability', title: 'Consolability' },
    {
      key: 'expand',
      title: 'Details',
      expandable: true,
      render: row => (
        <>
          <div>Created By: {row.createdBy}</div>
          <div>Created At: {row.createdAt}</div>
          {row.cancelledBy && (
            <>
              <div>Cancelled By: {row.cancelledBy}</div>
              <div>Cancelled At: {row.cancelledAt}</div>
              <div>Reason: {row.cancelReason}</div>
            </>
          )}
        </>
      )
    }
  ];

  const handleAddFlacc = () => {
    setFlaccData([
      ...flaccData,
      { ...record, createdAt: new Date().toLocaleString(), createdBy: 'User' }
    ]);
    setOpenFlaccModal(false);
    setRecord({});
  };

  //
  const tableButtons = (
    <div className="actions-bar">
      <Checkbox
        checked={!showCanceled}
        onChange={() => {
          setShowCanceled(!showCanceled);
        }}
      >
        Show canceled test
      </Checkbox>
      <div className="gap-5">
        <MyButton onClick={() => setOpenFlaccModal(false)}>
          <FontAwesomeIcon icon={faBan} />
          Cancel
        </MyButton>

        <MyButton onClick={() => setOpenFlaccModal(true)}>
          <FontAwesomeIcon icon={faPlus} />
          Add
        </MyButton>
      </div>
    </div>
  );

  return (
    <>
      <MyTable
        data={showCanceled ? flaccData : flaccData.filter(r => !r.cancelledBy)}
        columns={flaccColumns}
        tableButtons={tableButtons}
      />

      <MyModal
        open={openFlaccModal}
        setOpen={setOpenFlaccModal}
        title="Add FLACC Record"
        actionButtonLabel="Save"
        size="27vw"
        actionButtonFunction={handleAddFlacc}
        position={'right'}
        content={() => (
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
        )}
        steps={[{ title: 'Add FLACC Record', icon: <FontAwesomeIcon icon={faBaby} /> }]}
      />
    </>
  );
};

export default FlaccTab;
