import React, { useEffect, useRef, useState, useCallback } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import { MdModeEdit, MdAttachFile } from 'react-icons/md';
import { Checkbox, Loader, Form } from 'rsuite';
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
  useFindAllByEncounterQuery,
  useCancelMutation
} from '@/services/patients/telephonicConsultationService';
import { useGetPractitionersBulkMutation } from '@/services/setup/practitioner/PractitionerService';
import MyInput from '@/components/MyInput';
import './styles.less';
import { Practitioner } from '@/types/model-types-new';

const handleCancelError = (err: any, dispatch: any) => {
  const data = err?.data ?? err ?? {};

  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const lines = data.fieldErrors.map((fe: any) => {
      if (fe.field === 'reason') {
        return '• Cancellation Reason: is required';
      }
      return `• ${fe.field}: ${fe.message}`;
    });

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${lines.join('\n')}`,
        sev: 'error'
      })
    );
    return;
  }

  dispatch(
    notify({
      msg: data?.message || 'Cancel failed',
      sev: 'error'
    })
  );
};

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

  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    const onlyDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return {
      fromDate: onlyDate,
      toDate: onlyDate
    };
  });

  const isSelected = row => (row?.id === selectedRow?.id ? 'selected-row' : '');

  const toInstantStartOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).toISOString();

  const toInstantEndOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).toISOString();

  const buildQueryParams = () => {
    const params: any = {
      encounterId: encounter?.key,
      page: pageIndex,
      size: rowsPerPage,
      includeCancelled: showCanceled
    };

    if (dateFilter.fromDate) {
      params.fromDate = toInstantStartOfDay(dateFilter.fromDate);
    }

    if (dateFilter.toDate) {
      params.toDate = toInstantEndOfDay(dateFilter.toDate);
    }

    return params;
  };

  const { data, isLoading, refetch } = useFindAllByEncounterQuery(buildQueryParams(), {
    skip: !encounter?.key
  });

  const [cancelTeleConsultation] = useCancelMutation();

  const tableData = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;

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

      refetch();
    } catch (err: any) {
      handleCancelError(err, dispatch);
    }
  };

  const handleRefetchData = () => {
    refetch();
  };

  const handleClearFilters = () => {
    setDateFilter({
      fromDate: null,
      toDate: null
    });
    setPageIndex(0);
  };

  useEffect(() => {
    setPageIndex(0);
    handleRefetchData();
  }, [dateFilter.fromDate, dateFilter.toDate]);

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
          className='edit-pointer'
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
          className='edit-pointer'
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

  const filters = () => {
    return (
      <Form layout="inline" fluid className="date-filter-form">
        <MyInput
          column
          width={180}
          fieldType="date"
          fieldLabel="From Date"
          fieldName="fromDate"
          record={dateFilter}
          setRecord={setDateFilter}
        />
        <MyInput
          width={180}
          column
          fieldType="date"
          fieldLabel="To Date"
          fieldName="toDate"
          record={dateFilter}
          setRecord={setDateFilter}
        />
        <div className="margin-15">
          <MyButton onClick={handleClearFilters}>Clear</MyButton>
        </div>
      </Form>
    );
  };

  const isCancelled = selectedRow?.cancelledAt != null;

  const tableButtons = (
    <div className="bt-div-2">
      <div className="bt-left-2">
        <MyButton
          prefixIcon={() => <BlockIcon />}
          onClick={() => {
            if (!selectedRow || isCancelled) return;
            setConsultationOrder(selectedRow);
            setOpenCancelModal(true);
          }}
          disabled={!selectedRow || isCancelled}
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
        filters={filters()}
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
