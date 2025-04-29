import React, { useState } from 'react';
import { Divider } from 'rsuite';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import '../styles.less'
import MyTable from '@/components/MyTable';
import AddPatientProblem from './AddPatientProblem';
const PatientProblems = ({ patient, encounter }) => {
    const [open, setOpen] = useState(false);

    // Table Columns
    const columns = [
        { key: '', title: 'CONDITION', dataKey: '' },
        { key: '', title: 'DATE OF DIAGNOSIS', dataKey: '' },
        { key: '', title: 'TYPE', dataKey: '' },
        { key: '', title: 'DATE OF RESOLUTION', dataKey: '' },
        { key: '', title: 'SOURCE OF INFORMATION', dataKey: '' },
        { key: '', title: 'STATUS', dataKey: '' },
    ];
    return (
        <div className='medical-container-div'>
            <div className='medical-header-div'>
                <div className='medical-title-div'>
                    Patient’s Problems
                </div>
                <div className='bt-right'>
                    <MyButton prefixIcon={() => <PlusIcon />} onClick={() => setOpen(true)}>Add</MyButton>
                </div>
            </div>
            <Divider className="divider-line" />
            <div className='medical-table-div'>
                <MyTable
                    data={[]}
                    columns={columns}
                    height={800}
                    loading={false}
                />
            </div>
            <AddPatientProblem open={open} setOpen={setOpen}/>
        </div>
    );
};
export default PatientProblems;