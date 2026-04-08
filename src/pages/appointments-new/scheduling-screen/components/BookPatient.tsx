import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Divider, Form, Panel } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { useBookPatientAppointmentMutation } from '@/services/appointment/appointmentService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';
import PatientCardWithPicture from '@/components/PatientCard/PatientCardWithPicture';
import {
  useGetPatientsByFullNameQuery,
  useGetPatientsByMedicalRecordNumberQuery
} from '@/services/patient/patientService';
import MyButton from '@/components/MyButton/MyButton';
import QuickPatient from '@/pages/patient/facility-patient-list/QuickPatient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faUser } from '@fortawesome/free-solid-svg-icons';
import SectionContainer from '@/components/SectionsoContainer';
import { useGetAppointablePractitionerByLoggedInFacilityQuery } from '@/services/setup/practitioner/PractitionerService';
import { useGetAppointableServicesByLoggedInFacilityQuery } from '@/services/setup/serviceService';

type BookPatientProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  appointmentData: any;
  practitioners?: any[];
  services?: any[];
  onBooked?: () => Promise<void> | void;
};

const BookPatient = ({
  open,
  setOpen,
  appointmentData,
  practitioners = [],
  services = [],
  onBooked
}: BookPatientProps) => {
  const dispatch = useAppDispatch();
  const [bookPatientAppointment, { isLoading }] = useBookPatientAppointmentMutation();

  useEffect(() => {
    if (open) {
      // Debug: inspect appointment payload when opening booking modal
      // eslint-disable-next-line no-console
      console.log('BookPatient opened with appointmentData:', appointmentData);

      // Prefill default practitioner from appointment when available
      if (appointmentData?.defaultPractitioner) {
        setRecord(prev => ({
          ...prev,
          defaultPractitioner: appointmentData.defaultPractitioner
        }));
      }
    }
  }, [open, appointmentData]);

  const appointmentId = useMemo(() => {
    const raw = appointmentData?.id ?? appointmentData?.key ?? null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [appointmentData]);
  const formatDateTime = (value: any) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString();
  };

  const appointmentDetailsRecord = useMemo(
    () => ({
      facility:
    
        appointmentData?.facility||
        '-',
      department:
        appointmentData?.department ||
        '-',
      practitioner:
        appointmentData?.status ||
        '-',
      resourceType:
        appointmentData?.resourceType ||
        '-',
      resourceName:
       
        appointmentData?.resourceId ||
        '-',
      startDateTime:
        formatDateTime(
          appointmentData?.startDatetime || '-'
        ),
      endDateTime:
        formatDateTime(
          appointmentData?.endDatetime || '-'
        ),
      bookingMode: appointmentData?.bookingMode || '-'
    }),
    [appointmentData]
  );
  const selectedSlotDisplay = useMemo(() => {
    const rawStart =
      appointmentData?.appointmentStart ||
      appointmentData?.startDatetime ||
      appointmentData?.startDateTime ||
      appointmentData?.start;
    const rawEnd =
      appointmentData?.appointmentEnd ||
      appointmentData?.endDatetime ||
      appointmentData?.endDateTime ||
      appointmentData?.end;
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
    const capacity = Number(appointmentData?.parallelCapacityValue ?? 3);
    const booked = Number(appointmentData?.numberOfResourcesExpected ?? 0);
    return {
      timeRange: `${startTime} - ${endTime}`,
      capacityText: `${Math.max(0, capacity - booked)}/${capacity}`
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
    reason: '',
    note: ''
  });
  const [patientSearchRecord, setPatientSearchRecord] = useState<any>({
    searchByField: 'fullName',
    patientName: ''
  });
  const [patientSearchValue, setPatientSearchValue] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [quickPatientModalOpen, setQuickPatientModalOpen] = useState(false);
  const [showPatientSearch, setShowPatientSearch] = useState(false);

  const searchByField = String(patientSearchRecord?.searchByField ?? 'fullName');

  const { data: patientsByFullName, isFetching: isFetchingByName } = useGetPatientsByFullNameQuery(
    {
      keyword: patientSearchValue,
      page: 0,
      size: 10,
      sort: 'id,asc'
    },
    {
      skip: !patientSearchValue || searchByField !== 'fullName'
    }
  );

  const { data: patientsByMrn, isFetching: isFetchingByMrn } = useGetPatientsByMedicalRecordNumberQuery(
    {
      medicalRecordNumber: patientSearchValue,
      page: 0,
      size: 10,
      sort: 'id,asc'
    },
    {
      skip: !patientSearchValue || searchByField !== 'patientMrn'
    }
  );

  const patientSearchResult = useMemo(() => {
    if (searchByField === 'patientMrn') {
      return (patientsByMrn as any)?.data ?? [];
    }
    return (patientsByFullName as any)?.data ?? [];
  }, [patientsByFullName, patientsByMrn, searchByField]);

  const isFetchingPatients = isFetchingByName || isFetchingByMrn;

  const handleClose = () => {
    setOpen(false);
    setRecord({
      patientId: null,
      status: 'BOOKED',
      defaultService: null,
      defaultPractitioner: null,
      reason: '',
      note: ''
    });
    setSelectedPatient(null);
    setPatientSearchRecord({ searchByField: 'fullName', patientName: '' });
    setPatientSearchValue('');
    setQuickPatientModalOpen(false);
    setShowPatientSearch(false);
  };

  const handleConfirmBooking = async () => {
    if (!appointmentId || !record?.patientId) {
      dispatch(notify({ msg: 'Please enter patient id', sev: 'warning' }));
      return;
    }

    await bookPatientAppointment({
      id: appointmentId,
      patientId: Number(record.patientId),
      defaultService: record?.defaultService ? Number(record.defaultService) : null,
      defaultPractitioner: record?.defaultPractitioner ? Number(record.defaultPractitioner) : null,
      reason: record?.reason || null,
      note: record?.note || null,
      status: 'BOOKED'
    }).unwrap();

    dispatch(notify({ msg: 'Appointment booked successfully', sev: 'success' }));
    await Promise.resolve(onBooked?.());
    handleClose();
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Book Appointment"
      size="80vw"
      bodyheight="80vh"
      steps={[
        {
          title: 'Select Patient',
          disabledNext: !record?.patientId
        },
        {
          title: 'Visit Details'
        }
      ]}
      content={activeStep => (
        <Form fluid>
          {activeStep === 0 ? (
            <div>
              <Panel>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px' }}>
                  <div style={{ flex: 1 }}>
                    <MyButton
                      appearance="ghost"
                      onClick={() => {
                        setShowPatientSearch(true);
                      }}
                      prefixIcon={() => <FontAwesomeIcon icon={faUser} />}
                      style={{ width: '100%' }}
                    >
                      {selectedPatient ? 'Change Patient' : 'Select Patient'}
                    </MyButton>
                  </div>
                  <div style={{ flex: 1 }}>
                    <MyButton
                      appearance="ghost"
                      onClick={() => {
                        setShowPatientSearch(false);
                        setQuickPatientModalOpen(true);
                      }}
                      prefixIcon={() => <FontAwesomeIcon icon={faBolt} />}
                      style={{ width: '100%' }}
                    >
                      Quick Patient
                    </MyButton>
                    <QuickPatient
                      open={quickPatientModalOpen}
                      setOpen={() => setQuickPatientModalOpen(false)}
                      setPatient={(patient: any) => {
                        setSelectedPatient(patient);
                        setRecord((prev: any) => ({
                          ...prev,
                          patientId: Number(patient?.id ?? patient?.key ?? null)
                        }));
                      }}
                    />
                  </div>
                </div>
              </Panel>

              {showPatientSearch && (
                <div
                  style={{
                    marginBottom: 10,
                    border: '1px solid #eef2f6',
                    borderRadius: 8,
                    padding: 10
                  }}
                >
                  <SearchPatientCriteria
                    record={patientSearchRecord}
                    setRecord={setPatientSearchRecord}
                    onSearchClick={() => setPatientSearchValue(String(patientSearchRecord?.patientName ?? '').trim())}
                    searchMarginTop={0}
                  />
                  <div style={{ marginTop: 10, maxHeight: 200, overflowY: 'auto' }}>
                    {isFetchingPatients ? (
                      <div style={{ padding: 8 }}>Searching patients...</div>
                    ) : patientSearchResult.length > 0 ? (
                      patientSearchResult.map((p: any) => (
                        <div key={p?.id} style={{ marginBottom: 8 }}>
                          <PatientCardWithPicture
                            patient={p}
                            arrowDirection="right"
                            onClick={(patient: any) => {
                              setSelectedPatient(patient);
                              setRecord((prev: any) => ({
                                ...prev,
                                patientId: Number(patient?.id ?? patient?.key ?? null)
                              }));
                              setShowPatientSearch(false);
                            }}
                          />
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: 8, color: '#6b7280' }}>No patients found</div>
                    )}
                  </div>
                </div>
              )}

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
                              ? [
                                  selectedPatient?.firstName,
                                  selectedPatient?.secondName,
                                  selectedPatient?.thirdName,
                                  selectedPatient?.lastName
                                ]
                                  .filter(Boolean)
                                  .join(' ')
                              : 'N/A'}
                          </p>
                          <p style={{ fontSize: 12, color: '#A1A9B8', fontWeight: 600, margin: '4px 0' }}>
                            <FontAwesomeIcon icon={faUser} />
                            {` ${selectedPatient?.sexAtBirth || selectedPatient?.genderLkey || 'N/A'}`}
                          </p>
                          <p style={{ fontSize: 12, color: '#A1A9B8', margin: 0 }}>
                            {selectedPatient?.medicalRecordNumber ? `#${selectedPatient.medicalRecordNumber}` : ''}
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
              <SectionContainer
                title="Department Details"
                content={
                  <Panel bordered style={{ padding: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <MyInput fieldType="text" fieldName="facility" fieldLabel="Facility" record={appointmentDetailsRecord} width="100%" disabled />
                      <MyInput fieldType="text" fieldName="department" fieldLabel="Department" record={appointmentDetailsRecord} width="100%" disabled />
                      <MyInput fieldType="text" fieldName="status" fieldLabel="status" record={appointmentDetailsRecord} width="100%" disabled />
                      <MyInput fieldType="text" fieldName="resourceType" fieldLabel="Resource Type" record={appointmentDetailsRecord} width="100%" disabled />
                      <MyInput fieldType="text" fieldName="resourceName" fieldLabel="Resource Name" record={appointmentDetailsRecord} width="100%" disabled />
                      <MyInput fieldType="text" fieldName="bookingMode" fieldLabel="Booking Mode" record={appointmentDetailsRecord} width="100%" disabled />
                      <MyInput fieldType="text" fieldName="startDateTime" fieldLabel="Start Datetime" record={appointmentDetailsRecord} width="100%" disabled />
                      <MyInput fieldType="text" fieldName="endDateTime" fieldLabel="End Datetime" record={appointmentDetailsRecord} width="100%" disabled />
                    </div>
                  </Panel>
                }
              />

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
                        />
                        <MyInput
                          fieldType="textarea"
                          fieldName="reason"
                          fieldLabel="Reason"
                          record={record}
                          setRecord={setRecord}
                          width="100%"
                          rows={2}
                        />
                        <MyInput
                          fieldType="textarea"
                          fieldName="note"
                          fieldLabel="Note"
                          record={record}
                          setRecord={setRecord}
                          width="100%"
                          rows={2}
                        />
                      </div>
                    </Panel>
                  }
                />

                <SectionContainer
                  title="Selected Free Slot"
                  content={
                    <Panel bordered style={{ padding: 10, background: '#f8f4ea' }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr auto',
                          alignItems: 'center',
                          gap: 8
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 600, color: '#4b5563' }}>
                            {selectedSlotDisplay.timeRange}
                          </div>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>Limited capacity</div>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 110 }}>
                          <div style={{ fontSize: 12, marginBottom: 4 }}>⚖ {selectedSlotDisplay.capacityText}</div>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginBottom: 4 }}>
                            {[...Array(7)].map((_, idx) => (
                              <span
                                key={`slot-dot-top-${idx}`}
                                style={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: 7,
                                  display: 'inline-block',
                                  backgroundColor: idx < 4 ? '#8ea6d1' : '#d1d5db'
                                }}
                              />
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            {[...Array(7)].map((_, idx) => (
                              <span
                                key={`slot-dot-bottom-${idx}`}
                                style={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: 7,
                                  display: 'inline-block',
                                  backgroundColor: idx < 2 ? '#76b394' : '#d1d5db'
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </Panel>
                  }
                />
              </div>
            </div>
          )}
        </Form>
      )}
      actionButtonLabel={isLoading ? 'Booking...' : 'Confirm'}
      actionButtonFunction={handleConfirmBooking}
      isDisabledActionBtn={isLoading}
      handleCancelFunction={handleClose}
      cancelButtonLabel="Cancel"
    />
  );
};

export default BookPatient;
