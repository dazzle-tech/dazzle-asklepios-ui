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
    useSaveAudiometryPuretoneMutation,
    useGetAudiometryPuretonesQuery
} from '@/services/encounterService';
import MyInput from '@/components/MyInput';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import Translate from '@/components/Translate';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import MyLabel from '@/components/MyLabel';
import {
    newApAudiometryPuretone
} from '@/types/model-types-constructor';
import {
    ApAudiometryPuretone
} from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
const { Column, HeaderCell, Cell } = Table
const AudiometryPuretone = ({ patient, encounter }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const [audiometryPuretone, setAudiometryPuretone] = useState<ApAudiometryPuretone>({
        ...newApAudiometryPuretone
        , earExamFindingsLkey: null,
        airConductionFrequenciesLeft: null,
        airConductionFrequenciesRight: null,
        hearingThresholdsLeft: null,
        hearingThresholdsRight: null,
        boneConductionFrequenciesLeft: null,
        boneConductionFrequenciesRight: null,
        boneConductionThresholdsLeft: null,
        boneConductionThresholdsRight: null,
        maskedUsed: false,
        hearingLossTypeLkey: null,
        hearingLossDegreeLkey: null,
    });
    const [saveAudiometryPureton, saveAudiometryPuretonMutation] = useSaveAudiometryPuretoneMutation();
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [audiometryPuretonStatus, setAudiometryPuretonStatus] = useState('');
    const [allData, setAllData] = useState(false);
    const dispatch = useAppDispatch()
    const [audiometryPuretoneListRequest, setAudiometryPuretoneListRequest] = useState<ListRequest>({
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
    const { data: earExamFindingsLovQueryResponse } = useGetLovValuesByCodeQuery('EAR_EXAM_FINDINGS');
    const { data: hearingLossTypeLovQueryResponse } = useGetLovValuesByCodeQuery('HEARING_LOSS_TYPES');
    const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');
    const { data: audiometryPuretonResponse, refetch: refetchAudiometryPureton } = useGetAudiometryPuretonesQuery(audiometryPuretoneListRequest, {
        skip: !patient?.key || !encounter?.key,
    });
    const isSelected = rowData => {
        if (rowData && audiometryPuretone && audiometryPuretone.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    const handleSave = () => {
        //TODO convert key to code
        if (audiometryPuretone.key === undefined) {
            saveAudiometryPureton({ ...audiometryPuretone, patientKey: patient.key, encounterKey: encounter.key, statusLkey: "9766169155908512", createdBy: authSlice.user.key }).unwrap().then(() => {
                dispatch(notify('Patient Audiometry Pureton Added Successfully'));
            });
            setAudiometryPuretone({ ...newApAudiometryPuretone, statusLkey: "9766169155908512" })
            refetchAudiometryPureton();
            handleClearField();
        }
        else if (audiometryPuretone.key) {
            saveAudiometryPureton({ ...audiometryPuretone, patientKey: patient.key, encounterKey: encounter.key, updatedBy: authSlice.user.key }).unwrap().then(() => {
                dispatch(notify('Patient Audiometry Pureton Updated Successfully'));
                refetchAudiometryPureton();
                handleClearField();
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
                style={{ width: '100%', marginTop: '10px', overflow: "visible" }}
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
        saveAudiometryPureton({ ...audiometryPuretone, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime(), deletedBy: authSlice.user.key }).unwrap().then(() => {
            dispatch(notify('Audiometry Pureton Canceled Successfully'));
            refetchAudiometryPureton();
        });
    };
    const handleClearField = () => {
        setPopupCancelOpen(false);
        setAudiometryPuretone({
            ...newApAudiometryPuretone,
            earExamFindingsLkey: null,
            maskedUsed: false,
            hearingLossTypeLkey: null,
            hearingLossDegreeLkey: null,
        });
    }
    ///useEffect
    useEffect(() => {
        setAudiometryPuretoneListRequest((prev) => ({
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
        setAudiometryPuretoneListRequest((prev) => ({
            ...prev,
            filters: [
                ...(audiometryPuretonStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: audiometryPuretonStatus,
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
    }, [audiometryPuretonStatus, allData]);
    useEffect(() => {
        setAudiometryPuretoneListRequest((prev) => {
            const filters =
                audiometryPuretonStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                    ]
                    : audiometryPuretonStatus === '' && allData
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
    }, [allData, audiometryPuretonStatus]);
    return (
        <Panel header={"Audiometry Puretone"}>
            <Panel bordered style={{ padding: '10px' }}>
                <Form fluid layout='inline'>
                    <MyInput
                        width={165}
                        column
                        fieldLabel="Test Environmen"
                        fieldName="testEnvironment"
                        record={audiometryPuretone}
                        setRecord={setAudiometryPuretone}
                    />
                    <MyInput
                        fieldLabel="Test Reason"
                        width={165}
                        column
                        fieldName="testReason"
                        record={audiometryPuretone}
                        setRecord={setAudiometryPuretone}
                    />
                    <MyInput
                        column
                        width={165}
                        fieldLabel="Ear Exam Findings"
                        fieldType="select"
                        fieldName="earExamFindingsLkey"
                        selectData={earExamFindingsLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={audiometryPuretone}
                        setRecord={setAudiometryPuretone}
                    />
                    <br />
                    <Form style={{ display: 'flex', alignItems: 'center' }}>
                        <Panel header={"Right Ear"} bordered>
                            <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px', zoom: .75 }}>
                                    <MyLabel label="Air Conduction Frequencies " />
                                    <InputGroup style={{ width: 210 }}>

                                        <Input
                                            type="number"
                                            width={165}
                                            value={audiometryPuretone.airConductionFrequenciesRight}
                                            onChange={e =>
                                                setAudiometryPuretone({
                                                    ...audiometryPuretone,
                                                    airConductionFrequenciesRight: Number(e),
                                                })
                                            }
                                        />
                                        <InputGroup.Addon><Text>Hz</Text></InputGroup.Addon>
                                    </InputGroup>
                                </div>
                                <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px', zoom: .75 }}>
                                    <MyLabel label="Hearing Thresholds" />
                                    <InputGroup style={{ width: 210 }}>

                                        <Input
                                            type="number"
                                            width={165}
                                            value={audiometryPuretone.hearingThresholdsRight}
                                            onChange={e =>
                                                setAudiometryPuretone({
                                                    ...audiometryPuretone,
                                                    hearingThresholdsRight: Number(e),
                                                })
                                            }
                                        />
                                        <InputGroup.Addon><Text>dB HL</Text></InputGroup.Addon>
                                    </InputGroup>
                                </div>
                                <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px', zoom: .75 }}>
                                    <MyLabel label="Bone Conduction Frequencies" />
                                    <InputGroup style={{ width: 210 }}>

                                        <Input
                                            type="number"
                                            width={165}
                                            value={audiometryPuretone.boneConductionFrequenciesRight}
                                            onChange={e =>
                                                setAudiometryPuretone({
                                                    ...audiometryPuretone,
                                                    boneConductionFrequenciesRight: Number(e),
                                                })
                                            }
                                        />
                                        <InputGroup.Addon><Text>Hz</Text></InputGroup.Addon>
                                    </InputGroup>
                                </div>
                                <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px', zoom: .75 }}>
                                    <MyLabel label="Bone Conduction Thresholds" />
                                    <InputGroup style={{ width: 210 }}>

                                        <Input
                                            type="number"
                                            width={165}
                                            value={audiometryPuretone.boneConductionThresholdsRight}
                                            onChange={e =>
                                                setAudiometryPuretone({
                                                    ...audiometryPuretone,
                                                    boneConductionThresholdsRight: Number(e),
                                                })
                                            }
                                        />
                                        <InputGroup.Addon><Text>dB HL</Text></InputGroup.Addon>
                                    </InputGroup>
                                </div>

                            </Form>
                        </Panel>
                        <Panel bordered header={"Left Ear"} >
                            <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px', zoom: .75 }}>
                                    <MyLabel label="Air Conduction Frequencies " />
                                    <InputGroup style={{ width: 210 }}>

                                        <Input
                                            type="number"
                                            width={165}
                                            value={audiometryPuretone.airConductionFrequenciesLeft}
                                            onChange={e =>
                                                setAudiometryPuretone({
                                                    ...audiometryPuretone,
                                                    airConductionFrequenciesLeft: Number(e),
                                                })
                                            }
                                        />
                                        <InputGroup.Addon><Text>Hz</Text></InputGroup.Addon>
                                    </InputGroup>
                                </div>
                                <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px', zoom: .75 }}>
                                    <MyLabel label="Hearing Thresholds" />
                                    <InputGroup style={{ width: 210 }}>

                                        <Input
                                            type="number"
                                            width={165}
                                            value={audiometryPuretone.hearingThresholdsLeft}
                                            onChange={e =>
                                                setAudiometryPuretone({
                                                    ...audiometryPuretone,
                                                    hearingThresholdsLeft: Number(e),
                                                })
                                            }
                                        />
                                        <InputGroup.Addon><Text>dB HL</Text></InputGroup.Addon>
                                    </InputGroup>
                                </div>
                                <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px', zoom: .75 }}>
                                    <MyLabel label="Bone Conduction Frequencies" />
                                    <InputGroup style={{ width: 210 }}>

                                        <Input
                                            type="number"
                                            width={165}
                                            value={audiometryPuretone.boneConductionFrequenciesLeft}
                                            onChange={e =>
                                                setAudiometryPuretone({
                                                    ...audiometryPuretone,
                                                    boneConductionFrequenciesLeft: Number(e),
                                                })
                                            }
                                        />
                                        <InputGroup.Addon><Text>Hz</Text></InputGroup.Addon>
                                    </InputGroup>
                                </div>
                                <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px', zoom: .75 }}>
                                    <MyLabel label="Bone Conduction Thresholds" />
                                    <InputGroup style={{ width: 210 }}>

                                        <Input
                                            type="number"
                                            width={165}
                                            value={audiometryPuretone.boneConductionThresholdsLeft}
                                            onChange={e =>
                                                setAudiometryPuretone({
                                                    ...audiometryPuretone,
                                                    boneConductionThresholdsLeft: Number(e),
                                                })
                                            }
                                        />
                                        <InputGroup.Addon><Text>dB HL</Text></InputGroup.Addon>
                                    </InputGroup>
                                </div>
                            </Form>
                        </Panel>
                    </Form>
                    <MyInput
                        width={165}
                        column
                        fieldLabel="Masked Used"
                        fieldType="checkbox"
                        fieldName="maskedUsed"
                        record={audiometryPuretone}
                        setRecord={setAudiometryPuretone}
                    />
                    <MyInput
                        column
                        width={165}
                        fieldLabel="Hearing Loss Type"
                        fieldType="select"
                        fieldName="hearingLossTypeLkey"
                        selectData={hearingLossTypeLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={audiometryPuretone}
                        setRecord={setAudiometryPuretone}
                    />
                    <MyInput
                        column
                        width={165}
                        fieldLabel="Hearing Loss Degree"
                        fieldType="select"
                        fieldName="hearingLossDegreeLkey"
                        selectData={severityLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={audiometryPuretone}
                        setRecord={setAudiometryPuretone}
                    />

                    <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '5px', zoom: .75 }}>
                        <Form style={{ display: 'flex', flexDirection: 'column' }}>
                            <MyLabel label="Recommendations" />
                            <Input
                                as="textarea"
                                value={audiometryPuretone.recommendations}
                                onChange={(e) => setAudiometryPuretone({
                                    ...audiometryPuretone,
                                    recommendations: e
                                })}
                                style={{ width: 330 }}
                                rows={3}
                            />
                        </Form>
                        <Form style={{ display: 'flex', flexDirection: 'column' }}>
                            <MyLabel label="Additional Notes" />
                            <Input
                                as="textarea"
                                value={audiometryPuretone.additionalNotes}
                                onChange={(e) => setAudiometryPuretone({
                                    ...audiometryPuretone,
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
            <Panel header={"Patient's Audiometry Puretone"} collapsible bordered>
                <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ButtonToolbar>
                        <Button
                            appearance="primary"
                            style={{ backgroundColor: 'var(--primary-blue)', color: 'white', marginLeft: "5px", zoom: .8 }}
                            onClick={() => { setPopupCancelOpen(true) }}
                            disabled={!audiometryPuretone?.key}
                        >
                            <CloseOutlineIcon style={{ marginRight: '7px' }} />
                            <Translate>Cancel</Translate>
                        </Button>

                    </ButtonToolbar>
                    <Checkbox
                        onChange={(value, checked) => {
                            if (checked) {
                                //TODO convert key to code
                                setAudiometryPuretonStatus('3196709905099521');
                            }
                            else {
                                setAudiometryPuretonStatus('');
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
                    data={audiometryPuretonResponse?.object ?? []}
                    rowKey="key"
                    expandedRowKeys={expandedRowKeys}
                    renderRowExpanded={renderRowExpanded}
                    shouldUpdateScroll={false}
                    bordered
                    cellBordered
                    onRowClick={rowData => {
                        setAudiometryPuretone({
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
                            <Translate>Test Environmen</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData?.testEnvironment
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Test Reason</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData?.testReason
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Ear Exam Findings</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => rowData?.earExamFindingsLvalue
                                ? rowData?.earExamFindingsLvalue.lovDisplayVale
                                : rowData?.earExamFindingsLkey
                            }
                        </Cell>
                    </Column >

                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Masked used</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData?.maskedUsed
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Hearing Loss Type</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => rowData?.hearingLossTypeLvalue
                                ? rowData?.hearingLossTypeLvalue.lovDisplayVale
                                : rowData?.hearingLossTypeLkey
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={3} fullText>
                        <HeaderCell align="center">
                            <Translate>Hearing Loss Degree</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => rowData?.hearingLossDegreeLvalue
                                ? rowData?.hearingLossDegreeLvalue.lovDisplayVale
                                : rowData?.hearingLossDegreeLkey
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Recommendations </Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => rowData?.recommendations}
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
                    <Form layout="inline" fluid>
                        <MyInput
                            width={600}
                            column
                            fieldLabel="Cancellation Reason"
                            fieldType="textarea"
                            fieldName="cancellationReason"
                            height={120}
                            record={audiometryPuretone}
                            setRecord={setAudiometryPuretone}
                            //TODO convert key to code
                            disabled={audiometryPuretone?.statusLkey === "3196709905099521"}
                        />
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="primary" onClick={handleCancle}
                    //TODO convert key to code
                        disabled={audiometryPuretone?.statusLkey === "3196709905099521"}
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
export default AudiometryPuretone;