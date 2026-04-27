import Translate from '@/components/Translate';
import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox, Form, Panel, Tooltip, Whisper } from 'rsuite';
import MyTable from '@/components/MyTable';
import './styles.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faCircleXmark,
  faFileLines,
  faFilePen,
  faUpload,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import MyBadgeStatus from '../MyBadgeStatus/MyBadgeStatus';
import MyButton from '../MyButton/MyButton';
import MyInput from '../MyInput';
import { FaCheck } from 'react-icons/fa6';
import DeletionConfirmationModal from '../DeletionConfirmationModal';
import MyModal from '@/components/MyModal/MyModal';
import PatientEMRModal from '@/pages/patient/patient-emr/PatientEMRModal';
import { useLazyGetPractitionerByUserIdQuery } from '@/services/setup/practitioner/PractitionerService';
import {
  useGetDepartmentsBulkMutation,
  useLazyGetActiveDepartmentByFacilityListQuery
} from '@/services/security/departmentService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import {
  useLazySearchConsultationsQuery,
  useConfirmConsultationMutation,
  useRejectConsultationMutation,
  useSubmitConsultationResponseMutation,
  useSubmitConsultationsMutation
} from '@/services/portalService';
import { useGetEncounterByIdQuery } from '@/services/encounterService';
import { useLazyGetPatientByIdQuery } from '@/services/patientService';
import { useGetBulkPatientBasicInfoMutation } from '@/services/patient/patientService';
import { useGetUsersBasicNamesBulkMutation } from '@/services/accountService';
import { useAppSelector } from '@/hooks';
import { useDispatch } from 'react-redux';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { setPatient, setEncounter } from '@/reducers/patientSlice';
import { notify } from '@/utils/uiReducerActions';
import {
  conjureValueBasedOnIDFromList,
  formatDateWithoutSeconds,
  calculateAgeFormat,
  formatEnumString
} from '@/utils';
import AddBulkServicesToConsultationModal from '@/pages/encounter/encounter-pre-observations-new/Service&Products/AddBulkServicesToConsultationModal';

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
    default:
      return '#6c757d';
  }
};

const getPriorityColor = (level: string): string => {
  switch (level) {
    case 'CRITICAL':
      return '#D64545';
    case 'REGULAR':
      return '#0DAA41';
    default:
      return '#6c757d';
  }
};

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDateOnly = (value: Date | string) => {
  if (value instanceof Date) {
    return getLocalDateString(value);
  }
  return String(value).slice(0, 10);
};

const toUTCStartOfDay = (value: Date | string) => {
  const raw = normalizeDateOnly(value);
  return `${raw}T00:00:00.000Z`;
};

const toUTCEndOfDay = (value: Date | string) => {
  const raw = normalizeDateOnly(value);
  return `${raw}T23:59:59.999Z`;
};

