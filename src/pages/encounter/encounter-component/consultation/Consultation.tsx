import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import './styles.less';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useAppDispatch, useAppSelector } from '@/hooks';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
import FileUploadIcon from '@rsuite/icons/FileUpload';
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
    Divider
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { ApConsultationOrder, ApPatientEncounterOrder } from '@/types/model-types';
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
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import OthersIcon from '@rsuite/icons/Others';
import RemindOutlineIcon from '@rsuite/icons/RemindOutline';
import AttachmentModal from "@/pages/patient/patient-profile/AttachmentUploadModal";
import SearchIcon from '@rsuite/icons/Search';
import BlockIcon from '@rsuite/icons/Block';
import MyInput from '@/components/MyInput';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetIcdListQuery } from '@/services/setupService';
import {
    useGetConsultationOrdersQuery,
    useSaveConsultationOrdersMutation,
    useGetEncounterReviewOfSystemsQuery
} from '@/services/encounterService'
import {
    useGetPatientDiagnosisQuery
} from '@/services/encounterService';
import { ApPatientDiagnose } from '@/types/model-types';
import { newApConsultationOrder, newApPatientDiagnose } from '@/types/model-types-constructor';
const Consultation = () => {
    const patientSlice = useAppSelector(state => state.patient);
    const dispatch = useAppDispatch();
    const [selectedRows, setSelectedRows] = useState([]);
    const [showCanceled, setShowCanceled] = useState(true);
    const [showPrev, setShowPrev] = useState(true);
    const [actionType, setActionType] = useState(null);
    const [editing, setEditing] = useState(false);
    const [openConfirmDeleteModel, setConfirmDeleteModel] = useState(false);
    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
    const { data: consultantSpecialtyLovQueryResponse } = useGetLovValuesByCodeQuery('PRACT_SPECIALY');
    const { data: cityLovQueryResponse } = useGetLovValuesByCodeQuery('CITY');
    const { data: consultationMethodLovQueryResponse } = useGetLovValuesByCodeQuery('CONSULT_METHOD');
    const { data: consultationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('CONSULT_TYPE');
    const { data: practitionerListResponse } = useGetPractitionersQuery({ ...initialListRequest });
    const { data: encounterReviewOfSystemsSummaryResponse, refetch } = useGetEncounterReviewOfSystemsQuery(patientSlice.encounter.key);
    console.log(encounterReviewOfSystemsSummaryResponse?.object)
    const summaryText = encounterReviewOfSystemsSummaryResponse?.object
        ?.map((item, index) => {
            const systemDetail = item.systemDetailLvalue
                ? item.systemDetailLvalue.lovDisplayVale
                : item.systemDetailLkey;
            return `* ${systemDetail}\n${item.notes}`;
        })
        .join("\n") +"\n___________-________\n"+patientSlice.encounter.physicalExamNote;


    console.log(summaryText);

    const filters = [
        {
            fieldName: 'patient_key',
            operator: 'match',
            value: patientSlice.patient.key
        },
        {
            fieldName: "status_lkey",
            operator: showCanceled ? "notMatch" : "match",
            value: "1804447528780744",
        }
    ];

    if (showPrev) {
        filters.push({
            fieldName: 'visit_key',
            operator: 'match',
            value: patientSlice.encounter.key
        });
    }

    const { data: consultationOrderListResponse, refetch: refetchCon } = useGetConsultationOrdersQuery({
        ...initialListRequest,
        filters
    });
    const [saveconsultationOrders, saveConsultationOrdersMutation] = useSaveConsultationOrdersMutation();
    const { data: icdListResponseData } = useGetIcdListQuery({
        ...initialListRequest,
        pageSize: 100
    });

    const [listRequest, setListRequest] = useState({
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
    const [consultationOrders, setConsultationOrder] = useState<ApConsultationOrder>(
        {
            ...newApConsultationOrder

        });
    const patientDiagnoseListResponse = useGetPatientDiagnosisQuery(listRequest);

    console.log(patientDiagnoseListResponse?.data?.object[0]?.diagnosisObject.icdCode + "," + patientDiagnoseListResponse?.data?.object[0]?.diagnosisObject.description + "," + patientDiagnoseListResponse?.data?.object?.length)
    const [selectedDiagnose, setSelectedDiagnose] = useState<ApPatientDiagnose>({
        ...newApPatientDiagnose,
        visitKey: patientSlice.encounter.key,
        patientKey: patientSlice.patient.key,
        createdBy: 'Administrator'


    });


    const key =
        patientDiagnoseListResponse?.data?.object &&
            Array.isArray(patientDiagnoseListResponse.data?.object) &&
            patientDiagnoseListResponse.data?.object?.length > 0
            ? patientDiagnoseListResponse.data?.object[0]?.key ?? ""
            : "";

    console.log(key);
    // const { data: fetchPatintAttachmentsResponce, refetch: attachmentRefetch } =
    // useFetchAttachmentLightQuery({ refKey: consultationOrders?.key }, { skip: !consultationOrders?.key });
    const [requestedPatientAttacment, setRequestedPatientAttacment] = useState();
    const fetchOrderAttachResponse = useFetchAttachmentQuery(
        {
            type: 'CONSULTATION_ORDER',
            refKey: consultationOrders.key
        },
        { skip: !consultationOrders.key }
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
        { skip: !requestedPatientAttacment || !consultationOrders.key }
    );


    useEffect(() => {
        if (patientDiagnoseListResponse.data?.object?.length > 0) {
            setSelectedDiagnose(patientDiagnoseListResponse?.data?.object[0]?.diagnosisObject
            );
        }
    }, [patientDiagnoseListResponse.data]);

    console.log(selectedDiagnose);
    const isSelected = rowData => {
        if (rowData && consultationOrders && rowData.key === consultationOrders.key) {
            return 'selected-row';
        } else return '';
    };
    console.log(selectedDiagnose);
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
            attachmentRefetch().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });
        } catch (error) {
            console.error("Error during file download:", error);
        }
    };
    console.log(fetchAttachmentByKeyResponce)
    console.log(fetchOrderAttachResponse)
    // useEffect(() => {
    //     console.log("iam in useefect download")
    //     if (isSuccess && fetchAttachmentByKeyResponce) {
    //       if (actionType === 'download') {
    //         handleDownload(fetchAttachmentByKeyResponce);
    //       } 
    //     }
    //   }, [requestedPatientAttacment, fetchAttachmentByKeyResponce, actionType]);
    const handleDownloadSelectedPatientAttachment = attachmentKey => {

        setRequestedPatientAttacment(attachmentKey);
        setActionType('download');
        console.log("iam in download atach atKey= " + attachmentKey)

        handleDownload(fetchAttachmentByKeyResponce);


    };
    const handleFilterChange = (fieldName, value) => {
        if (value) {
            setListRequest(
                addFilterToListRequest(
                    fromCamelCaseToDBName(fieldName),
                    'containsIgnoreCase',
                    value,
                    listRequest
                )
            );
        } else {
            setListRequest({ ...listRequest, filters: [] });
        }
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
    const handleSave = async () => {
        try {
            await saveconsultationOrders({
                ...consultationOrders,
                patientKey: patientSlice.patient.key,
                visitKey: patientSlice.encounter.key,
                statusLkey: '164797574082125',
                createdBy: "Admin"
            }).unwrap();
            dispatch(notify('saved  Successfully'));
            refetchCon().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });
            handleClear();
        } catch (error) {
            dispatch(notify('saved  fill'));
        }

    }
    const handleClear = async () => {
        setConsultationOrder({
            ...newApConsultationOrder
            ,
            consultationMethodLkey: null,
            consultationTypeLkey: null,
            cityLkey: null,
            consultantSpecialtyLkey: null,
            preferredConsultantKey: null
        });
    }
    const handleCancle = async () => {
        console.log(selectedRows);

        try {
            await Promise.all(
                selectedRows.map(item => saveconsultationOrders({ ...item, statusLkey: '1804447528780744', isValid: false, deletedAt: Date.now() }).unwrap())
            );

            dispatch(notify('All orders deleted successfully'));

            refetchCon().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });
            setSelectedRows([]);
            CloseConfirmDeleteModel();
        } catch (error) {
            console.error("Encounter save failed:", error);
            dispatch(notify('One or more deleted failed'));
            CloseConfirmDeleteModel();
        }
    };
    const handleSubmit = async () => {
        console.log(selectedRows);

        try {
            await Promise.all(
                selectedRows.map(item => saveconsultationOrders({ ...item, submitDate: Date.now(), statusLkey: '1804482322306061' }).unwrap())
            );

            dispatch(notify('All  Submitted successfully'));

            refetchCon().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });
            setSelectedRows([]);
        } catch (error) {
            console.error("Encounter save failed:", error);
            dispatch(notify('One or more saves failed'));
        }
    };
    return (<>
        <h5>Consultation Order</h5>
        <br />
        <div className='top-div'>
            <div>
                <Form style={{ zoom: 0.85 }} layout="inline" fluid>

                    <MyInput
                        column
                        disabled={editing}
                        width={200}
                        fieldType="select"
                        fieldLabel="Consultant Specialty"
                        selectData={consultantSpecialtyLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'consultantSpecialtyLkey'}
                        record={consultationOrders}
                        setRecord={setConsultationOrder}
                    />
                    <MyInput
                        column
                        disabled={editing}
                        width={200}
                        fieldType="select"
                        fieldLabel="City"
                        selectData={cityLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'cityLkey'}
                        record={consultationOrders}
                        setRecord={setConsultationOrder}
                    />

                    <MyInput
                        column
                        disabled={editing}
                        width={200}
                        fieldType="select"
                        fieldLabel="Preferred Consultant"
                        fieldName={'preferredConsultantKey'}
                        selectData={practitionerListResponse?.object ?? []}
                        selectDataLabel="practitionerFullName"
                        selectDataValue="key"
                        record={consultationOrders}
                        setRecord={setConsultationOrder}
                    />

                    <MyInput
                        column
                        disabled={editing}
                        width={200}
                        fieldType="select"
                        fieldLabel="Consultation Method"
                        selectData={consultationMethodLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'consultationMethodLkey'}
                        record={consultationOrders}
                        setRecord={setConsultationOrder}
                    />
                    <MyInput
                        column
                        disabled={editing}
                        width={200}
                        fieldType="select"
                        fieldLabel="Consultation Type"
                        selectData={consultationTypeLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'consultationTypeLkey'}
                        record={consultationOrders}
                        setRecord={setConsultationOrder}
                    />

                </Form>
                <br />
                <Form style={{ zoom: 0.85 }} layout="inline" fluid>

                    <MyInput
                        column
                        width={300}
                        disabled={editing}
                        fieldName="consultationContent"
                        rows={6}
                        fieldType="textarea"
                        record={consultationOrders}
                        setRecord={setConsultationOrder}
                    />

                    <MyInput
                        column
                        width={300}
                        disabled={editing}
                        fieldName="notes"
                        rows={6}
                        fieldType="textarea"
                        record={consultationOrders}
                        setRecord={setConsultationOrder}
                    />






                </Form>
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
            <div style={{ display: "flex", flexDirection: "column", width: "250px" }} >

                <Form style={{ zoom: 0.85 }} layout="inline" fluid>

                    <Text>Diagnose</Text>
                    <textarea
                        value={selectedDiagnose.icdCode + "," + selectedDiagnose.description}
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
                        Download <FileDownloadIcon style={{ marginLeft: '10px', scale: '1.4' }} />
                    </Button>}
                    <AttachmentModal isOpen={attachmentsModalOpen} onClose={() => setAttachmentsModalOpen(false)} localPatient={consultationOrders} attatchmentType={'CONSULTATION_ORDER'} />

                </div>
            </div>

        </div>
        <div className='mid-container-p '>
            <div >
                <IconButton
                    color="cyan"
                    appearance="primary"
                    onClick={handleSubmit}
                    icon={<CheckIcon />}
                    disabled={selectedRows.length === 0}
                >
                    <Translate>Submit</Translate>
                </IconButton>
                <IconButton
                    color="cyan"
                    appearance="primary"
                    style={{ marginLeft: "5px" }}
                    icon={<BlockIcon />}
                    onClick={OpenConfirmDeleteModel}
                    disabled={selectedRows.length === 0}
                >
                    <Translate> Cancle</Translate>
                </IconButton>
                <Button
                    color="cyan"
                    appearance="primary"
                    style={{ marginLeft: "5px" }}
                    disabled={selectedRows.length === 0}

                >

                    <FontAwesomeIcon icon={faPrint} style={{ marginRight: '5px' }} />
                    <span>Print</span>
                </Button>

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
                    Show Previous Consultations
                </Checkbox>
            </div>

            <div>
                <Table
                    height={400}
                    sortColumn={listRequest.sortBy}

                    onSortColumn={(sortBy, sortType) => {
                        if (sortBy)
                            setListRequest({
                                ...listRequest,
                                sortBy,
                                sortType
                            });
                    }}
                    headerHeight={80}
                    rowHeight={60}
                    bordered
                    cellBordered

                    data={consultationOrderListResponse?.object ?? []}
                    onRowClick={rowData => {
                        setConsultationOrder(rowData);
                        setEditing(rowData.statusLkey == "164797574082125" ? false : true)
                        console.log(requestedPatientAttacment)

                    }}
                    rowClassName={isSelected}
                >
                    <Column flexGrow={1} fullText>
                        <HeaderCell align="center">

                            <Translate>#</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => (
                                <Checkbox
                                    key={rowData.id}
                                    checked={selectedRows.includes(rowData)}
                                    onChange={() => handleCheckboxChange(rowData)}
                                    disabled={rowData.statusLvalue?.lovDisplayVale !== 'New'}
                                />
                            )}
                        </Cell>


                    </Column>
                    <Column sortable flexGrow={2} fullText>
                        <HeaderCell align="center">

                            <Translate>Consultation Date</Translate>
                        </HeaderCell>

                        <Cell  >
                            {rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ""}
                        </Cell>
                    </Column>

                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('consultantSpecialtyLvalue', e)} />
                            <Translate>Consultant Specialty</Translate>
                        </HeaderCell>
                        <Cell >
                            {rowData => rowData.consultantSpecialtyLvalue?.lovDisplayVale}
                        </Cell>
                    </Column>


                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('statusLvalue', e)} />
                            <Translate>Status</Translate>
                        </HeaderCell>
                        <Cell >
                            {rowData => rowData.statusLvalue.lovDisplayVale}
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('createdBy', e)} />
                            <Translate>Submitted By</Translate>
                        </HeaderCell>
                        <Cell >
                            {rowData => rowData.createdBy}
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('ststusLvalue', e)} />
                            <Translate>Submission Date & Time</Translate>
                        </HeaderCell>
                        <Cell >
                            {rowData => rowData.submissionDate ? new Date(rowData.submissionDate).toLocaleString() : ""}
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('resposeStatusLvalue', e)} />
                            <Translate>Respose Status</Translate>
                        </HeaderCell>
                        <Cell >
                            {rowData => rowData.resposeStatusLvalue?.lovDisplayVale}
                        </Cell>
                    </Column>
                    <Column flexGrow={2} >
                        <HeaderCell align="center">

                            <Translate>View Response</Translate>
                        </HeaderCell>
                        <Cell  >

                            <IconButton icon={<OthersIcon />} />

                        </Cell>
                    </Column>
                    <Column flexGrow={2} >
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

            </div>
            <Modal open={openConfirmDeleteModel} onClose={CloseConfirmDeleteModel} overflow  >
                <Modal.Title>
                    <Translate><h6>Confirm Delete</h6></Translate>
                </Modal.Title>
                <Modal.Body>
                    <p>
                        <RemindOutlineIcon style={{ color: '#ffca61', marginRight: '8px', fontSize: '24px' }} />
                        <Translate style={{ fontSize: '24px' }} >
                            Are you sure you want to delete this Consultations?
                        </Translate>
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Stack spacing={2} divider={<Divider vertical />}>
                        <Button appearance="primary" onClick={handleCancle}>
                            Delete
                        </Button>
                        <Button appearance="ghost" color="cyan" onClick={CloseConfirmDeleteModel}>
                            Cancel
                        </Button>
                    </Stack>
                </Modal.Footer>
            </Modal>
        </div>
    </>);

};
export default Consultation;