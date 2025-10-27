import React, { useEffect, useRef, useState } from 'react';
import { Calendar as BigCalendar, Views, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  ButtonToolbar,
  Panel,
  InputGroup,
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
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useGetFacilitiesQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { initialListRequest, ListRequest } from '@/types/types';
import AppointmentModal from './AppoitmentModal';
import { ApAppointment } from '@/types/model-types';
import { faPaperPlane, faPlus, faPrint } from '@fortawesome/free-solid-svg-icons';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import AppointmentActionsModal from './AppointmentActionsModal';
import {
  useGetAppointmentsQuery,
  useGetResourcesWithAvailabilityQuery
} from '@/services/appointmentService';
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


const ScheduleScreen = () => {
  const localizer = momentLocalizer(moment);
  const mode = useSelector((state: any) => state.ui.mode);
  const [validationResult, setValidationResult] = useState({});
  const [recordSearchAppointment, setRecordSearchAppointment] = useState({ value: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [ActionsModalOpen, setActionsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedStartDate, setSelectedStartDate] = useState();
  const [appRequestModalOpen, setAppRequestModalOpen] = useState(false);
  //Calendar Filters
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedResourceType, setSelectedResourceType] = useState(null);
  const [selectedResources, setSelectedResources] = useState([]);
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [appointmentsData, setAppointmentsData] = useState([]);
  const [showAppointmentOnly, setShowAppointmentOnly] = useState(false);
  const [filteredResourcesList, setFilteredResourcesList] = useState([]);
  const [showCanceled, setShowCanceled] = useState<boolean>(false);
  const [filteredMonth, setFilteredMonth] = useState<Date>();
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [finalResourceLit, setFinalResourceLit] = useState();
  const [currentView, setCurrentView] = useState('day');
  const [totalAppointmentsText, setTotalAppointmentsText] = useState<string>();
  const [calendarDate, setCalendarDate] = useState<Date>(null);
  const [finalAppointments, setFinalAppointments] = useState();

  const { data: resourceTypeQueryResponse } = useGetLovValuesByCodeQuery('BOOK_RESOURCE_TYPE');
  const { data: resourcesWithAvailabilityResponse } =
    useGetResourcesWithAvailabilityQuery(listRequest);

  useEffect(() => {
    console.log(resourcesWithAvailabilityResponse?.object);
  }, [resourcesWithAvailabilityResponse]);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);
  const {
    data: appointments,
    refetch: refitchAppointments,
    error,
    isLoading: isLoadingAppointments,
    isFetching: isFetchingAppointments
  } = useGetAppointmentsQuery({
    resource_type: selectedResourceType?.resourcesType || null,
    facility_id: selectedFacility?.facilityKey || null,
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

        const resource = resourcesWithAvailabilityResponse.object.find(
          item => item.key === appointment.resourceKey
        );

        const isHidden = appointment?.appointmentStatus === 'Canceled';
        return {
          id: appointment?.key,
          title: ` ${appointment?.patient?.fullName}, ${
            isNaN(dob) ? 'Unknown' : today.getFullYear() - dob.getFullYear()
          }Y  ${
            !(currentView === 'day' || currentView === 'week')
              ? ', ' + (resource?.resourceName || 'Unknown Resource')
              : ''
          }
 `, // Customize title as needed
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
    if (selectedResourceType) {
      const filtered = resourcesWithAvailabilityResponse.object.filter(
        resource => resource.resourceTypeLkey === selectedResourceType?.resourcesType
      );
      setFilteredResourcesList(filtered);
    }
  }, [resourcesWithAvailabilityResponse, selectedResourceType?.resourcesType]);
  useEffect(() => {
    if (selectedSlot) {
      setSelectedStartDate(selectedSlot?.slots[0]);
    }
  }, [selectedSlot]);
  const handleSelectEvent = event => {
    console.log(event);
    console.log(event?.appointmentData?.appointmentStatus);
    setSelectedEvent(event);
    if (
      event?.appointmentData?.appointmentStatus === 'Canceled' ||
      event?.appointmentData?.appointmentStatus === 'No-Show'
    ) {
      setShowReasonModal(true);
      return;
    }

    setActionsModalOpen(true);
  };

  const { data: facilityListResponse, refetch: refetchFacility } = useGetFacilitiesQuery({
    ...initialListRequest
  });

  const convertDate = appointmentTime => {
    return new Date(appointmentTime);
  };

  const [appointment, setAppointment] = useState<ApAppointment>({ ...newApAppointment });
  const [drowerOpen, setDrowerOpen] = useState(false);
  const dispatch = useAppDispatch();

  const legendItems = [
    { label: 'No-Show', color: '#FDE68A' },
    { label: 'Checked In', color: '#FDBA74' },
    { label: 'New', color: '#6366F1' },
    { label: 'Confirmed', color: '#34D399' },
    { label: 'Completed', color: '#93C5FD' }
  ];

  const visibleAppointments =
    currentView === 'agenda' || showCanceled
      ? appointmentsData
      : appointmentsData.filter(event => !event.hidden);

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

  const handleChangeAppointment = () => {
    setAppointment(selectedEvent.appointmentData);
    setModalOpen(true);
    setActionsModalOpen(false);
  };

  const handleViewAppointment = () => {
    setAppointment(selectedEvent.appointmentData);
    setModalOpen(true);
    setActionsModalOpen(false);
    setShowAppointmentOnly(true);
  };
  useEffect(() => {
    console.log(filteredMonth);
    console.log(drowerOpen);
    setDrowerOpen(false);
  }, [filteredMonth]);

  const CustomToolbar = ({ label, onNavigate, onView }) => {
    const [localVisibleAppointments, setLocalVisibleAppointments] = useState([]);
    const datePickerRef = useRef();
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
          const [, monthStrDay, dayStr] = label.split(' '); // e.g. "Wednesday Apr 30"
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

          const [monthStr, yearStr] = label.split(' '); // example "April 2025"
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

          const startDate = new Date(
            `${startDateParts[2]}-${startDateParts[0]}-${startDateParts[1]}`
          );
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
            <div
              className='calender-icon-schedule'
            >
              <CalenderSimpleIcon style={{ fontSize: '17px' }} />
            </div>

            <strong style={{ fontSize: '19px', marginInline: '8px', color: mode === 'light' ? '#2D3B4C' : 'var(--white)'}}>
              {localVisibleAppointments.length}
            </strong>
            <span style={{ fontSize: '14px', color: '#969FB0' }}>{totalAppointmentsText}</span>
          </div>
        </span>

        <div className="rbc-toolbar-label">
          <button
            style={{ fontSize: '14px', margin: '7px', height: '35px', color: mode === 'light' ? 'black' : 'var(--white)' }}
            onClick={() => onNavigate('TODAY')}
            className='btn-scheduling'
          >
           Today
          </button>

          <button className='btn-scheduling' style={{ margin: '7px', height: '35px',color: mode === 'light' ? 'black' : 'var(--white)' }} onClick={() => onNavigate('PREV')}>
            <ArrowLeftLineIcon />
          </button>
          <Button
            className='btn-scheduling'
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
                console.log('DatePicker closed');
                setShowDatePicker(false);
              }}
            />
          )}
          <button className='btn-scheduling' style={{ margin: '7px', height: '35px', color: mode === 'light' ? 'black' : 'var(--white)' }} onClick={() => onNavigate('NEXT')}>
            <ArrowRightLineIcon />
          </button>
        </div>

        <ButtonGroup style={{ borderRadius: '5px', backgroundColor:  'var(--rs-border-primary)' }} size="md">
          <Button
          className='btn-scheduling'
            style={{ border: 'none', height: '35px' }}
            onClick={() => {
              setCurrentView(Views.MONTH), onView(Views.MONTH);
            }}
          >
            <Text>Month</Text>
          </Button>
          <Button
          className='btn-scheduling'
            style={{ border: 'none', height: '35px' }}
            onClick={() => {
              setCurrentView(Views.WEEK), onView(Views.WEEK);
            }}
          >
            <Text>Week</Text>
          </Button>
          <Button
          className='btn-scheduling'
            style={{ border: 'none', height: '35px' }}
            onClick={() => {
              setCurrentView(Views.DAY), onView(Views.DAY);
            }}
          >
            <Text>Day</Text>
          </Button>
          <Button
          className='btn-scheduling'
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
    // based on the current view
    if (currentView === 'month') {
      return `${event.title} - ${event.fromTo}`;
    } else {
      return `${event.title}`;
    }
  };

  const [currentCalView, setCurrentCalView] = useState('month'); // Force "month" view
  const divContent = (
    "Scheduling"
  );
  dispatch(setPageCode('Schedule_Screen'));
  dispatch(setDivContent(divContent));
  useEffect(() => {
    console.log(selectedEvent?.appointmentData.otherReason);
  }, [selectedEvent]);
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

  useEffect(() => {
    console.log(
      filteredResourcesList.length > 0
        ? filteredResourcesList
        : !selectedResourceType?.resourcesType
        ? resourcesWithAvailabilityResponse?.object
        : []
    );
  }, [filteredResourcesList, selectedResourceType]);

  useEffect(() => {
    const selectedKeys = selectedResources?.resourceKey;
    const selectedTypeKey = selectedResourceType?.key;

    let finalList = filteredResourcesList;

    if (selectedTypeKey) {
      finalList = finalList.filter(resource => resource.resourceTypeLkey === selectedTypeKey);
    }

    if (Array.isArray(selectedKeys) && selectedKeys.length > 0) {
      finalList = finalList.filter(resource => selectedKeys.includes(resource.key));
    }

    if (!finalList || finalList.length === 0) {
      finalList = resourcesWithAvailabilityResponse?.object || [];
    }

    setFinalResourceLit(finalList);
  }, [
    selectedResources,
    selectedResourceType,
    filteredResourcesList,
    resourcesWithAvailabilityResponse
  ]);

  useEffect(() => {
    console.log(resourceTypeQueryResponse?.object ?? []);
  }, [resourceTypeQueryResponse]);

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
              image
                ? `data:${content_type};base64,${image}`
                : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
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
      return item ? hexToRgba(item.color, 0.15) : '#ffffff';
    };

    const getBorderColor = status => {
      const item = legendItems.find(i => normalize(i.label) === normalize(status));
      return item ? item.color : '#007bff';
    };

    const status = event?.appointmentData?.appointmentStatus;
    const backgroundColor = getBackgroundColor(status);
    const borderColor = getBorderColor(status);

    return {
      style: {
        backgroundColor,
        borderColor,
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

    const currentResource = resourcesWithAvailabilityResponse?.object.find(
      r => r.key === resourceId
    );

    if (currentResource && currentResource.availability) {
      const jsDay = date.getDay(); // JavaScript day: 0=Sunday, 6=Saturday
      const apiDay = (jsDay + 1) % 7; // Convert to API day: 0=Saturday, 1=Sunday, etc.
      const currentMinutes = date.getHours() * 60 + date.getMinutes();
      const isAvailable =
        currentResource?.availability?.some(period => {
          const startMinutes = period.startHour * 60 + (period.startMinute || 0);
          const endMinutes = period.endHour * 60 + (period.endMinute || 0);

          const match =
            period.dayOfWeek === apiDay &&
            currentMinutes >= startMinutes &&
            currentMinutes < endMinutes;
          return match;
        }) || false;

      if (isAvailable) {
        return {};
      }
    }

    return { style: defaultShadedStyle };
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
          // justifyContent: 'flex-end'
        }}
        className="inline-two-four-container"
      >
