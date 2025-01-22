import React, { useEffect, useState } from 'react';
import { Placeholder } from 'rsuite';
import Translate from '@/components/Translate';
import './styles.less';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { Tag } from 'rsuite';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import CheckOutlineIcon from '@rsuite/icons/CheckOutline';
import ReloadIcon from '@rsuite/icons/Reload';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
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

} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;

import { FaCalendar, FaClock } from 'react-icons/fa';
import { BsCalendar2MonthFill } from 'react-icons/bs';
import MyInput from '@/components/MyInput';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import CheckIcon from '@rsuite/icons/Check';
import PlusIcon from '@rsuite/icons/Plus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import {
    useGetLovValuesByCodeQuery,
    useGetLovValuesQuery,
    useGetAllergensQuery
} from '@/services/setupService';
import {
    useGetWarningsQuery,
    useSaveWarningsMutation
} from '@/services/observationService';
import { ApVisitWarning } from '@/types/model-types';
import { newApVisitWarning } from '@/types/model-types-constructor';

const Warning = () => {
    const patientSlice = useAppSelector(state => state.patient);

    const { data: warningTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_WARNING_TYPS');
    const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');
    const { data: sourceofinformationLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
    const { data: statusLovQueryResponse } = useGetLovValuesByCodeQuery('ALLERGY_RES_STATUS');
    const [warning, setWarning] = useState<ApVisitWarning>({ ...newApVisitWarning });
    const [saveWarning, saveWarningMutation] = useSaveWarningsMutation();
    const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
    const [openConfirmResolvedModel, setOpenConfirmResolvedModel] = useState(false);
    const [openConfirmUndoResolvedModel, setOpenConfirmUndoResolvedModel] = useState(false);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const [showCanceled, setShowCanceled] = useState(true);
    const [editing, setEditing] = useState(false);
    const [showPrev, setShowPrev] = useState(true);
    const [listRequestWar, setListRequestWar] = useState<ListRequest>({
        ...initialListRequest, filters: [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patientSlice.patient.key
            },
            {
                fieldName: "status_lkey",
                operator: showCanceled ? "notMatch" : "match",
                value: "3196709905099521",
            }
        ]
    })
 
    const { data: warningsListResponse, refetch: fetchwarnings } = useGetWarningsQuery({ ...listRequestWar });
    const [selectedFirstDate, setSelectedFirstDate] = useState(null);
    const [editDate, setEditDate] = useState(true)
    const [editSourceof, seteditSourceof] = useState(true);
    const dispatch = useAppDispatch();

    const isSelected = rowData => {
        if (rowData && warning && rowData.key === warning.key) {
            return 'selected-row';
        } else return '';
    };
    useEffect(() => {

    }, [selectedFirstDate]);
    useEffect(() => {

        if (warning.firstTimeRecorded != 0) {
            setEditDate(false);
            setSelectedFirstDate(new Date(warning.firstTimeRecorded));
        }
        if (warning.sourceOfInformationLkey != null) {
            seteditSourceof(false);
        }
    }, [warning]);
    //  useEffect(() => {
    //     console.log("Show prev",showPrev)
    //     setListRequestWar((prev) => ({
    //             ...prev,
    //             filters: [
    
    //                 ...(showPrev
    //                     ? [
                            
    //                         {
    //                             fieldName: 'visit_key',
    //                             operator: 'match',
    //                             value: patientSlice.encounter.key
    //                         }
    //                     ]
    //                     : []),
    //             ],
    //         }));
    //         fetchwarnings();
    //     }, [showPrev]);
    useEffect(() => {
        console.log("showPrev ",showPrev)
        if (showPrev) {
            const updatedFilters = [
                {
                    fieldName: 'patient_key',
                    operator: 'match',
                    value: patientSlice.patient.key
                },
                {
                    fieldName: "status_lkey",
                    operator: showCanceled ? "notMatch" : "match",
                    value: "3196709905099521",
                },
                {
                    fieldName: 'visit_key',
                    operator: 'match',
                    value: patientSlice.encounter.key
                }

            ];
            setListRequestWar((prevRequest) => ({
                ...prevRequest,
                filters: updatedFilters,
            }));

        }
        else {
            const updatedFilters = [
                {
                    fieldName: 'patient_key',
                    operator: 'match',
                    value: patientSlice.patient.key
                },
                {
                    fieldName: "status_lkey",
                    operator: showCanceled ? "notMatch" : "match",
                    value: "3196709905099521",
                }

            ];
            setListRequestWar((prevRequest) => ({
                ...prevRequest,
                filters: updatedFilters,
            }));
        }
        fetchwarnings();
    }, [showPrev]);
    useEffect(()=>{
        if (showPrev) {
            const updatedFilters = [
                {
                    fieldName: 'patient_key',
                    operator: 'match',
                    value: patientSlice.patient.key
                },
                {
                    fieldName: "status_lkey",
                    operator: showCanceled ? "notMatch" : "match",
                    value: "3196709905099521",
                },
                {
                    fieldName: 'visit_key',
                    operator: 'match',
                    value: patientSlice.encounter.key
                }

            ];
            setListRequestWar((prevRequest) => ({
                ...prevRequest,
                filters: updatedFilters,
            }));

        }
        else {
            const updatedFilters = [
                {
                    fieldName: 'patient_key',
                    operator: 'match',
                    value: patientSlice.patient.key
                },
                {
                    fieldName: "status_lkey",
                    operator: showCanceled ? "notMatch" : "match",
                    value: "3196709905099521",
                }

            ];
            setListRequestWar((prevRequest) => ({
                ...prevRequest,
                filters: updatedFilters,
            }));
        }
    },[showCanceled]);
    useEffect(() => {

        setShowPrev(true);

        fetchwarnings();
    }, [saveWarningMutation])
    useEffect(() => {
        console.log("listwar: ",listRequestWar)
        fetchwarnings();
        
    }, [listRequestWar])
    const handleDateChange = (date) => {
        if (date) {
            const timestamp = date.getTime();
            if (!editDate) {
                setSelectedFirstDate(date);
            }

        }
    };
    const handleSave = async () => {
        setShowPrev(true);
        try {
            saveWarning({
                ...warning
                , patientKey: patientSlice.patient.key
                , visitKey: patientSlice.encounter.key
                , statusLkey: '9766169155908512',
                firstTimeRecorded: selectedFirstDate ? selectedFirstDate.getTime() : null
            }).unwrap();
            dispatch(notify('saved  Successfully'));
          setShowPrev(false);
          await  fetchwarnings();
         
           await  handleClear();
           setShowPrev(true);
        } catch (error) {
            dispatch(notify('Save Failed'));
            console.error('An error occurred:', error);

        }
    }
    const handleClear = () => {
        setWarning({
            ...newApVisitWarning,
            sourceOfInformationLkey: null,
            severityLkey: null,
            warningTypeLkey: null
        })
        setSelectedFirstDate(null);
        setEditDate(true);
        seteditSourceof(true);

    }
    const OpenCancellationReasonModel = () => {
        setOpenCancellationReasonModel(true);
    }
    const CloseCancellationReasonModel = () => {
        setOpenCancellationReasonModel(false);
    }
    const OpenConfirmUndoResolvedModel = () => {
        setOpenConfirmUndoResolvedModel(true);
    }
    const CloseConfirmUndoResolvedModel = () => {
        setOpenConfirmUndoResolvedModel(false);
    }
    const OpenConfirmResolvedModel = () => {
        setOpenConfirmResolvedModel(true);
    }
    const CloseConfirmResolvedModel = () => {
        setOpenConfirmResolvedModel(false);
    }
    const handleCancle = async () => {
        try {
            await saveWarning({
                ...warning,
                statusLkey: '3196709905099521', isValid: false, deletedAt: Date.now()

            }).unwrap();
            dispatch(notify(' deleted successfully'));
            await setShowCanceled(false);
           await fetchwarnings().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });

            CloseCancellationReasonModel();
        } catch { }
    }
    const handleResolved = async () => {
        try {
            await saveWarning({
                ...warning,
                statusLkey: '9766179572884232', resolvedAt: Date.now()

            }).unwrap();
            dispatch(notify('Resolved successfully'));
            setShowPrev(!showPrev);
           await fetchwarnings().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });

            CloseConfirmResolvedModel();
        } catch {
            dispatch(notify('Resolved Fill'));
        }
    }
    const handleUndoResolved = async () => {
        try {
            await saveWarning({
                ...warning,
                statusLkey: '9766169155908512'

            }).unwrap();
            dispatch(notify('Undo Resolved successfully'));
            setShowPrev(!showPrev);
           await fetchwarnings().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });

            CloseConfirmUndoResolvedModel();
        } catch {
            dispatch(notify('Undo Resolved Fill'));
        }
    }
    const renderRowExpanded = rowData => {
        console.log("Iam in the expanded Row ")
        console.log("Children Data:", rowData);  // Add this line to check children data

        return (


            <Table
                data={[rowData]} // Pass the data as an array to populate the table
                bordered
                cellBordered
                headerHeight={30}
                rowHeight={40}
                style={{ width: '100%', marginTop: '5px',marginBottom:'5px' }}
                height={100} // Adjust height as needed
            >
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Created At</HeaderCell>
                    <Cell dataKey="createdAt" >
                        {rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ""}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Created By</HeaderCell>
                    <Cell dataKey="createdBy" />
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Updated At</HeaderCell>
                    <Cell dataKey="updatedAt" >
                        {rowData => rowData.updatedAt ? new Date(rowData.updatedAt).toLocaleString() : ""}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Updated By</HeaderCell>
                    <Cell dataKey="updatedBy" />
                </Column>
                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Resolved At</HeaderCell>
                    <Cell dataKey="resolvedAt" >
                        {rowData => {
                            if (rowData.statusLkey != '9766169155908512') {

                                return rowData.resolvedAt ? new Date(rowData.resolvedAt).toLocaleString() : "";
                            }
                        }}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Resolved By</HeaderCell>
                    <Cell dataKey="resolvedBy" />
                </Column>
                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Cancelled At</HeaderCell>
                    <Cell dataKey="deletedAt" >
                        {rowData => rowData.deletedAt ? new Date(rowData.deletedAt).toLocaleString() : ""}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Cancelled By</HeaderCell>
                    <Cell dataKey="deletedBy" />
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Cancelliton Reason</HeaderCell>
                    <Cell dataKey="cancellationReason" />
                </Column>
            </Table>


        );
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



        console.log(nextExpandedRowKeys)
        setExpandedRowKeys(nextExpandedRowKeys);
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
    return (
        <>
            <Panel header="Add Warning " collapsible bordered defaultExpanded>
                <div style={{ border: '1px solid #b6b7b8', padding: "5px" }}>
                    <Form style={{ zoom: 0.85, display: 'flex' }} layout="inline" fluid>
                        <MyInput
                            column
                            disabled={editing}
                            width={150}
                            fieldType="select"
                            fieldLabel="Warning Type"
                            selectData={warningTypeLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName={'warningTypeLkey'}
                            record={warning}
                            setRecord={setWarning}
                        />
                        <MyInput
                            column
                            disabled={editing}
                            width={150}

                            fieldName={'warning'}
                            record={warning}
                            setRecord={setWarning}
                        />

                        <MyInput
                            column
                            disabled={editing}
                            width={150}
                            fieldType="select"
                            fieldLabel="Severity"
                            selectData={severityLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName={'severityLkey'}
                            record={warning}
                            setRecord={setWarning}
                        />

                        <div>
                            <Text style={{ marginTop: '3px', fontWeight: 'bold' }}>First Time Recorded</Text>
                            <DatePicker
                                format="MM/dd/yyyy hh:mm aa"
                                showMeridian
                                value={selectedFirstDate}
                                onChange={handleDateChange}
                                disabled={editDate} />
                        </div>
                        <div>
                            <Text style={{ marginTop: '3px', fontWeight: 'bold' }}> Undefined</Text>
                            <Toggle
                                checked={editDate}
                                onChange={(checked) => {
                                    setEditDate(checked);
                                    if (checked) {
                                        setSelectedFirstDate(null)
                                    }

                                }}
                                checkedChildren="Yes"
                                unCheckedChildren="No"
                                style={{ width: 130 }}

                            /></div>

                        <MyInput
                            column
                            disabled={editSourceof}
                            width={150}
                            fieldType="select"
                            fieldLabel="Source of Information"
                            selectData={sourceofinformationLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName={'sourceOfInformationLkey'}
                            record={warning}
                            setRecord={setWarning}
                        />

                        <div>
                            <Text style={{ marginTop: '3px', fontWeight: 'bold' }}>By Patient</Text>
                            <Toggle
                                checked={editSourceof}
                                onChange={(checked) => {
                                    seteditSourceof(checked);
                                    setWarning({ ...warning, sourceOfInformationLkey: null })

                                }}
                                checkedChildren="Yes"
                                unCheckedChildren="No"
                                style={{ width: 100 }}

                            /></div>

                    </Form>
                    <Form style={{ zoom: 0.85, display: 'flex' }} layout="inline" fluid>
                        <MyInput
                            width={250}

                            column
                            fieldLabel="Notes"
                            fieldType="textarea"
                            fieldName="notes"
                            height={100}
                            record={warning}
                            setRecord={setWarning}
                            disabled={editing}
                        />

                        <MyInput
                            width={250}

                            column
                            fieldLabel="Action Taken"
                            fieldType="textarea"
                            fieldName="actionTake"
                            height={100}
                            record={warning}
                            setRecord={setWarning}
                            disabled={editing}
                        />


                    </Form>
                    <div>
                        <IconButton
                            color="violet"
                            appearance="primary"
                            onClick={handleSave}
                            disabled={showPrev?(warning?.statusLkey == '3196709905099521' ? true : false):true}

                            icon={<CheckIcon />}
                        >
                            <Translate>Save</Translate>
                        </IconButton>
                        <Button
                            color="cyan"
                            appearance="primary"
                            style={{ marginLeft: "5px" }}
                            onClick={handleClear}

                        >

                            <FontAwesomeIcon icon={faBroom} style={{ marginRight: '5px' }} />
                            <span>Clear</span>
                        </Button>

                    </div>
                </div>
            </Panel>
            <Panel header="Patient’s Warnings " collapsible bordered>
                <div>
                    <IconButton
                        color="cyan"
                        appearance="primary"
                        onClick={OpenCancellationReasonModel}
                        // disabled={prescriptions?.object[0]?.statusLkey == '1804482322306061' ? true : false}

                        icon={<CloseOutlineIcon />}
                    >
                        <Translate>Cancel</Translate>
                    </IconButton>
                    <IconButton
                        color="cyan"
                        appearance="primary"
                        onClick={OpenConfirmResolvedModel}
                        disabled={warning?.statusLkey != '9766169155908512' ? true : false}
                        style={{ marginLeft: '4px' }}
                        icon={<CheckOutlineIcon />}
                    >
                        <Translate>Resolved</Translate>
                    </IconButton>
                    <IconButton
                        color="cyan"
                        appearance="primary"
                        onClick={OpenConfirmUndoResolvedModel}
                        disabled={warning?.statusLkey != '9766179572884232' ? true : false}
                        style={{ marginLeft: '4px' }}
                        icon={<ReloadIcon />}
                    >
                        <Translate>Undo Resolved</Translate>
                    </IconButton>
                    <Checkbox
                        checked={!showCanceled}
                        onChange={() => {


                            setShowCanceled(!showCanceled);
                        }}
                    >
                        Show Cancelled
                    </Checkbox>
                    <Checkbox
                        checked={!showPrev}
                        onChange={() => {


                            setShowPrev(!showPrev);
                        }}
                    >
                        Show Previous Warnings
                    </Checkbox>
                </div>
                <Table
                    height={600}
                    data={warningsListResponse?.object || []}
                    rowKey="key"
                    expandedRowKeys={expandedRowKeys} // Ensure expanded row state is correctly handled
                    renderRowExpanded={renderRowExpanded} // This is the function rendering the expanded child table
                    shouldUpdateScroll={false}
                    bordered
                    cellBordered
                    onRowClick={rowData => {
                        setWarning(rowData);
                        setEditing(rowData.statusLkey == "3196709905099521" ? true : false)


                    }}
                    rowClassName={isSelected}
                >
                    <Column width={70} align="center">
                        <HeaderCell>#</HeaderCell>
                        <ExpandCell rowData={rowData => rowData} dataKey="key" expandedRowKeys={expandedRowKeys} onChange={handleExpanded} />
                    </Column>

                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Warning Type</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.warningTypeLvalue?.lovDisplayVale
                            }
                        </Cell>
                    </Column >

                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Severity</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.severityLvalue?.lovDisplayVale
                            }
                        </Cell>
                    </Column>

                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>First Time Recorded</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => rowData.firstTimeRecorded ? new Date(rowData.firstTimeRecorded).toLocaleString() : "Undefind"}
                        </Cell>
                    </Column>

                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Source of information</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.sourceOfInformationLvalue?.lovDisplayVale || "BY Patient"
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={1} fullText>
                        <HeaderCell align="center">
                            <Translate>Warning</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.warning
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={1} fullText>
                        <HeaderCell align="center">
                            <Translate>Action Taken</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.actionTake
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Notes</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.notes
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={1} fullText>
                        <HeaderCell align="center">
                            <Translate>Status</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.statusLvalue?.lovDisplayVale
                            }
                        </Cell>
                    </Column>
                </Table>

            </Panel>
            <Modal open={openCancellationReasonModel} onClose={CloseCancellationReasonModel} overflow  >
                <Modal.Title>
                    <Translate><h6>Confirm Cancel</h6></Translate>
                </Modal.Title>
                <Modal.Body>


                    <Form style={{ zoom: 0.85 }} layout="inline" fluid>
                        <MyInput
                            width={250}

                            column
                            fieldLabel="Cancellation Reason"
                            fieldType="textarea"
                            fieldName="cancellationReason"
                            height={120}
                            record={warning}
                            setRecord={setWarning}
                        //   disabled={!editing}
                        />
                    </Form>

                </Modal.Body>
                <Modal.Footer>
                    <Stack spacing={2} divider={<Divider vertical />}>
                        <Button appearance="primary" onClick={handleCancle}>
                            Cancel
                        </Button>
                        <Button appearance="ghost" color="cyan" onClick={CloseCancellationReasonModel}>
                            Close
                        </Button>
                    </Stack>
                </Modal.Footer>
            </Modal>

            <Modal open={openConfirmResolvedModel} onClose={CloseConfirmResolvedModel} overflow  >
                <Modal.Title>
                    <Translate><h6>Confirm Resolved</h6></Translate>
                </Modal.Title>
                <Modal.Body>
                    <Text>Is this warning resolved? </Text>


                </Modal.Body>
                <Modal.Footer>
                    <Stack spacing={2} divider={<Divider vertical />}>
                        <Button appearance="primary" onClick={handleResolved}>
                            Yes
                        </Button>
                        <Button appearance="ghost" color="cyan" onClick={CloseConfirmResolvedModel}>
                            Cancel
                        </Button>
                    </Stack>
                </Modal.Footer>
            </Modal>

            <Modal open={openConfirmUndoResolvedModel} onClose={CloseConfirmUndoResolvedModel} overflow  >
                <Modal.Title>
                    <Translate><h6>Confirm Undo Resolve</h6></Translate>
                </Modal.Title>
                <Modal.Body>
                    <Text> Is this warning active? </Text>


                </Modal.Body>
                <Modal.Footer>
                    <Stack spacing={2} divider={<Divider vertical />}>
                        <Button appearance="primary" onClick={handleUndoResolved}>
                            Yes
                        </Button>
                        <Button appearance="ghost" color="cyan" onClick={CloseConfirmUndoResolvedModel}>
                            Cancel
                        </Button>
                    </Stack>
                </Modal.Footer>
            </Modal>
        </>
    );
}
export default Warning;