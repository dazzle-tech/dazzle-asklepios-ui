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
const PsychologicalExam = ({ patient, encounter }) => {
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
    const handleAddNewOptometricExam = () => {
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
            key: 'index',
            title: '#',
            width: 70,
            render: (rowData: any, index: number) => index + 1
        },
        {
            key: 'testType',
            title: <Translate>Test Type</Translate>,
            render: (rowData: any) => rowData?.testTypeLvalue ? rowData?.testTypeLvalue.lovDisplayVale : rowData?.testTypeLkey
        },
        {
            key: 'reason',
            title: <Translate>Reason</Translate>,
            render: (rowData: any) => rowData?.reason
        },
        {
            key: 'testDuration',
            title: <Translate>Test Duration</Translate>,
            render: (rowData: any) => rowData?.testDuration ? `${rowData?.testDuration} ${rowData?.unitLvalue ? rowData?.unitLvalue.lovDisplayVale : rowData?.unitLkey}` : ' '
        },
        {
            key: 'score',
            title: <Translate>Score</Translate>,
            render: (rowData: any) => rowData?.scoreLvalue ? rowData?.scoreLvalue.lovDisplayVale : rowData?.scoreLkey
        },
        {
            key: 'resultInterpretation',
            title: <Translate>Result Interpretation</Translate>,
            render: (rowData: any) => rowData?.resultInterpretationLvalue ? rowData?.resultInterpretationLvalue.lovDisplayVale : rowData?.resultInterpretationLkey
        },
        {
            key: 'clinicalObservations',
            title: <Translate>Clinical Observations</Translate>,
            render: (rowData: any) => rowData?.clinicalObservations
        },
        {
            key: 'treatmentPlan',
            title: <Translate>Treatment Plan</Translate>,
            render: (rowData: any) => rowData?.treatmentPlan
        },
        {
            key: 'additionalNotes',
            title: <Translate>Additional Notes</Translate>,
            render: (rowData: any) => rowData?.additionalNotes,
            expandable: true,
        },
        {
            key: 'followUpDate',
            title: <Translate>Follow-up Date</Translate>,
            render: (rowData: any) => rowData?.followUpDate ? new Date(rowData.followUpDate).toLocaleString("en-GB") : ""
        },
        {
            key: "details",
            title: <Translate>Add details</Translate>,
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
            title: 'Created At / Created By',
            expandable: true,
            render: (row: any) => `${new Date(row.createdAt).toLocaleString('en-GB')} / ${row?.createByUser?.fullName}`
        },
        {
            key: 'updatedAt',
            title: 'Updated At / Updated By',
            expandable: true,
            render: (row: any) => row?.updatedAt ? `${new Date(row.updatedAt).toLocaleString('en-GB')} / ${row?.updateByUser?.fullName}` : ' '
        },
        {
            key: 'deletedAt',
            title: 'Cancelled At / Cancelled By',
            expandable: true,
            render: (row: any) => row?.deletedAt ? `${new Date(row.deletedAt).toLocaleString('en-GB')} / ${row?.deleteByUser?.fullName}` : ' '
        },
        {
            key: 'cancellationReason',
            title: 'Cancellation Reason',
            dataKey: 'cancellationReason',
            expandable: true,
        }
    ];
    return (
        <div>
            <AddPsychologicalExam open={openAddModal} setOpen={setOpenAddModal} patient={patient} encounter={encounter} encounterPsychologicalExam={psychologicalExam} />
            <div className='bt-div'>
                <MyButton prefixIcon={() => <CloseOutlineIcon />} onClick={() => { setPopupCancelOpen(true) }} >
                    Cancel
                </MyButton>
                <Checkbox onChange={(value, checked) => { if (checked) { setPsychologicalExamStatus('3196709905099521'); } else { setPsychologicalExamStatus(''); } }}>
                    Show Cancelled
                </Checkbox>
                <Checkbox onChange={(value, checked) => { if (checked) { setAllData(true); } else { setAllData(false); } }}>
                    Show All
                </Checkbox>
                <div className='bt-right'>
                    <MyButton prefixIcon={() => <PlusIcon />} onClick={handleAddNewOptometricExam}>Add </MyButton>
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