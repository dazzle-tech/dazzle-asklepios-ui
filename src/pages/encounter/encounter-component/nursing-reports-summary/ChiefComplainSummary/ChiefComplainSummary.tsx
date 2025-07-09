import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import {  useGetChiefComplainQuery } from '@/services/encounterService';
import { Divider, Text } from 'rsuite';
import MyTable from '@/components/MyTable';
import FullViewTable from './FullViewTable';

const ChiefComplainSummary = ({ patient, encounter }) => {
const[open,setOpen]=useState(false);
    // Initialize list request with default filters
    const [chiefComplaintListRequest, setChiefComplainListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
            , {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
            },
            {
                fieldName: 'encounter_key',
                operator: 'match',
                value: encounter?.key
            }
        ],
    });

    // Fetch the list of Chief Complain based on the provided request, and provide a refetch function
    const { data: chiefComplainResponse, refetch, isLoading } = useGetChiefComplainQuery(chiefComplaintListRequest);

    // Change page event handler
    const handlePageChange = (_: unknown, newPage: number) => {
        setChiefComplainListRequest({ ...chiefComplaintListRequest, pageNumber: newPage + 1 });
    };
    // Change number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChiefComplainListRequest({
            ...chiefComplaintListRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // Reset to first page
        });
    };

    // Effects
    useEffect(() => {
        setChiefComplainListRequest((prev) => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined,
                },
                ...(patient?.key && encounter?.key
                    ? [
                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                        {
                            fieldName: 'encounter_key',
                            operator: 'match',
                            value: encounter?.key
                        },
                    ]
                    : []),
            ],
        }));
    }, [patient?.key, encounter?.key]);

    // Pagination values
    const pageIndex = chiefComplaintListRequest.pageNumber - 1;
    const rowsPerPage = chiefComplaintListRequest.pageSize;
    const totalCount = chiefComplainResponse?.extraNumeric ?? 0;

    // Table Column 
    const columns = [
        {
            key: 'chiefComplaint',
            title: 'Chief Complain',

        },
        {
            key: 'provocation',
            title: 'Provocation',
        },
        {
            key: 'palliation',
            title: 'Palliation',
        },
        {
            key: 'qualityLkey',
            title: 'Quality',
            render: (rowData: any) =>
                rowData?.qualityLvalue
                    ? rowData.qualityLvalue.lovDisplayVale
                    : rowData.qualityLkey,
        },

    ];


    return (
        <div className='medical-dashboard-main-container'>
            <div className='medical-dashboard-container-div'>
                <div className='medical-dashboard-header-div'>
                    <div className='medical-dashboard-title-div'>
                         Chief Complain 
                    </div>
                    <div className='bt-right'>
                        <Text onClick={() => setOpen(true)} className="clickable-link">Full view</Text>
                    </div>
                </div>
                <Divider className="divider-line" />
                <div className='medical-dashboard-table-div'>
                    <MyTable
                        data={chiefComplainResponse?.object ?? []}
                        columns={columns}
                        height={200}
                        loading={isLoading}
                        page={pageIndex}
                        rowsPerPage={rowsPerPage}
                        totalCount={totalCount}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                    />
                </div>
            </div>
            <FullViewTable
              open={open}
              setOpen={setOpen}
              list={chiefComplainResponse?.object}
              isLoading={isLoading}
              pageIndex={pageIndex} 
              rowsPerPage={rowsPerPage}
              totalCount={totalCount}
              handlePageChange={handlePageChange}
              handleRowsPerPageChange={handleRowsPerPageChange}
              />
        </div>

    );
};
export default ChiefComplainSummary;