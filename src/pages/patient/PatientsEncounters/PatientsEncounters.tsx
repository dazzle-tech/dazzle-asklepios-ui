import React, { useEffect, useMemo, useState } from 'react';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';
import { Form } from 'rsuite';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
    useSearchEncountersQuery,
} from '@/services/encounters/patientEncounterService';
import { useEnumOptions } from '@/services/enumsApi';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import './styles.less';
import MyButton from '@/components/MyButton/MyButton';
import { useGetAllPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetDepartmentByFacilityQuery } from '@/services/security/departmentService';
import UserDateCell from '@/components/UserDateCell';

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

const [appliedFilters, setAppliedFilters] = useState<any>({
    fromDate: todayDate,
    toDate: todayDate,

    patientName: undefined,
    mrn: undefined,

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

    const departmentMap = useMemo(() => {
        return new Map(
            departments.map((department: any) => [
                department.id,
                department.name,
            ])
        );
    }, [departments]);


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

    const practitionerMap = useMemo(() => {
        return new Map(
            practitioners.map((practitioner: any) => [
                practitioner.id,
                practitioner.fullName,
            ])
        );
    }, [practitioners]);




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
    } = useSearchEncountersQuery(appliedFilters);

    const tableData = data?.data ?? [];

    const totalCount = Number(
        data?.totalCount ?? 0
    );

    const getPatientName = (row: any) => {
        const patient = row?.patient ?? row?.patientObject;

        if (!patient) {
            return '-';
        }

        const name = [
            patient?.firstName,
            patient?.secondName,
            patient?.thirdName,
            patient?.lastName,
        ]
            .filter(Boolean)
            .join(' ')
            .trim();

        return name || '-';
    };

    const getMRN = (row: any) => {
        return (
            row?.patient?.medicalRecordNumber ??
            row?.patientObject?.medicalRecordNumber ??
            '-'
        );
    };

    const getDepartmentName = (row: any) => {
        if (row?.department?.name) {
            return row.department.name;
        }

        if (row?.departmentName) {
            return row.departmentName;
        }

        if (row?.departmentId) {
            return departmentMap.get(row.departmentId) ?? '-';
        }

        return '-';
    };

    const getPractitionerName = (row: any) => {
        const practitioner = row?.practitioner;

        if (practitioner) {
            const name = [
                practitioner?.firstName,
                practitioner?.secondName,
                practitioner?.thirdName,
                practitioner?.lastName,
            ]
                .filter(Boolean)
                .join(' ')
                .trim();

            return (
                name ||
                practitioner?.fullName ||
                practitioner?.name ||
                '-'
            );
        }

        if (row?.practitionerName) {
            return row.practitionerName;
        }

        if (row?.practitionerId) {
            return practitionerMap.get(row.practitionerId) ?? '-';
        }

        return '-';
    };


    const columns = useMemo(
        () => [
            {
                key: 'encounterId',
                title: 'Encounter Id',
                render: (row: any) => {
                    return row.id ?? '-';
                },
            },
            {
                key: 'patientName',
                title: 'Patient Name',
                render: (row: any) => getPatientName(row),
            },

            {
                key: 'mrn',
                title: 'MRN',
                render: (row: any) => getMRN(row),
            },

            {
                key: 'department',
                title: 'Department',
                render: (row: any) => getDepartmentName(row),
            },

            {
                key: 'practitioner',
                title: 'Practitioner',
                render: (row: any) => getPractitionerName(row),
            },

            {
                key: 'encounterReason',
                title: 'Reason',
                render: (row: any) =>
                    formatEnumString(
                        row?.encounterReason
                    ) || '-',
            },

            {
                key: 'treatmentStatus',
                title: 'Treatment Status',
                render: (row: any) =>
                    formatEnumString(
                        row?.treatmentStatus ??
                        row?.status
                    ) || '-',
            },

            {
                key: 'encounterStatus',
                title: 'Encounter Status',
                render: (row: any) =>
                    formatEnumString(
                        row?.encounterStatus ??
                        row?.status
                    ) || '-',
            },
            {
                key: 'createdAt',
                title: 'Created At',
                render: (row: any) =>
                    formatDateWithoutSeconds(row?.createdAt)
            },
            {
                key: 'encounterEnd',
                title: 'Encounter End Date / Time',
                render: (row: any) =>
                    formatDateWithoutSeconds(row?.completedAt)
            }
        ],
        [departmentMap, practitionerMap]
    );

    const handleSearch = () => {
        const patientName =
            String(filterRecord.patientName ?? '').trim();

        const mrn =
            String(filterRecord.mrn ?? '').trim();

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

            facilityId:
                filterRecord.facilityId || undefined,

            departmentId:
                filterRecord.departmentId || undefined,

            practitionerId:
                filterRecord.practitionerId || undefined,

            encounterReasons,
            statusIn: treatmentStatuses,
            encounterStatuses,

            // IMPORTANT
            page: 0,
            size: rowsPerPage,
            sort: 'id,desc',
        };

        console.log('SEARCH FILTERS:', newFilters);

        setAppliedFilters(newFilters);
    };

const handleClear = () => {
    const cleared = {
        fromDate: todayDate,
        toDate: todayDate,

        patientName: '',
        mrn: '',

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
                </>
            }
        />
    );
};

export default PatientsEncounters;

