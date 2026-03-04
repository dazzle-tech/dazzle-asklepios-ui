import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Calendar as BigCalendar, Views, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  Panel,
  Input,
  Button,
  Form,
  Drawer,
  DatePicker,
  Checkbox,
  Modal,
  Avatar,
  Stack,
  ButtonGroup,
  Text
} from 'rsuite';
import './styles.less';
import SearchIcon from '@rsuite/icons/Search';
import { newApAppointment } from '@/types/model-types-constructor';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { initialListRequest, ListRequest } from '@/types/types';
import AppointmentModal from './AppoitmentModal';
import FollowupAppointmentModal from './FollowupAppointmentModal';
import { ApAppointment } from '@/types/model-types';
import { faPaperPlane, faPlus, faPrint } from '@fortawesome/free-solid-svg-icons';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import { useAppDispatch, useAppSelector } from '@/hooks';
import AppointmentActionsModal from './AppointmentActionsModal';
import {
  useGetAppointmentsQuery,
  useGetResourcesWithAvailabilityQuery,
  useSaveAppointmentMutation
} from '@/services/appointmentService';
import { useGetAllResourcesQuery } from '@/services/setup/resource/ResourceService';
import MyInput from '@/components/MyInput';
import CalenderSimpleIcon from '@rsuite/icons/CalenderSimple';
import ArrowLeftLineIcon from '@rsuite/icons/ArrowLeftLine';
import ArrowRightLineIcon from '@rsuite/icons/ArrowRightLine';
import Translate from '@/components/Translate';
import { useFetchAttachmentsListQuery } from '@/services/attachmentService';
import { useSelector } from 'react-redux';
import MyButton from '@/components/MyButton/MyButton';
import SectionContainer from '@/components/SectionsoContainer';
import MyModal from '@/components/MyModal/MyModal';
import ViewAppointmentRequests from './ViewAppointmentRequests';
import { useEnumOptions } from '@/services/enumsApi';
import { calculateAgeFormat } from '@/utils';
import { update } from 'lodash';

