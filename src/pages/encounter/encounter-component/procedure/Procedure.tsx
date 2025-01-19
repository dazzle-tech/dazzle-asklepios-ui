import React, { useEffect, useState } from 'react';

import Translate from '@/components/Translate';
import './styles.less';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useAppDispatch, useAppSelector } from '@/hooks';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
import FileUploadIcon from '@rsuite/icons/FileUpload';
import PatientOrder from '../diagnostics-order'
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';

import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import {
    useGetPractitionersQuery
} from '@/services/setupService';
import {
    InputGroup,
    Form,
    Input,
    Panel,
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
    DatePicker
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;

import { notify } from '@/utils/uiReducerActions';
import {
    useGetLovValuesByCodeQuery,
} from '@/services/setupService';
import {
    useFetchAttachmentQuery,
    useFetchAttachmentLightQuery,
    useFetchAttachmentByKeyQuery,
    useUploadMutation,
    useDeleteAttachmentMutation,
    useUpdateAttachmentDetailsMutation
} from '@/services/attachmentService';

import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CheckIcon from '@rsuite/icons/Check';
import PlusIcon from '@rsuite/icons/Plus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import { faBedPulse } from '@fortawesome/free-solid-svg-icons';
import OthersIcon from '@rsuite/icons/Others';
import RemindOutlineIcon from '@rsuite/icons/RemindOutline';
import AttachmentModal from "@/pages/patient/patient-profile/AttachmentUploadModal";
import SearchIcon from '@rsuite/icons/Search';
import BlockIcon from '@rsuite/icons/Block';
import MyInput from '@/components/MyInput';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetIcdListQuery } from '@/services/setupService';
import {

    useGetEncounterReviewOfSystemsQuery,
    useGetProceduresQuery,
    useSaveProceduresMutation
} from '@/services/encounterService'
import {
    useGetPatientDiagnosisQuery
} from '@/services/encounterService';
import { ApPatientDiagnose, ApProcedure } from '@/types/model-types';
import { newApPatientDiagnose, newApProcedure } from '@/types/model-types-constructor';
import {
    useGetDepartmentsQuery,
    useGetProcedureListQuery,
    useGetProcedureCodingListQuery
} from '@/services/setupService';
import Indications from '@/pages/medications/active-ingredients-setup/Indications';
const Referrals = () => {
    const patientSlice = useAppSelector(state => state.patient);
    const dispatch = useAppDispatch();
    const [selectedRows, setSelectedRows] = useState([]);
    const [showCanceled, setShowCanceled] = useState(true);
    const [showPrev, setShowPrev] = useState(true);
    const [actionType, setActionType] = useState(null);
    const [editing, setEditing] = useState(false);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const [indicationsDescription, setindicationsDescription] = useState<string>('');
    const [searchKeywordicd, setSearchKeywordicd] = useState('');
    const [openConfirmDeleteModel, setConfirmDeleteModel] = useState(false);
    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
    const patientDiagnoseListResponse = useGetPatientDiagnosisQuery({
        ...initialListRequest,

        timestamp: new Date().getMilliseconds(),
        sortBy: 'createdAt',
        sortType: 'desc',
        filters: [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patientSlice.patient.key
            },
            {
                fieldName: 'visit_key',
                operator: 'match',
                value: patientSlice.encounter.key
            }

        ]
    });
    const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
    const [openOrderModel, setOpenOrderModel] = useState(false);
    const [procedure, setProcedure] = useState<ApProcedure>({ ...newApProcedure, encounterKey: patientSlice.encounter.key, currentDepartment: true });
    const { data: CategoryLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');
    const { data: ProcedureLevelLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_LEVEL');
    const { data: priorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
    const { data: depTTypesLovQueryResponse } = useGetLovValuesByCodeQuery('DEPARTMENT-TYP');
    const { data: faciltyypesLovQueryResponse } = useGetLovValuesByCodeQuery('FSLTY_TYP');
    const { data: bodypartLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
    const { data: sideLovQueryResponse } = useGetLovValuesByCodeQuery('SIDES');
    const { data: departmentListResponse } = useGetDepartmentsQuery({ ...initialListRequest });
    const [listRequestPro, setListRequestPro] = useState<ListRequest>({
        ...initialListRequest
        ,

        filters: [
            {
                fieldName: 'category_lkey',
                operator: 'match',
                value: procedure.categoryKey
            }

        ],


    });
    const { data: procedureQueryResponse, refetch: profetch } = useGetProcedureListQuery(listRequestPro, { skip: procedure.categoryKey == undefined });
    const { data: procedurecodingQueryResponse, refetch: procfetch } = useGetProcedureCodingListQuery({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'procedure_key',
                operator: 'match',
                value: procedure.procedureNameKey
            }
        ]

    }, { skip: procedure.procedureNameKey == undefined });

    const department = departmentListResponse?.object.filter(item => item.departmentTypeLkey === "5673990729647006");
    const [saveProcedures, saveProcedureMutation] = useSaveProceduresMutation();
    const { data: encounterReviewOfSystemsSummaryResponse, refetch } = useGetEncounterReviewOfSystemsQuery(patientSlice.encounter.key);
    const summaryText = encounterReviewOfSystemsSummaryResponse?.object
        ?.map((item, index) => {
            const systemDetail = item.systemDetailLvalue
                ? item.systemDetailLvalue.lovDisplayVale
                : item.systemDetailLkey;
            return `* ${systemDetail}\n${item.notes}`;
        })
        .join("\n") + "\n____________________\n" + (patientSlice?.encounter?.physicalExamNote||"");
    const isSelected = rowData => {
        if (rowData && procedure && rowData.key === procedure.key) {
            return 'selected-row';
        } else return '';
    };
    const [selectedDiagnose, setSelectedDiagnose] = useState<ApPatientDiagnose>({
        ...newApPatientDiagnose,
        visitKey: patientSlice.encounter.key,
        patientKey: patientSlice.patient.key,
        createdBy: 'Administrator'


    });
    const { data: procedures, refetch: proRefetch } = useGetProceduresQuery({
        ...initialListRequest,

        filters: [
            {
                fieldName: "encounter_key",
                operator: "match",
                value: patientSlice.encounter.key,
            },
            {
                fieldName: "status_lkey",
                operator: showCanceled ? "notMatch" : "match",
                value: "3621690096636149",
            }
        ],
    });
    const [requestedPatientAttacment, setRequestedPatientAttacment] = useState();
    const fetchOrderAttachResponse = useFetchAttachmentQuery(
        {
            type: 'PROCEDURE_ORDER',
            refKey: procedure.key
        },
        { skip: !procedure.key }
    );
    const {
        data: fetchAttachmentByKeyResponce,
        error,
        isLoading,
        isFetching,
        isSuccess,
        refetch: refAtt
    } = useFetchAttachmentByKeyQuery(
        { key: requestedPatientAttacment },
        {
            skip: !requestedPatientAttacment
            // || !consultationOrders.key
        }
    );
    const [icdListRequest, setIcdListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ],
    });
   const { data: icdListResponseLoading } = useGetIcdListQuery(icdListRequest);
      const modifiedData = (icdListResponseLoading?.object ?? []).map(item => ({
          ...item,
          combinedLabel: `${item.icdCode} - ${item.description}`,
      }));
    useEffect(() => {
        if (procedure.indications != null || procedure.indications != "") {

            setindicationsDescription(prevadminInstructions => {
                const currentIcd = icdListResponseLoading?.object?.find(
                    item => item.key === procedure.indications
                );

                if (!currentIcd) return prevadminInstructions;

                const newEntry = `${currentIcd.icdCode}, ${currentIcd.description}.`;

                return prevadminInstructions
                    ? `${prevadminInstructions}\n${newEntry}`
                    : newEntry;
            });
        }
    }, [procedure.indications]);
        useEffect(() => {
            if (searchKeywordicd.trim() !== "") {
                setIcdListRequest(
                    {
                        ...initialListRequest,
                        filterLogic: 'or',
                        filters: [
                            {
                                fieldName: 'icd_code',
                                operator: 'containsIgnoreCase',
                                value: searchKeywordicd
                            },
                            {
                                fieldName: 'description',
                                operator: 'containsIgnoreCase',
                                value: searchKeywordicd
                            }
    
                        ]
                    }
                );
            }
        }, [searchKeywordicd]);

    useEffect(() => {
        setListRequestPro((prev) => ({
            ...prev,
            filters: [

                ...(procedure?.categoryKey
                    ? [
                        {
                            fieldName: 'category_lkey',
                            operator: 'match',
                            value: procedure?.categoryKey,
                        },
                    ]
                    : []),
            ],
        }));
    }, [procedure?.categoryKey]);
    useEffect(()=>{
        if(procedure.currentDepartment){
            setProcedure({...procedure,departmentKey:null,faciltyLkey:null});
        }
    },[procedure.currentDepartment])
    useEffect(() => {
        if (patientDiagnoseListResponse.data?.object?.length > 0) {
            setSelectedDiagnose(patientDiagnoseListResponse?.data?.object[0]?.diagnosisObject
            );
        }
    }, [patientDiagnoseListResponse.data]);
    const handleDownload = async (attachment) => {
        try {
            if (!attachment?.fileContent || !attachment?.contentType || !attachment?.fileName) {
                console.error("Invalid attachment data.");
                return;
            }

            const byteCharacters = atob(attachment.fileContent);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: attachment.contentType });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = attachment.fileName;

            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            console.log("File downloaded successfully:", attachment.fileName);
            // attachmentRefetch().then(() => {
            //     console.log("Refetch complete");
            // }).catch((error) => {
            //     console.error("Refetch failed:", error);
            // });
        } catch (error) {
            console.error("Error during file download:", error);
        }
    };
    const handleDownloadSelectedPatientAttachment = attachmentKey => {
        console.log("iam in downlod file fun")
        setRequestedPatientAttacment(attachmentKey);
        setActionType('download');


        handleDownload(fetchAttachmentByKeyResponce);


    };
    const handleFilterChange = (fieldName, value) => {
        // if (value) {
        //     setListRequest(
        //         addFilterToListRequest(
        //             fromCamelCaseToDBName(fieldName),
        //             'containsIgnoreCase',
        //             value,
        //             listRequest
        //         )
        //     );
        // } else {
        //     setListRequest({ ...listRequest, filters: [] });
        // }
    };
    const handleCheckboxChange = (key) => {
        setSelectedRows((prev) => {
            if (prev.includes(key)) {
                return prev.filter(item => item !== key);
            } else {
                return [...prev, key];
            }
        });
    };
    const OpenConfirmDeleteModel = () => {
        setConfirmDeleteModel(true);
    }
    const CloseConfirmDeleteModel = () => {
        setConfirmDeleteModel(false);
    }
    const handleSearchIcd = value => {
        setSearchKeywordicd(value);


    };
    const handleSave = async () => {

        try {


            await saveProcedures({
                ...procedure,
                statusLkey: '3621653475992516',
                indications: indicationsDescription,
                encounterKey:patientSlice.encounter.key
            }).unwrap().then(() => {
               
                proRefetch();
            });
            handleClear();
            dispatch(notify('saved  Successfully'));


        } catch (error) {
            dispatch(notify('Save Failed'));
        }

    }
    const CloseCancellationReasonModel = () => {
        setOpenCancellationReasonModel(false);
    }
    const CloseOrderModel = () => {
        setOpenOrderModel(false);
    }
    const joinValuesFromArray = (values) => {
        return values.filter(Boolean).join(', ');
    };
    const handleClear = () => {
        setProcedure({
            ...newApProcedure,

            statusLkey: '3621653475992516',
            indications: indicationsDescription,
            bodyPartLkey: null,
            sideLkey: null,
            faciltyLkey: null,
            priorityLkey: null,
            procedureLevelLkey: null,
            departmentKey: null,
            categoryKey: null,
            procedureNameKey: null

        })
    }

    const renderRowExpanded = rowData => {
        // Add this line to check children data

        return (


            <Table
                data={[rowData]} // Pass the data as an array to populate the table
                bordered
                cellBordered
                style={{ width: '100%', marginTop: '10px' }}
                height={100} // Adjust height as needed
            >
                 <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Facelity</HeaderCell>
                    <Cell dataKey="faciltyLvalue.lovDisplayVale" >
                        {rowData => rowData.faciltyLkey?rowData.faciltyLvalue.lovDisplayVale:rowData.faciltyLkey}
                    </Cell>
                </Column>
                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Department</HeaderCell>
                    <Cell dataKey="departmentKey" >
                    {rowData => {
                        console.log("iam heare");
                        console.log('Item Key:', department[0].key);
                        console.log('Row Data Department Key:', rowData.departmentKey);
                        const d= department?.find(item => item.key === rowData.departmentKey);
                    
                    console.log('Matched Department:', d);
                    
                    return d?.name||'g';
                    
                    }}
                   
                    </Cell>
                </Column>
                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Current Department</HeaderCell>
                    <Cell  >
                        {rowData => rowData.currentDepartment?"Yes":""}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Body Part</HeaderCell>
                    <Cell dataKey="bodyPartLvalue.lovDisplayVale" >
                        {rowData => rowData.bodyPartLkey?rowData.bodyPartLvalue.lovDisplayVale:rowData.bodyPartLkey}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Side</HeaderCell>
                    <Cell dataKey="sideLvalue.lovDisplayVale" >
                        {rowData => rowData.sideLkey?rowData.sideLvalue.lovDisplayVale:rowData.sideLkey}
                    </Cell>
                </Column>
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
    const handleCancle = async () => {


        try {
            await
                saveProcedures({ ...procedure, statusLkey: "3621690096636149", deletedAt: Date.now() }).unwrap()
                    .then(() => {
                        proRefetch();
                    });


            dispatch(notify(' procedure deleted successfully'));
            CloseCancellationReasonModel();


        } catch (error) {

            dispatch(notify(' deleted failed'));

        }
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
    return (<> 
      <h5>Procedure Order</h5>
        <br />
        <div className='top-div'>
            <div>
                <Form style={{ zoom: 0.85 }} layout="inline" fluid>

                    <MyInput
                        column
                        disabled={editing}
                        width={170}
                        fieldType="select"
                        fieldLabel="Category Type"
                        selectData={CategoryLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'categoryKey'}
                        record={procedure}
                        setRecord={setProcedure}
                    />
                    <MyInput
                        column
                        disabled={editing}
                        width={170}
                        fieldType="select"
                        fieldLabel="Procedure Name"
                        selectData={procedureQueryResponse?.object ?? []}
                        selectDataLabel="name"
                        selectDataValue="key"
                        fieldName={'procedureNameKey'}
                        record={procedure}
                        setRecord={setProcedure}
                    />
                    <MyInput
                        column
                        disabled={editing}
                        width={170}
                        fieldType="select"
                        fieldLabel="Procedure Level"
                        selectData={ProcedureLevelLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'procedureLevelLkey'}
                        record={procedure}
                        setRecord={setProcedure}
                    />
                    <MyInput
                        column
                        disabled={editing}
                        width={170}
                        fieldType="select"
                        fieldLabel="Priority"
                        selectData={priorityLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'priorityLkey'}
                        record={procedure}
                        setRecord={setProcedure}
                    />

                    <MyInput
                        column
                        disabled={editing ? editing : procedure.currentDepartment}
                        width={170}
                        fieldType="select"
                        fieldLabel="Facilty "
                        selectData={faciltyypesLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'faciltyLkey'}
                        record={procedure}
                        setRecord={setProcedure}
                    />
                    <MyInput
                        column
                        disabled={editing ? editing : procedure.currentDepartment}
                        width={170}
                        fieldType="select"
                        fieldLabel="Department"
                        selectData={department ?? []}
                        selectDataLabel="name"
                        selectDataValue="key"
                        fieldName={'departmentKey'}
                        record={procedure}
                        setRecord={setProcedure}
                    />
                    <MyInput

                        disabled={editing}
                        column
                        fieldType="checkbox"
                        fieldName="currentDepartment"
                        record={procedure}
                        setRecord={setProcedure}

                    />

                </Form>
                <br />
                <div style={{ display: 'flex', zoom: 0.85, gap: '10px' }}>


                    <div style={{ width: '190px' }}>
                        <Text style={{ marginTop: '6px', fontWeight: 'bold' }}>Start Date Time</Text>
                        <DatePicker
                            disabled={editing}
                            format="MM/dd/yyyy hh:mm aa"
                            showMeridian
                            value={procedure.scheduledDateTime != 0 ? new Date(procedure.scheduledDateTime) : new Date()}
                            onChange={(value) => {
                                setProcedure({
                                    ...procedure,
                                    scheduledDateTime: value.getTime()
                                });
                            }}

                        />

                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Form layout="inline" fluid disabled={editing}>


                            <MyInput
                                column
                                width={200}
                                disabled={editing}
                                fieldName="notes"
                                rows={6}
                                fieldType="textarea"
                                record={procedure}
                                setRecord={setProcedure}
                            />



                        </Form>
                        <IconButton
                            color="violet"
                            appearance="ghost"
                            onClick={() => { setOpenOrderModel(true) }}
                            disabled={editing}
                            icon={<CheckIcon />}
                        >
                            <Translate>Order Related Tests</Translate>
                        </IconButton>
                    </div>
                    <div style={{ margin: '5px' }}>
                        <Text style={{ fontWeight: 'bold' }}>Indications</Text>
                        <InputGroup inside style={{ width: '300px', margin: '3px' }}>
                            <Input
                                placeholder="Search ICD-10"
                                value={searchKeywordicd}
                                onChange={handleSearchIcd}
                            />
                            <InputGroup.Button>
                                <SearchIcon />
                            </InputGroup.Button>
                        </InputGroup>
                        {searchKeywordicd && (
                            <Dropdown.Menu className="dropdown-menuresult">
                                {modifiedData?.map(mod => (
                                    <Dropdown.Item
                                        key={mod.key}
                                        eventKey={mod.key}
                                        onClick={() => {
                                            setProcedure({
                                                ...procedure,
                                                indications: mod.key
                                            })
                                            setSearchKeywordicd("");
                                        }}
                                    >
                                        <span style={{ marginRight: "19px" }}>{mod.icdCode}</span>
                                        <span>{mod.description}</span>
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        )}
                        <Input as="textarea"
                            disabled={true}
                            onChange={(e) => setindicationsDescription} value={indicationsDescription
                                || procedure.indications
                            }
                            style={{ width: 300 }} rows={4} />
                    </div>
                    <div>
                        <Table
                            height={200}
                            width={330}

                            headerHeight={33}
                            rowHeight={40}

                            data={procedurecodingQueryResponse?.object ?? []}

                        >
                            <Column sortable flexGrow={1}>
                                <HeaderCell align="center">

                                    <Translate>Code Type</Translate>
                                </HeaderCell>
                                <Cell align="center">
                                    {rowData => rowData.codeTypeLkey ? rowData.codeTypeLvalue.lovDisplayVale : rowData.codeTypeLkey}
                                </Cell  >
                            </Column>
                            <Column sortable flexGrow={2}>
                                <HeaderCell align="center">

                                    <Translate>international Code</Translate>
                                </HeaderCell>
                                <Cell align="center">
                                    {rowData => rowData.internationalCodeKey}
                                </Cell  >
                            </Column>


                        </Table>
                    </div>
                    <div >
                        <Form layout="inline"  >
                            <MyInput
                                column
                                disabled={editing}
                                width={170}
                                fieldType="select"
                                fieldLabel="Body Part "
                                selectData={bodypartLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                fieldName={'bodyPartLkey'}
                                record={procedure}
                                setRecord={setProcedure}
                            />
                            <MyInput
                                column
                                disabled={editing}
                                width={170}
                                fieldType="select"
                                fieldLabel="Side"
                                selectData={sideLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                fieldName={'sideLkey'}
                                record={procedure}
                                setRecord={setProcedure}
                            />
                        </Form>

                    </div >
                </div>

                <br />
                <div className="buttons-sect-one">
                    <IconButton
                        color="violet"
                        appearance="primary"
                        onClick={handleSave}
                        // disabled={selectedRows.length === 0}
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
            <div style={{ display: "flex", flexDirection: "column", width: "300px" }} >

                <Form style={{ zoom: 0.85 }} layout="inline" fluid>

                    <Text>Diagnose</Text>
                    <textarea
                       value={selectedDiagnose && selectedDiagnose.icdCode && selectedDiagnose.description ? `${selectedDiagnose.icdCode}, ${selectedDiagnose.description}` : ''}
                        readOnly
                        rows={3}
                        cols={50}
                        style={{ width: "100%" }}
                    />
                    <Text>Finding Summery</Text>
                    <textarea
                        value={summaryText}
                        readOnly
                        rows={5}
                        cols={50}
                        style={{ width: "100%" }}
                    />

                </Form>
                <div style={{ display: "flex", flexDirection: "row" }}>
                    {fetchOrderAttachResponse.status != "uninitialized" && <Button
                        style={{ marginTop: "20px" }}
                        appearance="link"
                        onClick={() => handleDownloadSelectedPatientAttachment(fetchOrderAttachResponse.data.key)}
                    >
                        Download <FileDownloadIcon style={{ scale: '1.4' }} />
                    </Button>}
                    <AttachmentModal isOpen={attachmentsModalOpen} onClose={() => setAttachmentsModalOpen(false)} localPatient={procedure} attatchmentType={'PROCEDURE_ORDER'} />

                </div>
            </div>


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
                            record={procedure}
                            setRecord={setProcedure}
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
            <Modal size='lg' open={openOrderModel} onClose={CloseOrderModel} overflow  >
                <Modal.Title>
                    <Translate><h6>Add Order</h6></Translate>
                </Modal.Title>
                <Modal.Body>


                    < PatientOrder />
                </Modal.Body>
                <Modal.Footer>
                    <Stack spacing={2} divider={<Divider vertical />}>

                        <Button appearance="ghost" color="cyan" onClick={CloseOrderModel}>
                            Close
                        </Button>
                    </Stack>
                </Modal.Footer>
            </Modal>

        </div>
        <IconButton
            color="cyan"
            appearance="primary"
            style={{ marginLeft: "5px" }}
            icon={<BlockIcon />}
            onClick={() => setOpenCancellationReasonModel(true)}

        >
            <Translate> Cancle</Translate>
        </IconButton>
        <Checkbox
            checked={!showCanceled}
            onChange={() => {


                setShowCanceled(!showCanceled);
                if (showCanceled == false)
                    setEditing(true);
            }}
        >
            Show Cancelled
        </Checkbox>
        <Table
            height={600}
            data={procedures?.object ?? []}
            rowKey="key"
            expandedRowKeys={expandedRowKeys} // Ensure expanded row state is correctly handled
            renderRowExpanded={renderRowExpanded} // This is the function rendering the expanded child table
            shouldUpdateScroll={false}
            bordered
            cellBordered
            onRowClick={rowData => {
                setProcedure(rowData);
                setEditing(rowData.statusLkey == "3621690096636149" ? true : false)


            }}
            rowClassName={isSelected}
        >
            <Column width={70} align="center">
                <HeaderCell>#</HeaderCell>
                <ExpandCell rowData={rowData => rowData} dataKey="key" expandedRowKeys={expandedRowKeys} onChange={handleExpanded} />
            </Column>

            <Column flexGrow={1} fullText>
                <HeaderCell align="center">
                    <Translate>Procedure ID</Translate>
                </HeaderCell>
                <Cell>
                    {rowData =>
                        rowData.procedureId
                    }
                </Cell>
            </Column >

            <Column flexGrow={2} fullText>
                <HeaderCell align="center">
                    <Translate>Procedure Name</Translate>
                </HeaderCell>
                <Cell>
                    {rowData => rowData.procedureName
                    }
                </Cell>
            </Column>

            <Column flexGrow={2} fullText>
                <HeaderCell align="center">
                    <Translate>Scheduled Date Time</Translate>
                </HeaderCell>
                <Cell>
                    {rowData => rowData.scheduledDateTime ? new Date(rowData.scheduledDateTime).toLocaleString() : " "}
                </Cell>
            </Column>

            <Column flexGrow={2} fullText>
                <HeaderCell align="center">
                    <Translate>Category</Translate>
                </HeaderCell>
                <Cell>
                    {rowData => {
                        const category = CategoryLovQueryResponse?.object?.find(item => {

                            return item.key === rowData.categoryKey;
                        });

                        return category?.
                            lovDisplayVale
                            || ' ';
                    }}



                </Cell>
            </Column>

            <Column flexGrow={1} fullText>
                <HeaderCell align="center">
                    <Translate>Priority</Translate>
                </HeaderCell>
                <Cell>
                    {rowData =>
                        rowData.priorityLkey ? rowData.priorityLvalue?.lovDisplayVale : rowData.priorityLkey
                    }
                </Cell>
            </Column>
            <Column flexGrow={1} fullText>
                <HeaderCell align="center">
                    <Translate>Level</Translate>
                </HeaderCell>
                <Cell>
                    {rowData =>
                        rowData.procedureLevelLkey ? rowData.procedureLevelLvalue?.lovDisplayVale : rowData.procedureLevelLkey
                    }
                </Cell>
            </Column>
            <Column flexGrow={1} fullText>
                <HeaderCell align="center">
                    <Translate>Indications</Translate>
                </HeaderCell>
                <Cell>
                    {rowData =>
                        rowData.indications
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
            <Column flexGrow={1} >
                <HeaderCell align="center">

                    <Translate>Perform</Translate>
                </HeaderCell>
                <Cell  >

                    <IconButton

                        icon={<FontAwesomeIcon icon={faBedPulse} />} />

                </Cell>
            </Column>
            <Column flexGrow={1} >
                <HeaderCell align="center">

                    <Translate>Attached File</Translate>
                </HeaderCell>
                <Cell  >

                    <IconButton
                        onClick={() => setAttachmentsModalOpen(true)}
                        icon={<FileUploadIcon />} />

                </Cell>
            </Column>
        </Table>
    </>);
};
export default Referrals;