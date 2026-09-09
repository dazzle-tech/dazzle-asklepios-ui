import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Form, Tooltip, Whisper, Popover } from 'rsuite';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserNurse,
  faUserDoctor,
  faFileWaveform,
  faRectangleXmark,
  faEye,
  faRotateLeft,
  faMoneyBillWave,
  faFlag,
  faPause,
  faCircleExclamation,
  faBedPulse,
  faCirclePlay,
  faCommentMedical,
  faPrint,
  faBed
} from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import BedAssignmentModal from '@/pages/encounter/day-case/DayCaseList/BedAssignmentModal';
import {
  useCreateOrGetEmergencyTriageMutation,
  useGetLatestEmergencyTriageByEncounterQuery
} from '@/services/encounters/er-triage/emergencyTriageService';
import {
  useUpdateEncounterMutation,
  useStartTriageEncounterMutation
} from '@/services/encounters/patientEncounterService';
import {
  buildPostPaymentEncounterStatusPatch,
  getEncounterTreatmentStatus,
  POST_PAYMENT_TREATMENT_STATUS
} from '@/utils/encounterStatusHelpers';
import { newPatientInsurance, newPatientPayments } from '@/types/model-types-constructor-new';
import AddPaymentModal from '@/pages/encounter/urgent-care/triage-urgent-care/component/AddPaymentModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import PatientEMRModal from '@/pages/patient/patient-emr/PatientEMRModal';
import VisitReportPrintButton from '@/pages/encounter/encounter-list/VisitReportPrintButton';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import {
  useGetEncounterListQuery,
  useStartEncounterMutation,
  useCancelEncounterMutation,
  useReopenEncounterMutation
} from '@/services/encounters/patientEncounterService';
import { useLazyGetPatientByIdQuery } from '@/services/patient/patientService';
import { useAppSelector } from '@/hooks';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import {
  isEncounterAlreadyOngoingError,
  shouldSkipEncounterStart
} from '@/utils/encounterStatusHelpers';
import { useEnumOptions } from '@/services/enumsApi';
import MyInput from '@/components/MyInput';
import './styles.less';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';
import { useGetAppointableDepartmentsQuery } from '@/services/security/departmentService';
import { useGetActivePractitionersByFacilityQuery } from '@/services/setup/practitioner/PractitionerService';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import PatientWritBandPrintLabelButton from '@/pages/encounter/urgent-care/triage-urgent-care/PatientWritBandPrintLabelButton';

const toISODate = (value: Date | string | null | undefined): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value.toISOString().slice(0, 10);
};

const uniqueNonEmpty = (arr?: any[]): string[] | undefined => {
  if (!arr) return undefined;
  const cleaned = arr
    .filter(value => value !== null && value !== undefined && String(value).trim() !== '')
    .map(value => String(value));
  return cleaned.length ? Array.from(new Set(cleaned)) : undefined;
};

const defaultFilters = {
  ageFrom: '',
  ageTo: '',
  gender: undefined as string | undefined,
  mrnFilter: '',
  documentType: undefined as string | undefined,
  documentNumber: '',
  primaryMobileNumber: '',
  encounterType: undefined as string | undefined,
  encounterNumber: '',
  departmentId: undefined as number | undefined,
  practitionerId: undefined as number | undefined,
  defaultServiceName: '',
  amountFrom: '',
  amountTo: '',
  paymentStatus: undefined as string | undefined,
  coverageType: undefined as string | undefined,
  paymentType: undefined as string | undefined,
  insuranceName: '',
  triageStarted: undefined as boolean | undefined,
  doctorStartedFrom: undefined as Date | undefined,
  doctorStartedTo: undefined as Date | undefined,
  encounterStatusIn: [] as string[],
  treatmentStatusIn: ['ONGOING'] as string[]
};

const EncounterPriorityAction = ({
  rowData,
  encounterPriorityEnumOptions,
  priorityDotColor,
  isPendingPayment,
  onUpdatePriority,
  isReceptionist
}: {
  rowData: any;
  encounterPriorityEnumOptions: any[];
  priorityDotColor: Map<string, string>;
  isPendingPayment: boolean;
  onUpdatePriority: (rowData: any, priorityCode: string) => Promise<boolean>;
  isReceptionist: boolean;
}) => {
  const whisperRef = useRef<any>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const mode = useSelector((state: any) => state.ui.mode);
  const isDark = mode === 'dark';

  const popoverBackground = isDark ? '#0f172a' : '#ffffff';
  const popoverForeground = isDark ? '#e5e7eb' : '#111827';
  const popoverBorder = isDark ? '#334155' : '#e5e7eb';
  const mutedForeground = isDark ? '#94a3b8' : '#64748b';
  const selectedBackground = isDark ? 'rgba(59, 130, 246, 0.16)' : '#eff6ff';
  const selectedBorder = isDark ? '#3b82f6' : '#bfdbfe';

  const selectedPriority = String(rowData?.priorityLevel ?? '');

  const prioritySpeaker = (
    <Popover
      style={{
        backgroundColor: popoverBackground,
        color: popoverForeground,
        border: `1px solid ${popoverBorder}`,
        borderRadius: 12,
        boxShadow: isDark ? '0 12px 32px rgba(0, 0, 0, 0.45)' : '0 12px 32px rgba(15, 23, 42, 0.12)'
      }}
    >
      <div
        style={{
          minWidth: 220,
          display: 'flex',
          flexDirection: 'column',
          padding: 8,
          color: popoverForeground,
          backgroundColor: 'transparent'
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            padding: '4px 6px 10px',
            borderBottom: `1px solid ${popoverBorder}`,
            marginBottom: 8,
            color: popoverForeground
          }}
        >
          Priority
        </div>

        {!encounterPriorityEnumOptions?.length ? (
          <div
            style={{
              padding: 8,
              color: mutedForeground
            }}
          >
            No priority options
          </div>
        ) : (
          encounterPriorityEnumOptions.map((p: any) => {
            const value = String(p?.value ?? '');
            const label = String(p?.label ?? p?.value ?? '');

            const isSelected = selectedPriority === value;

            return (
              <button
                key={value}
                type="button"
                onClick={async (e: any) => {
                  e?.stopPropagation?.();

                  if (!value || saving) {
                    return;
                  }

                  try {
                    setSaving(value);

                    const ok = await onUpdatePriority(rowData, value);

                    if (ok) {
                      whisperRef.current?.close?.();
                    }
                  } finally {
                    setSaving(null);
                  }
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 12px',
                  marginBottom: 6,
                  borderRadius: 8,
                  border: isSelected ? `1px solid ${selectedBorder}` : `1px solid ${popoverBorder}`,
                  backgroundColor: isSelected ? selectedBackground : 'transparent',
                  color: popoverForeground,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    minWidth: 0
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: priorityDotColor.get(value) ?? mutedForeground,
                      flex: '0 0 auto'
                    }}
                  />

                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: popoverForeground
                    }}
                  >
                    {label}
                  </span>
                </span>

                <span
                  style={{
                    fontWeight: 700,
                    color: isSelected ? popoverForeground : mutedForeground,
                    minWidth: 16,
                    textAlign: 'right'
                  }}
                >
                  {saving === value ? '...' : isSelected ? '✓' : ''}
                </span>
              </button>
            );
          })
        )}
      </div>
    </Popover>
  );

  return (
    <Whisper
      ref={whisperRef}
      trigger="click"
      placement="leftStart"
      enterable
      speaker={isPendingPayment ? <Tooltip>Please add payment first</Tooltip> : prioritySpeaker}
    >
      <div
        onClick={(e: any) => {
          e?.stopPropagation?.();
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center'
        }}
      >
        <MyButton size="small" disabled={isReceptionist}>
          <FontAwesomeIcon icon={faCircleExclamation} />
        </MyButton>
      </div>
    </Whisper>
  );
};

