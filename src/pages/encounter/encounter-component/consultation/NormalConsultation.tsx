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
import { faPrint, faClone } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BlockIcon from '@rsuite/icons/Block';
import CheckIcon from '@rsuite/icons/Check';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaFileArrowDown } from 'react-icons/fa6';
import { IoIosMore } from 'react-icons/io';
import { MdAttachFile, MdModeEdit } from 'react-icons/md';
import CancellationModal from '@/components/CancellationModal';
import { Checkbox, HStack } from 'rsuite';
import Details from './Details';
import './styles.less';
import { formatDateWithoutSeconds } from '@/utils';
import AttachmentUploadModal from '@/components/AttachmentUploadModal';
import { useLocation } from 'react-router-dom';
import clsx from 'clsx';

// ✅ preview component
import PreviewConsultation from './PreviewConsultation';

/** Download helper for attachment blobs */
const handleDownload = (attachment: any) => {
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

const NormalConsultation = (props: any) => {
  const location = useLocation();

  // Table-only container to detect inside/outside clicks
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

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

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      { fieldName: 'patient_key', operator: 'match', value: patient?.key },
      ...(showPrev
        ? [{ fieldName: 'visit_key', operator: 'match', value: encounter?.key }]
        : []),
      {
        fieldName: 'status_lkey',
        operator: showCanceled ? 'notMatch' : 'match',
        value: '1804447528780744' // cancelled code
      }
    ]
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
      { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
      { fieldName: 'attachment_type', operator: 'match', value: 'CONSULTATION_ORDER' }
    ]
  });

  const { data: fetchPatintAttachmentsResponce, refetch: attachmentRefetch } =
    useGetPatientAttachmentsListQuery(attachmentsListRequest);

  /** Highlight selected row */
  const isSelected = (rowData: any) =>
    rowData && consultationOrders && rowData.key === consultationOrders.key ? 'selected-row' : '';

  /** Helpers to classify click targets */
  const isFormField = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest(`
        input, textarea, select, button, [contenteditable="true"],
        .rs-input, .rs-picker, .rs-checkbox, .rs-btn, .rs-datepicker,
        .rs-picker-toggle, .rs-calendar, .rs-dropdown, .rs-auto-complete,
        .rs-input-group, .rs-select, .rs-slider
      `) !== null
    );
  };

  const isInsideModalOrPopup = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest(`
        .rs-modal, .rs-drawer, .rs-picker-select-menu, .rs-picker-popup,
        .my-modal, .my-popup
      `) !== null
    );
  };

  const isTableDataRow = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest('.rs-table-row, .MuiTableRow-root, [data-row="true"], [role="row"]') !== null &&
      node.closest('.rs-table-row-header, .MuiTableHead-root, [data-header="true"]') === null
    );
  };

  /** Clear selection and preview */
  const handleClear = useCallback(() => {
    setConsultationOrder({
      ...newApConsultationOrder,
      consultationMethodLkey: null,
      consultationTypeLkey: null,
      cityLkey: null,
      consultantSpecialtyLkey: null,
      preferredConsultantKey: null
    });
    setSelectedRows([]);
    setPreviewConsultation(null);
    setEditing(false);
  }, []);

  /** Refresh attachments query filters on modal open/close */
  useEffect(() => {
    if (!attachmentsModalOpen) {
      setConsultationOrder({ ...newApConsultationOrder });
      setAttachmentsListRequest(prev => ({
        ...prev,
        filters: [
          { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
          { fieldName: 'attachment_type', operator: 'match', value: 'CONSULTATION_ORDER' }
        ]
      }));
    }
    attachmentRefetch();
  }, [attachmentsModalOpen, attachmentRefetch]);

  /** Keep list filters in sync with toggles (cancelled / previous) */
  useEffect(() => {
    setListRequest(prev => ({
      ...prev,
      filters: [
        { fieldName: 'patient_key', operator: 'match', value: patient?.key },
        ...(showPrev
          ? [{ fieldName: 'visit_key', operator: 'match', value: encounter?.key }]
          : []),
        {
          fieldName: 'status_lkey',
          operator: showCanceled ? 'notMatch' : 'match',
          value: '1804447528780744'
        }
      ]
    }));
  }, [showCanceled, showPrev, patient?.key, encounter?.key]);

  /** Global listeners to clear selection when appropriate */
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as EventTarget | null;

      // Ignore clicks on inputs/modals/menus
      if (isFormField(target) || isInsideModalOrPopup(target)) return;

      const insideTable = tableContainerRef.current?.contains(target as Node) ?? false;
      const onRow = isTableDataRow(target);

      // Outside table => clear
      if (!insideTable) {
        handleClear();
        return;
      }

      // Inside table but NOT on a data row (header/empty/pagination) => clear
      if (insideTable && !onRow) {
        handleClear();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClear();
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [handleClear]);

  /** Row selection checkbox handler */
  const handleCheckboxChange = (rowData: any) => {
    setSelectedRows(prev => {
      if (prev.includes(rowData)) return prev.filter(item => item !== rowData);
      return [...prev, rowData];
    });
  };

  const OpenConfirmDeleteModel = () => setOpenConfirmCancelModel(true);
  const CloseConfirmDeleteModel = () => setOpenConfirmCancelModel(false);

  /** Bulk cancel */
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

  /** Bulk submit */
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
      dispatch(notify('All submitted successfully'));
      refetchCon();
      setSelectedRows([]);
    } catch {
      dispatch(notify('One or more saves failed'));
    }
  };

  /** Add new record */
  const handelAddNew = () => {
    handleClear();
    setOpenDetailsModal(true);
    setEditing(false);
  };

  /** Table columns */
  const tableColumns = useMemo(
    () => [
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
        key: 'createdAt',
        dataKey: 'createdAt',
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
            (item: any) => item.referenceObjectKey === rowData.key
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
    ],
    [fetchPatintAttachmentsResponce, selectedRows]
  );

  const pageIndex = (listRequest.pageNumber ?? 1) - 1;
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
      <div ref={tableContainerRef}>
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
                  Cancel
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
      </div>

      {previewConsultation && (
        <PreviewConsultation
          consultation={previewConsultation}
          onClose={() => setPreviewConsultation(null)}
        />
      )}

      <CancellationModal
        title="Cancel Consultation"
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
