import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { newApEncounter } from '@/types/model-types-constructor';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { faUserPlus, faBolt } from '@fortawesome/free-solid-svg-icons';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
import { Badge, Form, Panel, Tooltip, Whisper } from 'rsuite';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import 'react-tabs/style/react-tabs.css';
import { formatDate } from '@/utils';
import { faCommentMedical } from '@fortawesome/free-solid-svg-icons';
import { initialListRequest, ListRequest } from '@/types/types';
import {
  useGetEREncountersListQuery,
  useSaveEncounterChangesMutation,
  useCancelEncounterMutation
} from '@/services/encounterService';
import { useLocation } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useDispatch, useSelector } from 'react-redux';
import ReactDOMServer from 'react-dom/server';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { faBarcode } from '@fortawesome/free-solid-svg-icons';
import { faCirclePlay } from '@fortawesome/free-solid-svg-icons';
import { faRectangleXmark } from '@fortawesome/free-solid-svg-icons';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useEnumOptions } from '@/services/enumsApi';
import { resetRefetchEncounter } from '@/reducers/refetchEncounterState';
import { useNavigate } from 'react-router-dom';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import SendToModal from './SendToModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';
import PatientSearch from '@/components/PatientSearch';
import ProfileSidebarNew from '@/pages/patient/patient-profile/ProfileSidebar-new';
import CreateNewPatient from '@/pages/patient/facility-patient-list/CreateNewPatient';
import QuickPatient from '@/pages/patient/facility-patient-list/QuickPatient';
import './styles.less';

