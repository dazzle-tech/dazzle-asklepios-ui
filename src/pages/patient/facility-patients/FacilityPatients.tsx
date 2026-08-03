import React, { useEffect, useMemo, useState } from 'react';
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
const today = new Date().toISOString().split('T')[0];

const FacilityPatients = () => {
    const dispatch = useAppDispatch();

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    const [patientSearch, setPatientSearch] = useState({
        searchByField: 'fullName',
        patientName: ''
    });

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

    const { data, isLoading, isFetching } = useGetFacilityPatientsQuery({
        page,
        size: rowsPerPage,
        sort: 'id,desc',
        patientName: filterRecord.patientName || undefined,
        registrationDateFrom: filterRecord.registrationDateFrom || undefined,
        registrationDateTo: filterRecord.registrationDateTo || undefined,
        insuranceId: filterRecord.insuranceId || undefined
    });

    const { data: payors } = useGetAllPayorsQuery({
        page: 0,
        size: 1000,
        sort: 'name,asc'
    });


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
                key: 'genderAge',
                title: 'Gender, Age',
                render: row => {
                    let age = '-';

                    if (row.dateOfBirth) {
                        const birthDate = new Date(row.dateOfBirth);
                        const today = new Date();

                        age = today.getFullYear() - birthDate.getFullYear();

                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        if (
                            monthDiff < 0 ||
                            (monthDiff === 0 && today.getDate() < birthDate.getDate())
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
                render: row => row.primaryMobileNumber ?? '-'
            },
            {
                key: 'email',
                title: 'Email',
                render: row => row.email ?? '-'
            },
            {
                key: 'primaryDocumentType',
                title: 'Primary Document Type',
                render: () => '-'
            },
            {
                key: 'primaryDocumentNumber',
                title: 'Primary Document Number',
                render: () => '-'
            },
            {
                key: 'registrationDate',
                title: 'Registration Date',
                render: row => {
                    if (!row.createdDate) return '-';

                    const date = new Date(row.createdDate);
                    return `${date.getFullYear()}-${String(
                        date.getMonth() + 1
                    ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                }
            },
            {
                key: 'primaryInsurance',
                title: 'Primary Insurance',
                render: () => '-'
            }
        ],
        []
    );

    useEffect(() => {
        setPage(0);
    }, [filterRecord]);

    return (
        <SectionContainer
            title="Facility Patients"
            content={
                <>
                    <div>
                        <Form fluid className="facility-patients-filter-container">
                            <MyInput
                                fieldName="registrationDateFrom"
                                fieldType="date"
                                record={filterRecord}
                                setRecord={setFilterRecord}
                            />

                            <MyInput
                                fieldName="registrationDateTo"
                                fieldType="date"
                                record={filterRecord}
                                setRecord={setFilterRecord}
                            />
                            
                          <div style={{marginTop:'0.5vw'}}>
                            <SearchPatientCriteria
                                record={patientSearch}
                                setRecord={setPatientSearch}
                                liveSearchMinLength={3}
                                onSearchClick={() => {
                                    setFilterRecord(prev => ({
                                        ...prev,
                                        patientName: patientSearch.patientName
                                    }));
                                    setPage(0);
                                }}
                            />
                          </div>

                            <MyInput
                                fieldName="insuranceId"
                                fieldType="select"
                                record={filterRecord}
                                setRecord={setFilterRecord}
                                width={220}
                                selectData={payors?.data ?? []}
                                selectDataLabel="name"
                                selectDataValue="id"
                            />
                        </Form>
                    </div>

                    <MyTable
                        loading={isLoading || isFetching}
                        data={data?.data ?? []}
                        columns={columns}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        totalCount={data?.totalCount ?? 0}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        onRowsPerPageChange={event => {
                            setRowsPerPage(Number(event.target.value));
                            setPage(0);
                        }}
                    />
                </>
            }
        />
    );
};

export default FacilityPatients;