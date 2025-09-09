import React, { useState } from 'react';
import { Checkbox, Form } from 'rsuite';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faPlus, faBaby } from '@fortawesome/free-solid-svg-icons';
import './style.less';

const NeonatalTab = () => {
  const [neonatalData, setNeonatalData] = useState<any[]>([]);
  const [openNeonatalModal, setOpenNeonatalModal] = useState(false);
  const [showCanceled, setShowCanceled] = useState(true);
  const [record, setRecord] = useState<any>({});

  const neonatalColumns = [
    { key: 'totalScore', title: 'Total Score' },
    { key: 'type', title: 'Type' },
    { key: 'cryingIrritability', title: 'Crying Irritability' },
    { key: 'behaviorState', title: 'Behavior State' },
    { key: 'facialExpression', title: 'Facial Expression' },
    { key: 'extremities', title: 'Extremities' },
    { key: 'vitalSigns', title: 'Vital Signs' },
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

  const handleAddNeonatal = () => {
    setNeonatalData([
      ...neonatalData,
      { ...record, createdAt: new Date().toLocaleString(), createdBy: 'User' }
    ]);
    setOpenNeonatalModal(false);
    setRecord({});
  };

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
        <MyButton onClick={() => setOpenNeonatalModal(false)}>
          <FontAwesomeIcon icon={faBan} />
          Cancel
        </MyButton>

        <MyButton onClick={() => setOpenNeonatalModal(true)}>
          <FontAwesomeIcon icon={faPlus} />
          Add
        </MyButton>
      </div>
    </div>
  );

  return (
    <>
      <MyTable
        data={showCanceled ? neonatalData : neonatalData.filter(r => !r.cancelledBy)}
        columns={neonatalColumns}
        tableButtons={tableButtons}
      />

      <MyModal
        open={openNeonatalModal}
        setOpen={setOpenNeonatalModal}
        title="Add Neonatal Record"
        actionButtonLabel="Save"
        position="right"
        size="27vw"
        actionButtonFunction={handleAddNeonatal}
        content={() => (
          <Form fluid>
            <div className="flex-row-5 ">
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
            <div className="flex-row-5">
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
        )}
        steps={[{ title: 'Add Neonatal Record', icon: <FontAwesomeIcon icon={faBaby} /> }]}
      />
    </>
  );
};

export default NeonatalTab;
