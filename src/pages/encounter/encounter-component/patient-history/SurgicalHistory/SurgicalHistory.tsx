import React, { useState } from 'react';
import { Divider } from 'rsuite';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import '../styles.less'
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { MdModeEdit } from 'react-icons/md';import AddSurgicalHistory from './AddSurgicalHistory';
const SurgicalHistory = ({ patient, encounter }) => {
    const [open, setOpen] = useState(false);

    // Table Columns
    const columns = [
        { key: '', title: 'SURGERY', dataKey: '' },
        { key: '', title: 'OTHER', dataKey: '' },
        { key: '', title: 'DATE OF SURGERY', dataKey: '' },
        { key: '', title: 'FACILITY', dataKey: '' },
        { key: '', title: 'COMPLICATIONS', dataKey: '' },
        { key: '', title: 'TYPE OF ANESTHESIA USED', dataKey: '' },
        { key: '', title: 'ADVERSE REACTIONS ', dataKey: '' ,expandable: true,},
        { key: '', title: 'IMPLANTS OR DEVICES', dataKey: '' },
        {key: "details",title: <Translate>EDIT</Translate>,  fullText: true,render: rowData => { return (<MdModeEdit title="Edit" size={24} fill="var(--primary-gray)"/>  ) }},

    ];
    return (
        <div className='medical-main-container'>
            <div className='medical-container-div'>
                <div className='medical-header-div'>
                    <div className='medical-title-div'>
                        Surgical History
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
                <AddSurgicalHistory open={open} setOpen={setOpen} />
            </div>
        </div>
    );
};
export default SurgicalHistory;