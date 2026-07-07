import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Avatar, Divider, Form, IconButton, Panel } from 'rsuite';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faUser, faXmark } from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import SectionContainer from '@/components/SectionsoContainer';
import QuickPatient from '@/pages/patient/facility-patient-list/QuickPatient';
import ProfileSidebar from '@/pages/patient/patient-profile/ProfileSidebar-new';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { extractErrorMessage } from '@/utils';
import { useEnumOptions } from '@/services/enumsApi';
import { useCreateAppointmentWaitingListMutation } from '@/services/appointment/appointmentWaitingList/appointmentWaitingListService';
import { useGetActiveFacilitiesQuery } from '@/services/security/facilityService';
import { useGetAppointablePractitionerByLoggedInFacilityQuery } from '@/services/setup/practitioner/PractitionerService';
import { useGetAppointableServicesByLoggedInFacilityQuery } from '@/services/setup/serviceService';
import type { AppointmentWaitingListCreateDTO } from '@/types/model-types-new';

type AddToWaitingListModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  facilityId?: number | string | null;
  departmentId?: number | null;
  departmentOptions?: any[];
  onCreated?: (created: { departmentId: number }) => void | Promise<void>;
};

const emptyForm = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    patientId: null as number | null,
    departmentId: null as number | null,
    serviceId: null as number | null,
    practitionerId: null as number | null,
    priority: null as string | null,
    preferredDate: today as Date | null,
    expectedDurationMinutes: null as number | null,
    reason: '',
    notes: '',
  };
};

const PATIENT_SIDEBAR_WIDTH = 320;
const PATIENT_SIDEBAR_Z_INDEX = 99999;
const WAITING_LIST_MODAL_CLASS = 'add-to-waiting-list-modal';

const buildPatientSidebarStyle = (): React.CSSProperties => {
  const dialog =
    (document.querySelector(`.rs-modal-dialog.${WAITING_LIST_MODAL_CLASS}`) as HTMLElement | null) ??
    (document.querySelector(`.${WAITING_LIST_MODAL_CLASS}`) as HTMLElement | null) ??
    (document.querySelector(`.rs-modal-wrapper .${WAITING_LIST_MODAL_CLASS}`) as HTMLElement | null);

  const base: React.CSSProperties = {
    position: 'fixed',
    width: PATIENT_SIDEBAR_WIDTH,
    zIndex: PATIENT_SIDEBAR_Z_INDEX,
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.18)',
    borderRadius: 10,
    overflow: 'hidden',
    background: 'var(--rs-bg-card, #fff)',
  };

  if (!dialog) {
    return {
      ...base,
      top: '8vh',
      left: 16,
      height: '84vh',
    };
  }

  const rect = dialog.getBoundingClientRect();
  const height = rect.height > 0 ? rect.height : window.innerHeight * 0.84;
  const top = rect.top > 0 ? rect.top : window.innerHeight * 0.08;

  let left = rect.left - PATIENT_SIDEBAR_WIDTH - 12;
  if (left < 8) {
    left = rect.right + 12;
  }
  if (left + PATIENT_SIDEBAR_WIDTH > window.innerWidth - 8) {
    left = Math.max(8, window.innerWidth - PATIENT_SIDEBAR_WIDTH - 16);
  }

  return {
    ...base,
    top,
    left,
    height,
  };
};

