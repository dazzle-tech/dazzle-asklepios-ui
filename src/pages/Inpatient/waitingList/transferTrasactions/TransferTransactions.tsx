import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { newApEncounter, newApTransferPatient } from '@/types/model-types-constructor';
import React, { useEffect, useState } from 'react';
import { Form, Panel } from 'rsuite';
import { useGetResourceTypeQuery } from '@/services/appointmentService';
import 'react-tabs/style/react-tabs.css';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetTransferTransactionsQuery } from '@/services/encounterService';
import { useDispatch } from 'react-redux';
import { formatDateWithoutSeconds } from "@/utils";
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import { ApTransferPatient } from '@/types/model-types';
import '../styles.less';

const TransferTransactions = () => {
    const dispatch = useDispatch();
    const [encounter, setLocalEncounter] = useState<any>({ ...newApEncounter, discharge: false });
    const inpatientDepartmentListResponse = useGetResourceTypeQuery("4217389643435490");
    const [transferPatient, setTransferPatient] = useState<ApTransferPatient>({
        ...newApTransferPatient,
        fromInpatientDepartmentKey: '',
        toInpatientDepartmentKey: '',
    });
    // Initializing the list request with filters for transfer transactions
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
            { fieldName: 'status_lkey', operator: 'match', value: "6572194150955704" }
        ]
    });
    // Fetching transfer transactions based on the list request
    const {
        data: transferPatientsListResponse,
        isFetching,
        isLoading
    } = useGetTransferTransactionsQuery(listRequest);
    // Setting the encounter based on the selected row data
    const [dateFilter, setDateFilter] = useState({
        fromDate: new Date(),
        toDate: new Date()
    });
    // Setting the confirm date filter for transfer transactions
    const [confirmDateFilter, setConfirmDateFilter] = useState({
        fromDate: new Date(),
        toDate: new Date()
    });
    // Function to update filters in the list request
    const updateFilter = (fieldName: string, operator: string, value?: string | number) => {
        setListRequest(prev => {
            const newFilters = prev.filters.filter(f => f.fieldName !== fieldName);
            if (value !== undefined && value !== null && value !== '') {
                newFilters.push({ fieldName, operator, value: String(value) });
            }
            return { ...prev, filters: newFilters, pageNumber: 1 };
        });
    };
    // Table columns definition
    const tableColumns = [
        {
            key: 'queueNumber',
            title: <Translate>#</Translate>,
            dataKey: 'queueNumber',
            render: rowData => rowData?.patient?.patientMrn
        },
        {
            key: 'fullName',
            title: <Translate>PATIENT NAME</Translate>,
            fullText: true,
            render: rowData => rowData?.patient?.fullName
        },
        {
            key: 'patientMrn',
            title: <Translate>MRN</Translate>,
            fullText: true,
            render: rowData => rowData?.patient.patientMrn
        },
        {
            key: 'genderLkey',
            title: <Translate>Gender</Translate>,
            render: rowData => rowData?.patient?.genderLvalue
                ? rowData?.patient?.genderLvalue?.lovDisplayVale
                : rowData?.patient?.genderLkey
        },
        {
            key: 'fromDepartment',
            title: <Translate>From Ward</Translate>,
            render: rowData => rowData?.fromDepartment?.name
        },
        {
            key: 'toDepartment',
            title: <Translate>To Ward</Translate>,
            render: rowData => rowData?.toDepartment?.name
        },
        {
            key: 'fromRoom',
            title: <Translate>From Room</Translate>,
            render: rowData => rowData?.fromRoomObject?.name
        },
        {
            key: 'fromBed',
            title: <Translate>From Bed</Translate>,
            render: rowData => rowData?.fromBedObject?.name
        },
        {
            key: 'toRoom',
            title: <Translate>To Room</Translate>,
            render: rowData => rowData?.toRoomObject?.name
        },
        {
            key: 'toBed',
            title: <Translate>To Bed</Translate>,
            render: rowData => rowData?.toBedObject?.name
        },
        {
            key: 'confirmedAt',
            title: 'Confirmed By/At',
            expandable: true,
            render: rowData=> rowData?.confirmedAt ? (
                    <>
                        <br />
                        <span className="date-table-style">{formatDateWithoutSeconds(rowData.confirmedAt)}</span>
                    </>
                ) : ' '
        },
        {
            key: 'createdAt',
            title: 'Requested By/At',
            expandable: true,
            render: (row: any) =>
                row?.createdAt ? (
                    <>
                        <br />
                        <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
                    </>
                ) : ' '
        },
    ];
    // Pagination and sorting setup
    const pageIndex = listRequest.pageNumber - 1;
    const rowsPerPage = listRequest.pageSize;
    const totalCount = transferPatientsListResponse?.extraNumeric ?? 0;
    // Handlers for pagination and rows per page changes
    const handlePageChange = (_: unknown, newPage: number) => {
        setListRequest({ ...listRequest, pageNumber: newPage + 1 });
    };
    // Handler for changing the number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setListRequest({
            ...listRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1
        });
    };
    
    // Function to determine if a row is selected based on the encounter key
    const isSelected = rowData => {
        if (rowData && encounter && rowData.key === encounter.key) {
            return 'selected-row';
        } else return '';
    };
    // Filters component for the table
    const filters = () => {
        return (
            <Form layout="inline" fluid className="date-filter-form">
                <MyInput
                    column
                    width={180}
                    fieldType="date"
                    fieldLabel="Request Date"
                    fieldName="fromDate"
                    record={dateFilter}
                    setRecord={setDateFilter}
                />
                <MyInput
                    width={180}
                    column
                    fieldType="date"
                    fieldLabel="To Date"
                    fieldName="toDate"
                    record={dateFilter}
                    setRecord={setDateFilter}
                />
                <MyInput
                    column
                    width={180}
                    fieldType="date"
                    fieldLabel="Confirm Date"
                    fieldName="fromDate"
                    record={confirmDateFilter}
                    setRecord={setConfirmDateFilter}
                />
                <MyInput
                    width={180}
                    column
                    fieldType="date"
                    fieldLabel="To Date"
                    fieldName="toDate"
                    record={confirmDateFilter}
                    setRecord={setConfirmDateFilter}
                />
                <MyInput
                    width={200}
                    column
                    fieldType='select'
                    fieldLabel="From Ward"
                    fieldName="fromInpatientDepartmentKey"
                    selectData={inpatientDepartmentListResponse?.data?.object ?? []}
                    selectDataLabel="name"
                    selectDataValue="key"
                    record={transferPatient}
                    setRecord={setTransferPatient}
                />
                <MyInput
                    width={200}
                    column
                    fieldType='select'
                    fieldLabel="To Ward"
                    fieldName="toInpatientDepartmentKey"
                    selectData={inpatientDepartmentListResponse?.data?.object ?? []}
                    selectDataLabel="name"
                    selectDataValue="key"
                    record={transferPatient}
                    setRecord={setTransferPatient}
                />
            </Form>
        );
    };

    //Effects
    // Date filter
    useEffect(() => {
        if (dateFilter.fromDate && dateFilter.toDate) {
            const from = new Date(dateFilter.fromDate);
            const to = new Date(dateFilter.toDate);
            from.setHours(0, 0, 0, 0);
            to.setHours(23, 59, 59, 999);
            updateFilter('created_at', 'between', `${from.getTime()}_${to.getTime()}`);
        } else {
            updateFilter('created_at', 'between', undefined);
        }
    }, [dateFilter]);

    // Confirm Date filter
    useEffect(() => {
        if (confirmDateFilter.fromDate && confirmDateFilter.toDate) {
            const from = new Date(confirmDateFilter.fromDate);
            const to = new Date(confirmDateFilter.toDate);
            from.setHours(0, 0, 0, 0);
            to.setHours(23, 59, 59, 999);
            updateFilter('confirmed_at', 'between', `${from.getTime()}_${to.getTime()}`);
        } else {
            updateFilter('confirmed_at', 'between', undefined);
        }
    }, [confirmDateFilter]);

    // From Ward filter
    useEffect(() => {
        updateFilter('from_inpatient_department_key', 'match', transferPatient.fromInpatientDepartmentKey || undefined);
    }, [transferPatient.fromInpatientDepartmentKey]);

    // To Ward filter
    useEffect(() => {
        updateFilter('to_inpatient_department_key', 'match', transferPatient.toInpatientDepartmentKey || undefined);
    }, [transferPatient.toInpatientDepartmentKey]);
    // Loader effect
    useEffect(() => {
        if (isLoading || isFetching) {
            dispatch(showSystemLoader());
        } else {
            dispatch(hideSystemLoader());
        }
        return () => {
            dispatch(hideSystemLoader());
        };
    }, [isLoading, isFetching, dispatch]);
    return (
        <Panel>
            <MyTable
                filters={filters()}
                height={600}
                data={transferPatientsListResponse?.object ?? []}
                columns={tableColumns}
                rowClassName={isSelected}
                loading={isLoading || isFetching}
                onRowClick={rowData => {
                    setLocalEncounter(rowData);
                }}
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
            />
        </Panel>
    );
};

export default TransferTransactions;