<div className='schedual-screen-filters-waiting-list-position'>
<SectionContainer title={"Filters"}
content={
        <Panel className="left-section" bordered>
          <div>
            <Form fluid layout="inline">
              <MyInput
                disabled
                height={'35px'}
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
                // record={appointment}
                // setRecord={setAppoitment}
              />
            </Form>

            <Form fluid layout="inline">
              <MyInput
                height={'35px'}
                width={'11.5vw'}
                column
                fieldLabel="Facility"
                selectData={facilityListResponse?.object ?? []}
                fieldType="select"
                selectDataLabel="facilityName"
                selectDataValue="key"
                fieldName="facilityKey"
                record={selectedFacility}
                setRecord={setSelectedFacility}
                searchable={false}
              />
            </Form>
            <Form fluid layout="inline">
              <MyInput
                height={'35px'}
                width={'11.5vw'}
                vr={validationResult}
                column
                fieldLabel="Resources Type"
                fieldType="multyPicker"
                fieldName="resourcesType"
                selectData={resourceTypeQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={selectedResourceType}
                setRecord={setSelectedResourceType}
                searchable={false}
              />
            </Form>

            <Form fluid layout="inline">
              <MyInput
                height={'35px'}
                width={'11.5vw'}
                column
                fieldLabel="Resources"
                selectData={
                  filteredResourcesList.length > 0
                    ? filteredResourcesList
                    : !selectedResourceType?.resourcesType
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




        </Panel>}/>

<SectionContainer title={"WAITING LIST"}
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
          </div>}/>
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
            {/* Left  */}
            <div>
              {/* <InputGroup
                inside
                style={{
                  width: '320px',
                  // maxWidth: 350,
                  height: 35,
                  marginBottom: 10
                }}
              >
                <InputGroup.Button>
                  <SearchIcon style={{ fontSize: '18px', marginRight: 10 }} />
                </InputGroup.Button>
                <Input placeholder="Search For Appointment" />
              </InputGroup> */}
              <Form>
                <MyInput
                  leftAddon={<SearchIcon />}
                  fieldName="value"
                  record={recordSearchAppointment}
                  setRecord={setRecordSearchAppointment}
                  placeholder="Search For Appointment"
                  width={320}
                  showLabel={false}
                />
              </Form>
            </div>

            {/* Right  */}
            <div>
              {/* <ButtonToolbar> */}
              <div style={{display: 'flex', gap: '5px'}}>

              <MyButton
                appearance="ghost"
                onClick={() => setAppRequestModalOpen(true)}
                prefixIcon={() => <FontAwesomeIcon icon={faPaperPlane} />}
              >
                View App Requests
              </MyButton>

                <MyButton
                  // color="blue"
                  // style={{
                  //   width: '26%',
                  //   display: 'flex',
                  //   alignItems: 'center',
                  //   justifyContent: 'flex-start',
                  //   borderRadius: '5px',
                  //   color: 'blue'
                  // }}
                  appearance="ghost"
                  prefixIcon={() => <FontAwesomeIcon
                    icon={faPrint}
                  />}
                >
                  {/* <FontAwesomeIcon
                    icon={faPrint}
                    style={{ color: '#2264E5', marginRight: '10px', fontSize: '18px' }}
                  /> */}
                  Print Report
                </MyButton>
                <MyButton
                  onClick={() => {
                    setModalOpen(true);
                  }}
                  // appearance="primary"
                  // style={{
                  //   width: '34%',
                  //   backgroundColor: 'var(--primary-blue)',
                  //   marginLeft: '3px'
                  // }}
                  prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
                >
                  <Translate>Add New Appointments</Translate>
                </MyButton>
                </div>
              {/* </ButtonToolbar> */}
            </div>
          </div>

          <BigCalendar
            date={calendarDate}
            onNavigate={date => setCalendarDate(date)}
            className={`my-calendar ${currentView}`}
            style={{ height: '73vh' }}
            min={minTime}
            {...(currentView === 'day' && {
              resources: finalResourceLit ?? [],
              resourceIdAccessor: 'key',
              resourceTitleAccessor: 'resourceName'
            })}
            formats={formats}
            localizer={localizer}
            events={finalAppointments ?? []}
            step={60}
            timeslots={1}
            onSelectSlot={slotInfo => {
              console.log('Selected slot:', slotInfo);

              // Check if the slot is available before opening modal
              if (slotInfo.resourceId) {
                const currentResource = resourcesWithAvailabilityResponse?.object.find(
                  r => r.key === slotInfo.resourceId
                );

                if (currentResource && currentResource.availability) {
                  const jsDay = slotInfo.start.getDay();
                  const apiDay = (jsDay + 1) % 7;
                  const currentMinutes =
                    slotInfo.start.getHours() * 60 + slotInfo.start.getMinutes();

                  const isAvailable =
                    currentResource?.availability?.some(period => {
                      const startMinutes = period.startHour * 60 + (period.startMinute || 0);
                      const endMinutes = period.endHour * 60 + (period.endMinute || 0);

                      return (
                        period.dayOfWeek === apiDay &&
                        currentMinutes >= startMinutes &&
                        currentMinutes < endMinutes
                      );
                    }) || false;

                  if (!isAvailable) {
                    return; // Don't open modal for unavailable slots
                  }
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
              <Stack style={{ marginRight: '36px' }} spacing={6} align="center" key={label}>
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
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false), setShowAppointmentOnly(false);
        }}
        appointmentData={selectedEvent?.appointmentData}
        resourceType={selectedResourceType}
        facility={selectedFacility}
        onSave={refitchAppointments}
        showOnly={showAppointmentOnly}
        selectedSlot={selectedSlot}
      />
      <AppointmentActionsModal
        viewAppointment={() => handleViewAppointment()}
        editAppointment={() => handleChangeAppointment()}
        onStatusChange={refitchAppointments}
        isActionsModalOpen={ActionsModalOpen}
        onActionsModalClose={() => {
          setSelectedEvent(null), setActionsModalOpen(false), setAppointment(null);
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
            format="yyyy-MM" // Only show year and month
            placeholder="Select Month and Year"
            // onChange={handleSelect} // Trigger filter on change
            // value={selectedDate}
            cleanable
            placement="autoVerticalStart" // Position of the dropdown
            style={{ width: 500 }}
          />
        </Drawer.Body>
      </Drawer>

      <Modal open={showReasonModal} onClose={() => setShowReasonModal(false)}>
        <Modal.Header></Modal.Header>

        <Modal.Body>
          <br />
          <br />

          <Form layout="inline">
            <div>
              <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                Reason
              </label>
              <Input
                value={selectedEvent?.appointmentData?.reasonLvalue?.lovDisplayVale ?? null}
                width={350}
              />
            </div>
            <br />
            <div>
              <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                Other Reason
              </label>
              <Input value={selectedEvent?.appointmentData.otherReason} width={350} />
            </div>
          </Form>

          <br />
          <br />
        </Modal.Body>
      </Modal>

        <MyModal
          open={appRequestModalOpen}
          setOpen={setAppRequestModalOpen}
          title={"View Appoimtment Request"}
          bodyheight="80vh"
          size="70vw"
          actionButtonLabel="Confirm"
          actionButtonFunction={() => {
            console.log('Action confirmed!');
            setModalOpen(false);
          }}
          content={<ViewAppointmentRequests></ViewAppointmentRequests>}
          >
        </MyModal>

    </div>
  );
};

export default ScheduleScreen;
