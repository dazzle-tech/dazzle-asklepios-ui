import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Divider, Form, Loader, Modal, Panel } from 'rsuite';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faShare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { skipToken } from '@reduxjs/toolkit/query/react';
import moment from 'moment';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import '@/components/MyModal/styles.less';
import MyStepper from '@/components/MyStepper';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  useBulkAppointmentTransferMutation,
  useGetTransferSourceAppointmentsQuery,
  useGetTransferTargetAppointmentsQuery
} from '@/services/appointment/appointmentService';
import { useGetBookableDepartmentsForLoggedInUserQuery } from '@/services/security/departmentService';
import { useGetAppointablePractitionerByLoggedInFacilityQuery } from '@/services/setup/practitioner/PractitionerService';
import type {
  AppointmentTransferMappingDTO,
  AppointmentTransferVM
} from '@/types/model-types-new';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';

const WIZARD_STEPS = [
  { title: 'Source appointments' },
  { title: 'Target department' },
  { title: 'Map appointments' },
  { title: 'Review & apply' },
  { title: 'Complete' }
];

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
  calendarViewRange?: { start: Date; end: Date };
};

type DateRangeRecord = {
  startDate: Date | null;
  endDate: Date | null;
};

type TargetFilterRecord = DateRangeRecord & {
  departmentId: number | null;
};

function resolvePersonName(person: any): string {
  if (!person) return '';
  if (typeof person === 'string') return person.trim();
  const joined = [person?.firstName, person?.secondName, person?.thirdName, person?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return (
    joined ||
    String(person?.fullName ?? person?.name ?? person?.practitionerName ?? '').trim()
  );
}

/** Spring @RequestParam LocalDate expects yyyy-MM-dd. */
function toLocalDateParam(value: unknown): string {
  if (value == null || value === '') return '';

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return moment(value)
      .locale('en')
      .format('YYYY-MM-DD');
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';

    const parsed = moment(trimmed);

    return parsed.isValid()
      ? parsed.locale('en').format('YYYY-MM-DD')
      : trimmed.slice(0, 10);
  }

  return String(value);
}

function buildDefaultDateRange(range?: { start: Date; end: Date }): DateRangeRecord {
  if (range?.start && range?.end) {
    return {
      startDate: moment(range.start).startOf('day').toDate(),
      endDate: moment(range.end).startOf('day').toDate()
    };
  }
  return {
    startDate: moment().startOf('day').toDate(),
    endDate: moment().add(14, 'days').startOf('day').toDate()
  };
}

function extractErrorMessage(response: any): string {
  try {
    const msg =
      response?.data?.message ??
      response?.data?.error ??
      response?.message ??
      response?.error;
    if (typeof msg === 'string' && msg.trim()) {
      return msg.replace(/^error\./i, '').trim();
    }
    if (response?.data && typeof response?.data === 'object') {
      const detail = response.data.detail ?? response.data.description;
      if (typeof detail === 'string' && detail.trim()) {
        return detail.trim();
      }
    }
  } catch {
    // ignore
  }
  return '';
}

