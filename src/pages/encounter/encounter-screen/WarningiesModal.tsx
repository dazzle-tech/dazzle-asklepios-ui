import React, { useEffect, useState } from 'react';
import './styles.less';
import Translate from '@/components/Translate';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import { initialListRequest, ListRequest } from '@/types/types';
import {
    useGetWarningsQuery
} from '@/services/observationService';
import {
    IconButton,
    Table,
    Checkbox,
} from 'rsuite';
import { faWarning } from '@fortawesome/free-solid-svg-icons';
import MyTable from '@/components/MyTable';
const { Column, HeaderCell, Cell } = Table;

const WarningiesModal = ({ open, setOpen, patient }) => {
    const [showCanceled, setShowCanceled] = useState(true);

    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient.key
            },
            {
                fieldName: 'status_lkey',
                operator: showCanceled ? 'notMatch' : 'match',
                value: '3196709905099521'
            }
        ]
    });
    const { data: warningsListResponse, refetch: fetchwarning ,isLoading} = useGetWarningsQuery(listRequest);

    const tableColumns = [
        {
            key: "warningTypeLkey",
            dataKey: "warningTypeLkey",
            title: <Translate>Warning Type</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.warningTypeLvalue?.lovDisplayVale;
            }
        },
        {
            key: "severityLkey",
            dataKey: "severityLkey",
            title: <Translate>Severity</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.severityLvalue?.lovDisplayVale;
            }
        },
        {
            key: "firstTimeRecorded",
            dataKey: "firstTimeRecorded",
            title: <Translate>First Time Recorded</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.firstTimeRecorded
                    ? new Date(rowData.firstTimeRecorded).toLocaleString()
                    : 'Undefind'
                    ;
            }
        },
        {
            key: "sourceOfInformationLkey",
            dataKey: "sourceOfInformationLkey",
            title: <Translate>Source of information</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.sourceOfInformationLvalue?.lovDisplayVale || 'BY Patient';
            }
        },
        {
            key: "warning",
            dataKey: "warning",
            title: <Translate>Warning</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.warning;
            }
        },
        {
            key: "actionTake",
            dataKey: "actionTake",
            title: <Translate>Action Taken</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.actionTake;
            }
        },
        {
            key: "notes",
            dataKey: "notes",
            title: <Translate>Notes</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.notes;
            }
        },
        {
            key: "statusLkey",
            dataKey: "statusLkey",
            title: <Translate>Status</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.statusLvalue?.lovDisplayVale;
            }
        },

        {
            key: "createdAt",
            dataKey: "createdAt",
            title: <Translate>Created At</Translate>,
            flexGrow: 1,
            expandable: true,
            render: (rowData: any) => {
                return rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : '';
            }
        },
        {
            key: "createdBy",
            dataKey: "createdBy",
            title: <Translate>Created By</Translate>,
            flexGrow: 1,
            expandable: true,

        },
        {
            key: "updatedAt",
            dataKey: "updatedAt",
            title: <Translate>Updated At</Translate>,
            flexGrow: 1,
            expandable: true,
            render: (rowData: any) => {
                return rowData.updatedAt ? new Date(rowData.updatedAt).toLocaleString() : '';
            }
        },
        {
            key: "updatedBy",
            dataKey: "updatedBy",
            title: <Translate>Updated By</Translate>,
            flexGrow: 1,
            expandable: true,

        },
        {
            key: "resolvedAt",
            dataKey: "resolvedAt",
            title: <Translate>Resolved At</Translate>,
            flexGrow: 1,
            expandable: true,
            render: (rowData: any) => {
                if (rowData.statusLkey != '9766169155908512') {
                    return rowData.resolvedAt ? new Date(rowData.resolvedAt).toLocaleString() : ''
                }
            }
        },
        {
            key: "resolvedBy",
            dataKey: "resolvedBy",
            title: <Translate>Resolved By</Translate>,
            flexGrow: 1,
            expandable: true,
            render: (rowData: any) => {
                return null;
            }
        },
        {
            key: "deletedAt",
            dataKey: "deletedAt",
            title: <Translate>Cancelled At</Translate>,
            flexGrow: 1,
            expandable: true,
            render: (rowData: any) => {
                return rowData.deletedAt ? new Date(rowData.deletedAt).toLocaleString() : '';
            }
        },
        {
            key: "deletedBy",
            dataKey: "deletedBy",
            title: <Translate>Cancelled By</Translate>,
            flexGrow: 1,
            expandable: true,

        },
        {
            key: "cancellationReason",
            dataKey: "cancellationReason",
            title: <Translate>Cancelliton Reason</Translate>,
            flexGrow: 1,
            expandable: true

        }

    ]
    const pageIndex = listRequest.pageNumber - 1;

    // how many rows per page:
    const rowsPerPage = listRequest.pageSize;

    // total number of items in the backend:
    const totalCount = warningsListResponse?.extraNumeric ?? 0;

    // handler when the user clicks a new page number:
    const handlePageChange = (_: unknown, newPage: number) => {
        // MUI gives you a zero-based page, so add 1 for your API

        setListRequest({ ...listRequest, pageNumber: newPage + 1 });
    };

    // handler when the user chooses a different rows-per-page:
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {

        setListRequest({
            ...listRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // reset to first page
        });
    };
    return (<>
        <MyModal
            position='right'
            size='900px'
            title="Warning"
            open={open}
            setOpen={setOpen}
            steps={[{ title: "Warning", icon: <FontAwesomeIcon icon={faWarning} /> }]}
            content={<>
                <div>
                    <Checkbox
                        checked={!showCanceled}
                        onChange={() => {


                            setShowCanceled(!showCanceled);
                        }}
                    >
                        Show Cancelled
                    </Checkbox>


                </div>
                <MyTable
                    columns={tableColumns}
                    data={warningsListResponse?.object || []}
                   
                    sortColumn={listRequest.sortBy}
                    sortType={listRequest.sortType}
                    onSortChange={(sortBy, sortType) => {
                        setListRequest({ ...listRequest, sortBy, sortType });
                    }}
                    page={pageIndex}
                    rowsPerPage={rowsPerPage}
                    totalCount={totalCount}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    loading={isLoading}
                />
            </>}
        ></MyModal>
    </>);
}
export default WarningiesModal