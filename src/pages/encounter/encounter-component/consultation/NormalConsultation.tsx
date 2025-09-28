import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useGetPatientAttachmentsListQuery
} from '@/services/attachmentService';
import {
  useGetConsultationOrdersQuery,
  useSaveConsultationOrdersMutation
} from '@/services/encounterService';
import { ApConsultationOrder } from '@/types/model-types';
import { newApConsultationOrder } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BlockIcon from '@rsuite/icons/Block';
import CheckIcon from '@rsuite/icons/Check';
import React, { useEffect, useState } from 'react';
import { FaFileArrowDown } from 'react-icons/fa6';
import { IoIosMore } from 'react-icons/io';
import { MdAttachFile, MdModeEdit } from 'react-icons/md';
import CancellationModal from '@/components/CancellationModal';
import { Checkbox, HStack } from 'rsuite';
import { faClone } from '@fortawesome/free-solid-svg-icons';
import Details from './Details';
import './styles.less';
import { formatDateWithoutSeconds } from '@/utils';
import AttachmentUploadModal from '@/components/AttachmentUploadModal';
import { useLocation } from 'react-router-dom';
import { at } from 'lodash';
import clsx from 'clsx';

// ✅ import preview
import PreviewConsultation from './PreviewConsultation';

const handleDownload = attachment => {
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
};

