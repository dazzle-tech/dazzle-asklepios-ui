import React, { useMemo, useState } from 'react';
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import dayjs from 'dayjs';
import { Checkbox, Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { Whisper, Tooltip } from 'rsuite';
import { useChangeAppointmentStatusMutation, useGetAppointmentsQuery } from '@/services/appointmentService';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useGetAllDepartmentsWithoutPaginationQuery } from '@/services/security/departmentService';

const ViewAppointmentRequests = () => {
    const [record, setRecord] = useState<any>({ Status: 'Pending' });
    const [showRejected, setShowRejected] = useState(false);

    // Fixed Follow Up visit type key (LOV key)
    const FOLLOW_UP_VISIT_TYPE_KEY = '2041067508470007';

    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState<'confirm' | 'reject'>('confirm');

    const { data: appointmentsResponse, isFetching, refetch } = useGetAppointmentsQuery({
        resource_type: null,
        facility_id: null,
        resources: []
    });

    const { data: allDepartments } = useGetAllDepartmentsWithoutPaginationQuery(undefined);

    const departmentNameByKey = useMemo(() => {
        const map = new Map<string, string>();
        (allDepartments ?? []).forEach((d: any) => {
            if (d?.name) {
                if (d?.id !== null && typeof d?.id !== 'undefined') map.set(String(d.id), String(d.name));
                if (d?.key !== null && typeof d?.key !== 'undefined') map.set(String(d.key), String(d.name));
            }
        });
        return map;
    }, [allDepartments]);

    const [changeAppointmentStatus, changeAppointmentStatusMutation] = useChangeAppointmentStatusMutation();

    const followUpAppointments = useMemo(() => {
        const list = appointmentsResponse?.object ?? [];
        const isFollowUp = (a: any) => {
            const visitTypeKey = a?.visitTypeLkey;
            if (visitTypeKey !== null && typeof visitTypeKey !== 'undefined') {
                return String(visitTypeKey) === FOLLOW_UP_VISIT_TYPE_KEY;
            }
            // Fallback if backend sends label/value instead of key
            const label = a?.visitTypeLvalue?.lovDisplayVale ?? '';
            return String(label).toLowerCase().includes('follow') && String(label).toLowerCase().includes('up');
        };
        const allowed = new Set(['pending', 'confirmed', 'rejected']);
        return list.filter((a: any) => {
            const status = String(a?.appointmentStatus ?? '').toLowerCase();
            return isFollowUp(a) && allowed.has(status);
        });
    }, [appointmentsResponse?.object, FOLLOW_UP_VISIT_TYPE_KEY]);

    const filteredAppointments = useMemo(() => {
        const selectedStatus = String(record?.Status ?? '').toLowerCase();
        if (!selectedStatus) return followUpAppointments;
        if (selectedStatus === 'rejected' && !showRejected) return [];
        if (selectedStatus === 'pending' || selectedStatus === 'confirmed' || selectedStatus === 'rejected') {
            return followUpAppointments.filter((a: any) => String(a?.appointmentStatus ?? '').toLowerCase() === selectedStatus);
        }
        return followUpAppointments;
    }, [followUpAppointments, record?.Status, showRejected]);

    const tableData = useMemo(() => {
        return filteredAppointments.map((appointment: any) => {
            const patient = appointment?.patient ?? {};
            const patientName =
                patient?.full_name ||
                patient?.fullName ||
                (patient?.first_name && patient?.last_name
                    ? `${patient.first_name} ${patient.last_name}`.trim()
                    : patient?.first_name || patient?.last_name || 'Unknown Patient');

            const dob = patient?.dob ? new Date(patient.dob) : null;
            const age = dob && !isNaN(dob.getTime()) ? new Date().getFullYear() - dob.getFullYear() : null;
            const gender = patient?.genderLvalue?.lovDisplayVale ?? patient?.gender ?? '-';

            return {
                id: appointment?.key ?? appointment?.id,
                requestedBy: appointment?.createdBy ?? '-',
                requestedAt: appointment?.createdAt ? dayjs(appointment.createdAt).format('YYYY-MM-DD HH:mm') : '-',
                patientName,
                age,
                gender,
                department:
                    departmentNameByKey.get(String(appointment?.departmentKey ?? '')) ||
                    appointment?.department?.name ||
                    '-',
                appointmentDateTime: appointment?.appointmentStart ?? null,
                status: appointment?.appointmentStatus ?? 'Pending',
                _raw: appointment
            };
        });
    }, [filteredAppointments, departmentNameByKey]);

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
            render: row => row.appointmentDateTime ? dayjs(row.appointmentDateTime).format('DD-MM-YYYY HH:mm') : '-',
        },
        {
            key: 'status',
            title: 'Status',
            render: row => {
                const displayStatus = row.status;
                const s = String(displayStatus).toLowerCase();
                const color =
                    s === 'rejected' ? '#d82124ff' : s === 'confirmed' ? '#2dd727ff' : '#faad14';
                return <MyBadgeStatus contant={displayStatus} color={color} />;
            },
        },
        {
            key: 'actions',
            title: 'Actions',
            align: 'center',
            render: row => {
                const isBusy = changeAppointmentStatusMutation.isLoading;
                const isPending = String(row.status).toLowerCase() === 'pending';
                return (
                    <>
                        <FontAwesomeIcon
                            icon={faCircleCheck}
                            style={{ color: !isPending || isBusy ? '#9ca3af' : '#488934ff' }}
                            className="action-icon success"
                            onClick={() => {
                                if (!isPending || isBusy) return;
                                setSelectedAppointment(row._raw);
                                setModalAction('confirm');
                                setModalOpen(true);
                            }}
                            title="Click to Confirm"
                        />
                        <FontAwesomeIcon
                            icon={faCircleXmark}
                            style={{ color: !isPending || isBusy ? '#9ca3af' : '#c10020ff' }}
                            className="action-icon danger"
                            onClick={() => {
                                if (!isPending || isBusy) return;
                                setSelectedAppointment(row._raw);
                                setModalAction('reject');
                                setModalOpen(true);
                            }}
                            title="Click to Reject"
                        />
                    </>
                );
            },
        },
    ];

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
                        selectData={[
                            { key: 'Pending', lovDisplayVale: 'Pending' },
                            { key: 'Confirmed', lovDisplayVale: 'Confirmed' },
                            { key: 'Rejected', lovDisplayVale: 'Rejected' },
                        ]}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={record}
                        setRecord={setRecord}
                        searchable={false}
                    />
                    <div className="show-rejected-view-appointment-request">
                        <Checkbox
                            checked={showRejected}
                            onChange={(_, checked) => setShowRejected(checked)}
                        >
                            Show Rejected
                        </Checkbox>
                    </div>
                </div>
            </Form>
        </div>
    );

    return (
        <div>
            <MyTable
                data={tableData}
                columns={columns}
                loading={isFetching}
                filters={tablefilters}
            />
            <DeletionConfirmationModal
                open={modalOpen}
                setOpen={setModalOpen}
                actionType={modalAction}
                actionButtonFunction={async () => {
                    if (!selectedAppointment) return;
                    const nextStatus = modalAction === 'confirm' ? 'Confirmed' : 'Rejected';
                    try {
                        await changeAppointmentStatus({
                            ...selectedAppointment,
                            appointmentStatus: nextStatus
                        }).unwrap();
                        setModalOpen(false);
                        setSelectedAppointment(null);
                        refetch();
                    } catch (e) {
                        // Keep modal open; backend error handling is done globally via RTK BaseQuery/toasts
                    }
                }}
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
