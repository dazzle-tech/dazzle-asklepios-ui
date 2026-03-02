import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox, Form, Panel, Tooltip, Whisper } from 'rsuite';
import MyTable from '@/components/MyTable';
import './styles.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faCircleXmark,
  faFileLines,
  faFilePen,
  faUpload
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
  calculateAgeFormat
} from '@/utils';

const MyConsultations = () => {
  const dispatch = useDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const selectedDepartment = authSlice.selectedDepartment;
  const loggedInUser = authSlice.user;
  console.log('Selected Department--------> :', selectedDepartment);
  const selectedFacilityId =
    authSlice?.selectedDepartment?.facilityId ?? authSlice?.tenant?.selectedFacility?.id;
  console.log('Selected Facility ID:', selectedFacilityId);
  const todayString = new Date().toISOString().slice(0, 10);
  const toISOStartOfDay = (value: Date | string) => {
    const d = value instanceof Date ? new Date(value) : new Date(String(value));
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  };

  const toISOEndOfDay = (value: Date | string) => {
    const d = value instanceof Date ? new Date(value) : new Date(String(value));
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  };
  const formatDateTime = React.useCallback(
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
  const [selectedRows, setSelectedRows] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Response modal states
  const [openResponseModal, setOpenResponseModal] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
  const [responseForm, setResponseForm] = useState({ responseText: '' });
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [rejectForm, setRejectForm] = useState({ reason: '' });
  const [openEMRModal, setOpenEMRModal] = useState(false);
  const [emrPatient, setEmrPatient] = useState<any>(null);
  const [emrEncounter, setEmrEncounter] = useState<any>(null);
  const emrPatientKeyRef = useRef<string | null>(null);

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
  const [emrEncounterKey, setEmrEncounterKey] = useState<string | null>(null);
  const { data: emrEncounterData } = useGetEncounterByIdQuery(emrEncounterKey ?? '', {
    skip: !emrEncounterKey
  });
  const usersBulkIdsRef = useRef<number[]>([]);
  const patientBulkIdsRef = useRef<number[]>([]);
  const lastSearchParamsRef = useRef<any>(null);

  useEffect(() => {
    if (openResponseModal) return;
    setSelectedConsultation(null);
    setResponseForm({ responseText: '' });
  }, [openResponseModal]);

  // Header setup
  useEffect(() => {
    const divContent = 'My Consultation';
    dispatch(setPageCode('My Consultation'));
    dispatch(setDivContent(divContent));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const [getPractitionerByUserId, { data: practitionerResponse }] =
    useLazyGetPractitionerByUserIdQuery();

  useEffect(() => {
    if (loggedInUser?.id) {
      getPractitionerByUserId(loggedInUser.id);
    }
  }, [loggedInUser?.id]);

  const practitionerId = practitionerResponse?.id?.toString() || '';
  console.log('Practitioner ID:', practitionerId);

  const [getDepartmentsByFacility, { data: departmentListResponse }] =
    useLazyGetActiveDepartmentByFacilityListQuery();
  const [getDepartmentsBulk, { data: departmentsBulk, isLoading: departmentsBulkLoading }] =
    useGetDepartmentsBulkMutation();
  const { data: facilityListResponse } = useGetAllFacilitiesQuery(null);

  // Default facility selection (when available)
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

  // Search consultations via portal API
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
      fromDate: toISOStartOfDay(fromDateValue),
      toDate: toISOEndOfDay(toDateValue),
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

  useEffect(() => {
    if (!searchParams) return;
    lastSearchParamsRef.current = searchParams;
    triggerSearch(searchParams);
  }, [searchParams, triggerSearch]);

  const consultationResponse = searchResult.data;
  const consultationsLoading = searchResult.isFetching || searchResult.isLoading;
  const refetchConsultations = () => {
    if (lastSearchParamsRef.current) {
      triggerSearch(lastSearchParamsRef.current);
    }
  };

  const facilities = Array.isArray(facilityListResponse) ? facilityListResponse : [];
  const departments = Array.isArray(departmentListResponse) ? departmentListResponse : [];

  const pageIndex = page;
  const rowsPerPage = pageSize;
  const totalCount = consultationResponse?.totalCount ?? (consultationResponse?.data?.length ?? 0);

  const handlePageChange = React.useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPageSize(parseInt(event.target.value, 10));
      setPage(0);
    },
    []
  );

  // Extract consultation data from API response
  // API now returns a flat list of all visible consultations
  const allConsultations = consultationResponse?.data ?? [];
  const visibleConsultations = useMemo(() => {
    const start = page * pageSize;
    return allConsultations.slice(start, start + pageSize);
  }, [allConsultations, page, pageSize]);

  // Get unique patient ids from consultations
  const patientIdsForBulk = useMemo(
    () =>
      Array.from(
        new Set(
          visibleConsultations
            .map((c: any) => c.patientId ?? c.patient?.id ?? c.patientKey)
            .filter(Boolean)
            .map((id: any) => Number(id))
            .filter(id => !Number.isNaN(id))
        )
      ),
    [visibleConsultations]
  );
  console.log('patientIdsForBulk=====>', patientIdsForBulk);
  useEffect(() => {
    if (patientIdsForBulk.length === 0) return;
    patientBulkIdsRef.current = patientIdsForBulk;
    getBulkPatientBasicInfo(patientIdsForBulk)
      .unwrap()
      .catch(() => {});
  }, [patientIdsForBulk, getBulkPatientBasicInfo]);

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

  // Get unique encounter keys/ids from consultations
  // const uniqueEncounterKeys = new Set(
  //   allConsultations.map((c: any) => c.encounterId ?? c.visitKey).filter(Boolean)
  // );
  // const encounterKeysArray = Array.from(uniqueEncounterKeys).map(id => String(id));

  // Get unique department ids from consultations (toDepartmentId preferred)
  const departmentIdsForBulk = useMemo(
    () =>
      Array.from(
        new Set(
          visibleConsultations
            .map((c: any) => c.toDepartmentId ?? c.fromDepartmentId ?? c.departmentKey)
            .filter(Boolean)
            .map((id: any) => Number(id))
            .filter(id => !Number.isNaN(id))
        )
      ),
    [visibleConsultations]
  );

  const userIdsForBulk = useMemo(
    () =>
      Array.from(
        new Set(
          visibleConsultations
            .flatMap((c: any) => [c.confirmedBy, c.responseBy, c.rejectedBy])
            .filter(id => id !== null && id !== undefined)
            .map((id: any) => Number(id))
            .filter(id => !Number.isNaN(id))
        )
      ),
    [visibleConsultations]
  );

  useEffect(() => {
    if (departmentIdsForBulk.length === 0) return;
    getDepartmentsBulk(departmentIdsForBulk)
      .unwrap()
      .catch(() => {});
  }, [departmentIdsForBulk, getDepartmentsBulk]);

  useEffect(() => {
    if (userIdsForBulk.length === 0) return;
    usersBulkIdsRef.current = userIdsForBulk;
    getUsersBasicNamesBulk(userIdsForBulk)
      .unwrap()
      .catch(() => {});
  }, [userIdsForBulk, getUsersBasicNamesBulk]);

  const usersNameMap = useMemo(() => {
    const map = new Map<string, string>();
    const ids = usersBulkIdsRef.current;
    (usersBasicNames ?? []).forEach((u: any, idx: number) => {
      const id = u?.id ?? ids[idx];
      if (id == null) return;
      const fullName = `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim();
      map.set(String(id), fullName || String(id));
    });
    return map;
  }, [usersBasicNames]);

  const resolveUserName = (id: number | string | null | undefined) => {
    if (id === null || id === undefined) return '';
    return usersNameMap.get(String(id)) ?? String(id);
  };

  // Fetch all encounters
  // const { data: encountersResponse, isLoading: encountersLoading } = useGetEncountersQuery(
  //   {
  //     ...initialListRequest,
  //     pageSize: 1000,
  //     ignore: false,
  //     filters:
  //       encounterKeysArray.length > 0
  //         ? [
  //             {
  //               fieldName: 'key',
  //               operator: 'in',
  //               value: encounterKeysArray.map(key => `(${key})`).join(' ')
  //             }
  //           ]
  //         : []
  //   },
  //   {
  //     skip: encounterKeysArray.length === 0
  //   }
  // );

  // Create a lookup map for encounters
  // const encounterMap = new Map();
  // (encountersResponse?.object || []).forEach((encounter: any) => {
  //   if (encounter?.key != null) {
  //     encounterMap.set(String(encounter.key), encounter);
  //   }
  //   if (encounter?.id != null) {
  //     encounterMap.set(String(encounter.id), encounter);
  //   }
  // });

  // Fetch patient diagnoses for all consultations
  // const { data: diagnosisResponse, isLoading: diagnosisLoading } = useGetPatientDiagnosisQuery(
  //   {
  //     ...initialListRequest,
  //     pageSize: 1000,
  //     ignore: false,
  //     sortBy: 'createdAt',
  //     sortType: 'desc',
  //     filters:
  //       encounterKeysArray.length > 0
  //         ? [
  //             {
  //               fieldName: 'visit_key',
  //               operator: 'in',
  //               value: encounterKeysArray.map(key => `(${key})`).join(' ')
  //             }
  //           ]
  //         : []
  //   },
  //   {
  //     skip: encounterKeysArray.length === 0
  //   }
  // );

  // Group diagnoses by visit_key and get the first diagnosis for each
  // const diagnosisMap = new Map();
  // (diagnosisResponse?.object || []).forEach((diagnosis: any) => {
  //   const visitKey = diagnosis?.visitKey != null ? String(diagnosis.visitKey) : '';
  //   if (visitKey && !diagnosisMap.has(visitKey)) {
  //     diagnosisMap.set(visitKey, diagnosis);
  //   }
  // });

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

  const bulkLoading =
    visibleConsultations.length > 0 &&
    (patientsBulkLoading || usersBulkLoading || departmentsBulkLoading);

  const tableLoading = consultationsLoading || bulkLoading;
  useEffect(() => {
    if (page > 0 && page * pageSize >= totalCount) {
      setPage(0);
    }
  }, [page, pageSize, totalCount]);
  const handleConfirmAction = React.useCallback(async () => {
    if (!selectedRow) return;
    if (!loggedInUser?.id) {
      dispatch(
        notify({
          msg: 'User ID is required to confirm consultations',
          sev: 'error'
        })
      );
      return;
    }
    if (!selectedRow?.id) {
      dispatch(
        notify({
          msg: 'Consultation ID is missing',
          sev: 'error'
        })
      );
      return;
    }

    try {
      await confirmConsultation({
        id: Number(selectedRow.id),
        body: {
          confirmedBy: Number(loggedInUser.id)
        }
      }).unwrap();

      dispatch(
        notify({
          msg: 'Consultation confirmed successfully',
          sev: 'success'
        })
      );

      refetchConsultations();
      setOpenActionModal(false);
      setSelectedRow(null);
    } catch (error) {
      dispatch(
        notify({
          msg: 'Failed to update consultation status',
          sev: 'error'
        })
      );
    }
  }, [confirmConsultation, dispatch, loggedInUser?.id, refetchConsultations, selectedRow]);

  const handleRejectAction = React.useCallback(async () => {
    if (!selectedRow?.id) {
      dispatch(
        notify({
          msg: 'Consultation ID is missing',
          sev: 'error'
        })
      );
      return;
    }
    if (!loggedInUser?.id) {
      dispatch(
        notify({
          msg: 'User ID is required to reject consultations',
          sev: 'error'
        })
      );
      return;
    }

    const reason = String(rejectForm?.reason ?? '').trim();
    if (!reason) {
      dispatch(
        notify({
          msg: 'Reject reason is required',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      await rejectConsultation({
        id: Number(selectedRow.id),
        body: {
          reason,
          rejectedBy: Number(loggedInUser.id)
        }
      }).unwrap();

      dispatch(
        notify({
          msg: 'Consultation rejected successfully',
          sev: 'success'
        })
      );

      refetchConsultations();
      setOpenRejectModal(false);
      setRejectForm({ reason: '' });
      setSelectedRow(null);
    } catch (error) {
      dispatch(
        notify({
          msg: 'Failed to update consultation status',
          sev: 'error'
        })
      );
    }
  }, [
    dispatch,
    loggedInUser?.id,
    rejectConsultation,
    refetchConsultations,
    rejectForm?.reason,
    selectedRow
  ]);

  const toggleRowSelection = React.useCallback(rowData => {
    setSelectedRows(prev =>
      prev.some(r => String(r.id ?? r.key) === String(rowData.id ?? rowData.key))
        ? prev.filter(r => String(r.id ?? r.key) !== String(rowData.id ?? rowData.key))
        : [...prev, rowData]
    );
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (selectedRows.length === 0) return;

    // Filter only READY consultations
    const readyConsultations = selectedRows.filter(
      (consultation: any) => String(consultation.status ?? '').toUpperCase() === 'READY'
    );

    if (readyConsultations.length === 0) {
      dispatch(
        notify({
          msg: 'Only READY consultations can be submitted',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      const consultationIds = readyConsultations
        .map((consultation: any) => Number(consultation.id))
        .filter(id => !Number.isNaN(id));

      if (consultationIds.length === 0) {
        dispatch(
          notify({
            msg: 'No valid consultation IDs found',
            sev: 'error'
          })
        );
        return;
      }

      await submitConsultations({
        consultationIds
      }).unwrap();

      dispatch(
        notify({
          msg: `${readyConsultations.length} consultation(s) submitted successfully`,
          sev: 'success'
        })
      );

      refetchConsultations();
      setSelectedRows([]);
    } catch (error) {
      dispatch(
        notify({
          msg: 'Failed to submit consultations',
          sev: 'error'
        })
      );
    }
  }, [dispatch, refetchConsultations, selectedRows, submitConsultations]);

  const handleOpenResponseModal = React.useCallback((consultation: any) => {
    setSelectedConsultation(consultation);
    setResponseForm({ responseText: consultation?.responseText ?? '' });
    setOpenResponseModal(true);
  }, []);

  const handleCloseResponseModal = React.useCallback(() => {
    setOpenResponseModal(false);
    setSelectedConsultation(null);
    setResponseForm({ responseText: '' });
  }, []);

  const handleSaveResponse = React.useCallback(async () => {
    if (!selectedConsultation) return;
    if (!loggedInUser?.id) {
      dispatch(
        notify({
          msg: 'User ID is required to submit a response',
          sev: 'error'
        })
      );
      return;
    }
    if (!selectedConsultation?.id) {
      dispatch(
        notify({
          msg: 'Consultation ID is missing',
          sev: 'error'
        })
      );
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

      dispatch(
        notify({
          msg: 'Response saved successfully',
          sev: 'success'
        })
      );

      refetchConsultations();
      handleCloseResponseModal();
    } catch (error) {
      dispatch(
        notify({
          msg: 'Failed to save response',
          sev: 'error'
        })
      );
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

  const selectableRows = useMemo(
    () => visibleConsultations.filter((row: any) => String(row.status ?? '').toUpperCase() === 'READY'),
    [visibleConsultations]
  );

  const selectedSelectableCount = useMemo(
    () =>
      selectedRows.filter(r =>
        selectableRows.some(s => String(s.id ?? s.key) === String(r.id ?? r.key))
      ).length,
    [selectableRows, selectedRows]
  );

  const allSelectableSelected =
    selectableRows.length > 0 && selectedSelectableCount === selectableRows.length;
  const isIndeterminate =
    selectedSelectableCount > 0 && selectedSelectableCount < selectableRows.length;

  useEffect(() => {
    if (selectedRows.length === 0) return;
    setSelectedRows(prev =>
      prev.filter(r => selectableRows.some(s => String(s.id ?? s.key) === String(r.id ?? r.key)))
    );
  }, [selectableRows]);

  const handleSelectAll = React.useCallback(() => {
    if (selectableRows.length === 0) return;
    if (allSelectableSelected) {
      setSelectedRows(prev =>
        prev.filter(r => !selectableRows.some(s => String(s.id ?? s.key) === String(r.id ?? r.key)))
      );
      return;
    }

    setSelectedRows(selectableRows);
  }, [allSelectableSelected, selectableRows]);

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
      render: row => {
        const status = String(row.status ?? '').toUpperCase();
        const isReady = status === 'READY';
        return (
          <Checkbox
            checked={selectedRows.some(r => String(r.id ?? r.key) === String(row.id ?? row.key))}
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
      render: row => {
        // Get patient data from the map using patientKey
        const patientKey = row.patientId ?? row.patient?.id ?? row.patientKey;
        const patientFromMap = patientKey != null ? patientMap.get(String(patientKey)) : null;
        const patient: any = patientFromMap ?? row.patient;
        const firstName = String(patient?.firstName).trim();
        const lastName = String(patient?.lastName).trim();
        const patientName = `${firstName} ${lastName}`.trim();
        const patientGender =
          patient?.genderLvalue?.lovDisplayVale || patient?.genderLkey || patient?.sexAtBirth || '';
        const patientDob = patient?.dateOfBirth ?? patient?.dob;
        const patientAge = patientDob ? calculateAgeFormat(patientDob) : '';

        return (
          <Whisper
            trigger="hover"
            placement="top"
            speaker={
              <Tooltip>
                <div style={{ padding: '4px 8px' }}>
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
                </div>
              </Tooltip>
            }
          >
            <span style={{ cursor: 'pointer' }}>{patientName}</span>
          </Whisper>
        );
      }
    },
    {
      key: 'consultationLevel',
      title: <Translate>Priority</Translate>,
      flexGrow: 1,
      render: row => {
        let color = '#6c757d';
        if (row.consultationLevel === 'CRITICAL') color = '#D64545';
        if (row.consultationLevel === 'REGULAR') color = '#0DAA41';
        return <MyBadgeStatus contant={row?.consultationLevel} color={color} />;
      }
    },
    {
      key: 'diagnosis',
      title: <Translate>Diagnosis</Translate>,
      flexGrow: 3
      // render: row => {
      //   const diagnosisKey =
      //     row.encounterId != null ? String(row.encounterId) : String(row.visitKey ?? '');
      //   const diagnosis: any = diagnosisKey ? diagnosisMap.get(diagnosisKey) : null;
      //   const diagnosisObject = diagnosis?.diagnosisObject;
      //   if (diagnosisObject && diagnosisObject.icdCode && diagnosisObject.description) {
      //     return `${diagnosisObject.icdCode}, ${diagnosisObject.description}`;
      //   }
      //   return '';
      // }
    },
    {
      key: 'findings',
      title: <Translate>Findings</Translate>,
      flexGrow: 3
      // render: row => {
      //   const encounter: any = encounterMap.get(String(row.encounterId ?? row.visitKey));
      //   return encounter?.physicalExamNote || encounter?.findings || '';
      // }
    },
    {
      key: 'questionToConsultant',
      title: <Translate>Question To Consultant</Translate>,
      flexGrow: 4,
      render: row => {
        const text = row.consultationContent || '';
        const MAX = 35;
        const isLong = text.length > MAX;
        const shortText = isLong ? text.substring(0, MAX) + '...' : text;

        return (
          <Whisper
            trigger={isLong ? 'hover' : 'none'}
            placement="top"
            speaker={<Tooltip style={{ maxWidth: '300px', whiteSpace: 'normal' }}>{text}</Tooltip>}
          >
            <span style={{ cursor: isLong ? 'pointer' : 'default' }}>{shortText}</span>
          </Whisper>
        );
      }
    },
    {
      key: 'department',
      title: <Translate>FROM Department</Translate>,
      flexGrow: 2,
      render: row => {
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
      render: row => (
        <>
          {row.createdBy}
          <br />
          <span className="date-table-style">
            {row.createdAt ? formatDateWithoutSeconds(row.createdAt) : ''}
          </span>
        </>
      )
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 2,
      render: row => {
        const status = String(row.status ?? '').toUpperCase();
        const statusDisplay = status ? status.replace(/_/g, ' ') : '';
        let color = '#6c757d';
        if (status === 'REQUESTED') color = '#E6A100';
        if (status === 'CONFIRMED') color = '#0DAA41';
        if (status === 'REJECTED') color = '#D64545';
        if (status === 'SUBMITTED') color = '#0B5ED7';
        if (status === 'READY') color = '#17A2B8';

        return <MyBadgeStatus contant={statusDisplay} color={color} />;
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
      key: 'actions',
      title: <Translate>ACTIONS</Translate>,
      flexGrow: 4,
      render: row => {
        const status = String(row.status ?? '').toUpperCase();
        const disableActions = ['SUBMITTED', 'READY'].includes(status);
        const disableConfirm = status === 'CONFIRMED' || status === 'REJECTED' || disableActions;
        const disableReject = status === 'CONFIRMED' || status === 'REJECTED' || disableActions;
        const disableResponse = status !== 'CONFIRMED';

        return (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Whisper trigger="hover" placement="top" speaker={<Tooltip>Open EMR</Tooltip>}>
              <div>
                <MyButton
                  size="small"
                  radius="6px"
                  backgroundColor="violet"
                  onClick={() => {
                    const patientKey = row.patientId ?? row.patient?.id ?? row.patientKey;
                    const encounterKey = row.encounterId ?? row.visitKey;
                    const patientFromMap =
                      patientKey != null ? patientMap.get(String(patientKey)) : null;
                    const patient = patientFromMap ?? row.patient;
                    // const encounter = encounterMap.get(String(encounterKey));

                    if (patient) {
                      dispatch(setPatient(patient));
                    }
                    // if (encounter) {
                    //   dispatch(setEncounter(encounter));
                    // }

                    setEmrPatient(patient ?? null);
                    // setEmrEncounter(encounter ?? null);
                    if (patientKey != null) {
                      emrPatientKeyRef.current = String(patientKey);
                    }
                    if (!patient && patientKey != null) {
                      fetchPatientById(String(patientKey));
                    }
                    if (encounterKey != null) {
                      setEmrEncounterKey(String(encounterKey));
                    }
                    setOpenEMRModal(true);
                  }}
                >
                  <FontAwesomeIcon icon={faFileLines} color="white" />
                </MyButton>
              </div>
            </Whisper>
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
            <Whisper trigger="hover" placement="top" speaker={<Tooltip>Add Response</Tooltip>}>
              <div>
                <MyButton
                  size="small"
                  radius="6px"
                  backgroundColor="light-blue"
                  disabled={disableResponse}
                  onClick={() => handleOpenResponseModal(row)}
                >
                  <FontAwesomeIcon icon={faFilePen} color="white" />
                </MyButton>
              </div>
            </Whisper>
            <Whisper trigger="hover" placement="top" speaker={<Tooltip>Add Report</Tooltip>}>
              <div>
                <MyButton size="small" radius="6px" backgroundColor="black">
                  <FontAwesomeIcon icon={faUpload} color="white" />
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
      handleOpenResponseModal,
      handleSelectAll,
      patientMap,
      resolveUserName,
      selectedRows,
      toggleRowSelection,
      isIndeterminate,
      departmentsBulk,
      departments,
      dispatch,
      fetchPatientById,
      formatDateTime,
      setEmrEncounterKey,
      setEmrPatient,
      setSelectedRow,
      setOpenActionModal,
      setOpenEMRModal,
      setOpenRejectModal,
      setRejectForm
    ]
  );

  const filters = useMemo(
    () => (
      <>
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
                setRecord(prev => {
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
            <div style={{ marginTop: '23px' }}>
              <Checkbox checked={showRejected} onChange={() => setShowRejected(!showRejected)}>
                Show Rejected
              </Checkbox>
            </div>
          </div>
        </Form>
      </>
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
            Submit
          </MyButton>
        </div>
      </div>
    ),
    [handleSubmit, selectedRows.length]
  );

  if (!selectedDepartment?.departmentId) {
    return (
      <Panel>
        <div style={{ padding: '20px', textAlign: 'center' }}>
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
        actionButtonLabel="Save"
        actionButtonFunction={handleSaveResponse}
        isDisabledActionBtn={!String(responseForm?.responseText ?? '').trim()}
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
        handleCancelFunction={() => setRejectForm({ reason: '' })}
        content={
          <Form fluid>
            <MyInput
              fieldLabel="Reject Reason"
              fieldName="reason"
              fieldType="textarea"
              rows={4}
              width={'100%'}
              record={rejectForm}
              setRecord={setRejectForm}
            />
          </Form>
        }
      />

      <MyModal
        open={openEMRModal}
        setOpen={setOpenEMRModal}
        title="Electronic Medical Record"
        size="90vw"
        content={
          emrPatient && emrEncounter ? (
            <PatientEMRModal inModal patient={emrPatient} encounter={emrEncounter} />
          ) : (
            <div style={{ padding: 16 }}>No patient selected.</div>
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
