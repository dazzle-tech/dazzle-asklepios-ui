import React, { useEffect, useMemo, useState } from 'react';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';
import { Form, Tooltip, Whisper } from 'rsuite';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
    useGetEncounterListQuery,
    type EncounterListVM,
} from '@/services/encounters/patientEncounterService';
import { useEnumOptions } from '@/services/enumsApi';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import './styles.less';
import { useGetAllPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetDepartmentByFacilityQuery } from '@/services/security/departmentService';
import { MdOutlineReceiptLong } from 'react-icons/md';
import EncounterServicesModal from './EncounterServicesModal';

const today = new Date();

const oneMonthAgo = new Date(today);
oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

const todayDate = today.toISOString().split('T')[0];
const oneMonthAgoDate = oneMonthAgo.toISOString().split('T')[0];

const PatientsEncounters = () => {
    const dispatch = useAppDispatch();

    const auth = useAppSelector(state => state.auth);
    const currentFacility = auth?.tenant?.selectedFacility;


    useEffect(() => {
        dispatch(setPageCode('ENCOUNTERS_LIST'));
        dispatch(setDivContent('Encounters List'));

        return () => {
            dispatch(setPageCode(''));
            dispatch(setDivContent(''));
        };
    }, [dispatch]);


    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [servicesEncounter, setServicesEncounter] = useState<EncounterListVM | null>(null);

    const [appliedFilters, setAppliedFilters] = useState<any>({
        fromDate: todayDate,
        toDate: todayDate,

        patientName: undefined,
        mrn: undefined,
        encounterNumber: undefined,

        facilityId: currentFacility?.id ?? undefined,
        departmentId: undefined,
        practitionerId: undefined,

        encounterReasons: undefined,
        statusIn: undefined,
        encounterStatuses: undefined,

        page: 0,
        size: 15,
        sort: 'id,desc',
    });

    const [patientSearch, setPatientSearch] = useState({
        searchByField: 'fullName',
        patientName: '',
    });

    const [filterRecord, setFilterRecord] = useState({
        fromDate: todayDate,
        toDate: todayDate,

        patientName: '',
        mrn: '',
        encounterNumber: '',

        facilityId: currentFacility?.id ?? null,
        departmentId: null,
        practitionerId: null,

        encounterReasons: [],
        treatmentStatuses: [],
        encounterStatuses: [],
    });


    useEffect(() => {
        if (!currentFacility?.id) return;

        setFilterRecord(prev => ({
            ...prev,
            facilityId: currentFacility.id,
        }));
    }, [currentFacility?.id]);




    const { data: allFacilities = [] } =
        useGetAllFacilitiesQuery(null);

    const { data: departmentsResponse } =
        useGetDepartmentByFacilityQuery(
            {
                facilityId: filterRecord.facilityId!,
                page: 0,
                size: 1000,
                sort: 'name,asc',
            },
            {
                skip: !filterRecord.facilityId,
            }
        );

    const departments = departmentsResponse?.data ?? [];

    const [dateKey, setDateKey] = useState(0);
    const EncounterReasonEnum = useEnumOptions('EncounterReason');

    const TreatmentStatusEnum = useEnumOptions('TreatmentStatus');

    const EncounterStatusEnum = useEnumOptions('EncounterStatus');

    const { data: practitionersResponse } =
        useGetAllPractitionersQuery({
            page: 0,
            size: 1000,
            sort: 'id,asc',
        });

    const practitioners = (practitionersResponse?.data ?? []).map(
        (practitioner: any) => ({
            ...practitioner,
            fullName: [
                practitioner?.firstName,
                practitioner?.secondName,
                practitioner?.thirdName,
                practitioner?.lastName,
            ]
                .filter(Boolean)
                .join(' ')
                .trim(),
        })
    );

    const handlePatientSearchClick = () => {
        const searchText = String(
            patientSearch?.patientName ?? ''
        ).trim();

        setFilterRecord(prev => ({
            ...prev,
            patientName:
                patientSearch?.searchByField === 'fullName'
                    ? searchText
                    : '',
            mrn:
                patientSearch?.searchByField === 'patientMrn'
                    ? searchText
                    : '',
        }));
    };

    const {
        data,
        isLoading,
        isFetching,
    } = useGetEncounterListQuery(
        {
            facilityId: appliedFilters.facilityId,
            fromDate: appliedFilters.fromDate,
            toDate: appliedFilters.toDate,
            patientName: appliedFilters.patientName,
            mrn: appliedFilters.mrn,
            encounterNumber: appliedFilters.encounterNumber,
            departmentId: appliedFilters.departmentId,
            practitionerId: appliedFilters.practitionerId,
            encounterReasons: appliedFilters.encounterReasons,
            treatmentStatusIn: appliedFilters.statusIn,
            encounterStatusIn: appliedFilters.encounterStatuses,
            page: appliedFilters.page ?? 0,
            size: appliedFilters.size ?? rowsPerPage,
            sort: appliedFilters.sort ?? 'id,desc',
        },
        { skip: !appliedFilters.facilityId }
    );

    const tableData: EncounterListVM[] = data?.data ?? [];

    const totalCount = Number(
        data?.totalCount ?? 0
    );

    const formatAmount = (value?: number | null) => {
        if (value == null || Number.isNaN(Number(value))) {
            return '—';
        }

        return Number(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const columns = useMemo(
        () => [
            {
                key: 'encounterId',
                title: 'Encounter Id',
                render: (row: EncounterListVM) => row.encounterNumber || '—',
            },
            {
                key: 'patientName',
                title: 'Patient Name',
                render: (row: EncounterListVM) => row.patientFullName || '—',
            },
            {
                key: 'mrn',
                title: 'MRN',
                render: (row: EncounterListVM) => row.mrn || '—',
            },
            {
                key: 'encounterType',
                title: 'Encounter Type',
                render: (row: EncounterListVM) =>
                    formatEnumString(row.encounterType || '') || '—',
            },
            {
                key: 'department',
                title: 'Department',
                render: (row: EncounterListVM) => row.departmentName || '—',
            },
            {
                key: 'practitioner',
                title: 'Practitioner',
                render: (row: EncounterListVM) => row.practitionerName || '—',
            },
            {
                key: 'defaultService',
                title: 'Default Service',
                render: (row: EncounterListVM) => row.defaultServiceName || '—',
            },
            {
                key: 'amount',
                title: 'Total Amount',
                render: (row: EncounterListVM) =>
                    formatAmount(row.calculatedTotal ?? row.amount),
            },
            {
                key: 'patientTotal',
                title: 'Co-payment',
                render: (row: EncounterListVM) => formatAmount(row.patientTotal),
            },
            {
                key: 'patientPaidTotal',
                title: 'Patient Paid',
                render: (row: EncounterListVM) => formatAmount(row.patientPaidTotal),
            },
            {
                key: 'paymentStatus',
                title: 'Payment Status',
                render: (row: EncounterListVM) =>
                    formatEnumString(row.paymentStatus || '') || '—',
            },
            {
                key: 'coverageType',
                title: 'Coverage Type',
                render: (row: EncounterListVM) =>
                    formatEnumString(row.coverageType || '') || '—',
            },
            {
                key: 'paymentType',
                title: 'Self Pay / Insurance',
                render: (row: EncounterListVM) =>
                    formatEnumString(row.paymentType || row.coverageType || '') || '—',
            },
            {
                key: 'insuranceName',
                title: 'Insurance Name',
                render: (row: EncounterListVM) => row.insuranceName || '—',
            },
            {
                key: 'triageStarted',
                title: 'Triage Started',
                render: (row: EncounterListVM) =>
                    row.triageStarted ? 'True' : 'False',
            },
            {
                key: 'doctorStartDateTime',
                title: 'Doctor Start Date/Time',
                render: (row: EncounterListVM) =>
                    row.doctorStartDateTime
                        ? formatDateWithoutSeconds(row.doctorStartDateTime)
                        : '—',
            },
            {
                key: 'services',
                title: '',
                width: 56,
                render: (row: EncounterListVM) => (
                    <Whisper
                        placement="top"
                        trigger="hover"
                        speaker={<Tooltip>Services & products</Tooltip>}
                    >
                        <button
                            type="button"
                            className="encounter-services-action"
                            aria-label="Services and products"
                            onClick={() => setServicesEncounter(row)}
                        >
                            <MdOutlineReceiptLong size={18} />
                        </button>
                    </Whisper>
                ),
            },
        ],
        []
    );

    const handleSearch = () => {
        const patientName =
            String(filterRecord.patientName ?? '').trim();

        const mrn =
            String(filterRecord.mrn ?? '').trim();

        const encounterNumber =
            String(filterRecord.encounterNumber ?? '').trim();

        const encounterReasons =
            Array.isArray(filterRecord.encounterReasons) &&
                filterRecord.encounterReasons.length > 0
                ? filterRecord.encounterReasons
                : undefined;

        const treatmentStatuses =
            Array.isArray(filterRecord.treatmentStatuses) &&
                filterRecord.treatmentStatuses.length > 0
                ? filterRecord.treatmentStatuses
                : undefined;

        const encounterStatuses =
            Array.isArray(filterRecord.encounterStatuses) &&
                filterRecord.encounterStatuses.length > 0
                ? filterRecord.encounterStatuses
                : undefined;

        const newFilters = {
            fromDate: filterRecord.fromDate || todayDate,
            toDate: filterRecord.toDate || todayDate,

            patientName: patientName || undefined,
            mrn: mrn || undefined,
            encounterNumber: encounterNumber || undefined,

            facilityId:
                filterRecord.facilityId || undefined,

            departmentId:
                filterRecord.departmentId || undefined,

            practitionerId:
                filterRecord.practitionerId || undefined,

            encounterReasons,
            statusIn: treatmentStatuses,
            encounterStatuses,

            page: 0,
            size: rowsPerPage,
            sort: 'id,desc',
        };

        setPage(0);
        setAppliedFilters(newFilters);
    };

    const handleClear = () => {
        const cleared = {
            fromDate: todayDate,
            toDate: todayDate,

            patientName: '',
            mrn: '',
            encounterNumber: '',

            facilityId: currentFacility?.id ?? null,
            departmentId: null,
            practitionerId: null,

            encounterReasons: [],
            treatmentStatuses: [],
            encounterStatuses: [],
        };

        setFilterRecord(cleared);

        setPatientSearch({
            searchByField: 'fullName',
            patientName: '',
        });

        setPage(0);

        setAppliedFilters({
            fromDate: todayDate,
            toDate: todayDate,

            patientName: undefined,
            mrn: undefined,
            encounterNumber: undefined,

            facilityId: currentFacility?.id ?? undefined,
            departmentId: undefined,
            practitionerId: undefined,

            encounterReasons: undefined,
            statusIn: undefined,
            encounterStatuses: undefined,

            page: 0,
            size: rowsPerPage,
            sort: 'id,desc',
        });

        setDateKey(prev => prev + 1);
    };

    const handlePageChange = (
        _event: unknown,
        newPage: number
    ) => {
        setPage(newPage);

        setAppliedFilters(prev => ({
            ...prev,
            page: newPage,
        }));
    };

    const handleRowsPerPageChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const newSize = Number(event.target.value);

        setRowsPerPage(newSize);
        setPage(0);

        setAppliedFilters(prev => ({
            ...prev,
            page: 0,
            size: newSize,
        }));
    };

    return (
        <SectionContainer
            title="Encounters List"
            content={
                <>
                    <div>
                        <Form
                            fluid
                            className="facility-patients-filter-container"
                        >

                            <MyInput
                                key={`from-date-${dateKey}`}
                                fieldName="fromDate"
                                fieldType="date"
                                fieldLabel="Date From"
                                record={filterRecord}
                                setRecord={setFilterRecord}
                                width="12vw"
                            />
                            <MyInput
                                key={`to-date-${dateKey}`}
                                fieldName="toDate"
                                fieldType="date"
                                fieldLabel="Date To"
                                record={filterRecord}
                                setRecord={setFilterRecord}
                                width="12vw"
                            />
                            <div style={{ marginTop: '0.5vw' }}>
                                <SearchPatientCriteria
                                    record={patientSearch}
                                    setRecord={setPatientSearch}
                                    liveSearchMinLength={3}
                                    onSearchClick={handlePatientSearchClick}
                                />
                            </div>

                            <MyInput
                                fieldName="encounterNumber"
                                fieldType="text"
                                fieldLabel="Encounter Number"
                                record={filterRecord}
                                setRecord={setFilterRecord}
                                width="12vw"
                            />

                            <MyInput
                                fieldName="facilityId"
                                fieldType="select"
                                fieldLabel="Facility"
                                record={filterRecord}
                                setRecord={(value: any) => {
                                    const facilityId =
                                        typeof value === 'object'
                                            ? value?.facilityId ?? value?.id
                                            : value;
                                    setFilterRecord(prev => ({
                                        ...prev,
                                        facilityId,
                                        departmentId: null,
                                    }));
                                }}
                                width="12vw"
                                selectData={allFacilities}
                                selectDataLabel="name"
                                selectDataValue="id"
                                searchable
                            />

                            <MyInput
                                fieldName="departmentId"
                                fieldType="select"
                                fieldLabel="Department"
                                record={filterRecord}
                                setRecord={setFilterRecord}
                                width="12vw"
                                selectData={departments}
                                selectDataLabel="name"
                                selectDataValue="id"
                                searchable
                            />

                            <MyInput
                                fieldName="practitionerId"
                                fieldType="select"
                                fieldLabel="Practitioner"
                                record={filterRecord}
                                setRecord={setFilterRecord}
                                width="12vw"
                                selectData={practitioners}
                                selectDataLabel="fullName"
                                selectDataValue="id"
                                searchable
                            />

                            <MyInput
                                fieldName="encounterReasons"
                                fieldType="checkPicker"
                                fieldLabel="Reason"
                                record={filterRecord}
                                setRecord={setFilterRecord}
                                width={"12vw"}
                                selectData={EncounterReasonEnum}
                                selectDataLabel="label"
                                selectDataValue="value"
                                searchable
                            />

                            <MyInput
                                fieldName="treatmentStatuses"
                                fieldType="checkPicker"
                                fieldLabel="Treatment Status"
                                record={filterRecord}
                                setRecord={setFilterRecord}
                                width={"12vw"}
                                selectData={TreatmentStatusEnum}
                                selectDataLabel="label"
                                selectDataValue="value"
                                searchable
                            />

                            <MyInput
                                fieldName="encounterStatuses"
                                fieldType="checkPicker"
                                fieldLabel="Encounter Status"
                                record={filterRecord}
                                setRecord={setFilterRecord}
                                width={"12vw"}
                                selectData={EncounterStatusEnum}
                                selectDataLabel="label"
                                selectDataValue="value"
                                searchable
                            />
                        </Form>
                    </div>

                    <AdvancedSearchFilters
                        searchFilter={true}
                        clearOnClick={handleClear}
                        searchOnClick={handleSearch}
                    />

                    <MyTable
                        loading={isLoading || isFetching}
                        data={tableData}
                        columns={columns}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        totalCount={totalCount}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                    />

                    <EncounterServicesModal
                        open={servicesEncounter != null}
                        encounter={servicesEncounter}
                        onClose={() => setServicesEncounter(null)}
                    />
                </>
            }
        />
    );
};

export default PatientsEncounters;