const ScheduleScreen = () => {
  const localizer = momentLocalizer(moment);
  const mode = useSelector((state: any) => state.ui.mode);
  const [validationResult] = useState({});
  const [recordSearchAppointment, setRecordSearchAppointment] = useState({ value: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [followUpDraftData, setFollowUpDraftData] = useState<any>(null);
  const [ActionsModalOpen, setActionsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewAppointmentData, setViewAppointmentData] = useState(null);
  const isOpeningViewModalRef = useRef(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [appRequestModalOpen, setAppRequestModalOpen] = useState(false);
  const FOLLOW_UP_VISIT_TYPE_LKEY = 2041067508470007;

  const [saveAppointment] = useSaveAppointmentMutation();

  const [requestApproveModalOpen, setRequestApproveModalOpen] = useState(false);
  const [requestToApprove, setRequestToApprove] = useState<any>(null);

  //Calendar Filters
  // NOTE: `MyInput`'s `setRecord` spreads `record` (`{ ...record, ... }`),
  // so these MUST NOT be `null` (spreading null would crash at runtime).
  const [selectedFacility, setSelectedFacility] = useState<any>({});
  const [selectedResourceType, setSelectedResourceType] = useState<{ resourcesType: string[] }>({
    resourcesType: []
  });
  const [selectedResources, setSelectedResources] = useState<{ resourceKey: string[] }>({
    resourceKey: []
  });
  const [listRequest] = useState<ListRequest>({ ...initialListRequest });
  const [appointmentsData, setAppointmentsData] = useState([]);
  const [showAppointmentOnly, setShowAppointmentOnly] = useState(false);
  const [filteredResourcesList, setFilteredResourcesList] = useState([]);
  const [showCanceled, setShowCanceled] = useState<boolean>(false);
  const [filteredMonth] = useState<Date>();
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [currentView, setCurrentView] = useState('day');
  const [totalAppointmentsText, setTotalAppointmentsText] = useState<string>();
  const [calendarDate, setCalendarDate] = useState<Date | null>(null);
  const [finalAppointments, setFinalAppointments] = useState<any[]>([]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [reasonViewRecord, setReasonViewRecord] = useState({
    reason: '',
    otherReason: ''
  });

  const isFollowUpAppointment = (appt: any) => {
    const label = appt?.visitTypeLvalue?.lovDisplayVale ?? '';
    const key = appt?.visitTypeLkey ?? '';
    const s = `${label} ${key}`.toLowerCase();
    return s.includes('follow') && s.includes('up');
  };
   const authSlice = useAppSelector(state => state.auth);
  const ResourceTypeEnum = useEnumOptions('ResourceType');

  const DEFAULT_RESOURCE_TYPE = 'CLINIC';
  // const DEFAULT_FACILITY_NAME = localStorage.getItem('tenant') || 'null';
  // const SCHEDULE_DEFAULT_FACILITY_KEY = 'schedule_default_facility_applied_v1';

  useEffect(() => {
    const isEmpty =
      !selectedResourceType?.resourcesType || selectedResourceType.resourcesType.length === 0;

    if (isEmpty && Array.isArray(ResourceTypeEnum) && ResourceTypeEnum.length) {
      const normalize = (v: any) => String(v ?? '').trim().toLowerCase();

      const match =
        ResourceTypeEnum.find(
          (x: any) =>
            normalize(x?.label) === normalize(DEFAULT_RESOURCE_TYPE) ||
            normalize(x?.value) === normalize(DEFAULT_RESOURCE_TYPE)
        ) || null;

      if (match?.value) {
        setSelectedResourceType({ resourcesType: [match.value] });
      } else {
        setSelectedResourceType({ resourcesType: [DEFAULT_RESOURCE_TYPE] });
      }
    }
  }, [ResourceTypeEnum]);


  useEffect(() => {
  if (selectedFacility?.id) return;

  const raw = localStorage.getItem('tenant');
  if (!raw) return;

  try {
    const tenant = JSON.parse(raw);
    const f = tenant?.selectedFacility;

    if (f?.id) {
      setSelectedFacility(f);
    }
  } catch (e) {}
}, [selectedFacility?.id]);



  const { data: resourcesWithAvailabilityResponse } =
    useGetResourcesWithAvailabilityQuery(listRequest);

  // Used for mapping resourceKey -> resource name (per requirement: use ResourceService)
  const { data: allResourcesResponse } = useGetAllResourcesQuery({
    page: 0,
    size: 5000,
    sort: 'id,asc'
  });
  const resourceNameById = useMemo(() => {
    const list = (allResourcesResponse as any)?.data ?? (allResourcesResponse as any)?.object ?? allResourcesResponse ?? [];
    const arr = Array.isArray(list) ? list : [];
    const m = new Map<string, string>();
    arr.forEach((r: any) => {
      const id = r?.id ?? r?.key;
      const name = r?.resourceName ?? r?.name ?? r?.resource_name ?? '';
      if (id !== null && typeof id !== 'undefined') m.set(String(id), String(name || ''));
    });
    return m;
  }, [allResourcesResponse]);

  const {
    data: appointments,
    refetch: refitchAppointments,
    isLoading: isLoadingAppointments,
    isFetching: isFetchingAppointments
  } = useGetAppointmentsQuery({
    resource_type:  null,
    facility_id: selectedFacility?.id || null,
    resources: selectedResources ? selectedResources.resourceKey : []
  });

  const extractTimeFromTimestamp = timestamp => {
    const date = new Date(timestamp);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const dateTime = `${hours}:${minutes} `;
    return dateTime;
  };

  useEffect(() => {
    if (appointments?.object && resourcesWithAvailabilityResponse?.object) {
      const today = new Date();

      const formattedAppointments = appointments.object.map(appointment => {
        const dob = new Date(appointment?.patient?.dob);
        const patientFullName =
          appointment?.patient?.full_name ||
          appointment?.patient?.fullName ||
          (appointment?.patient?.first_name && appointment?.patient?.last_name
            ? `${appointment.patient.first_name} ${appointment.patient.last_name}`.trim()
            : appointment?.patient?.first_name || appointment?.patient?.last_name || 'Unknown Patient');

        const resource = resourcesWithAvailabilityResponse.object.find(
          item => item.key === appointment.resourceKey
        );

        const isHidden = appointment?.appointmentStatus === 'Canceled';
        return {
          id: appointment?.key,
          title: ` ${patientFullName}, ${
            isNaN(dob.getTime()) ? 'Unknown' : today.getFullYear() - dob.getFullYear()
          }Y  ${
            !(currentView === 'day' || currentView === 'week')
              ? ', ' + (resource?.resourceName || 'Unknown Resource')
              : ''
          }
 `,
          start: convertDate(appointment.appointmentStart),
          end: convertDate(appointment.appointmentEnd),
          text: appointment.notes || 'No additional details available',
          appointmentData: appointment,
          hidden: isHidden,
          resourceId: appointment?.resourceKey,
          fromTo: `${extractTimeFromTimestamp(
            appointment.appointmentStart
          )} - ${extractTimeFromTimestamp(appointment.appointmentEnd)}`
        };
      });
      setAppointmentsData(formattedAppointments);
    }
  }, [appointments, resourcesWithAvailabilityResponse, currentView]);

  useEffect(() => {
    if (selectedResourceType && resourcesWithAvailabilityResponse?.object) {
      const normalizeType = (v: any) => String(v ?? '').trim().toUpperCase();
      const selectedTypes = Array.isArray(selectedResourceType?.resourcesType)
        ? selectedResourceType.resourcesType.map(normalizeType).filter(Boolean)
        : [];

      const resourceMatchesSelectedType = (resource: any) => {
        if (!selectedTypes.length) return true;
        const resourceTypes = [resource?.resourceTypeLkey, resource?.resource_type, resource?.resourceType]
          .map(normalizeType)
          .filter(Boolean);
        return resourceTypes.some(t => selectedTypes.includes(t));
      };

      const filtered = resourcesWithAvailabilityResponse.object.filter(resourceMatchesSelectedType);
      setFilteredResourcesList(filtered);
    } else {
      setFilteredResourcesList(resourcesWithAvailabilityResponse?.object ?? []);
    }
  }, [resourcesWithAvailabilityResponse, selectedResourceType?.resourcesType]);

  useEffect(() => {
    if (selectedSlot) {
      setSelectedStartDate(selectedSlot?.slots[0]);
    }
  }, [selectedSlot]);

  const { data: noShowResonLovQueryResponse } = useGetLovValuesByCodeQuery('APP_NOSHOW_REASON');

  const { data: cancelResonLovQueryResponse } = useGetLovValuesByCodeQuery('APP_CANCEL_REASON');

  const handleSelectEvent = event => {
    const freshEvent = finalAppointments?.find(e => e.id === event.id) || event;

    setSelectedEvent(freshEvent);

    const status = freshEvent?.appointmentData?.appointmentStatus;

    if (status === 'Canceled' || status === 'No-Show') {
      const reasonKey = freshEvent?.appointmentData?.reasonLkey;

      const reasonLovList =
        status === 'Canceled' ? cancelResonLovQueryResponse?.object : noShowResonLovQueryResponse?.object;

      const matchedReason = reasonLovList?.find(r => r.key === reasonKey);

      setReasonViewRecord({
        reason: matchedReason?.lovDisplayVale || '',
        otherReason: freshEvent?.appointmentData?.otherReason || ''
      });

      setShowReasonModal(true);
      return;
    }

    setActionsModalOpen(true);
  };

  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});

  const convertDate = appointmentTime => {
    return new Date(appointmentTime);
  };

  const [appointment, setAppointment] = useState<ApAppointment>({ ...newApAppointment });
  const [drowerOpen, setDrowerOpen] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setPageCode('Schedule_Screen'));
    dispatch(setDivContent('Scheduling'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [dispatch]);

  const legendItems = [
    { label: 'No-Show', color: '#FDE68A' },
    { label: 'Checked In', color: '#FDBA74' },
    { label: 'New', color: '#fafafeff', borderColor: '#007bff' },
    { label: 'Confirmed', color: '#34D399' },
    { label: 'Completed', color: '#93C5FD' }
  ];

  // Derived resources list (synchronous) to avoid a one-render "stale columns" glitch
  // when filters change (react-big-calendar can render once before an effect updates state).
  const finalResourceLit = useMemo(() => {
    const all = resourcesWithAvailabilityResponse?.object ?? [];
    let list = all;

    // Resource Type filter
    if (selectedResourceType?.resourcesType?.length) {
      const normalizeType = (v: any) => String(v ?? '').trim().toUpperCase();
      const selectedTypes = selectedResourceType.resourcesType.map(normalizeType).filter(Boolean);
      list = list.filter(r => {
        const resourceTypes = [r?.resourceTypeLkey, r?.resource_type, r?.resourceType]
          .map(normalizeType)
          .filter(Boolean);
        return resourceTypes.some(t => selectedTypes.includes(t));
      });
    }

    // Specific Resources filter
    if (Array.isArray(selectedResources?.resourceKey) && selectedResources.resourceKey.length) {
      list = list.filter(r => selectedResources.resourceKey.includes(r.key));
    }

    return list;
  }, [
    resourcesWithAvailabilityResponse?.object,
    selectedResourceType?.resourcesType,
    selectedResources?.resourceKey
  ]);

  // Filter appointments based on selected resources
  const filteredAppointments = useMemo(() => {
    const hasResourceTypeFilter = selectedResourceType?.resourcesType?.length > 0;
    const selectedResourceKeys = selectedResources?.resourceKey ?? [];
    const hasResourceFilter = Array.isArray(selectedResourceKeys) && selectedResourceKeys.length > 0;

    if (!hasResourceTypeFilter && !hasResourceFilter) {
      // No filters applied, show all appointments
      return appointmentsData;
    }

    // Filter appointments to only show those matching the selected resources
    const filteredResourceKeys = new Set((finalResourceLit ?? []).map(r => r.key));

    return appointmentsData.filter(event => filteredResourceKeys.has(event.resourceId));
  }, [appointmentsData, finalResourceLit, selectedResourceType, selectedResources]);

  const visibleAppointments =
    currentView === 'agenda' || showCanceled
      ? filteredAppointments
      : filteredAppointments.filter(event => !event.hidden);

  const appointmn =
    visibleAppointments?.map(appt => appt.appointmentData?.patient?.key).filter(Boolean) || [];
  const { data: attachments = [], isLoading } = useFetchAttachmentsListQuery(
    {
      type: 'PATIENT_PROFILE_PICTURE',
      refKeys: appointmn
    },
    { skip: appointmn.length === 0 }
  );

  useEffect(() => {
    const attachmentMap = new Map();
    attachments.forEach(att => {
      attachmentMap.set(att.referenceObjectKey, att);
    });

    const updatedAppointments = visibleAppointments.map(appt => {
      const appointmentData = appt.appointmentData || {};
      return {
        ...appt,
        appointmentData: {
          ...appointmentData,
          profilePicture: attachmentMap.get(appointmentData.patientKey)?.fileContent || null
        }
      };
    });

    const areEqual = JSON.stringify(updatedAppointments) === JSON.stringify(finalAppointments);
    if (!areEqual) {
      setFinalAppointments(updatedAppointments);
    }
  }, [visibleAppointments, attachments]);

  const appointmentResourceKeys = useMemo(() => {
    return new Set((finalAppointments ?? []).map(e => e.resourceId).filter(Boolean));
  }, [finalAppointments]);

  const dayIndex = currentCalendarDate.getDay();

  const availabilityResourceKeys = useMemo(() => {
    return new Set(
      (finalResourceLit ?? [])
        .filter(r => r.availability?.some(a => a.dayOfWeek === dayIndex))
        .map(r => r.key)
    );
  }, [finalResourceLit, dayIndex]);

  const visibleResources =
    currentView === 'day'
      ? (finalResourceLit ?? []).filter(
          r => appointmentResourceKeys.has(r.key) || availabilityResourceKeys.has(r.key)
        )
      : (finalResourceLit ?? []);

  // Force BigCalendar to remount when filters change (react-big-calendar can keep stale resource columns otherwise)
  const calendarKey = useMemo(() => {
    const facilityKey = selectedFacility?.id ?? '';
    const typeKeys = Array.isArray(selectedResourceType?.resourcesType)
      ? selectedResourceType.resourcesType.join(',')
      : '';
    const resourceKeys = Array.isArray((selectedResources as any)?.resourceKey)
      ? (selectedResources as any).resourceKey.join(',')
      : Array.isArray(selectedResources)
      ? (selectedResources as any).join(',')
      : '';
    return `${facilityKey}|${typeKeys}|${resourceKeys}|${currentView}`;
  }, [selectedFacility?.id, selectedResourceType?.resourcesType, selectedResources, currentView]);

  const handleChangeAppointment = () => {
    const dataToEdit = selectedEvent?.appointmentData;
    if (dataToEdit) {
      if (isFollowUpAppointment(dataToEdit)) {
        setFollowUpDraftData(dataToEdit);
        setFollowUpModalOpen(true);
        setModalOpen(false);
        setActionsModalOpen(false);
        return;
      }
      setViewAppointmentData(dataToEdit);
      setShowAppointmentOnly(false);
      setSelectedSlot(null);
      setAppointment(dataToEdit);
      setModalOpen(true);
    }
    setActionsModalOpen(false);
  };

  const handleViewAppointment = (appointmentDataToView = null) => {
    const dataToView = appointmentDataToView || selectedEvent?.appointmentData;
    if (dataToView) {
      isOpeningViewModalRef.current = true;
      setViewAppointmentData(dataToView);
      const eventToSet = selectedEvent
        ? { ...selectedEvent, appointmentData: dataToView }
        : { appointmentData: dataToView };
      setSelectedEvent(eventToSet);
      setAppointment(dataToView);
      setShowAppointmentOnly(true);
      setActionsModalOpen(false);
      setTimeout(() => {
        if (isFollowUpAppointment(dataToView)) {
          setFollowUpDraftData(dataToView);
          setFollowUpModalOpen(true);
          setModalOpen(false);
        } else {
          setModalOpen(true);
        }
        isOpeningViewModalRef.current = false;
      }, 10);
    }
  };

  useEffect(() => {
    if (filteredMonth) {
      setDrowerOpen(false);
    }
    setDrowerOpen(false);
  }, [filteredMonth]);

  const CustomToolbar = ({ label, onNavigate, onView }) => {
    const [localVisibleAppointments, setLocalVisibleAppointments] = useState([]);
    const datePickerRef = useRef<any>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
      if (calendarDate) {
        setCalendarDate(calendarDate);
      }
    }, [calendarDate]);

    const handleClickCalinderSearch = () => {
      setShowDatePicker(true);
      if (datePickerRef.current) {
        datePickerRef.current.open();
      }
    };

    useEffect(() => {
      switch (currentView) {
        case 'day': {
          setTotalAppointmentsText('today appointments');
          const [, monthStrDay, dayStr] = label.split(' ');
          const day = parseInt(dayStr);
          const month = new Date(`${monthStrDay} 1, ${new Date().getFullYear()}`).getMonth();
          const year = new Date().getFullYear();

          const dayAppointments = visibleAppointments.filter(appointment => {
            const appointmentDate = new Date(appointment.start);
            return (
              appointmentDate.getDate() === day &&
              appointmentDate.getMonth() === month &&
              appointmentDate.getFullYear() === year
            );
          });

          if (dayAppointments !== localVisibleAppointments) {
            setLocalVisibleAppointments(dayAppointments);
          }
          break;
        }

        case 'week': {
          setTotalAppointmentsText('this week appointments');
          const [startDateStr, endDateStr] = label.split(' – ');
          const startDate = new Date(`${startDateStr}, ${new Date().getFullYear()}`);
          const endDate = new Date(`${endDateStr}, ${new Date().getFullYear()}`);

          const weekAppointments = visibleAppointments.filter(appointment => {
            const appointmentDate = new Date(appointment.start);
            return appointmentDate >= startDate && appointmentDate <= endDate;
          });

          if (JSON.stringify(weekAppointments) !== JSON.stringify(localVisibleAppointments)) {
            setLocalVisibleAppointments(weekAppointments);
          }
          break;
        }

        case 'month': {
          setTotalAppointmentsText('this month appointments');

          const [monthStr, yearStr] = label.split(' ');
          const month = new Date(`${monthStr} 1, ${yearStr}`).getMonth();
          const year = parseInt(yearStr);

          const filteredAppointments = visibleAppointments.filter(appointment => {
            const appointmentDate = new Date(appointment.start);
            return appointmentDate.getMonth() === month && appointmentDate.getFullYear() === year;
          });

          if (filteredAppointments !== localVisibleAppointments) {
            setLocalVisibleAppointments(filteredAppointments);
          }
          break;
        }

        case 'agenda': {
          setTotalAppointmentsText('this period appointments');

          const [startDateStr, endDateStr] = label.split(' – ');

          const startDateParts = startDateStr.split('/');
          const endDateParts = endDateStr.split('/');

          const startDate = new Date(`${startDateParts[2]}-${startDateParts[0]}-${startDateParts[1]}`);
          const endDate = new Date(`${endDateParts[2]}-${endDateParts[0]}-${endDateParts[1]}`);

          const agendaAppointments = visibleAppointments.filter(appointment => {
            const appointmentDate = new Date(appointment.start);
            return appointmentDate >= startDate && appointmentDate <= endDate;
          });

          if (JSON.stringify(agendaAppointments) !== JSON.stringify(localVisibleAppointments)) {
            setLocalVisibleAppointments(agendaAppointments);
          }

          break;
        }
        default:
          break;
      }
    }, [visibleAppointments, currentView, label]);

    useEffect(() => {
      if (isFetchingAppointments || isLoadingAppointments) {
        dispatch(showSystemLoader());
      } else {
        dispatch(hideSystemLoader());
      }
    }, [isLoadingAppointments, isFetchingAppointments]);

    return (
      <div style={{ marginInline: '15px' }} className="rbc-toolbar">
        <span className="rbc-btn-group">
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '16px' }}>
            <div className="calender-icon-schedule">
              <CalenderSimpleIcon style={{ fontSize: '17px' }} />
            </div>

            <strong
              style={{
                fontSize: '19px',
                marginInline: '8px',
                color: mode === 'light' ? '#2D3B4C' : 'var(--white)'
              }}
            >
              {localVisibleAppointments.length}
            </strong>
            <span style={{ fontSize: '14px', color: '#969FB0' }}>{totalAppointmentsText}</span>
          </div>
        </span>

        <div className="rbc-toolbar-label">
          <button
            style={{
              fontSize: '14px',
              margin: '7px',
              height: '35px',
              color: mode === 'light' ? 'black' : 'var(--white)'
            }}
            onClick={() => onNavigate('TODAY')}
            className="btn-scheduling"
          >
            Today
          </button>

          <button
            className="btn-scheduling"
            style={{ margin: '7px', height: '35px', color: mode === 'light' ? 'black' : 'var(--white)' }}
            onClick={() => onNavigate('PREV')}
          >
            <ArrowLeftLineIcon />
          </button>
          <Button
            className="btn-scheduling"
            onClick={handleClickCalinderSearch}
            style={{
              display: showDatePicker ? 'none' : 'inline-block',
              border: 'none',
              height: '35px',
              color: mode === 'light' ? 'black' : 'var(--white)'
            }}
          >
            <strong>{label}</strong>
          </Button>

          {showDatePicker && (
            <DatePicker
              ref={datePickerRef}
              onChange={date => {
                if (date) {
                  setCalendarDate(date);
                  setCurrentCalView('day');
                }
              }}
              placement="bottomStart"
              defaultOpen
              format={currentView === 'month' ? 'yyyy-MM' : 'yyyy-MM-dd'}
              onClose={() => {
                setShowDatePicker(false);
              }}
            />
          )}
          <button
            className="btn-scheduling"
            style={{ margin: '7px', height: '35px', color: mode === 'light' ? 'black' : 'var(--white)' }}
            onClick={() => onNavigate('NEXT')}
          >
            <ArrowRightLineIcon />
          </button>
        </div>

        <ButtonGroup style={{ borderRadius: '5px', backgroundColor: 'var(--rs-border-primary)' }} size="md">
          <Button
            className="btn-scheduling"
            style={{ border: 'none', height: '35px' }}
            onClick={() => {
              setCurrentView(Views.MONTH), onView(Views.MONTH);
            }}
          >
            <Text>Month</Text>
          </Button>
          <Button
            className="btn-scheduling"
            style={{ border: 'none', height: '35px' }}
            onClick={() => {
              setCurrentView(Views.WEEK), onView(Views.WEEK);
            }}
          >
            <Text>Week</Text>
          </Button>
          <Button
            className="btn-scheduling"
            style={{ border: 'none', height: '35px' }}
            onClick={() => {
              setCurrentView(Views.DAY), onView(Views.DAY);
            }}
          >
            <Text>Day</Text>
          </Button>
          <Button
            className="btn-scheduling"
            style={{ border: 'none', height: '35px' }}
            onClick={() => {
              setCurrentView(Views.AGENDA), onView(Views.AGENDA);
            }}
          >
            <Text>Agenda</Text>
          </Button>
        </ButtonGroup>
      </div>
    );
  };

  const getTooltipContent = event => {
    if (currentView === 'month') {
      return `${event.title} - ${event.fromTo}`;
    } else {
      return `${event.title}`;
    }
  };

  const [currentCalView, setCurrentCalView] = useState('month'); // Force "month" view

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  const ResourceHeader = ({ resource }) => {
    return (
      <div
        style={{
          marginLeft: '5px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          height: '65px'
        }}
      >
        <Avatar
          size="md"
          circle
          src={
            resource && resource.fileContent
              ? `data:${resource.contentType};base64,${resource.fileContent}`
              : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
          }
        />
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '14px' }} className="font-semibold text-sm">
            {resource?.resourceName}
          </div>
          <div style={{ color: 'gray', fontSize: '12px' }}>{resource?.resource_type}</div>
        </div>
      </div>
    );
  };

  const formats = {
    timeGutterFormat: (date, culture, localizer) => localizer.format(date, 'h A', culture)
  };

  const data = [];
  const minTime = new Date();
  minTime.setHours(8, 0, 0);

  const hexToRgba = (hex, alpha = 0.1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const MyEvent = ({ event }) => {
    const image = event?.appointmentData?.profilePicture;
    const content_type = event?.appointmentData?.profilePicture;

    return (
      <div
        style={{
          padding: '7px',
          display: 'flex',
          gap: '9px'
        }}
      >
        <div style={{ marginRight: '5px' }}>
          <Avatar
            size="xs"
            circle
            src={
              image ? `data:${content_type};base64,${image}` : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
            }
          />
        </div>

        <div>
          <p style={{ fontSize: '12px', color: 'black' }}>{event.title}</p>
          <p
            style={{
              fontSize: '10px',
              marginTop: '9px',
              color: '#8F98AB'
            }}
          >
            {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ›{' '}
            {event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  };

  const eventPropGetter = event => {
    const normalize = str => str?.toLowerCase().replace(/[-_]/g, ' ').trim();

    const getBackgroundColor = status => {
      const item = legendItems.find(i => normalize(i.label) === normalize(status));
      return item ? hexToRgba(item.color, 0.15) : '#ffffffff';
    };

    const getBorderColor = status => {
      const item = legendItems.find(i => normalize(i.label) === normalize(status));
      return item?.borderColor ? item.color : '#007bff';
    };

    const status = event?.appointmentData?.appointmentStatus;
    const backgroundColor = getBackgroundColor(status);
    const borderColor = getBorderColor(status);

    return {
      style: {
        backgroundColor,
        borderColor: '#007bff',
        borderWidth: '3px',
        borderStyle: 'solid',
        borderRadius: '10px',
        padding: '8px',
        color: 'black',
        boxShadow: `0 2px 8px ${hexToRgba(borderColor, 0.3)}`,
        transition: 'all 0.2s ease'
      }
    };
  };

  const slotPropGetter = (date, resourceId) => {
    const defaultShadedStyle = {
      backgroundColor: '#eee',
      pointerEvents: 'none',
      color: '#ccc'
    };

    const currentResource = resourcesWithAvailabilityResponse?.object.find(r => r.key === resourceId);

    if (currentResource && currentResource.availability) {
      const jsDay = date.getDay();
      const apiDay = jsDay;
      const currentMinutes = date.getHours() * 60 + date.getMinutes();
      const isAvailable =
        currentResource?.availability?.some(period => {
          const startMinutes = period.startHour * 60 + (period.startMinute || 0);
          const endMinutes = period.endHour * 60 + (period.endMinute || 0);
          const match = period.dayOfWeek === apiDay && currentMinutes >= startMinutes && currentMinutes < endMinutes;
          return match;
        }) || false;

      if (isAvailable) {
        return {};
      }
    }

    return { style: defaultShadedStyle };
  };

  const requestsRows = useMemo(() => {
    const list = appointments?.object ?? [];
    const resourcesList = resourcesWithAvailabilityResponse?.object ?? [];

    return list
      .filter((a: any) => String(a?.visitTypeLkey) === String(FOLLOW_UP_VISIT_TYPE_LKEY))
      .filter((a: any) => !a?.appointmentStart)
      .map((a: any) => {
        const patient = a?.patient || {};

        const patientName =
          patient?.full_name ||
          patient?.fullName ||
          (patient?.first_name && patient?.last_name
            ? `${patient.first_name} ${patient.last_name}`.trim()
            : patient?.first_name || patient?.last_name || 'Unknown');

        const patientGender = patient?.genderLvalue?.lovDisplayVale || patient?.genderLkey || '';
        const patientAge = patient?.dob ? calculateAgeFormat(patient.dob) : '';

        const patientMrn = patient?.patient_mrn || '';

          const resourceKey = a?.resourceKey ?? a?.resource_key ?? a?.resource?.key ?? null;

      const resource =
        resourceKey != null ? resourcesList.find((r: any) => String(r.key) === String(resourceKey)) : null;

      const resourceNameFromService =
        resourceKey != null ? resourceNameById.get(String(resourceKey)) : '';
      const resourceName =
        (resourceNameFromService && String(resourceNameFromService).trim()) ||
        resource?.resourceName ||
        resource?.name ||
        a?.resourceName ||
        a?.resource_name ||
        '-';

      const resourceType =
        resource?.resource_type ||
        resource?.resourceType ||
        a?.resourceType ||
        a?.resource_type ||
        a?.resourceTypeLkey ||
        a?.resource_type_key ||
        '-';

        return {
          id: a.key,

          patientName,
          mrn: patientMrn,

          ageText: patientAge,
          genderText: patientGender,

          facilityKey: a?.facilityKey ?? a?.facility_key ?? a?.facilityId ?? a?.facility_id ?? '',

          createdBy: a?.createdBy ?? a?.created_by ?? '',
          createdAt: a?.createdAt ?? a?.created_at ?? null,

          status: a?.appointmentStatus ?? 'Pending',

          resourceName,
          resourceType,
          resourceKey: resourceKey ?? '',
          updatedBy: a?.updatedBy ?? a?.updated_by ?? '',
          updatedAt: a?.updatedAt ?? a?.updated_at ?? null,

          otherReason: a?.otherReason ?? '',

          _raw: a
        };
      });
  }, [appointments, resourcesWithAvailabilityResponse?.object, resourceNameById]);

  const handleApproveRequest = (row: any) => {
    setRequestToApprove(row?._raw);
    setRequestApproveModalOpen(true);
  };

  const handleRejectRequest = async (row: any, rejectReason: string) => {
    try {
      const raw = row?._raw;
      if (!raw?.key) return;

      await saveAppointment({
        ...raw,
        appointmentStatus: 'Rejected',
        otherReason: rejectReason,
        reasonValue: rejectReason,
        appointmentStart: null,
        appointmentEnd: null,
        updatedBy: authSlice.user.username
      }).unwrap();

      await refitchAppointments();
    } catch (e) {}
  };

  return (
    <div>
      <div
        style={{
          backgroundColor: mode === 'light' ? 'rgba(250, 250, 250, 8)' : 'var(--extra-dark-black)',
          position: 'relative',
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-start'
        }}
        className="inline-two-four-container"
      >
        <div className="schedual-screen-filters-waiting-list-position">
          <SectionContainer
            title={'Filters'}
            content={
              <Panel className="left-section" bordered>
                <div>
                  <Form fluid layout="inline">
                    <MyInput
                      disabled
                      height={35}
                      width={'11.5vw'}
                      vr={validationResult}
                      column
                      fieldLabel="City"
                      fieldType="select"
                      fieldName="durationLkey"
                      selectData={[]}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={undefined}
                    />
                  </Form>

                  <Form fluid layout="inline">
                    <MyInput
                      disabled
                      height={35}
                      width={'11.5vw'}
                      column
                      fieldLabel="Facility"
                      selectData={facilityListResponse ?? []}
                      fieldType="select"
                      selectDataLabel="name"
                      selectDataValue="id"
                      fieldName="id"
                      record={selectedFacility}
                      setRecord={setSelectedFacility}
                      searchable={false}
                    />
                  </Form>
                  <Form fluid layout="inline">
                    <MyInput
                      disabled
                      height={35}
                      width={'11.5vw'}
                      vr={validationResult}
                      column
                      fieldLabel="Resources Type"
                      fieldType="multyPicker"
                      fieldName="resourcesType"
                      selectData={ResourceTypeEnum ?? []}
                      selectDataLabel="label"
                      selectDataValue="value"
                      record={selectedResourceType}
                      setRecord={setSelectedResourceType}
                      searchable={false}
                    />
                  </Form>

                  <Form fluid layout="inline">
                    <MyInput
                      height={35}
                      width={'11.5vw'}
                      column
                      fieldLabel="Resources"
                      selectData={
                        filteredResourcesList.length > 0
                          ? filteredResourcesList
                          : !selectedResourceType?.resourcesType || selectedResourceType?.resourcesType.length == 0
                          ? resourcesWithAvailabilityResponse?.object
                          : []
                      }
                      fieldType="multyPicker"
                      selectDataLabel="resourceName"
                      selectDataValue="key"
                      fieldName="resourceKey"
                      record={selectedResources}
                      setRecord={setSelectedResources}
                    />
                  </Form>
                  <div></div>
                  <Checkbox onChange={() => setShowCanceled(!showCanceled)}>Show Canceled</Checkbox>
                </div>
              </Panel>
            }
          />

          <SectionContainer
            title={'WAITING LIST'}
            content={
              <div style={{ width: '100%', height: 300, marginTop: 18, overflow: 'auto' }}>
                {data.map(item => (
                  <Panel key={item.id} style={{ height: '37', marginBottom: 10 }}>
                    <Stack direction="row" spacing={10}>
                      <Avatar style={{ fontSize: '37px' }} circle src={item.avatar} alt="Avatar" />
                      <div>
                        <p style={{ fontSize: '14px', margin: 0 }}>{item.name}</p>
                        <p style={{ fontSize: '12px', margin: 0 }}>{item.date}</p>
                      </div>
                    </Stack>
                  </Panel>
                ))}
              </div>
            }
          />
        </div>

        {/* =================== Right Side ============= */}
        <Panel bordered className="right-section">
          <div
            style={{
              marginTop: '27px',
              marginInline: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}
          >
            <div />

            <div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <MyButton
                  appearance="ghost"
                  onClick={() => setAppRequestModalOpen(true)}
                  prefixIcon={() => <FontAwesomeIcon icon={faPaperPlane} />}
                >
                  View App Requests
                </MyButton>

                <MyButton appearance="ghost" prefixIcon={() => <FontAwesomeIcon icon={faPrint} />}>
                  Print Report
                </MyButton>

                <MyButton
                  onClick={() => {
                    setModalOpen(true);
                  }}
                  prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
                >
                  <Translate>Add New Appointments</Translate>
                </MyButton>
              </div>
            </div>
          </div>

          <BigCalendar
            key={calendarKey}
            date={currentCalendarDate}
            onNavigate={date => {
              setCalendarDate(date);
              setCurrentCalendarDate(date);
            }}
            className={`my-calendar ${currentView}`}
            style={{ height: '73vh' }}
            min={minTime}
            {...(currentView === 'day' && {
              resources: visibleResources ?? [],
              resourceIdAccessor: 'key',
              resourceTitleAccessor: 'resourceName'
            })}
            formats={formats}
            localizer={localizer}
            events={finalAppointments ?? []}
            step={60}
            timeslots={1}
            onSelectSlot={slotInfo => {
              if (slotInfo.resourceId) {
                const currentResource = resourcesWithAvailabilityResponse?.object.find(r => r.key === slotInfo.resourceId);

                if (currentResource && currentResource.availability) {
                  const jsDay = slotInfo.start.getDay();
                  const apiDay = jsDay;
                  const currentMinutes = slotInfo.start.getHours() * 60 + slotInfo.start.getMinutes();

                  const isAvailable =
                    currentResource?.availability?.some(period => {
                      const startMinutes = period.startHour * 60 + (period.startMinute || 0);
                      const endMinutes = period.endHour * 60 + (period.endMinute || 0);

                      return period.dayOfWeek === apiDay && currentMinutes >= startMinutes && currentMinutes < endMinutes;
                    }) || false;

                  if (!isAvailable) {
                    return;
                  }

                  const enhancedSlotInfo = {
                    ...slotInfo,
                    resourceKey: currentResource.resourceKey,
                    resourceTypeLkey: currentResource.resourceTypeLkey,
                    resourceName: currentResource.resourceName,
                    facilityKey: currentResource.facilityKey
                  };

                  setSelectedSlot(enhancedSlotInfo);
                  setModalOpen(true);
                  return;
                }
              }

              setSelectedSlot(slotInfo);
              setModalOpen(true);
            }}
            startAccessor="start"
            endAccessor="end"
            views={['month', 'week', 'day', 'agenda']}
            defaultView={currentView}
            selectable={true}
            onSelectEvent={event => {
              handleSelectEvent(event);
            }}
            tooltipAccessor={event => getTooltipContent(event)}
            onView={view => setCurrentView(view)}
            eventPropGetter={eventPropGetter}
            components={{
              toolbar: CustomToolbar,
              resourceHeader: ResourceHeader,
              event: MyEvent
            }}
            slotPropGetter={currentView == 'day' ? slotPropGetter : null}
          />

          <Stack style={{ margin: '0.4%' }}>
            {legendItems.map(({ label, color }) => (
              <Stack style={{ marginRight: '36px' }} spacing={6} alignItems="center" key={label}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 12,
                    backgroundColor: color
                  }}
                />
                <span style={{ fontSize: '12px' }}>{label}</span>
              </Stack>
            ))}
          </Stack>
        </Panel>
      </div>

      <AppointmentModal
        from={'Schedule'}
        isOpen={modalOpen && !followUpModalOpen}
        onClose={() => {
          setModalOpen(false), setShowAppointmentOnly(false), setViewAppointmentData(null);
        }}
        appointmentData={viewAppointmentData || selectedEvent?.appointmentData}
        resourceType={selectedResourceType}
        facility={selectedFacility}
        onSave={refitchAppointments}
        showOnly={showAppointmentOnly}
        selectedSlot={showAppointmentOnly ? null : selectedSlot}
        onSwitchToFollowUp={(draft: any) => {
          setFollowUpDraftData({ ...(draft?.appointment ?? {}), patient: draft?.patient });
          setModalOpen(false);
          setFollowUpModalOpen(true);
        }}
      />
      <AppointmentModal
        from={'Schedule'}
        isOpen={requestApproveModalOpen}
        onClose={() => {
          setRequestApproveModalOpen(false);
          setRequestToApprove(null);
        }}
        appointmentData={requestToApprove}
        resourceType={selectedResourceType}
        facility={selectedFacility}
        onSave={async () => {
          await refitchAppointments();
          setRequestApproveModalOpen(false);
          setRequestToApprove(null);
          setAppRequestModalOpen(false);
        }}
        showOnly={false}
        selectedSlot={null}
        forceStatus="Confirmed"
      />

      <FollowupAppointmentModal
        from={'Schedule'}
        isOpen={followUpModalOpen}
        onClose={() => {
          setFollowUpModalOpen(false);
          setFollowUpDraftData(null);
          setShowAppointmentOnly(false);
          setViewAppointmentData(null);
        }}
        appointmentData={followUpDraftData || viewAppointmentData || selectedEvent?.appointmentData}
        resourceType={selectedResourceType}
        facility={selectedFacility}
        onSave={refitchAppointments}
        showOnly={showAppointmentOnly}
        selectedSlot={showAppointmentOnly ? null : selectedSlot}
      />
      <AppointmentActionsModal
        viewAppointment={appointmentData => handleViewAppointment(appointmentData)}
        editAppointment={() => handleChangeAppointment()}
        onStatusChange={refitchAppointments}
        isActionsModalOpen={ActionsModalOpen}
        onActionsModalClose={() => {
          if (!isOpeningViewModalRef.current) {
            setSelectedEvent(null);
            setAppointment(null);
          }
          setActionsModalOpen(false);
        }}
        appointment={selectedEvent}
      />

      <Drawer placement={'left'} open={false} onClose={() => setDrowerOpen(false)}>
        <Drawer.Header>
          <Drawer.Title></Drawer.Title>
          <Drawer.Actions>
            <Button onClick={() => setDrowerOpen(false)}>Cancel</Button>
            <Button onClick={() => setDrowerOpen(false)} appearance="primary">
              Confirm
            </Button>
          </Drawer.Actions>
        </Drawer.Header>
        <Drawer.Body>
          <DatePicker
            format="yyyy-MM"
            placeholder="Select Month and Year"
            cleanable
            placement="autoVerticalStart"
            style={{ width: 500 }}
          />
        </Drawer.Body>
      </Drawer>

      <Modal open={showReasonModal} onClose={() => setShowReasonModal(false)}>
        <Modal.Header />
        <Modal.Body>
          <Form fluid layout="vertical">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 520, maxWidth: '100%' }}>
              <MyInput
                width="100%"
                column
                fieldLabel="Reason"
                fieldName="reason"
                record={reasonViewRecord}
                setRecord={setReasonViewRecord}
                disabled
              />
              <MyInput
                width="100%"
                column
                fieldLabel="Other Reason"
                fieldName="otherReason"
                fieldType="textarea"
                rows={3}
                record={reasonViewRecord}
                setRecord={setReasonViewRecord}
                disabled
              />
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <MyModal
        open={appRequestModalOpen}
        setOpen={setAppRequestModalOpen}
        title={'View Appoimtment Request'}
        bodyheight="80vh"
        size="70vw"
        actionButtonLabel="Confirm"
        actionButtonFunction={() => {
          setModalOpen(false);
        }}
        content={
          <ViewAppointmentRequests
            data={requestsRows}
            onApprove={handleApproveRequest}
            onReject={handleRejectRequest}
          />
        }
      ></MyModal>
    </div>
  );
};

export default ScheduleScreen;
