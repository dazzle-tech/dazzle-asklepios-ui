import React, { useState } from 'react';
import { Divider } from 'rsuite';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import '../styles.less'
import MyTable from '@/components/MyTable';
import AddSocialHistory from './AddSocialHistory';
import Translate from '@/components/Translate';
import { MdModeEdit } from 'react-icons/md';
const SocialHistory = ({ patient, encounter,edit }) => {
    const [open, setOpen] = useState(false);

    // Table Columns
    const columns = [
        { key: '', title: 'CURRENT SMOKER', dataKey: '' },
        { key: '', title: 'START DATE', dataKey: '' },
        { key: '', title: 'AMOUNT', dataKey: '' },
        { key: '', title: 'CIGARETTE TYPE', dataKey: '' },
        { key: '', title: 'PREVIOUS SMOKER', dataKey: '' },
        { key: '', title: 'QUIT DATE', dataKey: '',expandable: true },
        { key: '', title: 'ALCOHOL CONSUMPTION ', dataKey: '' },
        { key: '', title: 'TYPE OF ALCOHOL', dataKey: '' },
        {key: "details",title: <Translate>EDIT</Translate>,  fullText: true,render: rowData => { return (<MdModeEdit title="Edit" size={24} fill="var(--primary-gray)"/>  ) }},
    ];
    return (
        <div className='medical-main-container'>
            <div className='medical-container-div'>
                <div className='medical-header-div'>
                    <div className='medical-title-div'>
                      Social History
                    </div>
                    <div className='bt-right'>
                        <MyButton disabled={edit} prefixIcon={() => <PlusIcon />} onClick={() => setOpen(true)}>Add</MyButton>
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
            </div>
            <AddSocialHistory open={open} setOpen={setOpen}/>
        </div>
    );
};
export default SocialHistory;