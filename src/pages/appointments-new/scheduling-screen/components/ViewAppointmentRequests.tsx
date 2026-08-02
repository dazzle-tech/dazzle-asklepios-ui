import React, { useMemo, useState, useEffect } from 'react';
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import dayjs from 'dayjs';
import { Checkbox, Form, Tooltip, Whisper } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import CancellationModal from '@/components/CancellationModal';
import UserDateCell from '@/components/UserDateCell';
import { useGetAllDepartmentsWithoutPaginationQuery } from '@/services/security/departmentService';

const formatDateTime = (value?: number | string | null) => {
    if (value === null || value === undefined || value === '') return '';

    // handle numeric epoch (ms or seconds)
    const n = Number(value);
    if (!Number.isNaN(n) && n > 0) {
        const asMs = n < 10_000_000_000 ? n * 1000 : n; // seconds -> ms
        const d = new Date(asMs);
        return isNaN(d.getTime())
            ? ''
            : d.toLocaleString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
              });
    }

    // fallback for ISO strings
    const d = new Date(String(value));
    if (isNaN(d.getTime())) return String(value);

    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

type Row = {
    id: string;

    patientName?: string;
    gender?: string | null;
    mrn?: string | null;
    facilityKey?: string | null;
    resourceName?: string | null;
    resourceType?: string | null;
    resourceKey?: string | null;
    createdBy?: string | null;
    createdAt?: number | string | null;
    preferredDate?: string | null;

    status?: string | null;

    ageText?: string;
    genderText?: string;
    updatedBy?: string | null;
    updatedAt?: number | string | null;

    otherReason?: string | null;

    _raw?: any;
};

type Props = {
    data?: Row[];
    onApprove: (row: Row) => void;
    onReject: (row: Row, rejectReason: string) => Promise<void> | void;
};

const safeStr = (v: any) => {
    if (v === null || typeof v === 'undefined') return '';
    return String(v);
};

