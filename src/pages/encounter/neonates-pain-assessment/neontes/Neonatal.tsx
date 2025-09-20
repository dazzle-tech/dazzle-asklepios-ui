import React, { useState } from 'react';
import { Checkbox } from 'rsuite';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faPlus } from '@fortawesome/free-solid-svg-icons';
import NewNeonatal from './NewNeonatal';
import '../style.less';

const Neonatal = () => {
  const [neonatalData, setNeonatalData] = useState<any[]>([]);
  const [openNeonatalModal, setOpenNeonatalModal] = useState(false);
  const [showCanceled, setShowCanceled] = useState(true);

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

  const tableButtons = (
    <div className="actions-bar">
      <Checkbox
        checked={!showCanceled}
        onChange={() => {
          setShowCanceled(!showCanceled);
        }}
      >
        Show Cancelled
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

      <NewNeonatal
        open={openNeonatalModal}
        setOpen={setOpenNeonatalModal}
        patient={null}
        encounter={null}
        edit={false}
        refetch={null}
      />
    </>
  );
};

export default Neonatal;
