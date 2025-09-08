import React, { useState } from 'react';
import { Tabs, Form, Checkbox } from 'rsuite';
import { faBaby, faBan, faPlus } from '@fortawesome/free-solid-svg-icons';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './style.less';

const NeonatesPainAssessment = () => {
  // Data state
  const [flaccData, setFlaccData] = useState<any[]>([]);
  const [neonatalData, setNeonatalData] = useState<any[]>([]);
  const [showCanceled, setShowCanceled] = useState(true);

  // Modal state
  const [openFlaccModal, setOpenFlaccModal] = useState(false);
  const [openNeonatalModal, setOpenNeonatalModal] = useState(false);
  const [record, setRecord] = useState<any>({});

  // Flacc Columns configs
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
  // Neonatal Columns configs
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
  //
  const tableCols = (
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
  //
  const tableCols2 = (
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
  //
  const handleAddFlacc = () => {
    setFlaccData([
      ...flaccData,
      { ...record, createdAt: new Date().toLocaleString(), createdBy: 'User' }
    ]);
    setOpenFlaccModal(false);
    setRecord({});
  };
  //
  const handleAddNeonatal = () => {
    setNeonatalData([
      ...neonatalData,
      { ...record, createdAt: new Date().toLocaleString(), createdBy: 'User' }
    ]);
    setOpenNeonatalModal(false);
    setRecord({});
  };

  return (
    <Tabs defaultActiveKey="flacc">
      {/* ========== FLACC TAB ========== */}
      <Tabs.Tab eventKey="flacc" title="FLACC Pain Scale">
        <MyTable
          data={showCanceled ? flaccData : flaccData.filter(r => !r.cancelledBy)}
          columns={flaccColumns}
          tableButtons={tableCols}
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
      </Tabs.Tab>

      {/* ========== NEONATAL TAB ========== */}
      <Tabs.Tab eventKey="neonatal" title="Neonatal Pain Scale">
        <MyTable
          data={showCanceled ? neonatalData : neonatalData.filter(r => !r.cancelledBy)}
          columns={neonatalColumns}
          tableButtons={tableCols2}
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
      </Tabs.Tab>
    </Tabs>
  );
};

export default NeonatesPainAssessment;
