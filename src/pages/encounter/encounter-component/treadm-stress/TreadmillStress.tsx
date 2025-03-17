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
    useSaveTreadmillStresseMutation,
    useGetTreadmillStressesQuery
} from '@/services/encounterService';
import MyInput from '@/components/MyInput';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import Translate from '@/components/Translate';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import MyLabel from '@/components/MyLabel';
import {
    newApTreadmillStress
} from '@/types/model-types-constructor';
import {
    ApTreadmillStress
} from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
const { Column, HeaderCell, Cell } = Table
const TreadmillStress = ({ patient, encounter }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const [treadmillStress, setTreadmillStress] = useState<ApTreadmillStress>({
        ...newApTreadmillStress,
        preTestSystolicBp: null,
        preTestDiastolicBp: null,
        exerciseDuration: null,
        maximumHeartRateAchieved: null,
        targetHeartRate: null,
        postTestSystolicBp: null,
        postTestDiastolicBp: null,
        recoveryTime: null,
    });
    const [saveTreadmillStress, saveTreadmillStressMutation] = useSaveTreadmillStresseMutation();
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [treadmillStressStatus, setTreadmillStressStatus] = useState('');
    const [allData, setAllData] = useState(false);
    const dispatch = useAppDispatch()
    const [treadmillStressListRequest, setTreadmillStressListRequest] = useState<ListRequest>({
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
    const { data: baselineECGFindingsLovQueryResponse } = useGetLovValuesByCodeQuery('CARDIAC_ECG_FINDINGS');
    const { data: numbersLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
    const { data: cardiacLovQueryResponse } = useGetLovValuesByCodeQuery('CARDIAC_ST_CHANGES');
    const { data: arrythmiasLovQueryResponse } = useGetLovValuesByCodeQuery('ARRYTHMIAS');
    const { data: treadmillLovQueryResponse } = useGetLovValuesByCodeQuery('TREADMILL_OUTCOMES');
    const { data: treadmillStressResponse, refetch: refetchTreadmillStress } = useGetTreadmillStressesQuery(treadmillStressListRequest);
    const isSelected = rowData => {
        if (rowData && treadmillStress && treadmillStress.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    const handleSave = async () => {
        //TODO convert key to code
        try {
            if (treadmillStress.key === undefined) {
                await saveTreadmillStress({ ...treadmillStress, patientKey: patient.key, encounterKey: encounter.key, statusLkey: "9766169155908512", createdBy: authSlice.user.key }).unwrap();
                dispatch(notify('Patient Treadmill Stress Added Successfully'));
                setTreadmillStress({ ...newApTreadmillStress, statusLkey: "9766169155908512" })
            } else {
                await saveTreadmillStress({ ...treadmillStress, patientKey: patient.key, encounterKey: encounter.key, updatedBy: authSlice.user.key }).unwrap();
    
                dispatch(notify('Patient Treadmill Stress Updated Successfully'));
            }
    
            await refetchTreadmillStress();
            handleClearField();
            
        } catch (error) {
            console.error("Error saving Treadmill Stress:", error);
            dispatch(notify('Failed to save Treadmill Stress'));
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
        saveTreadmillStress({ ...treadmillStress, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime(), deletedBy: authSlice.user.key }).unwrap().then(() => {
            dispatch(notify('Treadmill Stress Canceled Successfully'));
            refetchTreadmillStress();
        });
    };
    const handleClearField = () => {
        setPopupCancelOpen(false);
        setTreadmillStress({
            ...newApTreadmillStress,
            baselineEcgFindingsLkey: null,
            bruceProtocolStageLkey: null,
            segmentChangeLkey: null,
            typeLkey: null,
            statusLkey: null,
            testOutcomeLkey: null,
            arrhythmiaNoted: false
        });
    };
    ///useEffect
    useEffect(() => {
        setTreadmillStressListRequest((prev) => ({
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
        setTreadmillStressListRequest((prev) => ({
            ...prev,
            filters: [
                ...(treadmillStressStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: treadmillStressStatus,
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
    }, [treadmillStressStatus, allData]);
    useEffect(() => {
        setTreadmillStressListRequest((prev) => {
            const filters =
                treadmillStressStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                    ]
                    : treadmillStressStatus === '' && allData
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
    }, [allData, treadmillStressStatus]);
    return (
        <Panel>
            <Panel bordered style={{ padding: '10px' }}>
                <Form fluid layout='inline' style={{ display: 'flex' }}>

                    <MyInput
                        width={165}
                        column
                        fieldLabel="Test Indication"
                        fieldName="indication"
                        record={treadmillStress}
                        setRecord={setTreadmillStress}
                    />
                    <MyInput
                        column
                        width={165}
                        fieldLabel="Baseline ECG Findings"
                        fieldType="select"
                        fieldName="baselineEcgFindingsLkey"
                        selectData={baselineECGFindingsLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={treadmillStress}
                        setRecord={setTreadmillStress}
                    />
                     <Form style={{ display: 'flex', flexDirection: 'column', zoom: .8 }}>
                        <MyLabel label="Pre-Test Blood Pressure" />
                        <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '5px', width: 300 }}>

                            <Input
                                width={100}

                                type="number"
                                value={treadmillStress.preTestSystolicBp}
                                onChange={e =>
                                    setTreadmillStress({
                                        ...treadmillStress,
                                        preTestSystolicBp: Number(e)
                                    })} />
                            <span style={{ textAlign: 'center' }}>/</span>
                            <Input
                                width={100}
                                type="number"
                                value={treadmillStress.preTestDiastolicBp}
                                onChange={e =>
                                    setTreadmillStress({
                                        ...treadmillStress,
                                        preTestDiastolicBp: Number(e)
                                    })} />
                                
                        </Form>
                    </Form>

                    <MyInput
                        column
                        width={165}
                        fieldLabel="Bruce Protocol Stage "
                        fieldType="select"
                        fieldName="bruceProtocolStageLkey"
                        selectData={numbersLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={treadmillStress}
                        setRecord={setTreadmillStress}
                    />
                    <MyInput
                        column
                        width={165}
                        fieldLabel="ST Segment Change"
                        fieldType="select"
                        fieldName="segmentChangeLkey"
                        selectData={cardiacLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={treadmillStress}
                        setRecord={setTreadmillStress}
                    />
                    <MyInput
                        width={165}
                        column
                        fieldLabel="Arrhythmia Noted"
                        fieldType="checkbox"
                        fieldName="arrhythmiaNoted"
                        record={treadmillStress}
                        setRecord={setTreadmillStress}
                    />
                    <MyInput
                        width={165}
                        column
                        fieldLabel="Type"
                        fieldType="select"
                        fieldName="typeLkey"
                        selectData={arrythmiasLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={treadmillStress}
                        setRecord={setTreadmillStress}
                        disabled={!treadmillStress?.arrhythmiaNoted}
                    />
                    <MyInput
                        width={165}
                        column
                        fieldLabel="Test Outcome "
                        fieldType="select"
                        fieldName="testOutcomeLkey"
                        selectData={treadmillLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={treadmillStress}
                        setRecord={setTreadmillStress}
                    />
                   

                </Form>
                <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '5px', zoom: .8 }}>
                    <Form style={{ display: 'flex', flexDirection: 'column' }}>
                        <MyLabel label="Exercise Duration" />
                        <InputGroup style={{ width: 210 }}>

                            <Input
                                type="number"
                                width={165}
                                value={treadmillStress.exerciseDuration}
                                onChange={e =>
                                    setTreadmillStress({
                                        ...treadmillStress,
                                        exerciseDuration: Number(e),
                                    })
                                }
                            />
                            <InputGroup.Addon><Text>Minutes</Text></InputGroup.Addon>
                        </InputGroup>
                    </Form>
                    <Form style={{ display: 'flex', flexDirection: 'column' }}>
                        <MyLabel label="Maximum Heart Rate Achieved" />
                        <InputGroup style={{ width: 210 }}>

                            <Input
                                type="number"
                                width={165}
                                value={treadmillStress.maximumHeartRateAchieved}
                                onChange={e =>
                                    setTreadmillStress({
                                        ...treadmillStress,
                                        maximumHeartRateAchieved: Number(e),
                                    })
                                }
                            />
                            <InputGroup.Addon><Text>BPM</Text></InputGroup.Addon>
                        </InputGroup>
                    </Form>
                    <Form style={{ display: 'flex', flexDirection: 'column' }}>
                        <MyLabel label="Target Heart Rate" />
                        <InputGroup style={{ width: 210 }}>
                            <Input
                                type="number"
                                width={165}
                                value={treadmillStress.targetHeartRate}
                                onChange={e =>
                                    setTreadmillStress({
                                        ...treadmillStress,
                                        targetHeartRate: Number(e),
                                    })
                                }
                            />
                            <InputGroup.Addon><Text>% of Max HR</Text></InputGroup.Addon>
                        </InputGroup>
                    </Form>
                    <Form style={{ display: 'flex', flexDirection: 'column' }}>
                        <MyLabel label="Recovery Time" />
                        <InputGroup style={{ width: 210 }}>
                            <Input
                                type="number"
                                width={165}
                                value={treadmillStress.recoveryTime}
                                onChange={e =>
                                    setTreadmillStress({
                                        ...treadmillStress,
                                        recoveryTime: Number(e),
                                    })
                                }
                            />
                            <InputGroup.Addon><Text>Minutes</Text></InputGroup.Addon>
                        </InputGroup>
                    </Form>
                    <Form style={{ display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
                        <MyLabel label="Post-Test BP " />
                        <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '5px', width: 300 }}>

                            <Input
                                width={100}

                                type="number"
                                value={treadmillStress.postTestSystolicBp}
                                onChange={e =>
                                    setTreadmillStress({
                                        ...treadmillStress,
                                        postTestSystolicBp: Number(e)
                                    })} />
                            <span style={{ textAlign: 'center' }}>/</span>
                            <Input
                                width={100}
                                type="number"
                                value={treadmillStress.postTestDiastolicBp}
                                onChange={e =>
                                    setTreadmillStress({
                                        ...treadmillStress,
                                        postTestDiastolicBp: Number(e)
                                    })} />
                
                        </Form>
                    </Form>
                </Form>
                <Form style={{ display: 'flex', flexDirection: 'column',zoom:.8 }}>
                    <MyLabel label="Cardiologist Notes" />
                    <Input
                        as="textarea"
                        value={treadmillStress.cardiologistNotes}
                        onChange={(e) => setTreadmillStress({
                            ...treadmillStress,
                            cardiologistNotes: e
                        })}
                        style={{ width: 330 }}
                        rows={3}
                    />
                </Form>
                <ButtonToolbar style={{ zoom: .8, marginTop: '10px' }}>
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
            </Panel>
         
                <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ButtonToolbar>
                        <Button
                            appearance="primary"
                            style={{ backgroundColor: 'var(--primary-blue)', color: 'white', marginLeft: "5px", zoom: .8 }}
                            onClick={() => { setPopupCancelOpen(true) }}
                            disabled={!treadmillStress?.key}
                        >
                            <CloseOutlineIcon style={{ marginRight: '7px' }} />
                            <Translate>Cancel</Translate>
                        </Button>

                    </ButtonToolbar>
                    <Checkbox
                        onChange={(value, checked) => {
                            if (checked) {
                                //TODO convert key to code
                                setTreadmillStressStatus('3196709905099521');
                            }
                            else {
                                setTreadmillStressStatus('');
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
                    data={treadmillStressResponse?.object ?? []}
                    rowKey="key"
                    expandedRowKeys={expandedRowKeys}
                    renderRowExpanded={renderRowExpanded}
                    shouldUpdateScroll={false}
                    bordered
                    cellBordered
                    onRowClick={rowData => {
                        setTreadmillStress({
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
                            <Translate>Test Indication</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => rowData?.indication}
                        </Cell>
                    </Column >
                    <Column flexGrow={3} fullText>
                        <HeaderCell align="center">
                            <Translate>Baseline ECG Findings</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData?.baselineEcgFindingsLvalue
                                    ? rowData?.baselineEcgFindingsLvalue.lovDisplayVale
                                    : rowData?.baselineEcgFindingsLkey
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={3} fullText>
                        <HeaderCell align="center">
                            <Translate>Bruce Protocol Stage</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData?.bruceProtocolStageLvalue
                                    ? rowData?.bruceProtocolStageLvalue.lovDisplayVale
                                    : rowData?.bruceProtocolStageLkey
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Exercise Duration</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                <> {rowData?.exerciseDuration} {" Minutes"}

                                </>
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={4} fullText>
                        <HeaderCell align="center">
                            <Translate>Maximum Heart Rate Achieved</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                <> {rowData?.maximumHeartRateAchieved} {" BPM"}

                                </>
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Recovery Time </Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                <> {rowData?.recoveryTime} {" Minutes"}
                                </>
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Pre-Test BP</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => rowData?.preTestDiastolicBp != null && rowData?.preTestSystolicBp != null
                                ? ((2 * rowData?.preTestDiastolicBp + rowData?.preTestSystolicBp) / 3).toFixed(2)
                                : ''}
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Post-Test BP </Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => rowData?.postTestDiastolicBp != null && rowData?.postTestSystolicBp != null
                                ? ((2 * rowData?.postTestDiastolicBp + rowData?.postTestSystolicBp) / 3).toFixed(2)
                                : ''}
                        </Cell>
                    </Column>
                </Table>
            
            <Modal
                open={popupCancelOpen}
                onClose={() => setPopupCancelOpen(false)}
                size="sm"
            >
                <Modal.Header>
                    <Translate><h6>Confirm Cancel</h6></Translate>
                </Modal.Header>
                <Modal.Body>
                    <Form layout="inline" fluid>
                        <MyInput
                            width={600}
                            column
                            fieldLabel="Cancellation Reason"
                            fieldType="textarea"
                            fieldName="cancellationReason"
                            height={120}
                            record={treadmillStress}
                            setRecord={setTreadmillStress}
                            //TODO convert key to code
                            disabled={treadmillStress?.statusLkey === "3196709905099521"}
                        />
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="primary" onClick={handleCancle}
                    //TODO convert key to code
                        disabled={treadmillStress?.statusLkey === "3196709905099521"}
                        style={{ backgroundColor: 'var(--primary-blue)', color: 'white', zoom: .8 }}
                    >
                        Cancel
                    </Button>
                    <Divider vertical />
                    <Button appearance="ghost" color='blue' onClick={() => { setPopupCancelOpen(false) }}
                        style={{ color: 'var(--primary-blue)', backgroundColor: 'white', zoom: .8 }}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Panel>


    );
};
export default TreadmillStress;