import React, { useState } from 'react';
import { Divider } from 'rsuite';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import '../styles.less'
import MyTable from '@/components/MyTable';
import AddFamilyHistory from './AddFamilyHistory';
const FamilyHistory = ({ patient, encounter }) => {
    const [open, setOpen] = useState(false);


    const columns = [
        { key: '', title: 'CONDITION', dataKey: '' },
        { key: '', title: 'RELATION', dataKey: '' },
        { key: '', title: 'INHERITED DISEASES', dataKey: '' },
    ];
    return (
        <div className='medical-container-div'>
            <div className='medical-header-div'>
                <div className='medical-title-div'>
                    Family History
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
            <AddFamilyHistory open={open} setOpen={setOpen} />
        </div>
    );
};
export default FamilyHistory;