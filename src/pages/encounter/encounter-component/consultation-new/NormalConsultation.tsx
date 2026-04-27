import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Checkbox, Loader, Form, Tooltip, Whisper } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faPlus } from '@fortawesome/free-solid-svg-icons';
import { MdAttachFile, MdModeEdit } from 'react-icons/md';
import clsx from 'clsx';

import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import CancellationModal from '@/components/CancellationModal';
import MyModal from '@/components/MyModal/MyModal';
import EncounterAttachment from '@/pages/patient/patient-profile/tabs/Attachment-new/EncounterAttachment';
import MyInput from '@/components/MyInput';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { conjureValueBasedOnIDFromList, formatEnumString, formatDateWithoutSeconds } from '@/utils';

import {
  useCancelMutation,
  useGetDepartmentIdsByEncounterQuery,
  useGetPractitionerIdsByEncounterQuery,
  useFindByEncounterAllQuery,
  useFindByEncounterNotCancelledQuery,
  useFindByEncounterWithDateRangeQuery,
  useFindByEncounterWithDateRangeNotCancelledQuery
} from '@/services/consultation/consultationService';

import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useLazyGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { newConsultation } from '@/types/model-types-constructor-new';
import { Consultation } from '@/types/model-types-new';
import { useGetDepartmentsBulkMutation } from '@/services/security/departmentService';
import { useGetPractitionersBulkMutation } from '@/services/setup/practitioner/PractitionerService';
import Details from './Details';
import './styles.less';
import PreviewConsultation from './PreviewConsultation';

// ─── Helpers ────────────────────────────────────────────────────────────────

const toISOStartOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
};

const toISOEndOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
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

// ─── Component ───────────────────────────────────────────────────────────────

