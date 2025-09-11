import React, { useState } from 'react';
import { Divider } from 'rsuite';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import '../styles.less';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { MdModeEdit } from 'react-icons/md';
import AddPatientProblem from './AddPatientProblem';
const PatientProblems = ({ patient, encounter, edit }) => {
  const [open, setOpen] = useState(false);

  // Table Columns
  const columns = [
    { key: '', title: 'CONDITION', dataKey: '' },
    { key: '', title: 'DATE OF DIAGNOSIS', dataKey: '' },
    { key: '', title: 'TYPE', dataKey: '' },
    { key: '', title: 'DATE OF RESOLUTION', dataKey: '' },
    { key: '', title: 'SOURCE OF INFORMATION', dataKey: '' },
    { key: '', title: 'STATUS', dataKey: '' },
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
      <div className="medical-header-div">
        <div className="medical-title-div">Patient’s Problems</div>
        <div className="bt-right">
          <MyButton disabled={edit} prefixIcon={() => <PlusIcon />} onClick={() => setOpen(true)}>
            Add
          </MyButton>
        </div>
      </div>
      <Divider className="divider-line" />
      <div className="medical-table-div">
        <MyTable data={[]} columns={columns} height={800} loading={false} />
      </div>
      <AddPatientProblem open={open} setOpen={setOpen} />
    </div>
  );
};
export default PatientProblems;
