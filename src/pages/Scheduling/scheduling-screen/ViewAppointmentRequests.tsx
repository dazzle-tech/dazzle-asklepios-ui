import React, { useMemo, useState } from 'react';
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import dayjs from 'dayjs';
import { Checkbox, Form, Modal, Tooltip, Whisper } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import { formatDateWithoutSeconds } from '@/utils';

    const formatDateTime = (date?: string) => {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;

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
    age?: number | null;
    gender?: string | null;
    mrn?: string | null;

    createdBy?: string | null;
    createdAt?: number | string | null;

    status?: string | null;

    ageText?: string;
    genderText?: string;
    updatedBy?: string | null;
    updatedAt?: number | string | null;

    otherReason?: string | null;

    _raw?: any;
};

type Props = {
    data: Row[];
    onApprove: (row: Row) => void;
    onReject: (row: Row, rejectReason: string) => Promise<void> | void;
};



const safeStr = (v: any) => {
    if (v === null || typeof v === 'undefined') return '';
    return String(v);
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

const statusColor = (status?: string | null) => {
    const s = String(status || '').toLowerCase();
    if (s === 'rejected') return '#d82124ff';
    if (s === 'confirmed') return '#2dd727ff';
    if (s === 'pending') return '#faad14';
    if (s === 'new-appointment') return '#faad14';
    return '#8f98ab';
};

const ViewAppointmentRequests = ({ data, onApprove, onReject }: Props) => {
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

    // filters
    const [filters, setFilters] = useState<any>({
        fromDate: null,
        toDate: null,
        status: null,
        showRejected: false
    });

    // Reject reason modal
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [pendingRejectRow, setPendingRejectRow] = useState<Row | null>(null);

    const filteredData = useMemo(() => {
        let list = data ?? [];

        if (!filters.showRejected) {
            list = list.filter(x => safeStr(x.status).toLowerCase() !== 'rejected');
        }

        // filter by createdAt
        if (filters.fromDate) {
            const from = dayjs(filters.fromDate).startOf('day');
            list = list.filter(x => {
                if (!x.createdAt) return true;
                const d = dayjs(Number(x.createdAt) || String(x.createdAt));
                return d.isValid() ? (d.isSame(from) || d.isAfter(from)) : true;
            });
        }

        if (filters.toDate) {
            const to = dayjs(filters.toDate).endOf('day');
            list = list.filter(x => {
                if (!x.createdAt) return true;
                const d = dayjs(Number(x.createdAt) || String(x.createdAt));
                return d.isValid() ? (d.isSame(to) || d.isBefore(to)) : true;
            });
        }

        if (filters.status) {
            list = list.filter(x => safeStr(x.status) === safeStr(filters.status));
        }

        return list;
    }, [data, filters]);

    const openRejectModal = (row: Row) => {
        setPendingRejectRow(row);
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
                                <div><b>Name:</b> {row.patientName || '-'}</div>
                                <div><b>MRN:</b> {row.mrn || '-'}</div>
                                <div><b>Age:</b> {row.ageText ?? '-'}</div>
                            </div>
                        </Tooltip>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 600 }}>{row.patientName || '-'}</span>
                        <span style={{ fontSize: 12, color: '#8F98AB' }}>
                            MRN: {row.mrn || '-'}
                        </span>
                    </div>
                </Whisper>
            )
        },
        {
            key: 'age',
            title: 'Age',
            render: (row: Row) => <span>{row.ageText || '-'}</span>
        },
        {
            key: 'createdByAt',
            title: 'Created By\\At',
            render: (row: any) => (
                <>
                    {row.createdBy}
                    <br />
                    <span className="date-table-style">
                        {formatDateTime(row.createdDate)}
                    </span>
                </>
            )
        },
        {
            key: 'rejectedByAt',
            title: 'Rejected By\\At',
            render: (row: Row) => {
                const isRejected = safeStr(row.status).toLowerCase() === 'rejected';
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 600 }}>{isRejected ? (row.updatedBy || '-') : '-'}</span>
                        <span className="date-table-style">{isRejected ? formatTs(row.updatedAt) : '-'}</span>
                    </div>
                );
            }
        },
        {
            key: 'rejectReason',
            title: 'Reject Reason',
            render: (row: Row) => {
                const isRejected = safeStr(row.status).toLowerCase() === 'rejected';
                return (
                    <span style={{ color: isRejected ? '#c10020ff' : '#8F98AB' }}>
                        {isRejected ? (row.otherReason || '-') : '-'}
                    </span>
                );
            }
        },
        {
            key: 'status',
            title: 'Status',
            render: (row: Row) => (
                <MyBadgeStatus contant={row.status || 'Pending'} color={statusColor(row.status)} />
            )
        },
        {
            key: 'actions',
            title: 'Actions',
            align: 'center',
            render: (row: Row) => {
                const s = safeStr(row.status).toLowerCase();
                const isRejected = s === 'rejected';
                const isConfirmed = s === 'confirmed';

                return (
                    <>
                        {/* Approve: only if not rejected & not confirmed */}
                        <FontAwesomeIcon
                            icon={faCircleCheck}
                            style={{ color: '#488934ff', opacity: isRejected || isConfirmed ? 0.35 : 1, cursor: isRejected || isConfirmed ? 'not-allowed' : 'pointer' }}
                            className="action-icon success"
                            onClick={() => {
                                if (!isRejected && !isConfirmed) onApprove(row);
                            }}
                            title="Approve"
                        />

                        {/* Reject: only if not rejected & not confirmed */}
                        <FontAwesomeIcon
                            icon={faCircleXmark}
                            style={{ color: '#c10020ff', opacity: isRejected || isConfirmed ? 0.35 : 1, cursor: isRejected || isConfirmed ? 'not-allowed' : 'pointer' }}
                            className="action-icon danger"
                            onClick={() => {
                                if (!isRejected && !isConfirmed) openRejectModal(row);
                            }}
                            title="Reject"
                        />
                    </>
                );
            }
        }
    ];

    const rowClassName = (rowData: Row) =>
        safeStr(rowData.id) === safeStr(selectedRowId) ? 'selected-row' : '';

    const tablefilters = (
        <div className="field-btn-div">
            <Form layout="inline" fluid>
                <div className="information-desk-filters-handle-position-row">
                    <MyInput
                        column
                        fieldLabel="From Date"
                        fieldType="date"
                        fieldName="fromDate"
                        record={filters}
                        setRecord={setFilters}
                    />
                    <MyInput
                        column
                        fieldLabel="To Date"
                        fieldType="date"
                        fieldName="toDate"
                        record={filters}
                        setRecord={setFilters}
                    />

                    <MyInput
                        column
                        width={200}
                        fieldLabel="Status"
                        fieldType="select"
                        fieldName="status"
                        selectData={[
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
                    />

                    <div className="show-rejected-view-appointment-request">
                        <Checkbox
                            checked={!!filters.showRejected}
                            onChange={(_, checked) =>
                                setFilters((p: any) => ({ ...p, showRejected: checked }))
                            }
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

            {/* Reject Reason Modal */}
            <Modal open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} size="sm">
                <Modal.Header>
                    <Modal.Title>Reject Appointment Request</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form fluid>
                        <MyInput
                            column
                            fieldLabel="Reject Reason"
                            fieldType="textarea"
                            rows={3}
                            fieldName="rejectReason"
                            record={{ rejectReason }}
                            setRecord={(r: any) => setRejectReason(r.rejectReason)}
                            required
                        />
                    </Form>
                </Modal.Body>
                <Modal.Footer style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <MyButton appearance="ghost" onClick={() => setRejectModalOpen(false)}>
                        Cancel
                    </MyButton>
                    <MyButton
                        appearance="primary"
                        onClick={confirmReject}
                        disabled={!rejectReason.trim()}
                    >
                        Confirm Reject
                    </MyButton>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ViewAppointmentRequests;