const NormalConsultation = props => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const edit = props.edit ?? location.state?.edit ?? false;
  const authSlice = useAppSelector(state => state.auth);
  const jobRole = String(authSlice.user?.jobRole ?? '').toUpperCase();
   const isNurse = jobRole === 'NURSE';
  const [selectedRows, setSelectedRows] = useState<Consultation[]>([]);
  const [selectedRow, setSelectedRow] = useState<Consultation | null>(null);
  const [showCanceled, setShowCanceled] = useState(false);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [openDetailsMdal, setOpenDetailsModal] = useState(false);
  const [openConfirmCancelModel, setOpenConfirmCancelModel] = useState(false);

  const [previewConsultation, setPreviewConsultation] = useState<Consultation | null>(null);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const [consultation, setConsultation] = useState<Consultation>({
    ...newConsultation,
    patientId: patient?.id,
    encounterId: encounter?.id
  });

  const [modalKey, setModalKey] = useState(0);

  const [dateFilter, setDateFilter] = useState<{
    fromDate: Date | null;
    toDate: Date | null;
  }>(() => {
    const today = new Date();
    const onlyDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return { fromDate: onlyDate, toDate: onlyDate };
  });

  const { data: facilityListResponse, isLoading: facilitiesLoading } =
    useGetAllFacilitiesQuery(null);
  const [getDepartmentsByFacility, { data: departmentListResponse }] =
    useLazyGetActiveDepartmentByFacilityListQuery();

  const [cancelConsultation] = useCancelMutation();

  const encounterIdStr = String(encounter?.id ?? encounter?.key ?? '');

  const { data: departmentIds, isLoading: departmentIdsLoading } =
    useGetDepartmentIdsByEncounterQuery({ encounterId: encounterIdStr }, { skip: !encounterIdStr });

  const { data: practitionerIds, isLoading: practitionerIdsLoading } =
    useGetPractitionerIdsByEncounterQuery(
      { encounterId: encounterIdStr },
      { skip: !encounterIdStr }
    );

  const [getDepartmentsBulk, { data: departmentsBulk, isLoading: departmentsBulkLoading }] =
    useGetDepartmentsBulkMutation();
  const [getPractitionersBulk, { data: practitionersBulk, isLoading: practitionersBulkLoading }] =
    useGetPractitionersBulkMutation();

  useEffect(() => {
    if (Array.isArray(departmentIds) && departmentIds.length > 0) {
      getDepartmentsBulk(departmentIds)
        .unwrap()
        .catch(() => {});
    }
  }, [departmentIds, getDepartmentsBulk]);

  useEffect(() => {
    if (Array.isArray(practitionerIds) && practitionerIds.length > 0) {
      getPractitionersBulk(practitionerIds)
        .unwrap()
        .catch(() => {});
    }
  }, [practitionerIds, getPractitionersBulk]);

  const hasDateRange = !!dateFilter.fromDate && !!dateFilter.toDate;

  const allQuery = useFindByEncounterAllQuery(
    { encounterId: encounterIdStr, page, size },
    { skip: !encounterIdStr || !showCanceled || hasDateRange }
  );

  const notCancelledQuery = useFindByEncounterNotCancelledQuery(
    { encounterId: encounterIdStr, page, size },
    { skip: !encounterIdStr || showCanceled || hasDateRange }
  );

  const dateRangeQuery = useFindByEncounterWithDateRangeQuery(
    {
      encounterId: encounterIdStr,
      fromDate: toISOStartOfDay(dateFilter.fromDate!),
      toDate: toISOEndOfDay(dateFilter.toDate!),
      page,
      size
    },
    { skip: !encounterIdStr || !hasDateRange || !showCanceled }
  );

  const dateRangeNotCancelledQuery = useFindByEncounterWithDateRangeNotCancelledQuery(
    {
      encounterId: encounterIdStr,
      fromDate: toISOStartOfDay(dateFilter.fromDate!),
      toDate: toISOEndOfDay(dateFilter.toDate!),
      page,
      size
    },
    { skip: !encounterIdStr || !hasDateRange || showCanceled }
  );

  const consultationData = hasDateRange
    ? showCanceled
      ? dateRangeQuery.data
      : dateRangeNotCancelledQuery.data
    : showCanceled
    ? allQuery.data
    : notCancelledQuery.data;

  const consultationLoading =
    allQuery.isLoading ||
    notCancelledQuery.isLoading ||
    dateRangeQuery.isLoading ||
    dateRangeNotCancelledQuery.isLoading;

  const refetch = () => {
    allQuery.refetch();
    notCancelledQuery.refetch();
    dateRangeQuery.refetch();
    dateRangeNotCancelledQuery.refetch();
  };

  const rows: Consultation[] = consultationData?.data ?? [];
  const totalCount = consultationData?.totalCount ?? 0;
  const isLoading = consultationLoading;

  const sortedRows = useMemo(() => {
    return [...rows].sort((first, second) => {
      const firstTime = first.createdDate ? new Date(first.createdDate).getTime() : -Infinity;
      const secondTime = second.createdDate ? new Date(second.createdDate).getTime() : -Infinity;
      return secondTime - firstTime;
    });
  }, [rows]);

  const isFacilitiesDataLoading = facilitiesLoading;
  const isTargetsDataLoading =
    departmentIdsLoading ||
    practitionerIdsLoading ||
    departmentsBulkLoading ||
    practitionersBulkLoading;

  const handleRefetchData = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleClear = useCallback(() => {
    setConsultation({
      ...newConsultation,
      patientId: patient?.id,
      encounterId: encounter?.id
    });
    setSelectedRows([]);
    setSelectedRow(null);
    setPreviewConsultation(null);
    setEditing(false);
  }, [patient?.id, patient?.key, encounter?.id, encounter?.key]);

  const handleClearSelection = useCallback(() => {
    setSelectedRow(null);
    setSelectedRows([]);
  }, []);

  const handleClearFilters = () => {
    setDateFilter({ fromDate: null, toDate: null });
    setPage(0);
  };

  useEffect(() => {
    setPage(0);
  }, [dateFilter.fromDate, dateFilter.toDate, showCanceled]);

  useEffect(() => {
    const handlePointer = (e: PointerEvent) => {
      if (openConfirmCancelModel || openDetailsMdal || attachmentsModalOpen) return;
      const target = e.target as HTMLElement;
      if (!tableContainerRef.current?.contains(target)) {
        handleClearSelection();
      }
    };

    document.addEventListener('pointerdown', handlePointer, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointer, true);
    };
  }, [handleClearSelection, openConfirmCancelModel, openDetailsMdal, attachmentsModalOpen]);

  const handleCancel = async () => {
    if (!selectedRow?.id) return;

    try {
      await cancelConsultation({
        id: selectedRow.id,
        cancellationReason: consultation?.cancellationReason ?? ''
      }).unwrap();

      dispatch(notify({ msg: 'Cancelled successfully', sev: 'success' }));
      setSelectedRow(null);
      setSelectedRows([]);
      setOpenConfirmCancelModel(false);
      handleRefetchData();
    } catch {
      dispatch(notify({ msg: 'Cancel failed', sev: 'warning' }));
      setOpenConfirmCancelModel(false);
    }
  };

  const isSelected = (row: Consultation) => (row?.id === selectedRow?.id ? 'selected-row' : '');

  useEffect(() => {
    if (selectedRow?.toFacilityId) {
      getDepartmentsByFacility({ facilityId: selectedRow.toFacilityId });
    }
  }, [selectedRow?.toFacilityId, getDepartmentsByFacility]);

  const tableColumns = useMemo(
    () => [
      {
        key: 'consultationNumber',
        title: <Translate>CONSULTATION NUMBER</Translate>,
        flexGrow: 1
      },
      {
        key: 'toFacilityId',
        title: <Translate>TO FACILITY</Translate>,
        flexGrow: 1,
        render: rowData => {
          if (isFacilitiesDataLoading) return <Loader size="xs" />;
          return (
            <span>
              {conjureValueBasedOnIDFromList(
                facilityListResponse ?? [],
                rowData.toFacilityId,
                'name'
              )}
            </span>
          );
        }
      },
      {
        key: 'destinationType',
        title: <Translate>DESTINATION TYPE</Translate>,
        flexGrow: 1,
        render: (rowData: Consultation) => (
          <span>{formatEnumString(String(rowData.destinationType ?? ''))}</span>
        )
      },
      {
        key: 'created',
        title: <Translate>Created By / At</Translate>,
        expandable: true,
        flexGrow: 2,
        render: (rowData: Consultation) => (
          <>
            {rowData.createdBy ?? ''}
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(rowData.createdDate)}
            </span>
          </>
        )
      },
      {
        key: 'target',
        title: <Translate>CONSULTATION TARGET</Translate>,
        flexGrow: 1,
        render: (rowData: Consultation) => {
          if (isTargetsDataLoading) return <Loader size="xs" />;

          const destType = String(rowData.destinationType ?? '').toUpperCase();

          if (destType === 'DEPARTMENT') {
            return (
              <span>
                {conjureValueBasedOnIDFromList(
                  departmentsBulk ?? [],
                  rowData.toDepartmentId,
                  'name'
                )}
              </span>
            );
          }

          if (destType === 'CONSULTANT') {
            const id = String(rowData.practitionerId ?? '');
            const record = (practitionersBulk ?? []).find(r => String(r.id) === id);
            if (!record) return <span>{rowData.practitionerId ?? ''}</span>;
            const full = `${String(record.firstName ?? '').trim()} ${String(
              record.lastName ?? ''
            ).trim()}`.trim();
            return <span>{full || rowData.practitionerId}</span>;
          }

          return <span></span>;
        }
      },
      {
        key: 'status',
        title: <Translate>STATUS</Translate>,
        flexGrow: 1,
        render: (rowData: Consultation) => {
          const status = String(rowData.status ?? '').toUpperCase();
          return (
            <MyBadgeStatus contant={formatEnumString(status)} color={getStatusColor(status)} />
          );
        }
      },
      {
        key: 'questionToConsultant',
        title: <Translate>Question To Consultant</Translate>,
        flexGrow: 4,
        render: row => {
          const text = row.consultationContent || '';
          const MAX = 20;
          const isLong = text.length > MAX;
          const shortText = isLong ? text.substring(0, MAX) + '...' : text;

          return (
            <Whisper
              trigger={isLong ? 'hover' : 'none'}
              placement="top"
              speaker={<Tooltip className="tooltip-wide">{text}</Tooltip>}
            >
              <span className={isLong ? 'clickable-cell' : ''}>{shortText}</span>
            </Whisper>
          );
        }
      },
      {
        key: 'response',
        title: <Translate>RESPONSE</Translate>,
        flexGrow: 1,
        expandable: true,
        render: row => {
          const text = row.responseText || '';
          const MAX = 20;
          const isLong = text.length > MAX;
          const shortText = isLong ? text.substring(0, MAX) + '...' : text;

          return (
            <Whisper
              trigger={isLong ? 'hover' : 'none'}
              placement="top"
              speaker={<Tooltip className="tooltip-wide">{text}</Tooltip>}
            >
              <span className={isLong ? 'clickable-cell' : ''}>{shortText}</span>
            </Whisper>
          );
        }
      },
      {
        key: 'attachedFile',
        title: <Translate>ATTACHMENTS</Translate>,
        flexGrow: 1,
        render: (rowData: Consultation) => (
          <MdAttachFile
            size={20}
            fill={rowData?.id ? 'var(--primary-gray)' : '#ccc'}
            onClick={() => {
              if (rowData?.id) {
                setConsultation(rowData);
                setAttachmentsModalOpen(true);
              }
            }}
            className={rowData?.id ? 'clickable-cell' : 'not-allowed-cell'}
          />
        )
      },
      {
        key: 'action',
        title: <Translate>ACTIONS</Translate>,
        flexGrow: 1,
        render: (rowData: Consultation) => {
const status = String(rowData.status ?? '').toUpperCase();

const editDisabled =
  edit ||
  status === 'CONFIRMED' ||
  status === 'CANCELLED';

return (
  <MdModeEdit
    size={22}
    fill={editDisabled ? '#ccc' : 'var(--primary-gray)'}
    title={
      editDisabled
        ? 'Edit not allowed for cancelled or confirmed consultation'
        : 'Edit'
    }
    onClick={() => {
      if (editDisabled) return;

      if (rowData.toFacilityId) {
        getDepartmentsByFacility({ facilityId: rowData.toFacilityId });
      }

      setConsultation(rowData);
      setSelectedRow(rowData);
      setEditing(status !== 'NEW');
      setModalKey(prev => prev + 1);
      setOpenDetailsModal(true);
    }}
    className={clsx('icon-button', { 'not-allowed-cell': editDisabled })}
    style={{ cursor: editDisabled ? 'not-allowed' : 'pointer' }}
  />
);
        }
      }
    ],
    [
      facilityListResponse,
      departmentsBulk,
      practitionersBulk,
      isFacilitiesDataLoading,
      isTargetsDataLoading,
      getDepartmentsByFacility,
      edit
    ]
  );

  const filters = () => (
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

  const pageIndex = page;


        // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
      <div ref={tableContainerRef}>
        <MyTable
          columns={tableColumns}
          data={sortedRows}
          onRowClick={(rowData: Consultation) => {
            setConsultation(rowData);
            setSelectedRow(rowData);
            setSelectedRows([rowData]);
            setEditing(String(rowData.status ?? '').toUpperCase() !== 'NEW');
            setPreviewConsultation(rowData);
          }}
          loading={isLoading}
          page={pageIndex}
          rowsPerPage={size}
          totalCount={totalCount}
          onPageChange={(_: unknown, newPage: number) => setPage(newPage)}
          onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowClassName={isSelected}
          filters={filters()}
          tableButtons={
            <div className="bt-div-2">
              <div className="bt-left-2">
                <MyButton
                  disabled={
                    isNurse ||
                    !selectedRow || String(selectedRow.status ?? '').toUpperCase() === 'CANCELLED'
                  }
                  onClick={() => setOpenConfirmCancelModel(true)}
                >
                  Cancel
                </MyButton>

                <MyButton appearance="ghost" disabled={selectedRows.length === 0}>
                  <FontAwesomeIcon icon={faPrint} />
                  <span className="print-label">Print</span>
                </MyButton>

                <Checkbox checked={showCanceled} onChange={() => setShowCanceled(!showCanceled)}>
                <Translate>Show Cancelled</Translate>
                </Checkbox>
              </div>

              <div className={clsx('bt-right-2', { 'disabled-panel': edit || isNurse })}>
                <MyButton
                  onClick={() => {
                    handleClear();
                    setModalKey(prev => prev + 1);
                    setOpenDetailsModal(true);
                  }}
                  prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
                >
                  Add Consultation
                </MyButton>
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
        object={consultation}
        setObject={setConsultation}
        handleCancle={handleCancel}
        fieldName="cancellationReason"
        required
      />

      <Details
        key={modalKey}
        patient={patient}
        encounter={encounter}
        editing={editing}
        consultationOrders={consultation}
        open={openDetailsMdal}
        setOpen={setOpenDetailsModal}
        refetchCon={handleRefetchData}
        edit={edit}
      />

      <MyModal
        open={attachmentsModalOpen}
        setOpen={setAttachmentsModalOpen}
        title="Attachments - Consultation"
        size="lg"
        hideActionBtn={true}
        content={
          <EncounterAttachment
            localEncounter={encounter}
            source="CONSULTATION_ORDER_ATTACHMENT"
            sourceId={consultation?.id ? Number(consultation.id) : undefined}
            refetchAttachmentList={false}
            setRefetchAttachmentList={() => {}}
          />
        }
      />
    </div>
  );
};

export default NormalConsultation;
