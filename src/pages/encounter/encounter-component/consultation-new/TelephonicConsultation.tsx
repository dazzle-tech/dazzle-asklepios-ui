import CancellationModal from '@/components/CancellationModal';
import ExpandableText from '@/components/ExpandMore/ExpandableText';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import { useAppDispatch, useAppSelector } from '@/hooks';
import EncounterAttachment from '@/pages/patient/patient-profile/tabs/Attachment-new/EncounterAttachment';
import {
  useCancelMutation,
  useFindAllByEncounterQuery,
  useFindNotCancelledByEncounterQuery
} from '@/services/patients/telephonicConsultationService';
import { useGetAllPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import { newTelephonicConsultation } from '@/types/model-types-constructor-new';
import { TelephonicConsultations } from '@/types/model-types-new';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BlockIcon from '@rsuite/icons/Block';
import clsx from 'clsx';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MdAttachFile, MdModeEdit } from 'react-icons/md';
import { useLocation } from 'react-router-dom';
import { Checkbox } from 'rsuite';
import DetailsTele from './DetailsTele';
import './styles.less';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import UserDateCell from '@/components/UserDateCell/UserDateCell';

const TelephonicConsultation = props => {
  const location = useLocation();
  const edit = props.edit ?? location.state?.edit ?? false;
  const currentPatient = props.patient || location.state?.patient;
  const currentEncounter = props.encounter || location.state?.encounter;
  const isEditMode = props.edit ?? location.state?.edit ?? false;
  const authSlice = useAppSelector(state => state.auth);
  const jobRole = String(authSlice.user?.jobRole ?? '').toUpperCase();
  const isNurse = jobRole === 'NURSE';
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const dispatch = useAppDispatch();

  const [cancelConsultation] = useCancelMutation();

  const [selectedConsultations, setSelectedConsultations] = useState<TelephonicConsultations[]>([]);
  const [showCancelled, setShowCancelled] = useState(false);
  const [activeConsultation, setActiveConsultation] = useState<TelephonicConsultations | null>(
    null
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const [consultationFormData, setConsultationFormData] = useState<TelephonicConsultations>({
    ...newTelephonicConsultation
  });

  const [page, setPage] = useState(0);
  const [size] = useState(20);

  const encounterIdStr = String(currentEncounter?.id ?? currentEncounter?.key ?? '');

  // ✅ استخدام الـ endpoints الجديدة
  const notCancelledQuery = useFindNotCancelledByEncounterQuery(
    { encounterId: encounterIdStr, page, size },
    { skip: !encounterIdStr || showCancelled }
  );

  const allQuery = useFindAllByEncounterQuery(
    { encounterId: encounterIdStr, page, size, includeCancelled: true },
    { skip: !encounterIdStr || !showCancelled }
  );

  const activeQuery = showCancelled ? allQuery : notCancelledQuery;
  const consultations: TelephonicConsultations[] = activeQuery.data?.data ?? [];
  const totalCount = activeQuery.data?.totalCount ?? 0;
  const isLoading = activeQuery.isLoading;

  const refetch = () => {
    if (!showCancelled) {
      notCancelledQuery.refetch();
    } else {
      allQuery.refetch();
    }
  };

  const { data: practitionerResponse } = useGetAllPractitionersQuery({
    page: 0,
    size: 9999,
    sort: 'id,asc'
  });

  const physicianList = practitionerResponse?.data?.filter(p => p.jobRole === 'PHYSICIAN') ?? [];

  const isFormField = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest(`
      input, textarea, select, button,
      .rs-input, .rs-picker, .rs-checkbox, .rs-btn,
      .rs-picker-toggle, .rs-calendar, .rs-dropdown
    `) !== null
    );
  };

  const isInsideModalOrPopup = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return node.closest('.rs-modal, .rs-picker-popup, .my-modal') !== null;
  };

  const isDataRow = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return node.closest('.rs-table-row') !== null && node.closest('.rs-table-row-header') === null;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'REQUESTED':
        return '#E6A100';
      case 'CONFIRMED':
        return '#0DAA41';
      case 'REJECTED':
        return '#D64545';
      case 'SUBMITTED':
        return '#0B5ED7';
      case 'READY':
        return '#17A2B8';
      case 'CANCELLED':
        return '#D64545';
      case 'NEW':
        return '#17A2B8';
      default:
        return '#6c757d';
    }
  };

  const clearRowSelection = useCallback(() => {
    setActiveConsultation(null);
    setSelectedConsultations([]);
  }, []);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target;
      if (isFormField(target) || isInsideModalOrPopup(target)) return;
      const insideTable = tableContainerRef.current?.contains(target as Node);
      const isRowClick = isDataRow(target);
      if (!insideTable) return clearRowSelection();
      if (insideTable && !isRowClick) return clearRowSelection();
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearRowSelection();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [clearRowSelection]);

  const getRowClassName = (row: TelephonicConsultations) =>
    activeConsultation?.id === row?.id ? 'selected-row' : '';

  const handleCheckboxChange = (rowData: TelephonicConsultations) => {
    setSelectedConsultations(prev =>
      prev.includes(rowData) ? prev.filter(item => item !== rowData) : [...prev, rowData]
    );
  };

  const handleCancelConsultations = async () => {
    if (!selectedConsultations.length) return;

    try {
      await Promise.all(
        selectedConsultations.map(item =>
          cancelConsultation({
            id: item.id,
            reason: consultationFormData?.cancellationReason ?? ''
          }).unwrap()
        )
      );

      dispatch(notify({ msg: 'Consultations cancelled successfully', sev: 'success' }));
      setSelectedConsultations([]);
      setIsCancelModalOpen(false);
      refetch();
    } catch {
      dispatch(notify({ msg: 'Cancel failed', sev: 'error' }));
    }
  };

  const columns = [
    {
      key: 'select',
      title: '#',
      flexGrow: 1,
      render: (rowData: TelephonicConsultations) => (
        <Checkbox
          checked={selectedConsultations.includes(rowData)}
          onChange={() => handleCheckboxChange(rowData)}
          disabled={rowData.status === 'CANCELLED'}
        />
      )
    },
    {
      key: 'practitionerId',
      title: 'Physician',
      flexGrow: 2,
      render: (row: TelephonicConsultations) => {
        const physician = physicianList.find(p => p.id === row.practitionerId);
        if (!physician) return <span>{row.practitionerId ?? ''}</span>;
        return <span>{`${physician.firstName} ${physician.lastName}`.trim()}</span>;
      }
    },
    {
      key: 'dateOfCall',
      title: 'Date Of Call',
      flexGrow: 2,
      render: (row: TelephonicConsultations) => {
        if (!row.dateOfCall) return '';

        const date = new Date(row.dateOfCall);

        return (
          <div>
            <div>{date.toLocaleDateString()}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {date.toLocaleTimeString()}
            </div>
          </div>
        );
      }
    },
    {
      key: 'consultationContent',
      title: 'Consultation Content',
      flexGrow: 4,
      render: (row: TelephonicConsultations) => (
        <ExpandableText text={row.consultationContent} lines={3} />
      )
    },
    {
      key: 'status',
      title: 'Status',
      flexGrow: 1,
      render: (rowData: TelephonicConsultations) => {
        const status = String(rowData.status ?? '').toUpperCase();
        return <MyBadgeStatus contant={formatEnumString(status)} color={getStatusColor(status)} />;
      }
    },
    {
      key: 'attachments',
      title: 'Attachments',
      flexGrow: 1,
      render: (row: TelephonicConsultations) => (
        <MdAttachFile
          size={20}
          fill={row?.id ? 'var(--primary-gray)' : '#ccc'}
          onClick={() => {
            if (row?.id) {
              setConsultationFormData(row);
              setIsAttachmentsModalOpen(true);
            }
          }}
          style={{ cursor: row?.id ? 'pointer' : 'not-allowed' }}
        />
      )
    },
    {
      key: 'edit',
      title: '',
      flexGrow: 1,
      render: (row: TelephonicConsultations) => {
        const status = String(row?.status ?? '').toUpperCase();
        const editDisabled = status === 'CANCELLED';

        return (
          <MdModeEdit
            size={22}
            fill={editDisabled ? '#ccc' : 'var(--primary-gray)'}
            title={editDisabled ? 'Edit not allowed for cancelled consultation' : 'Edit'}
            style={{
              opacity: edit ? 0.5 : 1,
              pointerEvents: edit ? 'none' : 'auto',
              cursor: edit ? 'not-allowed' : 'pointer',
            }}
            className={clsx({ 'not-allowed-cell': editDisabled })}
            onClick={() => {
              if (editDisabled) return;

              setActiveConsultation(row);
              setConsultationFormData(row);
              setIsDetailsModalOpen(true);
            }}
          />
        );
      }
    },
    {
      key: 'createdAt',
      title: 'CREATED BY/AT',
      expandable: true,
      render: (row: TelephonicConsultations) =>
        row?.createdBy || row?.createdDate ? (
          <UserDateCell
            login={row.createdBy}
            date={row.createdDate}
          />
        ) : (
          ' '
        )
    },
    {
      key: 'cancelledAt',
      title: 'CANCELLED BY/AT',
      expandable: true,
      render: (row: TelephonicConsultations) =>
        row?.cancelledBy || row?.cancelledAt ? (
          <UserDateCell
            login={row.cancelledBy}
            date={row.cancelledAt}
          />
        ) : (
          ' '
        )
    },
    {
      key: 'cancellationReason',
      title: 'Cancellation Reason',
      expandable: true,
      render: (row: TelephonicConsultations) => row.cancellationReason ?? ''
    }
  ];

  const handlePageChange = (_: any, newPage: number) => setPage(newPage);

  const tableButtons = (
    <div className="bt-div-2">
      <div className="bt-left-2">
        <MyButton
          prefixIcon={() => <BlockIcon />}
          onClick={() => setIsCancelModalOpen(true)}
          disabled={selectedConsultations.length === 0 || isNurse || edit}
        >
          Cancel
        </MyButton>

        <Checkbox className="show-cancelled" checked={showCancelled} onChange={() => setShowCancelled(prev => !prev)}>
          <Translate>Show Cancelled</Translate>
        </Checkbox>
      </div>

      <div className={clsx('bt-right-2')}>
        <MyButton
          disabled={isEditMode || isNurse}
          prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
          onClick={() => {
            setActiveConsultation(null);

            setConsultationFormData({
              ...newTelephonicConsultation,
              encounterId: currentEncounter?.id,
              patientId: currentPatient?.id,
              practitionerId: null
            });

            setIsDetailsModalOpen(true);
          }}
        >
          Add Consultation
        </MyButton>
      </div>
    </div>
  );

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <div ref={tableContainerRef}>
        <MyTable
          height={450}
          loading={isLoading}
          data={consultations}
          columns={columns}
          rowClassName={getRowClassName}
          page={page}
          rowsPerPage={size}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={() => {
            setPage(0);
          }}
          onRowClick={(row: TelephonicConsultations) => setActiveConsultation(row)}
          tableButtons={tableButtons}
        />
      </div>

      <DetailsTele
        patient={currentPatient}
        encounter={currentEncounter}
        consultationOrders={consultationFormData}
        open={isDetailsModalOpen}
        setOpen={setIsDetailsModalOpen}
        editing={String(consultationFormData?.status ?? '').toUpperCase() !== 'NEW'}
        edit={
          isEditMode || String(consultationFormData?.status ?? '').toUpperCase() === 'CANCELLED'
        }
        refetchCon={refetch}
      />

      <MyModal
        open={isAttachmentsModalOpen}
        setOpen={setIsAttachmentsModalOpen}
        title="Attachments - Telephonic Consultation"
        size="lg"
        hideActionBtn={true}
        content={
          <EncounterAttachment
            localEncounter={currentEncounter}
            source="TELEPHONIC_CONSULTATION_ORDER_ATTACHMENT"
            sourceId={consultationFormData?.id ? Number(consultationFormData.id) : undefined}
            refetchAttachmentList={false}
            setRefetchAttachmentList={() => { }}
          />
        }
      />

      <CancellationModal
        title="Cancel Telephonic Consultation"
        fieldLabel="Cancellation Reason"
        open={isCancelModalOpen}
        setOpen={setIsCancelModalOpen}
        object={consultationFormData}
        setObject={setConsultationFormData}
        handleCancle={handleCancelConsultations}
        fieldName="cancellationReason"
        required={true}
      />
    </div>
  );
};

export default TelephonicConsultation;
