import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import PlusIcon from '@rsuite/icons/Plus';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Checkbox, } from 'rsuite';
import { useSavePsychologicalExamsMutation, useGetPsychologicalExamsQuery } from '@/services/encounterService';
import { MdModeEdit } from 'react-icons/md'; import Translate from '@/components/Translate';
import AddEditInpatientObservations from './AddEditInpatientObservations';
import { ApEncounter, ApPatient, ApPsychologicalExam } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import MyButton from '@/components/MyButton/MyButton';
import CancellationModal from '@/components/CancellationModal';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import { useLocation } from 'react-router-dom'
import { ApPatientObservationSummary } from '@/types/model-types';
import { newApPatientObservationSummary } from '@/types/model-types-constructor';
import {
    useGetObservationSummariesQuery,
    useSaveObservationSummaryMutation
} from '@/services/observationService';
type Props = {
  localEncounter: any;
  localPatient: any;
  editable: any;
};
const InpatientObservations = ({localEncounter, localPatient, editable}) => {
    const [patient, setPatient] = useState<ApPatient>({ ...localPatient });
    const [encounter, setEncounter] = useState<ApEncounter>({ ...localEncounter });
    const [edit, setEdit] = useState(editable);
    const [openAddModal, setOpenAddModal] = useState(false);
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
    const dispatch = useAppDispatch()
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
                fieldName: 'encounter_key',
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
            key: 'testType',
            title: <Translate>TEST TYPE</Translate>,
            render: (rowData: any) => rowData?.testTypeLvalue ? rowData?.testTypeLvalue.lovDisplayVale : rowData?.testTypeLkey
        },
        {
            key: 'reason',
            title: <Translate>REASON</Translate>,
            render: (rowData: any) => rowData?.reason
        },
        {
            key: 'testDuration',
            title: <Translate>TEST DURATION</Translate>,
            render: (rowData: any) => rowData?.testDuration ? `${rowData?.testDuration} ${rowData?.unitLvalue ? rowData?.unitLvalue.lovDisplayVale : rowData?.unitLkey}` : ' '
        },
        {
            key: 'score',
            title: <Translate>SCORE</Translate>,
            render: (rowData: any) => rowData?.scoreLvalue ? rowData?.scoreLvalue.lovDisplayVale : rowData?.scoreLkey
        },
        {
            key: 'resultInterpretation',
            title: <Translate>RESULT INTERPRETATION</Translate>,
            render: (rowData: any) => rowData?.resultInterpretationLvalue ? rowData?.resultInterpretationLvalue.lovDisplayVale : rowData?.resultInterpretationLkey
        },
        {
            key: 'clinicalObservations',
            title: <Translate>CLINICAL OBSERVATIONS</Translate>,
            render: (rowData: any) => rowData?.clinicalObservations
        },
        {
            key: 'treatmentPlan',
            title: <Translate>TREATMENT PLAN</Translate>,
            render: (rowData: any) => rowData?.treatmentPlan,
            expandable: true,
        },
        {
            key: 'additionalNotes',
            title: <Translate>ADDITIONAL NOTES</Translate>,
            render: (rowData: any) => rowData?.additionalNotes,
            expandable: true,
        },
        {
            key: 'followUpDate',
            title: <Translate>FOLLOW-UP DATE</Translate>,
            render: (rowData: any) => rowData?.followUpDate
                ? new Date(rowData.followUpDate).toLocaleDateString("en-GB")
                : ""
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
        {
            key: 'createdAt',
            title: 'CREATED AT/BY',
            expandable: true,
            render: (row: any) => row?.createdAt ? <>{row?.createByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row.createdAt)}</span> </> : ' '
        },
        {
            key: 'updatedAt',
            title: 'UPDATED AT/BY',
            expandable: true,
            render: (row: any) => row?.updatedAt ? <>{row?.updateByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row.updatedAt)}</span> </> : ' '
        },
        {
            key: 'deletedAt',
            title: 'CANCELLED AT/BY',
            expandable: true,
            render: (row: any) => row?.deletedAt ? <>{row?.deleteByUser?.fullName}  <br /><span className='date-table-style'>{formatDateWithoutSeconds(row.deletedAt)}</span></> : ' '
        },
        {
            key: 'cancellationReason',
            title: 'CANCELLATION REASON',
            dataKey: 'cancellationReason',
            expandable: true,
        }
    ];

    return (
        <div>
            <AddEditInpatientObservations open={openAddModal} setOpen={setOpenAddModal} patient={patient} encounter={encounter}  observationsObject={patientObservationSummary} refetch={refetchObservations}   edit={edit}/>
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
