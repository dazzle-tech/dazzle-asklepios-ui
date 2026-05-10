import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Divider, Form, Panel } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { useBookPatientAppointmentMutation } from '@/services/appointment/appointmentService';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import MyButton from '@/components/MyButton/MyButton';
import QuickPatient from '@/pages/patient/facility-patient-list/QuickPatient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faUser } from '@fortawesome/free-solid-svg-icons';
import SectionContainer from '@/components/SectionsoContainer';
import { useGetAppointablePractitionerByLoggedInFacilityQuery } from '@/services/setup/practitioner/PractitionerService';
import { useGetAppointableServicesByLoggedInFacilityQuery } from '@/services/setup/serviceService';
import { useGetPractitionerByIdQuery } from '@/services/setup/practitioner/PractitionerService';
import { useGetCatalogByIdQuery } from '@/services/setup/catalog/catalogService';
import { useGetDiagnosticTestByIdQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetRoomByIdQuery } from '@/services/setup/room/roomService';
import { useGetServiceByIdQuery } from '@/services/setup/serviceService';
import { useGetDepartmentByIdQuery } from '@/services/security/departmentService';
import { useGetFacilityByIdQuery } from '@/services/security/facilityService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import ProfileSidebar from '@/pages/patient/patient-profile/ProfileSidebar-new';
import Translate from '@/components/Translate';
import { formatEnumString } from '@/utils';
import { useGetPatientByIdQuery } from '@/services/patient/patientService';
import { useLazyGetPreviousEncountersSameDepartmentQuery } from '@/services/encounters/patientEncounterService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';


type BookPatientProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  appointmentData: any;
  practitioners?: any[];
  services?: any[];
  onBooked?: () => Promise<void> | void;
  /** When true, shows the same flow read-only (opened from View action on an existing appointment). */
  readOnly?: boolean;
};