function appointmentId(row: AppointmentTransferVM | null | undefined): number | null {
  const n = Number(row?.id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const BulkTransferModal = ({ open, setOpen, onSuccess, calendarViewRange }: Props) => {
  const dispatch = useAppDispatch();
  const mode = useSelector((state: any) => state.ui.mode);
  const selectedFacility = useAppSelector(
    (state: any) => state.auth?.tenant?.selectedFacility
  );

  const [step, setStep] = useState(0);
  const [sourceFilter, setSourceFilter] = useState<DateRangeRecord>(() =>
    buildDefaultDateRange(calendarViewRange)
  );
  const [appliedSourceFilter, setAppliedSourceFilter] = useState<DateRangeRecord | null>(null);
  const [targetFilter, setTargetFilter] = useState<TargetFilterRecord>(() => ({
    ...buildDefaultDateRange(calendarViewRange),
    departmentId: null
  }));
  const [appliedTargetFilter, setAppliedTargetFilter] = useState<TargetFilterRecord | null>(
    null
  );
  const [selectedSourceIds, setSelectedSourceIds] = useState<number[]>([]);
  const [activeSourceId, setActiveSourceId] = useState<number | null>(null);
  const [mappings, setMappings] = useState<AppointmentTransferMappingDTO[]>([]);
  const [transferResultMessage, setTransferResultMessage] = useState('');
  const [transferredCount, setTransferredCount] = useState(0);

  const { data: bookableDepartmentsResponse = [] } =
    useGetBookableDepartmentsForLoggedInUserQuery(undefined, { skip: !open });

  const { data: appointablePractitionersResponse } =
    useGetAppointablePractitionerByLoggedInFacilityQuery(
      { page: 0, size: 500, sort: 'id,asc' },
      { skip: !open }
    );

  const departmentNameById = useMemo(() => {
    const map = new Map<string, string>();
    (bookableDepartmentsResponse ?? []).forEach((d: any) => {
      const id = d?.id ?? d?.departmentId ?? d?.key;
      const name = d?.name ?? d?.departmentName;
      if (id != null && name) map.set(String(id), String(name));
    });
    return map;
  }, [bookableDepartmentsResponse]);

  const practitionerNameById = useMemo(() => {
    const map = new Map<string, string>();
    ((appointablePractitionersResponse as any)?.data ?? []).forEach((p: any) => {
      const id = p?.id ?? p?.key ?? p?.practitionerId;
      const name = resolvePersonName(p);
      if (id != null && name) map.set(String(id), name);
    });
    return map;
  }, [appointablePractitionersResponse]);

  const resolveDepartmentName = useCallback(
    (row: AppointmentTransferVM | null | undefined): string => {
      if (!row) return '—';
      const fromRow = String(row.departmentName ?? '').trim();
      if (fromRow) return fromRow;
      const fromLookup =
        row.departmentId != null
          ? departmentNameById.get(String(row.departmentId))
          : undefined;
      return fromLookup || (row.departmentId != null ? String(row.departmentId) : '—');
    },
    [departmentNameById]
  );

  const resolvePractitionerName = useCallback(
    (row: AppointmentTransferVM | null | undefined): string => {
      if (!row) return '—';
      const fromRow = String(row.practitionerName ?? '').trim();
      if (fromRow) return fromRow;
      const fromLookup =
        row.practitionerId != null
          ? practitionerNameById.get(String(row.practitionerId))
          : undefined;
      return fromLookup || (row.practitionerId != null ? String(row.practitionerId) : '—');
    },
    [practitionerNameById]
  );

  const bookableDepartmentOptions = useMemo(() => {
    const all = bookableDepartmentsResponse ?? [];
    const filtered = selectedFacility?.id
      ? all.filter(
          (d: any) =>
            String(d?.facilityId ?? d?.facility_id ?? '') === String(selectedFacility.id)
        )
      : all;

    return filtered
      .map((d: any) => {
        const value = d?.id ?? d?.key;
        const label = d?.name ?? d?.departmentName ?? String(value ?? '');
        return value != null ? { label: String(label), value: Number(value) } : null;
      })
      .filter(Boolean) as { label: string; value: number }[];
  }, [bookableDepartmentsResponse, selectedFacility?.id]);

  const sourceQueryArgs =
    open && appliedSourceFilter?.startDate && appliedSourceFilter?.endDate
      ? {
          startDate: toLocalDateParam(appliedSourceFilter.startDate),
          endDate: toLocalDateParam(appliedSourceFilter.endDate)
        }
      : skipToken;

  const {
    data: sourceAppointments = [],
    isFetching: loadingSources,
    isError: sourcesError
  } = useGetTransferSourceAppointmentsQuery(sourceQueryArgs, {
    refetchOnMountOrArgChange: true
  });

  const targetQueryArgs =
    open &&
    appliedTargetFilter?.departmentId != null &&
    Number(appliedTargetFilter.departmentId) > 0 &&
    appliedTargetFilter.startDate &&
    appliedTargetFilter.endDate
      ? {
          departmentId: Number(appliedTargetFilter.departmentId),
          startDate: toLocalDateParam(appliedTargetFilter.startDate),
          endDate: toLocalDateParam(appliedTargetFilter.endDate)
        }
      : skipToken;

  const {
    data: targetAppointments = [],
    isFetching: loadingTargets,
    isError: targetsError
  } = useGetTransferTargetAppointmentsQuery(targetQueryArgs, {
    refetchOnMountOrArgChange: true
  });

  const [bulkTransfer, { isLoading: bulkLoading }] = useBulkAppointmentTransferMutation();

  const resetWizard = useCallback(() => {
    const defaults = buildDefaultDateRange(calendarViewRange);
    setStep(0);
    setSourceFilter(defaults);
    setAppliedSourceFilter(null);
    setTargetFilter({ ...defaults, departmentId: null });
    setAppliedTargetFilter(null);
    setSelectedSourceIds([]);
    setActiveSourceId(null);
    setMappings([]);
    setTransferResultMessage('');
    setTransferredCount(0);
  }, [calendarViewRange]);

  useEffect(() => {
    if (!open) {
      resetWizard();
    }
  }, [open, resetWizard]);

  useEffect(() => {
    if (!open || !calendarViewRange) return;
    const defaults = buildDefaultDateRange(calendarViewRange);
    setSourceFilter(defaults);
    setTargetFilter(prev => ({ ...defaults, departmentId: prev.departmentId }));
  }, [open, calendarViewRange]);

  const sourceById = useMemo(() => {
    const map = new Map<number, AppointmentTransferVM>();
    (sourceAppointments ?? []).forEach(row => {
      const id = appointmentId(row);
      if (id != null) map.set(id, row);
    });
    return map;
  }, [sourceAppointments]);

  const targetById = useMemo(() => {
    const map = new Map<number, AppointmentTransferVM>();
    (targetAppointments ?? []).forEach(row => {
      const id = appointmentId(row);
      if (id != null) map.set(id, row);
    });
    return map;
  }, [targetAppointments]);

  const selectedSources = useMemo(
    () =>
      selectedSourceIds
        .map(id => sourceById.get(id))
        .filter((row): row is AppointmentTransferVM => Boolean(row)),
    [selectedSourceIds, sourceById]
  );

  const mappedTargetIds = useMemo(
    () => new Set(mappings.map(m => Number(m.newAppointmentId))),
    [mappings]
  );

  const mappedSourceIds = useMemo(
    () => new Set(mappings.map(m => Number(m.oldAppointmentId))),
    [mappings]
  );

  const availableTargets = useMemo(
    () =>
      (targetAppointments ?? []).filter(row => {
        const id = appointmentId(row);
        return id != null && !mappedTargetIds.has(id);
      }),
    [targetAppointments, mappedTargetIds]
  );

  const unmappedSelectedSources = useMemo(
    () => selectedSources.filter(row => !mappedSourceIds.has(Number(row.id))),
    [selectedSources, mappedSourceIds]
  );

  const toggleSourceSelection = (id: number) => {
    setSelectedSourceIds(prev => {
      if (prev.includes(id)) {
        setMappings(curr => curr.filter(m => Number(m.oldAppointmentId) !== id));
        if (activeSourceId === id) setActiveSourceId(null);
        return prev.filter(x => x !== id);
      }
      return [...prev, id];
    });
  };

  const selectAllVisibleSources = () => {
    const ids = (sourceAppointments ?? [])
      .map(row => appointmentId(row))
      .filter((id): id is number => id != null);
    setSelectedSourceIds(ids);
  };

  const clearSourceSelection = () => {
    setSelectedSourceIds([]);
    setActiveSourceId(null);
    setMappings([]);
  };

  const assignTargetToActiveSource = (targetId: number) => {
    if (activeSourceId == null) {
      dispatch(
        notify({
          msg: 'Select a source appointment first, then pick a target slot.',
          sev: 'warning'
        })
      );
      return;
    }
    if (mappedTargetIds.has(targetId)) {
      dispatch(notify({ msg: 'That target is already mapped.', sev: 'warning' }));
      return;
    }
    setMappings(prev => {
      const withoutSource = prev.filter(m => Number(m.oldAppointmentId) !== activeSourceId);
      return [
        ...withoutSource,
        { oldAppointmentId: activeSourceId, newAppointmentId: targetId }
      ];
    });
    const remaining = unmappedSelectedSources.filter(s => Number(s.id) !== activeSourceId);
    setActiveSourceId(remaining.length > 0 ? Number(remaining[0].id) : null);
  };

  const removeMapping = (oldAppointmentId: number) => {
    setMappings(prev => prev.filter(m => Number(m.oldAppointmentId) !== oldAppointmentId));
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSearchSources = () => {
    if (!sourceFilter.startDate || !sourceFilter.endDate) {
      dispatch(notify({ msg: 'Select a start and end date.', sev: 'warning' }));
      return;
    }
    const start = moment(sourceFilter.startDate).startOf('day');
    const end = moment(sourceFilter.endDate).startOf('day');
    if (end.isBefore(start)) {
      dispatch(notify({ msg: 'End date must be on or after start date.', sev: 'warning' }));
      return;
    }
    setAppliedSourceFilter({ ...sourceFilter });
    setSelectedSourceIds([]);
    setActiveSourceId(null);
    setMappings([]);
  };

  const handleSearchTargets = () => {
    if (!targetFilter.departmentId || Number(targetFilter.departmentId) <= 0) {
      dispatch(notify({ msg: 'Select a target department.', sev: 'warning' }));
      return;
    }
    if (!targetFilter.startDate || !targetFilter.endDate) {
      dispatch(notify({ msg: 'Select a start and end date.', sev: 'warning' }));
      return;
    }
    const start = moment(targetFilter.startDate).startOf('day');
    const end = moment(targetFilter.endDate).startOf('day');
    if (end.isBefore(start)) {
      dispatch(notify({ msg: 'End date must be on or after start date.', sev: 'warning' }));
      return;
    }
    setAppliedTargetFilter({ ...targetFilter });
    setMappings([]);
    setActiveSourceId(selectedSourceIds[0] ?? null);
  };

  const handleNext = () => {
    if (step === 0) {
      if (selectedSourceIds.length === 0) {
        dispatch(
          notify({ msg: 'Select at least one source appointment to continue.', sev: 'warning' })
        );
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!appliedTargetFilter?.departmentId) {
        dispatch(
          notify({
            msg: 'Search target appointments for a department before continuing.',
            sev: 'warning'
          })
        );
        return;
      }
      if ((targetAppointments ?? []).length === 0) {
        dispatch(
          notify({
            msg: 'No target appointments found. Adjust filters and search again.',
            sev: 'warning'
          })
        );
        return;
      }
      setActiveSourceId(selectedSourceIds.find(id => !mappedSourceIds.has(id)) ?? null);
      setStep(2);
      return;
    }
    if (step === 2) {
      if (mappings.length === 0) {
        dispatch(notify({ msg: 'Map at least one source to a target.', sev: 'warning' }));
        return;
      }
      if (mappings.length < selectedSourceIds.length) {
        dispatch(
          notify({
            msg: `Map all selected sources (${mappings.length}/${selectedSourceIds.length} mapped).`,
            sev: 'warning'
          })
        );
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 1) setStep(0);
    else if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleApplyBulkTransfer = async () => {
    if (mappings.length === 0) {
      dispatch(notify({ msg: 'No transfer mappings to apply.', sev: 'warning' }));
      return;
    }
    try {
      const result = await bulkTransfer({ transfers: mappings }).unwrap();
      if (result.success) {
        setTransferredCount(result.transferredCount ?? mappings.length);
        setTransferResultMessage(result.message?.trim() || '');
        setStep(4);
        onSuccess?.();
        return;
      }
      dispatch(
        notify({
          msg: result.message?.trim() || 'Bulk transfer did not complete.',
          sev: 'warning'
        })
      );
    } catch (error) {
      const errorMsg = extractErrorMessage(error) || 'Bulk transfer failed.';
      dispatch(notify({ msg: errorMsg, sev: 'error' }));
    }
  };

  const transferColumns = useMemo(
    () => [
      {
        key: 'start',
        title: <Translate>Start</Translate>,
        flexGrow: 2,
        render: (row: AppointmentTransferVM) => (
          <span>
            {row?.startDatetime ? formatDateWithoutSeconds(row.startDatetime) : '—'}
          </span>
        )
      },
      {
        key: 'end',
        title: <Translate>End</Translate>,
        flexGrow: 2,
        render: (row: AppointmentTransferVM) => (
          <span>{row?.endDatetime ? formatDateWithoutSeconds(row.endDatetime) : '—'}</span>
        )
      },
      {
        key: 'status',
        title: <Translate>Status</Translate>,
        flexGrow: 1,
        render: (row: AppointmentTransferVM) => (
          <MyBadgeStatus
            color="#0284c7"
            contant={formatEnumString(String(row?.status ?? ''))}
          />
        )
      },
      {
        key: 'department',
        title: <Translate>Department</Translate>,
        flexGrow: 2,
        render: (row: AppointmentTransferVM) => (
          <span>{resolveDepartmentName(row)}</span>
        )
      },
      {
        key: 'practitioner',
        title: <Translate>Practitioner</Translate>,
        flexGrow: 2,
        render: (row: AppointmentTransferVM) => (
          <span>{resolvePractitionerName(row)}</span>
        )
      },
      {
        key: 'patient',
        title: <Translate>Patient</Translate>,
        flexGrow: 2,
        render: (row: AppointmentTransferVM) => (
          <span>
            {row?.patientName || '—'}
            {row?.medicalRecordNumber ? ` (${row.medicalRecordNumber})` : ''}
          </span>
        )
      },
      {
        key: 'resourceType',
        title: <Translate>Resource Type</Translate>,
        flexGrow: 1,
        render: (row: AppointmentTransferVM) => (
          <span>{formatEnumString(String(row?.resourceType ?? '')) || '—'}</span>
        )
      }
    ],
    [resolveDepartmentName, resolvePractitionerName]
  );

  const sourcePickColumns = useMemo(
    () => [
      {
        key: 'pick',
        title: '',
        width: 44,
        render: (row: AppointmentTransferVM) => {
          const id = appointmentId(row);
          const checked = id != null && selectedSourceIds.includes(id);
          return (
            <input
              type="checkbox"
              checked={checked}
              onChange={e => {
                e.stopPropagation();
                if (id != null) toggleSourceSelection(id);
              }}
              onClick={e => e.stopPropagation()}
            />
          );
        }
      },
      ...transferColumns
    ],
    [selectedSourceIds, transferColumns]
  );

  const mappingReviewColumns = useMemo(
    () => [
      {
        key: 'source',
        title: 'Source',
        flexGrow: 3,
        render: (row: AppointmentTransferMappingDTO) => {
          const source = sourceById.get(Number(row.oldAppointmentId));
          return (
            <span>
              #{row.oldAppointmentId}
              {source?.patientName ? ` — ${source.patientName}` : ''}
              {source?.startDatetime
                ? ` @ ${formatDateWithoutSeconds(source.startDatetime)}`
                : ''}
            </span>
          );
        }
      },
      {
        key: 'arrow',
        title: '',
        width: 40,
        render: () => <span>→</span>
      },
      {
        key: 'target',
        title: 'Target',
        flexGrow: 3,
        render: (row: AppointmentTransferMappingDTO) => {
          const target = targetById.get(Number(row.newAppointmentId));
          return (
            <span>
              #{row.newAppointmentId}
              {target ? ` — ${resolveDepartmentName(target)}` : ''}
              {target?.startDatetime
                ? ` @ ${formatDateWithoutSeconds(target.startDatetime)}`
                : ''}
            </span>
          );
        }
      },
      {
        key: 'actions',
        title: '',
        width: 56,
        render: (row: AppointmentTransferMappingDTO) => (
          <FontAwesomeIcon
            icon={faTrash}
            title="Remove mapping"
            style={{ cursor: 'pointer', color: '#dc2626' }}
            onClick={e => {
              e.stopPropagation();
              removeMapping(Number(row.oldAppointmentId));
            }}
          />
        )
      }
    ],
    [sourceById, targetById, resolveDepartmentName]
  );

  const renderBody = () => {
    if (step === 4) {
      return (
        <Panel bordered style={{ padding: 24, textAlign: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginBottom: 12
            }}
          >
            <FontAwesomeIcon
              icon={faCircleCheck}
              style={{ color: '#16a34a', fontSize: 24 }}
            />
            <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
              Transfer applied successfully
            </p>
          </div>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            {transferredCount} appointment(s) transferred.
            {transferResultMessage ? ` ${transferResultMessage}` : ''} You can close this
            dialog.
          </p>
        </Panel>
      );
    }

    if (step === 0) {
      return (
        <Form fluid layout="vertical">
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
            Choose a date range, search transferable source appointments, then select the ones
            to move.
          </p>
          <Panel
            bordered
            style={{
              marginBottom: 12,
              padding: '12px 16px',
              background: mode === 'light' ? '#f8fafc' : undefined
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr auto',
                gap: 12,
                alignItems: 'end'
              }}
            >
              <MyInput
                fieldLabel="Start date"
                fieldType="date"
                fieldName="startDate"
                record={sourceFilter}
                setRecord={setSourceFilter}
                width="100%"
              />
              <MyInput
                fieldLabel="End date"
                fieldType="date"
                fieldName="endDate"
                record={sourceFilter}
                setRecord={setSourceFilter}
                width="100%"
              />
              <MyButton
                appearance="primary"
                onClick={handleSearchSources}
                disabled={!sourceFilter.startDate || !sourceFilter.endDate}
                loading={loadingSources}
              >
                Search
              </MyButton>
            </div>
          </Panel>

          {!appliedSourceFilter ? (
            <Panel bordered>Search by date range to load source appointments.</Panel>
          ) : loadingSources ? (
            <Loader center />
          ) : sourcesError ? (
            <Panel bordered>Unable to load source appointments.</Panel>
          ) : (sourceAppointments ?? []).length === 0 ? (
            <Panel bordered>No source appointments found for this date range.</Panel>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <p style={{ margin: 0, fontSize: 13, color: '#334155' }}>
                  {selectedSourceIds.length} selected of {(sourceAppointments ?? []).length}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <MyButton appearance="subtle" onClick={selectAllVisibleSources}>
                    Select all
                  </MyButton>
                  <MyButton appearance="subtle" onClick={clearSourceSelection}>
                    Clear
                  </MyButton>
                </div>
              </div>
              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 8
                }}
              >
                <MyTable
                  columns={sourcePickColumns as any}
                  data={sourceAppointments ?? []}
                  loading={loadingSources}
                  height={380}
                  onRowClick={(row: AppointmentTransferVM) => {
                    const id = appointmentId(row);
                    if (id != null) toggleSourceSelection(id);
                  }}
                  rowClassName={(row: AppointmentTransferVM) =>
                    selectedSourceIds.includes(Number(row?.id)) ? 'selected-row' : ''
                  }
                />
              </div>
            </div>
          )}
        </Form>
      );
    }

    if (step === 1) {
      return (
        <Form fluid layout="vertical">
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
            Select the destination department and date range for target appointment slots.
          </p>
          <Panel
            bordered
            style={{
              marginBottom: 12,
              padding: '12px 16px',
              background: mode === 'light' ? '#f8fafc' : undefined
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 1fr auto',
                gap: 12,
                alignItems: 'end'
              }}
            >
              <MyInput
                fieldType="select"
                fieldLabel="Department"
                fieldName="departmentId"
                record={targetFilter}
                setRecord={setTargetFilter}
                selectData={bookableDepartmentOptions}
                selectDataLabel="label"
                selectDataValue="value"
                searchable
                width="100%"
                placeholder="Select department"
              />
              <MyInput
                fieldLabel="Start date"
                fieldType="date"
                fieldName="startDate"
                record={targetFilter}
                setRecord={setTargetFilter}
                width="100%"
              />
              <MyInput
                fieldLabel="End date"
                fieldType="date"
                fieldName="endDate"
                record={targetFilter}
                setRecord={setTargetFilter}
                width="100%"
              />
              <MyButton
                appearance="primary"
                onClick={handleSearchTargets}
                disabled={
                  !targetFilter.departmentId ||
                  !targetFilter.startDate ||
                  !targetFilter.endDate
                }
                loading={loadingTargets}
              >
                Search
              </MyButton>
            </div>
          </Panel>

          <p style={{ fontSize: 13, color: '#334155', marginBottom: 8 }}>
            Transferring {selectedSourceIds.length} source appointment(s).
          </p>

          {!appliedTargetFilter ? (
            <Panel bordered>Search to load target appointments for mapping.</Panel>
          ) : loadingTargets ? (
            <Loader center />
          ) : targetsError ? (
            <Panel bordered>Unable to load target appointments.</Panel>
          ) : (targetAppointments ?? []).length === 0 ? (
            <Panel bordered>No target appointments found for these filters.</Panel>
          ) : (
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 8
              }}
            >
              <MyTable
                columns={transferColumns as any}
                data={targetAppointments ?? []}
                loading={loadingTargets}
                height={380}
              />
            </div>
          )}
        </Form>
      );
    }

    if (step === 2) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            Select a source appointment, then click a target slot to map them. Mapped:{' '}
            <strong>
              {mappings.length}/{selectedSourceIds.length}
            </strong>
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              minHeight: 280
            }}
          >
            <Panel bordered header="Sources to transfer" style={{ padding: 8 }}>
              {unmappedSelectedSources.length === 0 && mappings.length > 0 ? (
                <p style={{ fontSize: 13, color: '#16a34a' }}>All sources are mapped.</p>
              ) : (
                <MyTable
                  columns={transferColumns as any}
                  data={unmappedSelectedSources}
                  height={260}
                  onRowClick={(row: AppointmentTransferVM) => {
                    const id = appointmentId(row);
                    if (id != null) setActiveSourceId(id);
                  }}
                  rowClassName={(row: AppointmentTransferVM) =>
                    Number(activeSourceId) === Number(row?.id) ? 'selected-row' : ''
                  }
                />
              )}
            </Panel>

            <Panel bordered header="Available targets" style={{ padding: 8 }}>
              {availableTargets.length === 0 ? (
                <p style={{ fontSize: 13, color: '#64748b' }}>
                  No remaining target slots available.
                </p>
              ) : (
                <MyTable
                  columns={transferColumns as any}
                  data={availableTargets}
                  height={260}
                  onRowClick={(row: AppointmentTransferVM) => {
                    const id = appointmentId(row);
                    if (id != null) assignTargetToActiveSource(id);
                  }}
                />
              )}
            </Panel>
          </div>

          <Panel bordered header="Current mappings" style={{ padding: 8 }}>
            {mappings.length === 0 ? (
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>No mappings yet.</p>
            ) : (
              <MyTable
                columns={mappingReviewColumns as any}
                data={mappings}
                height={180}
              />
            )}
          </Panel>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            Review the transfer mappings below, then apply the bulk transfer.
          </p>
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 8
            }}
          >
            <MyTable columns={mappingReviewColumns as any} data={mappings} height={420} />
          </div>
        </div>
      );
    }

    return null;
  };

  const renderFooter = () => {
    if (step === 4) {
      return (
        <Modal.Footer className="footer-modal">
          <Form className="footer-modal-content">
            <MyButton appearance="primary" onClick={handleClose}>
              Close
            </MyButton>
          </Form>
        </Modal.Footer>
      );
    }

    if (step === 3) {
      return (
        <Modal.Footer className="footer-modal">
          <Form className="footer-modal-content">
            <MyButton appearance="subtle" onClick={handleClose}>
              Cancel
            </MyButton>
            <MyButton appearance="subtle" onClick={handleBack}>
              Back
            </MyButton>
            <MyButton
              appearance="primary"
              loading={bulkLoading}
              disabled={mappings.length === 0}
              onClick={() => void handleApplyBulkTransfer()}
            >
              Apply bulk transfer
            </MyButton>
          </Form>
        </Modal.Footer>
      );
    }

    return (
      <Modal.Footer className="footer-modal">
        <Form className="footer-modal-content">
          <MyButton appearance="subtle" onClick={handleClose}>
            Cancel
          </MyButton>
          {step > 0 && (
            <MyButton appearance="subtle" onClick={handleBack}>
              Back
            </MyButton>
          )}
          <MyButton
            appearance="primary"
            onClick={handleNext}
            disabled={
              (step === 0 && selectedSourceIds.length === 0) ||
              (step === 1 &&
                (!appliedTargetFilter?.departmentId ||
                  (targetAppointments ?? []).length === 0 ||
                  loadingTargets)) ||
              (step === 2 &&
                (mappings.length === 0 || mappings.length < selectedSourceIds.length))
            }
          >
            Next
          </MyButton>
        </Form>
      </Modal.Footer>
    );
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="85vw"
      enforceFocus={step !== 4}
      className={`${mode === 'light' ? 'modal-light' : 'modal-dark'} bulk-reschedule-wizard-modal`}
    >
      <Modal.Header>
        <Modal.Title>
          <FontAwesomeIcon icon={faShare} style={{ marginRight: 8 }} />
          Bulk transfer
        </Modal.Title>
      </Modal.Header>
      <Divider className="divider-line" />
      <Modal.Body style={{ height: '72vh' }}>
        <MyStepper
          activeStep={step}
          stepsList={WIZARD_STEPS.map((s, index) => ({
            key: index,
            value: <Translate>{s.title}</Translate>,
            description: '',
            customIcon: null,
            isError: false
          }))}
          modalColor="var(--primary-blue)"
        />
        <br />
        {renderBody()}
      </Modal.Body>
      <Divider className="divider-line" />
      {renderFooter()}
    </Modal>
  );
};

export default BulkTransferModal;
