import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import PlusIcon from '@rsuite/icons/Plus';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Checkbox, } from 'rsuite';
import { useSavePsychologicalExamsMutation, useGetPsychologicalExamsQuery } from '@/services/encounterService';
import { MdModeEdit } from 'react-icons/md'; import Translate from '@/components/Translate';
import { newApPsychologicalExam } from '@/types/model-types-constructor';
import { ApPsychologicalExam } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import MyButton from '@/components/MyButton/MyButton';
import AddPsychologicalExam from './AddPsychologicalExam';
import CancellationModal from '@/components/CancellationModal';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import { useLocation } from 'react-router-dom';
const PsychologicalExam = () => {
    const location = useLocation();
     const { patient, encounter, edit } = location.state || {};
    const authSlice = useAppSelector(state => state.auth);
    const [openAddModal, setOpenAddModal] = useState(false);
    const [psychologicalExam, setPsychologicalExam] = useState<ApPsychologicalExam>({ ...newApPsychologicalExam });
    const [savePsychologicalExam] = useSavePsychologicalExamsMutation();
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [psychologicalExamStatus, setPsychologicalExamStatus] = useState('');
    const [allData, setAllData] = useState(false);
    const dispatch = useAppDispatch()
    const [psychologicalExamListRequest, setPsychologicalExamListRequest] = useState<ListRequest>({
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
    // Fetch the list of psychological exams based on the provided request, and provide a refetch function
    const { data: psychologicalExamResponse, refetch: refetchPsychologicalExam, isLoading } = useGetPsychologicalExamsQuery(psychologicalExamListRequest);
    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && psychologicalExam && psychologicalExam.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    // Handle Add New  Psychological Exam Record
    const handleAddNewPsychologicalExam = () => {
        handleClearField();
        setOpenAddModal(true);
    }

    //handle Clear Fields
    const handleClearField = () => {
        setPsychologicalExam({
            ...newApPsychologicalExam,
            testTypeLkey: null,
            unitLkey: null,
            scoreLkey: null,
            resultInterpretationLkey: null,
            statusLkey: null,
            requireFollowUp: false
        });
    };
    // handle Cancel Psychological Exam Record
    const handleCancle = () => {
        //TODO convert key to code
        savePsychologicalExam({ ...psychologicalExam, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime(), deletedBy: authSlice.user.key }).unwrap().then(() => {
            dispatch(notify('Psychological Exam Canceled Successfully'));
            refetchPsychologicalExam();
            setPopupCancelOpen(false);
        });
    };
    // Change page event handler
    const handlePageChange = (_: unknown, newPage: number) => {
        setPsychologicalExamListRequest({ ...psychologicalExamListRequest, pageNumber: newPage + 1 });
    };
    // Change number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPsychologicalExamListRequest({
            ...psychologicalExamListRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // Reset to first page
        });
    };
    // Effects
    useEffect(() => {
        setPsychologicalExamListRequest((prev) => ({
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
                    ]
                    : []),
            ],
        }));
    }, [patient?.key, encounter?.key]);
    useEffect(() => {
        setPsychologicalExamListRequest((prev) => ({
            ...prev,
            filters: [
                ...(psychologicalExamStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: psychologicalExamStatus,
                        },
                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key,
                        },
                        ...(allData === false
                            ? [
                                {
                                    fieldName: 'encounter_key',
                                    operator: 'match',
                                    value: encounter?.key,
                                },
                            ]
                            : []),
                    ]
                    : [
                        {
                            fieldName: 'deleted_at',
                            operator: 'isNull',
                            value: undefined,
                        },
                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key,
                        },
                        ...(allData === false
                            ? [
                                {
                                    fieldName: 'encounter_key',
                                    operator: 'match',
                                    value: encounter?.key,
                                },
                            ]
                            : []),
                    ]),
            ],
        }));
    }, [psychologicalExamStatus, allData]);
    useEffect(() => {
        setPsychologicalExamListRequest((prev) => {
            const filters =
                psychologicalExamStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                    ]
                    : psychologicalExamStatus === '' && allData
                        ? [
                            {
                                fieldName: 'deleted_at',
                                operator: 'isNull',
                                value: undefined,
                            },
                            {
                                fieldName: 'patient_key',
                                operator: 'match',
                                value: patient?.key
                            },
                        ]
                        : prev.filters;

            return {
                ...initialListRequest,
                filters,
            };
        });
    }, [allData, psychologicalExamStatus]);

    // Pagination values
    const pageIndex = psychologicalExamListRequest.pageNumber - 1;
    const rowsPerPage = psychologicalExamListRequest.pageSize;
    const totalCount = psychologicalExamResponse?.extraNumeric ?? 0;


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
                            setPsychologicalExam(rowData);
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
            <AddPsychologicalExam open={openAddModal} setOpen={setOpenAddModal} patient={patient} encounter={encounter} encounterPsychologicalExam={psychologicalExam} edit={edit}/>
            <div className='bt-div'>
                <MyButton prefixIcon={() => <CloseOutlineIcon />} onClick={() => { setPopupCancelOpen(true) }} disabled={edit}>
                    Cancel
                </MyButton>
                <Checkbox onChange={(value, checked) => { if (checked) { setPsychologicalExamStatus('3196709905099521'); } else { setPsychologicalExamStatus(''); } }}>
                    Show Cancelled
                </Checkbox>
                <Checkbox onChange={(value, checked) => { if (checked) { setAllData(true); } else { setAllData(false); } }}>
                    Show All
                </Checkbox>
                <div className='bt-right'>
                    <MyButton disabled={edit} prefixIcon={() => <PlusIcon />} onClick={handleAddNewPsychologicalExam}>Add </MyButton>
                </div>
            </div>
            <MyTable
                data={psychologicalExamResponse?.object ?? []}
                columns={columns}
                loading={isLoading}
                onRowClick={(rowData) => { setPsychologicalExam({ ...rowData }) }}
                rowClassName={(rowData) => isSelected(rowData)}
                page={pageIndex}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
            <CancellationModal open={popupCancelOpen} setOpen={setPopupCancelOpen} object={psychologicalExam} setObject={setPsychologicalExam} handleCancle={handleCancle} fieldName="cancellationReason" fieldLabel="Cancellation Reason" title="Cancellation" />
        </div>
    );
};
export default PsychologicalExam;