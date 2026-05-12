import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Divider, Form, Loader, Modal, Panel, Radio, RadioGroup } from 'rsuite';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faRightLeft } from '@fortawesome/free-solid-svg-icons';
import { skipToken } from '@reduxjs/toolkit/query/react';

import MyButton from '@/components/MyButton/MyButton';
import '@/components/MyModal/styles.less';
import MyStepper from '@/components/MyStepper';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { useGetAvailabilityGenerationBatchesByTemplateQuery, useGetAvailabilityGenerationBatchesByTemplateExcludingBatchQuery } from '@/services/appointment/availabilityGenerationBatchService/availabilityGenerationBatchService';
import {
  useBulkRescheduleAppointmentsMutation,
  useCancelAppointmentMutation,
  useGetAvailabilityTemplatesByPublishStatusQuery,
  useGetAvailabilityTemplatesByDepartmentAndActiveQuery,
  useLazyGetAppointmentsByBatchIdQuery
} from '@/services/appointment/appointmentService';
import { useGetPatientsByIdsQuery } from '@/services/patient/patientService';
import type {
  AvailabilityGenerationBatch,
  AvailabilityTemplateResponseVM
} from '@/types/model-types-new';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';

const WIZARD_STEPS = [
  { title: 'Select template' },
  { title: 'Select generation batch' },
  { title: 'Review appointments' },
  { title: 'Replacement template' },
  { title: 'Replacement batch' },
  { title: 'Complete' }
];

const SYSTEM_CANCEL_REASON = 'cancelled appointment by system';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
};

function appointmentStart(row: any): Date | null {
  const raw = row?.startDatetime ?? row?.appointmentStart ?? row?.appointmentDateTime;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isStrictlyAfterCalendarToday(d: Date): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return day.getTime() > today.getTime();
}

