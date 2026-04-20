import React, { useEffect, useState } from 'react';
import { Form, RadioGroup, Radio } from 'rsuite';
import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom, faPaperclip, faRobot } from '@fortawesome/free-solid-svg-icons';

import AdvancedModal from '@/components/AdvancedModal';
import { AttachmentUploadModal } from '@/components/AttachmentModals';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import Diagnosis from '../../../medical-component/diagnosis/DiagnosisAndFindings';

import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import { useCreateMutation, useUpdateMutation } from '@/services/consultation/consultationService';
import { useLazyGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { useGetActiveFacilitiesQuery } from '@/services/security/facilityService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetSpecialtyConsultationMutation } from '@/services/ai-services/clinicalRecommendationsService';
import { newConsultation } from '@/types/model-types-constructor-new';
import { Consultation, ConsultationUpdatePayload } from '@/types/model-types-new';
import { useLazyGetSpecialistPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import { useEnumOptions } from '@/services/enumsApi';

const handleCrudError = (err, dispatch, keyMap: Record<string, string>) => {
  const data = err?.data ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  const FIELD_LABELS: Record<string, string> = {
    toFacilityId: 'facility',
    toDepartmentId: 'department',
    consultantSpeciality: 'consultant specialty',
    practitionerId: 'consultant',
    consultationMethod: 'consultation method',
    consultationType: 'consultation type',
    consultationLevel: 'priority level',
    consultationContent: 'question to consultant',
    destinationType: 'destination type'
  };

  const normalizeMsg = (msg: string) => {
    const m = (msg || '').toLowerCase();
    if (m.includes('must not be null')) return 'is required';
    if (m.includes('must not be blank')) return 'must not be blank';
    if (m.includes('size must be between')) return 'length is out of range';
    return msg || 'invalid value';
  };

  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const lines = data.fieldErrors.map((fe: any) => {
      const rawField = String(fe.field ?? '');
      const fieldLabel = FIELD_LABELS[rawField] ?? rawField;
      return `• ${fieldLabel}: ${normalizeMsg(fe.message)}`;
    });

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${lines.join('\n')}` + suffix,
        sev: 'warning'
      })
    );
    return;
  }

  const messageProp: string = data?.message || '';

  if (
    messageProp.includes('ConstraintViolationImpl') ||
    messageProp.includes('Validation failed')
  ) {
    const violations: string[] = [];
    const pattern = /propertyPath=(\w+).*?interpolatedMessage='([^']+)'/g;
    let match;

    while ((match = pattern.exec(messageProp)) !== null) {
      const rawField = match[1];
      const fieldLabel = FIELD_LABELS[rawField] ?? rawField;
      const message = match[2];

      const normalized = message.includes('must not be null')
        ? 'is required'
        : message.includes('must not be blank')
        ? 'must not be blank'
        : message;

      violations.push(`• ${fieldLabel}: ${normalized}`);
    }

    if (violations.length > 0) {
      dispatch(
        notify({
          msg: `Please fix the following fields:\n${violations.join('\n')}` + suffix,
          sev: 'warning'
        })
      );
      return;
    }
  }

  if (err?.status === 400 || data?.status === 400) {
    const message = messageProp.toLowerCase();

    for (const [fieldKey, fieldLabel] of Object.entries(FIELD_LABELS)) {
      if (
        message.includes(fieldKey.toLowerCase()) &&
        (message.includes('required') ||
          message.includes('must not be null') ||
          message.includes('must not be blank') ||
          message.includes('cannot be null'))
      ) {
        dispatch(
          notify({
            msg: `${fieldLabel} is required` + suffix,
            sev: 'warning'
          })
        );
        return;
      }
    }
  }

  if (typeof messageProp === 'string' && messageProp.includes('Please fix the following fields')) {
    const priorityOrder = [
      'facility',
      'department',
      'consultant specialty',
      'consultant',
      'consultation method',
      'consultation type',
      'priority level',
      'question to consultant'
    ];

    const items = messageProp
      .split('•')
      .map(x => x.trim())
      .filter(Boolean);

    const normalizedItems = items.map(item => {
      let result = item;
      Object.entries(FIELD_LABELS).forEach(([key, label]) => {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        result = result.replace(regex, label);
      });
      return result;
    });

    normalizedItems.sort((a, b) => {
      const ai = priorityOrder.findIndex(p => a.toLowerCase().startsWith(p));
      const bi = priorityOrder.findIndex(p => b.toLowerCase().startsWith(p));
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    dispatch(
      notify({
        msg: `Please fix the following fields:\n• ${normalizedItems.join('\n• ')}` + suffix,
        sev: 'warning'
      })
    );
    return;
  }

  const errorKey = messageProp.startsWith('error.') ? messageProp.substring(6) : data?.errorKey;

  const humanMsg =
    (errorKey && keyMap[errorKey]) ||
    data?.detail ||
    data?.title ||
    data?.message ||
    'Unexpected error';

  dispatch(notify({ msg: humanMsg + suffix, sev: 'warning' }));
};

const CONSULTATION_ERROR_MAP: Record<string, string> = {
  'payload.required': 'Consultation payload is required.',
  'patient.invalid': 'Invalid patient reference.',
  'encounter.invalid': 'Invalid encounter reference.',
  duplicate: 'Consultation already exists.',
  'db.constraint': 'Database constraint violation.',
  notfound: 'Consultation not found.',
  'facility.required': 'Facility is required.',
  'department.required': 'Department is required when Destination Type is DEPARTMENT.',
  'consultant.required':
    'Consultant Specialty and Consultant are required when Destination Type is CONSULTANT.',
  'method.required': 'Consultation Method is required.',
  'type.required': 'Consultation Type is required.',
  'level.required': 'Priority Level is required.',
  'content.required': 'Question to Consultant is required.'
};

const Details = ({
  patient,
  encounter,
  consultationOrders,
  open,
  setOpen,
  refetchCon,
  editing,
  edit
}) => {
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const selectedDepartment = authSlice.selectedDepartment;
  const [formData, setFormData] = useState<Consultation>({
    ...newConsultation,
    fromFacilityId: selectedDepartment.facilityId,
    fromDepartmentId: selectedDepartment.departmentId
  });
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [localAiSummary, setLocalAiSummary] = useState<string | null>(null);
  const [specialtyName, setSpecialtyName] = useState<string | null>(null);

  const [practitionerPage, setPractitionerPage] = useState(0);
  const pageSize = 5;
  const [allPractitioners, setAllPractitioners] = useState<[]>([]);

  const { data: consultantSpecialtyLovQueryResponse } =
    useGetLovValuesByCodeQuery('PRACT_SUB_SPECIALTY');
  const { data: facilityListResponse } = useGetActiveFacilitiesQuery(null);
  const [getDepartmentsByFacility, { data: departmentListResponse }] =
    useLazyGetActiveDepartmentByFacilityListQuery();
  const { data: consultationMethodLovQueryResponse } = useGetLovValuesByCodeQuery('CONSULT_METHOD');
  const { data: consultationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('CONSULT_TYPE');
  const consultationLevel = useEnumOptions('ConsultationLevel');

  const [createConsultation] = useCreateMutation();
  const [updateConsultation] = useUpdateMutation();

  const [
    getSpecialtyConsultation,
    { data: aiConsultationData, isLoading: aiLoading, error: aiError }
  ] = useGetSpecialtyConsultationMutation();

  const [triggerGetSpecialistPractitioners, practitionersResult] =
    useLazyGetSpecialistPractitionersQuery();

  const aiSummary = localAiSummary;

  const destinationType = formData?.destinationType ?? 'DEPARTMENT';

  const hasPractitioners = practitionersResult?.data?.data?.totalElements
    ? practitionersResult.data.data.totalElements > allPractitioners.length
    : false;
  console.log('practitionersResult====>', practitionersResult);
  useEffect(() => {
    if (!open) return;

    if (consultationOrders?.id) {
      setFormData({
        ...consultationOrders,
        patientId: patient?.id,
        encounterId: encounter?.id
      });
    } else {
      setFormData({
        ...newConsultation,
        patientId: patient?.id,
        encounterId: encounter?.id,
        destinationType: 'DEPARTMENT'
      });
      setAllPractitioners([]);
      setPractitionerPage(0);
    }
  }, [open, consultationOrders, patient?.id, encounter?.id]);

  useEffect(() => {
    if (!open) {
      handleClear();
      setShowAiPanel(false);
      setLocalAiSummary(null);
      setSpecialtyName(null);
    }
  }, [open]);

  useEffect(() => {
    if (formData?.toFacilityId && open) {
      getDepartmentsByFacility({ facilityId: formData.toFacilityId });
    }
  }, [formData?.toFacilityId, open, getDepartmentsByFacility]);

  useEffect(() => {
    if (!specialtyName) return;

    const specialtyApi = specialtyName.toLowerCase().replace(/\s+/g, ' ').trim();

    setLocalAiSummary(null);
    getSpecialtyConsultation({
      request_id: `req-${patient?.id ?? ''}-${encounter?.id ?? ''}`,
      specialty: specialtyApi
    })
      .unwrap()
      .then(res => {
        setLocalAiSummary(res?.summary ?? null);
      })
      .catch(error => {
        setLocalAiSummary(null);
      });
  }, [specialtyName, getSpecialtyConsultation, patient?.id, encounter?.id, open]);

  useEffect(() => {
    setShowAiPanel(false);
    setLocalAiSummary(null);
    setSpecialtyName(null);
  }, [formData?.id]);

  useEffect(() => {
    if (practitionersResult?.data?.data?.content) {
      const newPractitioners = practitionersResult.data.data.content;

      if (practitionerPage === 0) {
        setAllPractitioners(newPractitioners);
      } else {
        setAllPractitioners(prev => [...prev, ...newPractitioners]);
      }
    }
  }, [practitionersResult?.data?.data?.content, practitionerPage]);

  useEffect(() => {
    if (!open) return;

    if (
      formData?.destinationType === 'CONSULTANT' &&
      formData?.consultantSpeciality &&
      formData?.toFacilityId
    ) {
      triggerGetSpecialistPractitioners({
        facilityId: formData.toFacilityId,
        subSpecialty: formData.consultantSpeciality,
        page: 0,
        size: pageSize,
        sort: 'id,asc'
      });
    }
  }, [open, formData?.destinationType, formData?.consultantSpeciality, formData?.toFacilityId]);

  const handleClear = () => {
    setFormData({
      ...newConsultation,
      patientId: patient?.id,
      encounterId: encounter?.id,
      destinationType: 'DEPARTMENT',
      toFacilityId: null,
      toDepartmentId: null,
      consultantSpeciality: null,
      practitionerId: null
    });
    setAllPractitioners([]);
    setPractitionerPage(0);
  };

  const handleSave = async () => {
    try {
      if (formData.id) {
        const updatePayload: ConsultationUpdatePayload = {
          id: formData.id,
          destinationType: formData.destinationType,
          toFacilityId: formData.toFacilityId,
          toDepartmentId: formData.toDepartmentId,
          consultantSpeciality: formData.consultantSpeciality,
          practitionerId: formData.practitionerId,
          consultationMethod: formData.consultationMethod,
          consultationType: formData.consultationType,
          consultationLevel: formData.consultationLevel,
          consultationContent: formData.consultationContent,
          notes: formData.notes,
          extraDocument: formData.extraDocument,
          approvalNumber: formData.approvalNumber
        };
        await updateConsultation(updatePayload).unwrap();
        dispatch(notify({ msg: 'Consultation updated successfully', sev: 'success' }));
      } else {
        await createConsultation({
          ...formData,
          status: 'REQUESTED',
          fromFacilityId: selectedDepartment.facilityId,
          fromDepartmentId: selectedDepartment.departmentId
        }).unwrap();
        dispatch(notify({ msg: 'Consultation created successfully', sev: 'success' }));
      }

      setOpen(false);
      handleClear();
    } catch (err) {
      handleCrudError(err, dispatch, CONSULTATION_ERROR_MAP);
      return;
    }

    refetchCon?.();
  };

  const handleOpenAttachmentModal = () => {
    if (!formData?.id) return;
    setShowAttachmentModal(true);
  };

  const handleDestinationTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      destinationType: value,
      toDepartmentId: value === 'DEPARTMENT' ? prev.toDepartmentId : null,
      consultantSpeciality: value === 'CONSULTANT' ? prev.consultantSpeciality : null,
      practitionerId: value === 'CONSULTANT' ? prev.practitionerId : null
    }));

    if (value === 'DEPARTMENT') {
      setShowAiPanel(false);
      setLocalAiSummary(null);
      setSpecialtyName(null);
      setAllPractitioners([]);
      setPractitionerPage(0);
    }
  };

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <AdvancedModal
        open={open}
        setOpen={setOpen}
        size="78vw"
        leftWidth="40%"
        rightWidth="60%"
        actionButtonFunction={handleSave}
        isDisabledActionBtn={edit}
        footerButtons={
          <div className="flex-row-5">
            <MyButton
              disabled={edit}
              prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
              onClick={handleClear}
            >
              Clear
            </MyButton>
            <MyButton
              onClick={handleOpenAttachmentModal}
              prefixIcon={() => <FontAwesomeIcon icon={faPaperclip} />}
              disabled={!formData?.id}
            >
              Attachments
            </MyButton>
          </div>
        }
        rightTitle="Add Consultation"
        rightContent={
          <Form
            fluid
            className={clsx('', {
              'disabled-panel': edit
            })}
          >
            <div className="main-details-consultion-page-container">
              <SectionContainer
                title={<Translate>Choose Consultant</Translate>}
                content={
                  <div className="consultion-details-modal-handle-position">
                    <MyInput
                      width={'12vw'}
                      fieldType="select"
                      fieldLabel="Facility"
                      selectData={Array.isArray(facilityListResponse) ? facilityListResponse : []}
                      selectDataLabel="name"
                      selectDataValue="id"
                      fieldName={'toFacilityId'}
                      record={{
                        ...formData,
                        toFacilityId: formData?.toFacilityId ?? null
                      }}
                      setRecord={value => {
                        setFormData({
                          ...value,
                          toDepartmentId: null,
                          practitionerId: null
                        });
                        setAllPractitioners([]);
                        setPractitionerPage(0);

                        if (value.toFacilityId) {
                          getDepartmentsByFacility({ facilityId: value.toFacilityId });
                        }
                      }}
                      required
                    />

                    <div className="width-14">
                      <label className="destination-type">
                        <Translate>Destination Type</Translate>
                        <span className="color-red">*</span>
                      </label>
                      <RadioGroup
                        name="destinationType"
                        inline
                        value={destinationType}
                        onChange={handleDestinationTypeChange}
                      >
                        <Radio value="DEPARTMENT">
                          <Translate>Department</Translate>
                        </Radio>
                        <Radio value="CONSULTANT">
                          <Translate>Consultant</Translate>
                        </Radio>
                      </RadioGroup>
                    </div>

                    {destinationType === 'DEPARTMENT' && (
                      <MyInput
                        width={'12vw'}
                        disabled={!formData?.toFacilityId}
                        fieldType="select"
                        fieldLabel="Department"
                        selectData={
                          Array.isArray(departmentListResponse) ? departmentListResponse : []
                        }
                        selectDataLabel="name"
                        selectDataValue="id"
                        fieldName={'toDepartmentId'}
                        record={{
                          ...formData,
                          toDepartmentId: formData?.toDepartmentId
                            ? formData.toDepartmentId
                            : undefined
                        }}
                        setRecord={setFormData}
                        required
                      />
                    )}

                    {destinationType === 'CONSULTANT' && (
                      <>
                        <div className="consultant-specialty-ai">
                          <MyInput
                            disabled={!formData?.toFacilityId}
                            width={'12vw'}
                            fieldType="select"
                            fieldLabel="Consultant Specialty"
                            selectData={consultantSpecialtyLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName={'consultantSpeciality'}
                            record={formData}
                            setRecord={value => {
                              setLocalAiSummary(null);
                              setShowAiPanel(false);

                              setFormData({ ...value, practitionerId: null });
                              setAllPractitioners([]);
                              setPractitionerPage(0);

                              if (value.consultantSpeciality && formData?.toFacilityId) {
                                triggerGetSpecialistPractitioners({
                                  facilityId: formData.toFacilityId,
                                  subSpecialty: value.consultantSpeciality,
                                  page: 0,
                                  size: pageSize,
                                  sort: 'id,asc'
                                }).catch(err => {
                                  handleCrudError(err, dispatch, CONSULTATION_ERROR_MAP);
                                });

                                const selected = (
                                  consultantSpecialtyLovQueryResponse?.object ?? []
                                ).find(x => String(x.key) === String(value.consultantSpeciality));

                                const specialtyDisplay = String(
                                  selected?.lovDisplayVale ?? ''
                                ).trim();

                                if (specialtyDisplay) {
                                  setSpecialtyName(specialtyDisplay);
                                  setShowAiPanel(true);
                                }
                              } else {
                                setSpecialtyName(null);
                                setShowAiPanel(false);
                                setLocalAiSummary(null);
                              }
                            }}
                            required
                          />

                          <button
                            type="button"
                            className="ai-icon-btn"
                            title="AI Assistant"
                            onClick={() => {
                              if (!formData?.consultantSpeciality) {
                                dispatch(
                                  notify({
                                    msg: 'Please select Consultant Specialty first.',
                                    sev: 'warning'
                                  })
                                );
                                return;
                              }

                              if (!aiSummary) {
                                const selected = (
                                  consultantSpecialtyLovQueryResponse?.object ?? []
                                ).find(
                                  x => String(x.key) === String(formData.consultantSpeciality)
                                );

                                const specialtyDisplay = String(
                                  selected?.lovDisplayVale ?? ''
                                ).trim();
                                if (!specialtyDisplay) {
                                  dispatch(
                                    notify({
                                      msg: 'Specialty name not found. Please re-select Consultant Specialty.',
                                      sev: 'warning'
                                    })
                                  );
                                  return;
                                }

                                setSpecialtyName(specialtyDisplay);
                                setShowAiPanel(true);
                                return;
                              }

                              setShowAiPanel(prev => !prev);
                            }}
                          >
                            <FontAwesomeIcon icon={faRobot} />
                            <span className="ai-badge">AI</span>
                          </button>
                        </div>

                        <MyInput
                          width={'12vw'}
                          disabled={!formData?.consultantSpeciality || !formData?.toFacilityId}
                          fieldType="selectPagination"
                          fieldLabel="Consultant"
                          fieldName={'practitionerId'}
                          selectData={allPractitioners}
                          selectDataLabel={['firstName', 'lastName']}
                          selectDataValue="id"
                          record={formData}
                          setRecord={setFormData}
                          loading={practitionersResult?.isFetching}
                          searchable
                          hasMore={hasPractitioners}
                          onFetchMore={() => {
                            if (!practitionersResult?.isFetching && hasPractitioners) {
                              const nextPage = practitionerPage + 1;
                              setPractitionerPage(nextPage);

                              triggerGetSpecialistPractitioners({
                                facilityId: formData.toFacilityId!,
                                subSpecialty: formData.consultantSpeciality!,
                                page: nextPage,
                                size: pageSize,
                                sort: 'id,asc'
                              }).catch(err => {
                                handleCrudError(err, dispatch, CONSULTATION_ERROR_MAP);
                              });
                            }
                          }}
                          required
                        />
                      </>
                    )}
                  </div>
                }
              />

              <SectionContainer
                title={<Translate>Details</Translate>}
                content={
                  <div className="consultion-details-modal-handle-position">
                    <MyInput
                      width={'12vw'}
                      fieldType="select"
                      fieldLabel="Consultation Method"
                      selectData={consultationMethodLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      fieldName={'consultationMethod'}
                      record={formData}
                      setRecord={setFormData}
                      searchable={false}
                      required
                    />
                    <MyInput
                      width={'12vw'}
                      fieldType="select"
                      fieldLabel="Consultation Type"
                      selectData={consultationTypeLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      fieldName={'consultationType'}
                      record={formData}
                      setRecord={setFormData}
                      searchable={false}
                      required
                    />
                    <MyInput
                      width={'12vw'}
                      fieldType="select"
                      fieldLabel="Consultation Level"
                      fieldName="consultationLevel"
                      selectData={consultationLevel ?? []}
                      selectDataLabel="label"
                      selectDataValue="value"
                      record={formData}
                      setRecord={setFormData}
                      required
                      searchable={false}
                    />
                  </div>
                }
              />

              <SectionContainer
                title={'Question to Consultant'}
                content={
                  <div className="text-area-positions-detail-consultion">
                    <MyInput
                      width={'35vw'}
                      fieldName="consultationContent"
                      rows={6}
                      fieldType="textarea"
                      record={formData}
                      setRecord={setFormData}
                      required
                    />
                  </div>
                }
              />

              <SectionContainer
                title={<Translate>Notes & Documentation</Translate>}
                content={
                  <div className="text-area-positions-detail-consultion">
                    <MyInput
                      width={'12vw'}
                      fieldName="notes"
                      rows={6}
                      fieldType="textarea"
                      record={formData}
                      setRecord={setFormData}
                    />
                    <MyInput
                      width={'12vw'}
                      fieldName="extraDocument"
                      fieldLabel="Extra Documentation"
                      rows={6}
                      fieldType="textarea"
                      record={formData}
                      setRecord={setFormData}
                    />
                    <MyInput
                      width={'12vw'}
                      fieldType="number"
                      fieldLabel="Approval Number"
                      fieldName="approvalNumber"
                      record={formData}
                      setRecord={setFormData}
                    />
                  </div>
                }
              />
            </div>
          </Form>
        }
        leftContent={
          <div className="left-panel-container">
            <Diagnosis patient={patient} encounter={encounter} />

            {showAiPanel && destinationType === 'CONSULTANT' && (
              <SectionContainer
                title={<Translate>Specialty Recommendations</Translate>}
                content={
                  <div className="ai-panel-body">
                    {aiLoading && (
                      <div className="ai-spinner-container">
                        <div className="ai-spinner" />
                      </div>
                    )}

                    {!aiLoading && !aiError && (
                      <div className="consultation-content-container">
                        {aiSummary ?? 'Suggestions will appear here'}
                      </div>
                    )}
                  </div>
                }
              />
            )}
          </div>
        }
      />

      <AttachmentUploadModal
        isOpen={showAttachmentModal}
        setIsOpen={setShowAttachmentModal}
        encounterId={encounter?.id || encounter?.key}
        refetchData={() => {}}
        source="CONSULTATION_ORDER_ATTACHMENT"
        sourceId={formData?.id ?? 0}
      />
    </div>
  );
};

export default Details;
