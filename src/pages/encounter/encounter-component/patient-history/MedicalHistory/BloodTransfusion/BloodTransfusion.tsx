import React, { useState } from 'react';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import '../styles.less';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { MdModeEdit } from 'react-icons/md';
import AddBloodTransfusion from './AddBloodTransfusion';
import SectionContainer from '@/components/SectionsoContainer';
const BloodTransfusion = ({ patient, encounter, edit }) => {
  const [open, setOpen] = useState(false);
  console.log('eee', edit);
  // Table Columns
  const columns = [
    { key: '', title: 'FACILITY', dataKey: '' },
    { key: '', title: 'DATE', dataKey: '' },
    { key: '', title: 'INDICATION', dataKey: '' },
    { key: '', title: 'BLOOD PRODUCT TRANSFUSED', dataKey: '', expandable: true },
    { key: '', title: 'SOURCE OF BLOOD', dataKey: '' },
    { key: '', title: 'VOLUME', dataKey: '' },
    { key: '', title: 'UNIT', dataKey: '' },
    { key: '', title: 'COMPLICATION', dataKey: '' },
    {
      key: 'details',
      title: <Translate>EDIT</Translate>,
      fullText: true,
      render: rowData => {
        return <MdModeEdit title="Edit" size={24} fill="var(--primary-gray)" />;
      }
    }
  ];
  return (
    <div className="medical-container-div">
      <SectionContainer
        title={
          <>
            Blood Transfusion
            <MyButton disabled={edit} prefixIcon={() => <PlusIcon />} onClick={() => setOpen(true)}>
              Add
            </MyButton>
          </>
        }
        content={
          <>
            <MyTable data={[]} columns={columns} height={800} loading={false} />
            <AddBloodTransfusion open={open} setOpen={setOpen} />
          </>
        }
      />
    </div>
  );
};
export default BloodTransfusion;
