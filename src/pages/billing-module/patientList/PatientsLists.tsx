import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Form, Tooltip, Whisper } from 'rsuite';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserNurse,
  faUserDoctor,
  faFileWaveform,
  faRectangleXmark,
  faEye,
  faRotateLeft
} from '@fortawesome/free-solid-svg-icons';
import { useDispatch } from 'react-redux';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
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
  getEncounterTreatmentStatus,
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

const toISODate = (value: Date | string | null | undefined): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value.toISOString().slice(0, 10);
};

const uniqueNonEmpty = (arr?: any[]): string[] | undefined => {
  if (!arr) return undefined;
  const cleaned = arr
    .filter((value) => value !== null && value !== undefined && String(value).trim() !== '')
    .map((value) => String(value));
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

const PatientsLists = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authSlice = useAppSelector((state) => state.auth);
  const facilityId = authSlice?.tenant?.selectedFacility?.id;
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [appliedFilters, setAppliedFilters] = useState<any>(null);
  const [dateFilter, setDateFilter] = useState({ fromDate: new Date(), toDate: new Date() });
  const [dateFilterKey, setDateFilterKey] = useState(0);
  const [patientSearchApplied, setPatientSearchApplied] = useState({ searchByField: 'fullName', patientName: '' });
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedEncounter, setSelectedEncounter] = useState<any>(null);
  const [openCancel, setOpenCancel] = useState(false);
  const [openEMRModal, setOpenEMRModal] = useState(false);
  const [emrPatient, setEmrPatient] = useState<any>(null);
  const [emrEncounter, setEmrEncounter] = useState<any>(null);
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

  const [getPatientById, getPatientState] = useLazyGetPatientByIdQuery();
  const [startEncounter] = useStartEncounterMutation();
  const [cancelEncounter] = useCancelEncounterMutation();
  const [reopenEncounter, { isLoading: reopening }] = useReopenEncounterMutation();

  const { data: encountersPaged, isLoading, isFetching, refetch } = useGetEncounterListQuery(appliedFilters, {
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
      dispatch(notify({ msg: error?.data?.message ?? 'Unable to start encounter', sev: 'warning' }));
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
        viewMode: 'edit',
      },
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
      dispatch(notify({ msg: error?.data?.message ?? 'Unable to reopen encounter', sev: 'warning' }));
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

    setDateFilterKey((prev) => prev + 1);

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

      encounterType:
        filters.encounterType,

      encounterNumber:
        filters.encounterNumber.trim() || undefined,

      departmentId:
        filters.departmentId ?? undefined,

      practitionerId:
        filters.practitionerId ?? undefined,


      coverageType:
        filters.coverageType || undefined,

      paymentStatus:
        filters.paymentStatus || undefined,

      insuranceName:
        filters.insuranceName.trim() || undefined,

      doctorStartedFrom:
        filters.doctorStartedFrom
          ? `${toISODate(filters.doctorStartedFrom)}T00:00:00`
          : undefined,

      doctorStartedTo:
        filters.doctorStartedTo
          ? `${toISODate(filters.doctorStartedTo)}T23:59:59`
          : undefined,

      encounterStatusIn:
        uniqueNonEmpty(filters.encounterStatusIn),

      treatmentStatusIn:
        uniqueNonEmpty(filters.treatmentStatusIn),

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
  const canSeePrint = jobRole === 'PHYSICIAN' || jobRole === 'NURSE' || Boolean(authSlice.user?.admin);
  const canSeeCancel = jobRole === 'PHYSICIAN' || jobRole === 'NURSE' || Boolean(authSlice.user?.admin);

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
        label:
          [practitioner?.firstName, practitioner?.lastName]
            .filter(Boolean)
            .join(' ') || '-',
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
          width={"13vw"}
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
          width={"13vw"}
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
          width={"13vw"}
          fieldType="text"
          fieldLabel="Encounter Number"
          fieldName="encounterNumber"
          record={{ encounterNumber: filters.encounterNumber }}
          setRecord={(value: any) =>
            updateFilter(
              'encounterNumber',
              value?.encounterNumber ?? ''
            )
          }
        />

        <MyInput
          column
          width={"13vw"}
          fieldType="select"
          fieldLabel="Encounter Type"
          fieldName="encounterType"
          record={{ encounterType: filters.encounterType }}
          setRecord={(value: any) =>
            updateFilter(
              'encounterType',
              value?.encounterType || undefined
            )
          }
          selectData={EncounterTypeEnum}
          selectDataLabel="label"
          selectDataValue="value"
          searchable
        />

        <MyInput
          column
          width={"15vw"}
          fieldType="select"
          fieldLabel="Department"
          fieldName="departmentId"
          record={{ departmentId: filters.departmentId }}
          setRecord={(value: any) =>
            updateFilter(
              'departmentId',
              value?.departmentId
                ? Number(value.departmentId)
                : undefined
            )
          }
          selectData={departmentOptions}
          selectDataLabel="label"
          selectDataValue="value"
          searchable
        />

        <MyInput
          column
          width={"15vw"}
          fieldType="select"
          fieldLabel="Practitioner"
          fieldName="practitionerId"
          record={{ practitionerId: filters.practitionerId }}
          setRecord={(value: any) =>
            updateFilter(
              'practitionerId',
              value?.practitionerId
                ? Number(value.practitionerId)
                : undefined
            )
          }
          selectData={practitionerOptions}
          selectDataLabel="label"
          selectDataValue="value"
          searchable
        />

        <MyInput
          column
          width={"13vw"}
          fieldType="select"
          fieldLabel="Coverage Type"
          fieldName="coverageType"
          record={{
            coverageType: filters.coverageType
          }}
          setRecord={(value: any) =>
            updateFilter(
              'coverageType',
              value?.coverageType || undefined
            )
          }
          selectData={CoverageTypeEnum}
          selectDataLabel="label"
          selectDataValue="value"
          searchable
        />

        <MyInput
          column
          width={"15vw"}
          fieldType="text"
          fieldLabel="Insurance Name"
          fieldName="insuranceName"
          record={{
            insuranceName: filters.insuranceName
          }}
          setRecord={(value: any) =>
            updateFilter(
              'insuranceName',
              value?.insuranceName ?? ''
            )
          }
        />

        <MyInput
          column
          width={"13vw"}
          fieldType="select"
          fieldLabel="Payment Status"
          fieldName="paymentStatus"
          record={{
            paymentStatus: filters.paymentStatus
          }}
          setRecord={(value: any) =>
            updateFilter(
              'paymentStatus',
              value?.paymentStatus || undefined
            )
          }
          selectData={PaymentStatusEnum}
          selectDataLabel="label"
          selectDataValue="value"
          searchable
        />

        <MyInput
          column
          width={"15vw"}
          fieldType="checkPicker"
          fieldLabel="Encounter Status"
          fieldName="encounterStatusIn"
          record={{
            encounterStatusIn: filters.encounterStatusIn
          }}
          setRecord={(value: any) => {
            const values = Array.isArray(value)
              ? value
              : value?.encounterStatusIn;

            updateFilter(
              'encounterStatusIn',
              Array.isArray(values)
                ? values.map(String)
                : []
            );
          }}
          selectData={EncounterStatusEnum}
          selectDataLabel="label"
          selectDataValue="value"
          searchable
        />

        <MyInput
          column
          width={"15vw"}
          fieldType="checkPicker"
          fieldLabel="Treatment Status"
          fieldName="treatmentStatusIn"
          record={{
            treatmentStatusIn: filters.treatmentStatusIn
          }}
          setRecord={(value: any) => {
            const values = Array.isArray(value)
              ? value
              : value?.treatmentStatusIn;

            updateFilter(
              'treatmentStatusIn',
              Array.isArray(values)
                ? values.map(String)
                : []
            );
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
          width={"13vw"}
          fieldType="date"
          fieldLabel="Doctor Start From"
          fieldName="doctorStartedFrom"
          record={{
            doctorStartedFrom: filters.doctorStartedFrom
          }}
          setRecord={(value: any) =>
            updateFilter(
              'doctorStartedFrom',
              value?.doctorStartedFrom
                ? new Date(value.doctorStartedFrom)
                : undefined
            )
          }
        />

        <MyInput
          key={`doctorStartedTo-${dateFilterKey}`}
          column
          width={"13vw"}
          fieldType="date"
          fieldLabel="Doctor Start To"
          fieldName="doctorStartedTo"
          record={{
            doctorStartedTo: filters.doctorStartedTo
          }}
          setRecord={(value: any) =>
            updateFilter(
              'doctorStartedTo',
              value?.doctorStartedTo
                ? new Date(value.doctorStartedTo)
                : undefined
            )
          }
        />

      </Form>
    </div>
  );

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

                <div>
                  MRN: {row?.mrn ?? '-'}
                </div>

                <div>
                  Age: {row?.age != null ? `${row.age} years` : '-'}
                </div>

                <div>
                  Gender: {formatEnumString(row?.gender) || '-'}
                </div>
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
                whiteSpace: 'nowrap',
              }}
            >
              {row?.patientFullName ?? '-'}
            </span>
          </Whisper>
        ),
      },
      {
        key: 'documentType',
        title: 'DOCUMENT TYPE',
        render: (row: any) => (
          <span className="encounter-text-cell">
            {formatEnumString(row?.documentType) || '-'}
          </span>
        )
      },

      {
        key: 'documentNumber',
        title: 'DOCUMENT NUMBER',
        render: (row: any) => (
          <span className="encounter-text-cell">
            {row?.documentNumber ?? '-'}
          </span>
        )
      },

      {
        key: 'primaryMobileNumber',
        title: 'MOBILE',
        render: (row: any) => (
          <span className="encounter-text-cell">
            {row?.primaryMobileNumber ?? '-'}
          </span>
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
          <span className="encounter-number-cell">
            {row?.encounterNumber ?? '-'}
          </span>
        )
      },

      {
        key: 'encounterDate',
        title: 'ENCOUNTER DATE',
        render: (row: any) => {
          if (!row?.encounterDate) return '-';

          const time = row?.encounterTime
            ? String(row.encounterTime).slice(0, 5)
            : '';

          return (
            <div className="encounter-date-cell">
              <div className="encounter-date">
                {row.encounterDate}
              </div>

              {time && (
                <div className="encounter-time">
                  {time}
                </div>
              )}
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
            speaker={
              <Tooltip>
                {row?.departmentName ?? '-'}
              </Tooltip>
            }
          >
            <span
              className="encounter-text-cell"
              style={{
                cursor: 'pointer',
                display: 'block',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {row?.departmentName ?? '-'}
            </span>
          </Whisper>
        ),
      },
      {
        key: 'practitionerName',
        title: 'PRACTITIONER',
        render: (row: any) => (
          <div className="practitioner-cell">
            <span className="practitioner-name">
              {row?.practitionerName ?? '-'}
            </span>
          </div>
        )
      },

      {
        key: 'defaultServiceName',
        title: 'SERVICE',
        render: (row: any) => (
          <span className="encounter-text-cell">
            {row?.defaultServiceName ?? '-'}
          </span>
        )
      },

      {
        key: 'amount',
        title: 'AMOUNT',
        render: (row: any) => (
          <span className="amount-cell">
            {row?.amount != null ? row.amount : '-'}
          </span>
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
          <span className="encounter-text-cell">
            {row?.insuranceName ?? '-'}
          </span>
        )
      },

      {
        key: 'triageStarted',
        title: 'TRIAGE',
        render: (row: any) =>
          row?.triageStarted ? (
            <MyBadgeStatus
              contant="YES"
              color="#45b887"
            />
          ) : (
            <MyBadgeStatus
              contant="NO"
              color="#969fb0"
            />
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
          const status = String(
            row?.encounterStatus ?? ''
          ).toUpperCase();

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
          const status = String(
            row?.treatmentStatus ?? ''
          ).toUpperCase();

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
            row?.treatmentStatus ?? row?.status ?? ''
          ).toUpperCase();

          const isViewOnlyStatus =
            status === 'COMPLETED' ||
            status === 'CANCELLED';

          const isNew = status === 'NEW';

          const canReopen =
            status === 'COMPLETED' ||
            status === 'DISCHARGED';

          const actions: Array<{
            show: boolean;
            tooltip: string;
            icon: any;
            bg?: string;
            onClick: () => void;
            loading?: boolean;
            renderCustom?: React.ReactNode;
          }> = [
              {
                show:
                  canSeeNurseStation &&
                  !isViewOnlyStatus,
                tooltip: 'Nurse Station',
                icon: faUserNurse,
                bg: '#212529',
                onClick: () => {
                  setSelectedEncounter(row);
                  handleNurseStation(row);
                }
              },

              {
                show:
                  canSeeDoctorVisit &&
                  isViewOnlyStatus,
                tooltip: 'View Visit',
                icon: faEye,
                bg: '#6c757d',
                onClick: () => {
                  setSelectedEncounter(row);
                  handleViewVisit(row);
                }
              },

              {
                show:
                  canSeeDoctorVisit &&
                  !isViewOnlyStatus,
                tooltip: 'Doctor Visit',
                icon: faUserDoctor,
                bg: '#0d6efd',
                onClick: () => {
                  setSelectedEncounter(row);
                  handleGoToVisit(row);
                }
              },

              {
                show: canSeeEMR,
                tooltip: 'Go to EMR',
                icon: faFileWaveform,
                bg: '#6f42c1',
                onClick: () => {
                  setSelectedEncounter(row);
                  setEmrEncounter(row);

                  setEmrPatient(
                    row?.patientObject ??
                    row?.patient ??
                    null
                  );

                  dispatch(setEncounter(row));

                  const patient =
                    row?.patientObject ??
                    row?.patient;

                  if (patient) {
                    dispatch(setPatient(patient));
                  }

                  setOpenEMRModal(true);
                }
              },

              {
                show:
                  canSeeCancel &&
                  isNew &&
                  !row?.isObserved,
                tooltip: 'Cancel Visit',
                icon: faRectangleXmark,
                bg: '#dc3545',
                onClick: () => {
                  setSelectedEncounter(row);
                  setOpenCancel(true);
                }
              },

              {
                show: canReopen,
                tooltip: 'Reopen Encounter',
                icon: faRotateLeft,
                bg: '#0d6efd',
                loading: reopening,
                onClick: () => {
                  handleReopen(row.id);
                }
              },

              {
                show: canSeePrint,
                tooltip: 'Print Visit Report',
                icon: null,
                onClick: () => undefined,
                renderCustom: (
                  <VisitReportPrintButton row={row} />
                )
              }
            ];

          return (
            <Form
              fluid
              className="nurse-doctor-form-actions"
            >
              {actions
                .filter((item) => item.show)
                .map((item, index) => (
                  <Whisper
                    key={`${item.tooltip}-${index}`}
                    trigger="hover"
                    placement="top"
                    speaker={
                      <Tooltip>
                        {item.tooltip}
                      </Tooltip>
                    }
                  >
                    <div>
                      {item.renderCustom ?? (
                        <MyButton
                          size="small"
                          backgroundColor={
                            item.bg ?? '#1f2937'
                          }
                          loading={item.loading}
                          onClick={item.onClick}
                        >
                          <FontAwesomeIcon
                            icon={item.icon}
                          />
                        </MyButton>
                      )}
                    </div>
                  </Whisper>
                ))}
            </Form>
          );
        }
      }
    ],
    [
      canSeeCancel,
      canSeeDoctorVisit,
      canSeeEMR,
      canSeeNurseStation,
      canSeePrint,
      reopening
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
        onRowClick={(row) => setSelectedEncounter(row)}
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