const BookPatient = ({
  open,
  setOpen,
  appointmentData,
  practitioners = [],
  services = [],
  onBooked,
  readOnly = false
}: BookPatientProps) => {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state: any) => state.ui.mode);
  const [bookPatientAppointment, { isLoading }] = useBookPatientAppointmentMutation();
  const encounterReasonEnum = useEnumOptions('EncounterReason');
  const encounterPriorityEnum = useEnumOptions('EncounterPriority');
  const { data: patOriginLovQueryResponse } = useGetLovValuesByCodeQuery('PAT_ORIGIN');

  useEffect(() => {
    if (!open) return;
    // Debug: inspect appointment payload when opening booking modal
    // eslint-disable-next-line no-console

    const appointmentPriority =
      appointmentData?.priority ??
      null;

    if (readOnly && appointmentData) {
      const rawPatientId =
        appointmentData.patientId ??
        (typeof appointmentData.patient === 'object'
          ? appointmentData.patient?.id ?? appointmentData.patient?.key
          : appointmentData.patient);
      const pid = Number(rawPatientId);
      setRecord(prev => ({
        ...prev,
        patientId: Number.isFinite(pid) && pid > 0 ? pid : prev.patientId,
        status: appointmentData.status || appointmentData.appointmentStatus || prev.status,
        defaultPractitioner: appointmentData.defaultPractitionerId ?? null,
        defaultService: appointmentData.defaultServiceId ?? null,
        reason: appointmentData.reason ?? '',
        note: appointmentData.note ?? appointmentData.notes ?? '',
        service:
          appointmentData.service ??
          appointmentData.encounterReason ??
          appointmentData.visitTypeLkey ??
          null,
        originType: appointmentData.originType ?? null,
        originName: appointmentData.originName ?? '',
        priority: appointmentPriority ?? prev.priority ?? null,
        followUpEncounterId:
          (appointmentData.service ??
            appointmentData.encounterReason ??
            appointmentData.visitTypeLkey) === 'FOLLOW_UP'
            ? appointmentData.followUpEncounterId ??
              appointmentData.previousEncounterId ??
              prev.followUpEncounterId ??
              null
            : null
      }));
      return;
    }

    const rawPatientOnAppointment =
      appointmentData?.patientId ??
      (typeof appointmentData?.patient === 'object'
        ? appointmentData?.patient?.id ?? appointmentData?.patient?.key
        : appointmentData?.patient);
    const hasPatientOnAppointment = rawPatientOnAppointment != null && String(rawPatientOnAppointment) !== '';

    const appointmentDefaultPractitioner = appointmentData?.defaultPractitionerId || null;
    const appointmentDefaultService = appointmentData?.defaultServiceId || null;
    const appointmentReason = appointmentData?.reason || null;
    const appointmentService =
      appointmentData?.service ||
      appointmentData?.encounterReason ||
      appointmentData?.visitTypeLkey ||
      null;

    setRecord(prev => ({
      ...prev,
      // Opening a free slot must start with no patient selected.
      patientId: hasPatientOnAppointment ? prev.patientId : null,
      defaultPractitioner: appointmentDefaultPractitioner ?? prev.defaultPractitioner ?? null,
      defaultService: appointmentDefaultService ?? prev.defaultService ?? null,
      reason: appointmentReason ?? prev.reason ?? '',
      service: appointmentService ?? prev.service ?? null,
      originType: appointmentData?.originType ?? prev.originType ?? null,
      originName: appointmentData?.originName ?? prev.originName ?? '',
      priority: appointmentPriority ?? prev.priority ?? null,
      followUpEncounterId:
        (appointmentService ?? prev.service) === 'FOLLOW_UP'
          ? appointmentData?.followUpEncounterId ??
            appointmentData?.previousEncounterId ??
            prev.followUpEncounterId ??
            null
          : null
    }));

    if (!hasPatientOnAppointment) {
      setSelectedPatient(null);
      setPatientAction('select');
      setQuickPatientModalOpen(false);
      setPatientSidebarOpen(false);
    }
  }, [open, appointmentData, readOnly]);

  const viewPatientId = useMemo(() => {
    if (!readOnly || !appointmentData) return null;
    const p = appointmentData.patient;
    const raw =
      appointmentData.patientId ?? (typeof p === 'object' ? p?.id ?? p?.key : p);
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [readOnly, appointmentData]);

  const { data: viewPatientById } = useGetPatientByIdQuery(
    { id: viewPatientId as number },
    { skip: !open || !readOnly || !viewPatientId }
  );

  const appointmentId = useMemo(() => {
    const raw = appointmentData?.id ?? null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [appointmentData]);
  const appointmentFacilityId = useMemo(() => {
    const raw = appointmentData?.facilityId ?? appointmentData?.facilityKey ?? null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [appointmentData]);
  const appointmentDepartmentId = useMemo(() => {
    const raw = appointmentData?.departmentId ?? appointmentData?.departmentKey ?? null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [appointmentData]);

  const { data: facilityByIdResponse } = useGetFacilityByIdQuery(appointmentFacilityId, {
    skip: !open || !appointmentFacilityId
  });
  const { data: departmentByIdResponse } = useGetDepartmentByIdQuery(appointmentDepartmentId, {
    skip: !open || !appointmentDepartmentId
  });
  const resourceTypeRaw = String(appointmentData?.resourceType ?? '').toUpperCase();
  const appointmentResourceId = appointmentData?.resourceId ?? appointmentData?.resourceKey ?? null;
  const isDepartmentResource = resourceTypeRaw.includes('DEPARTMENT');
  const isPractitionerResource = resourceTypeRaw.includes('PRACTITIONER');
  const isCatalogResource = resourceTypeRaw.includes('CATALOG');
  const isDiagnosticTestResource =
    resourceTypeRaw.includes('DIAGNOSTIC') ||
    resourceTypeRaw.includes('LAB') ||
    resourceTypeRaw.includes('RADIOLOGY') ||
    resourceTypeRaw.includes('TEST');
  const isRoomResource = resourceTypeRaw.includes('ROOM');
  const isServiceResource = resourceTypeRaw.includes('SERVICE');

  const { data: resourceDepartmentById } = useGetDepartmentByIdQuery(appointmentResourceId as any, {
    skip: !open || !appointmentResourceId || !isDepartmentResource
  });
  const { data: resourcePractitionerById } = useGetPractitionerByIdQuery(appointmentResourceId as any, {
    skip: !open || !appointmentResourceId || !isPractitionerResource
  });
  const { data: resourceCatalogById } = useGetCatalogByIdQuery(appointmentResourceId as any, {
    skip: !open || !appointmentResourceId || !isCatalogResource
  });
  const { data: resourceDiagnosticTestById } = useGetDiagnosticTestByIdQuery(appointmentResourceId as any, {
    skip: !open || !appointmentResourceId || !isDiagnosticTestResource
  });
  const { data: resourceRoomById } = useGetRoomByIdQuery(appointmentResourceId as any, {
    skip: !open || !appointmentResourceId || !isRoomResource
  });
  const { data: resourceServiceById } = useGetServiceByIdQuery(appointmentResourceId as any, {
    skip: !open || !appointmentResourceId || !isServiceResource
  });
  const formatDateTime = (value: any) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString();
  };

  const appointmentDetailsRecord = useMemo(
    () => ({
      facility:
        (facilityByIdResponse as any)?.name ||
        '-',
      department:
        (departmentByIdResponse as any)?.name ||
        appointmentData?.departmentName ||
        appointmentData?.department ||
        appointmentData?.departmentId ||
        '-',
      status:
        formatEnumString(appointmentData?.status) ||
        '-',
      practitioner:
        appointmentData?.defaultPractitionerId ||
        '-',
      resourceType:
      formatEnumString(appointmentData?.resourceType) ||
        '-',
      resourceName:
        (isDepartmentResource
          ? (resourceDepartmentById as any)?.name
          : isPractitionerResource
            ? (resourcePractitionerById as any)?.fullName ||
              [(resourcePractitionerById as any)?.firstName, (resourcePractitionerById as any)?.lastName]
                .filter(Boolean)
                .join(' ')
            : isCatalogResource
              ? (resourceCatalogById as any)?.name
              : isDiagnosticTestResource
                ? (resourceDiagnosticTestById as any)?.name
                : isRoomResource
                  ? (resourceRoomById as any)?.name || (resourceRoomById as any)?.roomName
                  : isServiceResource
                    ? (resourceServiceById as any)?.serviceName || (resourceServiceById as any)?.name
                    : null) ||
        appointmentData?.resourceName ||
        appointmentData?.resource ||
        appointmentData?.resourceId ||
        '-',
      bookingMode: formatEnumString(appointmentData?.bookingMode) || '-'
    }),
    [
      appointmentData,
      facilityByIdResponse,
      departmentByIdResponse,
      isDepartmentResource,
      isPractitionerResource,
      isCatalogResource,
      isDiagnosticTestResource,
      isRoomResource,
      isServiceResource,
      resourceDepartmentById,
      resourcePractitionerById,
      resourceCatalogById,
      resourceDiagnosticTestById,
      resourceRoomById,
      resourceServiceById
    ]
  );
  const selectedSlotDisplay = useMemo(() => {
    const rawStart =
      appointmentData?.startDatetime 
    const rawEnd =
      appointmentData?.endDatetime 
    const start = formatDateTime(rawStart);
    const end = formatDateTime(rawEnd);
    const startTime =
      start !== '-'
        ? new Date(rawStart).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
        : '--:--';
    const endTime =
      end !== '-'
        ? new Date(rawEnd).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
        : '--:--';
    const dateTitle =
      start !== '-'
        ? new Date(rawStart).toLocaleDateString([], {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: '2-digit'
        })
        : 'Selected Slot';
    return {
      dateTitle,
      timeRange: `${startTime} - ${endTime}`
    };
  }, [appointmentData]);

  const practitionerOptions = useMemo(
    () =>
      (practitioners ?? []).map((p: any) => ({
        id: p?.id,
        label:
          p?.fullName ||
          [p?.firstName, p?.lastName].filter(Boolean).join(' ') ||
          p?.name ||
          `Practitioner #${p?.id ?? ''}`
      })),
    [practitioners]
  );

  const serviceOptions = useMemo(
    () =>
      (services ?? []).map((s: any) => ({
        id: s?.id,
        label: s?.serviceName || s?.name || `Service #${s?.id ?? ''}`
      })),
    [services]
  );

  // Ensure dropdowns are populated even when parent screen skips loading lists
  const { data: practitionersAppointableByLoggedInFacility } =
    useGetAppointablePractitionerByLoggedInFacilityQuery(
      { page: 0, size: 500, sort: 'id,asc' },
      { skip: !open }
    );
  const { data: servicesAppointableByLoggedInFacility } = useGetAppointableServicesByLoggedInFacilityQuery(
    { page: 0, size: 500, sort: 'id,asc' },
    { skip: !open }
  );

  const effectivePractitionerOptions = useMemo(() => {
    if ((practitionerOptions ?? []).length > 0) return practitionerOptions;
    const fallback = (practitionersAppointableByLoggedInFacility as any)?.data ?? [];
    return (fallback ?? []).map((p: any) => ({
      id: p?.id,
      label:
        p?.fullName ||
        [p?.firstName, p?.lastName].filter(Boolean).join(' ') ||
        p?.name ||
        `Practitioner #${p?.id ?? ''}`
    }));
  }, [practitionerOptions, practitionersAppointableByLoggedInFacility]);

  const effectiveServiceOptions = useMemo(() => {
    if ((serviceOptions ?? []).length > 0) return serviceOptions;
    const fallback = (servicesAppointableByLoggedInFacility as any)?.data ?? [];
    return (fallback ?? []).map((s: any) => ({
      id: s?.id,
      label: s?.serviceName || s?.name || `Service #${s?.id ?? ''}`
    }));
  }, [serviceOptions, servicesAppointableByLoggedInFacility]);

  const [record, setRecord] = useState<any>({
    patientId: null,
    status: 'BOOKED',
    defaultService: null,
    defaultPractitioner: null,
    service: null,
    reason: '',
    note: '',
    originType: null,
    originName: '',
    priority: null,
    followUpEncounterId: null
  });

  const [prevPage, setPrevPage] = useState(0);
  const prevSize = 15;
  const [allPrevEncounters, setAllPrevEncounters] = useState<any[]>([]);
  const [triggerPrevious, { data: prevList, isFetching: isPrevFetching }] =
    useLazyGetPreviousEncountersSameDepartmentQuery();

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [quickPatientModalOpen, setQuickPatientModalOpen] = useState(false);
  const [patientAction, setPatientAction] = useState<'select' | 'quick'>('select');
  const [patientSidebarOpen, setPatientSidebarOpen] = useState(false);
  const [patientSidebarStyle, setPatientSidebarStyle] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    if (!open || !readOnly || !appointmentData) return;
    const p = appointmentData.patient;
    if (p && typeof p === 'object' && (p.firstName || p.fullName || p.lastName || p.name)) {
      setSelectedPatient(p);
      return;
    }
    if (viewPatientById) {
      setSelectedPatient(viewPatientById);
    }
  }, [open, readOnly, appointmentData, viewPatientById]);

  const bookingPatientId = Number(record?.patientId);
  const isFollowUpService = record?.service === 'FOLLOW_UP';

  useEffect(() => {
    if (record.service === 'FOLLOW_UP') return;
    if (record.followUpEncounterId == null) return;
    setRecord((prev: any) => ({ ...prev, followUpEncounterId: null }));
  }, [record.service, record.followUpEncounterId]);

  useEffect(() => {
    if (!open || isFollowUpService) return;
    setPrevPage(0);
    setAllPrevEncounters([]);
  }, [open, isFollowUpService]);

  useEffect(() => {
    if (!open || !isFollowUpService) return;
    if (!bookingPatientId || !appointmentDepartmentId) return;

    setPrevPage(0);
    setAllPrevEncounters([]);
    triggerPrevious({
      patientId: bookingPatientId,
      departmentId: appointmentDepartmentId,
      page: 0,
      size: prevSize,
      sort: 'id,desc'
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isFollowUpService, bookingPatientId, appointmentDepartmentId]);

  useEffect(() => {
    if (!open || !isFollowUpService) return;
    if (!bookingPatientId || !appointmentDepartmentId) return;
    if (prevPage === 0) return;

    triggerPrevious({
      patientId: bookingPatientId,
      departmentId: appointmentDepartmentId,
      page: prevPage,
      size: prevSize,
      sort: 'id,desc'
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevPage, open, isFollowUpService, bookingPatientId, appointmentDepartmentId]);

  useEffect(() => {
    const rows = prevList?.data ?? [];
    if (!rows.length) return;

      setAllPrevEncounters(previousEncounters => {
        const seenIds = new Set(previousEncounters.map((encounter: any) => encounter.id));
        const merged = [...previousEncounters];
        rows.forEach((encounter: any) => {
          if (!seenIds.has(encounter.id)) merged.push(encounter);
        });
        return merged;
      });
  }, [prevList]);

  const prevHasMore = Boolean(prevList?.links?.next);

  const modifiedPrevEncounters = useMemo(() => {
    return (allPrevEncounters ?? []).map((encounter: any) => ({
      ...encounter,
      combinedLabel: `${encounter.id} , ${encounter.encounterDate ?? ''} , ${encounter.status ?? ''}`
    }));
  }, [allPrevEncounters]);

  const visitDetailsStepBlocked = useMemo(() => {
    if (!record?.service) return true;
    if (!readOnly) {
      const hasPriority = record?.priority != null && String(record.priority).trim() !== '';
      if (!hasPriority) return true;
    }
    if (record.service === 'FOLLOW_UP') {
      return (
        !Number(record?.followUpEncounterId) ||
        !bookingPatientId ||
        !appointmentDepartmentId
      );
    }
    return false;
  }, [readOnly, record?.service, record?.priority, record?.followUpEncounterId, bookingPatientId, appointmentDepartmentId]);

  const modalSteps = useMemo(
    () => [
      {
        title: 'Select Patient',
        disabledNext: readOnly ? false : !record?.patientId
      },
      {
        title: 'Visit Details',
        disabledNext: readOnly ? false : visitDetailsStepBlocked
      }
    ],
    [readOnly, record?.patientId, visitDetailsStepBlocked]
  );

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient);
    setRecord((prev: any) => ({
      ...prev,
      patientId: Number(patient?.id ?? patient?.key ?? null)
    }));
    setPatientAction('select');
    setPatientSidebarOpen(false);
  };

  useEffect(() => {
    if (!open || !patientSidebarOpen) return;

    const compute = () => {
      const dialog = document.querySelector('.book-patient-modal .rs-modal-dialog') as HTMLElement | null;
      if (!dialog) return;
      const rect = dialog.getBoundingClientRect();
      const right = Math.max(0, window.innerWidth - rect.right);

      setPatientSidebarStyle({
        position: 'fixed',
        top: rect.top,
        right,
        height: rect.height,
        zIndex: 5000,
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.18)',
        borderRadius: 10
      });
    };

    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [open, patientSidebarOpen]);

  const handleClose = () => {
    setOpen(false);
    setPrevPage(0);
    setAllPrevEncounters([]);
    setRecord({
      patientId: null,
      status: 'BOOKED',
      defaultService: null,
      defaultPractitioner: null,
      service: null,
      reason: '',
      note: '',
      originType: null,
      originName: '',
      priority: null,
      followUpEncounterId: null
    });
    setSelectedPatient(null);
    setQuickPatientModalOpen(false);
    setPatientAction('select');
    setPatientSidebarOpen(false);
  };

  const extractErrorMessage = (response: any): string => {
    try {
      const msg = response?.data?.message;
      if (typeof msg === 'string') {
        return msg.replace(/^error\./i, '');
      }
      return '';
    } catch {
      return '';
    }
  };

  const handleBooking = async () => {
  if (readOnly) return;

  try {
    if (!appointmentId || !record?.patientId) {
      dispatch(notify({ msg: 'Please enter patient id', sev: 'warning' }));
      return
    }

    if (!record?.service) {
      dispatch(notify({ msg: 'Please select service', sev: 'warning' }));
      return
    }

    if (record?.priority == null || String(record.priority).trim() === '') {
      dispatch(notify({ msg: 'Please select priority', sev: 'warning' }));
      return
    }
    if(appointmentData.requirePractitioner && !record.defaultPractitioner){
      dispatch(notify({ msg: 'Practitioner is required for this appointment', sev: 'warning' }));
      return
    }
    if (record.service === 'FOLLOW_UP') {
      if (!appointmentDepartmentId) {
        dispatch(
          notify({
            msg: 'Follow-up requires an appointment department to load previous encounters.',
            sev: 'warning'
          })
        );
        return
      }

      if (!Number(record.followUpEncounterId)) {
        dispatch(notify({ msg: 'Please select a previous encounter for follow-up.', sev: 'warning' }));
        return
      }
    }

    await bookPatientAppointment({
      id: appointmentId,
      patientId: Number(record.patientId),
      defaultService: record?.defaultService ? Number(record.defaultService) : null,
      defaultPractitioner: record?.defaultPractitioner ? Number(record.defaultPractitioner) : null,
      reason: record?.reason || record?.service || null,
      note: record?.note || null,
      originType: record?.originType ? String(record.originType) : null,
      originName: record?.originName ? String(record.originName) : null,
      status: 'BOOKED',
      service: record?.service || null,
      priority: record?.priority ? String(record.priority) : null,
      followUpEncounterId:
        record?.service === 'FOLLOW_UP' && Number(record?.followUpEncounterId)
          ? Number(record.followUpEncounterId)
          : null
    }).unwrap();

    dispatch(notify({ msg: 'Appointment booked successfully', sev: 'success' }));
    await Promise.resolve(onBooked?.());
    handleClose();
  } catch (error: any) {
      const errorMsg = extractErrorMessage(error) || 'Save Failed';
        dispatch(notify({ msg: errorMsg, sev: 'warning' }));
  }
};

  return (
    <>
      {patientSidebarOpen && (
        <div className="book-patient-sidebar-overlay" style={patientSidebarStyle ?? undefined}>
          <ProfileSidebar
            expand={true}
            setExpand={setPatientSidebarOpen}
            windowHeight={Math.max(0, Math.floor((patientSidebarStyle?.height as number) || window.innerHeight))}
            setLocalPatient={handlePatientSelect}
            title={<Translate>Search Patient</Translate>}
            direction="right"
            showButton={true}
          />
        </div>
      )}

      <MyModal
        open={open}
        setOpen={setOpen}
        title={readOnly ? 'View Appointment' : 'Book Appointment'}
        size="80vw"
        bodyheight="80vh"
        enforceFocus={false}
        customClassName="book-patient-modal"
        initialStep={readOnly ? 1 : 0}
        steps={modalSteps}
        content={activeStep => (
          <Form fluid>
            {activeStep === 0 ? (
              <div>
                <Panel>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px' }}>
                    <div style={{ flex: 1 }}>
                      <MyButton
                        appearance="subtle"
                        disabled={readOnly}
                        onClick={() => {
                          setPatientAction('select');
                          setPatientSidebarOpen(true);
                        }}
                        prefixIcon={() => <FontAwesomeIcon icon={faUser} />}
                        style={{
                          width: '100%',
                          height: 44,
                          borderRadius: 10,
                          fontWeight: 400,
                          border: patientAction === 'select' ? 'none' : '1px solid #d6dde8',
                          background:
                            patientAction === 'select'
                              ? 'linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)'
                              : '#ffffff',
                          color: patientAction === 'select' ? '#ffffff' : '#2563EB'
                        }}
                      >
                        {selectedPatient ? 'Change Patient' : 'Select Patient'}
                      </MyButton>
                    </div>
                    <div style={{ flex: 1 }}>
                      <MyButton
                        appearance="subtle"
                        disabled={readOnly}
                        onClick={() => {
                          setPatientAction('quick');
                          setPatientSidebarOpen(false);
                          setQuickPatientModalOpen(true);
                        }}
                        prefixIcon={() => <FontAwesomeIcon icon={faBolt} />}
                        style={{
                          width: '100%',
                          height: 44,
                          borderRadius: 10,
                          fontWeight: 400,
                          border: patientAction === 'quick' ? 'none' : '1px solid #d6dde8',
                          background:
                            patientAction === 'quick'
                              ? 'linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)'
                              : '#ffffff',
                          color: patientAction === 'quick' ? '#ffffff' : '#2563EB'
                        }}
                      >
                        Quick Patient
                      </MyButton>
                      <QuickPatient
                        open={quickPatientModalOpen}
                        setOpen={() => setQuickPatientModalOpen(false)}
                        setPatient={handlePatientSelect}
                      />
                    </div>
                  </div>
                </Panel>

                <SectionContainer
                  title="Patient Information"
                  content={
                    <Panel bordered style={{ padding: '0' }}>
                      <div style={{ display: 'flex' }}>
                        <div style={{ flex: 2, display: 'flex', alignItems: 'center', padding: 12 }}>
                          <Avatar
                            size="md"
                            circle
                            src={
                              selectedPatient?.profilePictureUrl ||
                              'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
                            }
                          />

                          <div style={{ marginLeft: 8 }}>
                            <p style={{ fontSize: 15, margin: 0 }}>
                              {selectedPatient
                                ? ([
                                    selectedPatient?.firstName,
                                    selectedPatient?.secondName,
                                    selectedPatient?.thirdName,
                                    selectedPatient?.lastName
                                  ]
                                    .filter(Boolean)
                                    .join(' ')
                                    .trim() || selectedPatient?.fullName || selectedPatient?.name || 'N/A')
                                : 'N/A'}
                            </p>
                            <p style={{ fontSize: 12, color: '#A1A9B8', fontWeight: 600, margin: '4px 0' }}>
                              <FontAwesomeIcon icon={faUser} />
                              {` ${selectedPatient?.sexAtBirth || selectedPatient?.genderLkey || 'N/A'}`}
                            </p>
                            <p style={{ fontSize: 12, color: '#A1A9B8', margin: 0 }}>
                              {(() => {
                                const mrn =
                                  selectedPatient?.medicalRecordNumber ||
                                  selectedPatient?.patientMrn ||
                                  selectedPatient?.mrn;
                                return mrn ? `#${mrn}` : '';
                              })()}
                            </p>
                          </div>
                        </div>

                        <div
                          style={{
                            flex: 4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: 12
                          }}
                        >
                          <Divider style={{ height: 50 }} vertical />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 10, color: '#A1A9B8', margin: 0 }}>Document Type</p>
                            <p style={{ margin: 0 }}>{selectedPatient?.documentTypeLkey || '-'}</p>
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 10, color: '#A1A9B8', margin: 0 }}>Document No</p>
                            <p style={{ margin: 0 }}>{selectedPatient?.documentNo || '-'}</p>
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 10, color: '#A1A9B8', margin: 0 }}>Mobile Number</p>
                            <p style={{ margin: 0 }}>{selectedPatient?.primaryMobileNumber || selectedPatient?.mobileNumber || '-'}</p>
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 10, color: '#A1A9B8', margin: 0 }}>Email</p>
                            <p style={{ margin: 0 }}>{selectedPatient?.email || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </Panel>
                  }
                />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <SectionContainer
                    title="Appointment Details"
                    content={
                      <Panel bordered style={{ padding: 12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <MyInput fieldType="text" fieldName="facility" fieldLabel="Facility" record={appointmentDetailsRecord} width="100%" disabled />
                          <MyInput fieldType="text" fieldName="department" fieldLabel="Department" record={appointmentDetailsRecord} width="100%" disabled />
                          <MyInput fieldType="text" fieldName="status" fieldLabel="Status" record={appointmentDetailsRecord} width="100%" disabled />
                          <MyInput fieldType="text" fieldName="resourceType" fieldLabel="Resource Type" record={appointmentDetailsRecord} width="100%" disabled />
                          <MyInput fieldType="text" fieldName="resourceName" fieldLabel="Resource Name" record={appointmentDetailsRecord} width="100%" disabled />
                          <MyInput fieldType="text" fieldName="bookingMode" fieldLabel="Booking Mode" record={appointmentDetailsRecord} width="100%" disabled />
                        </div>
                      </Panel>
                    }
                  />

                  <SectionContainer
                    title="Selected Appointment Time"
                    content={
                      <Panel bordered style={{ padding: 10, background: mode === 'dark' ? 'var(--dark-black)' :'#f8f4ea' }}>
                        <div>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 500, color: mode === 'dark' ? 'var(--white)' : '#000000' }}>
                              {selectedSlotDisplay.dateTitle}
                            </div>
                            <div style={{ fontSize: 12, color: mode === 'dark' ? 'var(--white)' : '#000000' }}>
                              {selectedSlotDisplay.timeRange}
                            </div>
                          </div>
                        </div>
                      </Panel>
                    }
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <SectionContainer
                    title="Booking Preference"
                    content={
                      <Panel bordered style={{ padding: 12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <MyInput
                            fieldType="select"
                            fieldName="defaultPractitioner"
                            fieldLabel="Default Practitioner"
                            record={record}
                            setRecord={setRecord}
                            selectData={effectivePractitionerOptions}
                            selectDataLabel="label"
                            selectDataValue="id"
                            width="100%"
                            disabled={readOnly}
                            required={appointmentData?.requirePractitioner}
                          />
                          <MyInput
                            fieldType="select"
                            fieldName="defaultService"
                            fieldLabel="Default Service"
                            record={record}
                            setRecord={setRecord}
                            selectData={effectiveServiceOptions}
                            selectDataLabel="label"
                            selectDataValue="id"
                            width="100%"
                            disabled={readOnly}
                          />
                        

                          <MyInput
                            fieldType="textarea"
                            fieldName="note"
                            fieldLabel="Note"
                            record={record}
                            setRecord={setRecord}
                            width="100%"
                            rows={2}
                            disabled={readOnly}
                          />
                        </div>
                      </Panel>
                    }
                  />
                  <SectionContainer
                    title="Upcoming Encounter Details"
                    content={
                      <Panel bordered style={{ padding: 12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <MyInput
                            fieldType="textarea"
                            fieldName="reason"
                            fieldLabel="Chief Complaint"
                            record={record}
                            setRecord={setRecord}
                            width="100%"
                            rows={2}
                            disabled={readOnly}
                          />
                          <MyInput
                            fieldType="select"
                            fieldName="service"
                            fieldLabel="Service"
                            record={record}
                            setRecord={setRecord}
                            selectData={encounterReasonEnum ?? []}
                            selectDataLabel="label"
                            selectDataValue="value"
                            width="100%"
                            searchable={false}
                            required={!readOnly}
                            disabled={readOnly}
                          />
                          <MyInput
                            fieldType="select"
                            fieldName="priority"
                            fieldLabel="Priority"
                            record={record}
                            setRecord={setRecord}
                            selectData={encounterPriorityEnum ?? []}
                            selectDataLabel="label"
                            selectDataValue="value"
                            width="100%"
                            searchable={false}
                            required={!readOnly}
                            disabled={readOnly}
                          />
                          <MyInput
                            fieldType="select"
                            fieldName="originType"
                            fieldLabel="Origin Type"
                            record={record}
                            setRecord={setRecord}
                            selectData={patOriginLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            width="100%"
                            searchable={false}
                            disabled={readOnly}
                          />
                          <MyInput
                            fieldName="originName"
                            fieldLabel="Origin Name"
                            record={record}
                            setRecord={setRecord}
                            width="100%"
                            disabled={readOnly}
                          />
                          {record?.service === 'FOLLOW_UP' && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <MyInput
                                fieldType="selectPagination"
                                fieldName="followUpEncounterId"
                                fieldLabel="Previous encounter"
                                record={record}
                                setRecord={setRecord}
                                selectData={modifiedPrevEncounters}
                                selectDataLabel="combinedLabel"
                                selectDataValue="id"
                                width="100%"
                                menuMaxHeight={200}
                                loading={isPrevFetching}
                                searchable={false}
                                hasMore={prevHasMore}
                                required={!readOnly && record?.service === 'FOLLOW_UP'}
                                disabled={
                                  readOnly || !bookingPatientId || !appointmentDepartmentId
                                }
                                onFetchMore={() => {
                                  if (prevList?.links?.next) {
                                    const { page } = extractPaginationFromLink(prevList.links.next);
                                    setPrevPage(page);
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </Panel>
                    }
                  />
                </div>
              </div>
            )}
          </Form>
        )}
        actionButtonLabel={isLoading ? 'Booking...' : 'Book'}
        actionButtonFunction={handleBooking}
        isDisabledActionBtn={isLoading}
        hideActionBtn={readOnly}
        handleCancelFunction={handleClose}
        cancelButtonLabel="Cancel"
      />
    </>
  );
};

export default BookPatient;
