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
    useSaveComplaintSymptomsMutation,
    useGetComplaintSymptomsQuery
} from '@/services/encounterService';
import MyInput from '@/components/MyInput';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import Translate from '@/components/Translate';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import MyLabel from '@/components/MyLabel';
import {
    newApComplaintSymptoms,
} from '@/types/model-types-constructor';
import {
    ApComplaintSymptoms
} from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
const { Column, HeaderCell, Cell } = Table
const ChiefComplaintSymptoms = ({ patient, encounter }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const [complaintSymptoms, setComplaintSymptoms] = useState<ApComplaintSymptoms>({
        ...newApComplaintSymptoms,
        duration: null,
    });
    const [associatedSymptoms, setAssociatedSymptoms] = useState({ associatedSymptomsLkey: '' });
    const [saveComplaintSymptoms, saveComplaintSymptomsMutation] = useSaveComplaintSymptomsMutation();
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [complaintSymptomsStatus, setComplaintSymptomsStatus] = useState('');
    const [allData, setAllData] = useState(false);
    const dispatch = useAppDispatch()
    const [complaintSymptomsListRequest, setComplaintSymptomsListRequest] = useState<ListRequest>({
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
    const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
    const { data: bodyPartsLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
    const { data: adversLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');
    const { data: complaintSymptomsResponse, refetch: refetchComplaintSymptoms } = useGetComplaintSymptomsQuery(complaintSymptomsListRequest, {
        skip: !patient?.key || !encounter?.key,
    });
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
    const isSelected = rowData => {
        if (rowData && complaintSymptoms && complaintSymptoms.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    const handleSave = () => {
        //TODO convert key to code
        if (complaintSymptoms.key === undefined) {
            saveComplaintSymptoms({ ...complaintSymptoms, patientKey: patient.key, encounterKey: encounter.key, onsetDate: complaintSymptoms?.onsetDate ? new Date(complaintSymptoms.onsetDate).getTime() : 0, statusLkey: "9766169155908512", createdBy: authSlice.user.key }).unwrap().then(() => {
                dispatch(notify('Patient Complaint Symptoms Added Successfully'));
            });
            setComplaintSymptoms({ ...complaintSymptoms, statusLkey: "9766169155908512" })
            refetchComplaintSymptoms();
            handleClearField();
        }
        else if (complaintSymptoms.key) {
            saveComplaintSymptoms({ ...complaintSymptoms, patientKey: patient.key, encounterKey: encounter.key, onsetDate: complaintSymptoms?.onsetDate ? new Date(complaintSymptoms.onsetDate).getTime() : 0, updatedBy: authSlice.user.key }).unwrap().then(() => {
                dispatch(notify('Patient Complaint Symptom Updated Successfully'));
                refetchComplaintSymptoms();
                handleClearField();
            });
        }
    };
    const handleCancle = () => {
        //TODO convert key to code
        saveComplaintSymptoms({ ...complaintSymptoms, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime(), deletedBy: authSlice.user.key }).unwrap().then(() => {
            dispatch(notify('Treadmill Complaint Symptoms Successfully'));
            refetchComplaintSymptoms();
        });
    };
    const handleClearField = () => {
        setPopupCancelOpen(false);
        setComplaintSymptoms({
            ...newApComplaintSymptoms,
            unitLkey: null,
            painLocationLkey: null
        });
    };
    ///useEffect
    useEffect(() => {
        setComplaintSymptomsListRequest((prev) => ({
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
        setComplaintSymptomsListRequest((prev) => ({
            ...prev,
            filters: [
                ...(complaintSymptomsStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: complaintSymptomsStatus,
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
    }, [complaintSymptomsStatus, allData]);
    useEffect(() => {
        setComplaintSymptomsListRequest((prev) => {
            const filters =
                complaintSymptomsStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                    ]
                    : complaintSymptomsStatus === '' && allData
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
    }, [allData, complaintSymptomsStatus]);
    useEffect(() => {
        if (associatedSymptoms.associatedSymptomsLkey != null) {
            const foundItemKey = adversLovQueryResponse?.object?.find(
                item => item.key === associatedSymptoms.associatedSymptomsLkey
            );
            const foundItem = foundItemKey?.lovDisplayVale || '';;
            setComplaintSymptoms(prevComplaintSymptoms => ({
                ...prevComplaintSymptoms,
                associatedSymptoms: prevComplaintSymptoms.associatedSymptoms
                    ? prevComplaintSymptoms.associatedSymptoms.includes(foundItem)
                        ? prevComplaintSymptoms.associatedSymptoms
                        : `${prevComplaintSymptoms.associatedSymptoms}, ${foundItem}`
                    : foundItem
            }));
        }
    }, [associatedSymptoms.associatedSymptomsLkey]);

    return (
        <Panel>
            <Panel bordered style={{ padding: '10px' }}>
            <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '5px' ,zoom:.8}}>
                    <Form style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '10px' }}>
                        <MyLabel label="Chief Complaint" />
                        <Input
                            as="textarea"
                            value={complaintSymptoms.chiefComplaint}
                            onChange={(e) => setComplaintSymptoms({
                                ...complaintSymptoms,
                                chiefComplaint: e
                            })}
                            style={{ width: 330 }}
                            rows={3}
                        />
                    </Form>

                    <Form fluid layout='inline' style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        <MyInput
                            width={360}
                            column
                            fieldLabel="Associated Symptoms"
                            fieldType="select"
                            fieldName='associatedSymptomsLkey'
                            selectData={adversLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={associatedSymptoms}
                            setRecord={setAssociatedSymptoms}
                        />
                        <Input
                            as="textarea"
                            value={complaintSymptoms.associatedSymptoms || ""}
                            onChange={(value) =>
                                setComplaintSymptoms((prev) => ({
                                    ...prev,
                                    associatedSymptoms: value
                                }))
                            }
                            style={{ width: 300, marginTop: 0 }}
                            rows={3}
                        />

                    </Form>
                </Form>
                <Form fluid layout='inline' style={{ display: 'flex' }}>
                    <MyInput
                        width={165}
                        column
                        fieldType="date"
                        fieldLabel="Onset Date"
                        fieldName="onsetDate"
                        record={complaintSymptoms}
                        setRecord={setComplaintSymptoms}
                    />
                    <MyInput
                        width={165}
                        column
                        fieldType="number"
                        fieldLabel="Duration"
                        fieldName="duration"
                        record={complaintSymptoms}
                        setRecord={setComplaintSymptoms}
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
                        record={complaintSymptoms}
                        setRecord={setComplaintSymptoms}
                    />
                    <MyInput
                        column
                        width={165}
                        fieldLabel="Pain Characteristics"
                        fieldName="painCharacteristics"
                        record={complaintSymptoms}
                        setRecord={setComplaintSymptoms}
                    />
                    <MyInput
                        column
                        width={165}
                        fieldLabel="Pain Location"
                        fieldType="select"
                        fieldName="painLocationLkey"
                        selectData={bodyPartsLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={complaintSymptoms}
                        setRecord={setComplaintSymptoms}
                    />
                    <MyInput
                        width={165}
                        column
                        fieldLabel="Radiation"
                        fieldName="radiation"
                        record={complaintSymptoms}
                        setRecord={setComplaintSymptoms}
                    />
                    <MyInput
                        width={165}
                        column
                        fieldLabel="Aggravating Factors"
                        fieldName="aggravatingFactors"
                        record={complaintSymptoms}
                        setRecord={setComplaintSymptoms}
                    />
                    <MyInput
                        width={165}
                        column
                        fieldLabel="Relieving Factors"
                        fieldName="relievingFactors"
                        record={complaintSymptoms}
                        setRecord={setComplaintSymptoms}
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
                        disabled={!complaintSymptoms?.key}
                    >
                        <CloseOutlineIcon style={{ marginRight: '7px' }} />
                        <Translate>Cancel</Translate>
                    </Button>

                </ButtonToolbar>
                <Checkbox
                    onChange={(value, checked) => {
                        if (checked) {
                            setComplaintSymptomsStatus('3196709905099521');
                            //TODO convert key to code
                        }
                        else {
                            setComplaintSymptomsStatus('');
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
                data={complaintSymptomsResponse?.object ?? []}
                rowKey="key"
                expandedRowKeys={expandedRowKeys}
                renderRowExpanded={renderRowExpanded}
                shouldUpdateScroll={false}
                bordered
                cellBordered
                onRowClick={rowData => {
                    setComplaintSymptoms({
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
                        <Translate>Onset Date</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.onsetDate ? new Date(rowData.onsetDate).toLocaleString("en-GB") : ""}
                    </Cell>
                </Column >
                <Column flexGrow={3} fullText>
                    <HeaderCell align="center">
                        <Translate>Duration</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            <>

                                {rowData?.duration}
                                {" "}
                                {rowData?.unitLvalue
                                    ? rowData?.unitLvalue.lovDisplayVale
                                    : rowData?.unitLkey}
                            </>

                        }
                    </Cell>
                </Column>
                <Column flexGrow={3} fullText>
                    <HeaderCell align="center">
                        <Translate>Pain Characteristics</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.painCharacteristics}
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Pain Location</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.painLocationLvalue
                            ? rowData?.painLocationLvalue.lovDisplayVale
                            : rowData?.painLocationLkey}
                    </Cell>
                </Column>
                <Column flexGrow={4} fullText>
                    <HeaderCell align="center">
                        <Translate>Radiation</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.radiation}
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Aggravating Factors</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.aggravatingFactors}
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Relieving Factors</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.relievingFactors}
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
                            record={complaintSymptoms}
                            setRecord={setComplaintSymptoms}
                            //TODO convert key to code
                            disabled={complaintSymptoms?.statusLkey === "3196709905099521"}
                        />
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="primary" onClick={handleCancle}
                    //TODO convert key to code
                        disabled={complaintSymptoms?.statusLkey === "3196709905099521"}
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
export default ChiefComplaintSymptoms;