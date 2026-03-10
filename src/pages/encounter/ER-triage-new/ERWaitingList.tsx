import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { newApEncounter } from '@/types/model-types-constructor';
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
import {
  calculateAgeFormat,
  formatDate,
  formatDateWithoutSeconds,
  formatEnumString
} from '@/utils';
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
import { useAppSelector } from '@/hooks';

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
    ...newApEncounter,
    discharge: false
  });
  const [localPatient, setLocalPatient] = useState<any>(null);

  const [cancelEncounter] = useCancelEncounterMutation();
  const [triggerGetPatientById] = useLazyGetPatientByIdQuery();

  useEffect(() => {
    dispatch(setPageCode('ER_Waiting_List'));
    dispatch(setDivContent('ER Waiting List'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(' '));
    };
  }, [dispatch]);

  const EncounterPriorityEnum = useEnumOptions('EncounterPriority');
  const EncounterReasonEnum = useEnumOptions('EncounterReason');
  const EncounterStatusEnum = useEnumOptions('EncounterStatus');

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatDate(today), [today]);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const DEFAULT_SORT = 'id,desc';

  const [dateFilter, setDateFilter] = useState({ fromDate: today, toDate: today });

  const DEFAULT_STATUS = useMemo(() => ['WAITING_TRIAGE', 'NEW', 'ONGOING'], []);
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
    if (!departmentId) return null;

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
      size: pageSize,
      sort: DEFAULT_SORT,
      timestamp: searchTick
    };
  }, [
    departmentId,
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

  const tableData = encountersPaged?.data ?? encountersPaged?.object ?? [];
  const totalCount = encountersPaged?.totalCount ?? encountersPaged?.extraNumeric ?? 0;

  const patientBulkIdsRef = useRef<string[]>([]);
  const [getBulkPatientBasicInfo, { data: patientsBasicInfo, isLoading: patientsBulkLoading }] =
    useGetBulkPatientBasicInfoMutation();

  const patientIdsForBulk = useMemo(() => {
    const ids = (tableData as any[])
      .map(row => row?.patient?.id ?? row?.patientId ?? row?.patientObject?.id)
      .filter(v => v !== null && v !== undefined)
      .map(v => String(v));

    return Array.from(new Set(ids));
  }, [tableData]);

  useEffect(() => {
    if (patientIdsForBulk.length === 0) return;

    patientBulkIdsRef.current = patientIdsForBulk;
    getBulkPatientBasicInfo(patientIdsForBulk as any)
      .unwrap()
      .catch(() => {});
  }, [patientIdsForBulk, getBulkPatientBasicInfo]);

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

      return {
        ...row,
        key: row?.id ?? row?.key,

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
  }, [tableData, patientMap]);

  const handleCancelEncounter = async () => {
    try {
      await cancelEncounter({ id: encounter?.id ?? encounter?.key }).unwrap();
      refetchEncounters();
      dispatch(notify({ msg: 'Cancelled Successfully', sev: 'success' }));
      setOpen(false);
    } catch {
      dispatch(notify({ msg: 'Error cancelling encounter', sev: 'error' }));
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
        encounter: encounterData
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
    setRecord({});
    setDateFilter({ fromDate: now, toDate: now });
    setStatusIn(DEFAULT_STATUS);
    setEncounterReasons([]);
    setPriorities([]);
    setHasPrescription(undefined);
    setHasOrder(undefined);
    setIsObserved(undefined);

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
      render: (rowData: any) =>
        rowData?.encounterNumber
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
      render: (rowData: any) =>
        rowData?.emergencyLevelLkey ? (
          <MyBadgeStatus
            color={rowData?.emergencyLevelLvalue?.valueColor}
            contant={rowData?.emergencyLevelLvalue?.lovDisplayVale}
          />
        ) : (
          ''
        )
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
            {row?.emergencyTriage?.createdByUser?.fullName}
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(row?.emergencyTriage?.createdAt)}
            </span>
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
          width={260}
          fieldType="checkPicker"
          fieldLabel="Encounter Status"
          fieldName="statusIn"
          selectData={EncounterStatusEnum}
          selectDataLabel="label"
          selectDataValue="value"
          record={{ statusIn }}
          setRecord={(v: any) => {
            setStatusIn(Array.isArray(v?.statusIn) ? v.statusIn : []);
            setPage(0);
          }}
        />
      </Form>

      <AdvancedSearchFilters
        searchFilter={true}
        clearOnClick={handleClearFilters}
        content={
          <div className="advanced-filters">
            <Form fluid>
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
                width={130}
                fieldName="hasPrescription"
                fieldType="checkbox"
                record={{ hasPrescription: !!hasPrescription }}
                setRecord={(v: any) => {
                  setHasPrescription(!!v?.hasPrescription);
                  setPage(0);
                }}
                label="Has Prescription"
              />

              <MyInput
                width={110}
                fieldName="hasOrder"
                fieldType="checkbox"
                record={{ hasOrder: !!hasOrder }}
                setRecord={(v: any) => {
                  setHasOrder(!!v?.hasOrder);
                  setPage(0);
                }}
                label="Has Orders"
              />

              <MyInput
                width={110}
                fieldName="isObserved"
                fieldType="checkbox"
                record={{ isObserved: !!isObserved }}
                setRecord={(v: any) => {
                  setIsObserved(!!v?.isObserved);
                  setPage(0);
                }}
                label="Is Observed"
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

  const tableLoading = isEncountersLoading || isEncountersFetching || patientsBulkLoading;

  useEffect(() => {
    if (tableLoading) dispatch(showSystemLoader());
    else dispatch(hideSystemLoader());

    return () => {
      dispatch(hideSystemLoader());
    };
  }, [dispatch, tableLoading]);

  if (!departmentId) {
    return (
      <Panel>
        <div className="encounter-list__no-department">
          <p>Please select a department to view encounters.</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <BedAssignmentModal
        refetchEncounter={refetchEncounters}
        open={openBedAssigmentModal}
        setOpen={setOpenBedAssigment}
        encounter={encounter}
        departmentKey={encounter?.departmentKey ?? String(departmentId)}
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
        content={<PatientEMRModal inModal={true} patient={localPatient} encounter={encounter} />}
        cancelButtonLabel="Close"
        actionButtonLabel="Close"
        actionButtonFunction={() => setOpenEMRModal(false)}
      />
    </Panel>
  );
};

export default ERWaitingList;