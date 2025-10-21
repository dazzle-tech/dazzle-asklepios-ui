import React, { useState } from 'react';
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { Box } from '@mui/material';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import dayjs from 'dayjs';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Checkbox, Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { Whisper, Tooltip } from 'rsuite';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

// Initial Sample Data
const initialData = [
    {
        id: 1,
        requestedBy: 'Dr. Ahmed',
        requestedAt: '2025-10-20 10:00',
        patientName: 'Ali Farouk',
        age: 32,
        gender: 'Male',
        department: 'Cardiology',
        appointmentDateTime: '2025-10-25 09:00',
        status: 'Requested',
    },
    {
        id: 2,
        requestedBy: 'Dr. Sara',
        requestedAt: '2025-10-19 14:00',
        patientName: 'Laila Khalil',
        age: 28,
        gender: 'Female',
        department: 'Neurology',
        appointmentDateTime: '2025-10-24 11:00',
        status: 'Confirmed',
    },
];

const ViewAppointmentRequests = () => {
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
    const [record, setRecord] = useState<any>({});
    const [modalOpen, setModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState<'confirm' | 'reject'>('confirm');
    const [data, setData] = useState(initialData); // ← local data state

    // Fetch LOV
    const { data: statusLovQueryResponse } = useGetLovValuesByCodeQuery('DIAG_ORD_STATUS');

    const statusMap = {
        ORD_STAT_REQST: 'Requested',
        ORD_STAT_CONF: 'Confirmed',
        DIAG_ORDER_STAT_REJCT: 'Rejected',
    };

    const allowedStatuses = ['DIAG_ORDER_STAT_REJCT', 'DIAG_ORDER_STAT_CONFRM', 'ORD_STAT_REQST'];

    const filteredStatusData =
        statusLovQueryResponse?.object?.filter(item => allowedStatuses.includes(item.key)) ?? [];

    // Handle Click on Action Icon
    const handleActionClick = (id: number, action: 'confirm' | 'reject') => {
        setSelectedRowId(id);
        setModalAction(action);
        setModalOpen(true);
    };

    // Handle Confirm in Modal
    const handleConfirmAction = () => {
        setData(prevData =>
            prevData.map(item => {
                if (item.id === selectedRowId) {
                    const newStatus = modalAction === 'confirm' ? 'Confirmed' : 'Rejected';
                    return { ...item, status: newStatus };
                }
                return item;
            })
        );
        setModalOpen(false);
    };

    // Table Columns
    const columns: ColumnConfig[] = [
        {
            key: 'requestedByAt',
            title: 'Requested By\\At',
            render: row => (
                <>
                    {row.requestedBy}
                    <br />
                    <span className="date-table-style">{row.requestedAt}</span>
                </>
            ),
        },
        {
            key: 'patientName',
            title: 'Patient Name',
            render: row => (
                <Whisper
                    placement="top"
                    trigger="hover"
                    speaker={
                        <Tooltip>
                            Age: {row.age} <br />
                            Gender: {row.gender}
                        </Tooltip>
                    }
                >
                    <span className="hoverable-text">{row.patientName}</span>
                </Whisper>
            ),
        },
        {
            key: 'department',
            title: 'Department',
            dataKey: 'department',
        },
        {
            key: 'appointmentDateTime',
            title: 'Appointment Date Time',
            render: row => dayjs(row.appointmentDateTime).format('DD-MM-YYYY HH:mm'),
        },
        {
            key: 'status',
            title: 'Status',
            render: row => {
                const displayStatus = row.status;
                const color =
                    displayStatus === 'Rejected'
                        ? '#d82124ff'
                        : displayStatus === 'Confirmed'
                            ? '#2dd727ff'
                            : '#faad14';
                return <MyBadgeStatus contant={displayStatus} color={color} />;
            },
        },
        {
            key: 'actions',
            title: 'Actions',
            align: 'center',
            render: row => {
                const handleConfirm = () => handleActionClick(row.id, 'confirm');
                const handleReject = () => handleActionClick(row.id, 'reject');

                return (<>
                    <FontAwesomeIcon
                        icon={faCircleCheck}
                        style={{ color: '#488934ff' }}
                        className="action-icon success"
                        onClick={handleConfirm}
                        title="Click to Confirm"
                    />
                    <FontAwesomeIcon
                        icon={faCircleXmark}
                        style={{ color: '#c10020ff' }}
                        className="action-icon danger"
                        onClick={handleReject}
                        title="Click to Reject"
                    />

                    <FontAwesomeIcon icon={faArrowUp}
                        style={{ color: 'gray' }}
                        className="action-icon"
                        title="Change" />


                </>);
            },
        }
    ];

    const isSelectedRow = rowData => (rowData.id === selectedRowId ? 'selected-row' : '');

    const tablefilters = (
        <div className="field-btn-div">
            <Form layout="inline" fluid>
                <div className="information-desk-filters-handle-position-row">
                    <MyInput
                        column
                        fieldLabel="From Date"
                        fieldType="date"
                        fieldName="fromDate"
                        record={record}
                        setRecord={setRecord}
                    />
                    <MyInput
                        column
                        fieldLabel="To Date"
                        fieldType="date"
                        fieldName="toDate"
                        record={record}
                        setRecord={setRecord}
                    />
                    <MyInput
                        column
                        width={200}
                        fieldLabel="Status"
                        fieldType="select"
                        fieldName="Status"
                        selectData={statusLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={record}
                        setRecord={setRecord}
                        searchable={false}
                    />
                    <div className="show-rejected-view-appointment-request">
                        <Checkbox>Show Rejected</Checkbox>
                    </div>
                </div>
            </Form>
        </div>
    );

    return (
        <div>
            <MyTable
                data={data}
                columns={columns}
                loading={false}
                rowClassName={isSelectedRow}
                onRowClick={rowData => setSelectedRowId(rowData.id)}
                filters={tablefilters}
            />
            <DeletionConfirmationModal
                open={modalOpen}
                setOpen={setModalOpen}
                actionType={modalAction}
                actionButtonFunction={handleConfirmAction}
                confirmationQuestion={
                    modalAction === 'confirm'
                        ? 'Are you sure you want to confirm this appointment?'
                        : 'Are you sure you want to reject this appointment?'
                }
            />
        </div>
    );
};

export default ViewAppointmentRequests;
