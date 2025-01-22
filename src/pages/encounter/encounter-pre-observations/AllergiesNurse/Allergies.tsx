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
    useGetAllergiesQuery,
    useSaveAllergiesMutation
} from '@/services/observationService';
import { ApVisitAllergies } from '@/types/model-types';
import { newApVisitAllergies } from '@/types/model-types-constructor';
const Allergies = () => {
    const patientSlice = useAppSelector(state => state.patient);
    console.log(patientSlice.patient)
    const { data: allergyTypeLovQueryResponse } = useGetLovValuesByCodeQuery('ALLERGEN_TYPES');
    const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');
    const { data: onsetLovQueryResponse } = useGetLovValuesByCodeQuery('ONSET');
    const { data: reactionLovQueryResponse } = useGetLovValuesByCodeQuery('ALLRGY_REACTION_TYP');
    const { data: treatmentstrategyLovQueryResponse } = useGetLovValuesByCodeQuery('TREAT_STRATGY');
    const { data: sourceofinformationLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
    const { data: statusLovQueryResponse } = useGetLovValuesByCodeQuery('ALLERGY_RES_STATUS');
    const { data: allgPropnLovQueryResponse } = useGetLovValuesByCodeQuery('ALLG_PROPN');
    const { data: criticalityLovQueryResponse } = useGetLovValuesByCodeQuery('CRITICALITY');
    const [allerges, setAllerges] = useState<ApVisitAllergies>({ ...newApVisitAllergies });
    const [showCanceled, setShowCanceled] = useState(true);
    const [editing, setEditing] = useState(false);
    const [showPrev, setShowPrev] = useState(true);
    const [listRequestallerg, setListRequestallerg] = useState<ListRequest>({
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


    const { data: allergiesListResponse, refetch: fetchallerges } = useGetAllergiesQuery({ ...listRequestallerg });

    const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
    const [openConfirmResolvedModel, setOpenConfirmResolvedModel] = useState(false);
    const [openConfirmUndoResolvedModel, setOpenConfirmUndoResolvedModel] = useState(false);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const { data: allergensListResponse } = useGetAllergensQuery({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'allergen_type_lkey',
                operator: 'match',
                value: allerges.allergyTypeLkey
            }

        ]
    });
    const { data: allergensListToGetName } = useGetAllergensQuery({
        ...initialListRequest
    });

    const [selectedOnsetDate, setSelectedOnsetDate] = useState(null);
    const [saveAllergies, saveAllergiesMutation] = useSaveAllergiesMutation();
    const [reactionDescription, setReactionDescription] = useState();
    const [editOnset, setEditOnset] = useState(true)
    const [editSourceof, seteditSourceof] = useState(true);
    const [listRequest, setListRequest] = useState({
        ...initialListRequest,
    });
    const dispatch = useAppDispatch();

    const isSelected = rowData => {
        if (rowData && allerges && rowData.key === allerges.key) {
            return 'selected-row';
        } else return '';
    };
    useEffect(() => {

    }, [selectedOnsetDate]);
    useEffect(() => {
        if (allerges.reactionDescription != null) {

            console.log(allerges.reactionDescription)
            setReactionDescription(prevadminInstructions =>
                prevadminInstructions ? `${prevadminInstructions}, ${reactionLovQueryResponse?.object?.find(
                    item => item.key === allerges.reactionDescription
                )?.lovDisplayVale}` :
                    reactionLovQueryResponse?.object?.find(
                        item => item.key === allerges.reactionDescription
                    )?.lovDisplayVale
            );
        }


    }, [allerges.reactionDescription]);
    useEffect(() => {

        if (allerges.onsetDate != 0) {
            setEditOnset(false);
            setSelectedOnsetDate(new Date(allerges.onsetDate));
        }
        if (allerges.sourceOfInformationLkey != null) {
            seteditSourceof(false);
        }
    }, [allerges]);
    useEffect(() => {
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
            setListRequestallerg((prevRequest) => ({
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
            setListRequestallerg((prevRequest) => ({
                ...prevRequest,
                filters: updatedFilters,
            }));
        }
    }, [showPrev]);
    useEffect(() => {
        console.log(saveAllergiesMutation);
        setShowPrev(true);

        fetchallerges();
    }, [saveAllergiesMutation])
    useEffect(() => {
        fetchallerges();
        console.log(allergiesListResponse)
    }, [listRequestallerg])
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
            setListRequestallerg((prevRequest) => ({
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
            setListRequestallerg((prevRequest) => ({
                ...prevRequest,
                filters: updatedFilters,
            }));
        }
     },[showCanceled]);
    const renderRowExpanded = rowData => {
        return (


            <Table
                data={[rowData]} // Pass the data as an array to populate the table
                bordered
                headerHeight={30}
                rowHeight={40}
                style={{ width: '100%', marginTop: '5px',marginBottom:'5px' }}
                cellBordered
                
                height={100} // Adjust height as needed
            >
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Created At</HeaderCell>
                    <Cell dataKey="onsetDate" >
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
                <Column flexGrow={1} fullText>
                    <HeaderCell align="center">
                        <Translate>Notes</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            rowData.notes
                        }
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Certainty</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            rowData.certainty
                        }
                    </Cell>
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



    const handleDateChange = (date) => {
        if (date) {
            if (!editOnset) {
                setSelectedOnsetDate(date);
            }

        }
    };
    const handleClear = () => {
        setAllerges({
            ...newApVisitAllergies
            , allergyTypeLkey: null,
            allergenKey: null,
            onsetLkey: null,
            reactionDescription: null,
            sourceOfInformationLkey: null,
            treatmentStrategyLkey: null,
            severityLkey: null,
            criticalityLkey: null,
            typeOfPropensityLkey: null


        });
        setSelectedOnsetDate(null);
        setEditOnset(true);
        seteditSourceof(true);
        setReactionDescription(null);
    }
    const handleSave = async () => {
        setShowPrev(true);
        try {
            await saveAllergies({
                ...allerges,
                patientKey: patientSlice.patient.key,
                visitKey: patientSlice.encounter.key,
                statusLkey: '9766169155908512',
                reactionDescription: reactionDescription,
                onsetDate: selectedOnsetDate ? selectedOnsetDate.getTime() : null
            }).unwrap();
            dispatch(notify('Saved Successfully'));
             setShowPrev(false);
            await fetchallerges();  // Ensure refetch is awaited
            await handleClear();
            setShowPrev(true);
           
        } catch (error) {
            dispatch(notify('Save Failed'));
            console.error('An error occurred:', error);
        }
    };

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
            await saveAllergies({
                ...allerges,
                statusLkey: '3196709905099521', isValid: false, deletedAt: Date.now()

            }).unwrap();
            dispatch(notify(' deleted successfully'));
            setShowCanceled(false)
            fetchallerges().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });

            CloseCancellationReasonModel();
        } catch { }
    }

    const handleResolved = async () => {
        setShowPrev(true);
        try {
            await saveAllergies({
                ...allerges,
                statusLkey: '9766179572884232', resolvedAt: Date.now()

            }).unwrap();
            dispatch(notify('Resolved successfully'));
            setShowPrev(false);
          await  fetchallerges().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });

            CloseConfirmResolvedModel();
            setShowPrev(true);
            setAllerges({ ...newApVisitAllergies })
        } catch {
            dispatch(notify('Resolved Fill'));
        }
    }
    const handleUndoResolved = async () => {
        setShowPrev(true);
        try {
            await saveAllergies({
                ...allerges,
                statusLkey: '9766169155908512'

            }).unwrap();
            dispatch(notify('Undo Resolved successfully'));
            setShowPrev(false);
           await  fetchallerges().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });

            CloseConfirmUndoResolvedModel();
            setShowPrev(true);
            setAllerges({ ...newApVisitAllergies })
        } catch {
            dispatch(notify('Undo Resolved Fill'));
        }
    }
    return (<>
        <div>
            <Panel header="Add Allergy " collapsible bordered defaultExpanded>
                <div style={{ border: '1px solid #b6b7b8', padding: "5px" }}>
                    <Form style={{ zoom: 0.85, display: 'flex' }} layout="inline" fluid>
                        <MyInput
                            column
                            disabled={editing}
                            width={150}
                            fieldType="select"
                            fieldLabel="Allergy Type"
                            selectData={allergyTypeLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName={'allergyTypeLkey'}
                            record={allerges}
                            setRecord={setAllerges}
                        />
                        <MyInput
                            column
                            disabled={editing}
                            width={150}
                            fieldType="select"
                            fieldLabel="Allergen"
                            selectData={allergensListResponse?.object ?? []}
                            selectDataLabel="allergenName"
                            selectDataValue="key"
                            fieldName={'allergenKey'}
                            record={allerges}
                            setRecord={setAllerges}
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
                            record={allerges}
                            setRecord={setAllerges}
                        />
                        <MyInput
                            column
                            disabled={editing}
                            width={150}
                            fieldType="select"
                            fieldLabel="Criticality"
                            selectData={criticalityLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName={'criticalityLkey'}
                            record={allerges}
                            setRecord={setAllerges}
                        />
                        <MyInput
                            column
                            disabled={editing}
                            width={150}
                            fieldName={'certainty'}
                            record={allerges}
                            setRecord={setAllerges}
                        />
                        <MyInput
                            column
                            disabled={editing}
                            width={150}
                            fieldType="select"
                            fieldLabel="Onset"
                            selectData={onsetLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName={'onsetLkey'}
                            record={allerges}
                            setRecord={setAllerges}
                        />
                        <div>
                            <Text style={{ marginTop: '3px', fontWeight: 'bold' }}>Onset Date</Text>
                            <DatePicker
                                format="MM/dd/yyyy hh:mm aa"
                                showMeridian
                                value={selectedOnsetDate}
                                onChange={handleDateChange}
                                disabled={editOnset} />
                        </div>
                        <div>
                            <Text style={{ marginTop: '3px', fontWeight: 'bold' }}>Onset Undefined</Text>
                            <Toggle
                                checked={editOnset}
                                onChange={(checked) => {
                                    setEditOnset(checked);
                                    if (checked) {
                                        setSelectedOnsetDate(null)
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
                            record={allerges}
                            setRecord={setAllerges}
                        />

                        <div>
                            <Text style={{ marginTop: '3px', fontWeight: 'bold' }}>By Patient</Text>
                            <Toggle
                                checked={editSourceof}
                                onChange={(checked) => {
                                    seteditSourceof(checked);
                                    setAllerges({ ...allerges, sourceOfInformationLkey: null })

                                }}
                                checkedChildren="Yes"
                                unCheckedChildren="No"
                                style={{ width: 100 }}

                            /></div>

                    </Form>
                    <Form style={{ zoom: 0.85, display: 'flex' }} layout="inline" fluid>
                        <MyInput
                            column
                            disabled={editing}
                            width={150}
                            fieldType="select"
                            fieldLabel="Treatment Strategy"
                            selectData={treatmentstrategyLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName={'treatmentStrategyLkey'}
                            record={allerges}
                            setRecord={setAllerges}
                        />
                        <MyInput
                            column
                            disabled={editing}
                            width={150}
                            fieldType="select"
                            fieldLabel="Type of Propensity"
                            selectData={allgPropnLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName={'typeOfPropensityLkey'}
                            record={allerges}
                            setRecord={setAllerges}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: "5px" }}>
                            <MyInput
                                column
                                disabled={editing}
                                width={250}
                                fieldType="select"
                                fieldLabel="Allergic Reactions"
                                selectData={reactionLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                fieldName={'reactionDescription'}
                                record={allerges}
                                setRecord={setAllerges}
                            />
                            <Input as="textarea"
                                disabled={editing}
                                onChange={(e) => setReactionDescription(e)} value={reactionDescription}
                                style={{ width: 250 }} rows={3} />
                        </div>
                        <MyInput
                            width={250}

                            column
                            fieldLabel="Note"
                            fieldType="textarea"
                            fieldName="notes"
                            height={120}
                            record={allerges}
                            setRecord={setAllerges}
                            disabled={editing}
                        />

                    </Form>
                    <div>
                        <IconButton
                            color="violet"
                            appearance="primary"
                            onClick={handleSave}
                            disabled={showPrev?(allerges?.statusLkey == '3196709905099521' ? true : false):true}

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
            <Panel header="Patient’s Allergies " collapsible bordered>
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
                        disabled={allerges?.statusLkey != '9766169155908512' ? true : false}
                        style={{ marginLeft: '4px' }}
                        icon={<CheckOutlineIcon />}
                    >
                        <Translate>Resolved</Translate>
                    </IconButton>
                    <IconButton
                        color="cyan"
                        appearance="primary"
                        onClick={OpenConfirmUndoResolvedModel}
                        disabled={allerges?.statusLkey != '9766179572884232' ? true : false}
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
                        Show Previous Allergies
                    </Checkbox>
                </div>
                <Table
                    height={600}
                    data={allergiesListResponse?.object || []}
                    rowKey="key"
                    expandedRowKeys={expandedRowKeys} // Ensure expanded row state is correctly handled
                    renderRowExpanded={renderRowExpanded} // This is the function rendering the expanded child table
                    shouldUpdateScroll={false}
                    bordered
                    cellBordered
                    onRowClick={rowData => {
                        setAllerges(rowData);
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
                            <Translate>Allergy Type</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.allergyTypeLvalue?.lovDisplayVale
                            }
                        </Cell>
                    </Column >
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Allergen</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => {

                                if (!allergensListToGetName?.object) {
                                    return "Loading...";
                                }
                                const getname = allergensListToGetName.object.find(item => item.key === rowData.allergenKey);

                                return getname?.allergenName || "No Name";
                            }}
                        </Cell>
                    </Column>
                    <Column flexGrow={1} fullText>
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
                            <Translate>Certainty type</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.criticalityLkey ? rowData.criticalityLvalue.lovDisplayVale : rowData.criticalityLkey
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Onset</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.onsetLvalue?.lovDisplayVale
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Onset Date Time</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => rowData.onsetDate ? new Date(rowData.onsetDate).toLocaleString() : "Undefind"}
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Treatment Strategy</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.treatmentStrategyLvalue?.lovDisplayVale
                            }
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
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Reaction Description</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.reactionDescription
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Type Of Propensity</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.typeOfPropensityLkey ? rowData.typeOfPropensityLvalue.lovDisplayVale : rowData.typeOfPropensityLkey
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
                            record={allerges}
                            setRecord={setAllerges}
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
                    <Text>Is this allergy resolved? </Text>


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
                    <Text> Is this allergy active? </Text>


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
        </div>
    </>);
};
export default Allergies;