const NormalConsultation = props => {
  const location = useLocation();

  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const edit = props.edit ?? location.state?.edit ?? false;
  const dispatch = useAppDispatch();
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [showCanceled, setShowCanceled] = useState(true);
  const [showPrev, setShowPrev] = useState(true);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [openDetailsMdal, setOpenDetailsModal] = useState(false);
  const [openConfirmCancelModel, setOpenConfirmCancelModel] = useState(false);
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
  const [previewConsultation, setPreviewConsultation] = useState<ApConsultationOrder | null>(null);

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

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters
  });

  const {
    data: consultationOrderListResponse,
    refetch: refetchCon,
    isLoading: consaultLoading
  } = useGetConsultationOrdersQuery(listRequest);

  const [saveconsultationOrders] = useSaveConsultationOrdersMutation();

  const [consultationOrders, setConsultationOrder] = useState<ApConsultationOrder>({
    ...newApConsultationOrder
  });

  const [attachmentsListRequest, setAttachmentsListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
      {
        fieldName: 'attachment_type',
        operator: 'match',
        value: 'CONSULTATION_ORDER'
      }
    ]
  });

  const {
    data: fetchPatintAttachmentsResponce,
    refetch: attachmentRefetch,
  } = useGetPatientAttachmentsListQuery(attachmentsListRequest);

  const isSelected = rowData => {
    if (rowData && consultationOrders && rowData.key === consultationOrders.key) {
      return 'selected-row';
    } else return '';
  };

  useEffect(() => {
    if (!attachmentsModalOpen) {
      setConsultationOrder({ ...newApConsultationOrder });
      setAttachmentsListRequest(prevRequest => ({
        ...prevRequest,
        filters: [
          { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
          { fieldName: 'attachment_type', operator: 'match', value: 'CONSULTATION_ORDER' }
        ]
      }));
    }
    attachmentRefetch();
  }, [attachmentsModalOpen]);

  useEffect(() => {
    setListRequest(prevRequest => ({
      ...prevRequest,
      filters: [
        { fieldName: 'visit_key', operator: 'match', value: encounter.key },
        {
          fieldName: 'status_lkey',
          operator: showCanceled ? 'notMatch' : 'match',
          value: '1804447528780744'
        }
      ]
    }));
  }, [showCanceled]);

  const handleCheckboxChange = rowData => {
    setSelectedRows(prev => {
      if (prev.includes(rowData)) {
        return prev.filter(item => item !== rowData);
      } else {
        return [...prev, rowData];
      }
    });
  };

  const OpenConfirmDeleteModel = () => setOpenConfirmCancelModel(true);
  const CloseConfirmDeleteModel = () => setOpenConfirmCancelModel(false);

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
            deletedAt: Date.now(),
            cancellationReason: consultationOrders?.cancellationReason
          }).unwrap()
        )
      );
      dispatch(notify('All orders deleted successfully'));
      refetchCon();
      setSelectedRows([]);
      CloseConfirmDeleteModel();
    } catch {
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
      dispatch(notify('All Submitted successfully'));
      refetchCon();
      setSelectedRows([]);
    } catch {
      dispatch(notify('One or more saves failed'));
    }
  };

  const handelAddNew = () => {
    handleClear();
    setOpenDetailsModal(true);
    setEditing(false);
  };

  const tableColumns = [
    {
      key: 'select',
      title: '#',
      flexGrow: 1,
      render: (rowData: any) => (
        <Checkbox
          key={rowData.id}
          checked={selectedRows.includes(rowData)}
          onChange={() => handleCheckboxChange(rowData)}
          disabled={rowData.statusLvalue?.lovDisplayVale !== 'New'}
        />
      )
    },
    {
      key: 'createdAt ',
      dataKey: 'createdAt ',
      title: <Translate>CONSULTATION DATE</Translate>,
      flexGrow: 1,
      render: (rowData: any) =>
        rowData.createdAt ? formatDateWithoutSeconds(rowData.createdAt) : ''
    },
    {
      key: 'consultantSpecialtyLkey',
      title: <Translate>CONSULTANT SPECIALTY</Translate>,
      flexGrow: 1,
      render: (rowData: any) => rowData.consultantSpecialtyLvalue?.lovDisplayVale
    },
    {
      key: 'statusLkey',
      title: <Translate>STATUS</Translate>,
      flexGrow: 1,
      render: (rowData: any) => rowData.statusLvalue?.lovDisplayVale ?? null
    },
    {
      key: 'resposeStatusLkey',
      title: <Translate>RESPOSE STATUS</Translate>,
      flexGrow: 1,
      render: (rowData: any) => rowData.resposeStatusLvalue?.lovDisplayVale
    },
    {
      key: 'viewResponse',
      title: <Translate>VIEW RESPONSE</Translate>,
      flexGrow: 1,
      render: () => <IoIosMore size={22} fill="var(--primary-gray)" />
    },
    {
      key: 'attachedFile',
      title: <Translate>ATTACHED FILE</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const matchingAttachments = fetchPatintAttachmentsResponce?.object?.filter(
          item => item.referenceObjectKey === rowData.key
        );
        const lastAttachment = matchingAttachments?.[matchingAttachments.length - 1];

        return (
          <HStack spacing={2}>
            {lastAttachment && (
              <FaFileArrowDown
                size={20}
                fill="var(--primary-gray)"
                onClick={() => handleDownload(lastAttachment)}
                style={{ cursor: 'pointer' }}
              />
            )}
            <MdAttachFile
              size={20}
              fill="var(--primary-gray)"
              onClick={() => setAttachmentsModalOpen(true)}
              style={{ cursor: 'pointer' }}
            />
          </HStack>
        );
      }
    },
    {
      key: 'action',
      title: <Translate>Action</Translate>,
      flexGrow: 1,
      render: () => (
        <div className="icons-consultation-main-container">
          <MdModeEdit
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => setOpenDetailsModal(true)}
            className="icon-button"
          />
          <FontAwesomeIcon
            icon={faClone}
            title="Clone"
            className="icon-button clone-icon-main-style"
          />
        </div>
      )
    }
  ];

  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = consultationOrderListResponse?.extraNumeric ?? 0;

  const handlePageChange = (_: unknown, newPage: number) => {
    setManualSearchTriggered(true);
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setManualSearchTriggered(true);
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };

  return (
    <div>
      <MyTable
        columns={tableColumns}
        data={consultationOrderListResponse?.object ?? []}
        onRowClick={rowData => {
          setConsultationOrder(rowData);
          setEditing(rowData.statusLkey === '164797574082125' ? false : true);
          setPreviewConsultation(rowData);
        }}
        rowClassName={isSelected}
        loading={consaultLoading || (manualSearchTriggered && consaultLoading)}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortChange={(sortBy, sortType) => {
          setListRequest({ ...listRequest, sortBy, sortType });
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        tableButtons={
          <div className="bt-div-2">
            <div className="bt-left-2">
              <MyButton
                onClick={handleSubmit}
                disabled={selectedRows.length === 0 || edit}
                prefixIcon={() => <CheckIcon />}
              >
                Submit
              </MyButton>
              <MyButton
                prefixIcon={() => <BlockIcon />}
                onClick={OpenConfirmDeleteModel}
                disabled={selectedRows.length === 0}
              >
                Cancle
              </MyButton>
              <MyButton
                appearance="ghost"
                disabled={selectedRows.length === 0}
                prefixIcon={() => <FontAwesomeIcon icon={faPrint} />}
              >
                Print
              </MyButton>
              <Checkbox
                checked={!showCanceled}
                onChange={() => setShowCanceled(!showCanceled)}
              >
                Show Cancelled
              </Checkbox>
              <Checkbox
                checked={!showPrev}
                onChange={() => setShowPrev(!showPrev)}
              >
                Show Previous Consultations
              </Checkbox>
            </div>

            <div
              className={clsx('bt-right-2', {
                'disabled-panel': edit
              })}
            >
              <MyButton onClick={handelAddNew}>Add Consultation</MyButton>
            </div>
          </div>
        }
      />

      {previewConsultation && (
        <PreviewConsultation
          consultation={previewConsultation}
          onClose={() => setPreviewConsultation(null)}
        />
      )}

      <CancellationModal
        title="Cancel Consultation "
        fieldLabel="Cancellation Reason"
        open={openConfirmCancelModel}
        setOpen={setOpenConfirmCancelModel}
        object={consultationOrders}
        setObject={setConsultationOrder}
        handleCancle={handleCancle}
        fieldName="cancellationReason"
      />

      <Details
        patient={patient}
        encounter={encounter}
        editing={editing}
        consultationOrders={consultationOrders}
        setConsultationOrder={setConsultationOrder}
        open={openDetailsMdal}
        setOpen={setOpenDetailsModal}
        refetchCon={refetchCon}
        edit={edit}
      />

      <AttachmentUploadModal
        isOpen={attachmentsModalOpen}
        setIsOpen={setAttachmentsModalOpen}
        actionType="add"
        refecthData={attachmentRefetch}
        attachmentSource={consultationOrders}
        attatchmentType="CONSULTATION_ORDER"
        patientKey={patient?.key}
      />
    </div>
  );
};

export default NormalConsultation;
