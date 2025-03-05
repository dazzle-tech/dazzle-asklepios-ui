import React, { useEffect, useState } from 'react';
import { useGetPatientVaccinationRecordQuery } from '@/services/observationService'
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppSelector, useAppDispatch } from '@/hooks';
import {
    InputGroup,
    Form,
    Input,
    Panel,
    DatePicker,
    Text,
    Checkbox,
    Dropdown,
    Button,
    IconButton,
    SelectPicker,
    Table,
    Modal,
    Stack,
    Divider,
    Toggle,
    ButtonToolbar,
    Grid,
    Row,
    Col,
} from 'rsuite';
import {
    useGetLovValuesByCodeQuery,
} from '@/services/setupService';
import {
    useSavePsychologicalExamsMutation,
    useGetPsychologicalExamsQuery
} from '@/services/encounterService';
import MyInput from '@/components/MyInput';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import Translate from '@/components/Translate';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import MyLabel from '@/components/MyLabel';
import {
    newApPsychologicalExam
} from '@/types/model-types-constructor';
import {
    ApPsychologicalExam
} from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
const { Column, HeaderCell, Cell } = Table
const PsychologicalExam = ({ patient, encounter }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const [psychologicalExam, setPsychologicalExam] = useState<ApPsychologicalExam>({ ...newApPsychologicalExam });
    const [savePsychologicalExam, savePsychologicalExamMutation] = useSavePsychologicalExamsMutation();
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
        //LOV
        const { data: testTypeLovQueryResponse } = useGetLovValuesByCodeQuery('PSYCH_TEST_TYPES');
        const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
        const { data: scoreLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
        const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');
    const { data: psychologicalExamResponse, refetch: refetchPsychologicalExam } = useGetPsychologicalExamsQuery(psychologicalExamListRequest, {
        skip: !patient?.key || !encounter?.key,
    });
    const isSelected = rowData => {
        if (rowData && psychologicalExam && psychologicalExam.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    const handleSave = () => {
        //TODO convert key to code
        if (psychologicalExam.key === undefined) {
            savePsychologicalExam({ ...psychologicalExam, patientKey: patient.key, encounterKey: encounter.key, followUpDate: psychologicalExam?.followUpDate ? new Date(psychologicalExam.followUpDate).getTime() : 0, statusLkey: "9766169155908512", createdBy: authSlice.user.key }).unwrap().then(() => {
                dispatch(notify('Patient Psychological Exam Added Successfully'));
            });
            setPsychologicalExam({ ...newApPsychologicalExam, statusLkey: "9766169155908512" })
            refetchPsychologicalExam();
        }
        else if (psychologicalExam.key) {
            savePsychologicalExam({ ...psychologicalExam, patientKey: patient.key, encounterKey: encounter.key, followUpDate: psychologicalExam?.followUpDate ? new Date(psychologicalExam.followUpDate).getTime() : 0, updatedBy: authSlice.user.key }).unwrap().then(() => {
                dispatch(notify('Patient Psychological Exam Updated Successfully'));
                refetchPsychologicalExam();
            });
        }
    };
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
                       {rowData=>(
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
        });
    };
        const handleClearField = () => {
            setPopupCancelOpen(false);
            setPsychologicalExam({
                ...newApPsychologicalExam,
                testTypeLkey: null,
                unitLkey: null,
                scoreLkey: null,
                resultInterpretationLkey: null,
                statusLkey:null,
                requireFollowUp:null
            });
            
            
        };
    ///useEffect
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
    }, [psychologicalExamStatus ,allData]);
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
        <Panel header={"Psychological Exam"}>
            <Panel bordered style={{ padding: '10px' }}>
                <Form fluid layout='inline'>
                    <MyInput
                        width={165}
                        column
                        fieldLabel="Test Type"
                        fieldType="select"
                        fieldName="testTypeLkey"
                        selectData={testTypeLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={psychologicalExam}
                        setRecord={setPsychologicalExam}
                    />
                    <MyInput
                        width={165}
                        column
                        fieldLabel="Reason"
                        fieldName="reason"
                        record={psychologicalExam}
                        setRecord={setPsychologicalExam}
                    />
                    <MyInput
                        fieldType="number"
                        fieldLabel="Test Duration"
                        width={165}
                        column
                        fieldName="testDuration"
                        record={psychologicalExam}
                        setRecord={setPsychologicalExam}
                    />
                    <MyInput
                        column
                        width={165}
                        fieldLabel="Unit"
                        fieldType="select"
                        fieldName="unitLkey"
                        selectData={unitLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={psychologicalExam}
                        setRecord={setPsychologicalExam}
                    />
                    <MyInput
                        column
                        width={165}
                        fieldLabel="Score"
                        fieldType="select"
                        fieldName="scoreLkey"
                        selectData={scoreLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={psychologicalExam}
                        setRecord={setPsychologicalExam}
                    />
                    <MyInput
                        column
                        width={165}
                        fieldLabel="Result Interpretation"
                        fieldType="select"
                        fieldName="resultInterpretationLkey"
                        selectData={severityLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={psychologicalExam}
                        setRecord={setPsychologicalExam}
                    />
                    <MyInput
                        width={165}
                        column
                        fieldLabel="Require Follow-up"
                        fieldType="checkbox"
                        fieldName="requireFollowUp"
                        record={psychologicalExam}
                        setRecord={setPsychologicalExam}
                    />
                    <MyInput
                        width={165}
                        column
                        fieldType="date"
                        fieldLabel="Require Follow-up"
                        fieldName="followUpDate"
                        record={psychologicalExam}
                        setRecord={setPsychologicalExam}
                        disabled={!psychologicalExam?.requireFollowUp}
                    />
                    <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '5px', zoom: .8 }}>
                        <Form style={{ display: 'flex', flexDirection: 'column' }}>
                            <MyLabel label="Clinical Observations" />
                            <Input
                                as="textarea"
                                value={psychologicalExam.clinicalObservations}
                                onChange={(e) => setPsychologicalExam({
                                    ...psychologicalExam,
                                    clinicalObservations: e
                                })}
                                style={{ width: 330 }}
                                rows={3}
                            />
                        </Form>
                        <Form style={{ display: 'flex', flexDirection: 'column' }}>
                            <MyLabel label="Treatment Plan" />
                            <Input
                                as="textarea"
                                value={psychologicalExam.treatmentPlan}
                                onChange={(e) => setPsychologicalExam({
                                    ...psychologicalExam,
                                    treatmentPlan: e
                                })}
                                style={{ width: 330 }}
                                rows={3}
                            />
                        </Form>
                        <Form style={{ display: 'flex', flexDirection: 'column' }}>
                            <MyLabel label="Additional Notes" />
                            <Input
                                as="textarea"
                                value={psychologicalExam.additionalNotes}
                                onChange={(e) => setPsychologicalExam({
                                    ...psychologicalExam,
                                    additionalNotes: e
                                })}
                                style={{ width: 330 }}
                                rows={3}
                            />
                        </Form>
                    </Form>
                    <ButtonToolbar style={{ zoom: .8 }}>
                        <Button
                            appearance="primary"
                            onClick={() => handleSave()}
                            style={{ backgroundColor: 'var(--primary-blue)', color: 'white', marginLeft: '5px' }}
                        >
                            <FontAwesomeIcon icon={faCheckDouble} style={{ marginRight: '5px' }} />

                            <Translate>Save</Translate>
                        </Button>
                        <Button
                            appearance="ghost"
                            style={{ backgroundColor: 'white', color: 'var(--primary-blue)', marginLeft: "5px" }}
                            onClick={handleClearField}
                        >
                            <FontAwesomeIcon icon={faBroom} style={{ marginRight: '5px' }} />
                            <span>Clear</span>
                        </Button>
                    </ButtonToolbar>
                </Form>
            </Panel>
            <Panel header={"Patient's Psychological Exam"} collapsible bordered>
                <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ButtonToolbar>
                        <Button
                            appearance="primary"
                            style={{ backgroundColor: 'var(--primary-blue)', color: 'white', marginLeft: "5px", zoom: .8 }}
                            onClick={() => { setPopupCancelOpen(true) }}
                            disabled={!psychologicalExam?.key}
                        >
                            <CloseOutlineIcon style={{ marginRight: '7px' }} />
                            <Translate>Cancel</Translate>
                        </Button>

                    </ButtonToolbar>
                    <Checkbox
                        onChange={(value, checked) => {
                            if (checked) {
                                //TODO convert key to code
                                setPsychologicalExamStatus('3196709905099521');
                            }
                            else {
                                setPsychologicalExamStatus('');
                            }
                        }}
                    >
                        Show Cancelled
                    </Checkbox>
                    <Checkbox
                        onChange={(value, checked) => {
                            if (checked) {
                                setAllData(true);
                            }
                            else {
                                setAllData(false);
                            }
                        }}
                    >
                        Show All
                    </Checkbox>
                </Form>
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
            </Panel>
            <Modal
                open={popupCancelOpen}
                onClose={() => setPopupCancelOpen(false)}
                size="sm"
            >
                <Modal.Header>
                    <Translate><h6>Confirm Cancel</h6></Translate>
                </Modal.Header>
                <Modal.Body>
                    <Form  layout="inline" fluid>
                        <MyInput
                            width={600}
                            column
                            fieldLabel="Cancellation Reason"
                            fieldType="textarea"
                            fieldName="cancellationReason"
                            height={120}
                            record={psychologicalExam}
                            setRecord={setPsychologicalExam}
                            //TODO convert key to code
                            disabled={psychologicalExam?.statusLkey === "3196709905099521"}
                        />
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="primary" onClick={handleCancle}
                    //TODO convert key to code
                     disabled={psychologicalExam?.statusLkey === "3196709905099521"} 
                     style={{ backgroundColor: 'var(--primary-blue)', color: 'white', zoom: .8 }}
                    >
                        Cancel
                    </Button>
                    <Divider vertical />
                    <Button appearance="ghost" color='blue' onClick={()=>{setPopupCancelOpen(false)}}
                         style={{ color: 'var(--primary-blue)', backgroundColor: 'white', zoom: .8 }}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Panel>
    );
};
export default PsychologicalExam;