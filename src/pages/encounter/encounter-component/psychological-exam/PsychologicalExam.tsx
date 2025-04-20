import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import PlusIcon from '@rsuite/icons/Plus';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Checkbox, IconButton, Table, } from 'rsuite';
import { useSavePsychologicalExamsMutation, useGetPsychologicalExamsQuery } from '@/services/encounterService';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import Translate from '@/components/Translate';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import { newApPsychologicalExam } from '@/types/model-types-constructor';
import { ApPsychologicalExam } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import MyButton from '@/components/MyButton/MyButton';
import AddPsychologicalExam from './AddPsychologicalExam';
import CancellationModal from '@/components/CancellationModal';
const { Column, HeaderCell, Cell } = Table
const PsychologicalExam = ({ patient, encounter }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [openAddModal, setOpenAddModal] = useState(false);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
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
    const { data: psychologicalExamResponse, refetch: refetchPsychologicalExam } = useGetPsychologicalExamsQuery(psychologicalExamListRequest);
    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && psychologicalExam && psychologicalExam.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    // handle Expanded Table Functions
    const handleExpanded = (rowData) => {
        let open = false;
        const nextExpandedRowKeys = [];
        expandedRowKeys.forEach(key => {
            if (key === rowData.key) {
                open = true;
            } else {
                nextExpandedRowKeys.push(key);
            }
        });

        if (!open) {
            nextExpandedRowKeys.push(rowData.key);
        }
        setExpandedRowKeys(nextExpandedRowKeys);
    };
    const renderRowExpanded = rowData => {
        return (
            <Table
                data={[rowData]}
                bordered
                cellBordered
                style={{ width: '100%', marginTop: '10px' }}
                height={100}
            >
                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Created At / Created By</HeaderCell>
                    <Cell>
                        {rowData => (
                            <>
                                {rowData.createdAt ? new Date(rowData.createdAt).toLocaleString("en-GB") : ""}
                                {" / "}
                                {rowData?.createByUser?.fullName}
                            </>
                        )}
                    </Cell>
                </Column>
                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Updated At / Updated By</HeaderCell>
                    <Cell>
                        {rowData => (
                            <>
                                {rowData.updatedAt ? new Date(rowData.updatedAt).toLocaleString("en-GB") : ""}
                                {" / "}
                                {rowData?.updateByUser?.fullName}
                            </>
                        )}
                    </Cell>
                </Column>
                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Cancelled At / Cancelled By</HeaderCell>
                    <Cell dataKey="deletedAt" >
                        {rowData => (
                            <>
                                {rowData.deletedAt ? new Date(rowData.updatedAt).toLocaleString("en-GB") : ""}
                                {" / "}
                                {rowData?.deleteByUser?.fullName}
                            </>
                        )}
                    </Cell>
                </Column>
                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Cancelliton Reason</HeaderCell>
                    <Cell dataKey="cancellationReason" />
                </Column>
            </Table>
        );
    };
    const ExpandCell = ({ rowData, dataKey, expandedRowKeys, onChange, ...props }) => (
        <Cell {...props} style={{ padding: 5 }}>
            <IconButton
                appearance="subtle"
                onClick={() => {
                    onChange(rowData);
                }}
                icon={
                    expandedRowKeys.some(key => key === rowData["key"]) ? (
                        <CollaspedOutlineIcon />
                    ) : (
                        <ExpandOutlineIcon />
                    )
                }
            />
        </Cell>
    );
    const handleCancle = () => {
        //TODO convert key to code
        savePsychologicalExam({ ...psychologicalExam, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime(), deletedBy: authSlice.user.key }).unwrap().then(() => {
            dispatch(notify('Psychological Exam Canceled Successfully'));
            refetchPsychologicalExam();
            setPopupCancelOpen(false);
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
                    Show All Vaccines
                </Checkbox>
                <div className='bt-right'>
                    <MyButton prefixIcon={() => <PlusIcon />} onClick={() => setOpenAddModal(true)}>Add Psychological Exam</MyButton>
                </div>
            </div>
            <Table
                height={600}
                data={psychologicalExamResponse?.object ?? []}
                rowKey="key"
                expandedRowKeys={expandedRowKeys}
                renderRowExpanded={renderRowExpanded}
                shouldUpdateScroll={false}
                bordered
                cellBordered
                onRowClick={rowData => {
                    setPsychologicalExam({
                        ...rowData
                    });
                }}
                rowClassName={isSelected}
            >
                <Column width={70} align="center">
                    <HeaderCell>#</HeaderCell>
                    <ExpandCell rowData={rowData => rowData} dataKey="key" expandedRowKeys={expandedRowKeys} onChange={handleExpanded} />
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Test Type</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.testTypeLvalue
                            ? rowData?.testTypeLvalue.lovDisplayVale
                            : rowData?.testTypeLkey
                        }
                    </Cell>
                </Column >
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Reason</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            rowData?.reason
                        }
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Test Duration</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            <> {rowData?.testDuration} {" "}
                                {
                                    rowData?.unitLvalue
                                        ? rowData?.unitLvalue.lovDisplayVale
                                        : rowData?.unitLkey
                                }
                            </>
                        }
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Score</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.scoreLvalue
                            ? rowData?.scoreLvalue.lovDisplayVale
                            : rowData?.scoreLkey
                        }
                    </Cell>
                </Column>
                <Column flexGrow={3} fullText>
                    <HeaderCell align="center">
                        <Translate>Result Interpretation</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.resultInterpretationLvalue
                            ? rowData?.resultInterpretationLvalue.lovDisplayVale
                            : rowData?.resultInterpretationLkey
                        }
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Clinical Observations</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.clinicalObservations}
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Treatment Plan</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.treatmentPlan}
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Treatment Plan</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.treatmentPlan}
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Additional Notes</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.additionalNotes}
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Follow-up Date</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.followUpDate ? new Date(rowData.followUpDate).toLocaleString("en-GB") : ""}
                    </Cell>
                </Column>
            </Table>
            <CancellationModal open={popupCancelOpen} setOpen={setPopupCancelOpen} object={psychologicalExam} setObject={setPsychologicalExam} handleCancle={handleCancle} fieldName="cancellationReason" />
        </div>
    );
};
export default PsychologicalExam;