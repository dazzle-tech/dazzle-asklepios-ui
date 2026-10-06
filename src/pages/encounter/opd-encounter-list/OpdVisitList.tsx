import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Form, Panel, Tooltip, Whisper } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserNurse, faVialCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import Translate from '@/components/Translate';

import { useAppSelector } from '@/hooks';
import { useEnumOptions } from '@/services/enumsApi';

import { useFilterOpdEncountersQuery } from '@/services/encounters/patientEncounterService';

import {
    useGetBulkPatientBasicInfoMutation,
    useLazyGetPatientByIdQuery
} from '@/services/patient/patientService';

import { useGetDepartmentByFacilityQuery } from '@/services/security/departmentService';

import { useLazyGetPractitionerByDepartmentQuery } from '@/services/setup/practitioner/PractitionerService';

import { calculateAgeFormat, formatDate, formatEnumString } from '@/utils';

import {
    getEncounterTreatmentStatus
} from '@/utils/encounterStatusHelpers';

import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';

import { setEncounter, setPatient } from '@/reducers/patientSlice';

import { setDivContent, setPageCode } from '@/reducers/divSlice';

import CollectSambleModal from '@/pages/appointments-new/scheduling-screen/components/CollectSambleModal/CollectSambleModal';

import './styles.less';

const toISODate = (d: Date | string | null | undefined) => {
    if (!d) return undefined;
    if (typeof d === 'string') return d;
    return d.toISOString().slice(0, 10);
};

const uniqueNonEmpty = (arr?: any[]) => {
    if (!arr) return undefined;

    const cleaned = arr.filter(
        value => value !== null && value !== undefined && String(value).trim() !== ''
    );

    return cleaned.length ? Array.from(new Set(cleaned.map(value => String(value)))) : undefined;
};

const derivePatientFilters = (appliedSearch: any) => {
    const searchByField = String(appliedSearch?.searchByField ?? 'fullName');

    const raw = String(
        appliedSearch?.patientName ??
        appliedSearch?.searchText ??
        appliedSearch?.text ??
        appliedSearch?.value ??
        ''
    ).trim();

    if (!raw) {
        return {
            patientName: undefined as string | undefined,
            mrn: undefined as string | undefined
        };
    }

    if (searchByField === 'patientMrn') {
        return {
            patientName: undefined,
            mrn: raw
        };
    }

    return {
        patientName: raw,
        mrn: undefined
    };
};

const handleCrudError = (error: any, dispatch: any, keyMap: Record<string, string>) => {
    const responseData = error?.data ?? error ?? {};
    const messageProp: string = responseData?.message ?? '';

    const errorKey =
        (messageProp && messageProp.startsWith('error.') ? messageProp.substring(6) : undefined) ??
        responseData?.errorKey;

    const humanReadableMessage =
        (errorKey && keyMap[errorKey]) ??
        responseData?.detail ??
        responseData?.title ??
        responseData?.message ??
        'Unexpected error';

    dispatch(
        notify({
            msg: humanReadableMessage,
            sev: 'warning'
        })
    );
};