function normalizeApptStatus(row: any): string {
  return String(row?.status ?? row?.appointmentStatus ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

function isFreeSlotStatus(s: string): boolean {
  return s === 'NEW' || s === 'RESCHEDULE' || s === 'NEW_APPOINTMENT';
}

function isBookedOrConfirmed(s: string): boolean {
  return s === 'BOOKED' || s === 'CONFIRMED';
}

function getAppointmentPatientId(row: any): number | null {
  const raw =
    row?.patientId ??
    (typeof row?.patient === 'object' ? row.patient?.id : row?.patient) ??
    row?.patient?.patientId ??
    row?.patient?.patient_id;
  const numeric = Number(raw);
  const result = Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  console.log('[BulkRescheduleModal] getAppointmentPatientId', { raw, result, row });
  return result;
}

function getPatientFullName(patient: any): string {
  if (!patient) return '';
  if (typeof patient === 'string') return patient.trim();
  const candidateName =
    [(patient?.firstName ?? patient?.first_name),
      (patient?.secondName ?? patient?.second_name),
      (patient?.thirdName ?? patient?.third_name),
      (patient?.lastName ?? patient?.last_name)]
      .filter(Boolean)
      .join(' ')
      .trim();
  return candidateName || String(patient?.fullName ?? patient?.full_name ?? patient?.name ?? '').trim();
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function sameTemplateConfiguration(
  a: AvailabilityTemplateResponseVM,
  b: AvailabilityTemplateResponseVM
): boolean {
  return (
    a.departmentId === b.departmentId &&
    a.templateType === b.templateType &&
    a.resourceId === b.resourceId &&
    (a.durationMinutes ?? null) === (b.durationMinutes ?? null) &&
    (a.parallelCapacityValue ?? null) === (b.parallelCapacityValue ?? null)
  );
}

async function fetchAllAppointmentsForBatch(
  lazyGet: ReturnType<typeof useLazyGetAppointmentsByBatchIdQuery>[0],
  batchId: number
): Promise<any[]> {
  const size = 200;
  let page = 0;
  const out: any[] = [];
  for (;;) {
    const res = await lazyGet({
      batchId,
      page,
      size,
      sort: 'id,asc'
    }).unwrap();
    const chunk = res?.data ?? [];
    out.push(...chunk);
    if (chunk.length < size) break;
    page += 1;
  }
  return out;
}

const BulkRescheduleModal = ({ open, setOpen, onSuccess }: Props) => {
  const dispatch = useAppDispatch();
  const mode = useSelector((state: any) => state.ui.mode);

  const [step, setStep] = useState(0);
  const [selectedOriginTemplate, setSelectedOriginTemplate] =
    useState<AvailabilityTemplateResponseVM | null>(null);
  const [originTemplateId, setOriginTemplateId] = useState<number | null>(null);
  const [originBatchId, setOriginBatchId] = useState<number | null>(null);
  const [selectedOriginBatchRowKey, setSelectedOriginBatchRowKey] = useState<string>('');

  const [replacementTemplateId, setReplacementTemplateId] = useState<number | null>(null);
  const [replacementBatchId, setReplacementBatchId] = useState<number | null>(null);
  const [selectedReplacementBatchKey, setSelectedReplacementBatchKey] = useState<string>('');

  const [batchAppointmentsAll, setBatchAppointmentsAll] = useState<any[]>([]);
  const [loadingBatchAppointments, setLoadingBatchAppointments] = useState(false);
  const [unmatchedIds, setUnmatchedIds] = useState<number[]>([]);
  const [confirmBulkCancelOpen, setConfirmBulkCancelOpen] = useState(false);

  const { data: publishedTemplatesPage, isFetching: loadingTemplates } =
    useGetAvailabilityTemplatesByPublishStatusQuery(
      { page: 0, size: 1000, sort: 'id,asc' },
      { skip: !open }
    );
  const publishedTemplates = publishedTemplatesPage?.data ?? [];

  const { data: originBatchesPage, isFetching: loadingOriginBatches } =
    useGetAvailabilityGenerationBatchesByTemplateQuery(
      {
        templateId: originTemplateId ?? 0,
        page: 0,
        size: 500,
        sort: 'id,desc'
      },
      { skip: !open || !originTemplateId }
    );

  const { data: replacementBatchesPage, isFetching: loadingReplacementBatches } =
    useGetAvailabilityGenerationBatchesByTemplateExcludingBatchQuery(
      {
        templateId: replacementTemplateId ?? 0,
        batchId: originBatchId ?? 0,
        page: 0,
        size: 500,
        sort: 'id,desc'
      },
      { skip: !open || !replacementTemplateId || !originBatchId || step < 3 }
    );

  const { data: departmentActiveTemplatesPage, isFetching: loadingDepartmentActiveTemplates } =
    useGetAvailabilityTemplatesByDepartmentAndActiveQuery(
      selectedOriginTemplate?.departmentId && selectedOriginTemplate?.templateType && selectedOriginTemplate?.resourceId
        ? {
            departmentId: selectedOriginTemplate!.departmentId,
            type: selectedOriginTemplate!.templateType,
            resourceId: selectedOriginTemplate!.resourceId,
            page: 0,
            size: 1000,
            sort: 'id,asc'
          }
        : skipToken
    );

  const [lazyGetByBatch] = useLazyGetAppointmentsByBatchIdQuery();
  const [cancelAppointment] = useCancelAppointmentMutation();
  const [bulkReschedule, { isLoading: bulkLoading }] = useBulkRescheduleAppointmentsMutation();

  const resetWizard = useCallback(() => {
    setStep(0);
    setSelectedOriginTemplate(null);
    setOriginTemplateId(null);
    setOriginBatchId(null);
    setSelectedOriginBatchRowKey('');
    setReplacementTemplateId(null);
    setReplacementBatchId(null);
    setSelectedReplacementBatchKey('');
    setBatchAppointmentsAll([]);
    setUnmatchedIds([]);
    setConfirmBulkCancelOpen(false);
  }, []);

  useEffect(() => {
    if (!open) {
      resetWizard();
    }
  }, [open, resetWizard]);

  useEffect(() => {
    if (!open || step !== 2 || !originBatchId) {
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingBatchAppointments(true);
      try {
        const all = await fetchAllAppointmentsForBatch(lazyGetByBatch, originBatchId);
        if (!cancelled) setBatchAppointmentsAll(all);
      } catch {
        if (!cancelled) setBatchAppointmentsAll([]);
      } finally {
        if (!cancelled) setLoadingBatchAppointments(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, step, originBatchId, lazyGetByBatch]);

  const bookedConfirmedRows = useMemo(() => {
    return batchAppointmentsAll.filter(row => {
      const st = normalizeApptStatus(row);
      if (!isBookedOrConfirmed(st)) return false;
      const d = appointmentStart(row);
      if (!d) return false;
      return isStrictlyAfterCalendarToday(d);
    });
  }, [batchAppointmentsAll]);

  const patientIds = useMemo(() => {
    const ids = bookedConfirmedRows
      .map(row => getAppointmentPatientId(row))
      .filter((id): id is number => id != null);
    return Array.from(new Set(ids));
  }, [bookedConfirmedRows]);

  const { data: patients } = useGetPatientsByIdsQuery(
    { ids: Array.from(patientIds) },
    { skip: patientIds.length === 0 }
  );

  useEffect(() => {
    console.log('[BulkRescheduleModal] patientIds', {
      patientIds,
      isArray: Array.isArray(patientIds),
      isSet: patientIds instanceof Set,
      patients
    });
  }, [patientIds, patients]);

  const patientMap = useMemo(() => {
    const map = new Map<number, any>();
    patients?.forEach(p => map.set(Number(p.id), p));
    return map;
  }, [patients]);

  const replacementCandidates = useMemo(() => {
    if (!selectedOriginTemplate) return [];
    return departmentActiveTemplatesPage?.data ?? [];
  }, [departmentActiveTemplatesPage?.data, selectedOriginTemplate]);

  const originBatches = originBatchesPage?.data ?? [];
  const replacementBatches = replacementBatchesPage?.data ?? [];

  const originBatchRows = useMemo(
    () =>
      originBatches.map((b: AvailabilityGenerationBatch) => ({
        ...b,
        rowKey: String(b.id),
        applyLabel: b.applyStartDateTime ? formatDateWithoutSeconds(b.applyStartDateTime) : '-',
        endLabel: b.applyEndDateTime ? formatDateWithoutSeconds(b.applyEndDateTime) : '-'
      })),
    [originBatches]
  );

  const replacementBatchRows = useMemo(
    () =>
      replacementBatches.map((b: AvailabilityGenerationBatch) => ({
        ...b,
        rowKey: String(b.id),
        applyLabel: b.applyStartDateTime ? formatDateWithoutSeconds(b.applyStartDateTime) : '-',
        endLabel: b.applyEndDateTime ? formatDateWithoutSeconds(b.applyEndDateTime) : '-'
      })),
    [replacementBatches]
  );

  const appointmentPreviewColumns = useMemo(
    () => [
      {
        key: 'start',
        title: <Translate>Start</Translate>,
        flexGrow: 2,
        render: (row: any) => (
          <span>{row?.startDatetime ? formatDateWithoutSeconds(row.startDatetime) : '-'}</span>
        )
      },
      {
        key: 'status',
        title: <Translate>Status</Translate>,
        flexGrow: 1,
        render: (row: any) => (
          <MyBadgeStatus color="#0284c7" contant={formatEnumString(String(row?.status ?? ''))} />
        )
      },
      {
        key: 'patient',
        title: <Translate>Patient</Translate>,
        flexGrow: 2,
        render: (row: any) => {
          const patientId = getAppointmentPatientId(row);
          const patient = patientId != null ? patientMap.get(patientId) : undefined;
          const nameFromService = patient ? getPatientFullName(patient) : undefined;
          const nameFromRow =
            getPatientFullName(row?.patient) || String(row?.patientName ?? '').trim();
          const name = nameFromService || nameFromRow || '—';
          console.log('[BulkRescheduleModal] render patient', { row, patientId, patient, nameFromService, nameFromRow, name });
          return <span>{name}</span>;
        }
      }
    ],
    [patientMap]
  );

  const templatePickColumns = useMemo(
    () => [
      {
        key: 'pick',
        title: '',
        width: 44,
        render: (row: any) => (
          <input type="radio" readOnly checked={Number(originTemplateId) === Number(row.id)} />
        )
      },
      {
        key: 'templateName',
        title: <Translate>Template</Translate>,
        flexGrow: 2,
        render: (row: any) => <strong>{row?.templateName ?? '-'}</strong>
      },
      {
        key: 'templateType',
        title: <Translate>Type</Translate>,
        flexGrow: 1,
        render: (row: any) => <span>{formatEnumString(String(row?.templateType ?? '')) || '-'}</span>
      },
      {
        key: 'active',
        title: <Translate>State</Translate>,
        flexGrow: 1,
        render: (row: any) => (
          <MyBadgeStatus color={row?.isActive ? '#16a34a' : '#6b7280'} contant={row?.isActive ? 'Active' : 'Inactive'} />
        )
      }
    ],
    [originTemplateId]
  );

  const replacementTemplatePickColumns = useMemo(
    () => [
      {
        key: 'pick',
        title: '',
        width: 44,
        render: (row: any) => (
          <input type="radio" readOnly checked={Number(replacementTemplateId) === Number(row.id)} />
        )
      },
      {
        key: 'templateName',
        title: <Translate>Template</Translate>,
        flexGrow: 2,
        render: (row: any) => <strong>{row?.templateName ?? '-'}</strong>
      },
      {
        key: 'templateType',
        title: <Translate>Type</Translate>,
        flexGrow: 1,
        render: (row: any) => <span>{formatEnumString(String(row?.templateType ?? '')) || '-'}</span>
      },
      {
        key: 'active',
        title: <Translate>State</Translate>,
        flexGrow: 1,
        render: (row: any) => (
          <MyBadgeStatus color={row?.isActive ? '#16a34a' : '#6b7280'} contant={row?.isActive ? 'Active' : 'Inactive'} />
        )
      }
    ],
    [replacementTemplateId]
  );

  const batchPickColumnsOrigin = useMemo(
    () => [
      {
        key: 'pick',
        title: '',
        width: 44,
        render: (row: any) => (
          <input type="radio" readOnly checked={selectedOriginBatchRowKey === row.rowKey} />
        )
      },
      {
        key: 'applyLabel',
        title: <Translate>Start</Translate>,
        flexGrow: 2,
        render: (row: any) => <span>{row.applyLabel}</span>
      },
      {
        key: 'endLabel',
        title: <Translate>End</Translate>,
        flexGrow: 2,
        render: (row: any) => <span>{row.endLabel}</span>
      },
      {
        key: 'executionStatus',
        title: <Translate>Status</Translate>,
        flexGrow: 2,
        render: (row: any) =>
          row.executionStatus ? (
            <MyBadgeStatus
              color="#64748b"
              contant={formatEnumString(String(row.executionStatus))}
            />
          ) : (
            <span>—</span>
          )
      }
    ],
    [selectedOriginBatchRowKey]
  );

  const batchPickColumnsReplacement = useMemo(
    () => [
      {
        key: 'pick',
        title: '',
        width: 44,
        render: (row: any) => (
          <input type="radio" readOnly checked={selectedReplacementBatchKey === row.rowKey} />
        )
      },
      {
        key: 'applyLabel',
        title: <Translate>Start</Translate>,
        flexGrow: 2,
        render: (row: any) => <span>{row.applyLabel}</span>
      },
      {
        key: 'endLabel',
        title: <Translate>End</Translate>,
        flexGrow: 2,
        render: (row: any) => <span>{row.endLabel}</span>
      },
      {
        key: 'executionStatus',
        title: <Translate>Status</Translate>,
        flexGrow: 2,
        render: (row: any) =>
          row.executionStatus ? (
            <MyBadgeStatus
              color="#64748b"
              contant={formatEnumString(String(row.executionStatus))}
            />
          ) : (
            <span>—</span>
          )
      }
    ],
    [selectedReplacementBatchKey]
  );

  const handleClose = () => {
    setOpen(false);
  };

  const handleNext = () => {
    if (step === 0) {
      if (!originTemplateId || !selectedOriginTemplate) {
        dispatch(notify({ msg: 'Select a template to continue.', sev: 'warning' }));
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!originBatchId) {
        dispatch(notify({ msg: 'Select a generation batch to continue.', sev: 'warning' }));
        return;
      }
      setStep(2);
      return;
    }
    if (step === 3) {
      if (!replacementTemplateId) {
        dispatch(notify({ msg: 'Select a replacement template.', sev: 'warning' }));
        return;
      }
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step === 1) setStep(0);
    else if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  };

  const runBulkCancelForBatch = async () => {
    if (!originBatchId) return;
    const targets = batchAppointmentsAll.filter(row => {
      const d = appointmentStart(row);
      if (!d || !isStrictlyAfterCalendarToday(d)) return false;
      const st = normalizeApptStatus(row);
      return isFreeSlotStatus(st) || isBookedOrConfirmed(st);
    });
    const ids = targets
      .map((row: any) => Number(row?.id ?? row?.key ?? 0))
      .filter((id: number) => Number.isFinite(id) && id > 0);
    if (ids.length === 0) {
      dispatch(notify({ msg: 'No future appointments in this batch match cancel rules.', sev: 'warning' }));
      return;
    }
    showSystemLoader();
    try {
      for (const chunk of chunkArray(ids, 15)) {
        await Promise.all(
          chunk.map(id =>
            cancelAppointment({ id, cancelReason: SYSTEM_CANCEL_REASON }).unwrap()
          )
        );
      }
      dispatch(
        notify({
          msg: `Cancelled ${ids.length} appointment(s). Patients will be notified when supported by the server.`,
          sev: 'success'
        })
      );
      onSuccess?.();
      setConfirmBulkCancelOpen(false);
      handleClose();
    } catch {
      dispatch(notify({ msg: 'Some appointments could not be cancelled.', sev: 'error' }));
    } finally {
      hideSystemLoader();
    }
  };

  const handleApplyBulkReschedule = async () => {
    if (!originBatchId || !replacementBatchId) {
      dispatch(notify({ msg: 'Select a replacement batch.', sev: 'warning' }));
      return;
    }
    if (replacementBatchId === originBatchId) {
      dispatch(notify({ msg: 'Replacement batch must be different from the original batch.', sev: 'warning' }));
      return;
    }
    try {
      const result = await bulkReschedule({
        originalAvailabilityGenerationBatchId: originBatchId,
        replacementAvailabilityGenerationBatchId: replacementBatchId
      }).unwrap();

      if (result.success) {
        setUnmatchedIds([]);
        setStep(5);
        onSuccess?.();
        return;
      }

      const rawUnmatched =
        result.unmatchedAppointmentIds ??
        result.unmatchedOldAppointmentIds ??
        ([] as number[]);
      const list = Array.isArray(rawUnmatched) ? rawUnmatched.filter(n => Number.isFinite(n)) : [];

      if (list.length > 0) {
        setUnmatchedIds(list);
        dispatch(
          notify({
            msg:
              result.message?.trim() ||
              'Not all appointments could be matched to replacement slots. Review step 3.',
            sev: 'warning'
          })
        );
        setStep(2);
        return;
      }

      dispatch(
        notify({
          msg: result.message?.trim() || 'Bulk reschedule did not complete.',
          sev: 'warning'
        })
      );
    } catch {
      dispatch(notify({ msg: 'Bulk reschedule failed.', sev: 'error' }));
    }
  };

  const stepperMeta = WIZARD_STEPS.map((s, index) => ({
    title: s.title,
    isError: step === 2 && unmatchedIds.length > 0 && index === 2
  }));

  const renderBody = () => {
    if (step === 5) {
      return (
        <Panel bordered style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
            <FontAwesomeIcon icon={faCircleCheck} style={{ color: '#16a34a', fontSize: 24 }} />
            <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Reschedule applied successfully</p>
          </div>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            All appointments in this run were handled. You can close this dialog.
          </p>
        </Panel>
      );
    }

    if (step === 0) {
      return (
        <Form fluid layout="vertical">
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
            Published templates (active and inactive). Select one template to continue.
          </p>
          {loadingTemplates ? (
            <Loader center />
          ) : publishedTemplates.length === 0 ? (
            <Panel bordered>No published templates found.</Panel>
          ) : (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
              <MyTable
                columns={templatePickColumns as any}
                data={publishedTemplates}
                loading={loadingTemplates}
                height={420}
                onRowClick={(row: AvailabilityTemplateResponseVM) => {
                  const id = Number(row?.id ?? 0);
                  if (!Number.isFinite(id) || id <= 0) return;
                  setOriginTemplateId(id);
                  const t = publishedTemplates.find(x => Number(x.id) === id) ?? null;
                  setSelectedOriginTemplate(t);
                  setOriginBatchId(null);
                  setSelectedOriginBatchRowKey('');
                }}
                rowClassName={(row: any) =>
                  Number(originTemplateId) === Number(row?.id) ? 'selected-row' : ''
                }
              />
            </div>
          )}
        </Form>
      );
    }

    if (step === 1) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            Select one availability generation batch for this template.
          </p>
          {loadingOriginBatches ? (
            <Loader center />
          ) : originBatchRows.length === 0 ? (
            <Panel bordered>No generation batches found for this template.</Panel>
          ) : (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
              <MyTable
                columns={batchPickColumnsOrigin as any}
                data={originBatchRows}
                loading={loadingOriginBatches}
                height={420}
                onRowClick={(row: any) => {
                  setSelectedOriginBatchRowKey(row.rowKey);
                  setOriginBatchId(Number(row.id));
                }}
                rowClassName={(row: any) =>
                  selectedOriginBatchRowKey === row.rowKey ? 'selected-row' : ''
                }
              />
            </div>
          )}
        </div>
      );
    }

    if (step === 2) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {unmatchedIds.length > 0 ? (
            <Panel bordered style={{ background: '#fffbeb', borderColor: '#fcd34d' }}>
              <strong>Outstanding appointments</strong>
              <p style={{ fontSize: 13, marginTop: 6 }}>
                These appointments could not be matched to replacement slots. Adjust replacement batch or cancel
                appointments, then try again.
              </p>
              <pre
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: 120,
                  overflow: 'auto'
                }}
              >
                {unmatchedIds.join(', ')}
              </pre>
            </Panel>
          ) : null}

          <Panel bordered>
            <p style={{ fontSize: 13, marginBottom: 8 }}>
              Future <strong>BOOKED</strong> and <strong>CONFIRMED</strong> appointments after today (today excluded).
            </p>
            {loadingBatchAppointments ? (
              <Loader center />
            ) : (
              <MyTable
                columns={appointmentPreviewColumns as any}
                data={bookedConfirmedRows}
                height={260}
                loading={loadingBatchAppointments}
              />
            )}
          </Panel>

        </div>
      );
    }

    if (step === 3) {
      return (
        <Form fluid layout="vertical">
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
            Replacement templates with the same configuration as the selected template (same department).
          </p>
          {loadingDepartmentActiveTemplates ? (
            <Loader center />
          ) : replacementCandidates.length === 0 ? (
            <Panel bordered>No matching replacement templates were found.</Panel>
          ) : (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
              <MyTable
                columns={replacementTemplatePickColumns as any}
                data={replacementCandidates}
                loading={loadingDepartmentActiveTemplates}
                height={420}
                onRowClick={(row: AvailabilityTemplateResponseVM) => {
                  const id = Number(row?.id ?? 0);
                  if (!Number.isFinite(id) || id <= 0) return;
                  setReplacementTemplateId(id);
                  setReplacementBatchId(null);
                  setSelectedReplacementBatchKey('');
                }}
                rowClassName={(row: any) =>
                  Number(replacementTemplateId) === Number(row?.id) ? 'selected-row' : ''
                }
              />
            </div>
          )}
        </Form>
      );
    }

    if (step === 4) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            Select the replacement generation batch. This runs the bulk reschedule mapping on save.
          </p>
          {loadingReplacementBatches ? (
            <Loader center />
          ) : replacementBatchRows.length === 0 ? (
            <Panel bordered>No batches found for this replacement template.</Panel>
          ) : (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
              <MyTable
                columns={batchPickColumnsReplacement as any}
                data={replacementBatchRows}
                loading={loadingReplacementBatches}
                height={420}
                onRowClick={(row: any) => {
                  setSelectedReplacementBatchKey(row.rowKey);
                  setReplacementBatchId(Number(row.id));
                }}
                rowClassName={(row: any) =>
                  selectedReplacementBatchKey === row.rowKey ? 'selected-row' : ''
                }
              />
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderFooter = () => {
    if (step === 5) {
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

    if (step === 2) {
      return (
        <Modal.Footer className="footer-modal">
          <Form className="footer-modal-content">
            <MyButton appearance="subtle" onClick={handleClose}>
              Cancel
            </MyButton>
            <MyButton appearance="subtle" onClick={handleBack}>
              Back
            </MyButton>
            <MyButton appearance="primary" onClick={() => setConfirmBulkCancelOpen(true)}>
              Cancel appointments
            </MyButton>
            <MyButton appearance="default" disabled style={{ opacity: 0.65 }}>
              Ask patient by notification (Coming soon)
            </MyButton>
            <MyButton appearance="ghost" onClick={() => setStep(3)}>
              Reschedule
            </MyButton>
          </Form>
        </Modal.Footer>
      );
    }

    if (step === 4) {
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
              disabled={!replacementBatchId}
              onClick={() => void handleApplyBulkReschedule()}
            >
              Apply bulk reschedule
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
          {step !== 4 && (
            <MyButton
              appearance="primary"
              onClick={handleNext}
              disabled={
                (step === 0 && !originTemplateId) ||
                (step === 1 && !originBatchId) ||
                (step === 3 && !replacementTemplateId)
              }
            >
              Next
            </MyButton>
          )}
        </Form>
      </Modal.Footer>
    );
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        size="85vw"
        enforceFocus={step !== 5}
        className={`${mode === 'light' ? 'modal-light' : 'modal-dark'} bulk-reschedule-wizard-modal`}
      >
        <Modal.Header>
          <Modal.Title>
            <FontAwesomeIcon icon={faRightLeft} style={{ marginRight: 8 }} />
            Reschedule
          </Modal.Title>
        </Modal.Header>
        <Divider className="divider-line" />
        <Modal.Body style={{ height: '72vh' }}>
          <MyStepper
            activeStep={step}
            stepsList={stepperMeta.map((s, index) => ({
              key: index,
              value: <Translate>{s.title}</Translate>,
              description: '',
              customIcon: null,
              isError: s.isError || false
            }))}
            modalColor="var(--primary-blue)"
          />
          <br />
          {renderBody()}
        </Modal.Body>
        <Divider className="divider-line" />
        {renderFooter()}
      </Modal>

      <Modal open={confirmBulkCancelOpen} size="xs" onClose={() => setConfirmBulkCancelOpen(false)}>
        <Modal.Header>
          <Modal.Title>Cancel future appointments?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          This will cancel all future free, booked, and confirmed appointments for this batch (today excluded), using the
          reason &quot;{SYSTEM_CANCEL_REASON}&quot;.
        </Modal.Body>
        <Modal.Footer>
          <MyButton appearance="subtle" onClick={() => setConfirmBulkCancelOpen(false)}>
            Back
          </MyButton>
          <MyButton appearance="primary" onClick={() => void runBulkCancelForBatch()}>
            Confirm cancel
          </MyButton>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default BulkRescheduleModal;