const MyConsultations = () => {
  const dispatch = useDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const selectedDepartment = authSlice.selectedDepartment;
  const loggedInUser = authSlice.user;
  const selectedFacilityId =
    authSlice?.selectedDepartment?.facilityId ?? authSlice?.tenant?.selectedFacility?.id;

  const todayString = getLocalDateString();

  const formatDateTime = useCallback(
    (value?: string | number | Date | null) => (value ? formatDateWithoutSeconds(value) : ''),
    []
  );

  const DEFAULT_SORT = 'createdDate,desc';

  const [record, setRecord] = useState<any>({
    facilityId: selectedFacilityId ?? undefined,
    departmentId: [],
    requestDateFrom: todayString,
    requestDateTo: todayString
  });

  const [showRejected, setShowRejected] = useState(false);
  const [openActionModal, setOpenActionModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [openResponseModal, setOpenResponseModal] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
  const [responseForm, setResponseForm] = useState({ responseText: '' });
  const [isResponseReadOnly, setIsResponseReadOnly] = useState(false);

  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [rejectForm, setRejectForm] = useState({ reason: '' });

  const [openEMRModal, setOpenEMRModal] = useState(false);
  const [emrPatient, setEmrPatient] = useState<any>(null);
  const [emrEncounter, setEmrEncounter] = useState<any>(null);
  const [emrEncounterKey, setEmrEncounterKey] = useState<string | null>(null);

  const [openBulkServicesModal, setOpenBulkServicesModal] = useState(false);
  const [selectedConsultationForServices, setSelectedConsultationForServices] = useState<any>(null);

  const emrPatientKeyRef = useRef<string | null>(null);
  const usersBulkIdsRef = useRef<number[]>([]);
  const patientBulkIdsRef = useRef<number[]>([]);
  const lastSearchParamsRef = useRef<any>(null);

  const [triggerSearch, searchResult] = useLazySearchConsultationsQuery();
  const [confirmConsultation] = useConfirmConsultationMutation();
  const [rejectConsultation] = useRejectConsultationMutation();
  const [submitConsultationResponse] = useSubmitConsultationResponseMutation();
  const [submitConsultations] = useSubmitConsultationsMutation();

  const [fetchPatientById, { data: emrPatientData }] = useLazyGetPatientByIdQuery();
  const [getBulkPatientBasicInfo, { data: patientsBasicInfo, isLoading: patientsBulkLoading }] =
    useGetBulkPatientBasicInfoMutation();
  const [getUsersBasicNamesBulk, { data: usersBasicNames, isLoading: usersBulkLoading }] =
    useGetUsersBasicNamesBulkMutation();

  const { data: emrEncounterData } = useGetEncounterByIdQuery(emrEncounterKey ?? '', {
    skip: !emrEncounterKey
  });

  const [getPractitionerByUserId, { data: practitionerResponse }] =
    useLazyGetPractitionerByUserIdQuery();

  const practitionerId = practitionerResponse?.id?.toString() || '';

  const [getDepartmentsByFacility, { data: departmentListResponse }] =
    useLazyGetActiveDepartmentByFacilityListQuery();
  const [getDepartmentsBulk, { data: departmentsBulk, isLoading: departmentsBulkLoading }] =
    useGetDepartmentsBulkMutation();
  const { data: facilityListResponse } = useGetAllFacilitiesQuery(null);

  const searchParams = useMemo(() => {
    const fromFacilityId = record.facilityId ?? selectedFacilityId;
    const toDepartmentId = selectedDepartment?.departmentId;
    const practitionerIdNum = practitionerId ? Number(practitionerId) : undefined;

    if (!fromFacilityId) return null;
    if (!practitionerIdNum && !toDepartmentId) return null;

    const selectedDepartmentIds = Array.isArray(record?.departmentId)
      ? record.departmentId
      : record?.departmentId
        ? [record.departmentId]
        : [];

    const fromDateValue = record.requestDateFrom || todayString;
    const toDateValue = record.requestDateTo || todayString;
    const querySize = (page + 1) * pageSize;

    return {
      fromDate: toUTCStartOfDay(fromDateValue),
      toDate: toUTCEndOfDay(toDateValue),
      fromFacilityId: Number(fromFacilityId),
      practitionerId: practitionerIdNum,
      toDepartmentId: toDepartmentId ? Number(toDepartmentId) : undefined,
      fromDepartmentIds:
        selectedDepartmentIds.length > 0
          ? selectedDepartmentIds.map((id: string | number) => Number(id))
          : undefined,
      page: 0,
      size: querySize,
      sort: DEFAULT_SORT,
      showRejected
    };
  }, [
    record,
    selectedFacilityId,
    selectedDepartment?.departmentId,
    practitionerId,
    page,
    pageSize,
    showRejected,
    todayString
  ]);

  const consultationResponse = searchResult.data;
  const consultationsLoading = searchResult.isFetching || searchResult.isLoading;

  const refetchConsultations = useCallback(() => {
    if (lastSearchParamsRef.current) {
      triggerSearch(lastSearchParamsRef.current);
    }
  }, [triggerSearch]);

  const facilities = Array.isArray(facilityListResponse) ? facilityListResponse : [];
  const departments = Array.isArray(departmentListResponse) ? departmentListResponse : [];

  const pageIndex = page;
  const rowsPerPage = pageSize;
  const totalCount = consultationResponse?.totalCount ?? consultationResponse?.data?.length ?? 0;

  const handlePageChange = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const allConsultations = consultationResponse?.data ?? [];
  const visibleConsultations = useMemo(() => {
    const start = page * pageSize;
    return allConsultations.slice(start, start + pageSize);
  }, [allConsultations, page, pageSize]);

  const patientIdsForBulk = useMemo(
    () =>
      Array.from(
        new Set(
          visibleConsultations
            .map((consultation: any) => consultation.patient?.id)
            .filter(Boolean)
            .map((id: any) => Number(id))
            .filter((id: number) => !Number.isNaN(id))
        )
      ),
    [visibleConsultations]
  );

  const patientMap = useMemo(() => {
    const map = new Map<string, any>();
    const ids = patientBulkIdsRef.current;
    (patientsBasicInfo ?? []).forEach((patient: any, idx: number) => {
      const id = patient?.id ?? ids[idx];
      if (id == null) return;
      map.set(String(id), {
        id,
        firstName: patient?.firstName,
        lastName: patient?.lastName,
        dateOfBirth: patient?.dateOfBirth,
        sexAtBirth: patient?.sexAtBirth,
        medicalRecordNumber: patient?.medicalRecordNumber
      });
    });
    return map;
  }, [patientsBasicInfo]);

  const departmentIdsForBulk = useMemo(
    () =>
      Array.from(
        new Set(
          visibleConsultations
            .map(
              (consultation: any) =>
                consultation.toDepartmentId ??
                consultation.fromDepartmentId ??
                consultation.departmentKey
            )
            .filter(Boolean)
            .map((id: any) => Number(id))
            .filter((id: number) => !Number.isNaN(id))
        )
      ),
    [visibleConsultations]
  );

  const userIdsForBulk = useMemo(
    () =>
      Array.from(
        new Set(
          visibleConsultations
            .flatMap((consultation: any) => [
              consultation.confirmedBy,
              consultation.responseBy,
              consultation.rejectedBy
            ])
            .filter((id: any) => id !== null && id !== undefined)
            .map((id: any) => Number(id))
            .filter((id: number) => !Number.isNaN(id))
        )
      ),
    [visibleConsultations]
  );

  const usersNameMap = useMemo(() => {
    const map = new Map<string, string>();
    const ids = usersBulkIdsRef.current;
    (usersBasicNames ?? []).forEach((user: any, idx: number) => {
      const id = user?.id ?? ids[idx];
      if (id == null) return;
      const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
      map.set(String(id), fullName || String(id));
    });
    return map;
  }, [usersBasicNames]);

  const resolveUserName = (id: number | string | null | undefined) => {
    if (id === null || id === undefined) return '';
    return usersNameMap.get(String(id)) ?? String(id);
  };

  const selectableRows = useMemo(
    () =>
      visibleConsultations.filter(
        (consultation: any) => String(consultation.status ?? '').toUpperCase() === 'READY'
      ),
    [visibleConsultations]
  );

  const selectedSelectableCount = useMemo(
    () =>
      selectedRows.filter(selectedRowItem =>
        selectableRows.some(
          selectableRow =>
            String(selectableRow.id ?? selectableRow.key) ===
            String(selectedRowItem.id ?? selectedRowItem.key)
        )
      ).length,
    [selectableRows, selectedRows]
  );

  const allSelectableSelected =
    selectableRows.length > 0 && selectedSelectableCount === selectableRows.length;
  const isIndeterminate =
    selectedSelectableCount > 0 && selectedSelectableCount < selectableRows.length;

  const bulkLoading =
    visibleConsultations.length > 0 &&
    (patientsBulkLoading || usersBulkLoading || departmentsBulkLoading);

  const tableLoading = consultationsLoading || bulkLoading;

  useEffect(() => {
    if (openResponseModal) return;
    setSelectedConsultation(null);
    setResponseForm({ responseText: '' });
    setIsResponseReadOnly(false);
  }, [openResponseModal]);

  useEffect(() => {
    dispatch(setPageCode('My Consultation'));
    dispatch(setDivContent('My Consultation'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    if (loggedInUser?.id) {
      getPractitionerByUserId(loggedInUser.id);
    }
  }, [getPractitionerByUserId, loggedInUser?.id]);

  useEffect(() => {
    if (selectedFacilityId === null || selectedFacilityId === undefined) return;
    setRecord(prev => {
      if (prev?.facilityId !== undefined && prev?.facilityId !== null && prev?.facilityId !== '') {
        return prev;
      }
      return { ...prev, facilityId: selectedFacilityId };
    });
    getDepartmentsByFacility({ facilityId: selectedFacilityId });
  }, [selectedFacilityId, getDepartmentsByFacility]);

  useEffect(() => {
    if (!searchParams) return;
    lastSearchParamsRef.current = searchParams;
    triggerSearch(searchParams);
  }, [searchParams, triggerSearch]);

  useEffect(() => {
    if (patientIdsForBulk.length === 0) return;
    patientBulkIdsRef.current = patientIdsForBulk;
    getBulkPatientBasicInfo(patientIdsForBulk)
      .unwrap()
      .catch(() => { });
  }, [patientIdsForBulk, getBulkPatientBasicInfo]);

  useEffect(() => {
    if (departmentIdsForBulk.length === 0) return;
    getDepartmentsBulk(departmentIdsForBulk)
      .unwrap()
      .catch(() => { });
  }, [departmentIdsForBulk, getDepartmentsBulk]);

  useEffect(() => {
    if (userIdsForBulk.length === 0) return;
    usersBulkIdsRef.current = userIdsForBulk;
    getUsersBasicNamesBulk(userIdsForBulk)
      .unwrap()
      .catch(() => { });
  }, [userIdsForBulk, getUsersBasicNamesBulk]);

  useEffect(() => {
    if (!emrPatientData) return;
    const patientKey = String(emrPatientData?.key ?? emrPatientData?.id ?? '');
    if (!emrPatientKeyRef.current || patientKey !== emrPatientKeyRef.current) return;
    setEmrPatient(emrPatientData);
    dispatch(setPatient(emrPatientData));
  }, [emrPatientData, dispatch]);

  useEffect(() => {
    if (!emrEncounterData || !emrEncounterKey) return;
    const encounterKey = String(emrEncounterData?.key ?? emrEncounterData?.id ?? '');
    if (encounterKey && encounterKey === emrEncounterKey) {
      setEmrEncounter(emrEncounterData);
      dispatch(setEncounter(emrEncounterData));
    }
  }, [emrEncounterData, emrEncounterKey, dispatch]);

  useEffect(() => {
    if (page > 0 && page * pageSize >= totalCount) {
      setPage(0);
    }
  }, [page, pageSize, totalCount]);

  useEffect(() => {
    if (selectedRows.length === 0) return;
    setSelectedRows(previousRows =>
      previousRows.filter(selectedRowItem =>
        selectableRows.some(
          selectableRow =>
            String(selectableRow.id ?? selectableRow.key) ===
            String(selectedRowItem.id ?? selectedRowItem.key)
        )
      )
    );
  }, [selectableRows]);

  const handleConfirmAction = useCallback(async () => {
    if (!selectedRow) return;
    if (!loggedInUser?.id) {
      dispatch(notify({ msg: 'User ID is required to confirm consultations', sev: 'error' }));
      return;
    }
    if (!selectedRow?.id) {
      dispatch(notify({ msg: 'Consultation ID is missing', sev: 'error' }));
      return;
    }

    try {
      await confirmConsultation({
        id: Number(selectedRow.id),
        body: { confirmedBy: Number(loggedInUser.id) }
      }).unwrap();

      dispatch(notify({ msg: 'Consultation confirmed successfully', sev: 'success' }));
      refetchConsultations();
      setOpenActionModal(false);
      setSelectedRow(null);
    } catch {
      dispatch(notify({ msg: 'Failed to update consultation status', sev: 'error' }));
    }
  }, [confirmConsultation, dispatch, loggedInUser?.id, refetchConsultations, selectedRow]);

  const handleRejectAction = useCallback(async () => {
    if (!selectedRow?.id) {
      dispatch(notify({ msg: 'Consultation ID is missing', sev: 'error' }));
      return;
    }
    if (!loggedInUser?.id) {
      dispatch(notify({ msg: 'User ID is required to reject consultations', sev: 'error' }));
      return;
    }

    const reason = String(rejectForm?.reason ?? '').trim();
    if (!reason) {
      dispatch(notify({ msg: 'Reject reason is required', sev: 'warning' }));
      return;
    }

    try {
      await rejectConsultation({
        id: Number(selectedRow.id),
        body: { reason, rejectedBy: Number(loggedInUser.id) }
      }).unwrap();

      dispatch(notify({ msg: 'Consultation rejected successfully', sev: 'success' }));
      refetchConsultations();
      setOpenRejectModal(false);
      setRejectForm({ reason: '' });
      setSelectedRow(null);
    } catch {
      dispatch(notify({ msg: 'Failed to update consultation status', sev: 'error' }));
    }
  }, [
    dispatch,
    loggedInUser?.id,
    rejectConsultation,
    refetchConsultations,
    rejectForm?.reason,
    selectedRow
  ]);

  const toggleRowSelection = useCallback((rowData: any) => {
    setSelectedRows(previousRows => {
      const alreadySelected = previousRows.some(
        item => String(item.id ?? item.key) === String(rowData.id ?? rowData.key)
      );
      if (alreadySelected) {
        return previousRows.filter(
          item => String(item.id ?? item.key) !== String(rowData.id ?? rowData.key)
        );
      }
      return [...previousRows, rowData];
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (selectedRows.length === 0) return;

    const readyConsultations = selectedRows.filter(
      (consultation: any) => String(consultation.status ?? '').toUpperCase() === 'READY'
    );

    if (readyConsultations.length === 0) {
      dispatch(notify({ msg: 'Only READY consultations can be submitted', sev: 'warning' }));
      return;
    }

    try {
      const consultationIds = readyConsultations
        .map((consultation: any) => Number(consultation.id))
        .filter(id => !Number.isNaN(id));

      if (consultationIds.length === 0) {
        dispatch(notify({ msg: 'No valid consultation IDs found', sev: 'error' }));
        return;
      }

      await submitConsultations({ consultationIds }).unwrap();
      dispatch(
        notify({
          msg: `${readyConsultations.length} consultation(s) submitted successfully`,
          sev: 'success'
        })
      );
      refetchConsultations();
      setSelectedRows([]);
    } catch {
      dispatch(notify({ msg: 'Failed to submit consultations', sev: 'error' }));
    }
  }, [dispatch, refetchConsultations, selectedRows, submitConsultations]);

  const handleOpenResponseModal = useCallback((consultation: any, readOnly = false) => {
    setSelectedConsultation(consultation);
    setIsResponseReadOnly(readOnly);
    setResponseForm({ responseText: consultation?.responseText ?? '' });
    setOpenResponseModal(true);
  }, []);

  const handleCloseResponseModal = useCallback(() => {
    setOpenResponseModal(false);
    setSelectedConsultation(null);
    setResponseForm({ responseText: '' });
    setIsResponseReadOnly(false);
  }, []);

  const handleSaveResponse = useCallback(async () => {
    if (!selectedConsultation) return;
    if (!loggedInUser?.id) {
      dispatch(notify({ msg: 'User ID is required to submit a response', sev: 'error' }));
      return;
    }
    if (!selectedConsultation?.id) {
      dispatch(notify({ msg: 'Consultation ID is missing', sev: 'error' }));
      return;
    }

    try {
      await submitConsultationResponse({
        id: Number(selectedConsultation.id),
        body: {
          responseText: String(responseForm?.responseText ?? ''),
          responseBy: Number(loggedInUser.id)
        }
      }).unwrap();

      dispatch(notify({ msg: 'Response saved successfully', sev: 'success' }));
      refetchConsultations();
      handleCloseResponseModal();
    } catch {
      dispatch(notify({ msg: 'Failed to save response', sev: 'error' }));
    }
  }, [
    dispatch,
    handleCloseResponseModal,
    loggedInUser?.id,
    refetchConsultations,
    responseForm?.responseText,
    selectedConsultation,
    submitConsultationResponse
  ]);

  const handleSelectAll = useCallback(() => {
    if (selectableRows.length === 0) return;
    if (allSelectableSelected) {
      setSelectedRows(previousRows =>
        previousRows.filter(
          item =>
            !selectableRows.some(row => String(row.id ?? row.key) === String(item.id ?? item.key))
        )
      );
      return;
    }
    setSelectedRows(selectableRows);
  }, [allSelectableSelected, selectableRows]);

  const handleOpenBulkServicesModal = useCallback((row: any) => {
    setSelectedConsultationForServices(row);
    setOpenBulkServicesModal(true);
  }, []);

  const handleCloseBulkServicesModal = useCallback(() => {
    setOpenBulkServicesModal(false);
    setSelectedConsultationForServices(null);
  }, []);

  const tableColumns = useMemo(
    () => [
      {
        key: 'select',
        title: (
          <Checkbox
            checked={allSelectableSelected}
            indeterminate={isIndeterminate}
            onChange={handleSelectAll}
          />
        ),
        width: 50,
        render: (row: any) => {
          const isReady = String(row.status ?? '').toUpperCase() === 'READY';

          return (
            <Checkbox
              checked={selectedRows.some(
                item => String(item.id ?? item.key) === String(row.id ?? row.key)
              )}
              onChange={() => toggleRowSelection(row)}
              disabled={!isReady}
            />
          );
        }
      },
      {
        key: 'patientInfo',
        title: <Translate>Patient Name</Translate>,
        flexGrow: 4,
        render: (row: any) => {
          const patientKey = row.patient?.id;

          const patient: any =
            patientKey != null ? patientMap.get(String(patientKey)) ?? row.patient : null;

          const patientName = `${String(patient?.firstName ?? '').trim()} ${String(
            patient?.lastName ?? ''
          ).trim()}`.trim();

          const patientMedicalRecordNumber = patient?.medicalRecordNumber;
          const patientGender = formatEnumString(patient?.sexAtBirth) || '';
          const patientDob = patient?.dateOfBirth ?? patient?.dob;
          const patientAge = patientDob ? calculateAgeFormat(patientDob) : '';

          return (
            <Whisper
              trigger="hover"
              placement="top"
              speaker={
                <Tooltip>
                  <div className="patient-tooltip">
                    {patientGender && (
                      <div>
                        <b>Gender:</b> {patientGender}
                      </div>
                    )}
                    {patientAge && (
                      <div>
                        <b>Age:</b> {patientAge}
                      </div>
                    )}
                    {patientMedicalRecordNumber && (
                      <div>
                        <b>MRN:</b> {patientMedicalRecordNumber}
                      </div>
                    )}
                  </div>
                </Tooltip>
              }
            >
              <span className="clickable-cell">{patientName}</span>
            </Whisper>
          );
        }
      },
      {
        key: 'consultationLevel',
        title: <Translate>Priority</Translate>,
        flexGrow: 1,
        render: (row: any) => (
          <MyBadgeStatus
            contant={row?.consultationLevel}
            color={getPriorityColor(row?.consultationLevel)}
          />
        )
      },
      {
        key: 'diagnosis',
        title: <Translate>Diagnosis</Translate>,
        flexGrow: 3
      },
      {
        key: 'findings',
        title: <Translate>Findings</Translate>,
        flexGrow: 3
      },
      {
        key: 'questionToConsultant',
        title: <Translate>Question To Consultant</Translate>,
        flexGrow: 4,
        render: (row: any) => {
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
        key: 'department',
        title: <Translate>FROM Department</Translate>,
        flexGrow: 2,
        render: (row: any) => {
          const deptId = row.fromDepartmentId;
          return conjureValueBasedOnIDFromList(
            departmentsBulk ?? departments,
            deptId ? Number(deptId) : deptId,
            'name'
          );
        }
      },
      {
        key: 'created',
        title: <Translate>Created By / At</Translate>,
        expandable: true,
        flexGrow: 2,
        render: (row: any) => (
          <>
            {row.createdBy}
            <br />
            <span className="date-table-style">
              {row.createdDate ? formatDateWithoutSeconds(row.createdDate) : ''}
            </span>
          </>
        )
      },
      {
        key: 'status',
        title: <Translate>Status</Translate>,
        flexGrow: 2,
        render: (row: any) => {
          const status = String(row.status ?? '').toUpperCase();
          const statusDisplay = status ? status.replace(/_/g, ' ') : '';
          return <MyBadgeStatus contant={statusDisplay} color={getStatusColor(status)} />;
        }
      },
      {
        key: 'confirmedByAt',
        title: 'Confirmed By/At',
        expandable: true,
        flexGrow: 2,
        render: (row: any) => {
          const confirmedAt = row.confirmedDate ?? row.confirmedAt;
          return (
            <>
              {resolveUserName(row.confirmedBy)}
              <br />
              <span className="date-table-style">{formatDateTime(confirmedAt)}</span>
            </>
          );
        }
      },
      {
        key: 'responseByAt',
        title: 'Response By/At',
        expandable: true,
        flexGrow: 2,
        render: (row: any) => {
          const responseAt = row.responseDate ?? row.responseAt;
          return (
            <>
              {resolveUserName(row.responseBy)}
              <br />
              <span className="date-table-style">{formatDateTime(responseAt)}</span>
            </>
          );
        }
      },
      {
        key: 'rejectedByAt',
        expandable: true,
        title: 'Rejected By/At',
        flexGrow: 2,
        render: (row: any) => {
          const rejectedAt = row.rejectedDate ?? row.rejectedAt;
          return (
            <>
              {resolveUserName(row.rejectedBy)}
              <br />
              <span className="date-table-style">{formatDateTime(rejectedAt)}</span>
            </>
          );
        }
      },
      {
        key: 'rejectReason',
        expandable: true,
        title: 'Reject Reason',
        flexGrow: 2,
        render: (row: any) => row.rejectReason || row.rejectReasonText || ''
      },
      {
        key: 'submittedByAt',
        title: 'Submitted By/At',
        expandable: true,
        flexGrow: 2,
        render: (row: any) => {
          const submittedAt = row.submittedDate ?? row.submittedAt;
          return (
            <>
              {resolveUserName(row.submittedBy)}
              <br />
              <span className="date-table-style">{formatDateTime(submittedAt)}</span>
            </>
          );
        }
      },
      {
        key: 'actions',
        title: <Translate>ACTIONS</Translate>,
        flexGrow: 5,
        render: (row: any) => {
          const status = String(row.status ?? '').toUpperCase();

          const disableActions = ['SUBMITTED', 'READY'].includes(status);
          const disableConfirm =
            status === 'CONFIRMED' || status === 'REJECTED' || disableActions;
          const disableReject =
            status === 'CONFIRMED' || status === 'REJECTED' || disableActions;

          const canOpenResponse = ['READY', 'CONFIRMED', 'SUBMITTED'].includes(status);
          const disableResponse = !canOpenResponse;

          const responseReadOnly = status === 'SUBMITTED';
          const responseTooltipLabel = responseReadOnly
            ? 'View Response'
            : 'Add Response';

          const canAddServices = status === 'SUBMITTED';

          return (
            <div className="actions-cell">
              {/* Open EMR */}
              <Whisper trigger="hover" placement="top" speaker={<Tooltip>Open EMR</Tooltip>}>
                <div>
                  <MyButton
                    size="small"
                    radius="6px"
                    backgroundColor="violet"
                    onClick={() => {
                      const patientKey = row.patient?.id;
                      const encounterKey = row.encounter?.id;

                      const patientFromMap =
                        patientKey != null ? patientMap.get(String(patientKey)) : null;

                      const patient = patientFromMap ?? row.patient ?? null;

                      if (patient) {
                        setEmrPatient(patient);
                        dispatch(setPatient(patient));
                      }

                      if (patientKey != null) {
                        emrPatientKeyRef.current = String(patientKey);
                      }

                      if (!patient && patientKey != null) {
                        fetchPatientById(String(patientKey));
                      }

                      if (encounterKey != null) {
                        setEmrEncounterKey(String(encounterKey));
                        setEmrEncounter(row.encounter);
                        dispatch(setEncounter(row.encounter));
                      }

                      setOpenEMRModal(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faFileLines} color="white" />
                  </MyButton>
                </div>
              </Whisper>

              {/* Confirm */}
              <Whisper trigger="hover" placement="top" speaker={<Tooltip>Confirm</Tooltip>}>
                <div>
                  <MyButton
                    size="small"
                    radius="6px"
                    backgroundColor="darkblue"
                    disabled={disableConfirm}
                    onClick={() => {
                      setSelectedRow(row);
                      setOpenActionModal(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faCircleCheck} color="white" />
                  </MyButton>
                </div>
              </Whisper>

              {/* Reject */}
              <Whisper trigger="hover" placement="top" speaker={<Tooltip>Reject</Tooltip>}>
                <div>
                  <MyButton
                    size="small"
                    radius="6px"
                    backgroundColor="gray"
                    disabled={disableReject}
                    onClick={() => {
                      setSelectedRow(row);
                      setRejectForm({ reason: '' });
                      setOpenRejectModal(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faCircleXmark} color="white" />
                  </MyButton>
                </div>
              </Whisper>

              {/* Response */}
              <Whisper
                trigger="hover"
                placement="top"
                speaker={<Tooltip>{responseTooltipLabel}</Tooltip>}
              >
                <div>
                  <MyButton
                    size="small"
                    radius="6px"
                    backgroundColor="light-blue"
                    disabled={disableResponse}
                    onClick={() => handleOpenResponseModal(row, responseReadOnly)}
                  >
                    <FontAwesomeIcon icon={faFilePen} color="white" />
                  </MyButton>
                </div>
              </Whisper>

              {/* Add Services ✅ */}
              <Whisper
                trigger="hover"
                placement="top"
                speaker={
                  <Tooltip>
                    {canAddServices
                      ? 'Add Services'
                      : 'You can add services only after submitting response'}
                  </Tooltip>
                }
              >
                <div>
                  <MyButton
                    size="small"
                    radius="6px"
                    backgroundColor="green"
                    disabled={!canAddServices}
                    onClick={() => handleOpenBulkServicesModal(row)}
                  >
                    <FontAwesomeIcon icon={faPlus} color="white" />
                  </MyButton>
                </div>
              </Whisper>

            </div>
          );
        }
      }
    ],
    [
      allSelectableSelected,
      departments,
      departmentsBulk,
      dispatch,
      fetchPatientById,
      formatDateTime,
      handleOpenBulkServicesModal,
      handleOpenResponseModal,
      handleSelectAll,
      isIndeterminate,
      patientMap,
      resolveUserName,
      selectedRows,
      toggleRowSelection
    ]
  );

  const filters = useMemo(
    () => (
      <Form fluid>
        <div className="filters-container">
          <MyInput
            fieldLabel="Request Date From"
            fieldName="requestDateFrom"
            fieldType="date"
            width="10vw"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            fieldLabel="Request Date To"
            fieldName="requestDateTo"
            fieldType="date"
            width="10vw"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            width="12vw"
            fieldType="select"
            fieldLabel="Facility"
            fieldName="facilityId"
            selectData={facilities}
            selectDataLabel="name"
            selectDataValue="id"
            record={record}
            setRecord={updated => {
              setRecord((prev: any) => {
                const facilityChanged =
                  String(updated?.facilityId ?? '') !== String(prev?.facilityId ?? '');
                const next = {
                  ...updated,
                  departmentId: facilityChanged ? [] : updated?.departmentId
                };
                if (next.facilityId) {
                  getDepartmentsByFacility({ facilityId: next.facilityId });
                }
                return next;
              });
            }}
          />
          <MyInput
            width="12vw"
            fieldType="checkPicker"
            fieldLabel="Department"
            fieldName="departmentId"
            selectData={departments}
            selectDataLabel="name"
            selectDataValue="id"
            record={record}
            setRecord={setRecord}
            disabled={departments.length === 0}
          />
          <div className="show-rejected-checkbox">
            <Checkbox checked={showRejected} onChange={() => setShowRejected(!showRejected)}>
              Show Rejected
            </Checkbox>
          </div>
        </div>
      </Form>
    ),
    [departments, facilities, getDepartmentsByFacility, record, showRejected]
  );

  const tablebuttons = useMemo(
    () => (
      <div className="bt-div-2">
        <div className="bt-left-2"></div>
        <div className="bt-right-2">
          <MyButton
            color="var(--deep-blue)"
            prefixIcon={() => <FaCheck />}
            width="109px"
            onClick={handleSubmit}
            disabled={selectedRows.length === 0}
          >
            <Translate>Submit</Translate>
          </MyButton>
        </div>
      </div>
    ),
    [handleSubmit, selectedRows.length]
  );

  if (!selectedDepartment?.departmentId) {
    return (
      <Panel>
        <div className="no-department-message">
          <p>Please select a department to view consultations.</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <MyTable
        data={visibleConsultations}
        columns={tableColumns}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        filters={filters}
        loading={tableLoading}
        tableButtons={tablebuttons}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      <DeletionConfirmationModal
        open={openActionModal}
        setOpen={setOpenActionModal}
        itemToDelete={selectedRow?.patientName}
        actionType="confirm"
        actionButtonFunction={handleConfirmAction}
        confirmationQuestion="Are you sure you want to confirm this consultation?"
      />

      <MyModal
        open={openResponseModal}
        setOpen={setOpenResponseModal}
        title="Consultation Response"
        size="30vw"
        bodyheight="20vh"
        actionButtonLabel={isResponseReadOnly ? 'Close' : 'Save'}
        actionButtonFunction={isResponseReadOnly ? handleCloseResponseModal : handleSaveResponse}
        isDisabledActionBtn={!isResponseReadOnly && !String(responseForm?.responseText ?? '').trim()}
        handleCancelFunction={handleCloseResponseModal}
        content={
          <Form fluid>
            <MyInput
              fieldLabel="Response"
              fieldName="responseText"
              fieldType="textarea"
              rows={6}
              width="100%"
              record={responseForm}
              setRecord={setResponseForm}
              disabled={isResponseReadOnly}
            />
          </Form>
        }
      />

      <MyModal
        open={openRejectModal}
        setOpen={setOpenRejectModal}
        title="Reject Consultation"
        size="30vw"
        bodyheight="20vh"
        actionButtonLabel="Reject"
        actionButtonFunction={handleRejectAction}
        isDisabledActionBtn={!String(rejectForm?.reason ?? '').trim()}
        handleCancelFunction={() => {
          setRejectForm({ reason: '' });
          setOpenRejectModal(false);
        }}
        content={
          <Form fluid>
            <MyInput
              fieldLabel="Reject Reason"
              fieldName="reason"
              fieldType="textarea"
              rows={4}
              width="100%"
              record={rejectForm}
              setRecord={setRejectForm}
            />
          </Form>
        }
      />

      <AddBulkServicesToConsultationModal
        open={openBulkServicesModal}
        setOpen={setOpenBulkServicesModal}
        consultationRow={selectedConsultationForServices}
        onSuccess={() => {
          handleCloseBulkServicesModal();
          refetchConsultations();
        }}
      />

      <MyModal
        open={openEMRModal}
        setOpen={setOpenEMRModal}
        title="Electronic Medical Record"
        size="90vw"
        content={
          emrPatient && emrEncounter ? (
            <PatientEMRModal patient={emrPatient} encounter={emrEncounter} />
          ) : (
            <div className="no-patient-selected">No patient selected.</div>
          )
        }
        actionButtonLabel="Close"
        actionButtonFunction={() => setOpenEMRModal(false)}
        cancelButtonLabel="Cancel"
      />
    </Panel>
  );
};

export default MyConsultations;