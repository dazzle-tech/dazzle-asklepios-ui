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
    useSaveElectrocardiogramECGMutation,
  useGetElectrocardiogramECGsQuery
} from '@/services/encounterService';
import MyInput from '@/components/MyInput';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import Translate from '@/components/Translate';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import MyLabel from '@/components/MyLabel';
import {
    newApElectrocardiogramEcg
} from '@/types/model-types-constructor';
import {
    ApElectrocardiogramEcg
} from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
const { Column, HeaderCell, Cell } = Table
const ElectrocardiogramECG = ({ patient, encounter }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const [electrocardiogramEcg, setElectrocardiogramEcg] = useState<ApElectrocardiogramEcg>({
        ...newApElectrocardiogramEcg,
        stSegmentChangesLkey:null,
        waveAbnormalitiesLkey:null,
        heartRate:null,
	prInterval:null,
	qrsDuration:null,
	qtInterval:null
    });
    const [saveElectrocardiogramECG, saveElectrocardiogramECGMutation] = useSaveElectrocardiogramECGMutation();
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [electrocardiogramEcgStatus, setElectrocardiogramEcgStatus] = useState('');
    const [allData, setAllData] = useState(false);
    const dispatch = useAppDispatch()
    const [electrocardiogramEcgListRequest, setElectrocardiogramEcgListRequest] = useState<ListRequest>({
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
    const { data: segmentChangesLovQueryResponse } = useGetLovValuesByCodeQuery('CARDIAC_ST_CHANGES');
    const { data: waveAbnormalitiesLovQueryResponse } = useGetLovValuesByCodeQuery('TWAVE_ABNORMAL');
    
    const { data: electrocardiogramEcgResponse, refetch: refetchelectrocardiogramEcg } = useGetElectrocardiogramECGsQuery(electrocardiogramEcgListRequest);
    const isSelected = rowData => {
        if (rowData && electrocardiogramEcg && electrocardiogramEcg.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    const handleSave = () => {
        //TODO convert key to code
        if (electrocardiogramEcg.key === undefined) {
            saveElectrocardiogramECG({ ...electrocardiogramEcg, patientKey: patient.key, encounterKey: encounter.key, statusLkey: "9766169155908512", createdBy: authSlice.user.key }).unwrap().then(() => {
                dispatch(notify('Patient ECG Added Successfully'));
            });
            setElectrocardiogramEcg({ ...newApElectrocardiogramEcg, statusLkey: "9766169155908512" })
            refetchelectrocardiogramEcg();
            handleClearField();
        }
        else if (electrocardiogramEcg.key) {
            saveElectrocardiogramECG({ ...electrocardiogramEcg, patientKey: patient.key, encounterKey: encounter.key, updatedBy: authSlice.user.key }).unwrap().then(() => {
                dispatch(notify('Patient ECG Updated Successfully'));
                setElectrocardiogramEcg({ ...newApElectrocardiogramEcg })
                refetchelectrocardiogramEcg();
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
        saveElectrocardiogramECG({ ...electrocardiogramEcg, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime(), deletedBy: authSlice.user.key }).unwrap().then(() => {
            dispatch(notify('ECG Canceled Successfully'));
            refetchelectrocardiogramEcg();
        });
    };
    const handleClearField = () => {
        setPopupCancelOpen(false);
        setElectrocardiogramEcg({
            ...newApElectrocardiogramEcg,
            stSegmentChangesLkey:null,
            waveAbnormalitiesLkey:null
        });
    };
    ///useEffect
    useEffect(() => {
           setElectrocardiogramEcgListRequest((prev) => ({
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
        setElectrocardiogramEcgListRequest((prev) => ({
            ...prev,
            filters: [
                ...(electrocardiogramEcgStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: electrocardiogramEcgStatus,
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
    }, [electrocardiogramEcgStatus, allData]);
    useEffect(() => {
        setElectrocardiogramEcgListRequest((prev) => {
            const filters =
            electrocardiogramEcgStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                    ]
                    : electrocardiogramEcgStatus === '' && allData
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
    }, [allData, electrocardiogramEcgStatus]);
    return (
        <Panel>
            <Panel bordered style={{ padding: '10px' }}>
                <Form fluid layout='inline' style={{ display: 'flex' }}>

                    <MyInput
                        width={180}
                        column
                        fieldLabel="Indication"
                        fieldName="indication"
                        record={electrocardiogramEcg}
                        setRecord={setElectrocardiogramEcg}
                    />
                      <MyInput
                        width={180}
                        column
                        fieldLabel="ECG Lead Type"
                        fieldName="ecgLeadType"
                        record={electrocardiogramEcg}
                        setRecord={setElectrocardiogramEcg}
                    />
                  
                    <MyInput
                        width={180}
                        column
                        fieldLabel="Segment Changes"
                        fieldType="select"
                        fieldName="stSegmentChangesLkey"
                        selectData={segmentChangesLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={electrocardiogramEcg}
                        setRecord={setElectrocardiogramEcg}
                    />
                    <MyInput
                        width={180}
                        column
                        fieldLabel="T Wave Abnormalities"
                        fieldType="select"
                        fieldName="waveAbnormalitiesLkey"
                        selectData={waveAbnormalitiesLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={electrocardiogramEcg}
                        setRecord={setElectrocardiogramEcg}
                    />
                      <MyInput
                        width={180}
                        column
                        fieldLabel="Rhythm Analysis"
                        fieldName="rhythmAnalysis"
                        record={electrocardiogramEcg}
                        setRecord={setElectrocardiogramEcg}
                    />
                           <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '5px', zoom: .77 ,marginTop:"5px"}}>
                      <Form style={{ display: 'flex', flexDirection: 'column' }}>
                        <MyLabel label="Heart Rate" />
                        <InputGroup style={{ width: 210 }}>

                            <Input
                                type="number"
                                width={165}
                                value={electrocardiogramEcg.heartRate}
                                onChange={e =>
                                    setElectrocardiogramEcg({
                                        ...electrocardiogramEcg,
                                        heartRate: Number(e),
                                    })
                                }
                            />
                            <InputGroup.Addon><Text>BPM</Text></InputGroup.Addon>
                        </InputGroup>
                    </Form>
                  
                    </Form>
                </Form>
                <Form fluid layout='inline' style={{ display: 'flex', gap: '5px', zoom: .77 ,marginTop:"5px"}}>
                <Form style={{ display: 'flex', flexDirection: 'column' }}>
                        <MyLabel label="PR Interval" />
                        <InputGroup style={{ width: 210 }}>

                            <Input
                                type="number"
                                width={165}
                                value={electrocardiogramEcg.prInterval}
                                onChange={e =>
                                    setElectrocardiogramEcg({
                                        ...electrocardiogramEcg,
                                        prInterval: Number(e),
                                    })
                                }
                            />
                            <InputGroup.Addon><Text>ms</Text></InputGroup.Addon>
                        </InputGroup>
                    </Form>
                    <Form style={{ display: 'flex', flexDirection: 'column' }}>
                        <MyLabel label="QRS Duration " />
                        <InputGroup style={{ width: 210 }}>

                            <Input
                                type="number"
                                width={165}
                                value={electrocardiogramEcg.qrsDuration}
                                onChange={e =>
                                    setElectrocardiogramEcg({
                                        ...electrocardiogramEcg,
                                        qrsDuration: Number(e),
                                    })
                                }
                            />
                            <InputGroup.Addon><Text>ms</Text></InputGroup.Addon>
                        </InputGroup>
                    </Form>
                  
                <Form style={{ display: 'flex', flexDirection: 'column' }}>
                        <MyLabel label="QT Interval" />
                        <InputGroup style={{ width: 210 }}>

                            <Input
                                type="number"
                                width={165}
                                value={electrocardiogramEcg.qtInterval}
                                onChange={e =>
                                    setElectrocardiogramEcg({
                                        ...electrocardiogramEcg,
                                        qtInterval: Number(e),
                                    })
                                }
                            />
                            <InputGroup.Addon><Text>ms</Text></InputGroup.Addon>
                        </InputGroup>
                    </Form>
                <Form style={{ display: 'flex', flexDirection: 'column' }}>
                        <MyLabel label="ECG Interpretation" />
                        <Input
                            as="textarea"
                            value={electrocardiogramEcg.ecgInterpretation}
                            onChange={(e) => setElectrocardiogramEcg({
                                ...electrocardiogramEcg,
                                ecgInterpretation: e
                            })}
                            style={{ width: 330 }}
                            rows={3}
                        />
                    </Form>
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
                            disabled={!electrocardiogramEcg?.key}
                        >
                            <CloseOutlineIcon style={{ marginRight: '7px' }} />
                            <Translate>Cancel</Translate>
                        </Button>

                    </ButtonToolbar>
                    <Checkbox
                        onChange={(value, checked) => {
                            if (checked) {
                                //TODO convert key to code
                                setElectrocardiogramEcgStatus('3196709905099521');
                            }
                            else {
                                setElectrocardiogramEcgStatus('');
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
                    data={electrocardiogramEcgResponse?.object ?? []}
                    rowKey="key"
                    expandedRowKeys={expandedRowKeys}
                    renderRowExpanded={renderRowExpanded}
                    shouldUpdateScroll={false}
                    bordered
                    cellBordered
                    onRowClick={rowData => {
                        setElectrocardiogramEcg({
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
                            <Translate>Indication</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => rowData?.indication}
                        </Cell>
                    </Column >
                    <Column flexGrow={3} fullText>
                        <HeaderCell align="center">
                            <Translate>ECG Lead Type</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>rowData?.ecgLeadType}
                        </Cell>
                    </Column>
                    <Column flexGrow={3} fullText>
                        <HeaderCell align="center">
                            <Translate>Heart Rate</Translate>
                        </HeaderCell>
                        <Cell>
                        {rowData => 
                               <> 
                              {rowData?.heartRate}
                              {" BPM"}
                            </>}
                            
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>PR Interval </Translate>
                        </HeaderCell>
                        <Cell>
                        {rowData => 
                               <> 
                        {rowData?.prInterval}
                            {" ms"}
                            </>}
                        
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>QRS Duration </Translate>
                        </HeaderCell>
                        <Cell>
                        
                            {rowData => 
                               <> 
                        {rowData?.qrsDuration}
                            {" ms"}
                            </>}
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>QT Interval</Translate>
                        </HeaderCell>
                        <Cell>
                        {rowData => 
                               <> 
                        {rowData?.qtInterval}
                            {" ms"}
                            </>}
                       
                        </Cell>
                    </Column>
                    <Column flexGrow={3} fullText>
                        <HeaderCell align="center">
                            <Translate>ST Segment Changes</Translate>
                        </HeaderCell>
                        <Cell>
                        {rowData =>
                                rowData?.stSegmentChangesLvalue
                                    ? rowData?.stSegmentChangesLvalue.lovDisplayVale
                                    : rowData?.stSegmentChangesLkey
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={3} fullText>
                        <HeaderCell align="center">
                            <Translate>T Wave Abnormalities</Translate>
                        </HeaderCell>
                        <Cell>
                        {rowData =>
                                rowData?.waveAbnormalitiesLvalue
                                    ? rowData?.waveAbnormalitiesLvalue.lovDisplayVale
                                    : rowData?.waveAbnormalitiesLkey
                            }
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
                            record={electrocardiogramEcg}
                            setRecord={setElectrocardiogramEcg}
                            //TODO convert key to code
                            disabled={electrocardiogramEcg?.statusLkey === "3196709905099521"}
                        />
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="primary" onClick={handleCancle}
                    //TODO convert key to code
                        disabled={electrocardiogramEcg?.statusLkey === "3196709905099521"}
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
export default ElectrocardiogramECG;