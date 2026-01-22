import React, { useEffect, useRef, useState, useCallback } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import { MdModeEdit, MdAttachFile } from 'react-icons/md';
import { Checkbox, Loader } from 'rsuite';
import DetailsTele from './DetailsTele';
import MyModal from '@/components/MyModal/MyModal';
import EncounterAttachment from '@/pages/patient/patient-profile/tabs/Attachment-new/EncounterAttachment';
import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import BlockIcon from '@rsuite/icons/Block';
import { newTelephonicConsultation } from '@/types/model-types-constructor-new';
import { useLocation } from 'react-router-dom';
import CancellationModal from '@/components/CancellationModal';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { formatDateWithoutSeconds } from '@/utils';
import {
  useFindNotCancelledByEncounterQuery,
  useFindCancelledByEncounterQuery,
  useCancelMutation
} from '@/services/patients/telephonicConsultationService';
import { useGetPractitionersBulkMutation } from '@/services/setup/practitioner/PractitionerService';
import './styles.less';
import { Practitioner } from '@/types/model-types-new';

const TelephonicConsultation = props => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const edit = props.edit ?? location.state?.edit ?? false;

  const [pageIndex, setPageIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [showCanceled, setShowCanceled] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);

  const [consultationOrder, setConsultationOrder] = useState({
    ...newTelephonicConsultation
  });

  const [modalKey, setModalKey] = useState(0);

  const isSelected = row => (row?.id === selectedRow?.id ? 'selected-row' : '');

  const {
    data: notCancelledData,
    isLoading: loadingNotCancelled,
    refetch: refetchNotCancelled
  } = useFindNotCancelledByEncounterQuery(
    { encounterId: encounter?.key, page: pageIndex, size: rowsPerPage },
    { skip: showCanceled || !encounter?.key }
  );

  const {
    data: cancelledData,
    isLoading: loadingCancelled,
    refetch: refetchCancelled
  } = useFindCancelledByEncounterQuery(
    { encounterId: encounter?.key, page: pageIndex, size: rowsPerPage },
    { skip: !showCanceled || !encounter?.key }
  );

  const [cancelTeleConsultation] = useCancelMutation();

  const tableData = showCanceled ? cancelledData?.data : notCancelledData?.data;

  const totalCount = showCanceled
    ? cancelledData?.totalCount ?? 0
    : notCancelledData?.totalCount ?? 0;

  const isLoading = loadingNotCancelled || loadingCancelled;

  const [getPractitionersBulk] = useGetPractitionersBulkMutation();
  const [practitionersMap, setPractitionersMap] = useState<Record<number | string, Practitioner>>(
    {}
  );
  const [loadingPractitioners, setLoadingPractitioners] = useState(false);

  useEffect(() => {
    const loadPractitioners = async () => {
      const rows = tableData ?? [];

      if (!rows.length) {
        setPractitionersMap({});
        setLoadingPractitioners(false);
        return;
      }

      const uniqueIds = Array.from(
        new Set(
          rows
            .map(r => r.practitionerId)
            .filter((id): id is number | string => id !== null && id !== undefined)
        )
      );

      if (!uniqueIds.length) {
        setPractitionersMap({});
        setLoadingPractitioners(false);
        return;
      }

      setLoadingPractitioners(true);
      try {
        const practitioners = await getPractitionersBulk(uniqueIds).unwrap();
        const map = Object.fromEntries(practitioners.map(p => [p.id, p]));
        setPractitionersMap(map);
      } catch (e) {
        console.error('Bulk practitioner load failed', e);
        setPractitionersMap({});
      } finally {
        setLoadingPractitioners(false);
      }
    };

    loadPractitioners();
  }, [tableData, getPractitionersBulk]);

  const handleClearSelection = useCallback(() => {
    setSelectedRow(null);
  }, []);

  useEffect(() => {
    const handlePointer = (e: PointerEvent) => {
      if (openCancelModal || openModal || attachmentsModalOpen) return;

      const target = e.target as HTMLElement;
      if (!tableContainerRef.current?.contains(target)) {
        handleClearSelection();
      }
    };

    document.addEventListener('pointerdown', handlePointer, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointer, true);
    };
  }, [handleClearSelection, openCancelModal, openModal, attachmentsModalOpen]);

  const handleCancel = async () => {
    if (!selectedRow) return;

    try {
      await cancelTeleConsultation({
        id: selectedRow.id,
        reason: consultationOrder?.cancellationReason,
        cancelledBy: user?.id
      }).unwrap();

      dispatch(notify('Consultation cancelled'));
      setSelectedRow(null);
      setOpenCancelModal(false);

      if (showCanceled) {
        refetchCancelled();
      } else {
        refetchNotCancelled();
      }
    } catch {
      dispatch(notify('Cancel failed'));
    }
  };

  const handleRefetchData = () => {
    if (showCanceled) {
      refetchCancelled();
    } else {
      refetchNotCancelled();
    }
  };

  const columns = [
    {
      key: 'practitionerId',
      title: 'Physician',
      flexGrow: 2,
      render: row => {
        const p = practitionersMap[row.practitionerId];

        if (loadingPractitioners) return <Loader size="sm" />;
        if (!p) return '-';

        return `${p.firstName} ${p.lastName ?? ''}`.trim();
      }
    },
    {
      key: 'dateOfCall',
      title: 'Date Of Call',
      flexGrow: 2,
      render: row => (row.dateOfCall ? new Date(row.dateOfCall).toLocaleString() : '')
    },
    {
      key: 'consultationContent',
      title: 'Consultation Content',
      flexGrow: 4
    },
    {
      key: 'attachments',
      title: 'Attachments',
      flexGrow: 1,
      render: row => (
        <MdAttachFile
          size={20}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setConsultationOrder(row);
            setAttachmentsModalOpen(true);
          }}
        />
      )
    },
    {
      key: 'edit',
      title: '',
      flexGrow: 1,
      render: row => (
        <MdModeEdit
          size={22}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setConsultationOrder(row);
            setSelectedRow(row);
            setModalKey(prev => prev + 1);
            setOpenModal(true);
          }}
        />
      )
    },
    {
      key: 'createdDate',
      title: 'CREATED BY/AT',
      expandable: true,
      render: row =>
        row.createdDate && (
          <>
            {row.createdBy}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.createdDate)}</span>
          </>
        )
    },
    {
      key: 'cancelledAt',
      title: 'CANCELLED BY/AT',
      expandable: true,
      render: row =>
        row.cancelledAt && (
          <>
            {row.cancelledBy}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.cancelledAt)}</span>
          </>
        )
    },
    {
      key: 'cancellationReason',
      title: 'Cancellation Reason',
      expandable: true
    }
  ];

  const tableButtons = (
    <div className="bt-div-2">
      <div className="bt-left-2">
        <MyButton
          prefixIcon={() => <BlockIcon />}
          onClick={() => {
            if (!selectedRow) return;
            setConsultationOrder(selectedRow);
            setOpenCancelModal(true);
          }}
          disabled={!selectedRow || showCanceled}
        >
          Cancel
        </MyButton>

        <Checkbox checked={showCanceled} onChange={() => setShowCanceled(v => !v)}>
          Show Cancelled
        </Checkbox>
      </div>

      <div className={clsx('bt-right-2', { 'disabled-panel': edit })}>
        <MyButton
          prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
          onClick={() => {
            setConsultationOrder({
              ...newTelephonicConsultation,
              patientId: patient?.key,
              encounterId: encounter?.key
            });
            setModalKey(prev => prev + 1);
            setOpenModal(true);
          }}
        >
          Add Consultation
        </MyButton>
      </div>
    </div>
  );

  return (
    <div ref={tableContainerRef}>
      <MyTable
        height={450}
        loading={isLoading}
        data={tableData}
        columns={columns}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={(_, p) => setPageIndex(p)}
        onRowsPerPageChange={e => {
          setRowsPerPage(Number(e.target.value));
          setPageIndex(0);
        }}
        onRowClick={row => setSelectedRow(row)}
        rowClassName={isSelected}
        tableButtons={tableButtons}
      />

      <DetailsTele
        key={modalKey}
        patient={patient}
        encounter={encounter}
        consultationOrders={consultationOrder}
        setConsultationOrder={setConsultationOrder}
        open={openModal}
        setOpen={setOpenModal}
        refetchCon={handleRefetchData}
        editing={false}
        edit={false}
      />

      <MyModal
        open={attachmentsModalOpen}
        setOpen={setAttachmentsModalOpen}
        title="Attachments - Telephonic Consultation"
        size="lg"
        hideActionBtn
        content={
          <EncounterAttachment
            localEncounter={encounter}
            source="TELEPHONIC_CONSULTATION_ORDER_ATTACHMENT"
            sourceId={consultationOrder?.id}
          />
        }
      />

      <CancellationModal
        title="Cancel Telephonic Consultation"
        fieldLabel="Cancellation Reason"
        open={openCancelModal}
        setOpen={setOpenCancelModal}
        object={consultationOrder}
        setObject={setConsultationOrder}
        handleCancle={handleCancel}
        fieldName="cancellationReason"
        required
      />
    </div>
  );
};

export default TelephonicConsultation;
