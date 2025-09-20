import React, { useState } from 'react';
import { Checkbox } from 'rsuite';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faPlus } from '@fortawesome/free-solid-svg-icons';
import NewFlacc from './NewFlacc';
import '../style.less';

const Flacc = () => {
  const [flaccData, setFlaccData] = useState<any[]>([]);
  const [openFlaccModal, setOpenFlaccModal] = useState(false);
  const [showCanceled, setShowCanceled] = useState(true);
  //
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
  //
  const tableButtons = (
    <>
      <div className="table-buttons-left-part-handle-positions">
        <Checkbox
          checked={!showCanceled}
          onChange={() => {
            setShowCanceled(!showCanceled);
          }}
        >
          Show Cancelled
        </Checkbox>
      </div>

      <div className="bt-right">
        <MyButton onClick={() => setOpenFlaccModal(true)}>
          <FontAwesomeIcon icon={faBan} /> Cancel
        </MyButton>
        <MyButton onClick={() => setOpenFlaccModal(true)}>
          <FontAwesomeIcon icon={faPlus} />
          Add
        </MyButton>
      </div>
    </>
  );

  return (
    <>
      <MyTable
        data={showCanceled ? flaccData : flaccData.filter(r => !r.cancelledBy)}
        columns={flaccColumns}
        tableButtons={tableButtons}
      />

      <NewFlacc
        open={openFlaccModal}
        setOpen={setOpenFlaccModal}
        patient={null}
        encounter={null}
        edit={false}
        refetch={null}
      />
    </>
  );
};

export default Flacc;