const OpdVisitList = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const authSlice = useAppSelector(state => state.auth);

    const facilityId =
        authSlice?.tenant?.selectedFacility?.id ?? authSlice?.selectedDepartment?.facilityId;
    const departmentId =
        authSlice?.selectedDepartment?.departmentId ?? authSlice?.selectedDepartment?.id;

    const [openNurseAssessment, setOpenNurseAssessment] = useState(false);
    const [openCollectSampleModal, setOpenCollectSampleModal] = useState(false);

    const [encounter, setLocalEncounter] = useState<any>(null);

    const [page, setPage] = useState(0);

    const [pageSize, setPageSize] = useState(10);

    const [filtersKey, setFiltersKey] = useState(0);

    const [appliedFilters, setAppliedFilters] = useState<any>(null);

    const DEFAULT_SORT = 'id,desc';

    const today = new Date();
    const todayStr = formatDate(today);

    const [dateFilter, setDateFilter] = useState({
        fromDate: today,
        toDate: today
    });

    const DEFAULT_STATUS = useMemo(() => ['NEW', 'ONGOING'], []);

    const [statusIn, setStatusIn] = useState<string[]>(DEFAULT_STATUS);

    const [encounterReasons, setEncounterReasons] = useState<string[]>([]);

    const [priorities, setPriorities] = useState<string[]>([]);

    const [record, setRecord] = useState<any>({});

    const [patientSearchDraft, setPatientSearchDraft] = useState<any>({
        searchByField: 'fullName',
        patientName: ''
    });

    const [patientSearchApplied, setPatientSearchApplied] = useState<any>({
        searchByField: 'fullName',
        patientName: ''
    });

    const TreatmentStatusEnum = useEnumOptions('TreatmentStatus', {
        exclude: [
            'DISCHARGED',
            'IN_OPERATION',
            'CONFIRM_RETURN',
            'TEMP_DC',
            'TRIAGE_STARTED',
            'SENT_TO_ER',
            'WAITING_TRIAGE',
            'WAITING_LIST',
            'PENDING_PAYMENT',
            'ASSIGNED_TO_BED'
        ]
    });

    const EncounterPriorityEnum = useEnumOptions('EncounterPriority');

    const EncounterReasonEnum = useEnumOptions('EncounterReason');

    useEffect(() => {
        dispatch(setPageCode('P_OPD_VISIT_LIST'));
        dispatch(setDivContent('OPD Visit List'));

        return () => {
            dispatch(setPageCode(''));
            dispatch(setDivContent(' '));
        };
    }, [dispatch]);

    const {
        data: encountersPaged,
        isFetching: isEncountersFetching,
        isLoading: isEncountersLoading
    } = useFilterOpdEncountersQuery(appliedFilters as any, {
        skip: !facilityId || !appliedFilters
    });

    const tableData = encountersPaged?.data ?? [];

    const totalCount = encountersPaged?.totalCount ?? 0;

    const { data: departmentsResponse, isFetching: isDepartmentsFetching } =
        useGetDepartmentByFacilityQuery(
            {
                facilityId: facilityId as number,
                page: 0,
                size: 500,
                sort: 'id,asc'
            },
            {
                skip: !facilityId
            }
        );

    const departments = departmentsResponse?.data ?? [];

    const departmentMap = useMemo(() => {
        const map = new Map<string, any>();

        departments.forEach((department: any) => {
            if (department?.id != null) {
                map.set(String(department.id), department);
            }
        });

        return map;
    }, [departments]);

    const patientBulkIdsRef = useRef<string[]>([]);

    const [getBulkPatientBasicInfo, { data: patientsBasicInfo, isLoading: patientsBulkLoading }] =
        useGetBulkPatientBasicInfoMutation();

    const [triggerGetPatientById] = useLazyGetPatientByIdQuery();

    const patientIdsForBulk = useMemo(() => {
        const ids = (tableData as any[])
            .map(row => row?.patient?.id)
            .filter(value => value !== null && value !== undefined)
            .map(value => String(value));

        return Array.from(new Set(ids));
    }, [tableData]);

    useEffect(() => {
        if (patientIdsForBulk.length === 0) {
            return;
        }

        patientBulkIdsRef.current = patientIdsForBulk;

        getBulkPatientBasicInfo(patientIdsForBulk as any)
            .unwrap()
            .catch(() => { });
    }, [patientIdsForBulk, getBulkPatientBasicInfo]);

    const patientMap = useMemo(() => {
        const map = new Map<string, any>();
        const ids = patientBulkIdsRef.current;

        (patientsBasicInfo ?? []).forEach((patient: any, index: number) => {
            const key = patient?.id ?? ids[index];

            if (!key) return;

            map.set(String(key), patient);
        });

        return map;
    }, [patientsBasicInfo]);

    const [triggerGetPractitionersByDepartment] = useLazyGetPractitionerByDepartmentQuery();

    const [practitionersByDepartment, setPractitionersByDepartment] = useState<Record<string, any[]>>(
        {}
    );

    const encounterDepartmentIds = useMemo(() => {
        return Array.from(
            new Set(
                (tableData as any[])
                    .map(row => row?.departmentId)
                    .filter(id => id !== null && id !== undefined)
                    .map(id => String(id))
            )
        );
    }, [tableData]);

    useEffect(() => {
        if (encounterDepartmentIds.length === 0) {
            setPractitionersByDepartment({});
            return;
        }

        let cancelled = false;

        const loadPractitioners = async () => {
            const entries = await Promise.all(
                encounterDepartmentIds.map(async departmentId => {
                    try {
                        const response = await triggerGetPractitionersByDepartment({
                            departmentId,
                            page: 0,
                            size: 200,
                            sort: 'id,asc'
                        }).unwrap();

                        return [departmentId, response?.data ?? []] as const;
                    } catch {
                        return [departmentId, []] as const;
                    }
                })
            );

            if (cancelled) return;

            const result: Record<string, any[]> = {};

            entries.forEach(([departmentId, practitioners]) => {
                result[departmentId] = practitioners;
            });

            setPractitionersByDepartment(result);
        };

        loadPractitioners();

        return () => {
            cancelled = true;
        };
    }, [encounterDepartmentIds, triggerGetPractitionersByDepartment]);

    const practitionerMap = useMemo(() => {
        const map = new Map<string, any>();

        Object.values(practitionersByDepartment)
            .flat()
            .forEach((practitioner: any) => {
                if (practitioner?.id != null) {
                    map.set(String(practitioner.id), practitioner);
                }
            });

        return map;
    }, [practitionersByDepartment]);

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

            const mrn = patientFromMap?.medicalRecordNumber ?? row?.patient?.medicalRecordNumber ?? null;

            const dob = patientFromMap?.dateOfBirth ?? row?.patient?.dateOfBirth ?? null;

            const sexAtBirth =
                formatEnumString(patientFromMap?.sexAtBirth ?? row?.patient?.sexAtBirth) || '';

            const isPrivate = patientFromMap?.isPrivatePatient ?? row?.patient?.isPrivatePatient ?? false;

            const departmentId = row?.departmentId ?? row?.department?.id ?? null;

            const department = departmentId != null ? departmentMap.get(String(departmentId)) : null;

            const departmentName =
                department?.name ?? row?.departmentName ?? row?.department?.name ?? '-';

            const practitionerId =
                row?.practitioner?.id ?? row?.practitionerId ?? row?.defaultPractitionerId ?? null;

            const practitioner =
                practitionerId != null ? practitionerMap.get(String(practitionerId)) : null;

            const practitionerFirstName = String(
                practitioner?.firstName ?? row?.practitioner?.firstName ?? ''
            ).trim();

            const practitionerLastName = String(
                practitioner?.lastName ?? row?.practitioner?.lastName ?? ''
            ).trim();

            const practitionerFullName =
                [practitionerFirstName, practitionerLastName].filter(Boolean).join(' ').trim() || '-';

            return {
                ...row,
                key: row?.id,
                departmentName,
                patientObject: {
                    id: patientId,
                    fullName,
                    medicalRecordNumber: mrn,
                    firstName,
                    secondName,
                    thirdName,
                    lastName,
                    dateOfBirth: dob,
                    sexAtBirth,
                    isPrivatePatient: isPrivate
                },
                practitionerObject: {
                    id: practitionerId,
                    fullName: practitionerFullName
                },
                patientAge: dob ? calculateAgeFormat(dob) : null
            };
        });
    }, [tableData, patientMap, departmentMap, practitionerMap]);

    const fetchPatientForEncounter = async (encounterData: any) => {
        const patientId = encounterData?.patient?.id ?? encounterData?.patientObject?.id ?? null;

        if (!patientId) {
            return null;
        }

        try {
            return await triggerGetPatientById({
                id: patientId
            }).unwrap();
        } catch (error) {
            handleCrudError(error, dispatch, {
                'patient.notfound': 'Patient not found.'
            });

            return null;
        }
    };

    const handleGoToPreVisitObservations = async (encounterData: any) => {
        dispatch(showSystemLoader());

        const fullPatient = await fetchPatientForEncounter(encounterData);

        dispatch(hideSystemLoader());

        if (!fullPatient) {
            dispatch(
                notify({
                    msg: 'Failed to load patient data.',
                    sev: 'error'
                })
            );

            return;
        }

        dispatch(setEncounter(encounterData));

        dispatch(setPatient(fullPatient));

        navigate('/nurse-station', {
        state: {
            info: fullPatient?.isPrivatePatient ? 'toNurse' : undefined,
            patient: fullPatient,
            encounter: encounterData,
            edit: encounterData?.status?.toUpperCase() === 'CLOSED',
            fromPage: 'OpdVisitList'
        }
        });
    };

    const isAdmin = !!authSlice.user?.admin;

    const jobRole = String(authSlice.user?.jobRole ?? '').toUpperCase();

    const canSeeNurseStation = isAdmin || jobRole === 'NURSE';

    const handlePatientSearchClick = useCallback(() => {
        setPatientSearchApplied(prev => ({
            ...prev,
            ...(patientSearchDraft ?? {})
        }));

        setPage(0);
    }, [patientSearchDraft]);

    const handleSearch = () => {
        if (!facilityId) return;

        const fromDate = toISODate(dateFilter.fromDate) ?? todayStr;

        const toDate = toISODate(dateFilter.toDate) ?? todayStr;

        const normalizedStatusIn = uniqueNonEmpty(statusIn) ?? DEFAULT_STATUS;

        const normalizedEncounterReasons = uniqueNonEmpty(encounterReasons);

        const normalizedPriorities = uniqueNonEmpty(priorities);

        const chiefComplaint = record?.chiefComplain?.trim() ? record.chiefComplain.trim() : undefined;

        const { patientName, mrn } = derivePatientFilters(patientSearchApplied);

        setPage(0);

        setAppliedFilters({
            facilityId,
            fromDate,
            toDate,
            statusIn: normalizedStatusIn,
            patientName,
            mrn,
            encounterReasons: normalizedEncounterReasons,
            chiefComplaint,
            priorities: normalizedPriorities,
            page: 0,
            size: pageSize,
            sort: DEFAULT_SORT
        });
    };

    const handleClearFilters = () => {
        const now = new Date();

        const clearedDateFilter = {
            fromDate: new Date(now.getTime()),
            toDate: new Date(now.getTime() + 1000)
        };

        setRecord({
            chiefComplain: ''
        });

        setDateFilter({
            ...clearedDateFilter
        });

        setStatusIn([...DEFAULT_STATUS]);

        setEncounterReasons([]);
        setPriorities([]);

        const clearedSearch = {
            searchByField: 'fullName',
            patientName: ''
        };

        setPatientSearchDraft({
            ...clearedSearch
        });

        setPatientSearchApplied({
            ...clearedSearch
        });

        setPage(0);

        setAppliedFilters({
            facilityId,
            fromDate: toISODate(clearedDateFilter.fromDate) ?? todayStr,
            toDate: toISODate(clearedDateFilter.toDate) ?? todayStr,
            statusIn: [...DEFAULT_STATUS],
            patientName: undefined,
            mrn: undefined,
            encounterReasons: undefined,
            chiefComplaint: undefined,
            priorities: undefined,
            page: 0,
            size: pageSize,
            sort: DEFAULT_SORT
        });

        setFiltersKey(prev => prev + 1);
    };

    const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const newSize = parseInt(event.target.value, 10);

        setPageSize(newSize);
        setPage(0);

        setAppliedFilters((prev: any) =>
            prev
                ? {
                    ...prev,
                    page: 0,
                    size: newSize
                }
                : prev
        );
    }, []);

    const handlePageChange = useCallback(
        (_: unknown, newPage: number) => {
            setPage(newPage);

            setAppliedFilters((prev: any) =>
                prev
                    ? {
                        ...prev,
                        page: newPage,
                        size: pageSize
                    }
                    : prev
            );
        },
        [pageSize]
    );

    useEffect(() => {
        if (!facilityId || appliedFilters) {
            return;
        }

        setAppliedFilters({
            facilityId,
            fromDate: toISODate(dateFilter.fromDate) ?? todayStr,
            toDate: toISODate(dateFilter.toDate) ?? todayStr,
            statusIn: DEFAULT_STATUS,
            patientName: undefined,
            mrn: undefined,
            encounterReasons: undefined,
            chiefComplaint: undefined,
            priorities: undefined,
            page: 0,
            size: pageSize,
            sort: DEFAULT_SORT
        });
    }, [
        facilityId,
        appliedFilters,
        dateFilter.fromDate,
        dateFilter.toDate,
        todayStr,
        DEFAULT_STATUS,
        pageSize
    ]);

    const tableLoading =
        isEncountersLoading || isEncountersFetching || patientsBulkLoading || isDepartmentsFetching;

    useEffect(() => {
        if (tableLoading) {
            dispatch(showSystemLoader());
        } else {
            dispatch(hideSystemLoader());
        }

        return () => {
            dispatch(hideSystemLoader());
        };
    }, [dispatch, tableLoading]);

    const tableColumns = [
        {
            key: 'encounterNumber',
            title: '#',
            render: (row: any) => row?.encounterNumber ?? row?.departmentDailySequenceNumber ?? row?.id
        },
        {
            key: 'patientFullName',
            title: 'PATIENT NAME',
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
                    <Whisper trigger="hover" placement="top" speaker={speaker}>
                        <div className="encounter-list__patient-name-cell">
                            {row?.patientObject?.isPrivatePatient ? (
                                <Badge color="blue" content="Private">
                                    <p className="encounter-list__patient-name encounter-list__patient-name--clickable">
                                        {row?.patientObject?.fullName}
                                    </p>
                                </Badge>
                            ) : (
                                <p className="encounter-list__patient-name encounter-list__patient-name--clickable">
                                    {row?.patientObject?.fullName}
                                </p>
                            )}
                        </div>
                    </Whisper>
                );
            }
        },
        {
            key: 'departmentName',
            title: 'DEPARTMENT NAME',
            render: (row: any) => row?.departmentName ?? '-'
        },
        {
            key: 'practitionerFullName',
            title: 'PRACTITIONER',
            render: (row: any) => <span>{row?.practitionerObject?.fullName ?? '-'}</span>,
            expandable: true
        },
        {
            key: 'encounterReason',
            title: 'ENCOUNTER REASON',
            render: (row: any) => formatEnumString(row?.encounterReason) ?? ''
        },
        {
            key: 'chiefComplaint',
            title: 'CHIEF COMPLAIN',
            width: 220,
            render: (row: any) => {
                const complaint = row?.chiefComplaint ?? '-';

                const MAX_LENGTH = 20;

                const shouldTruncate = complaint !== '-' && String(complaint).length > MAX_LENGTH;

                const displayText = shouldTruncate
                    ? `${String(complaint).substring(0, MAX_LENGTH)}...`
                    : complaint;

                const content = (
                    <div
                        style={{
                            cursor: shouldTruncate ? 'pointer' : 'default'
                        }}
                    >
                        {displayText}
                    </div>
                );

                if (!shouldTruncate) {
                    return content;
                }

                return (
                    <Whisper
                        trigger="hover"
                        placement="top"
                        speaker={
                            <Tooltip
                                style={{
                                    maxWidth: 400,
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word'
                                }}
                            >
                                {complaint}
                            </Tooltip>
                        }
                    >
                        {content}
                    </Whisper>
                );
            }
        },
        {
            key: 'priorityLevel',
            title: 'PRIORITY',
            render: (row: any) => formatEnumString(row?.priorityLevel) ?? ''
        },
        {
            key: 'encounterDate',
            title: 'DATE',
            render: (row: any) => {
                if (!row?.encounterDate) {
                    return '-';
                }

                const time = row?.encounterTime ? row.encounterTime.slice(0, 5) : '';

                return `${row.encounterDate} ${time}`;
            }
        },
        {
            key: 'status',
            title: 'STATUS',
            render: (row: any) => {
                const statusUpper = getEncounterTreatmentStatus(row);

                const statusColorMap: Record<string, string> = {
                    NEW: '#0d6efd',
                    ONGOING: '#198754',
                    CANCELED: '#ffc107',
                    CANCELLED: '#ffc107',
                    COMPLETED: '#6c757d',
                    DISCHARGED: '#adb5bd'
                };

                return (
                    <MyBadgeStatus
                        color={statusColorMap[statusUpper] ?? '#969fb0'}
                        contant={formatEnumString(statusUpper) || '-'}
                    />
                );
            }
        },
        {
            key: 'actions',
            title: 'ACTIONS',
            render: (row: any) => {
                const statusUpper = getEncounterTreatmentStatus(row);

                const isViewOnlyStatus =
                    statusUpper === 'COMPLETED' ||
                    statusUpper === 'CANCELLED' ||
                    statusUpper === 'CANCELED' ||
                    statusUpper === 'DISCHARGED';

                return (
                    <Form fluid className="nurse-doctor-form">
                        {canSeeNurseStation && !isViewOnlyStatus && (
                            <Whisper
                                trigger="hover"
                                placement="top"
                                speaker={
                                    <Tooltip>
                                        <Translate>Nurse Station</Translate>
                                    </Tooltip>
                                }
                            >
                                <div>
                                    <MyButton
                                        size="small"
                                        backgroundColor="black"
                                        onClick={() => {
                                            setLocalEncounter(row);

                                            if (row?.isObserved) {
                                                handleGoToPreVisitObservations(row);
                                            } else {
                                                setOpenNurseAssessment(true);
                                            }
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faUserNurse} />
                                    </MyButton>
                                </div>
                            </Whisper>
                        )}

                    </Form>
                );
            }
        }
    ];

    const filters = () => (
        <>
            <div key={filtersKey}>
                <Form layout="inline" fluid className="date-filter-form">
                    <MyInput
                        column
                        width={180}
                        fieldType="date"
                        fieldLabel="From Date"
                        fieldName="fromDate"
                        record={dateFilter}
                        setRecord={setDateFilter}
                    />

                    <MyInput
                        column
                        width={180}
                        fieldType="date"
                        fieldLabel="To Date"
                        fieldName="toDate"
                        record={dateFilter}
                        setRecord={setDateFilter}
                    />

                    <SearchPatientCriteria
                        record={patientSearchDraft}
                        setRecord={setPatientSearchDraft}
                        onSearchClick={handlePatientSearchClick}
                        liveSearchMinLength={3}
                    />

                    <MyInput
                        column
                        width={260}
                        fieldType="checkPicker"
                        fieldLabel="Treatment Status"
                        fieldName="statusIn"
                        selectData={TreatmentStatusEnum}
                        selectDataLabel="label"
                        selectDataValue="value"
                        record={{ statusIn }}
                        setRecord={(v: any) => {
                            setStatusIn(Array.isArray(v?.statusIn) ? v.statusIn : []);

                            setPage(0);
                        }}
                    />
                </Form>
            </div>

            <AdvancedSearchFilters
                searchFilter={true}
                clearOnClick={handleClearFilters}
                searchOnClick={handleSearch}
                content={
                    <div className="advanced-filters">
                        <Form fluid className="dissss">
                            <MyInput
                                fieldName="encounterReasons"
                                fieldType="checkPicker"
                                selectData={EncounterReasonEnum}
                                selectDataLabel="label"
                                selectDataValue="value"
                                fieldLabel="Encounter Reason"
                                record={{
                                    encounterReasons
                                }}
                                setRecord={(v: any) => {
                                    const raw = Array.isArray(v) ? v : v?.encounterReasons;

                                    setEncounterReasons(Array.isArray(raw) ? raw.map(String).filter(Boolean) : []);

                                    setPage(0);
                                }}
                                searchable
                                width={220}
                            />

                            <MyInput
                                width={200}
                                fieldName="chiefComplain"
                                fieldType="text"
                                record={record}
                                setRecord={setRecord}
                                fieldLabel="Chief Complain"
                            />

                            <MyInput
                                width={200}
                                fieldName="priorities"
                                fieldType="checkPicker"
                                record={{ priorities }}
                                setRecord={(v: any) => {
                                    setPriorities(Array.isArray(v?.priorities) ? v.priorities : []);

                                    setPage(0);
                                }}
                                selectData={EncounterPriorityEnum}
                                selectDataLabel="label"
                                selectDataValue="value"
                                placeholder="Select Priority"
                                fieldLabel="Priority"
                                searchable={true}
                            />
                        </Form>
                    </div>
                }
            />
        </>
    );

    const direction = localStorage.getItem('direction') || 'LTR';

    const isRTL = direction === 'RTL';

    return (
        <>
            <div dir={isRTL ? 'rtl' : 'ltr'}>
                <Panel>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'end',
                            gap: '1vw'
                        }}
                    >
                        <MyButton onClick={() => setOpenCollectSampleModal(true)}>
                            <FontAwesomeIcon icon={faVialCircleCheck} />
                            <Translate>Collect Sample</Translate>
                        </MyButton>
                    </div>

                    <MyTable
                        filters={filters()}
                        height={600}
                        data={normalizedTableData}
                        columns={tableColumns}
                        rowClassName={(row: any) =>
                            row && encounter && row.id === encounter.id ? 'selected-row' : ''
                        }
                        loading={tableLoading}
                        onRowClick={(row: any) => setLocalEncounter(row)}
                        page={page}
                        rowsPerPage={pageSize}
                        totalCount={totalCount}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                    />

                    <DeletionConfirmationModal
                        open={openNurseAssessment}
                        setOpen={setOpenNurseAssessment}
                        actionButtonFunction={async () => {
                            if (!encounter) {
                                return;
                            }

                            await handleGoToPreVisitObservations(encounter);
                        }}
                        actionType="confirm"
                        confirmationQuestion="Do you want to start Nurse Assessment?"
                        actionButtonLabel="Start"
                        cancelButtonLabel="Close"
                    />
                    <CollectSambleModal
                        open={openCollectSampleModal}
                        setOpen={setOpenCollectSampleModal}
                        facilityId={facilityId}
                        fromDepartmentId={departmentId}
                    />
                </Panel>
            </div>
        </>
    );
};

export default OpdVisitList;
