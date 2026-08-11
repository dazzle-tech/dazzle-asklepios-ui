import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form, Panel, Tooltip, Whisper } from 'rsuite';
import {
  faFileWaveform,
  faCommentMedical,
  faBedPulse,
  faRectangleXmark,
  faUserDoctor
} from '@fortawesome/free-solid-svg-icons';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';
import 'react-tabs/style/react-tabs.css';
import { calculateAgeFormat, formatDate, formatEnumString } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useDispatch } from 'react-redux';
import { hideSystemLoader, showSystemLoader, notify } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import BedAssignmentModal from '../day-case/DayCaseList/BedAssignmentModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import PatientEMRModal from '@/pages/patient/patient-emr/PatientEMRModal';
import MyModal from '@/components/MyModal/MyModal';
import './styles.less';

import {
  useFilterEncountersQuery,
  useCancelEncounterMutation
} from '@/services/encounters/patientEncounterService';

import { useEnumOptions } from '@/services/enumsApi';
import {
  useGetBulkPatientBasicInfoMutation,
  useLazyGetPatientByIdQuery
} from '@/services/patient/patientService';
import { useLazyGetEmergencyTriageBulkByEncounterIdsQuery } from '@/services/encounters/er-triage/emergencyTriageService';
import { useLazyGetDepartmentByIdQuery } from '@/services/security/departmentService';
import { useAppSelector } from '@/hooks';
import { newPatientEncounter } from '@/types/model-types-constructor-new';

const toISODate = (d: Date | string | null | undefined) => {
  if (!d) return undefined;
  if (typeof d === 'string') return d;
  return d.toISOString().slice(0, 10);
};

const uniqueNonEmpty = (arr?: any[]) => {
  if (!arr) return undefined;
  const cleaned = arr.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
  return cleaned.length ? Array.from(new Set(cleaned.map(v => String(v)))) : undefined;
};

const derivePatientFilters = (appliedSearch: any) => {
  const searchByField = String(appliedSearch?.searchByField ?? 'fullName');
  const raw = String(
    appliedSearch?.patientName ??
    appliedSearch?.searchText ??
    appliedSearch?.text ??
    appliedSearch?.value ??
    ''
  ).trim();

  if (!raw) {
    return { patientName: undefined as string | undefined, mrn: undefined as string | undefined };
  }

  if (searchByField === 'patientMrn') {
    return { patientName: undefined, mrn: raw };
  }

  return { patientName: raw, mrn: undefined };
};