import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const ERTriage = () => {
  const COMPLETE_TRIAGE_STATUS_KEY = '91109811181900';
  const SENT_TO_ER_STATUS_KEY = '6742317684600328';

  const toDateSafe = (value: any): Date | null => {
    if (!value && value !== 0) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === 'number') {
      // heuristics: seconds vs millis
      const ms = value < 1e12 ? value * 1000 : value;
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof value === 'string') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  const formatDateTime = (value: any): string => {
    const d = toDateSafe(value);
    if (!d) return '';
    return d.toLocaleString();
  };

  const formatDuration = (ms: number | null): string => {
    if (ms == null || !isFinite(ms) || ms < 0) return '';
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handlePrintWristband = async (encounterData: any) => {
    try {
      if (!encounterData || !encounterData.patientObject) return;

      const p = encounterData.patientObject;

      const fullName = p.fullName || '';
      const mrn = p.patientMrn || '';
      const dob = p.dob
        ? new Date(p.dob).toLocaleDateString()
        : '';
      let admDate = '';

      if (encounterData.createdAt) {
        const d = new Date(encounterData.createdAt);
        if (!isNaN(d.getTime())) {
          admDate = d.toLocaleDateString();
        }
      }

      if (!admDate && encounterData.plannedStartDate) {
        admDate = encounterData.plannedStartDate;
      }

      const qrText = `MRN:${mrn};NAME:${fullName};DOB:${dob};VISIT:${encounterData.visitId || ''}`;
      const qrDataUrl = await QRCode.toDataURL(qrText);

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [50, 120]
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(fullName.toUpperCase(), 10, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`MRN: ${mrn}`, 10, 25);
      doc.text(`ADM: ${admDate}`, 10, 33);
      doc.text(`DOB: ${dob}`, 10, 41);

      doc.setFont('helvetica', 'bold');

      doc.addImage(qrDataUrl, 'PNG', 80, 10, 30, 30);

      doc.save(`Wristband_${mrn}.pdf`);
    } catch (e) {
      console.error('Error while generating wristband pdf', e);
    }
  };
  const location = useLocation();
  const dispatch = useDispatch();
  const [cancelEncounter] = useCancelEncounterMutation();
  const [encounter, setLocalEncounter] = useState<any>({ ...newApEncounter, discharge: false });
  const [emergencyLevel, setEmergencyLevel] = useState({ key: '' });
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
  const [openSendToModal, setOpenSendToModal] = useState(false);
  const [open, setOpen] = useState(false);
  const defaultEncounterStatusKeys = ['6742295599423814', '8890456518264959'];
  const [encounterStatus, setEncounterStatus] = useState<{ keys: string[] }>({
    keys: defaultEncounterStatusKeys
  });
  const [startEncounter] = useSaveEncounterChangesMutation();
  const navigate = useNavigate();
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true,
    filters: [
      {
        fieldName: 'resource_type_lkey',
        operator: 'match',
        value: 'EMERGENCY'
      }
    ]
  });

  // State to manage the date filters for the manual search
  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(),
    toDate: new Date()
  });

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientSearchResetToken, setPatientSearchResetToken] = useState(0);
  const [patientSidebarOpen, setPatientSidebarOpen] = useState(false);
  const [windowHeight, setWindowHeight] = useState<number>(window.innerHeight);
  const [refetchPatientSidebar, setRefetchPatientSidebar] = useState(false);
  const [openCreatePatient, setOpenCreatePatient] = useState(false);
  const [openQuickPatient, setOpenQuickPatient] = useState(false);

  // Keep refs to avoid "Search" reading stale state right after a picker change.
  const dateFilterRef = useRef(dateFilter);
  const emergencyLevelRef = useRef(emergencyLevel);
  const encounterStatusRef = useRef(encounterStatus);
  const selectedPatientRef = useRef<any>(selectedPatient);

  const setDateFilterSafe = (next: any) => {
    dateFilterRef.current = next;
    setDateFilter(next);
  };
  const setEmergencyLevelSafe = (next: any) => {
    emergencyLevelRef.current = next;
    setEmergencyLevel(next);
  };
  const setEncounterStatusSafe = (next: any) => {
    encounterStatusRef.current = next;
    setEncounterStatus(next);
  };
  const setSelectedPatientSafe = (next: any) => {
    selectedPatientRef.current = next;
    setSelectedPatient(next);
  };

  // Create a JSX element to display as the page header content
  const divContent = 'ER Triage';
  dispatch(setPageCode('ER_Triage'));
  dispatch(setDivContent(divContent));

  const refetch = useSelector((state: any) => state?.refetch?.refetchEncounter);

  const {
    data: encounterListResponse,
    isFetching,
    refetch: refetchEncounter,
    isLoading
  } = useGetEREncountersListQuery(listRequest);

  const { data: encounterStatusLov } = useGetLovValuesByCodeQuery('ENC_STATUS');
  const emergencyLevelEnumOptions = useEnumOptions('EmergencyLevel');

  const encounterStatusSelectData = useMemo(() => encounterStatusLov?.object ?? [], [encounterStatusLov]);

  const isSelected = (rowData: any) => {
    if (rowData && encounter && rowData.key === encounter.key) {
      return 'selected-row';
    } else return '';
  };

  const handleGoToViewTriage = async (encounterData: any, patientData: any) => {
    const targetPath = '/view-triage';
    navigate(targetPath, {
      state: {
        from: 'ER_Triage',
        info: 'toViewTriage',
        patient: patientData,
        encounter: encounterData
      }
    });
  };

  // Search is applied only when user clicks Search (see `handleSearchClick`).

  const handleCancelEncounter = async () => {
    try {
      if (encounter) {
        await cancelEncounter(encounter).unwrap();
        refetchEncounter();
        dispatch(notify({ msg: 'Cancelled Successfully', sev: 'success' }));
        setOpen(false);
      }
    } catch (error) {
      console.error('Encounter completion error:', error);
      dispatch(notify({ msg: 'An error occurred while canceling the encounter', sev: 'error' }));
    }
  };

  const handleGoToVisit = async (encounterData: any, patientData: any) => {
    await startEncounter({
      ...encounterData,
      encounterStatusLkey: '6742295599423814'
    }).unwrap();

    const targetPath = '/ER-start-triage';

    // Save source in sessionStorage before navigating
    sessionStorage.setItem('encounterPageSource', 'EncounterList');

    navigate(targetPath, {
      state: {
        info: 'to_Start_Triage',
        fromPage: 'ER_Triage',
        patient: patientData,
        encounter: encounterData
      }
    });
  };

  useEffect(() => {
    dispatch(setPageCode(''));
    dispatch(setDivContent(' '));
  }, [location.pathname, dispatch, isLoading]);

  useEffect(() => {
    const onResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isFetching && manualSearchTriggered) {
      setManualSearchTriggered(false);
    }
  }, [isFetching, manualSearchTriggered]);

  useEffect(() => {
    // Initial load: apply search once so the table is populated by default.
    handleSearchClick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoading || isFetching) {
      dispatch(showSystemLoader());
    } else {
      dispatch(hideSystemLoader());
    }

    return () => {
      dispatch(hideSystemLoader());
    };
  }, [isLoading, isFetching, dispatch]);

  useEffect(() => {
    if (refetch) {
      dispatch(showSystemLoader());

      const doRefetch = async () => {
        try {
          await refetchEncounter();
        } catch (error) {
          console.error('Error while refetching encounter:', error);
        } finally {
          dispatch(hideSystemLoader());
          dispatch(resetRefetchEncounter());
        }
      };

      doRefetch();
    }
  }, [refetch, refetchEncounter, dispatch]);

  const buildFilters = () => {
    const df = dateFilterRef.current;
    const el = emergencyLevelRef.current;
    const es = encounterStatusRef.current;
    const sp = selectedPatientRef.current;

    const filters: any[] = [
      {
        fieldName: 'resource_type_lkey',
        operator: 'match',
        value: 'EMERGENCY'
      }
    ];

    if (df?.fromDate && df?.toDate) {
      const formattedFromDate = formatDate(df.fromDate);
      const formattedToDate = formatDate(df.toDate);
      filters.push({
        fieldName: 'planned_start_date',
        operator: 'between',
        value: `${formattedFromDate}_${formattedToDate}`
      });
    } else if (df?.fromDate) {
      const formattedFromDate = formatDate(df.fromDate);
      filters.push({
        fieldName: 'planned_start_date',
        operator: 'gte',
        value: formattedFromDate
      });
    } else if (df?.toDate) {
      const formattedToDate = formatDate(df.toDate);
      filters.push({
        fieldName: 'planned_start_date',
        operator: 'lte',
        value: formattedToDate
      });
    }

    if (el?.key) {
      filters.push({
        fieldName: 'emergency_level_lkey',
        operator: 'match',
        value: el.key
      });
    }

    if (es?.keys?.length) {
      filters.push({
        fieldName: 'encounter_status_lkey',
        operator: 'in',
        value: es.keys.map(key => `(${key})`).join(' ')
      });
    }

    if (sp?.key) {
      filters.push({
        fieldName: 'patient_key',
        operator: 'match',
        value: sp.key
      });
    }

    return filters;
  };

  const handleSearchClick = () => {
    setManualSearchTriggered(true);
    setListRequest(prev => ({
      ...prev,
      pageNumber: 1,
      ignore: false,
      filters: buildFilters()
    }));
  };

  const handleClearClick = () => {
    const nextDateFilter = { fromDate: new Date(), toDate: new Date() };
    const nextEmergencyLevel = { key: '' };
    const nextEncounterStatus = { keys: defaultEncounterStatusKeys };

    setDateFilterSafe(nextDateFilter);
    setEmergencyLevelSafe(nextEmergencyLevel);
    setEncounterStatusSafe(nextEncounterStatus);
    setSelectedPatientSafe(null);
    setPatientSearchResetToken(v => v + 1);

    // After clearing, re-apply the default search criteria (do not leave the list ignored/empty)
    const filters: any[] = [
      {
        fieldName: 'resource_type_lkey',
        operator: 'match',
        value: 'EMERGENCY'
      }
    ];

    if (nextDateFilter.fromDate && nextDateFilter.toDate) {
      const formattedFromDate = formatDate(nextDateFilter.fromDate);
      const formattedToDate = formatDate(nextDateFilter.toDate);
      filters.push({
        fieldName: 'planned_start_date',
        operator: 'between',
        value: `${formattedFromDate}_${formattedToDate}`
      });
    }

    if (nextEncounterStatus.keys?.length) {
      filters.push({
        fieldName: 'encounter_status_lkey',
        operator: 'in',
        value: nextEncounterStatus.keys.map(key => `(${key})`).join(' ')
      });
    }

    setManualSearchTriggered(true);
    setListRequest(prev => ({
      ...prev,
      pageNumber: 1,
      ignore: false,
      filters
    }));
  };

  // table Columns
  const tableColumns = [
    // Expandable details (only visible when row is expanded)
    {
      key: 'encounterCreatedAt',
      title: <Translate>Time Encounter Created</Translate>,
      expandable: true,
      render: (rowData: any) => formatDateTime(rowData?.createdAt)
    },
    {
      key: 'triageStartedAt',
      title: <Translate>Time Triage Started</Translate>,
      expandable: true,
      render: (rowData: any) => formatDateTime(rowData?.emergencyTriage?.createdAt)
    },
    {
      key: 'waitingTime',
      title: <Translate>Waiting Time</Translate>,
      expandable: true,
      render: (rowData: any) => {
        const arrival =  toDateSafe(rowData?.createdAt);
        const triageStart = toDateSafe(rowData?.emergencyTriage?.createdAt);
        if (!arrival || !triageStart) return '';
        return formatDuration(triageStart.getTime() - arrival.getTime());
      }
    },
    {
      key: 'triageCompletedAt',
      title: <Translate>Time Triage Completed</Translate>,
      expandable: true,
      render: (rowData: any) => {
        const statusKey = String(rowData?.encounterStatusLkey ?? '');
        const isCompleted =
          statusKey === COMPLETE_TRIAGE_STATUS_KEY || statusKey === SENT_TO_ER_STATUS_KEY;
        if (!isCompleted) return '';

        const completedAt =
          rowData?.emergencyTriage?.updatedAt ??
          rowData?.updatedAt ??
          rowData?.completedAt ??
          rowData?.completedDate ??
          null;
        return formatDateTime(completedAt);
      }
    },
    {
      key: 'triageTime',
      title: <Translate>Triage Time</Translate>,
      expandable: true,
      render: (rowData: any) => {
        const statusKey = String(rowData?.encounterStatusLkey ?? '');
        const isCompleted =
          statusKey === COMPLETE_TRIAGE_STATUS_KEY || statusKey === SENT_TO_ER_STATUS_KEY;
        if (!isCompleted) return '';

        const triageStart = toDateSafe(rowData?.emergencyTriage?.createdAt);
        const completedAt = toDateSafe(
          rowData?.emergencyTriage?.updatedAt ??
            rowData?.updatedAt ??
            rowData?.completedAt ??
            rowData?.completedDate ??
            null
        );
        if (!triageStart || !completedAt) return '';
        return formatDuration(completedAt.getTime() - triageStart.getTime());
      }
    },
    {
      key: 'queueNumber',
      title: <Translate>#</Translate>,
      dataKey: 'queueNumber',
      render: (rowData: any) => rowData?.patientObject.patientMrn
    },
    {
      key: 'patientFullName',
      title: <Translate>PATIENT NAME </Translate>,
      fullText: true,
      render: (rowData: any) => {
        const tooltipSpeaker = (
          <Tooltip>
            <div>MRN : {rowData?.patientObject?.patientMrn}</div>
            <div>Age : {rowData?.patientAge}</div>
            <div>
              Gender :{' '}
              {rowData?.patientObject?.genderLvalue
                ? rowData?.patientObject?.genderLvalue?.lovDisplayVale
                : rowData?.patientObject?.genderLkey}
            </div>
            <div>Visit ID : {rowData?.visitId}</div>
          </Tooltip>
        );

        return (
          <Whisper trigger="hover" placement="top" speaker={tooltipSpeaker}>
            <div style={{ display: 'inline-block' }}>
              {rowData?.patientObject?.privatePatient ? (
                <Badge color="blue" content="Private">
                  <p style={{ marginTop: '5px', cursor: 'pointer' }}>
                    {rowData?.patientObject?.fullName}
                  </p>
                </Badge>
              ) : (
                <>
                  <p style={{ cursor: 'pointer' }}>{rowData?.patientObject?.fullName}</p>
                </>
              )}
            </div>
          </Whisper>
        );
      }
    },
    {
      key: 'emergencyLevelLkey',
      title: <Translate>ER Level</Translate>,
      render: (rowData: any) =>
        rowData?.emergencyLevelLkey ? (
          <MyBadgeStatus
            color={rowData?.emergencyLevelLvalue?.valueColor}
            contant={
              rowData?.emergencyLevelLvalue
                ? rowData?.emergencyLevelLvalue?.lovDisplayVale
                : rowData?.emergencyLevelLkey
            }
          />
        ) : (
          ''
        )
    },
    {
      key: 'encounterPriorityLkey',
      title: <Translate>Priority</Translate>,
      render: (rowData: any) =>
        rowData?.encounterPriorityLvalue
          ? rowData?.encounterPriorityLvalue?.lovDisplayVale
          : rowData?.encounterPriorityLkey
    },
    {
      key: 'chiefComplaint',
      title: <Translate>CHIEF COMPLAIN</Translate>,
      render: (rowData: any) => rowData.chiefComplaint
    },
    {
      key: 'plannedStartDate',
      title: <Translate>DATE</Translate>,
      dataKey: 'plannedStartDate'
    },
    {
      key: 'destinationLkey',
      title: 'Destination',
      render: (row: any) =>
        row?.emergencyTriage?.destinationLkey
          ? row?.emergencyTriage?.destinationLvalue?.lovDisplayVale
          : ''
    },
    {
      key: 'status',
      title: <Translate>STATUS</Translate>,
      render: (rowData: any) => (
        <MyBadgeStatus
          color={rowData?.encounterStatusLvalue?.valueColor}
          contant={
            rowData.encounterStatusLvalue
              ? rowData.encounterStatusLvalue.lovDisplayVale
              : rowData.encounterStatusLkey
          }
        />
      )
    },
    {
      key: 'actions',
      title: <Translate> </Translate>,
      render: (rowData: any) => {
        const tooltipEmr = <Tooltip>Open EMR</Tooltip>;
        const tooltipPrint = <Tooltip>Print wrist band</Tooltip>;
        const tooltipStart = <Tooltip>Start Triage</Tooltip>;
        const tooltipTriage = <Tooltip>View Triage</Tooltip>;
        const tooltipSendTo = <Tooltip>Send to</Tooltip>;
        const tooltipCancel = <Tooltip>Cancel Visit</Tooltip>;
        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            <Whisper trigger="hover" placement="top" speaker={tooltipEmr}>
              <div
                onClick={(e: any) => {
                  e?.stopPropagation?.();
                }}
              >
                <MyButton
                  size="small"
                  radius="6px"
                  backgroundColor="violet"
                  onClick={() => {
                    const patientData = rowData?.patientObject;
                    if (patientData) {
                      dispatch(setPatient(patientData));
                    }
                    dispatch(setEncounter(rowData));
                    navigate('/patient-EMR', {
                      state: {
                        patient: patientData,
                        encounter: rowData,
                        fromPage: 'ER_Triage',
                        inModal: true
                      }
                    });
                  }}
                >
                  <FontAwesomeIcon icon={faFileLines} color="white" />
                </MyButton>
              </div>
            </Whisper>

            {rowData?.encounterStatusLkey === '91109811181900' ||
            rowData?.encounterStatusLkey === '6550164111662337' ? (
              <Whisper trigger="hover" placement="top" speaker={tooltipTriage}>
                <div>
                  <MyButton
                    size="small"
                    onClick={() => {
                      const patientData = rowData?.patientObject;
                      setLocalEncounter(rowData);
                      handleGoToViewTriage(rowData, patientData);
                    }}
                  >
                    <FontAwesomeIcon icon={faCommentMedical} />
                  </MyButton>
                </div>
              </Whisper>
            ) : (
              <Whisper trigger="hover" placement="top" speaker={tooltipStart}>
                <div>
                  <MyButton
                    size="small"
                    backgroundColor="black"
                    onClick={() => {
                      setLocalEncounter(rowData);
                      handleGoToVisit(rowData, rowData?.patientObject);
                    }}
                    disabled={
                      rowData?.encounterStatusLkey !== '8890456518264959' &&
                      rowData?.encounterStatusLkey !== '6742295599423814'
                    }
                  >
                    <FontAwesomeIcon icon={faCirclePlay} />
                  </MyButton>
                </div>
              </Whisper>
            )}

            <Whisper trigger="hover" placement="top" speaker={tooltipPrint}>
              <div>
                <MyButton
                  size="small"
                  onClick={() => {
                    setLocalEncounter(rowData);
                    handlePrintWristband(rowData);
                  }}
                >
                  <FontAwesomeIcon icon={faBarcode} />
                </MyButton>
              </div>
            </Whisper>

            <Whisper trigger="hover" placement="top" speaker={tooltipSendTo}>
              <div>
                <MyButton
                  size="small"
                  backgroundColor="violet"
                  onClick={() => {
                    setLocalEncounter(rowData);
                    setOpenSendToModal(true);
                  }}
                  disabled={rowData?.encounterStatusLkey != '6742295599423814'}
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                </MyButton>
              </div>
            </Whisper>

            {(rowData?.encounterStatusLvalue?.valueCode === 'WAITING_TRIAGE' ||
              rowData?.encounterStatusLvalue?.valueCode === 'NEW' ||
              rowData?.encounterStatusLvalue?.valueCode === 'SENT_TO_ER' ||
              rowData?.encounterStatusLvalue?.valueCode === 'WAITING_LIST') && (
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
            )}
          </Form>
        );
      },
      expandable: false
    }
  ];

  const pageIndex = listRequest.pageNumber - 1;

  // how many rows per page:
  const rowsPerPage = listRequest.pageSize;

  // total number of items in the backend:
  const totalCount = encounterListResponse?.extraNumeric ?? 0;

  // handler when the user clicks a new page number:
  const handlePageChange = (_: unknown, newPage: number) => {
    setManualSearchTriggered(true);
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };

  // handler when the user chooses a different rows-per-page:
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setManualSearchTriggered(true);
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1 // reset to first page
    });
  };

  const filters = () => {
    return (
      <>
        <Form fluid className="date-filter-form">
          <div className="er-triage-filters-position-handle">
            <MyInput
              width={180}
              fieldType="date"
              fieldLabel="From Date"
              fieldName="fromDate"
              record={dateFilter}
              setRecord={setDateFilterSafe}
            />
            <MyInput
              width={180}
              fieldType="date"
              fieldLabel="To Date"
              fieldName="toDate"
              record={dateFilter}
              setRecord={setDateFilterSafe}
            />
            <MyInput
              width={200}
              fieldType="select"
              fieldLabel="Emergency Level"
              fieldName="key"
              selectData={emergencyLevelEnumOptions}
              selectDataLabel="label"
              selectDataValue="value"
              record={emergencyLevel}
              setRecord={setEmergencyLevelSafe}
            />
            <PatientSearch
              value={selectedPatient}
              onChange={setSelectedPatientSafe}
              resetToken={patientSearchResetToken}
            />

            <MyInput
              width="10vw"
              fieldType="checkPicker"
              fieldLabel="Encounter Status"
              fieldName="keys"
              selectData={encounterStatusSelectData}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={encounterStatus}
              setRecord={setEncounterStatusSafe}
            />
          </div>
        </Form>
        <AdvancedSearchFilters
          searchFilter={true}
          showAdvanceButton={false}
          extraActions={
            <>
              <MyButton
                appearance="ghost"
                onClick={() => setOpenCreatePatient(true)}
                prefixIcon={() => <FontAwesomeIcon icon={faUserPlus} />}
              >
                Create New Patient
              </MyButton>
              <MyButton
                appearance="ghost"
                onClick={() => setOpenQuickPatient(true)}
                prefixIcon={() => <FontAwesomeIcon icon={faBolt} />}
              >
                Quick Patient
              </MyButton>
            </>
          }
          searchOnClick={handleSearchClick}
          clearOnClick={handleClearClick}
        />
      </>
    );
  };

  return (
    <>
      {patientSidebarOpen && (
        <div className="er-triage-patient-sidebar-overlay">
          <ProfileSidebarNew
            expand={true}
            setExpand={setPatientSidebarOpen}
            windowHeight={windowHeight}
            setLocalPatient={(p: any) => {
              setSelectedPatientSafe(p);
              setPatientSidebarOpen(false);
            }}
            refetchData={refetchPatientSidebar}
            setRefetchData={setRefetchPatientSidebar}
            showButton={true}
            showCollapsedButton={false}
            direction="right"
          />
        </div>
      )}

    <Panel>
      <MyTable
        filters={filters()}
        height={600}
        data={encounterListResponse?.object ?? []}
        columns={tableColumns}
        rowClassName={isSelected}
        loading={isLoading || (manualSearchTriggered && isFetching)}
        onRowClick={rowData => {
          setLocalEncounter(rowData);
        }}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortChange={(sortBy, sortType) => {
          setListRequest({ ...listRequest, sortBy, sortType });
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
      <SendToModal
        open={openSendToModal}
        setOpen={setOpenSendToModal}
        encounter={encounter}
        triage={encounter?.emergencyTriage}
        refetch={refetchEncounter}
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
      <CreateNewPatient open={openCreatePatient} setOpen={setOpenCreatePatient} />
      <QuickPatient open={openQuickPatient} setOpen={setOpenQuickPatient} />
    </Panel>
    </>
  );
};

export default ERTriage;