const formatResourceTypeLabel = (value?: string | null) => {
    const s = String(value ?? '').trim();
    if (!s) return '-';

    const cleaned = s.replace(/_/g, ' ').toLowerCase();
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const formatTs = (ts?: number | string | null) => {
    if (!ts) return '-';

    // epoch ms or epoch seconds
    const n = Number(ts);
    if (!Number.isNaN(n) && n > 0) {
        const asMs = n < 10_000_000_000 ? n * 1000 : n;
        const d = dayjs(asMs);
        if (d.isValid()) return d.format('DD-MM-YYYY HH:mm');
    }

    const s = String(ts);
    if (/^\d{12,16}$/.test(s)) {
        const yyyy = s.slice(0, 4);
        const MM = s.slice(4, 6);
        const dd = s.slice(6, 8);
        const HH = s.slice(8, 10);
        const mm = s.slice(10, 12);
        const ss = s.length >= 14 ? s.slice(12, 14) : '00';
        const d2 = dayjs(`${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`);
        if (d2.isValid()) return d2.format('DD-MM-YYYY HH:mm');
    }

    // ISO/string
    const d3 = dayjs(s);
    if (d3.isValid()) return d3.format('DD-MM-YYYY HH:mm');

    return '-';
};

const rowCreatedAtDayjs = (row: Row) => {
    const ts = row.createdAt;
    if (ts === null || typeof ts === 'undefined' || ts === '') return null;
    const n = Number(ts);
    if (!Number.isNaN(n) && n > 0) {
        const ms = n < 10_000_000_000 ? n * 1000 : n;
        const d = dayjs(ms);
        return d.isValid() ? d : null;
    }
    const d = dayjs(String(ts));
    return d.isValid() ? d : null;
};

const isApprovedStatus = (status?: string | null) => {
    const s = safeStr(status)
        .toUpperCase()
        .replace(/-/g, '_');
    return s === 'APPROVED';
};

const applyDateStatusAndRejectedGate = (rows: Row[], f: any) => {
    let list = (rows ?? []).filter(x => !isApprovedStatus(x.status));

    if (!f.showRejected) {
        list = list.filter(x => {
            const s = safeStr(x.status).toLowerCase();
            return s !== 'rejected' && s !== 'cancelled' && s !== 'canceled';
        });
    }

    if (f.fromDate) {
        const from = dayjs(f.fromDate).startOf('day');
        list = list.filter(x => {
            const d = rowCreatedAtDayjs(x);
            if (!d) return false;
            return d.isAfter(from, 'day') || d.isSame(from, 'day');
        });
    }

    if (f.toDate) {
        const to = dayjs(f.toDate).endOf('day');
        list = list.filter(x => {
            const d = rowCreatedAtDayjs(x);
            if (!d) return false;
            return d.isBefore(to, 'day') || d.isSame(to, 'day');
        });
    }

    if (f.status) {
        list = list.filter(x => safeStr(x.status) === safeStr(f.status));
    }

    return list;
};

const statusColor = (status?: string | null) => {
    const s = String(status || '').toLowerCase();
    if (s === 'requested') return '#faad14';
    if (s === 'rejected') return '#d82124ff';
    if (s === 'cancelled' || s === 'canceled') return '#d82124ff';
    if (s === 'approved') return '#2dd727ff';
    if (s === 'confirmed') return '#2dd727ff';
    if (s === 'pending') return '#faad14';
    if (s === 'new-appointment') return '#faad14';
    return '#8f98ab';
};

const ViewAppointmentRequests = ({ data, onApprove, onReject }: Props) => {
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

    const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
    const { data: departments = [] } = useGetAllDepartmentsWithoutPaginationQuery();

    const facilities = useMemo(() => {
        const raw = (facilityListResponse as any)?.object ?? facilityListResponse ?? [];
        return Array.isArray(raw) ? raw : [];
    }, [facilityListResponse]);

    const facilityNameById = useMemo(() => {
        const m = new Map<string, string>();
        facilities.forEach((f: any) => {
            const id = f?.id ?? f?.key;
            const name = f?.name ?? f?.facilityName ?? f?.facility_name ?? '';
            if (id !== null && typeof id !== 'undefined') m.set(String(id), String(name || ''));
        });
        return m;
    }, [facilities]);

    const departmentNameById = useMemo(() => {
    const map = new Map<number, string>();

    (departments ?? []).forEach((d: any) => {
        map.set(Number(d.id), d.name);
    });

    return map;
}, [departments]);


    const getDefaultFilters = () => ({
    fromDate: dayjs().startOf('day').toDate(),
    toDate: dayjs().add(1, 'month').endOf('day').toDate(),
    status: null,
    showRejected: false
    });


    // filters
const [filters, setFilters] = useState<any>(getDefaultFilters);

    // Reject reason modal
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [pendingRejectRow, setPendingRejectRow] = useState<Row | null>(null);

    // ensure modal never receives null object
    const rejectObject = pendingRejectRow ?? ({ rejectReason: '' } as any);

    const filteredData = useMemo(() => applyDateStatusAndRejectedGate(data ?? [], filters), [data, filters]);

    const openRejectModal = (row: Row) => {
        setPendingRejectRow({ ...(row as any), rejectReason: '' });
        setRejectReason('');
        setRejectModalOpen(true);
    };

    const confirmReject = async () => {
        if (!pendingRejectRow) return;
        const reason = rejectReason?.trim();
        if (!reason) return;

        await onReject(pendingRejectRow, reason);

        setRejectModalOpen(false);
        setPendingRejectRow(null);
        setRejectReason('');
    };

    const columns: ColumnConfig[] = [
        {
            key: 'patient',
            title: 'Patient',
            render: (row: Row) => (
                <Whisper
                    placement="top"
                    trigger="hover"
                    speaker={
                        <Tooltip>
                            <div style={{ display: 'grid', gap: 4 }}>
                                <div>
                                    <b>Name:</b> {row.patientName || '-'}
                                </div>
                                <div>
                                    <b>MRN:</b> {row.mrn || '-'}
                                </div>
                            </div>
                        </Tooltip>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 600 }}>{row.patientName || '-'}</span>
                        <span style={{ fontSize: 12, color: '#8F98AB' }}>MRN: {row.mrn || '-'}</span>
                    </div>
                </Whisper>
            )
        },
        {
            key: 'resource',
            title: 'Resource',
            render: (row: Row) => {
                const departmentName =
                    row.resourceType === 'DEPARTMENT'
                        ? departmentNameById.get(Number(row.resourceKey))
                        : null;
                return (
                    <div>
                        <span>
                            {departmentName ||
                                safeStr(row.resourceName) ||
                                '-'}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'facilityKey',
            title: 'Facility',
            render: (row: Row) => {
                const id = safeStr(row.facilityKey).trim();
                const name = id ? facilityNameById.get(id) : '';
                return <span>{(name && String(name).trim()) || id || '-'}</span>;
            }
        },
        {
            key: 'preferredDate',
            title: 'Preferred Date',
            render: (row: Row) => {
                const pd =
                    row.preferredDate ??
                    (row as any)?.preferred_date ??
                    (row?._raw && ((row as any)._raw.preferredDate ?? (row as any)._raw.preferred_date)) ??
                    null;

                if (!pd) return '-';

                // Accept dates in ISO or YYYY-MM-DD format
                const d = dayjs(String(pd));
                return d.isValid() ? d.format('DD-MM-YYYY') : String(pd);
            }
        },
        {
            key: 'createdByAt',
            title: 'Created By\\At',
            expandable: true,
            render: (row: any) => (
                <UserDateCell
                    login={row.createdBy}
                    date={row.createdAt}
                />
            )
        },
        {
            key: 'rejectedByAt',
            title: 'Rejected By\\At',
            expandable: true,
            render: (row: any) => {
                const status = safeStr(row.status).toLowerCase();
                const isRejected = status === 'rejected' || status === 'cancelled' || status === 'canceled';
                if (!isRejected) return '';

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 600 }}>{row.updatedBy || ''}</span>
                        <span className="date-table-style">{formatDateTime(row.updatedAt)}</span>
                    </div>
                );
            }
        },
        {
            key: 'status',
            title: 'Status',
            render: (row: Row) => <MyBadgeStatus contant={row.status || 'Pending'} color={statusColor(row.status)} />
        },
        {
            key: 'actions',
            title: 'Actions',
            align: 'center',
            render: (row: Row) => {
                const s = safeStr(row.status).toLowerCase();
                const isRejected = s === 'rejected' || s === 'cancelled' || s === 'canceled';
                const isConfirmed = s === 'confirmed';
                const isApproved = s === 'approved';

                return (
                    <>
                        <FontAwesomeIcon
                            icon={faCircleCheck}
                            style={{
                                color: '#488934ff',
                                opacity: isRejected || isConfirmed || isApproved ? 0.35 : 1,
                                cursor: isRejected || isConfirmed || isApproved ? 'not-allowed' : 'pointer'
                            }}
                            className="action-icon success"
                            onClick={() => {
                                if (!isRejected && !isConfirmed && !isApproved) onApprove(row);
                            }}
                            title="Approve"
                        />

                        <FontAwesomeIcon
                            icon={faCircleXmark}
                            style={{
                                color: '#c10020ff',
                                opacity: isRejected || isConfirmed || isApproved ? 0.35 : 1,
                                cursor: isRejected || isConfirmed || isApproved ? 'not-allowed' : 'pointer'
                            }}
                            className="action-icon danger"
                            onClick={() => {
                                if (!isRejected && !isConfirmed && !isApproved) openRejectModal(row);
                            }}
                            title="Cancel"
                        />
                    </>
                );
            }
        }
    ];

    const rowClassName = (rowData: Row) => (safeStr(rowData.id) === safeStr(selectedRowId) ? 'selected-row' : '');

    const tablefilters = (
        <div className="field-btn-div">
            <Form layout="inline" fluid>
                <div className="information-desk-filters-handle-position-row">
                    <MyInput column fieldLabel="From Date" fieldType="date" fieldName="fromDate" record={filters} setRecord={setFilters} />
                    <MyInput column fieldLabel="To Date" fieldType="date" fieldName="toDate" record={filters} setRecord={setFilters} />

                    <MyInput
                        column
                        width={200}
                        fieldLabel="Status"
                        fieldType="select"
                        fieldName="status"
                        selectData={[
                            { key: 'REQUESTED', lovDisplayVale: 'REQUESTED' },
                            { key: 'Pending', lovDisplayVale: 'Pending' },
                            { key: 'New-Appointment', lovDisplayVale: 'New-Appointment' },
                            { key: 'Confirmed', lovDisplayVale: 'Confirmed' },
                            { key: 'Rejected', lovDisplayVale: 'Rejected' }
                        ]}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={filters}
                        setRecord={setFilters}
                        searchable={false}
                                disableByField='isValid'

                    />

                    <div className="show-rejected-view-appointment-request">
                        <Checkbox
                            checked={!!filters.showRejected}
                            onChange={(_, checked) => setFilters((p: any) => ({ ...p, showRejected: checked }))}
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
                data={filteredData}
                columns={columns}
                loading={false}
                rowClassName={rowClassName}
                onRowClick={(rowData: Row) => setSelectedRowId(safeStr(rowData.id))}
                filters={tablefilters}
            />

            

            <CancellationModal
                open={rejectModalOpen}
                setOpen={setRejectModalOpen}
                object={rejectObject}
                setObject={setPendingRejectRow}
                title="Cancel Appointment Request"
                fieldLabel="Cancellation Reason"
                fieldName="rejectReason"
                required={true}
                handleCancle={async () => {
                    const reason = String((rejectObject as any).rejectReason || '').trim();
                    if (!reason) return;

                    const { rejectReason, ...rowWithoutReason } = rejectObject as any;

                    await onReject(rowWithoutReason as Row, reason);

                    setRejectModalOpen(false);
                    setPendingRejectRow(null);
                }}
            />
        </div>
    );
};

export default ViewAppointmentRequests;