const ERWaitingList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const authSlice = useAppSelector(state => state.auth);
  const selectedDepartment = authSlice.selectedDepartment;
  const departmentId = selectedDepartment?.departmentId ?? selectedDepartment?.id;

  const [open, setOpen] = useState(false);
  const [openBedAssigmentModal, setOpenBedAssigment] = useState(false);
  const [openEMRModal, setOpenEMRModal] = useState(false);
  const [encounter, setLocalEncounter] = useState<any>({
    ...newPatientEncounter,
    discharge: false
  });
  const [localPatient, setLocalPatient] = useState<any>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [cancelEncounter] = useCancelEncounterMutation();
  const [triageBulkList, setTriageBulkList] = useState<any[]>([]);

  const [getEmergencyTriageBulkByEncounterIds] = useLazyGetEmergencyTriageBulkByEncounterIdsQuery();
  const [triggerGetPatientById] = useLazyGetPatientByIdQuery();
  const [triggerGetDepartmentById, { data: departmentData, isFetching: isDepartmentFetching }] =
    useLazyGetDepartmentByIdQuery();

  useEffect(() => {
    dispatch(setPageCode('ER_Waiting_List'));
    dispatch(setDivContent('ER Waiting List'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(' '));
    };
  }, [dispatch]);

  useEffect(() => {
    if (!departmentId) return;

    triggerGetDepartmentById(Number(departmentId))
      .unwrap()
      .catch(() => { });
  }, [departmentId, triggerGetDepartmentById]);

  const isEmergencyDepartment = useMemo(() => {
    return String(departmentData?.encounterType ?? '').toUpperCase() === 'EMERGENCY';
  }, [departmentData]);

  const EncounterPriorityEnum = useEnumOptions('EncounterPriority');
  const EncounterReasonEnum = useEnumOptions('EncounterReason');

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatDate(today), [today]);

  const lastWeek = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }, []);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const DEFAULT_SORT = 'id,desc';

  const [dateFilter, setDateFilter] = useState({ fromDate: lastWeek, toDate: today });

  const DEFAULT_STATUS = useMemo(() => ['WAITING_LIST'], []);
  const [statusIn, setStatusIn] = useState<string[]>(DEFAULT_STATUS);
  const [encounterReasons, setEncounterReasons] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [hasPrescription, setHasPrescription] = useState<boolean | undefined>(undefined);
  const [hasOrder, setHasOrder] = useState<boolean | undefined>(undefined);
  const [isObserved, setIsObserved] = useState<boolean | undefined>(undefined);

  const [patientSearchDraft, setPatientSearchDraft] = useState<any>({
    searchByField: 'fullName',
    patientName: ''
  });
  const [patientSearchApplied, setPatientSearchApplied] = useState<any>({
    searchByField: 'fullName',
    patientName: ''
  });
  const [searchTick, setSearchTick] = useState(0);
  const [record, setRecord] = useState<any>({});

  const handlePatientSearchClick = useCallback(() => {
    setPatientSearchApplied((prev: any) => ({ ...prev, ...(patientSearchDraft ?? {}) }));
    setPage(0);
    setSearchTick(prev => prev + 1);
  }, [patientSearchDraft]);

  const filterParams = useMemo(() => {
    if (!departmentId || !isEmergencyDepartment) return null;

    const fromDate = toISODate(dateFilter.fromDate) ?? todayStr;
    const toDate = toISODate(dateFilter.toDate) ?? todayStr;
    const chiefComplaint =
      String(record?.chiefComplain ?? record?.chiefComplaint ?? '').trim() || undefined;

    const normalizedStatusIn = uniqueNonEmpty(statusIn) ?? DEFAULT_STATUS;
    const normalizedEncounterReasons = uniqueNonEmpty(encounterReasons);
    const normalizedPriorities =
      uniqueNonEmpty(priorities) ??
      uniqueNonEmpty(record?.priority ? [record.priority] : undefined);

    const { patientName, mrn } = derivePatientFilters(patientSearchApplied);

    return {
      departmentId,
      fromDate,
      toDate,
      statusIn: normalizedStatusIn,
      patientName,
      mrn,
      encounterReasons: normalizedEncounterReasons,
      chiefComplaint,
      priorities: normalizedPriorities,
      hasPrescription,
      hasOrder,
      isObserved,
      page,
      practitionerId: undefined,
      size: pageSize,
      sort: DEFAULT_SORT,
      timestamp: searchTick
    };
  }, [
    departmentId,
    isEmergencyDepartment,
    dateFilter.fromDate,
    dateFilter.toDate,
    todayStr,
    statusIn,
    encounterReasons,
    priorities,
    hasPrescription,
    hasOrder,
    isObserved,
    page,
    pageSize,
    patientSearchApplied,
    record,
    DEFAULT_STATUS,
    searchTick
  ]);

  const {
    data: encountersPaged,
    isFetching: isEncountersFetching,
    isLoading: isEncountersLoading,
    refetch: refetchEncounters
  } = useFilterEncountersQuery(filterParams as any, { skip: !filterParams });

  const tableData = encountersPaged?.data ?? [];
  const totalCount = encountersPaged?.totalCount ?? 0;

  const patientBulkIdsRef = useRef<string[]>([]);
  const [getBulkPatientBasicInfo, { data: patientsBasicInfo, isLoading: patientsBulkLoading }] =
    useGetBulkPatientBasicInfoMutation();

  const encounterIdsForBulk = useMemo(() => {
    const ids = (encountersPaged?.data ?? [])
      .map((row: any) => row?.id)
      .filter((v: any) => v !== null && v !== undefined)
      .map((v: any) => Number(v));

    return Array.from(new Set(ids));
  }, [encountersPaged?.data]);

  const patientIdsForBulk = useMemo(() => {
    const ids = (tableData as any[])
      .map(row => row?.patient?.id ?? row?.patientId ?? row?.patientObject?.id)
      .filter(v => v !== null && v !== undefined)
      .map(v => String(v));

    return Array.from(new Set(ids));
  }, [tableData]);

  useEffect(() => {
    if (!isEmergencyDepartment || patientIdsForBulk.length === 0) return;

    patientBulkIdsRef.current = patientIdsForBulk;
    getBulkPatientBasicInfo(patientIdsForBulk as any)
      .unwrap()
      .catch(() => { });
  }, [patientIdsForBulk, getBulkPatientBasicInfo, isEmergencyDepartment]);

  const patientMap = useMemo(() => {
    const map = new Map<string, any>();
    const ids = patientBulkIdsRef.current;

    (patientsBasicInfo ?? []).forEach((patient: any, index: number) => {
      const key = patient?.id ?? ids[index];
      if (!key) return;
      map.set(String(key), patient);
    });

    return map;
  }, [patientsBasicInfo]);

  const triageMap = useMemo(() => {
    const map = new Map<number, any>();

    (triageBulkList ?? []).forEach((triage: any) => {
      const encounterId = triage?.encounterId ?? triage?.encounter?.id;
      if (!encounterId) return;

      map.set(Number(encounterId), triage);
    });

    return map;
  }, [triageBulkList]);

  const normalizedTableData = useMemo(() => {
    return (tableData as any[]).map(row => {
      const patientId = row?.patient?.id ?? row?.patientId ?? row?.patientObject?.id ?? null;
      const patientFromMap = patientId != null ? patientMap.get(String(patientId)) : null;

      const firstName = String(
        patientFromMap?.firstName ?? row?.patient?.firstName ?? row?.patientObject?.firstName ?? ''
      ).trim();
      const secondName = String(
        patientFromMap?.secondName ??
        row?.patient?.secondName ??
        row?.patientObject?.secondName ??
        ''
      ).trim();
      const thirdName = String(
        patientFromMap?.thirdName ?? row?.patient?.thirdName ?? row?.patientObject?.thirdName ?? ''
      ).trim();
      const lastName = String(
        patientFromMap?.lastName ?? row?.patient?.lastName ?? row?.patientObject?.lastName ?? ''
      ).trim();

      const fullName =
        [firstName, secondName, thirdName, lastName].filter(Boolean).join(' ').trim() ||
        row?.patientObject?.fullName ||
        '-';

      const mrn =
        patientFromMap?.medicalRecordNumber ??
        row?.patient?.medicalRecordNumber ??
        row?.patientObject?.patientMrn ??
        row?.patientObject?.medicalRecordNumber ??
        '-';

      const dob =
        patientFromMap?.dateOfBirth ??
        row?.patient?.dateOfBirth ??
        row?.patientObject?.dateOfBirth ??
        null;

      const sexAtBirth =
        formatEnumString(
          patientFromMap?.sexAtBirth ?? row?.patient?.sexAtBirth ?? row?.patientObject?.sexAtBirth
        ) ||
        row?.patientObject?.genderLvalue?.lovDisplayVale ||
        '';

      const encounterId = row?.id;
      const emergencyTriageFromMap = encounterId != null ? triageMap.get(Number(encounterId)) : null;

      return {
        ...row,
        key: encounterId,
        emergencyTriage: emergencyTriageFromMap ?? row?.emergencyTriage ?? null,
        patientObject: {
          id: patientId,
          fullName,
          patientMrn: mrn,
          medicalRecordNumber: mrn,
          dateOfBirth: dob,
          sexAtBirth
        },
        patientAge: row?.patientAge ?? (dob ? calculateAgeFormat(dob) : null)
      };
    });
  }, [tableData, patientMap, triageMap]);

  const handleCancelEncounter = async () => {
    try {
      await cancelEncounter({ id: encounter?.id ?? encounter?.key }).unwrap();
      refetchEncounters();
      dispatch(notify({ msg: 'Cancelled Successfully', sev: 'success' }));
      setOpen(false);
    } catch (err: any) {
      const errorMap: Record<string, string> = {
        'error.cancel.notAllowed.rule': 'Cancellation is not allowed for the current encounter status.',
        'error.cancel.notAllowed.hasObservation': 'Cannot cancel encounter with observations'
      };

      const backendMessage = err?.data?.message;
      const msg = errorMap[backendMessage] || 'Error cancelling encounter';

      dispatch(notify({ msg, sev: 'error' }));
    }
  };

  const handleGoToQuickVisit = (encounterData: any, patientData: any) => {
    navigate('/quick-visit', {
      state: {
        info: 'toQuickVisit',
        fromPage: 'ERWaitingList',
        patient: patientData,
        encounter: encounterData
      }
    });
  };

  const handleGoToViewTriage = (encounterData: any, patientData: any) => {
    navigate('/view-triage', {
      state: {
        from: 'ER_Waiting_List',
        info: 'toViewTriage',
        patient: patientData,
        encounter: encounterData,
        viewMode: 'readOnly'
      }
    });
  };

  const handleOpenEMR = async (rowData: any) => {
    try {
      const patientId = rowData?.patient?.id ?? rowData?.patientId ?? rowData?.patientObject?.id;
      let patient = rowData?.patientObject ?? null;

      if (patientId) {
        const fullPatient = await triggerGetPatientById({ id: patientId }).unwrap();
        patient = fullPatient;
      }

      setLocalEncounter(rowData);
      setLocalPatient(patient);
      setOpenEMRModal(true);
    } catch {
      setLocalEncounter(rowData);
      setLocalPatient(rowData?.patientObject ?? null);
      setOpenEMRModal(true);
    }
  };

  const handlePageChange = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleClearFilters = () => {
    const now = new Date();
    const lastWeekDate = new Date(now);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    setRecord({});
    setDateFilter({ fromDate: lastWeekDate, toDate: now });
    setStatusIn(DEFAULT_STATUS);
    setEncounterReasons([]);
    setPriorities([]);
    setHasPrescription(undefined);
    setHasOrder(undefined);
    setIsObserved(undefined);
    setShowCancelled(false);
    const clearedSearch = { searchByField: 'fullName', patientName: '' };
    setPatientSearchDraft(clearedSearch);
    setPatientSearchApplied(clearedSearch);
    setPage(0);
    setSearchTick(prev => prev + 1);
  };

  const isSelected = (rowData: any) => {
    if (rowData && encounter && rowData.key === encounter.key) return 'selected-row';
    return '';
  };

  const tableColumns = [
    {
      key: 'queueNumber',
      title: <Translate>Encounter Number</Translate>,
      render: (rowData: any) => rowData?.encounterNumber
    },
    {
      key: 'patientFullName',
      title: <Translate>PATIENT NAME</Translate>,
      fullText: true,
      render: (rowData: any) => rowData?.patientObject?.fullName
    },
    {
      key: 'patientMRN',
      title: <Translate>MRN</Translate>,
      render: (rowData: any) =>
        rowData?.patientObject?.patientMrn ?? rowData?.patientObject?.medicalRecordNumber
    },
    {
      key: 'Age',
      title: <Translate>Age</Translate>,
      render: (rowData: any) => rowData?.patientAge
    },
    {
      key: 'genderLkey',
      title: <Translate>Gender</Translate>,
      render: (rowData: any) => rowData?.patientObject?.sexAtBirth ?? ''
    },
    {
      key: 'emergencyLevelLkey',
      title: <Translate>ER Level</Translate>,
      render: (rowData: any) => rowData?.emergencyTriage?.emergencyLevel ?? ''
    },
    {
      key: 'chiefComplaint',
      title: <Translate>CHIEF COMPLAIN</Translate>,
      render: (rowData: any) => rowData?.chiefComplaint
    },
    {
      key: 'plannedStartDate',
      title: <Translate>DATE</Translate>,
      render: (rowData: any) => rowData?.plannedStartDate ?? rowData?.encounterDate ?? '-'
    },
    {
      key: 'triageAt',
      title: 'TRIAGE AT/BY',
      render: (row: any) =>
        row?.emergencyTriage ? (
          <>
            {row?.emergencyTriage?.createdBy}
            <br />
            <span className="date-table-style">{row?.emergencyTriage?.createdDate}</span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'status',
      title: <Translate>STATUS</Translate>,
      render: (rowData: any) => (
        <MyBadgeStatus
          color={rowData?.encounterStatusLvalue?.valueColor ?? '#969fb0'}
          contant={
            rowData?.encounterStatusLvalue?.lovDisplayVale ??
            formatEnumString(rowData?.status) ??
            rowData?.status ??
            ''
          }
        />
      )
    },
    {
      key: 'priority',
      title: <Translate>PRIORITY</Translate>,
      render: (rowData: any) => (
        <MyBadgeStatus
          color={rowData?.visitTypeLvalue?.valueColor ?? rowData?.priorityLevelLvalue?.valueColor}
          contant={
            rowData?.visitTypeLvalue?.lovDisplayVale ??
            rowData?.priorityLevelLvalue?.lovDisplayVale ??
            formatEnumString(rowData?.priorityLevel) ??
            ''
          }
        />
      )
    },
    {
      key: 'actions',
      title: <Translate> </Translate>,
      render: (rowData: any) => {
        const tooltipTriage = <Tooltip>View Triage</Tooltip>;
        const tooltipAssignBed = <Tooltip>Assign Bed</Tooltip>;
        const tooltipEMR = <Tooltip>Go to EMR</Tooltip>;
        const tooltipQuickVisit = <Tooltip>Quick Visit</Tooltip>;
        const tooltipCancel = <Tooltip>Cancel Visit</Tooltip>;

        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            <Whisper trigger="hover" placement="top" speaker={tooltipTriage}>
              <div>
                <MyButton
                  size="small"
                  onClick={() => {
                    const patient = rowData?.patientObject;
                    setLocalEncounter(rowData);
                    handleGoToViewTriage(rowData, patient);
                  }}
                >
                  <FontAwesomeIcon icon={faCommentMedical} />
                </MyButton>
              </div>
            </Whisper>

            <Whisper trigger="hover" placement="top" speaker={tooltipAssignBed}>
              <div>
                <MyButton
                  size="small"
                  backgroundColor="black"
                  onClick={() => {
                    setLocalEncounter(rowData);
                    setOpenBedAssigment(true);
                  }}
                >
                  <FontAwesomeIcon icon={faBedPulse} />
                </MyButton>
              </div>
            </Whisper>

            <Whisper trigger="hover" placement="top" speaker={tooltipQuickVisit}>
              <div>
                <MyButton
                  size="small"
                  onClick={() => {
                    const patient = rowData?.patientObject;
                    setLocalEncounter(rowData);
                    handleGoToQuickVisit(rowData, patient);
                  }}
                >
                  <FontAwesomeIcon icon={faUserDoctor} />
                </MyButton>
              </div>
            </Whisper>

            <Whisper trigger="hover" placement="top" speaker={tooltipEMR}>
              <div>
                <MyButton
                  size="small"
                  backgroundColor="violet"
                  onClick={() => handleOpenEMR(rowData)}
                >
                  <FontAwesomeIcon icon={faFileWaveform} />
                </MyButton>
              </div>
            </Whisper>

            <Whisper trigger="hover" placement="top" speaker={tooltipCancel}>
              <div>
                <MyButton
                  size="small"
                  onClick={() => {
                    setLocalEncounter(rowData);
                    setOpen(true);
                  }}
                >
                  <FontAwesomeIcon icon={faRectangleXmark} />
                </MyButton>
              </div>
            </Whisper>
          </Form>
        );
      }
    }
  ];

  const filtersUI = (
    <>
      <Form layout="inline" fluid className="date-filter-form">
        <MyInput
          column
          width={180}
          fieldType="date"
          fieldLabel="From Date"
          fieldName="fromDate"
          record={dateFilter}
          setRecord={v => {
            setDateFilter(v);
            setPage(0);
          }}
        />

        <MyInput
          column
          width={180}
          fieldType="date"
          fieldLabel="To Date"
          fieldName="toDate"
          record={dateFilter}
          setRecord={v => {
            setDateFilter(v);
            setPage(0);
          }}
        />

        <SearchPatientCriteria
          record={patientSearchDraft}
          setRecord={setPatientSearchDraft}
          onSearchClick={handlePatientSearchClick}
        />

        <MyInput
          column
          width={150}
          fieldType="check"
          fieldLabel={<Translate>Show Cancelled</Translate>}
          fieldName="showCancelled"
          showLabel={false}
          record={{ showCancelled }}
          setRecord={(v: any) => {
            const isChecked = !!v?.showCancelled;

            setShowCancelled(isChecked);

            if (isChecked) {
              setStatusIn(prev => Array.from(new Set([...(prev ?? []), 'CANCELLED'])));
            } else {
              setStatusIn(prev => (prev ?? []).filter(status => status !== 'CANCELLED'));
            }

            setPage(0);
          }}
        />
      </Form>

      <AdvancedSearchFilters
        searchFilter={true}
        clearOnClick={handleClearFilters}
        content={
          <div className="advanced-filters">
            <Form key={JSON.stringify(record)} fluid className="dissss">
              <MyInput
                fieldName="encounterReasons"
                fieldType="checkPicker"
                selectData={EncounterReasonEnum}
                selectDataLabel="label"
                selectDataValue="value"
                fieldLabel="Encounter Reason"
                record={{ encounterReasons }}
                setRecord={(v: any) => {
                  const raw = Array.isArray(v) ? v : v?.encounterReasons;
                  setEncounterReasons(Array.isArray(raw) ? raw.map(String).filter(Boolean) : []);
                  setPage(0);
                }}
                searchable
                width={220}
              />

              <MyInput
                width={200}
                fieldName="chiefComplain"
                fieldType="text"
                record={record}
                setRecord={v => {
                  setRecord(v);
                  setPage(0);
                }}
                fieldLabel="Chief Complain"
              />

            

              <MyInput
                width={200}
                fieldName="priorities"
                fieldType="checkPicker"
                record={{ priorities }}
                setRecord={(v: any) => {
                  setPriorities(Array.isArray(v?.priorities) ? v.priorities : []);
                  setPage(0);
                }}
                selectData={EncounterPriorityEnum}
                selectDataLabel="label"
                selectDataValue="value"
                placeholder="Select Priority"
                fieldLabel="Priority"
                searchable
              />
            </Form>
          </div>
        }
      />
    </>
  );

  const tableLoading =
    isDepartmentFetching || isEncountersLoading || isEncountersFetching || patientsBulkLoading;

  useEffect(() => {
    if (tableLoading) dispatch(showSystemLoader());
    else dispatch(hideSystemLoader());

    return () => {
      dispatch(hideSystemLoader());
    };
  }, [dispatch, tableLoading]);

  useEffect(() => {
    if (!isEmergencyDepartment || !encounterIdsForBulk.length) {
      setTriageBulkList([]);
      return;
    }

    getEmergencyTriageBulkByEncounterIds(encounterIdsForBulk)
      .unwrap()
      .then(response => {
        setTriageBulkList(response ?? []);
      })
      .catch(() => {
        setTriageBulkList([]);
      });
  }, [encounterIdsForBulk, getEmergencyTriageBulkByEncounterIds, isEmergencyDepartment]);

  if (!departmentId) {
    return (
      <Panel>
        <div className="encounter-list__no-department">
          <p>Please select a department to view encounters.</p>
        </div>
      </Panel>
    );
  }

  if (!isDepartmentFetching && departmentData && !isEmergencyDepartment) {
    return (
      <Panel>
        <div className="encounter-list__no-department">
          <p>This department is not an emergency department, so no ER waiting list is available.</p>
        </div>
      </Panel>
    );
  }


              // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';
  return (
    <Panel dir={dir}>
      <BedAssignmentModal
        refetchEncounter={refetchEncounters}
        open={openBedAssigmentModal}
        setOpen={setOpenBedAssigment}
        encounter={encounter}
        departmentId={String(encounter?.departmentId) ?? String(departmentId)}
      />

      <MyTable
        filters={filtersUI}
        height={600}
        data={normalizedTableData}
        columns={tableColumns}
        rowClassName={isSelected}
        loading={tableLoading}
        onRowClick={(rowData: any) => setLocalEncounter(rowData)}
        page={page}
        rowsPerPage={pageSize}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      <DeletionConfirmationModal
        open={open}
        setOpen={setOpen}
        actionButtonFunction={handleCancelEncounter}
        actionType="Deactivate"
        confirmationQuestion="Do you want to cancel this Encounter ?"
        actionButtonLabel="Cancel"
        cancelButtonLabel="Close"
      />

      <MyModal
        open={openEMRModal}
        setOpen={setOpenEMRModal}
        title="Patient EMR"
        size="95vw"
        content={<div dir={dir}><PatientEMRModal inModal={true} patient={localPatient} encounter={encounter} /></div>}
        cancelButtonLabel="Close"
        actionButtonLabel="Close"
        actionButtonFunction={() => setOpenEMRModal(false)}
      />
    </Panel>
  );
};

export default ERWaitingList;