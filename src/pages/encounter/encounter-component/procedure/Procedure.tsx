import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaBedPulse, FaFileArrowDown } from 'react-icons/fa6';
import { MdAttachFile, MdModeEdit } from 'react-icons/md';
import { Checkbox, HStack } from 'rsuite';
import './styles.less';
import PreviewProcedure from './PreviewProcedure';
import { useGetPatientAttachmentsListQuery } from '@/services/attachmentService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';

import AttachmentUploadModal from '@/components/AttachmentUploadModal';
import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import { useSaveProceduresMutation, useGetProceduresQuery } from '@/services/procedureService';

import { newApProcedure } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { formatDateWithoutSeconds } from '@/utils';
import BlockIcon from '@rsuite/icons/Block';
import { useLocation } from 'react-router-dom';
import Details from './Details';
import Perform from './Perform';

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

const Referrals = (props: any) => {
  const location = useLocation();

  /** Container that wraps ONLY the table; we use it to detect inside/outside clicks */
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const [showPreview, setShowPreview] = useState(false);
  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const edit = props.edit ?? location.state?.edit ?? false;

  const dispatch = useAppDispatch();
  const [showCanceled, setShowCanceled] = useState(true);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [openPerformModal, setOpenPerformModal] = useState(false);
    const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
  const [indicationsDescription, setindicationsDescription] = useState<string>('');

  const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);

  /** Current procedure record */
  const [procedure, setProcedure] = useState<any>({
    ...newApProcedure,
    encounterKey: encounter?.key,
    patientKey: patient?.key,
    currentDepartment: true
  });

  /** LOVs */
  const { data: CategoryLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');

  /** Highlight selected row in the table */
  const isSelected = (rowData: any) =>
    rowData && procedure && rowData.key === procedure.key ? 'selected-row' : '';

  /** Mutations/Queries */
  const [saveProcedures] = useSaveProceduresMutation();

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      { fieldName: 'encounter_key', operator: 'match', value: encounter?.key },
      {
        fieldName: 'status_lkey',
        operator: showCanceled ? 'notMatch' : 'match',
        value: '3621690096636149'
      } // cancelled code
    ]
  });

  const {
    data: procedures,
    refetch: proRefetch,
    isLoading: procedureLoding
  } = useGetProceduresQuery(listRequest);

  const [attachmentsListRequest, setAttachmentsListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
      { fieldName: 'attachment_type', operator: 'match', value: 'PROCEDURE' }
    ]
  });

  const { data: fetchPatintAttachmentsResponce, refetch: attachmentRefetch } =
    useGetPatientAttachmentsListQuery(attachmentsListRequest);

  /** Utility: is the event target within form-ish/editable elements? */
  const isFormField = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest(
        `
      input, textarea, select, button, [contenteditable="true"],
      .rs-input, .rs-picker, .rs-checkbox, .rs-btn, .rs-datepicker,
      .rs-picker-toggle, .rs-calendar, .rs-dropdown, .rs-auto-complete,
      .rs-input-group, .rs-select, .rs-slider
    `
      ) !== null
    );
  };

  /** Utility: ignore clicks inside modals/popups/menus */
  const isInsideModalOrPopup = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest(
        `
      .rs-modal, .rs-drawer, .rs-picker-select-menu, .rs-picker-popup,
      .my-modal, .my-popup
    `
      ) !== null
    );
  };

  /** Utility: detect if target is on a real data row (support RSuite/MUI/custom) */
  const isTableDataRow = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest('.rs-table-row, .MuiTableRow-root, [data-row="true"], [role="row"]') !== null &&
      // exclude header rows if library marks them similarly
      node.closest('.rs-table-row-header, .MuiTableHead-root, [data-header="true"]') === null
    );
  };

  /** Clear current selection and reset a fresh procedure */
  const handleClear = useCallback(() => {
    setProcedure({
      ...newApProcedure,
      encounterKey: encounter?.key,
      patientKey: patient?.key,
      currentDepartment: true,
      statusLkey: '3621653475992516', // default active/in-progress
      indications: '', // set empty; change to indicationsDescription if needed
      bodyPartLkey: null,
      sideLkey: null,
      faciltyLkey: null,
      priorityLkey: null,
      procedureLevelLkey: null,
      departmentKey: null,
      categoryKey: null,
      procedureNameKey: null
    });
    setShowPreview(false);
    setEditing(false);
  }, [encounter?.key, patient?.key]);

  /** Refresh attachments list filters when modal closes/opens */
  useEffect(() => {
    if (!attachmentsModalOpen) {
      const updatedFilters = [
        { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
        { fieldName: 'attachment_type', operator: 'match', value: 'PROCEDURE' }
      ];
      setAttachmentsListRequest(prev => ({ ...prev, filters: updatedFilters }));
    }
    attachmentRefetch();
  }, [attachmentsModalOpen, attachmentRefetch]);

  /** Toggle cancelled filter */
  useEffect(() => {
    const updatedFilters = [
      { fieldName: 'encounter_key', operator: 'match', value: encounter?.key },
      {
        fieldName: 'status_lkey',
        operator: showCanceled ? 'notMatch' : 'match',
        value: '3621690096636149'
      }
    ];
    setListRequest(prev => ({ ...prev, filters: updatedFilters }));
  }, [showCanceled, encounter?.key]);

  /** Scope attachments to current procedure when modal closes/opens */
  useEffect(() => {
    if (!attachmentsModalOpen) {
      const updatedFilters = [
        { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
        { fieldName: 'reference_object_key', operator: 'match', value: procedure?.key }
      ];
      setAttachmentsListRequest(prev => ({ ...prev, filters: updatedFilters }));
    }
  }, [attachmentsModalOpen, procedure?.key]);

  /**
   * Global listeners:
   * - Click outside table => clear
   * - Click inside table BUT NOT on a data row => clear
   * - Press ESC => clear
   */
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as EventTarget | null;

      // Ignore clicks on inputs/modals/menus
      if (isFormField(target) || isInsideModalOrPopup(target)) return;

      const insideTable = tableContainerRef.current?.contains(target as Node) ?? false;
      const onRow = isTableDataRow(target);

      // If outside table => clear
      if (!insideTable) {
        handleClear();
        return;
      }

      // If inside table but NOT on a data row => clear (header, empty area, pagination, etc.)
      if (insideTable && !onRow) {
        handleClear();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClear();
    };

    // Use capture to run before inner handlers
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [handleClear]);

  /** Open "Perform" modal */
  const OpenPerformModel = () => setOpenPerformModal(true);

  /** Save procedure */
  const handleSave = async () => {
    try {
      await saveProcedures({
        ...procedure,
        statusLkey: '3621653475992516',
        indications: indicationsDescription,
        encounterKey: encounter?.key,
        patientKey: patient?.key
      })
        .unwrap()
        .then(() => {
          proRefetch();
        });
      handleClear();
      dispatch(notify('Saved successfully'));
    } catch (error) {
      dispatch(notify('Save failed'));
    }
  };

  /** Close cancellation modal */
  const CloseCancellationReasonModel = () => setOpenCancellationReasonModel(false);

  /** Cancel (soft-delete) procedure */
  const handleCancle = async () => {
    try {
      await saveProcedures({
        ...procedure,
        statusLkey: '3621690096636149', // cancelled
        deletedAt: Date.now()
      })
        .unwrap()
        .then(() => {
          proRefetch();
        });

      dispatch(notify({ msg: 'Procedure deleted successfully', sev: 'success' }));
      CloseCancellationReasonModel();
    } catch (error) {
      dispatch(notify({ msg: 'Delete failed', sev: 'error' }));
    }
  };

  /** Add new procedure: clear then open details modal */
  const handelAddNew = () => {
    handleClear();
    setOpenDetailsModal(true);
  };

  /** Table columns (memoized to avoid re-creating on each render) */
  const tableColumns = useMemo(
    () => [
      {
        key: 'procedureId',
        dataKey: 'procedureId',
        title: <Translate>PROCEDURE ID</Translate>,
        flexGrow: 1,
        render: (rowData: any) => rowData?.procedureId ?? ''
      },
      {
        key: 'procedureName',
        dataKey: 'procedureName',
        title: <Translate>Procedure Name</Translate>,
        flexGrow: 1
      },
      {
        key: 'scheduledDateTime',
        dataKey: 'scheduledDateTime',
        title: <Translate>SCHEDULED DATE TIME</Translate>,
        flexGrow: 1,
        render: (rowData: any) =>
          rowData?.scheduledDateTime ? formatDateWithoutSeconds(rowData.scheduledDateTime) : ' '
      },
      {
        key: 'categoryKey',
        dataKey: 'categoryKey',
        title: <Translate>CATEGORY</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          const category = CategoryLovQueryResponse?.object?.find(
            (item: any) => item.key === rowData?.categoryKey
          );
          return category?.lovDisplayVale || ' ';
        }
      },
      {
        key: 'priorityLkey',
        dataKey: 'priorityLkey',
        title: <Translate>PRIORITY</Translate>,
        flexGrow: 1,
        render: (rowData: any) =>
          rowData?.priorityLvalue?.lovDisplayVale ?? rowData?.priorityLkey ?? ''
      },
      {
        key: 'procedureLevelLkey',
        dataKey: 'procedureLevelLkey',
        title: <Translate>LEVEL</Translate>,
        flexGrow: 1,
        render: (rowData: any) =>
          rowData?.procedureLevelLvalue?.lovDisplayVale ?? rowData?.procedureLevelLkey ?? ''
      },
      {
        key: 'indications',
        dataKey: 'indications',
        title: <Translate>INDICATIONS</Translate>,
        flexGrow: 1
      },
      {
        key: 'statusLkey',
        dataKey: 'statusLkey',
        title: <Translate>STATUS</Translate>,
        flexGrow: 1,
        render: (rowData: any) => rowData?.statusLvalue?.lovDisplayVale ?? rowData?.statusLkey ?? ''
      },
      {
        key: 'attachments',
        dataKey: '',
        title: <Translate>ATTACHED FILE</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          const matchingAttachments = fetchPatintAttachmentsResponce?.object?.filter(
            (item: any) => item.referenceObjectKey === rowData?.key
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
        key: 'perform',
        dataKey: '',
        title: <Translate>PERFORM</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          const isDisabled = !rowData?.currentDepartment;
          return (
            <FaBedPulse
              size={22}
              fill={isDisabled ? '#ccc' : 'var(--primary-gray)'}
              style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
              onClick={!isDisabled ? OpenPerformModel : undefined}
            />
          );
        }
      },
      {
        key: 'edit',
        dataKey: '',
        title: <Translate>EDIT</Translate>,
        flexGrow: 1,
        render: () => (
          <MdModeEdit
            size={24}
            fill="var(--primary-gray)"
            onClick={() => setOpenDetailsModal(true)}
          />
        )
      },
      {
        key: 'created',
        title: <Translate>CREATED AT/BY</Translate>,
        expandable: true,
        render: (rowData: any) => (
          <>
            <span>{rowData?.createdBy ?? ''}</span>
            <br />
            <span className="date-table-style">
              {rowData?.createdAt ? formatDateWithoutSeconds(rowData.createdAt) : ''}
            </span>
          </>
        )
      },
      {
        key: 'updated',
        title: <Translate>UPDATED AT/BY</Translate>,
        expandable: true,
        render: (rowData: any) => (
          <>
            <span>{rowData?.updatedBy ?? ''}</span>
            <br />
            <span className="date-table-style">
              {rowData?.updatedAt ? formatDateWithoutSeconds(rowData.updatedAt) : ''}
            </span>
          </>
        )
      },
      {
        key: 'cancelled',
        title: <Translate>CANCELLED AT/BY</Translate>,
        expandable: true,
        render: (rowData: any) => (
          <>
            <span>{rowData?.deletedBy ?? ''}</span>
            <br />
            <span className="date-table-style">
              {rowData?.deletedAt ? formatDateWithoutSeconds(rowData.deletedAt) : ''}
            </span>
          </>
        )
      },
      {
        key: 'cancellationReason',
        dataKey: 'cancellationReason',
        title: <Translate>CANCELLATION REASON</Translate>,
        flexGrow: 1,
        expandable: true
      }
    ],
    [CategoryLovQueryResponse, fetchPatintAttachmentsResponce]
  );

  const pageIndex = (listRequest.pageNumber ?? 1) - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = procedures?.extraNumeric ?? 0;

  /** Pagination handlers */
  const handlePageChange = (_: unknown, newPage: number) => {
    setListRequest(prev => ({ ...prev, pageNumber: newPage + 1 }));
  };
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest(prev => ({
      ...prev,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    }));
  };

  return (
    <>
      <div ref={tableContainerRef}>
        <MyTable
          columns={tableColumns}
          data={procedures?.object ?? []}
          onRowClick={rowData => {
            setProcedure(rowData);
            setEditing(rowData?.statusLkey === '3621690096636149' ? true : false); // cancelled => editing disabled
            setShowPreview(true);
          }}
          loading={procedureLoding}
          rowClassName={isSelected}
          sortColumn={listRequest.sortBy}
          sortType={listRequest.sortType}
          onSortChange={(sortBy, sortType) =>
            setListRequest(prev => ({ ...prev, sortBy, sortType }))
          }
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          tableButtons={
            <div className="bt-div-2">
              <div className="bt-left-2">
                <MyButton
                  onClick={() => setOpenCancellationReasonModel(true)}
                  disabled={
                    edit
                      ? true
                      : procedure?.key
                      ? (procedure?.statusLvalue?.lovCode ?? '') === 'PROC_CANCL'
                      : true
                  }
                  prefixIcon={() => <BlockIcon />}
                >
                  Cancel
                </MyButton>
                <Checkbox
                  checked={!showCanceled}
                  onChange={() => {
                    setShowCanceled(!showCanceled);
                    if (showCanceled === false) setEditing(true);
                  }}
                >
                  Show Cancelled
                </Checkbox>
              </div>

              <div className="bt-right-2">
                <MyButton disabled={edit} onClick={handelAddNew}>
                  Add Procedure
                </MyButton>
              </div>
            </div>
          }
        />
      </div>

      {showPreview && (
        <div className="preview-section">
          <PreviewProcedure procedure={procedure} encounter={encounter} patient={patient} />
        </div>
      )}

      <MyModal
        open={openPerformModal}
        setOpen={setOpenPerformModal}
        title="Perform Details"
        actionButtonFunction={handleSave}
        size="full"
        content={
          <Perform
            proRefetch={proRefetch}
            encounter={encounter}
            patient={patient}
            procedure={procedure}
            setProcedure={setProcedure}
            edit={edit}
          />
        }
      />

      <Details
        patient={patient}
        proRefetch={proRefetch}
        encounter={encounter}
        edit={edit}
        procedure={procedure}
        setProcedure={setProcedure}
        openDetailsModal={openDetailsModal}
        setOpenDetailsModal={setOpenDetailsModal}
      />

      <CancellationModal
        open={openCancellationReasonModel}
        setOpen={setOpenCancellationReasonModel}
        fieldName="cancellationReason"
        fieldLabel="Cancellation Reason"
        title="Cancellation"
        object={procedure}
        setObject={setProcedure}
        handleCancle={handleCancle}
      />

      <AttachmentUploadModal
        isOpen={attachmentsModalOpen}
        setIsOpen={setAttachmentsModalOpen}
        actionType={'add'}
        refecthData={attachmentRefetch}
        attachmentSource={procedure}
        attatchmentType="PROCEDURE"
        patientKey={patient?.key}
      />
    </>
  );
};

export default Referrals;
