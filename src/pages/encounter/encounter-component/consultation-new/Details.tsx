
import React, { useState, useEffect } from 'react';
import Diagnosis from '../../../medical-component/diagnosis/DiagnosisAndFindings';
import MyInput from '@/components/MyInput';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import AdvancedModal from '@/components/AdvancedModal';
import MyButton from '@/components/MyButton/MyButton';
import { Form } from 'rsuite';
import { useSaveConsultationOrdersMutation } from '@/services/encounterService';
import { newApConsultationOrder } from '@/types/model-types-constructor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom, faPaperclip, faRobot } from '@fortawesome/free-solid-svg-icons';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useLazyGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { useLazyGetActivePractitionersBySubSpecialtyQuery } from '@/services/setup/practitioner/PractitionerService';
import { AttachmentUploadModal } from '@/components/AttachmentModals';
import clsx from 'clsx';
import SectionContainer from '@/components/SectionsoContainer';

import { useGetSpecialtyConsultationMutation } from '@/services/ai-services/clinicalRecommendationsService';
import { el } from 'date-fns/locale';

const Details = ({
  patient,
  encounter,
  consultationOrders,
  setConsultationOrder,
  open,
  setOpen,
  refetchCon,
  editing,
  edit
}) => {
  const dispatch = useAppDispatch();
  const [saveconsultationOrders] = useSaveConsultationOrdersMutation();

  const { data: consultantSpecialtyLovQueryResponse } =
    useGetLovValuesByCodeQuery('PRACT_SUB_SPECIALTY ');
  const { data: facilityListResponse } = useGetAllFacilitiesQuery(null);
  const [getDepartmentsByFacility, { data: departmentListResponse }] =
    useLazyGetActiveDepartmentByFacilityListQuery();
  const [getPractitionersBySpecialty, { data: practitionerListResponse }] =
    useLazyGetActivePractitionersBySubSpecialtyQuery();
  const { data: consultationMethodLovQueryResponse } = useGetLovValuesByCodeQuery('CONSULT_METHOD');
  const { data: consultationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('CONSULT_TYPE');
  const { data: orderPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');

  // Transform practitioner data to show firstName + lastName
  const practitionerList = (practitionerListResponse?.data ?? []).map(practitioner => ({
    ...practitioner,
    fullName: `${practitioner.firstName || ''} ${practitioner.lastName || ''}`.trim()
  }));

  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [localAiSummary, setLocalAiSummary] = useState<string | null>(null);
  const [specialtyName, setSpecialtyName] = useState<string | null>(null);

  // ✅ NEW: AI mutation
  const [
    getSpecialtyConsultation,
    { data: aiConsultationData, isLoading: aiLoading, error: aiError }
  ] = useGetSpecialtyConsultationMutation();

  // ✅ NEW: text to show in panel
  const aiSummary =
    localAiSummary ??
    (aiConsultationData as any)?.summary ??
    (aiConsultationData as any)?.Summary ??
    (aiConsultationData as any)?.object?.summary ??
    null;


  const handleOpenAttachmentModal = () => {
    setShowAttachmentModal(true);
  };

  const handleClear = async () => {
    setConsultationOrder({
      ...newApConsultationOrder,
      consultationMethodLkey: null,
      consultationTypeLkey: null,
      facilityKey: null,
      departmentKey: null,
      consultantSpecialtyLkey: null,
      preferredConsultantKey: null
    });
  };

  const validateRequiredFields = () => {
    const missingFields: string[] = [];

    if (!consultationOrders?.facilityKey) missingFields.push('Facility');
    if (!consultationOrders?.consultationMethodLkey) missingFields.push('Consultation Method');
    if (!consultationOrders?.consultationTypeLkey) missingFields.push('Consultation Type');
    if (!consultationOrders?.priorityLkey) missingFields.push('Priority Level');
    if (!consultationOrders?.consultationContent) missingFields.push('Question to Consultant');

    if (missingFields.length > 0) {
      const lines = missingFields.map(field => `• ${field}: is required`);
      dispatch(
        notify({
          msg: `Please fill the following required fields:\n${lines.join('\n')}`,
          sev: 'error'
        })
      );
      return false;
    }

    if (!consultationOrders?.departmentKey && !consultationOrders?.preferredConsultantKey) {
      dispatch(notify({ msg: 'Please select at least Department or Consultant', sev: 'error' }));
      return false;
    }

    if (
      consultationOrders?.consultantSpecialtyLkey &&
      !consultationOrders?.preferredConsultantKey
    ) {
      dispatch(
        notify({ msg: 'Please select a Consultant when Consultant Specialty is filled', sev: 'error' })
      );
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateRequiredFields()) return;

    try {
      await saveconsultationOrders({
        ...consultationOrders,
        patientKey: patient.key,
        visitKey: encounter.key,
        statusLkey: '164797574082125',
        createdBy: 'Admin'
      }).unwrap();

      dispatch(notify({ msg: 'saved  Successfully', sev: 'success' }));
      refetchCon()
        .then(() => {
          setOpen(false);
          handleClear();
        })
        .catch(error => {
          console.error('Refetch failed:', error);
        });
    } catch (error) {
      dispatch(notify('Save Failed'));
    }
  };

  // Load departments when facilityKey exists (for edit mode)
  useEffect(() => {
    if (consultationOrders?.facilityKey && open) {
      getDepartmentsByFacility({ facilityId: consultationOrders.facilityKey });
    }
  }, [consultationOrders?.facilityKey, open, getDepartmentsByFacility]);
  useEffect(() => {
    if (!open) {
      handleClear();
      setShowAiPanel(false);
      setLocalAiSummary(null);
    }
  }, [open]);


  // Load practitioners when consultantSpecialtyLkey exists (for edit mode)
  useEffect(() => {
    if (consultationOrders?.consultantSpecialtyLkey && open) {
      getPractitionersBySpecialty({
        specialty: consultationOrders.consultantSpecialtyLkey,
        page: 0,
        size: 100
      });
    }
  }, [consultationOrders?.consultantSpecialtyLkey, open, getPractitionersBySpecialty]);
  useEffect(() => {
    if (!specialtyName) return;

    const specialtyApi = specialtyName
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    setLocalAiSummary(null);
    getSpecialtyConsultation({
      request_id: `req-${patient?.key ?? ''}-${encounter?.key ?? ''}`,
      specialty: specialtyApi
    })
      .unwrap()
      .then((res: any) => {
        setLocalAiSummary(res?.summary ?? null);
      })
      .catch(() => {
        setLocalAiSummary(null);
      });
  }, [specialtyName, getSpecialtyConsultation, patient?.key, encounter?.key]);

  return (
    <>
      <AdvancedModal
        open={open}
        setOpen={setOpen}
        size="78vw"
        leftWidth="40%"
        rightWidth="60%"
        actionButtonFunction={handleSave}
        isDisabledActionBtn={edit}
        footerButtons={
          <div style={{ display: 'flex', flexDirection: 'row', gap: '5px' }}>
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
              disabled={!consultationOrders?.key}
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
                title={'Choose Consultant'}
                content={
                  <div className="consultion-details-modal-handle-position">
                    <MyInput
                      width={'12vw'}
                      disabled={editing}
                      fieldType="select"
                      fieldLabel="Facility"
                      selectData={Array.isArray(facilityListResponse) ? facilityListResponse : []}
                      selectDataLabel="name"
                      selectDataValue="id"
                      fieldName={'facilityKey'}
                      record={{
                        ...consultationOrders,
                        facilityKey: consultationOrders?.facilityKey
                          ? Number(consultationOrders.facilityKey)
                          : undefined
                      }}
                      setRecord={value => {
                        setConsultationOrder({ ...value, departmentKey: null });
                        if (value.facilityKey) {
                          getDepartmentsByFacility({ facilityId: value.facilityKey });
                        }
                      }}
                      required
                    />

                    <MyInput
                      width={'12vw'}
                      disabled={editing || !consultationOrders?.facilityKey}
                      fieldType="select"
                      fieldLabel="Department"
                      selectData={Array.isArray(departmentListResponse) ? departmentListResponse : []}
                      selectDataLabel="name"
                      selectDataValue="id"
                      fieldName={'departmentKey'}
                      record={{
                        ...consultationOrders,
                        departmentKey: consultationOrders?.departmentKey
                          ? Number(consultationOrders.departmentKey)
                          : undefined
                      }}
                      setRecord={setConsultationOrder}
                    />

                    <div className="consultant-specialty-ai">
                      <MyInput
                        disabled={editing}
                        width={'12vw'}
                        fieldType="select"
                        fieldLabel="Consultant Specialty"
                        selectData={consultantSpecialtyLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'consultantSpecialtyLkey'}
                        record={consultationOrders}

                        setRecord={value => {
                          setConsultationOrder({ ...value, preferredConsultantKey: null });

                          if (value.consultantSpecialtyLkey) {
                            getPractitionersBySpecialty({
                              specialty: value.consultantSpecialtyLkey,
                              page: 0,
                              size: 100
                            });

                            const selected = (consultantSpecialtyLovQueryResponse?.object ?? []).find(
                              (x: any) => String(x.key) === String(value.consultantSpecialtyLkey)
                            );

                            const specialtyDisplay = String(selected?.lovDisplayVale ?? '').trim();
                            if (!specialtyDisplay) return;

                            setSpecialtyName(specialtyDisplay);
                            setShowAiPanel(true);
                          } else {
                            setSpecialtyName(null);
                            setShowAiPanel(false);
                            setLocalAiSummary(null);
                          }
                        }}


                      />

                      <button
                        type="button"
                        className="ai-icon-btn"
                        disabled={editing}
                        title="AI Assistant"
                        onClick={() => {
                          if (!consultationOrders?.consultantSpecialtyLkey) {
                            dispatch(
                              notify({
                                msg: 'Please select Consultant Specialty first.',
                                sev: 'info'
                              })
                            );
                            return;
                          }

                          if (!aiSummary) {
                            const selected = (consultantSpecialtyLovQueryResponse?.object ?? []).find(
                              (x: any) => String(x.key) === String(consultationOrders.consultantSpecialtyLkey)
                            );

                            const specialtyDisplay = String(selected?.lovDisplayVale ?? '').trim();
                            if (!specialtyDisplay) {
                              dispatch(
                                notify({
                                  msg: 'Specialty name not found. Please re-select Consultant Specialty.',
                                  sev: 'info'
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
                      disabled={editing || !consultationOrders?.consultantSpecialtyLkey}
                      fieldType="select"
                      fieldLabel="Consultant"
                      fieldName={'preferredConsultantKey'}
                      selectData={practitionerList}
                      selectDataLabel="fullName"
                      selectDataValue="id"
                      record={{
                        ...consultationOrders,
                        preferredConsultantKey: consultationOrders?.preferredConsultantKey
                          ? Number(consultationOrders.preferredConsultantKey)
                          : undefined
                      }}
                      setRecord={setConsultationOrder}
                    />
                  </div>
                }
              />

              <SectionContainer
                title={'Details'}
                content={
                  <div className="consultion-details-modal-handle-position">
                    <MyInput
                      width={'12vw'}
                      disabled={editing}
                      fieldType="select"
                      fieldLabel="Consultation Method"
                      selectData={consultationMethodLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      fieldName={'consultationMethodLkey'}
                      record={consultationOrders}
                      setRecord={setConsultationOrder}
                      searchable={false}
                      required
                    />
                    <MyInput
                      width={'12vw'}
                      disabled={editing}
                      fieldType="select"
                      fieldLabel="Consultation Type"
                      selectData={consultationTypeLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      fieldName={'consultationTypeLkey'}
                      record={consultationOrders}
                      setRecord={setConsultationOrder}
                      searchable={false}
                      required
                    />
                    <MyInput
                      width={'12vw'}
                      disabled={editing}
                      fieldType="select"
                      fieldLabel="Priority Level"
                      fieldName="priorityLkey"
                      selectData={orderPriorityLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={consultationOrders}
                      setRecord={setConsultationOrder}
                      required
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
                      disabled={editing}
                      fieldName="consultationContent"
                      rows={6}
                      fieldType="textarea"
                      record={consultationOrders}
                      setRecord={setConsultationOrder}
                      required
                    />
                  </div>
                }
              />

              <SectionContainer
                title={'Notes & Documentation'}
                content={
                  <div className="text-area-positions-detail-consultion">
                    <MyInput
                      width={'12vw'}
                      disabled={editing}
                      fieldName="notes"
                      rows={6}
                      fieldType="textarea"
                      record={consultationOrders}
                      setRecord={setConsultationOrder}
                    />
                    <MyInput
                      width={'12vw'}
                      disabled={editing}
                      fieldName="extra documentation"
                      rows={6}
                      fieldType="textarea"
                      record={consultationOrders}
                      setRecord={setConsultationOrder}
                    />
                    <MyInput
                      width={'12vw'}
                      disabled={editing}
                      fieldType="text"
                      fieldLabel="Approval Number"
                      fieldName="approvalNumber"
                      record={consultationOrders}
                      setRecord={setConsultationOrder}
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

            {showAiPanel && (
              <div className="ai-panel-center">
                <div className="ai-panel">
                  <div className="ai-panel-header">Specialty Recommendations</div>

                  <div className="ai-panel-body">
                    {aiLoading && (
                      <div className="ai-spinner-container">
                        <div className="ai-spinner" />
                      </div>
                    )}

                    {!aiLoading && !aiError && (
                      <div style={{ whiteSpace: 'pre-line' }}>
                        {aiSummary ?? 'Suggestions will appear here'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        }
      />

      <AttachmentUploadModal
        isOpen={showAttachmentModal}
        setIsOpen={setShowAttachmentModal}
        encounterId={encounter?.id || encounter?.key}
        refetchData={() => { }}
        source="CONSULTATION_ORDER_ATTACHMENT"
        sourceId={consultationOrders?.key ? Number(consultationOrders.key) : 0}
      />
    </>
  );
};

export default Details;
