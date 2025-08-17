import React from 'react';
import { Divider, Text } from 'rsuite';
import '../styles.less'
import MyTable from '@/components/MyTable';

const RecentTestResults = ({ patient }) => {

    // Table Columns
    const orderColumns = [
        {
            key: 'type',
            title: 'TYPE',
            render: (rowData: any) => <Text>h</Text>
        },
        {
            key: 'name',
            title: 'NAME',
            render: (rowData: any) => <Text>h</Text>
        },
        {
            key: 'resultvalue',
            title: 'Result Value',
            render: (rowData: any) => <Text>h</Text>
        },
        {
            key: 'marker',
            title: 'Marker',
            render: (rowData: any) => <Text>h</Text>
        }
    ];
    return (
        <div className='medical-dashboard-main-container'>
            <div className='medical-dashboard-container-div'>
                <div className='medical-dashboard-header-div'>
                    <div className='medical-dashboard-title-div'>
                        Recent Test Results
                    </div>
                    <div className='bt-right'>
                       <Text className="clickable-link">Full view</Text>
                    </div>
                </div>
                <Divider className="divider-line" />
                <div className='medical-dashboard-table-div'>
                    <MyTable
                        data={[]}
                        columns={orderColumns}
                        height={250}
                        onRowClick={(rowData) => { }}
                    />
                </div>
            </div>
        </div>
    );
};
export default RecentTestResults;