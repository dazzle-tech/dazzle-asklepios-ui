import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Drawer, Form, Panel, Tooltip, Whisper } from 'rsuite';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import CancellationModal from '@/components/CancellationModal';

import {
    useAcceptReferralRequestMutation,
    useGetReferralRequestsByToFacilityAndDateRangeQuery,
    useRejectReferralRequestMutation
} from '@/services/medicalsheetsEncounter/referralRequestService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetDepartmentsBulkMutation } from '@/services/security/departmentService';
import { useGetBulkPatientBasicInfoMutation } from '@/services/patient/patientService';

import { useAppSelector } from '@/hooks';
import { useDispatch } from 'react-redux';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import { calculateAgeFormat, formatDateWithoutSeconds, formatEnumString } from '@/utils';

import PatientQuickAppointment from './PatientQuickAppoinment/PatientQuickAppointment';

import { faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import './styles.less';

interface IncomingReferralRequestsByFacilityProps {
    open: boolean;
    setOpen: (value: boolean) => void;
}

const toISOStartOfDay = (value: Date | string | null | undefined) => {
    if (!value) return undefined;
    const d = value instanceof Date ? new Date(value) : new Date(String(value));
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
};

const toISOEndOfDay = (value: Date | string | null | undefined) => {
    if (!value) return undefined;
    const d = value instanceof Date ? new Date(value) : new Date(String(value));
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
};

const IncomingReferralRequestsByFacility: React.FC<IncomingReferralRequestsByFacilityProps> = ({
    open,
    setOpen
}) => {
    const dispatch = useDispatch();
    const tooltipContainerRef = useRef<HTMLDivElement | null>(null);
    const getTooltipContainer = () => tooltipContainerRef.current || document.body;

    const selectedFacility = useAppSelector(state => state.auth?.tenant?.selectedFacility);

    const today = useMemo(() => new Date(), []);
    const todayString = useMemo(() => new Date().toISOString().slice(0, 10), []);

    const [dateFilter, setDateFilter] = useState({
        fromDate: todayString,
        toDate: todayString
    });

    const [paginationParams, setPaginationParams] = useState({
        page: 0,
        size: 10
    });

    const [selectedReferral, setSelectedReferral] = useState<any>(null);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);

    const [quickAppointmentModel, setQuickAppointmentModel] = useState(false);

    const [facilityMap, setFacilityMap] = useState<Record<number, string>>({});
    const [departmentsMap, setDepartmentsMap] = useState<Record<number, string>>({});
    const [departmentsLoading, setDepartmentsLoading] = useState(false);

    const [acceptReferralRequest] = useAcceptReferralRequestMutation();
    const [rejectReferralRequest] = useRejectReferralRequestMutation();

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectObject, setRejectObject] = useState<any>({
        cancelReason: ''
    });

    const queryArgs = useMemo(() => {
        if (!selectedFacility?.id || !open) return undefined;

        return {
            toFacilityId: Number(selectedFacility.id),
            from: toISOStartOfDay(dateFilter.fromDate) ?? toISOStartOfDay(today)!,
            to: toISOEndOfDay(dateFilter.toDate) ?? toISOEndOfDay(today)!,
            page: paginationParams.page,
            size: paginationParams.size
        };
    }, [
        selectedFacility?.id,
        open,
        dateFilter.fromDate,
        dateFilter.toDate,
        paginationParams.page,
        paginationParams.size,
        today
    ]);

    const {
        data: referralListResponse,
        isFetching,
        isLoading,
        refetch
    } = useGetReferralRequestsByToFacilityAndDateRangeQuery(queryArgs as any, {
        skip: !queryArgs
    });

    const [getDepartmentsBulk] = useGetDepartmentsBulkMutation();

    const {
        data: facilitiesResponse,
        isFetching: isFacilitiesFetching,
        isLoading: isFacilitiesLoading
    } = useGetAllFacilitiesQuery({}, { skip: !open });

    const [getBulkPatientBasicInfo, { data: patientsBasicInfo, isLoading: patientsBulkLoading }] =
        useGetBulkPatientBasicInfoMutation();

    const tableData = useMemo(() => {
        return referralListResponse?.data ?? referralListResponse ?? [];
    }, [referralListResponse]);

    const totalCount = referralListResponse?.totalCount ?? tableData.length ?? 0;

    useEffect(() => {
        if (!open) return;
        setPaginationParams(prev => ({ ...prev, page: 0 }));
    }, [dateFilter.fromDate, dateFilter.toDate, open]);

    useEffect(() => {
        if (!open) return;

        if (!facilitiesResponse?.length) {
            setFacilityMap({});
            return;
        }

        const map: Record<number, string> = {};
        facilitiesResponse.forEach((f: any) => {
            map[f.id] = f.name ?? '';
        });
        setFacilityMap(map);
    }, [facilitiesResponse, open]);

    useEffect(() => {
        let cancelled = false;

        const loadDepartments = async () => {
            if (!open) return;

            if (!tableData.length) {
                if (!cancelled) {
                    setDepartmentsMap({});
                    setDepartmentsLoading(false);
                }
                return;
            }

            const uniqueIds = Array.from(
                new Set(
                    tableData
                        .flatMap((row: any) => [row.fromDepartmentId, row.toDepartmentId])
                        .filter((id): id is number => id != null && Number(id) > 0)
                )
            );

            if (!uniqueIds.length) {
                if (!cancelled) {
                    setDepartmentsMap({});
                    setDepartmentsLoading(false);
                }
                return;
            }

            try {
                if (!cancelled) setDepartmentsLoading(true);
                const departments = await getDepartmentsBulk(uniqueIds).unwrap();

                if (cancelled) return;

                setDepartmentsMap(
                    Object.fromEntries((departments ?? []).map((d: any) => [d.id, d.name ?? '']))
                );
            } catch {
                if (!cancelled) setDepartmentsMap({});
            } finally {
                if (!cancelled) setDepartmentsLoading(false);
            }
        };

        loadDepartments();

        return () => {
            cancelled = true;
        };
    }, [tableData, getDepartmentsBulk, open]);

    const patientIdsForBulk = useMemo(() => {
        const ids = (tableData as any[])
            .map(row => row?.patient?.id)
            .filter(v => v !== null && v !== undefined)
            .map(v => String(v));

        return Array.from(new Set(ids));
    }, [tableData]);

    const patientBulkIdsRef = useRef<string[]>([]);

    useEffect(() => {
        if (!open) return;

        if (patientIdsForBulk.length === 0) {
            patientBulkIdsRef.current = [];
            return;
        }

        patientBulkIdsRef.current = patientIdsForBulk;

        getBulkPatientBasicInfo(patientIdsForBulk as any)
            .unwrap()
            .catch(() => {});
    }, [open, patientIdsForBulk, getBulkPatientBasicInfo]);

    const patientMap = useMemo(() => {
        const map = new Map<string, any>();
        const ids = patientBulkIdsRef.current;

        const patientsArray = Array.isArray(patientsBasicInfo)
            ? patientsBasicInfo
            : (patientsBasicInfo as any)?.data ?? [];

        patientsArray.forEach((patient: any, index: number) => {
            const key = patient?.id ?? ids[index];
            if (!key) return;

            map.set(String(key), patient);
        });

        return map;
    }, [patientsBasicInfo]);

    const normalizedTableData = useMemo(() => {
        return (tableData as any[]).map(row => {
            const patientId = row?.patient?.id ?? null;
            const patientFromMap = patientId != null ? patientMap.get(String(patientId)) : null;

            const firstName = String(patientFromMap?.firstName ?? row?.patient?.firstName ?? '').trim();
            const secondName = String(
                patientFromMap?.secondName ?? row?.patient?.secondName ?? ''
            ).trim();
            const thirdName = String(patientFromMap?.thirdName ?? row?.patient?.thirdName ?? '').trim();
            const lastName = String(patientFromMap?.lastName ?? row?.patient?.lastName ?? '').trim();

            const fullName =
                [firstName, secondName, thirdName, lastName].filter(Boolean).join(' ').trim() || '-';

            const mrn =
                patientFromMap?.medicalRecordNumber ?? row?.patient?.medicalRecordNumber ?? null;

            const dob = patientFromMap?.dateOfBirth ?? row?.patient?.dateOfBirth ?? null;

            const sexAtBirth =
                formatEnumString(patientFromMap?.sexAtBirth ?? row?.patient?.sexAtBirth) || '';

            const isPrivate =
                patientFromMap?.isPrivatePatient ?? row?.patient?.isPrivatePatient ?? false;

            return {
                ...row,
                key: row?.id,
                patientObject: {
                    id: patientId,
                    fullName,
                    medicalRecordNumber: mrn,
                    dateOfBirth: dob,
                    sexAtBirth,
                    isPrivatePatient: isPrivate
                },
                patientAge: dob ? calculateAgeFormat(dob) : null
            };
        });
    }, [tableData, patientMap]);

    const handleOpenQuickAppointment = (row: any) => {
        const patientId = row?.patient?.id;
        const fullPatient = patientId != null ? patientMap.get(String(patientId)) : null;

        setSelectedReferral(row);
        setSelectedPatient({
            ...(fullPatient ?? row?.patientObject ?? {}),
            referralDepartmentId: row?.toDepartmentId,
            referralFacilityId: row?.toFacilityId
        });
        setQuickAppointmentModel(true);
    };

    const handleOpenReject = (row: any) => {
        setSelectedReferral(row);
        setRejectObject({
            cancelReason: ''
        });
        setRejectModalOpen(true);
    };

    const handleConfirmReject = async () => {
        if (!selectedReferral?.id) return;

        const finalReason = String(rejectObject?.cancelReason ?? '').trim();

        if (!finalReason) return;

        try {
            await rejectReferralRequest({
                id: selectedReferral.id,
                reason: finalReason
            }).unwrap();

            setRejectModalOpen(false);
            setRejectObject({ cancelReason: '' });
            await refetch();
        } catch {}
    };

    const handleEncounterSaved = async () => {
        if (selectedReferral?.id) {
            try {
                await acceptReferralRequest({ id: selectedReferral.id }).unwrap();
            } catch {}
        }

        await refetch();
        setQuickAppointmentModel(false);
    };

    const handlePageChange = (_event: any, newPage: number) => {
        setPaginationParams(prev => ({ ...prev, page: newPage }));
    };

    const handleRowsPerPageChange = (e: any) => {
        const newSize = Number(e.target.value);
        setPaginationParams(prev => ({ ...prev, size: newSize, page: 0 }));
    };

    const tableColumns = [
        {
            key: 'referralType',
            title: <Translate>Referral Type</Translate>,
            flexGrow: 2,
            render: (rowData: any) => <p>{formatEnumString(rowData?.referralType)}</p>
        },
        {
            key: 'fromFacilityId',
            title: <Translate>From Facility</Translate>,
            flexGrow: 2,
            render: (row: any) => facilityMap[row.fromFacilityId] ?? '-'
        },
        {
            key: 'toFacilityId',
            title: <Translate>To Facility</Translate>,
            flexGrow: 2,
            render: () => selectedFacility?.name ?? '-'
        },
        {
            key: 'patientInfo',
            title: <Translate>Patient Name</Translate>,
            flexGrow: 3,
            fullText: true,
            render: (row: any) => {
                const speaker = (
                    <Tooltip>
                        <div>MRN: {row?.patientObject?.medicalRecordNumber ?? '-'}</div>
                        <div>Age: {row?.patientAge ?? '-'}</div>
                        <div>Gender: {row?.patientObject?.sexAtBirth ?? '-'}</div>
                    </Tooltip>
                );

                return (
                    <Whisper
                        trigger="hover"
                        placement="top"
                        container={getTooltipContainer}
                        speaker={speaker}
                    >
                        <div className="encounter-list__patient-name-cell">
                            {row?.patientObject?.isPrivatePatient ? (
                                <Badge color="blue" content="Private">
                                    <p className="encounter-list__patient-name encounter-list__patient-name--clickable">
                                        {row?.patientObject?.fullName ?? '-'}
                                    </p>
                                </Badge>
                            ) : (
                                <p className="encounter-list__patient-name encounter-list__patient-name--clickable">
                                    {row?.patientObject?.fullName ?? '-'}
                                </p>
                            )}
                        </div>
                    </Whisper>
                );
            }
        },
        {
            key: 'toDepartmentId',
            title: <Translate>Department</Translate>,
            flexGrow: 2,
            render: (row: any) => departmentsMap[row.toDepartmentId] ?? '-'
        },
        {
            key: 'priority',
            title: <Translate>Priority</Translate>,
            flexGrow: 2,
            render: (row: any) => <p>{formatEnumString(row?.priority) ?? '-'}</p>
        },
        {
            key: 'referralReason',
            title: <Translate>Reason</Translate>,
            flexGrow: 3,
            render: (row: any) => row?.referralReason ?? '-'
        },
        {
            key: 'status',
            title: <Translate>Status</Translate>,
            flexGrow: 2,
            render: (row: any) => {
                const statusUpper = String(row?.status ?? '').toUpperCase();

                const statusColorMap: Record<string, string> = {
                    REQUESTED: '#fd7e14',
                    ACCEPTED: '#198754',
                    REJECTED: '#dc3545'
                };

                return (
                    <MyBadgeStatus
                        color={statusColorMap[statusUpper] ?? '#969fb0'}
                        contant={formatEnumString(row?.status) ?? row?.status ?? '-'}
                    />
                );
            }
        },
        {
            key: 'createdBy',
            title: <Translate>Created By/At</Translate>,
            flexGrow: 3,
            expandable: true,
            render: (row: any) => (
                <>
                    {row?.createdBy ?? '-'}
                    <br />
                    <span className="date-table-style">
                        {row?.createdDate ? formatDateWithoutSeconds(row.createdDate) : '-'}
                    </span>
                </>
            )
        },
        {
            key: 'acceptedBy',
            title: <Translate>Accepted By/At</Translate>,
            flexGrow: 3,
            expandable: true,
            render: (row: any) => (
                <>
                    {row?.acceptedBy ?? '-'}
                    <br />
                    <span className="date-table-style">
                        {row?.acceptedDate ? formatDateWithoutSeconds(row.acceptedDate) : '-'}
                    </span>
                </>
            )
        },
        {
            key: 'rejectedBy',
            title: <Translate>Rejected By/At</Translate>,
            flexGrow: 3,
            expandable: true,
            render: (row: any) => (
                <>
                    {row?.rejectedBy ?? '-'}
                    <br />
                    <span className="date-table-style">
                        {row?.rejectedDate ? formatDateWithoutSeconds(row.rejectedDate) : '-'}
                    </span>
                </>
            )
        },
        {
            key: 'rejectReason',
            title: <Translate>Reject Reason</Translate>,
            flexGrow: 3,
            expandable: true,
            render: (row: any) => row?.rejectReason ?? '-'
        },
        {
            key: 'actions',
            title: <Translate>Actions</Translate>,
            flexGrow: 3,
            render: (row: any) => {
                const statusUpper = String(row?.status ?? '').toUpperCase();
                const isRequested = statusUpper === 'REQUESTED';

                return (
                    <Form layout="inline" fluid className="nurse-doctor-form">
                        <Whisper
                            trigger="hover"
                            placement="top"
                            speaker={<Tooltip>Accept</Tooltip>}
                            container={getTooltipContainer}
                        >
                            <div>
                                <MyButton
                                    size="small"
                                    disabled={!isRequested}
                                    onClick={() => handleOpenQuickAppointment(row)}
                                >
                                    <FontAwesomeIcon icon={faCircleCheck} />
                                </MyButton>
                            </div>
                        </Whisper>

                        <Whisper
                            trigger="hover"
                            placement="top"
                            speaker={<Tooltip>Reject</Tooltip>}
                            container={getTooltipContainer}
                        >
                            <div>
                                <MyButton
                                    size="small"
                                    backgroundColor="var(--primary-pink)"
                                    disabled={!isRequested}
                                    onClick={() => handleOpenReject(row)}
                                >
                                    <FontAwesomeIcon icon={faCircleXmark} />
                                </MyButton>
                            </div>
                        </Whisper>
                    </Form>
                );
            }
        }
    ];

    const filters = (
        <Form layout="inline" fluid className="date-filter-form">
            <MyInput
                column
                width={180}
                fieldType="date"
                fieldLabel="From Date"
                fieldName="fromDate"
                record={dateFilter}
                setRecord={(v: any) => {
                    setDateFilter(v);
                }}
            />

            <MyInput
                column
                width={180}
                fieldType="date"
                fieldLabel="To Date"
                fieldName="toDate"
                record={dateFilter}
                setRecord={(v: any) => {
                    setDateFilter(v);
                }}
            />
        </Form>
    );

    const listsLoading =
        isFacilitiesLoading || isFacilitiesFetching || departmentsLoading || patientsBulkLoading;

    const tableLoading = isLoading || isFetching || listsLoading;

    useEffect(() => {
        if (!open) return;

        if (tableLoading) dispatch(showSystemLoader());
        else dispatch(hideSystemLoader());

        return () => {
            dispatch(hideSystemLoader());
        };
    }, [dispatch, tableLoading, open]);


    // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

    return (
        <div dir={dir}>
            <Drawer open={open} onClose={() => setOpen(false)} size="full">
                <Drawer.Header>
                    <Drawer.Title>Referral Requests</Drawer.Title>
                </Drawer.Header>

                <Drawer.Body>
                    <div ref={tooltipContainerRef} className="visit-history__wrapper">
                        {!selectedFacility?.id ? (
                            <Panel>
                                <div className="encounter-list__no-department">
                                    <p>Please select a facility to view referral requests.</p>
                                </div>
                            </Panel>
                        ) : (
                            <Panel>
                                <MyTable
                                    filters={filters}
                                    data={normalizedTableData}
                                    totalCount={totalCount}
                                    loading={tableLoading}
                                    columns={tableColumns}
                                    rowClassName={(row: any) =>
                                        row && selectedReferral && row.key === selectedReferral.key
                                            ? 'selected-row'
                                            : ''
                                    }
                                    onRowClick={(row: any) => setSelectedReferral(row)}
                                    page={paginationParams.page}
                                    rowsPerPage={paginationParams.size}
                                    onPageChange={handlePageChange}
                                    onRowsPerPageChange={handleRowsPerPageChange}
                                    height={600}
                                />
                            </Panel>
                        )}
                    </div>
                </Drawer.Body>
            </Drawer>

            <CancellationModal
                open={rejectModalOpen}
                setOpen={setRejectModalOpen}
                object={rejectObject}
                setObject={setRejectObject}
                handleCancle={handleConfirmReject}
                title="Reject Referral Request"
                fieldLabel="Reason"
                fieldName="cancelReason"
                withReason={true}
                required={true}
            />

            {quickAppointmentModel && selectedPatient && (
                <PatientQuickAppointment
                    quickAppointmentModel={quickAppointmentModel}
                    setQuickAppointmentModel={setQuickAppointmentModel}
                    localPatient={selectedPatient}
                    localVisit={null}
                    localReferral={selectedReferral}
                    openedFromReferral={true}
                    isDisabeld={false}
                    initialStep={0}
                    onEncounterSaved={handleEncounterSaved}
                />
            )}
        </div>
    );
};

export default IncomingReferralRequestsByFacility;