import React, {
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import { Form } from 'rsuite';
import { useGetFacilityPatientsQuery } from '@/services/patient/patientService';
import { useGetAllPayorsQuery } from '@/services/setup/payer/PayorService';
import './styles.less';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';
import {
    useLazyGetDocumentsByPatientQuery
} from '@/services/patients/patientDocumentsService';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';

const today = new Date().toISOString().split('T')[0];

const FacilityPatients = () => {
    const dispatch = useAppDispatch();

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    const [patientSearch, setPatientSearch] = useState({
        searchByField: 'fullName',
        patientName: ''
    });

    const [dateKey, setDateKey] = useState(0);
    useEffect(() => {
        dispatch(setPageCode('FACILITY_PATIENTS'));
        dispatch(setDivContent('Facility Patients'));
        return () => {
            dispatch(setPageCode(''));
            dispatch(setDivContent(''));
        };
    }, [dispatch]);

    const [filterRecord, setFilterRecord] = useState({
        registrationDateFrom: today,
        registrationDateTo: today,
        patientName: '',
        insuranceId: null
    });

    const [appliedFilters, setAppliedFilters] = useState({
        registrationDateFrom: today,
        registrationDateTo: today,
        patientName: undefined,
        insuranceId: undefined,
        page: 0,
        size: 15,
        sort: 'id,desc',
    });

    const { data, isLoading, isFetching } =
        useGetFacilityPatientsQuery(appliedFilters);


    const [getDocumentsByPatient] =
        useLazyGetDocumentsByPatientQuery();

    const [primaryDocuments, setPrimaryDocuments] = useState<
        Record<
            number,
            {
                type?: string;
                number?: string;
            }
        >
    >({});

    const requestedDocumentsRef = useRef<Set<number>>(new Set());

    const { data: payors } = useGetAllPayorsQuery({
        page: 0,
        size: 1000,
        sort: 'name,asc'
    });

    useEffect(() => {
        const patients = data?.data ?? [];

        if (!patients.length) {
            return;
        }

        let cancelled = false;

        const loadPrimaryDocuments = async () => {
            const patientsToLoad = patients.filter(patient => {
                if (!patient?.id) {
                    return false;
                }

                if (requestedDocumentsRef.current.has(patient.id)) {
                    return false;
                }

                requestedDocumentsRef.current.add(patient.id);

                return true;
            });

            if (!patientsToLoad.length) {
                return;
            }

            const results = await Promise.all(
                patientsToLoad.map(async patient => {
                    try {
                        const response =
                            await getDocumentsByPatient({
                                patientId: patient.id,
                                page: 0,
                                size: 100,
                                sort: 'createdDate,desc'
                            }).unwrap();

                        const primaryDocument = (
                            response?.data ?? []
                        ).find(
                            document =>
                                document?.isPrimary === true
                        );

                        return {
                            patientId: patient.id,
                            document: primaryDocument
                                ? {
                                    type: primaryDocument.type,
                                    number: primaryDocument.number
                                }
                                : null
                        };
                    } catch (error) {
                        console.error(
                            `Failed to load documents for patient ${patient.id}`,
                            error
                        );

                        return {
                            patientId: patient.id,
                            document: null
                        };
                    }
                })
            );

            if (cancelled) {
                return;
            }

            setPrimaryDocuments(prev => {
                const next = { ...prev };

                results.forEach(result => {
                    next[result.patientId] =
                        result.document ?? {};
                });

                return next;
            });
        };

        loadPrimaryDocuments();

        return () => {
            cancelled = true;
        };
    }, [data?.data, getDocumentsByPatient]);

    const columns = useMemo(
        () => [
            {
                key: 'patientName',
                title: 'Patient Name',
                render: row =>
                    [
                        row.firstName,
                        row.secondName,
                        row.thirdName,
                        row.lastName
                    ]
                        .filter(Boolean)
                        .join(' ') || '-'
            },

            {
                key: 'mrn',
                title: 'MRN',
                render: row =>
                    row.medicalRecordNumber ?? '-'
            },

            {
                key: 'genderAge',
                title: 'Gender, Age',
                render: row => {
                    let age = '-';

                    if (row.dateOfBirth) {
                        const birthDate =
                            new Date(row.dateOfBirth);

                        const today = new Date();

                        age =
                            today.getFullYear() -
                            birthDate.getFullYear();

                        const monthDiff =
                            today.getMonth() -
                            birthDate.getMonth();

                        if (
                            monthDiff < 0 ||
                            (
                                monthDiff === 0 &&
                                today.getDate() <
                                birthDate.getDate()
                            )
                        ) {
                            age--;
                        }
                    }

                    return `${row.sexAtBirth ?? '-'}, ${age}`;
                }
            },

            {
                key: 'primaryMobileNumber',
                title: 'Primary Mobile Number',
                render: row =>
                    row.primaryMobileNumber ?? '-'
            },

            {
                key: 'email',
                title: 'Email',
                render: row =>
                    row.email ?? '-'
            },

            {
                key: 'primaryDocumentType',
                title: 'Primary Document Type',
                render: row => {
                    const document =
                        primaryDocuments[row.id];

                    if (!document?.type) {
                        return '-';
                    }

                    return document.type
                        .split('_')
                        .map(word =>
                            word.charAt(0) +
                            word.slice(1).toLowerCase()
                        )
                        .join(' ');
                }
            },

            {
                key: 'primaryDocumentNumber',
                title: 'Primary Document Number',
                render: row =>
                    primaryDocuments[row.id]?.number ?? '-'
            },

            {
                key: 'registrationDate',
                title: 'Registration Date',
                render: row => {
                    if (!row.createdDate) {
                        return '-';
                    }

                    const date =
                        new Date(row.createdDate);

                    return `${date.getFullYear()}-${String(
                        date.getMonth() + 1
                    ).padStart(2, '0')}-${String(
                        date.getDate()
                    ).padStart(2, '0')}`;
                }
            },

            {
                key: 'primaryInsurance',
                title: 'Primary Insurance',
                render: () => '-'
            }
        ],
        [primaryDocuments]
    );

    const handleSearch = () => {
        const patientName =
            String(filterRecord.patientName ?? '').trim();

        setPage(0);

        setAppliedFilters(prev => ({
            ...prev,

            registrationDateFrom:
                filterRecord.registrationDateFrom || today,

            registrationDateTo:
                filterRecord.registrationDateTo || today,

            patientName:
                patientName || undefined,

            insuranceId:
                filterRecord.insuranceId || undefined,

            size: rowsPerPage,
        }));
    };
    const handleClear = () => {
        const cleared = {
            registrationDateFrom: today,
            registrationDateTo: today,
            patientName: '',
            insuranceId: null,
        };

        setFilterRecord(cleared);

        setPatientSearch({
            searchByField: 'fullName',
            patientName: '',
        });

        setPage(0);

        setAppliedFilters(prev => ({
            ...prev,

            registrationDateFrom: today,
            registrationDateTo: today,
            patientName: undefined,
            insuranceId: undefined,

            size: rowsPerPage,
        }));

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
            size: newSize,
        }));
    };

    return (
        <SectionContainer
            title="Facility Patients"
            content={
                <>
                    <div>
                        <Form fluid className="facility-patients-filter-container">
                            <MyInput
                                key={`registration-date-from-${dateKey}`}
                                fieldName="registrationDateFrom"
                                fieldType="date"
                                record={filterRecord}
                                setRecord={setFilterRecord}
                            />

                            <MyInput
                                key={`registration-date-to-${dateKey}`}
                                fieldName="registrationDateTo"
                                fieldType="date"
                                record={filterRecord}
                                setRecord={setFilterRecord}
                            />

                            <div style={{ marginTop: '0.5vw' }}>
                                <SearchPatientCriteria
                                    record={patientSearch}
                                    setRecord={setPatientSearch}
                                    liveSearchMinLength={3}
                                    onSearchClick={() => {
                                        setFilterRecord(prev => ({
                                            ...prev,
                                            patientName: patientSearch.patientName
                                        }));
                                    }}
                                />
                            </div>

                            <MyInput
                                fieldName="insuranceId"
                                fieldType="select"
                                record={filterRecord}
                                setRecord={setFilterRecord}
                                width={"12vw"}
                                selectData={payors?.data ?? []}
                                selectDataLabel="name"
                                selectDataValue="id"
                            />
                        </Form>
                        <AdvancedSearchFilters searchFilter={true} clearOnClick={handleClear} searchOnClick={handleSearch} />
                    </div>


                    <MyTable
                        loading={isLoading || isFetching}
                        data={data?.data ?? []}
                        columns={columns}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        totalCount={data?.totalCount ?? 0}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                    />
                </>
            }
        />
    );
};

export default FacilityPatients;