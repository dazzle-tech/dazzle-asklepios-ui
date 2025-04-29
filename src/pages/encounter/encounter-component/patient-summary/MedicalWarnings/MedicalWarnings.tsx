import React from 'react';
import { Divider } from 'rsuite';
import '../styles.less'
import MyTable from '@/components/MyTable';
import { useGetWarningsQuery } from '@/services/observationService';
import { initialListRequest } from '@/types/types';
const MedicalWarnings = ({ patient }) => {
    // Define filters to retrieve warnings for a specific patient with a certain status
    const filters = [
        {
            fieldName: 'patient_key',
            operator: 'match',
            value: patient?.key  // Filter warnings by the selected patient key
        },
        {
            fieldName: "status_lkey",
            operator: "Match",   // Filter warnings by a specific status key
            value: "9766169155908512",
        }
    ];

    // Fetch warnings based on the defined filters
    const { data: warningsListResponse, isLoading: isLoading } = useGetWarningsQuery({
        ...initialListRequest,
        filters
    });

    // Table Columns
    const warningsColumns = [
        {
            key: 'warningType',
            title: 'Warning Type',
            render: (rowData: any) => rowData.warningTypeLvalue?.lovDisplayVale || ''
        },
        {
            key: 'warning',
            title: 'Warning',
            render: (rowData: any) => rowData.warning || ''
        },
        {
            key: 'firstTimeRecorded',
            title: 'First Time Recorded',
            render: (rowData: any) =>
                rowData.firstTimeRecorded
                    ? new Date(rowData.firstTimeRecorded).toLocaleString()
                    : 'Undefined'
        }
    ];
    return (
        <div className='medical-dashboard-main-container'>
            <div className='medical-dashboard-container-div'>
                <div className='medical-dashboard-header-div'>
                    <div className='medical-dashboard-title-div'>
                        Medical Warnings
                    </div>
                </div>
                <Divider className="divider-line" />
                <div className='medical-dashboard-table-div'>
                    <MyTable
                        data={warningsListResponse?.object || []}
                        columns={warningsColumns}
                        height={500}
                        loading={isLoading}
                        onRowClick={(rowData) => { }}
                    />
                </div>
            </div>
        </div>
    );
};
export default MedicalWarnings;