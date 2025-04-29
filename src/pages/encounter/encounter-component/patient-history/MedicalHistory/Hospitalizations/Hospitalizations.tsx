import React, { useState } from 'react';
import { Divider } from 'rsuite';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import '../styles.less'
import MyTable from '@/components/MyTable';
import AddHospitalizations from './AddHospitalizations';
const Hospitalizations = ({ patient, encounter }) => {
    const [open, setOpen] = useState(false);
    
    // Table Coulmns
    const columns = [
        { key: '', title: 'FACILITY', dataKey: '' },
        { key: '', title: 'REASON', dataKey: '' },
        { key: '', title: 'ADMISSION TYPE', dataKey: '' },
        { key: '', title: 'DATE OF ADMISSION', dataKey: '' },
        { key: '', title: 'LENGTH OF STAY', dataKey: '' },
        { key: '', title: 'OUTCOMES', dataKey: '' },
        { key: '', title: 'MEDICAL INTERVENTIONS PERFORMED', dataKey: '' },
    ];
    return (
        <div className='medical-container-div'>
            <div className='medical-header-div'>
                <div className='medical-title-div'>
                    Hospitalizations
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
            <AddHospitalizations open={open} setOpen={setOpen} />
        </div>
    );
};
export default Hospitalizations;