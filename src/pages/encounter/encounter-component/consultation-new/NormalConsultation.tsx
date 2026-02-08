import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Checkbox, Loader, Form } from 'rsuite';
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

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { conjureValueBasedOnIDFromList, formatEnumString } from '@/utils';

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
import PreviewConsultation from './PreviewConsultation';
import './styles.less';

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

const NormalConsultation = props => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const edit = props.edit ?? location.state?.edit ?? false;

  console.log('user-======>', user);
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
    patientId: patient?.id ?? patient?.key,
    encounterId: encounter?.id ?? encounter?.key
  });

  const [modalKey, setModalKey] = useState(0);

  const [dateFilter, setDateFilter] = useState<{
    fromDate: Date | null;
    toDate: Date | null;
  }>(() => {
    const today = new Date();
    const onlyDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return {
      fromDate: onlyDate,
      toDate: onlyDate
    };
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

  console.log({ encounterIdStr, showCanceled, hasDateRange });
  console.log({
    all: {
      skip: !encounterIdStr || !showCanceled || hasDateRange,
      isUninitialized: allQuery.isUninitialized
    },
    notCancelled: {
      skip: !encounterIdStr || showCanceled || hasDateRange,
      isUninitialized: notCancelledQuery.isUninitialized
    }
  });

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

  // Select the appropriate data source
  const rows: Consultation[] = consultationData?.data ?? [];
  const totalCount = consultationData?.totalCount ?? 0;
  const isLoading = consultationLoading;

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
      patientId: patient?.id ?? patient?.key,
      encounterId: encounter?.id ?? encounter?.key
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
    setDateFilter({
      fromDate: null,
      toDate: null
    });
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
        cancellationReason: consultation?.cancellationReason ?? '',
        cancelledBy: user?.id
      }).unwrap();

      dispatch(notify({ msg: 'Cancelled successfully', sev: 'success' }));
      setSelectedRow(null);
      setSelectedRows([]);
      setOpenConfirmCancelModel(false);
      handleRefetchData();
    } catch {
      dispatch(notify({ msg: 'Cancel failed', sev: 'error' }));
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
          if (isFacilitiesDataLoading) {
            return <Loader size="xs" />;
          }
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
        key: 'target',
        title: <Translate>CONSULTATION TARGET</Translate>,
        flexGrow: 1,
        render: (rowData: Consultation) => {
          if (isTargetsDataLoading) {
            return <Loader size="xs" />;
          }

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
            const first = String(record.firstName ?? '').trim();
            const last = String(record.lastName ?? '').trim();
            const full = `${first} ${last}`.trim();
            return <span>{full || rowData.practitionerId}</span>;
          }

          return <span></span>;
        }
      },
      {
        key: 'status',
        title: <Translate>STATUS</Translate>,
        flexGrow: 1,
        render: (rowData: Consultation) => (
          <span>{formatEnumString(String(rowData.status ?? ''))}</span>
        )
      },
      {
        key: 'response',
        title: <Translate>RESPONSE</Translate>,
        flexGrow: 1,
        render: (rowData: Consultation) => (rowData.responseText)
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
            style={{ cursor: rowData?.id ? 'pointer' : 'not-allowed' }}
          />
        )
      },
      {
        key: 'action',
        title: <Translate>ACTIONS</Translate>,
        flexGrow: 1,
        render: (rowData: Consultation) => (
          <MdModeEdit
            size={22}
            fill="var(--primary-gray)"
            onClick={() => {
              if (rowData.toFacilityId) {
                getDepartmentsByFacility({ facilityId: rowData.toFacilityId });
              }
              setConsultation(rowData);
              setSelectedRow(rowData);
              setEditing(String(rowData.status ?? '').toUpperCase() !== 'NEW');
              setModalKey(prev => prev + 1);
              setOpenDetailsModal(true);
            }}
            className="icon-button"
          />
        )
      }
    ],
    [
      facilityListResponse,
      departmentsBulk,
      practitionersBulk,
      isFacilitiesDataLoading,
      isTargetsDataLoading,
      getDepartmentsByFacility
    ]
  );

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

  const pageIndex = page;

  return (
    <div>
      <div ref={tableContainerRef}>
        <MyTable
          columns={tableColumns}
          data={rows}
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
                    !selectedRow || String(selectedRow.status ?? '').toUpperCase() === 'CANCELLED'
                  }
                  onClick={() => setOpenConfirmCancelModel(true)}
                >
                  Cancel
                </MyButton>

                <MyButton appearance="ghost" disabled={selectedRows.length === 0}>
                  <FontAwesomeIcon icon={faPrint} />
                  <span style={{ marginInlineStart: 8 }}>Print</span>
                </MyButton>

                <Checkbox checked={showCanceled} onChange={() => setShowCanceled(!showCanceled)}>
                  Show Cancelled
                </Checkbox>
              </div>

              <div className={clsx('bt-right-2', { 'disabled-panel': edit })}>
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
        setConsultationOrder={setConsultation}
        open={openDetailsMdal}
        setOpen={setOpenDetailsModal}
        refetchCon={handleRefetchData}
        edit={edit}
      />

      <MyModal
        open={attachmentsModalOpen}
        setOpen={setAttachmentsModalOpen}
        title={`Attachments - Consultation`}
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