const AddToWaitingListModal = ({
  open,
  setOpen,
  facilityId,
  departmentId,
  departmentOptions = [],
  onCreated,
}: AddToWaitingListModalProps) => {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state: any) => state.ui.mode);
  const authSlice = useAppSelector((state: any) => state.auth);
  const priorityOptions = useEnumOptions('WaitingListPriority');

  const [record, setRecord] = useState(emptyForm);
  const [selectedFacility, setSelectedFacility] = useState<{ id: number | null }>({ id: null });
  const [formKey, setFormKey] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientAction, setPatientAction] = useState<'select' | 'quick'>('select');
  const [quickPatientModalOpen, setQuickPatientModalOpen] = useState(false);
  const [patientSidebarOpen, setPatientSidebarOpen] = useState(false);
  const [patientSidebarStyle, setPatientSidebarStyle] = useState<React.CSSProperties | null>(null);

  const [createWaitingList, { isLoading }] = useCreateAppointmentWaitingListMutation();

  const { data: activeFacilitiesResponse = [] } = useGetActiveFacilitiesQuery({});

  const resolvedFacilityId = useMemo(() => {
    const fromProp = Number(facilityId ?? 0);
    if (Number.isFinite(fromProp) && fromProp > 0) return fromProp;

    const authFacility =
      authSlice?.selectedDepartment?.facility ??
      authSlice?.selectedDepartment?.facilityId ??
      authSlice?.selectedFacility ??
      authSlice?.tenant?.selectedFacility;
    const id = authFacility?.id ?? authFacility?.facilityId ?? authFacility;
    const n = Number(id);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [facilityId, authSlice]);

  const effectiveDepartmentId = record.departmentId ?? departmentId ?? null;

  const { data: practitionersResponse } = useGetAppointablePractitionerByLoggedInFacilityQuery({
    page: 0,
    size: 200,
    sort: 'id,asc',
  });
  const { data: servicesResponse } = useGetAppointableServicesByLoggedInFacilityQuery({
    page: 0,
    size: 200,
    sort: 'id,asc',
  });

  const practitionerOptions = useMemo(
    () =>
      ((practitionersResponse as any)?.data ?? []).map((p: any) => ({
        id: p?.id,
        label: [p?.firstName, p?.lastName].filter(Boolean).join(' ') || p?.fullName || `Practitioner #${p?.id}`,
      })),
    [practitionersResponse]
  );

  const serviceOptions = useMemo(
    () =>
      ((servicesResponse as any)?.data ?? []).map((s: any) => ({
        id: s?.id,
        label: s?.name ?? s?.serviceName ?? `Service #${s?.id}`,
      })),
    [servicesResponse]
  );

  const waitingListStepBlocked = useMemo(() => {
    if (!resolvedFacilityId) return true;
    if (!record?.departmentId) return true;
    const duration = Number(record?.expectedDurationMinutes ?? 0);
    if (!Number.isFinite(duration) || duration <= 0) return true;
    return false;
  }, [resolvedFacilityId, record?.departmentId, record?.expectedDurationMinutes]);

  const patientChoiceButtonBase: React.CSSProperties = {
    width: '100%',
    height: 44,
    borderRadius: 10,
    fontWeight: 400,
    border: `1px solid ${mode === 'dark' ? 'var(--rs-border-primary)' : '#d6dde8'}`,
    backgroundColor: mode === 'dark' ? 'var(--rs-bg-card)' : '#ffffff',
    color: mode === 'dark' ? 'var(--rs-text-primary)' : 'var(--primary-blue)',
    transition:
      'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
    justifyContent: 'center',
  };

  const patientChoiceButtonActive: React.CSSProperties = {
    border: 'none',
    background: 'linear-gradient(180deg, var(--primary-blue) 0%, var(--primary-blue) 100%)',
    color: '#ffffff',
    boxShadow:
      mode === 'dark'
        ? '0 10px 24px rgba(37, 99, 235, 0.30)'
        : '0 10px 24px rgba(37, 99, 235, 0.20)',
  };

  const modalSteps = useMemo(
    () => [
      {
        title: 'Select Patient',
        disabledNext: !record?.patientId,
      },
      {
        title: 'Waiting List Details',
        disabledNext: waitingListStepBlocked,
      },
    ],
    [record?.patientId, waitingListStepBlocked]
  );

  const resetForm = useCallback(() => {
    setRecord({
      ...emptyForm(),
      departmentId: departmentId ?? null,
    });
    setFormKey(key => key + 1);
    setSelectedPatient(null);
    setPatientAction('select');
    setQuickPatientModalOpen(false);
    setPatientSidebarOpen(false);
  }, [departmentId]);

  const handleClearPreferredDate = () => {
    setRecord(prev => ({ ...prev, preferredDate: null }));
    setFormKey(key => key + 1);
  };

  useEffect(() => {
    if (!open) return;
    setRecord(prev => ({
      ...prev,
      departmentId: departmentId ?? prev.departmentId ?? null,
    }));
  }, [open, departmentId]);

  useEffect(() => {
    if (!open || resolvedFacilityId == null) return;
    setSelectedFacility({ id: resolvedFacilityId });
    const matched = (activeFacilitiesResponse as any[]).find(
      (f: any) => String(f?.id) === String(resolvedFacilityId)
    );
    if (matched) {
      setSelectedFacility({ id: Number(matched.id) });
    }
  }, [open, resolvedFacilityId, activeFacilitiesResponse]);

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient);
    setRecord(prev => ({
      ...prev,
      patientId: Number(patient?.id ?? patient?.key ?? null),
    }));
    setPatientAction('select');
    setPatientSidebarOpen(false);
    setQuickPatientModalOpen(false);
  };

  const openPatientSearchSidebar = () => {
    setPatientAction('select');
    setPatientSidebarStyle(buildPatientSidebarStyle());
    setPatientSidebarOpen(true);
  };

  useEffect(() => {
    if (!open || !patientSidebarOpen) return;

    const compute = () => {
      setPatientSidebarStyle(buildPatientSidebarStyle());
    };

    const timer = window.setTimeout(compute, 0);
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [open, patientSidebarOpen]);

  const handleSubmit = async () => {
    const patientId = Number(record?.patientId ?? 0);
    const facilityIdValue = Number(selectedFacility?.id ?? resolvedFacilityId ?? 0);
    const deptId = Number(effectiveDepartmentId ?? 0);
    const expectedDurationMinutes = Number(record.expectedDurationMinutes ?? 0);

    if (!Number.isFinite(patientId) || patientId <= 0) {
      dispatch(notify({ msg: 'Please select or create a patient.', sev: 'warning' }));
      return;
    }
    if (!Number.isFinite(facilityIdValue) || facilityIdValue <= 0) {
      dispatch(notify({ msg: 'Facility is required.', sev: 'warning' }));
      return;
    }
    if (!Number.isFinite(deptId) || deptId <= 0) {
      dispatch(notify({ msg: 'Please select a department.', sev: 'warning' }));
      return;
    }
    if (!Number.isFinite(expectedDurationMinutes) || expectedDurationMinutes <= 0) {
      dispatch(notify({ msg: 'Please enter expected duration in minutes.', sev: 'warning' }));
      return;
    }

    const body: AppointmentWaitingListCreateDTO = {
      patientId,
      facilityId: facilityIdValue,
      departmentId: deptId,
      expectedDurationMinutes,
    };

    const serviceId = Number(record.serviceId ?? 0);
    if (Number.isFinite(serviceId) && serviceId > 0) body.serviceId = serviceId;

    const practitionerId = Number(record.practitionerId ?? 0);
    if (Number.isFinite(practitionerId) && practitionerId > 0) body.practitionerId = practitionerId;

    if (record.priority) body.priority = record.priority;
    if (record.preferredDate) {
      body.preferredDate = moment(record.preferredDate).format('YYYY-MM-DD');
    }
    if (record.reason?.trim()) body.reason = record.reason.trim();
    if (record.notes?.trim()) body.notes = record.notes.trim();

    dispatch(showSystemLoader());
    try {
      await createWaitingList(body).unwrap();
      dispatch(notify({ msg: 'Patient added to waiting list.', sev: 'success' }));
      handleClose();
      await onCreated?.({ departmentId: deptId });
    } catch (error) {
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'Failed to add patient to waiting list',
          sev: 'error',
        })
      );
      throw error;
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const sidebarWindowHeight = useMemo(() => {
    const h = patientSidebarStyle?.height;
    if (typeof h === 'number' && h > 0) return Math.floor(h);
    return Math.floor(window.innerHeight * 0.84);
  }, [patientSidebarStyle?.height]);

  const patientSearchSidebar =
    open && patientSidebarOpen
      ? createPortal(
          <div
            className="book-patient-sidebar-overlay"
            style={patientSidebarStyle ?? buildPatientSidebarStyle()}
          >
            <ProfileSidebar
              expand
              setExpand={setPatientSidebarOpen}
              windowHeight={sidebarWindowHeight}
              setLocalPatient={handlePatientSelect}
              title={<Translate>Search Patient</Translate>}
              direction="right"
              showButton
            />
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {patientSearchSidebar}

      <MyModal
        open={open}
        setOpen={setOpen}
        title="Add to Waiting List"
        size="80vw"
        bodyheight="80vh"
        enforceFocus={false}
        customClassName={WAITING_LIST_MODAL_CLASS}
        initialStep={0}
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
                        onClick={openPatientSearchSidebar}
                        prefixIcon={() => <FontAwesomeIcon icon={faUser} />}
                        style={{
                          ...patientChoiceButtonBase,
                          ...(patientAction === 'select' ? patientChoiceButtonActive : {}),
                        }}
                      >
                        {selectedPatient ? 'Change Patient' : 'Select Patient'}
                      </MyButton>
                    </div>

                    <div style={{ flex: 1 }}>
                      <MyButton
                        appearance="subtle"
                        onClick={() => {
                          setPatientAction('quick');
                          setPatientSidebarOpen(false);
                          setQuickPatientModalOpen(true);
                        }}
                        prefixIcon={() => <FontAwesomeIcon icon={faBolt} />}
                        style={{
                          ...patientChoiceButtonBase,
                          ...(patientAction === 'quick' ? patientChoiceButtonActive : {}),
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
                                    selectedPatient?.lastName,
                                  ]
                                    .filter(Boolean)
                                    .join(' ')
                                    .trim() ||
                                    selectedPatient?.fullName ||
                                    selectedPatient?.name ||
                                    'N/A')
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
                            padding: 12,
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
                            <p style={{ margin: 0 }}>
                              {selectedPatient?.primaryMobileNumber || selectedPatient?.mobileNumber || '-'}
                            </p>
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
                  title="Appointment Details"
                  content={
                    <Panel bordered style={{ padding: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <MyInput
                          disabled
                          fieldType="select"
                          fieldName="id"
                          fieldLabel="Facility"
                          record={selectedFacility}
                          setRecord={setSelectedFacility}
                          selectData={activeFacilitiesResponse ?? []}
                          selectDataLabel="name"
                          selectDataValue="id"
                          width="100%"
                          searchable={false}
                          required
                        />

                        <MyInput
                          fieldType="select"
                          fieldName="departmentId"
                          fieldLabel="Department"
                          record={record}
                          setRecord={setRecord}
                          selectData={departmentOptions}
                          selectDataLabel="name"
                          selectDataValue="id"
                          width="100%"
                          searchable
                          required
                        />

                        <MyInput
                          fieldType="number"
                          fieldName="expectedDurationMinutes"
                          fieldLabel="Expected Duration (minutes)"
                          record={record}
                          setRecord={setRecord}
                          width="100%"
                          required
                        />

                        <MyInput
                          fieldType="select"
                          fieldName="serviceId"
                          fieldLabel="Service"
                          record={record}
                          setRecord={setRecord}
                          selectData={serviceOptions}
                          selectDataLabel="label"
                          selectDataValue="id"
                          width="100%"
                          searchable
                        />

                        <MyInput
                          fieldType="select"
                          fieldName="practitionerId"
                          fieldLabel="Practitioner"
                          record={record}
                          setRecord={setRecord}
                          selectData={practitionerOptions}
                          selectDataLabel="label"
                          selectDataValue="id"
                          width="100%"
                          searchable
                        />
                      </div>
                    </Panel>
                  }
                />

                <SectionContainer
                  title="Waiting Preferences"
                  content={
                    <Panel bordered style={{ padding: 12 }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 12,
                          alignItems: 'start',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <MyInput
                            fieldType="select"
                            fieldName="priority"
                            fieldLabel="Priority"
                            record={record}
                            setRecord={setRecord}
                            selectData={priorityOptions ?? []}
                            selectDataLabel="label"
                            selectDataValue="value"
                            width="100%"
                            searchable={false}
                          />
                        </div>

                        <div className="add-to-waiting-list-modal__preferred-date-cell">
                          <MyInput
                            key={`preferred-date-${formKey}`}
                            className="add-to-waiting-list-modal__preferred-date-input"
                            fieldType="date"
                            fieldName="preferredDate"
                            fieldLabel="Preferred Date"
                            record={record}
                            setRecord={setRecord}
                            width="100%"
                          />
                          {record.preferredDate ? (
                            <IconButton
                              circle
                              size="sm"
                              appearance="subtle"
                              className="add-to-waiting-list-modal__preferred-date-clear"
                              icon={<FontAwesomeIcon icon={faXmark} />}
                              onClick={handleClearPreferredDate}
                              title="Clear preferred date"
                              aria-label="Clear preferred date"
                            />
                          ) : null}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <MyInput
                            fieldType="textarea"
                            fieldName="reason"
                            fieldLabel="Reason"
                            record={record}
                            setRecord={setRecord}
                            width="100%"
                            rows={2}
                          />
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <MyInput
                            fieldType="textarea"
                            fieldName="notes"
                            fieldLabel="Notes"
                            record={record}
                            setRecord={setRecord}
                            width="100%"
                            rows={2}
                          />
                        </div>
                      </div>
                    </Panel>
                  }
                />
              </div>
            )}
          </Form>
        )}
        actionButtonLabel={isLoading ? 'Adding...' : 'Add to List'}
        actionButtonFunction={handleSubmit}
        isDisabledActionBtn={isLoading}
        actionButtonLoading={isLoading}
        handleCancelFunction={handleClose}
        cancelButtonLabel="Cancel"
      />
    </>
  );
};

export default AddToWaitingListModal;
