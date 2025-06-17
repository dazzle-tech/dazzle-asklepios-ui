import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import PlusIcon from '@rsuite/icons/Plus';
import { useAppDispatch } from '@/hooks';
import { Checkbox, } from 'rsuite';
import { MdModeEdit } from 'react-icons/md'; import Translate from '@/components/Translate';
import AddEditInpatientObservations from './AddEditInpatientObservations';
import { ApEncounter, ApPatient, ApPsychologicalExam } from '@/types/model-types';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import { ApPatientObservationSummary } from '@/types/model-types';
import { newApPatientObservationSummary } from '@/types/model-types-constructor';
import { useGetObservationSummariesQuery } from '@/services/observationService';
type Props = {
    localEncounter: any;
    localPatient: any;
    editable: any;
};
const InpatientObservations = ({ localEncounter, localPatient, editable }) => {
    const [patient, setPatient] = useState<ApPatient>({ ...localPatient });
    const [encounter, setEncounter] = useState<ApEncounter>({ ...localEncounter });
    const [edit, setEdit] = useState(editable);
    const [openAddModal, setOpenAddModal] = useState(false);
    const dispatch = useAppDispatch()
    const [patientObservationSummary, setPatientObservationSummary] = useState<ApPatientObservationSummary>({
        ...newApPatientObservationSummary,
        latesttemperature: null,
        latestbpSystolic: null,
        latestbpDiastolic: null,
        latestheartrate: null,
        latestrespiratoryrate: null,
        latestoxygensaturation: null,
        latestglucoselevel: null,
        latestweight: null,
        latestheight: null,
        latestheadcircumference: null,
        latestpainlevelLkey: null
    });

    // Define state for the request used to fetch the list of patient observations
    const [observationsListRequest, setObservationsListRequest] = useState<ListRequest>({
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
                fieldName: 'visit_key',
                operator: 'match',
                value: encounter?.key
            }
        ],
    });
    // Fetch the list of Observations based on the provided request, and provide a refetch function
    const { data: observationsResponse, refetch: refetchObservations, isLoading } = useGetObservationSummariesQuery(observationsListRequest);
    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && patientObservationSummary && patientObservationSummary.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    // Handle Add New  Observations Exam Record
    const handleAddNewObservationsRecord = () => {
        handleClear();
        setOpenAddModal(true);
    }

    //handle Clear Fields
    const handleClear = () => {
        setPatientObservationSummary({
            ...newApPatientObservationSummary,
            latestpainlevelLkey: null
        });
    }

    // Change page event handler
    const handlePageChange = (_: unknown, newPage: number) => {
        setObservationsListRequest({ ...observationsListRequest, pageNumber: newPage + 1 });
    };
    // Change number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setObservationsListRequest({
            ...observationsListRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // Reset to first page
        });
    };
    // Effects
    useEffect(() => {
        setObservationsListRequest((prev) => ({
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
                            fieldName: 'visit_key',
                            operator: 'match',
                            value: encounter?.key
                        },
                    ]
                    : []),
            ],
        }));
    }, [patient?.key, encounter?.key]);
    useEffect(() => {
        setPatient(localPatient);
        setEncounter(localEncounter);
        setEdit(editable);
    }, [localPatient, localEncounter]);

    // Pagination values
    const pageIndex = observationsListRequest.pageNumber - 1;
    const rowsPerPage = observationsListRequest.pageSize;
    const totalCount = observationsResponse?.extraNumeric ?? 0;


    // Table Columns
    const columns = [
        {
            key: 'latestbpSystolic',
            title: <Translate>BP</Translate>,
            render: (rowData: any) => `${rowData?.latestheartrate}/${rowData?.latestbpDiastolic} mmHg`
        },
        {
            key: 'latestheartrate',
            title: <Translate>Pulse</Translate>,
            render: (rowData: any) => rowData?.latestheartrate ? `${rowData?.latestheartrate} bpm` : ' '
        },
        {
            key: 'latestrespiratoryrate',
            title: <Translate>R.R</Translate>,
            render: (rowData: any) => rowData?.latestrespiratoryrate ? `${rowData?.latestrespiratoryrate} bpm` : ' '
        },
        {
            key: 'latestoxygensaturation',
            title: <Translate>SpO2</Translate>,
            render: (rowData: any) => rowData?.latestoxygensaturation ? `${rowData?.latestoxygensaturation} %` : ' '
        },
        {
            key: 'latesttemperature',
            title: <Translate>Temp</Translate>,
            render: (rowData: any) => rowData?.latesttemperature ? `${rowData?.latesttemperature} °C` : ' '
        },
        {
            key: 'latestweight',
            title: <Translate>WEIGHT</Translate>,
            render: (rowData: any) => rowData?.latestweight ? `${rowData?.latestweight} Kg` : ' '
        },
        {
            key: 'latestheight',
            title: <Translate>HEIGHT</Translate>,
            render: (rowData: any) => rowData?.latestheight ? `${rowData?.latestheight} cm` : ' '
        },
        {
            key: 'latestheadcircumference',
            title: <Translate>HEAD CIRCUMFERENCE</Translate>,
            render: (rowData: any) => rowData?.latestheadcircumference ? `${rowData?.latestheadcircumference} cm` : ' '
        },
        {
            key: 'Pain Degree',
            title: <Translate>Pain Degree</Translate>,
            render: (rowData: any) =>
                rowData.latestpainlevelLvalue?.lovDisplayVale ||
                rowData.latestpainlevelLkey
        },
        {
            key: "details",
            title: <Translate>EDIT</Translate>,
            flexGrow: 2,
            fullText: true,
            render: rowData => {
                return (
                    <MdModeEdit
                        title="Edit"
                        size={24}
                        fill="var(--primary-gray)"
                        onClick={() => {
                            setPatientObservationSummary(rowData);
                            setOpenAddModal(true);
                        }}
                    />
                );
            }
        },
    ];

    return (
        <div>
            <AddEditInpatientObservations open={openAddModal} setOpen={setOpenAddModal} patient={patient} encounter={encounter} observationsObject={patientObservationSummary} refetch={refetchObservations} edit={edit} />
            <div className='bt-div'>
                <MyButton prefixIcon={() => <CloseOutlineIcon />} onClick={() => { }} disabled={edit}>
                    Cancel
                </MyButton>
                <Checkbox onChange={(value, checked) => { if (checked) { } }}>
                    Show Cancelled
                </Checkbox>
                <Checkbox onChange={(value, checked) => { if (checked) { } }}>
                    Show All
                </Checkbox>
                <div className='bt-right'>
                    <MyButton disabled={edit} prefixIcon={() => <PlusIcon />} onClick={handleAddNewObservationsRecord}>Add </MyButton>
                </div>
            </div>
            <MyTable
                data={observationsResponse?.object ?? []}
                columns={columns}
                loading={isLoading}
                onRowClick={(rowData) => { setPatientObservationSummary({ ...rowData }) }}
                rowClassName={(rowData) => isSelected(rowData)}
                page={pageIndex}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
        </div>
    );
};

export default InpatientObservations;
