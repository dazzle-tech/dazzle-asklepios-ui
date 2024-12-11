import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import './styles.less';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useAppDispatch, useAppSelector } from '@/hooks';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
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
import {useGetConsultationOrdersQuery,
    useSaveConsultationOrdersMutation} from '@/services/encounterService'
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
    const [openConfirmDeleteModel, setConfirmDeleteModel] = useState(false);
    const { data: consultantSpecialtyLovQueryResponse } = useGetLovValuesByCodeQuery('PRACT_SPECIALY');
    const { data: cityLovQueryResponse } = useGetLovValuesByCodeQuery('CITY');
    const { data: consultationMethodLovQueryResponse } = useGetLovValuesByCodeQuery('CONSULT_METHOD');
    const { data: consultationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('CONSULT_TYPE');
    const { data: practitionerListResponse } = useGetPractitionersQuery({ ...initialListRequest });
    const { data: consultationOrderListResponse,refetch:refetchCon } = useGetConsultationOrdersQuery(
        { ...initialListRequest,
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
    const [saveconsultationOrders, saveConsultationOrdersMutation] = useSaveConsultationOrdersMutation();
    const { data: icdListResponseData } = useGetIcdListQuery({
        ...initialListRequest,
        pageSize: 100
    });
   
    const [listRequest, setListRequest] = useState({
        ...initialListRequest,
        pageSize: 100,
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
    const [selectedDiagnose, setSelectedDiagnose] = useState<ApPatientDiagnose>(
        patientDiagnoseListResponse?.data?.object.length > 0
            ? patientDiagnoseListResponse?.data?.object[0].diagnosisObject
            : {
                ...newApPatientDiagnose,
                visitKey: patientSlice.encounter.key,
                patientKey: patientSlice.patient.key,
                createdBy: 'Administrator',
            }
    );
    const isSelected = rowData => {
        if (rowData && consultationOrders && rowData.key === consultationOrders.key) {
            return 'selected-row';
        } else return '';
    };
    console.log(selectedDiagnose)
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
    const handleSave=async()=>{
        try{ 
            await saveconsultationOrders({...consultationOrders,
                patientKey:patientSlice.patient.key,
	            visitKey:patientSlice.encounter.key,
                statusLkey:'164797574082125',
                createdBy:"Admin"}).unwrap();
            dispatch(notify('saved  Successfully'));
            refetchCon().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });
            handleClear();
        }catch(error)
        {
            dispatch(notify('saved  fill'));
        }

    }
    const handleClear=async()=>{
        setConsultationOrder({
            ...newApConsultationOrder
            ,
            consultationMethodLkey:null,
            consultationTypeLkey:null,
            cityLkey:null,
            consultantSpecialtyLkey:null,
            preferredConsultantKey:null
        }); 
    }
    const handleCancle = async () => {
        console.log(selectedRows);

        try {
            await Promise.all(
                selectedRows.map(item => saveconsultationOrders({...item, statusLkey: '1804447528780744', isValid: false ,deletedAt: Date.now()}).unwrap())
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
    return (<>
        <h5>Consultation Order</h5>
        <br />
        <div className='top-div'>
            <div>
                <Form style={{ zoom: 0.85 }} layout="inline" fluid>

                    <MyInput
                        column
                        disabled={false}
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
                        disabled={false}
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
                        disabled={false}
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
                        disabled={false}
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
                        disabled={false}
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
                        fieldName="consultationContent"
                        rows={6}
                        fieldType="textarea"
                        record={consultationOrders}
                        setRecord={setConsultationOrder}
                    />

                    <MyInput
                        column
                        width={300}
                        fieldName="notes"
                        rows={6}
                        fieldType="textarea"
                        record={consultationOrders}
                        setRecord={setConsultationOrder}
                    />


                   
                    {/* <AttachmentModal isOpen={attachmentsModalOpen} onClose={() => setAttachmentsModalOpen(false)} localPatient={order} attatchmentType={'ORDER_ATTACHMENT'} /> */}


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
                <Text style={{ zoom: 0.88 }}>Diagnose</Text>
                <SelectPicker

                    disabled={patientSlice.encounter.encounterStatusLkey == '91109811181900' ? true : false}
                    style={{ width: '100%', zoom: 0.80 }}
                    data={icdListResponseData?.object ?? []}
                    labelKey="description"
                    valueKey="key"
                    placeholder="ICD"
                    value={selectedDiagnose.diagnoseCode}

                />
                <Form style={{ zoom: 0.85 }} layout="inline" fluid>
                    <MyInput
                        column
                        width={300}
                        fieldName="findingsSummary"
                        rows={6}
                        fieldType="textarea"
                        record={{}}
                        setRecord={""}
                    />
                </Form>
                <div style={{display:"flex",flexDirection:"row"}}>
                <IconButton
                        style={{ marginTop: "20px"}}
                        color="cyan"
                        appearance="primary"
                        icon={<PlusIcon />}
                    // disabled={order.statusLkey !== '164797574082125'}
                    // onClick={() => setAttachmentsModalOpen(true)}
                    >
                        <Translate>Attached File</Translate>
                    </IconButton>
                    <Button
                         style={{ marginTop: "20px"}}
                        appearance="link"
                    // onClick={() => handleDownloadSelectedPatientAttachment(fetchOrderAttachResponse.data.key)}
                    >
                        Download <FileDownloadIcon style={{ marginLeft: '3px' ,scale: '1.4' }} />
                    </Button>
                    </div>
            </div>

        </div>
        <div className='mid-container-p '>
            <div >
                <IconButton
                    color="cyan"
                    appearance="primary"
                    // onClick={handleSaveMedication}
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
                // onClick={handleCleare}

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
                    <Column sortable  flexGrow={2}  fullText>
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
                            Are you sure you want to delete this orders?
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