const AssignBedAction = ({
  rowData,
  isPendingPayment,
  isReceptionist,
  setLocalEncounter,
  setOpenBedAssignmentModal
}: {
  rowData: any;
  isPendingPayment: boolean;
  isReceptionist: boolean;
  setLocalEncounter: React.Dispatch<React.SetStateAction<any>>;
  setOpenBedAssignmentModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const encounterId = Number(rowData?.id ?? rowData?.encounterId ?? rowData?.key);

  const { data: latestEmergencyTriage } = useGetLatestEmergencyTriageByEncounterQuery(
    encounterId as any,
    {
      skip: Number.isNaN(encounterId)
    }
  );

  const latest = latestEmergencyTriage?.object ?? latestEmergencyTriage;

  const emergencyLevel = latest?.emergencyLevel ?? null;

  const statusUpper = String(
    getEncounterTreatmentStatus(rowData) ?? rowData?.status ?? rowData?.encounterStatus ?? ''
  ).toUpperCase();

  const isTriageStarted = statusUpper === 'TRIAGE_STARTED';

  const disabled = isPendingPayment || !isTriageStarted || !emergencyLevel || isReceptionist;

  const speaker = isPendingPayment ? (
    <Tooltip>Please add payment first</Tooltip>
  ) : !isTriageStarted ? (
    <Tooltip>Assign Bed is only available when triage is started</Tooltip>
  ) : !emergencyLevel ? (
    <Tooltip>Please set Emergency Level first</Tooltip>
  ) : (
    <Tooltip>Assign Bed</Tooltip>
  );

  return (
    <Whisper trigger="hover" placement="top" speaker={speaker}>
      <div>
        <MyButton
          size="small"
          backgroundColor="black"
          disabled={disabled}
          onClick={() => {
            setLocalEncounter(rowData);
            setOpenBedAssignmentModal(true);
          }}
        >
          <FontAwesomeIcon icon={faBedPulse} />
        </MyButton>
      </div>
    </Whisper>
  );
};

const PatientsLists = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const facilityId = authSlice?.tenant?.selectedFacility?.id;
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [appliedFilters, setAppliedFilters] = useState<any>(null);
  const [dateFilter, setDateFilter] = useState({ fromDate: new Date(), toDate: new Date() });
  const [dateFilterKey, setDateFilterKey] = useState(0);
  const [patientSearchApplied, setPatientSearchApplied] = useState({
    searchByField: 'fullName',
    patientName: ''
  });
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedEncounter, setSelectedEncounter] = useState<any>(null);
  const [openCancel, setOpenCancel] = useState(false);
  const [openEMRModal, setOpenEMRModal] = useState(false);
  const [emrPatient, setEmrPatient] = useState<any>(null);
  const [emrEncounter, setEmrEncounter] = useState<any>(null);
  const [localEncounter, setLocalEncounter] = useState<any>(null);
  const [openBedAssignmentModal, setOpenBedAssignmentModal] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentRow, setPaymentRow] = useState<any>(null);
  const [payment, setPayment] = useState<any>({ ...newPatientPayments });
  const [patientInsurance, setPatientInsurance] = useState<any>({
    ...newPatientInsurance
  });

  const startingEncounterIdsRef = useRef<Set<string | number>>(new Set());

  const { data: departmentsResponse } = useGetAppointableDepartmentsQuery(
    {
      facilityId,
      page: 0,
      size: 1000,
      sort: 'name,asc'
    },
    {
      skip: !facilityId
    }
  );

  const { data: practitionersResponse } = useGetActivePractitionersByFacilityQuery(
    {
      facilityId,
      page: 0,
      size: 1000,
      sort: 'id,asc'
    },
    {
      skip: !facilityId
    }
  );

  useEffect(() => {
    dispatch(setPageCode('P_PatientsLists'));
    dispatch(setDivContent('Patients Visit List'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(' '));
    };
  }, [dispatch]);

  const GenderEnum = useEnumOptions('Gender');
  const DocumentTypeEnum = useEnumOptions('DocumentType');
  const EncounterTypeEnum = useEnumOptions('EncounterType');
  const PaymentStatusEnum = useEnumOptions('PaymentStatus');
  const EncounterStatusEnum = useEnumOptions('EncounterStatus');
  const TreatmentStatusEnum = useEnumOptions('TreatmentStatus');
  const CoverageTypeEnum = useEnumOptions('BillingCoverageType');
  const EncounterPriorityEnum = useEnumOptions('EncounterPriority');

  const priorityDotColor = useMemo(() => {
    const palette = ['#16a34a', '#dc2626', '#f97316', '#eab308', '#7c3aed', '#0ea5e9'];

    const map = new Map<string, string>();

    EncounterPriorityEnum.forEach((option: any, index: number) => {
      if (option?.value != null) {
        map.set(String(option.value), palette[index % palette.length]);
      }
    });

    return map;
  }, [EncounterPriorityEnum]);

  const [getPatientById, getPatientState] = useLazyGetPatientByIdQuery();
  const [startEncounter] = useStartEncounterMutation();
  const [cancelEncounter] = useCancelEncounterMutation();
  const [reopenEncounter, { isLoading: reopening }] = useReopenEncounterMutation();
  const [updateEncounter] = useUpdateEncounterMutation();
  const [startTriageEncounter, { isLoading: isStartTriageEncounterLoading }] =
    useStartTriageEncounterMutation();

  const [createOrGetEmergencyTriage] = useCreateOrGetEmergencyTriageMutation();

  const handleUpdateEncounterPriority = useCallback(
    async (rowData: any, priorityCode: string): Promise<boolean> => {
      try {
        const encounterId = rowData?.id ?? null;

        if (!encounterId) {
          return false;
        }

        const body = {
          id: rowData?.id ?? rowData?.key,
          patientId: rowData?.patientId ?? rowData?.patient?.id ?? rowData?.patientObject?.id,

          encounterNumber: rowData?.encounterNumber ?? null,

          facilityId: rowData?.facilityId ?? facilityId ?? null,

          departmentId: rowData?.departmentId ?? null,

          practitionerId: rowData?.practitionerId ?? null,

          encounterType: rowData?.encounterType,

          encounterReason: rowData?.encounterReason,

          followUpEncounterId: rowData?.followUpEncounterId ?? null,

          priorityLevel: priorityCode,

          originType: rowData?.originType ?? null,

          originName: rowData?.originName ?? null,

          notes: rowData?.notes ?? null,

          departmentDailySequenceNumber: rowData?.departmentDailySequenceNumber ?? null,

          encounterDate: rowData?.encounterDate ?? rowData?.plannedStartDate ?? null,

          status: getEncounterTreatmentStatus(rowData) ?? rowData?.status,

          treatmentStatus:
            rowData?.treatmentStatus ?? getEncounterTreatmentStatus(rowData) ?? rowData?.status,

          encounterStatus: rowData?.encounterStatus ?? null,

          chiefComplaint: rowData?.chiefComplaint ?? null,

          hasPrescription: rowData?.hasPrescription ?? false,

          hasOrder: rowData?.hasOrder ?? false,

          isObserved: rowData?.isObserved ?? false
        };

        if (
          body.id == null ||
          body.patientId == null ||
          body.facilityId == null ||
          body.departmentId == null ||
          body.encounterType == null ||
          body.encounterReason == null ||
          body.priorityLevel == null ||
          body.status == null
        ) {
          dispatch(
            notify({
              msg: 'Cannot update encounter: missing required fields',
              sev: 'error'
            })
          );

          return false;
        }

        await updateEncounter({
          id: encounterId,
          body
        }).unwrap();

        dispatch(
          notify({
            msg: 'Priority updated',
            sev: 'success'
          })
        );

        refetch();

        return true;
      } catch (error: any) {
        console.error('Priority update error:', error, {
          rowData,
          priorityCode
        });

        dispatch(
          notify({
            msg: error?.data?.message ?? error?.message ?? 'Failed to update priority',
            sev: 'error'
          })
        );

        return false;
      }
    },
    [updateEncounter, dispatch, refetch, facilityId]
  );

  const {
    data: encountersPaged,
    isLoading,
    isFetching,
    refetch
  } = useGetEncounterListQuery(appliedFilters, {
    skip: !appliedFilters || !facilityId
  });

  const tableData = encountersPaged?.data ?? [];
  const totalCount = encountersPaged?.totalCount ?? 0;

  const normalizedTableData = useMemo(
    () =>
      tableData.map((row: any) => {
        const patientObject = {
          id: row?.patientId ?? null,
          fullName: row?.patientFullName ?? '-',
          medicalRecordNumber: row?.mrn ?? null,
          firstName: row?.patientFullName ?? '',
          lastName: '',
          dateOfBirth: null,
          sexAtBirth: row?.gender ?? '',
          isPrivatePatient: false
        };

        return {
          ...row,
          key: row?.id,
          status: row?.treatmentStatus,
          patientObject,
          patient: patientObject,
          practitionerObject: {
            id: row?.practitionerId ?? null,
            fullName: row?.practitionerName ?? '-'
          },
          patientAge: row?.age ?? null
        };
      }),
    [tableData]
  );

  console.log("normalizedTableData", normalizedTableData);

  const startEncounterSafe = async (row: any) => {
    const encounterId = row?.id;
    if (!encounterId) return false;
    if (shouldSkipEncounterStart(row)) return true;
    if (startingEncounterIdsRef.current.has(encounterId)) return false;

    startingEncounterIdsRef.current.add(encounterId);

    try {
      await startEncounter({ id: encounterId }).unwrap();
      return true;
    } catch (error: any) {
      if (isEncounterAlreadyOngoingError(error)) return true;
      dispatch(
        notify({ msg: error?.data?.message ?? 'Unable to start encounter', sev: 'warning' })
      );
      return false;
    } finally {
      startingEncounterIdsRef.current.delete(encounterId);
    }
  };

  const fetchPatient = async (encounter: any) => {
    const patientId = encounter?.patientId ?? encounter?.patient?.id ?? encounter?.patient?.key;
    if (!patientId) return null;

    try {
      return await getPatientById({ id: patientId }).unwrap();
    } catch {
      dispatch(notify({ msg: 'Failed to load patient data.', sev: 'error' }));
      return null;
    }
  };

  const handleGoToVisit = async (row: any) => {
    const started = await startEncounterSafe(row);
    if (!started) return;

    dispatch(showSystemLoader());

    const patient = await fetchPatient(row);

    dispatch(hideSystemLoader());

    if (!patient) return;

    dispatch(setEncounter(row));
    dispatch(setPatient(patient));

    navigate('/encounter', {
      state: {
        info: 'toEncounter',
        fromPage: 'PatientsLists',
        patient,
        encounter: row,
        edit: false,
        viewMode: 'edit'
      }
    });
  };

  const handleViewVisit = async (row: any) => {
    dispatch(showSystemLoader());
    const patient = await fetchPatient(row);
    dispatch(hideSystemLoader());
    if (!patient) return;

    dispatch(setEncounter(row));
    dispatch(setPatient(patient));
    navigate('/encounter', {
      state: {
        info: 'viewEncounter',
        fromPage: 'PatientsLists',
        patient,
        encounter: row,
        edit: false,
        viewMode: 'readOnly'
      }
    });
  };

  const handleNurseStation = async (row: any) => {
    dispatch(showSystemLoader());

    const patient = await fetchPatient(row);

    dispatch(hideSystemLoader());

    if (!patient) return;

    dispatch(setEncounter(row));
    dispatch(setPatient(patient));

    navigate('/nurse-station', {
      state: {
        patient,
        encounter: row,
        edit: false,
        fromPage: 'PatientsLists',
        viewMode: 'edit'
      }
    });
  };

  const handleReopen = async (id: number) => {
    try {
      await reopenEncounter({ id }).unwrap();
      dispatch(notify({ msg: 'Encounter reopened successfully', sev: 'success' }));
      refetch();
    } catch (error: any) {
      dispatch(
        notify({ msg: error?.data?.message ?? 'Unable to reopen encounter', sev: 'warning' })
      );
    }
  };

  const handleCancel = async () => {
    if (!selectedEncounter) return;
    try {
      await cancelEncounter({ id: selectedEncounter.id }).unwrap();
      dispatch(notify({ msg: 'Cancelled Successfully', sev: 'success' }));
      setOpenCancel(false);
      refetch();
    } catch (error: any) {
      dispatch(notify({ msg: error?.data?.message ?? 'Error cancelling encounter', sev: 'error' }));
    }
  };

  const updateFilter = (key: keyof typeof defaultFilters, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    const today = new Date();

    setPage(0);

    setDateFilter({
      fromDate: today,
      toDate: today
    });

    setDateFilterKey(prev => prev + 1);

    setPatientSearchApplied({
      searchByField: 'fullName',
      patientName: ''
    });

    setFilters({ ...defaultFilters });

    setAppliedFilters({
      facilityId,
      fromDate: toISODate(today),
      toDate: toISODate(today),
      page: 0,
      size: pageSize,
      sort: 'id,desc'
    });
  };

  const handleSearch = () => {
    setPage(0);

    setAppliedFilters({
      facilityId,
      fromDate: toISODate(dateFilter.fromDate),
      toDate: toISODate(dateFilter.toDate),

      patientName:
        patientSearchApplied?.searchByField === 'fullName'
          ? patientSearchApplied?.patientName?.trim() || undefined
          : undefined,

      mrn:
        patientSearchApplied?.searchByField === 'patientMrn'
          ? patientSearchApplied?.patientName?.trim() || undefined
          : filters.mrnFilter.trim() || undefined,

      encounterType: filters.encounterType,

      encounterNumber: filters.encounterNumber.trim() || undefined,

      departmentId: filters.departmentId ?? undefined,

      practitionerId: filters.practitionerId ?? undefined,

      coverageType: filters.coverageType || undefined,

      paymentStatus: filters.paymentStatus || undefined,

      insuranceName: filters.insuranceName.trim() || undefined,

      doctorStartedFrom: filters.doctorStartedFrom
        ? `${toISODate(filters.doctorStartedFrom)}T00:00:00`
        : undefined,

      doctorStartedTo: filters.doctorStartedTo
        ? `${toISODate(filters.doctorStartedTo)}T23:59:59`
        : undefined,

      encounterStatusIn: uniqueNonEmpty(filters.encounterStatusIn),

      treatmentStatusIn: uniqueNonEmpty(filters.treatmentStatusIn),

      page: 0,
      size: pageSize,
      sort: 'id,desc'
    });
  };

  useEffect(() => {
    if (!appliedFilters && facilityId) handleSearch();
  }, [facilityId]);

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
    setAppliedFilters((prev: any) => ({ ...prev, page: newPage, size: pageSize }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(event.target.value, 10);
    setPageSize(size);
    setPage(0);
    setAppliedFilters((prev: any) => ({ ...prev, page: 0, size }));
  };

  const loading = isLoading || isFetching || getPatientState.isLoading;

  useEffect(() => {
    if (loading) {
      dispatch(showSystemLoader());
    } else {
      dispatch(hideSystemLoader());
    }
    return () => dispatch(hideSystemLoader());
  }, [loading, dispatch]);

  const jobRole = String(authSlice.user?.jobRole ?? '').toUpperCase();
  const canSeeNurseStation = jobRole === 'NURSE' || Boolean(authSlice.user?.admin);
  const canSeeDoctorVisit = jobRole === 'PHYSICIAN' || Boolean(authSlice.user?.admin);
  const canSeeEMR = jobRole === 'PHYSICIAN' || Boolean(authSlice.user?.admin);
  const canSeePrint =
    jobRole === 'PHYSICIAN' || jobRole === 'NURSE' || Boolean(authSlice.user?.admin);
  const canSeeCancel =
    jobRole === 'PHYSICIAN' || jobRole === 'NURSE' || Boolean(authSlice.user?.admin);
  const isReceptionist = jobRole === 'RECEPTIONIST';
  const departmentOptions = useMemo(
    () =>
      (departmentsResponse?.data ?? []).map((department: any) => ({
        label: department?.name ?? '-',
        value: department?.id
      })),
    [departmentsResponse]
  );

  const practitionerOptions = useMemo(
    () =>
      (practitionersResponse?.data ?? []).map((practitioner: any) => ({
        label: [practitioner?.firstName, practitioner?.lastName].filter(Boolean).join(' ') || '-',
        value: practitioner?.id
      })),
    [practitionersResponse]
  );

  const minEncounterDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 31);
    return date;
  }, []);

  const mainSearchFilters = (
    <div style={{ marginTop: 15 }}>
      <Form fluid className="search-patient-criteria-handle-position-row">
        <MyInput
          key={`fromDate-${dateFilterKey}`}
          column
          width={'13vw'}
          fieldType="date"
          fieldLabel="Encounter Date From"
          fieldName="fromDate"
          record={dateFilter}
          setRecord={setDateFilter}
          minDate={minEncounterDate}
        />

        <MyInput
          key={`toDate-${dateFilterKey}`}
          column
          width={'13vw'}
          fieldType="date"
          fieldLabel="Encounter Date To"
          fieldName="toDate"
          record={dateFilter}
          setRecord={setDateFilter}
        />

        <div style={{ marginTop: 8 }}>
          <SearchPatientCriteria
            record={patientSearchApplied}
            setRecord={setPatientSearchApplied}
            onSearchClick={() => { }}
          />
        </div>
        <MyInput
          column
          width={'13vw'}
          fieldType="text"
          fieldLabel="Encounter Number"
          fieldName="encounterNumber"
          record={{ encounterNumber: filters.encounterNumber }}
          setRecord={(value: any) => updateFilter('encounterNumber', value?.encounterNumber ?? '')}
        />

        <MyInput
          column
          width={'13vw'}
          fieldType="select"
          fieldLabel="Encounter Type"
          fieldName="encounterType"
          record={{ encounterType: filters.encounterType }}
          setRecord={(value: any) =>
            updateFilter('encounterType', value?.encounterType || undefined)
          }
          selectData={EncounterTypeEnum}
          selectDataLabel="label"
          selectDataValue="value"
          searchable
        />

        <MyInput
          column
          width={'15vw'}
          fieldType="select"
          fieldLabel="Department"
          fieldName="departmentId"
          record={{ departmentId: filters.departmentId }}
          setRecord={(value: any) =>
            updateFilter(
              'departmentId',
              value?.departmentId ? Number(value.departmentId) : undefined
            )
          }
          selectData={departmentOptions}
          selectDataLabel="label"
          selectDataValue="value"
          searchable
        />

        <MyInput
          column
          width={'15vw'}
          fieldType="select"
          fieldLabel="Practitioner"
          fieldName="practitionerId"
          record={{ practitionerId: filters.practitionerId }}
          setRecord={(value: any) =>
            updateFilter(
              'practitionerId',
              value?.practitionerId ? Number(value.practitionerId) : undefined
            )
          }
          selectData={practitionerOptions}
          selectDataLabel="label"
          selectDataValue="value"
          searchable
        />

        <MyInput
          column
          width={'13vw'}
          fieldType="select"
          fieldLabel="Coverage Type"
          fieldName="coverageType"
          record={{
            coverageType: filters.coverageType
          }}
          setRecord={(value: any) => updateFilter('coverageType', value?.coverageType || undefined)}
          selectData={CoverageTypeEnum}
          selectDataLabel="label"
          selectDataValue="value"
          searchable
        />

        <MyInput
          column
          width={'15vw'}
          fieldType="text"
          fieldLabel="Insurance Name"
          fieldName="insuranceName"
          record={{
            insuranceName: filters.insuranceName
          }}
          setRecord={(value: any) => updateFilter('insuranceName', value?.insuranceName ?? '')}
        />

        <MyInput
          column
          width={'13vw'}
          fieldType="select"
          fieldLabel="Payment Status"
          fieldName="paymentStatus"
          record={{
            paymentStatus: filters.paymentStatus
          }}
          setRecord={(value: any) =>
            updateFilter('paymentStatus', value?.paymentStatus || undefined)
          }
          selectData={PaymentStatusEnum}
          selectDataLabel="label"
          selectDataValue="value"
          searchable
        />

        <MyInput
          column
          width={'15vw'}
          fieldType="checkPicker"
          fieldLabel="Encounter Status"
          fieldName="encounterStatusIn"
          record={{
            encounterStatusIn: filters.encounterStatusIn
          }}
          setRecord={(value: any) => {
            const values = Array.isArray(value) ? value : value?.encounterStatusIn;

            updateFilter('encounterStatusIn', Array.isArray(values) ? values.map(String) : []);
          }}
          selectData={EncounterStatusEnum}
          selectDataLabel="label"
          selectDataValue="value"
          searchable
        />

        <MyInput
          column
          width={'15vw'}
          fieldType="checkPicker"
          fieldLabel="Treatment Status"
          fieldName="treatmentStatusIn"
          record={{
            treatmentStatusIn: filters.treatmentStatusIn
          }}
          setRecord={(value: any) => {
            const values = Array.isArray(value) ? value : value?.treatmentStatusIn;

            updateFilter('treatmentStatusIn', Array.isArray(values) ? values.map(String) : []);
          }}
          selectData={TreatmentStatusEnum}
          selectDataLabel="label"
          selectDataValue="value"
          searchable
        />
      </Form>
    </div>
  );

  const searchFiltersContent = (
    <div style={{ marginTop: 15 }}>
      <Form layout="inline" fluid>
        <MyInput
          key={`doctorStartedFrom-${dateFilterKey}`}
          column
          width={'13vw'}
          fieldType="date"
          fieldLabel="Doctor Start From"
          fieldName="doctorStartedFrom"
          record={{
            doctorStartedFrom: filters.doctorStartedFrom
          }}
          setRecord={(value: any) =>
            updateFilter(
              'doctorStartedFrom',
              value?.doctorStartedFrom ? new Date(value.doctorStartedFrom) : undefined
            )
          }
        />

        <MyInput
          key={`doctorStartedTo-${dateFilterKey}`}
          column
          width={'13vw'}
          fieldType="date"
          fieldLabel="Doctor Start To"
          fieldName="doctorStartedTo"
          record={{
            doctorStartedTo: filters.doctorStartedTo
          }}
          setRecord={(value: any) =>
            updateFilter(
              'doctorStartedTo',
              value?.doctorStartedTo ? new Date(value.doctorStartedTo) : undefined
            )
          }
        />
      </Form>
    </div>
  );

  const handleGoToTriage = async (encounterData: any, patientData: any) => {
    try {
      const encounterId = encounterData?.id;

      const patientId = Number(patientData?.id ?? patientData?.patientId ?? patientData?.key);

      const statusUpper = getEncounterTreatmentStatus(encounterData);

      if (
        statusUpper !== 'TRIAGE_STARTED' &&
        typeof encounterId === 'number' &&
        !Number.isNaN(encounterId)
      ) {
        await startTriageEncounter({
          id: encounterId
        }).unwrap();
      }

      const emergencyTriageNew =
        typeof encounterId === 'number' &&
          !Number.isNaN(encounterId) &&
          typeof patientId === 'number' &&
          !Number.isNaN(patientId)
          ? await createOrGetEmergencyTriage({
            encounterId,
            patientId
          }).unwrap()
          : null;

      navigate('/urgent-care-start-triage', {
        state: {
          info: 'to_Urgent_Care_Start_Triage',
          fromPage: 'urgent-care-triage',
          patient: patientData,
          encounter: encounterData,
          emergencyTriageNew
        }
      });
    } catch (error: any) {
      console.error('Start triage error:', error);

      const errorKey = error?.message ?? error?.data?.message ?? '';

      let readableMessage = 'Failed to start triage';

      if (errorKey === 'error.patient.emergency.notAllowed.withOngoing') {
        readableMessage =
          'Cannot start a new triage because the patient already has an ongoing encounter.';
      } else if (errorKey) {
        readableMessage = errorKey.replaceAll('.', ' ');
      }

      dispatch(
        notify({
          msg: readableMessage,
          sev: 'error'
        })
      );
    }
  };

  const handleGoToViewTriage = async (encounterData: any, patientData: any) => {
    navigate('/urgent-care-view-triage', {
      state: {
        from: 'Urgent_Care_List',
        info: 'toUrgentCareViewTriage',
        patient: patientData,
        encounter: encounterData
      }
    });
  };

  const handleAddPayment = async (rowData: any): Promise<boolean> => {
    setPaymentRow(rowData);

    setPayment({
      ...newPatientPayments
    });

    setPatientInsurance({
      ...newPatientInsurance
    });

    setPaymentModalOpen(true);

    return true;
  };

  const handleSetPaymentModalOpen = (open: boolean) => {
    setPaymentModalOpen(open);

    if (!open) {
      setPaymentRow(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'patient',
        title: 'PATIENT',
        flexGrow: 1,
        render: (row: any) => (
          <Whisper
            trigger="hover"
            placement="top"
            speaker={
              <Tooltip>
                <div>
                  <strong>{row?.patientFullName ?? '-'}</strong>
                </div>

                <div>MRN: {row?.mrn ?? '-'}</div>

                <div>Age: {row?.age != null ? `${row.age} years` : '-'}</div>

                <div>Gender: {formatEnumString(row?.gender) || '-'}</div>
              </Tooltip>
            }
          >
            <span
              className="encounter-patient-cell"
              style={{
                cursor: 'pointer',
                display: 'inline-block',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {row?.patientFullName ?? '-'}
            </span>
          </Whisper>
        )
      },
      {
        key: 'documentType',
        title: 'DOCUMENT TYPE',
        render: (row: any) => (
          <span className="encounter-text-cell">{formatEnumString(row?.documentType) || '-'}</span>
        )
      },

      {
        key: 'documentNumber',
        title: 'DOCUMENT NUMBER',
        render: (row: any) => (
          <span className="encounter-text-cell">{row?.documentNumber ?? '-'}</span>
        )
      },

      {
        key: 'primaryMobileNumber',
        title: 'MOBILE',
        render: (row: any) => (
          <span className="encounter-text-cell">{row?.primaryMobileNumber ?? '-'}</span>
        )
      },

      {
        key: 'encounterType',
        title: 'ENCOUNTER TYPE',
        render: (row: any) => (
          <span className="encounter-type-badge">
            {formatEnumString(row?.encounterType) || '-'}
          </span>
        )
      },

      {
        key: 'encounterNumber',
        title: 'ENCOUNTER #',
        render: (row: any) => (
          <span className="encounter-number-cell">{row?.encounterNumber ?? '-'}</span>
        )
      },

      {
        key: 'encounterDate',
        title: 'ENCOUNTER DATE',
        render: (row: any) => {
          if (!row?.encounterDate) return '-';

          const time = row?.encounterTime ? String(row.encounterTime).slice(0, 5) : '';

          return (
            <div className="encounter-date-cell">
              <div className="encounter-date">{row.encounterDate}</div>

              {time && <div className="encounter-time">{time}</div>}
            </div>
          );
        }
      },
      {
        key: 'departmentName',
        title: 'DEPARTMENT',
        flexGrow: 1,
        render: (row: any) => (
          <Whisper
            trigger="hover"
            placement="top"
            speaker={<Tooltip>{row?.departmentName ?? '-'}</Tooltip>}
          >
            <span
              className="encounter-text-cell"
              style={{
                cursor: 'pointer',
                display: 'block',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {row?.departmentName ?? '-'}
            </span>
          </Whisper>
        )
      },
      {
        key: 'practitionerName',
        title: 'PRACTITIONER',
        render: (row: any) => (
          <div className="practitioner-cell">
            <span className="practitioner-name">{row?.practitionerName ?? '-'}</span>
          </div>
        )
      },

      {
        key: 'defaultServiceName',
        title: 'SERVICE',
        render: (row: any) => (
          <span className="encounter-text-cell">{row?.defaultServiceName ?? '-'}</span>
        )
      },

      {
        key: 'amount',
        title: 'AMOUNT',
        render: (row: any) => (
          <span className="amount-cell">{row?.amount != null ? row.amount : '-'}</span>
        )
      },

      {
        key: 'paymentStatus',
        title: 'PAYMENT STATUS',
        render: (row: any) => {
          const status = String(row?.paymentStatus ?? '').toUpperCase();

          const paymentStatusColors: Record<string, string> = {
            PAID: '#198754',
            COMPLETED: '#198754',
            PENDING: '#fd7e14',
            PENDING_PAYMENT: '#fd7e14',
            FAILED: '#dc3545',
            CANCELLED: '#dc3545',
            REFUNDED: '#6f42c1'
          };

          return (
            <MyBadgeStatus
              contant={formatEnumString(status) || '-'}
              color={paymentStatusColors[status] ?? '#969fb0'}
            />
          );
        }
      },

      {
        key: 'coverageType',
        title: 'COVERAGE TYPE',
        render: (row: any) => {
          const coverage = String(row?.coverageType ?? '').toUpperCase();

          const coverageColors: Record<string, string> = {
            INSURANCE: '#0d6efd',
            SELF_PAY: '#6f42c1',
            CORPORATE: '#198754'
          };

          return (
            <MyBadgeStatus
              contant={formatEnumString(coverage) || '-'}
              color={coverageColors[coverage] ?? '#969fb0'}
            />
          );
        }
      },

      {
        key: 'insuranceName',
        title: 'INSURANCE',
        render: (row: any) => (
          <span className="encounter-text-cell">{row?.insuranceName ?? '-'}</span>
        )
      },

      {
        key: 'triageStarted',
        title: 'TRIAGE',
        render: (row: any) =>
          row?.triageStarted ? (
            <MyBadgeStatus contant="YES" color="#45b887" />
          ) : (
            <MyBadgeStatus contant="NO" color="#969fb0" />
          )
      },

      {
        key: 'doctorStartDateTime',
        title: 'DOCTOR START',
        render: (row: any) => {
          if (!row?.doctorStartDateTime) {
            return '-';
          }

          return (
            <div className="encounter-date-cell">
              <div className="encounter-date">
                {formatDateWithoutSeconds(row.doctorStartDateTime)}
              </div>
            </div>
          );
        }
      },

      {
        key: 'encounterStatus',
        title: 'ENCOUNTER STATUS',
        render: (row: any) => {
          const status = String(row?.encounterStatus ?? '').toUpperCase();

          const statusColorMap: Record<string, string> = {
            NEW: '#0d6efd',
            ACTIVE: '#198754',
            ONGOING: '#198754',
            IN_PROGRESS: '#198754',
            COMPLETED: '#6c757d',
            CLOSED: '#6c757d',
            CANCELLED: '#dc3545',
            CANCELED: '#dc3545',
            PENDING: '#fd7e14',
            PENDING_PAYMENT: '#fd7e14'
          };

          return (
            <MyBadgeStatus
              contant={formatEnumString(status) || '-'}
              color={statusColorMap[status] ?? '#969fb0'}
            />
          );
        }
      },

      {
        key: 'treatmentStatus',
        title: 'TREATMENT STATUS',
        render: (row: any) => {
          const status = String(row?.treatmentStatus ?? '').toUpperCase();

          const treatmentStatusColorMap: Record<string, string> = {
            NEW: '#0d6efd',
            ONGOING: '#198754',
            COMPLETED: '#6c757d',
            DISCHARGED: '#6c757d',
            CANCELLED: '#dc3545',
            CANCELED: '#dc3545',
            PENDING_PAYMENT: '#fd7e14',
            WAITING_TRIAGE: '#ffc107',
            TRIAGE_STARTED: '#0dcaf0',
            IN_OPERATION: '#6f42c1'
          };

          return (
            <MyBadgeStatus
              contant={formatEnumString(status) || '-'}
              color={treatmentStatusColorMap[status] ?? '#969fb0'}
            />
          );
        }
      },
      {
        key: 'actions',
        title: 'ACTIONS',

        render: (row: any) => {
          const status = String(
            getEncounterTreatmentStatus(row) ??
            row?.status ??
            row?.encounterStatus ??
            ''
          ).toUpperCase();

          const encounterType = String(
            row?.encounterType ?? ''
          ).toUpperCase();

          const isEmergency = encounterType === 'EMERGENCY';
          const isClinic = encounterType === 'CLINIC';

          const isNew = status === 'NEW';
          const isPendingPayment = status === 'PENDING_PAYMENT';
          const isTriageStarted = status === 'TRIAGE_STARTED';
          const isWaitingTriage = status === 'WAITING_TRIAGE';
          const isOngoing = status === 'ONGOING';
          const isAssignedToBed = status === 'ASSIGNED_TO_BED';
          const isCompleted = status === 'COMPLETED';
          const isDischarged = status === 'DISCHARGED';
          const isCancelled =
            status === 'CANCELLED' || status === 'CANCELED';
          const isSentToEr = status === 'SENT_TO_ER';

          const isEmergencyTriageWorkflow =
            isEmergency &&
            [
              'NEW',
              'WAITING_TRIAGE',
              'PENDING_PAYMENT',
              'TRIAGE_STARTED',
              'SENT_TO_ER'
            ].includes(status);

          const isEmergencyListWorkflow =
            isEmergency &&
            [
              'ONGOING',
              'ASSIGNED_TO_BED',
              'COMPLETED',
              'DISCHARGED',
              'CANCELLED',
              'CANCELED'
            ].includes(status);

          const showEmergencyPriority =
            isEmergencyTriageWorkflow &&
            [
              'NEW',
              'WAITING_TRIAGE',
              'TRIAGE_STARTED'
            ].includes(status) &&
            !isPendingPayment;

          const showEmergencyStartTriage =
            isEmergencyTriageWorkflow &&
            [
              'NEW',
              'WAITING_TRIAGE',
              'TRIAGE_STARTED'
            ].includes(status);

          const showEmergencyViewTriage =
            isEmergencyTriageWorkflow &&
            [
              'SENT_TO_ER'
            ].includes(status);

          const showEmergencyAddPayment =
            isEmergencyTriageWorkflow &&
            isPendingPayment;

          const showClinicAddPayment =
            isClinic &&
            isPendingPayment;

          const showEmergencyWristband =
            isEmergencyTriageWorkflow &&
            !isPendingPayment;

          const showEmergencyAssignBed =
            isEmergencyTriageWorkflow &&
            isTriageStarted &&
            !isPendingPayment;

          const showEmergencyTriageCancel =
            isEmergencyTriageWorkflow &&
            canSeeCancel &&
            !row?.isObserved &&
            [
              'NEW',
              'WAITING_TRIAGE',
              'PENDING_PAYMENT'
            ].includes(status);

          const isEncounterClosed =
            String(row?.encounterStatus ?? '').toUpperCase() === 'CLOSED';

          const emergencyListViewOnly =
            isCompleted || isCancelled || isEncounterClosed;

          const showEmergencyListViewTriage =
            isEmergencyListWorkflow;

          const showEmergencyListViewVisit =
            isEmergencyListWorkflow &&
            canSeeDoctorVisit &&
            (
              isCompleted ||
              isDischarged ||
              isCancelled
            );

          const showEmergencyListGoToVisit =
            isEmergencyListWorkflow &&
            canSeeDoctorVisit &&
            !emergencyListViewOnly;

          const showEmergencyListNurseStation =
            isEmergencyListWorkflow &&
            canSeeNurseStation &&
            !emergencyListViewOnly;

          const showEmergencyListEMR =
            isEmergencyListWorkflow &&
            canSeeEMR;

          const showEmergencyListReopen =
            isEmergencyListWorkflow &&
            (
              isCompleted ||
              isDischarged
            );

          const showEmergencyListCancel =
            isEmergencyListWorkflow &&
            canSeeCancel &&
            isNew &&
            !row?.isObserved;


const clinicViewOnly =
  isCompleted || isCancelled || isPendingPayment;

          const showClinicNurseStation =
            isClinic &&
            canSeeNurseStation &&
            !clinicViewOnly;

          const showClinicViewVisit =
            isClinic &&
            canSeeDoctorVisit &&
            clinicViewOnly;

          const showClinicDoctorVisit =
            isClinic &&
            canSeeDoctorVisit &&
            !clinicViewOnly;

          const showClinicEMR =
            isClinic &&
            canSeeEMR;

          const showClinicCancel =
            isClinic &&
            canSeeCancel &&
            isNew &&
            !row?.isObserved;

          const showClinicReopen =
            isClinic &&
            (
              isCompleted ||
              isDischarged
            );

          const showClinicPrint =
            isClinic &&
            canSeePrint;

          return (
            <Form
              layout="inline"
              fluid
              className="nurse-doctor-form-actions"
            >

              {isEmergencyTriageWorkflow && canSeeEMR && (
                <Whisper
                  trigger="hover"
                  placement="top"
                  speaker={
                    <Tooltip>
                      {isPendingPayment
                        ? 'Please add payment first'
                        : 'Go to EMR'}
                    </Tooltip>
                  }
                >
                  <div>
                    <MyButton
                      size="small"
                      backgroundColor="#6f42c1"
                      disabled={
                        isPendingPayment ||
                        isReceptionist
                      }
                      onClick={() => {
                        if (
                          isPendingPayment ||
                          isReceptionist
                        ) {
                          return;
                        }

                        setSelectedEncounter(row);

                        const patient =
                          row?.patientObject ??
                          row?.patient ??
                          null;

                        setEmrEncounter(row);
                        setEmrPatient(patient);

                        dispatch(setEncounter(row));

                        if (patient) {
                          dispatch(setPatient(patient));
                        }

                        setOpenEMRModal(true);
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faFileWaveform}
                      />
                    </MyButton>
                  </div>
                </Whisper>
              )}

              {(showEmergencyAddPayment || showClinicAddPayment) && (
                <Whisper
                  trigger="hover"
                  placement="top"
                  speaker={<Tooltip>Add Payment</Tooltip>}
                >
                  <div>
                    <MyButton
                      size="small"
                      backgroundColor="green"
                      onClick={() => {
                        void handleAddPayment(row);
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faMoneyBillWave}
                      />
                    </MyButton>
                  </div>
                </Whisper>
              )}

              {showEmergencyPriority && (
                <EncounterPriorityAction
                  rowData={row}
                  encounterPriorityEnumOptions={
                    EncounterPriorityEnum
                  }
                  priorityDotColor={priorityDotColor}
                  isPendingPayment={isPendingPayment}
                  onUpdatePriority={
                    handleUpdateEncounterPriority
                  }
                  isReceptionist={isReceptionist}
                />
              )}

              {showEmergencyStartTriage && (
                <Whisper
                  trigger="hover"
                  placement="top"
                  speaker={
                    <Tooltip>
                      {isPendingPayment
                        ? 'Please add payment first'
                        : status === 'TRIAGE_STARTED'
                          ? 'Resume Triage'
                          : 'Start Triage'}
                    </Tooltip>
                  }
                >
                  <div>
                    <MyButton
                      size="small"
                      backgroundColor="black"
                      disabled={
                        isReceptionist ||
                        isPendingPayment ||
                        (
                          status !== 'TRIAGE_STARTED' &&
                          !row?.priorityLevel
                        )
                      }
                      onClick={() => {
                        setSelectedEncounter(row);

                        const patient =
                          row?.patientObject ??
                          row?.patient ??
                          null;

                        void handleGoToTriage(
                          row,
                          patient
                        );
                      }}
                    >
                      <FontAwesomeIcon
                        icon={
                          status === 'TRIAGE_STARTED'
                            ? faPause
                            : faCirclePlay
                        }
                      />
                    </MyButton>
                  </div>
                </Whisper>
              )}

              {showEmergencyViewTriage && (
                <Whisper
                  trigger="hover"
                  placement="top"
                  speaker={<Tooltip>View Triage</Tooltip>}
                >
                  <div>
                    <MyButton
                      size="small"
                      backgroundColor="#0d6efd"
                      disabled={isReceptionist}
                      onClick={() => {
                        setSelectedEncounter(row);

                        const patient =
                          row?.patientObject ??
                          row?.patient ??
                          null;

                        void handleGoToViewTriage(
                          row,
                          patient
                        );
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faCommentMedical}
                      />
                    </MyButton>
                  </div>
                </Whisper>
              )}

              {showEmergencyWristband && (
                <div>
                  <PatientWritBandPrintLabelButton
                    patientId={row?.patientId}
                    disabled={
                      isPendingPayment ||
                      isReceptionist
                    }
                  />
                </div>
              )}

              {showEmergencyAssignBed && (
                <AssignBedAction
                  rowData={row}
                  isPendingPayment={
                    isPendingPayment
                  }
                  isReceptionist={isReceptionist}
                  setLocalEncounter={
                    setLocalEncounter
                  }
                  setOpenBedAssignmentModal={
                    setOpenBedAssignmentModal
                  }
                />
              )}

              {showEmergencyTriageCancel && (
                <Whisper
                  trigger="hover"
                  placement="top"
                  speaker={<Tooltip>Cancel Visit</Tooltip>}
                >
                  <div>
                    <MyButton
                      size="small"
                      backgroundColor="#dc3545"
                      disabled={isReceptionist}
                      onClick={() => {
                        setSelectedEncounter(row);
                        setOpenCancel(true);
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faRectangleXmark}
                      />
                    </MyButton>
                  </div>
                </Whisper>
              )}

              {showEmergencyListViewTriage && (
                <Whisper
                  trigger="hover"
                  placement="top"
                  speaker={<Tooltip>View Triage</Tooltip>}
                >
                  <div>
                    <MyButton
                      size="small"
                      backgroundColor="#0d6efd"
                      disabled={isReceptionist}
                      onClick={() => {
                        setSelectedEncounter(row);

                        const patient =
                          row?.patientObject ??
                          row?.patient ??
                          null;

                        void handleGoToViewTriage(
                          row,
                          patient
                        );
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faCommentMedical}
                      />
                    </MyButton>
                  </div>
                </Whisper>
              )}

              {showEmergencyListViewVisit && (
                <Whisper
                  trigger="hover"
                  placement="top"
                  speaker={<Tooltip>View Visit</Tooltip>}
                >
                  <div>
                    <MyButton
                      size="small"
                      backgroundColor="gray"
                      onClick={() => {
                        setSelectedEncounter(row);
                        void handleViewVisit(row);
                      }}
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </MyButton>
                  </div>
                </Whisper>
              )}

              {showEmergencyListGoToVisit && (
                <Whisper
                  trigger="hover"
                  placement="top"
                  speaker={<Tooltip>Go to Visit</Tooltip>}
                >
                  <div>
                    <MyButton
                      size="small"
                      backgroundColor="#0d6efd"
                      onClick={() => {
                        setSelectedEncounter(row);
                        void handleGoToVisit(row);
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faUserDoctor}
                      />
                    </MyButton>
                  </div>
                </Whisper>
              )}

              {showEmergencyListNurseStation && (
                <Whisper
                  trigger="hover"
                  placement="top"
                  speaker={<Tooltip>Nurse Station</Tooltip>}
                >
                  <div>
                    <MyButton
                      size="small"
                      backgroundColor="black"
                      onClick={() => {
                        setSelectedEncounter(row);
                        void handleNurseStation(row);
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faUserNurse}
                      />
                    </MyButton>
                  </div>
                </Whisper>
              )}

              {showEmergencyListEMR && (
                <Whisper
                  trigger="hover"
                  placement="top"
                  speaker={<Tooltip>Go to EMR</Tooltip>}
                >
                  <div>
                    <MyButton
                      size="small"
                      backgroundColor="#6f42c1"
                      onClick={() => {
                        setSelectedEncounter(row);

                        const patient =
                          row?.patientObject ??
                          row?.patient ??
                          null;

                        setEmrEncounter(row);
                        setEmrPatient(patient);

                        dispatch(setEncounter(row));

                        if (patient) {
                          dispatch(setPatient(patient));
                        }

                        setOpenEMRModal(true);
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faFileWaveform}
                      />
                    </MyButton>
                  </div>
                </Whisper>
              )}

              {showEmergencyListReopen && (
                <Whisper
                  trigger="hover"
                  placement="top"
                  speaker={<Tooltip>Reopen Encounter</Tooltip>}
                >
                  <div>
                    <MyButton
                      size="small"
                      backgroundColor="#0d6efd"
                      loading={reopening}
                      onClick={() => {
                        void handleReopen(row.id);
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faRotateLeft}
                      />
                    </MyButton>
                  </div>
                </Whisper>
              )}

              {showEmergencyListCancel && (
                <Whisper
                  trigger="hover"
                  placement="top"
                  speaker={<Tooltip>Cancel Visit</Tooltip>}
                >
                  <div>
                    <MyButton
                      size="small"
                      backgroundColor="#dc3545"
                      disabled={isReceptionist}
                      onClick={() => {
                        setSelectedEncounter(row);
                        setOpenCancel(true);
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faRectangleXmark}
                      />
                    </MyButton>
                  </div>
                </Whisper>
              )}

              {showClinicNurseStation && (
                <Whisper
                  trigger="hover"
                  placement="top"
                  speaker={<Tooltip>Nurse Station</Tooltip>}
                >
                  <div>
                    <MyButton
                      size="small"
                      backgroundColor="black"
                      onClick={() => {
                        setSelectedEncounter(row);
                        void handleNurseStation(row);
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faUserNurse}
                      />
                    </MyButton>
                  </div>
                </Whisper>
              )}

              {showClinicViewVisit && (
                <Whisper
                  trigger="hover"
                  placement="top"
                  speaker={<Tooltip>View Visit</Tooltip>}
                >
                  <div>
                    <MyButton
                      size="small"
                      backgroundColor="gray"
                      onClick={() => {
                        setSelectedEncounter(row);
                        void handleViewVisit(row);
                      }}
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </MyButton>
                  </div>
                </Whisper>
              )}

              {showClinicDoctorVisit && (
                <Whisper
                  trigger="hover"
                  placement="top"
                  speaker={<Tooltip>Go to Visit</Tooltip>}
                >
                  <div>
                    <MyButton
                      size="small"
                      backgroundColor="#0d6efd"
                      onClick={() => {
                        setSelectedEncounter(row);
                        void handleGoToVisit(row);
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faUserDoctor}
                      />
                    </MyButton>
                  </div>
                </Whisper>
              )}

              {showClinicEMR && (
                <Whisper
                  trigger="hover"
                  placement="top"
                  speaker={<Tooltip>Go to EMR</Tooltip>}
                >
                  <div>
                    <MyButton
                      size="small"
                      backgroundColor="#6f42c1"
                      onClick={() => {
                        setSelectedEncounter(row);

                        const patient =
                          row?.patientObject ??
                          row?.patient ??
                          null;

                        setEmrEncounter(row);
                        setEmrPatient(patient);

                        dispatch(setEncounter(row));

                        if (patient) {
                          dispatch(setPatient(patient));
                        }

                        setOpenEMRModal(true);
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faFileWaveform}
                      />
                    </MyButton>
                  </div>
                </Whisper>
              )}

              {showClinicCancel && (
                <Whisper
                  trigger="hover"
                  placement="top"
                  speaker={<Tooltip>Cancel Visit</Tooltip>}
                >
                  <div>
                    <MyButton
                      size="small"
                      backgroundColor="#dc3545"
                      disabled={isReceptionist}
                      onClick={() => {
                        setSelectedEncounter(row);
                        setOpenCancel(true);
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faRectangleXmark}
                      />
                    </MyButton>
                  </div>
                </Whisper>
              )}

              {showClinicReopen && (
                <Whisper
                  trigger="hover"
                  placement="top"
                  speaker={<Tooltip>Reopen Encounter</Tooltip>}
                >
                  <div>
                    <MyButton
                      size="small"
                      backgroundColor="#0d6efd"
                      loading={reopening}
                      onClick={() => {
                        void handleReopen(row.id);
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faRotateLeft}
                      />
                    </MyButton>
                  </div>
                </Whisper>
              )}

              {showClinicPrint && (
                <div>
                  <VisitReportPrintButton row={row} />
                </div>
              )}

            </Form>
          );
        },

        expandable: false
      }
    ],
    [
      canSeeCancel,
      canSeeDoctorVisit,
      canSeeEMR,
      canSeeNurseStation,
      canSeePrint,
      reopening,
      EncounterPriorityEnum,
      priorityDotColor,
      handleUpdateEncounterPriority,
      isReceptionist
    ]
  );

  const tableFilters = (
    <>
      {mainSearchFilters}

      <AdvancedSearchFilters
        searchOnClick={handleSearch}
        clearOnClick={handleClearFilters}
        content={searchFiltersContent}
      />
    </>
  );

  return (
    <>
      <MyTable
        data={normalizedTableData}
        columns={columns}
        loading={loading}
        filters={tableFilters}
        page={page}
        rowsPerPage={pageSize}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onRowClick={row => setSelectedEncounter(row)}
      />

      <DeletionConfirmationModal
        open={openCancel}
        setOpen={setOpenCancel}
        actionButtonFunction={handleCancel}
        actionType="Deactivate"
        confirmationQuestion={'Do you want to cancel this Encounter?'}
        actionButtonLabel="Cancel"
        cancelButtonLabel="Close"
      />

      <AddPaymentModal
        open={paymentModalOpen}
        setOpen={handleSetPaymentModalOpen}
        paymentRow={paymentRow}
        payment={payment}
        setPayment={setPayment}
        patientInsurance={patientInsurance}
        setPatientInsurance={setPatientInsurance}
        onSave={async () => {
          await refetch();
          handleSetPaymentModalOpen(false);
        }}
      />

      <BedAssignmentModal
        refetchEncounter={refetch}
        open={openBedAssignmentModal}
        setOpen={setOpenBedAssignmentModal}
        encounter={localEncounter}
        departmentId={String(localEncounter?.departmentId ?? '')}
      />

      <MyModal
        open={openEMRModal}
        setOpen={setOpenEMRModal}
        title={'Electronic Medical Record'}
        size="90vw"
        content={
          emrPatient && emrEncounter ? (
            <PatientEMRModal patient={emrPatient} encounter={emrEncounter} />
          ) : (
            <div>No patient selected.</div>
          )
        }
        actionButtonLabel="Close"
        actionButtonFunction={() => setOpenEMRModal(false)}
        cancelButtonLabel="Cancel"
      />
    </>
  );
};

export default PatientsLists;
