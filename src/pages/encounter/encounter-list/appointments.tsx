import React, { useEffect, useState } from 'react';
import {Form} from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import { useLazySearchAppointmentsQuery } from '@/services/appointment/appointmentService';
import { useAppSelector } from '@/hooks';
import { formatEnumString } from '@/utils';
import PatientSearch from '@/components/PatientSearch';

type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
    facilityId: Number;
    departmentId: Number;
};

const normalizeLocalDayStart = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

const normalizeLocalDayEnd = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const DoctorAppoitmentsView = ({ open, setOpen, facilityId, departmentId }: Props) => {
    const mode = useAppSelector((state: any) => state.ui.mode);
    const isDark = mode === 'dark';

    const [dateFrom, setDateFrom] = useState<Date>(new Date());
    const [dateTo, setDateTo] = useState<Date>(new Date());
    const [schedulePatientFilter, setSchedulePatientFilter] = useState<any | null>(null);

    const [searchAppointments, { isFetching }] = useLazySearchAppointmentsQuery();

    const [slots, setSlots] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);


    const dateRangeInvalid = dateFrom != null && dateTo != null && dateTo < dateFrom;

    // ──────────────────────────── PAGINATION (BACKEND) ────────────────────────────
    const [paginationParams, setPaginationParams] = useState({
        page: 0,
        size: 5,
        sort: 'id,asc'
    });

    const [sortColumn, setSortColumn] = useState('date');
    const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        if (!open) return;
        const now = new Date();
        setDateFrom(now);
        setDateTo(now);
    }, [open]);



    // ──────────────────────────── FETCH FROM BACKEND ────────────────────────────
    useEffect(() => {
        if (!open || !facilityId || !departmentId) return;

        const load = async () => {
            try {
                const today = new Date();
                const rangeStart = normalizeLocalDayStart(today);

                const weekLater = new Date(today);
                weekLater.setDate(weekLater.getDate() + 7);

                const rangeEnd = normalizeLocalDayEnd(weekLater);

                const res = await searchAppointments({
                    filter: {
                        facility: Number(facilityId),
                        departmentIds: departmentId != null ? [Number(departmentId)] : null,
                        resourceType: null,
                        resourceId: null,
                        status: ['NEW', 'BOOKED'],
                        bookingMode: null,
                        patientId: schedulePatientFilter?.id || null,
                        startDate: rangeStart,
                        endDate: rangeEnd
                    },
                    page: paginationParams.page,
                    size: paginationParams.size,
                    sort: paginationParams.sort
                }).unwrap();
                setSlots(res?.data ?? []);
                setTotalCount(res?.totalCount ?? 0);

            } catch {
                setSlots([]);
                setTotalCount(0);
            }
        };

        void load();
    }, [
        open,
        facilityId,
        departmentId,
        paginationParams.page,
        paginationParams.size,
        paginationParams.sort,
        searchAppointments,
        schedulePatientFilter
    ]);

    // ──────────────────────────── PAGINATION HANDLERS ────────────────────────────
    const handlePageChange = (event: any, newPage: number) => {
        setPaginationParams(prev => ({ ...prev, page: newPage }));
    };

    const handleSortChange = (newSortColumn: string, newSortType: 'asc' | 'desc') => {
        setSortColumn(newSortColumn);
        setSortType(newSortType);

        setPaginationParams(prev => ({
            ...prev,
            sort: `${newSortColumn},${newSortType}`,
            page: 0
        }));
    };

    // ──────────────────────────── COLORS ────────────────────────────
    const colors = {
        eventText: isDark ? '#cbd5e1' : '#334155',
        badgeBg: isDark ? '#14532d' : '#dcfce7',
        badgeText: isDark ? '#86efac' : '#166534',
        badgeBorder: isDark ? '#166534' : '#86efac'
    };

    const tableColumns = [
        {
            key: 'date',
            title: 'Date',
            render: (row: any) => {
                const startRaw = row?.appointmentStart ?? row?.startDatetime;
                const start = startRaw ? new Date(startRaw) : null;

                return start
                    ? start.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: '2-digit'
                    })
                    : '--';
            }
        },
        {
            key: 'time',
            title: 'Time',
            render: (row: any) => {
                const start = row?.startDatetime ? new Date(row.startDatetime) : null;
                const end = row?.endDatetime ? new Date(row.endDatetime) : null;

                return `${start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'} - ${end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'
                    }`;
            }
        },
        {
            key: 'event',
            title: 'Event',
            render: (row: any) => (
                <div style={{ display: 'flex', gap: 8 }}>
                    <span
                        style={{
                            fontSize: 11,
                            color: colors.badgeText,
                            background: colors.badgeBg,
                            border: `1px solid ${colors.badgeBorder}`,
                            borderRadius: 999,
                            padding: '2px 8px',
                            fontWeight: 600
                        }}
                    >
                        {formatEnumString(row?.status)}
                    </span>
                    <span style={{ color: colors.eventText }}>
                        {row?.status === 'NEW' ? 'Available' : 'Booked'} appointment
                    </span>
                </div>
            )
        },
        {
            key: 'patient',
            title: 'Patient',
            render: (row: any) =>
                `${row?.patient?.firstName ?? ''} ${row?.patient?.lastName ?? ''}`.trim() || '-'
        }
    ];

    const filters = () => (
        <Form fluid>
            <PatientSearch
                value={schedulePatientFilter}
                onChange={setSchedulePatientFilter}
                fieldLabel="Patient"
            />
        </Form>
    );

    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Approve Appointment Request"
            size="65vw"
            bodyheight="75vh"
            content={
                <MyTable
                    height={450}
                    totalCount={dateRangeInvalid ? 0 : totalCount}
                    data={dateRangeInvalid ? [] : slots}
                    loading={isFetching}
                    columns={tableColumns}
                    filters={filters()}
                    sortColumn={sortColumn}
                    sortType={sortType}
                    onSortChange={handleSortChange}
                    page={paginationParams.page}
                    rowsPerPage={paginationParams.size}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={(e: any) => {
                        setPaginationParams({
                            page: 0,
                            size: Number(e.target.value),
                            sort: paginationParams.sort
                        });
                    }}
                />
            }
        />
    );
};

export default DoctorAppoitmentsView;