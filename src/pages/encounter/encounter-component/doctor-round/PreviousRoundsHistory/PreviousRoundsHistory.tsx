import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetDoctorRoundsListQuery } from '@/services/encounterService';
import Translate from '@/components/Translate';
import { newApDoctorRound } from '@/types/model-types-constructor';
import { ApDoctorRound } from '@/types/model-types';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import { FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
const PreviousRoundsHistory = ({ patient, encounter, isConfirmedRound, setIsConfirmedRound }) => {
    const [doctorRound, setDoctorRound] = useState<ApDoctorRound>({ ...newApDoctorRound });
    const navigate = useNavigate();

    // Initialize list request with default filters
    const [doctorRoundListRequest, setDoctorRoundListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
            , {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
            },
            {
                fieldName: 'encounter_key',
                operator: 'match',
                value: encounter?.key
            },
            {
                fieldName: 'status_lkey',
                operator: 'match',
                value: '91109811181900',
            },
        ],
    });

    // Fetch the list of Doctor Round based on the provided request, and provide a refetch function
    const { data: nurseNotesResponse, refetch, isLoading } = useGetDoctorRoundsListQuery(doctorRoundListRequest);

    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && doctorRound && doctorRound.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };

    // Change page event handler
    const handlePageChange = (_: unknown, newPage: number) => {
        setDoctorRoundListRequest({ ...doctorRoundListRequest, pageNumber: newPage + 1 });
    };
    // Change number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setDoctorRoundListRequest({
            ...doctorRoundListRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // Reset to first page
        });
    };

    const handleViewDoctorRound = async (encounter, patient, doctorRound) => {
        const targetPath = '/doctor-round/round';
        navigate(targetPath, {
            state: { localPatient: patient, localEncounter: encounter, localDoctorRound: doctorRound }
        });
    };


    // Effects
    useEffect(() => {
        setDoctorRoundListRequest((prev) => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined,
                },
                ...(patient?.key && encounter?.key
                    ? [
                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                        {
                            fieldName: 'encounter_key',
                            operator: 'match',
                            value: encounter?.key
                        },
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: '91109811181900',
                        },
                    ]
                    : []),
            ],
        }));
    }, [patient?.key, encounter?.key]);


    // Pagination values
    const pageIndex = doctorRoundListRequest.pageNumber - 1;
    const rowsPerPage = doctorRoundListRequest.pageSize;
    const totalCount = nurseNotesResponse?.extraNumeric ?? 0;

    // Table Column 
    const columns = [
        {
            key: 'roundStartTime',
            title: 'Date and Time',
            render: (row: any) =>
                row?.createdAt ? (
                    <span className="date-table-style">{formatDateWithoutSeconds(row?.roundStartTime)}</span>
                ) : (
                    ' '
                ),
        },
        {
            key: 'shiftLkey',
            title: 'Shift',
            render: (rowData: any) =>
                rowData?.shiftLvalue
                    ? rowData.shiftLvalue.lovDisplayVale
                    : rowData.shiftLkey,
        },
        {
            key: 'practitionerKey',
            title: 'Physician',
            render: (rowData: any) =>
                rowData?.practitioner?.practitionerFullName ? rowData?.practitioner?.practitionerFullName : "",
        },
        {
            key: 'patientStatusLkey',
            title: 'Patient Status',
            render: (rowData: any) =>
                rowData?.patientStatusLvalue
                    ? rowData.patientStatusLvalue.lovDisplayVale
                    : rowData.patientStatusLkey,
        },
        {
            key: 'primaryDiagnosis',
            title: 'Primary Diagnosis ',
            render: (rowData: any) =>
                rowData?.primaryDiagnosis ? rowData?.primaryDiagnosis : "",
        },
        {
            key: 'details',
            title: <Translate>VIEW</Translate>,
            flexGrow: 2,
            render: (rowData: any) => (
                <FaEye
                    title="View"
                    size={24}
                    fill="var(--primary-gray)"
                    onClick={() => {
                        handleViewDoctorRound(encounter, patient, rowData);
                        setDoctorRound(rowData);
                    }} />
            ),
        },
    ];
    useEffect(() => {
        if (isConfirmedRound) {
            refetch();
            setIsConfirmedRound(false);
        }
    }, [isConfirmedRound]);
    return (
        <MyTable
            data={nurseNotesResponse?.object ?? []}
            columns={columns}
            height={600}
            loading={isLoading}
            onRowClick={rowData => {
                setDoctorRound({ ...rowData });
            }}
            rowClassName={isSelected}
            page={pageIndex}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
        />

    );
};
export default PreviousRoundsHistory;