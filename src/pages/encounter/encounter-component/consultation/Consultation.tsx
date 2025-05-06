import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import './styles.less';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useAppDispatch, useAppSelector } from '@/hooks';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
import FileUploadIcon from '@rsuite/icons/FileUpload';
import { useGetPractitionersQuery } from '@/services/setupService';
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
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
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
import { faBroom, faFile, faStethoscope, faPen } from '@fortawesome/free-solid-svg-icons';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import OthersIcon from '@rsuite/icons/Others';
import RemindOutlineIcon from '@rsuite/icons/RemindOutline';
import AttachmentModal from '@/components/AttachmentUploadModal/AttachmentUploadModal';
import SearchIcon from '@rsuite/icons/Search';
import BlockIcon from '@rsuite/icons/Block';
import MyInput from '@/components/MyInput';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetIcdListQuery } from '@/services/setupService';
import {
  useGetConsultationOrdersQuery,
  useSaveConsultationOrdersMutation,
  useGetEncounterReviewOfSystemsQuery
} from '@/services/encounterService';
import { useGetPatientDiagnosisQuery } from '@/services/encounterService';
import { ApPatientDiagnose } from '@/types/model-types';
import { newApConsultationOrder, newApPatientDiagnose } from '@/types/model-types-constructor';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import AdvancedModal from '@/components/AdvancedModal';
import MyCard from '@/components/MyCard';
const Consultation = ({ edit, patient, encounter }) => {
  const dispatch = useAppDispatch();
  const [selectedRows, setSelectedRows] = useState([]);
  const [showCanceled, setShowCanceled] = useState(true);
  const [showPrev, setShowPrev] = useState(true);
  const [actionType, setActionType] = useState(null);
  const [editing, setEditing] = useState(false);
  const [openDetailsMdal, setOpenDetailsModal] = useState(false);
  const [openConfirmDeleteModel, setConfirmDeleteModel] = useState(false);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const { data: consultantSpecialtyLovQueryResponse } =
    useGetLovValuesByCodeQuery('PRACT_SUB_SPECIALTY ');
  const { data: cityLovQueryResponse } = useGetLovValuesByCodeQuery('CITY');
  const { data: consultationMethodLovQueryResponse } = useGetLovValuesByCodeQuery('CONSULT_METHOD');
  const { data: consultationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('CONSULT_TYPE');
  const { data: practitionerListResponse } = useGetPractitionersQuery({ ...initialListRequest });
  const { data: encounterReviewOfSystemsSummaryResponse, refetch } =
    useGetEncounterReviewOfSystemsQuery(encounter.key);
  const summaryText =
    encounterReviewOfSystemsSummaryResponse?.object
      ?.map((item, index) => {
        const systemDetail = item.systemDetailLvalue
          ? item.systemDetailLvalue.lovDisplayVale
          : item.systemDetailLkey;
        return `${index + 1} : ${systemDetail}\n note: ${item.notes}`;
      })
      .join('\n') +

    (encounter?.physicalExamNote ?? '');



  const filters = [
    {
      fieldName: 'patient_key',
      operator: 'match',
      value: patient.key
    },
    {
      fieldName: 'status_lkey',
      operator: showCanceled ? 'notMatch' : 'match',
      value: '1804447528780744'
    }
  ];

  if (showPrev) {
    filters.push({
      fieldName: 'visit_key',
      operator: 'match',
      value: encounter.key
    });
  }

  const { data: consultationOrderListResponse, refetch: refetchCon } =
    useGetConsultationOrdersQuery({
      ...initialListRequest,
      filters
    });
  const [saveconsultationOrders, saveConsultationOrdersMutation] =
    useSaveConsultationOrdersMutation();
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
        value: patient.key
      },
      {
        fieldName: 'visit_key',
        operator: 'match',
        value: encounter.key
      }
    ]
  });
  const [consultationOrders, setConsultationOrder] = useState<ApConsultationOrder>({
    ...newApConsultationOrder
  });
  const patientDiagnoseListResponse = useGetPatientDiagnosisQuery(listRequest);

  const [selectedDiagnose, setSelectedDiagnose] = useState<ApPatientDiagnose>({
    ...newApPatientDiagnose,
    visitKey: encounter.key,
    patientKey: patient.key,
    createdBy: 'Administrator'
  });

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

  }, [selectedDiagnose])
  useEffect(() => {
    if (patientDiagnoseListResponse.data?.object?.length > 0) {
      setSelectedDiagnose(patientDiagnoseListResponse?.data?.object[0]?.diagnosisObject);
    }
  }, [patientDiagnoseListResponse.data]);

  const isSelected = rowData => {
    if (rowData && consultationOrders && rowData.key === consultationOrders.key) {
      return 'selected-row';
    } else return '';
  };

  const handleDownload = async attachment => {
    try {
      if (!attachment?.fileContent || !attachment?.contentType || !attachment?.fileName) {
        console.error('Invalid attachment data.');
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
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = attachment.fileName;

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('File downloaded successfully:', attachment.fileName);
      attachmentRefetch()
        .then(() => {
          console.log('Refetch complete');
        })
        .catch(error => {
          console.error('Refetch failed:', error);
        });
    } catch (error) {
      console.error('Error during file download:', error);
    }
  };

  const handleDownloadSelectedPatientAttachment = attachmentKey => {
    setRequestedPatientAttacment(attachmentKey);
    setActionType('download');
    handleDownload(fetchAttachmentByKeyResponce);
  };

  const handleCheckboxChange = key => {
    setSelectedRows(prev => {
      if (prev.includes(key)) {
        return prev.filter(item => item !== key);
      } else {
        return [...prev, key];
      }
    });
  };
  const OpenConfirmDeleteModel = () => {
    setConfirmDeleteModel(true);
  };
  const CloseConfirmDeleteModel = () => {
    setConfirmDeleteModel(false);
  };
  const handleSave = async () => {
    try {
      await saveconsultationOrders({
        ...consultationOrders,
        patientKey: patient.key,
        visitKey: encounter.key,
        statusLkey: '164797574082125',
        createdBy: 'Admin'
      }).unwrap();
      dispatch(notify('saved  Successfully'));
      refetchCon()
        .then(() => {
          setOpenDetailsModal(false);
          handleClear();
        })
        .catch(error => {
          console.error('Refetch failed:', error);
        });

    } catch (error) {
      dispatch(notify('Save Failed'));
    }
  };
  const handleClear = async () => {
    setConsultationOrder({
      ...newApConsultationOrder,
      consultationMethodLkey: null,
      consultationTypeLkey: null,
      cityLkey: null,
      consultantSpecialtyLkey: null,
      preferredConsultantKey: null
    });
  };
  const handleCancle = async () => {
    try {
      await Promise.all(
        selectedRows.map(item =>
          saveconsultationOrders({
            ...item,
            statusLkey: '1804447528780744',
            isValid: false,
            deletedAt: Date.now()
          }).unwrap()
        )
      );

      dispatch(notify('All orders deleted successfully'));

      refetchCon()
        .then(() => {
          console.log('Refetch complete');
        })
        .catch(error => {
          console.error('Refetch failed:', error);
        });
      setSelectedRows([]);
      CloseConfirmDeleteModel();
    } catch (error) {
      console.error('Encounter save failed:', error);
      dispatch(notify('One or more deleted failed'));
      CloseConfirmDeleteModel();
    }
  };
  const handleSubmit = async () => {

    try {
      await Promise.all(
        selectedRows.map(item =>
          saveconsultationOrders({
            ...item,
            submitDate: Date.now(),
            statusLkey: '1804482322306061'
          }).unwrap()
        )
      );

      dispatch(notify('All  Submitted successfully'));

      refetchCon()
        .then(() => {
          console.log('Refetch complete');
        })
        .catch(error => {
          console.error('Refetch failed:', error);
        });
      setSelectedRows([]);
    } catch (error) {
      console.error('Encounter save failed:', error);
      dispatch(notify('One or more saves failed'));
    }
  };
  const handelAddNew = () => {
    handleClear();
    setOpenDetailsModal(true)
  }
  return (
    <div>
      <h5>Consultation Order</h5>
      <br />
    

      <div className='bt-div'>
        <MyButton
          onClick={handleSubmit}
          disabled={selectedRows.length === 0}
          prefixIcon={() => <CheckIcon />}
        >Submit</MyButton>
        <MyButton
          prefixIcon={() => <BlockIcon />}
          onClick={OpenConfirmDeleteModel}
          disabled={selectedRows.length === 0}
        >Cancle</MyButton>
        <MyButton
          appearance='ghost'
          disabled={selectedRows.length === 0}
          prefixIcon={() => <FontAwesomeIcon icon={faPrint} />}
        >Print</MyButton>


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
        <div className='bt-right'>
          <MyButton
            onClick={handelAddNew}
          >Add Consultation</MyButton>
        </div>
      </div>

      <div>
        <Table
          autoHeight
          sortColumn={listRequest.sortBy}
          onSortColumn={(sortBy, sortType) => {
            if (sortBy)
              setListRequest({
                ...listRequest,
                sortBy,
                sortType
              });
          }}

          data={consultationOrderListResponse?.object ?? []}
          onRowClick={rowData => {
            setConsultationOrder(rowData);
            setEditing(rowData.statusLkey == '164797574082125' ? false : true);

          }}
          rowClassName={isSelected}
        >
          <Column flexGrow={1} fullText>
            <HeaderCell >
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
            <HeaderCell >
              <Translate>Consultation Date</Translate>
            </HeaderCell>

            <Cell>
              {rowData => (rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : '')}
            </Cell>
          </Column>

          <Column flexGrow={2} fullText>
            <HeaderCell >
              {/* <Input onChange={e => handleFilterChange('consultantSpecialtyLvalue', e)} /> */}
              <Translate>Consultant Specialty</Translate>
            </HeaderCell>
            <Cell>{rowData => rowData.consultantSpecialtyLvalue?.lovDisplayVale}</Cell>
          </Column>

          <Column flexGrow={2} fullText>
            <HeaderCell>
              {/* <Input onChange={e => handleFilterChange('statusLvalue', e)} /> */}
              <Translate>Status</Translate>
            </HeaderCell>
            <Cell>{rowData => rowData.statusLvalue.lovDisplayVale}</Cell>
          </Column>
          <Column flexGrow={2} fullText>
            <HeaderCell  >
              {/* <Input onChange={e => handleFilterChange('createdBy', e)} /> */}
              <Translate>Submitted By</Translate>
            </HeaderCell>
            <Cell>{rowData => rowData.createdBy}</Cell>
          </Column>
          <Column flexGrow={2} fullText>
            <HeaderCell  >
              {/* <Input onChange={e => handleFilterChange('ststusLvalue', e)} /> */}
              <Translate>Submission Date & Time</Translate>
            </HeaderCell>
            <Cell>
              {rowData =>
                rowData.submissionDate ? new Date(rowData.submissionDate).toLocaleString() : ''
              }
            </Cell>
          </Column>
          <Column flexGrow={2} fullText>
            <HeaderCell  >
              {/* <Input onChange={e => handleFilterChange('resposeStatusLvalue', e)} /> */}
              <Translate>Respose Status</Translate>
            </HeaderCell>
            <Cell>{rowData => rowData.resposeStatusLvalue?.lovDisplayVale}</Cell>
          </Column>
          <Column flexGrow={1}>
            <HeaderCell  >
              <Translate>View Response</Translate>
            </HeaderCell>
            <Cell align='center'>
              <MyButton
                size='xsmall'
                appearance='subtle'
                color="var(--primary-gray)"
              ><OthersIcon /></MyButton>

            </Cell>
          </Column>
          <Column flexGrow={1}>
            <HeaderCell  >
              <Translate>Attached File</Translate>
            </HeaderCell>
            <Cell align='center'>
              <MyButton
                size='xsmall'
                appearance='subtle'
                color="var(--primary-gray)"
                onClick={() => handleDownloadSelectedPatientAttachment(fetchOrderAttachResponse.data.key)}><FileDownloadIcon /></MyButton>

            </Cell>
          </Column>
          <Column flexGrow={1}>
            <HeaderCell  >
              <Translate>Attached File</Translate>
            </HeaderCell>
            <Cell align='center'>
              <MyButton
                size='xsmall'
                appearance='subtle'
                color="var(--primary-gray)"
                onClick={() => setOpenDetailsModal(true)}><FontAwesomeIcon icon={faPen} /></MyButton>
            </Cell>
          </Column>
        </Table>
      </div>
      <DeletionConfirmationModal
        open={openConfirmDeleteModel}
        setOpen={setConfirmDeleteModel}
        itemToDelete='Consultation'
        actionButtonFunction={handleCancle}>

      </DeletionConfirmationModal>


      <AttachmentModal
        isOpen={attachmentsModalOpen}
        setIsOpen={setAttachmentsModalOpen}
        attachmentSource={consultationOrders}
        attatchmentType={'CONSULTATION_ORDER'}
      />
      <AdvancedModal
        open={openDetailsMdal}
        setOpen={setOpenDetailsModal}
        actionButtonFunction={handleSave}
        footerButtons={<div style={{ display: 'flex', gap: '5px' }}>
          <MyButton
            onClick={() => setAttachmentsModalOpen(true)}
            prefixIcon={() => <FontAwesomeIcon icon={faFile} />}
          >Attachment File</MyButton>


          <MyButton
            prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
            onClick={handleClear}
          >Clear</MyButton>
        </div>}
        rightTitle='Add Consultation'
        rightContent={<div >
          <div className='div-parent' >
            <div style={{ flex: 1 }} >
              <Form layout="inline" fluid >
                <MyInput
                  column
                  disabled={editing}
                  width={300}
                  fieldType="select"
                  fieldLabel="Consultant Specialty"
                  selectData={consultantSpecialtyLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName={'consultantSpecialtyLkey'}
                  record={consultationOrders}
                  setRecord={setConsultationOrder}
                />
              </Form>
            </div>
            <div style={{ flex: 1 }} >
              <Form layout="inline" fluid >
                <MyInput
                  column
                  disabled={editing}
                  width={300}
                  fieldType="select"
                  fieldLabel="City"
                  selectData={cityLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName={'cityLkey'}
                  record={consultationOrders}
                  setRecord={setConsultationOrder}
                />
              </Form>
            </div>
            <div style={{ flex: 1 }} >
              <Form layout="inline" >

                <MyInput
                  column
                  disabled={editing}
                  width={300}
                  fieldType="select"
                  fieldLabel="Preferred Consultant"
                  fieldName={'preferredConsultantKey'}
                  selectData={practitionerListResponse?.object ?? []}
                  selectDataLabel="practitionerFullName"
                  selectDataValue="key"
                  record={consultationOrders}
                  setRecord={setConsultationOrder}
                />
              </Form>
            </div>
          </div>
          <div className='div-parent' >
            <div style={{ flex: 1 }} >
              <Form layout="inline" fluid >
                <MyInput
                  column
                  disabled={editing}
                  width={300}
                  fieldType="select"
                  fieldLabel="Consultation Method"
                  selectData={consultationMethodLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName={'consultationMethodLkey'}
                  record={consultationOrders}
                  setRecord={setConsultationOrder}
                />
              </Form>
            </div>
            <div style={{ flex: 1 }} >
              <Form layout="inline" fluid >
                <MyInput
                  column
                  disabled={editing}
                  width={300}
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
            </div>
            <div style={{ flex: 1 }} ></div>
          </div>
          <div className="div-parent">
            <div style={{ flex: 1 }}>
              <Form fluid>
                <MyInput
                  column
                  width={'100%'}
                  disabled={editing}
                  fieldName="consultationContent"
                  rows={6}
                  fieldType="textarea"
                  record={consultationOrders}
                  setRecord={setConsultationOrder}
                />

              </Form>
            </div>
            <div style={{ flex: 1 }}>
              <Form fluid>
                <MyInput
                  column
                  width={'100%'}
                  disabled={editing}
                  fieldName="notes"
                  rows={6}
                  fieldType="textarea"
                  record={consultationOrders}
                  setRecord={setConsultationOrder}
                />
              </Form>
            </div>
          </div>

        </div>}
       
        leftContent={<div
          style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <MyCard
            title={"Diagnosis"}
            contant={
              selectedDiagnose && selectedDiagnose.icdCode && selectedDiagnose.description
                ? `${selectedDiagnose.icdCode}, ${selectedDiagnose.description}`
                : ''
            }></MyCard>
          <MyCard
            title={"Physical Examination"}
            contant={summaryText}></MyCard>
        </div>}
      ></AdvancedModal>
    </div>

  );
};
export default Consultation;
