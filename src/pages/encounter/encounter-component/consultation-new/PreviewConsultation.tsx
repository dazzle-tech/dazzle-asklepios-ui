import React, { useEffect, useState } from 'react';
import { Panel, Form, RadioGroup, Radio } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useLazyGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { useLazyGetSpecialistPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetSpecialtyConsultationMutation } from '@/services/ai-services/clinicalRecommendationsService';

import './styles.less';

interface PreviewConsultationProps {
  consultation: any;
  patient?: any;
  encounter?: any;
  onClose?: () => void;
}

const PreviewConsultation: React.FC<PreviewConsultationProps> = ({
  consultation,
  patient,
  encounter,
  onClose
}) => {
  const [formData, setFormData] = useState<any>(consultation || {});
  const [allPractitioners, setAllPractitioners] = useState<any[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [localAiSummary, setLocalAiSummary] = useState<string | null>(null);
  const [specialtyName, setSpecialtyName] = useState<string | null>(null);

  const { data: consultantSpecialtyLovQueryResponse } =
    useGetLovValuesByCodeQuery('PRACT_SUB_SPECIALTY');
  const { data: facilityListResponse } = useGetAllFacilitiesQuery(null);
  const [getDepartmentsByFacility, { data: departmentListResponse }] =
    useLazyGetActiveDepartmentByFacilityListQuery();
  const { data: consultationMethodLovQueryResponse } = useGetLovValuesByCodeQuery('CONSULT_METHOD');
  const consultationType = useEnumOptions('ConsultationType');
  const consultationLevel = useEnumOptions('ConsultationLevel');

  const [triggerGetSpecialistPractitioners, practitionersResult] =
    useLazyGetSpecialistPractitionersQuery();


    const [
      getSpecialtyConsultation,
      {
        isLoading: aiLoading,
        error: aiError
      }
    ] = useGetSpecialtyConsultationMutation();


  const aiSummary = localAiSummary;
  const destinationType = formData?.destinationType ?? 'DEPARTMENT';

  useEffect(() => {
    if (consultation) {
      setFormData(consultation);
    }
  }, [consultation]);

  useEffect(() => {
    if (formData?.toFacilityId) {
      getDepartmentsByFacility({ facilityId: formData.toFacilityId });
    }
  }, [formData?.toFacilityId, getDepartmentsByFacility]);

  useEffect(() => {
    if (!formData?.consultantSpeciality || !formData?.toFacilityId) return;

    triggerGetSpecialistPractitioners({
      facilityId: formData.toFacilityId,
      subSpecialty: formData.consultantSpeciality,
      page: 0,
      size: 100,
      sort: 'id,asc'
    }).catch(() => {
      setAllPractitioners([]);
    });
  }, [formData?.consultantSpeciality, formData?.toFacilityId]);

  useEffect(() => {
    if (!specialtyName || !formData?.consultantSpeciality) return;

    const specialtyApi = specialtyName.toLowerCase().replace(/\s+/g, ' ').trim();

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
  }, [
    specialtyName,
    getSpecialtyConsultation,
    patient?.key,
    encounter?.key,
    formData?.consultantSpeciality
  ]);

  useEffect(() => {
    if (practitionersResult?.data?.data?.content) {
      setAllPractitioners(practitionersResult.data.data.content);
    }
  }, [practitionersResult?.data?.data?.content]);

  if (!consultation) return null;

        // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
    <Panel
      bordered
      className="preview-consultation"
      header={
        <div className="preview-header">
          <span>Consultation Preview</span>
          {onClose && (
            <span className="close-btn" onClick={onClose}>
              ✕
            </span>
          )}
        </div>
      }
    >
      <Form fluid className="disabled-panel">
        <div className="main-details-consultion-page-container">
          <SectionContainer
            title={<Translate>Choose Consultant</Translate>}
            content={
              <div className="consultion-details-modal-handle-position">
                <MyInput
                  width={'12vw'}
                  disabled={true}
                  fieldType="select"
                  fieldLabel="Facility"
                  selectData={Array.isArray(facilityListResponse) ? facilityListResponse : []}
                  selectDataLabel="name"
                  selectDataValue="id"
                  fieldName={'toFacilityId'}
                  record={{
                    ...formData,
                    toFacilityId: formData?.toFacilityId ? Number(formData.toFacilityId) : undefined
                  }}
                  setRecord={() => {}}
                  required
                />

                <div className="destination-type-wrapper">
                  <label className="destination-type-label">
                    <Translate>Destination Type</Translate>
                    <span className="required-asterisk">*</span>
                  </label>
                  <RadioGroup
                    name="destinationType"
                    inline
                    value={destinationType}
                    onChange={() => {}}
                    disabled={true}
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
                    disabled={true}
                    fieldType="select"
                    fieldLabel="Department"
                    selectData={Array.isArray(departmentListResponse) ? departmentListResponse : []}
                    selectDataLabel="name"
                    selectDataValue="id"
                    fieldName={'toDepartmentId'}
                    record={{
                      ...formData,
                      toDepartmentId: formData?.toDepartmentId
                        ? Number(formData.toDepartmentId)
                        : undefined
                    }}
                    setRecord={() => {}}
                    required
                  />
                )}

                {destinationType === 'CONSULTANT' && (
                  <>
                    <div className="consultant-specialty-ai">
                      <MyInput
                        disabled={true}
                        width={'12vw'}
                        fieldType="select"
                        fieldLabel="Consultant Specialty"
                        selectData={
                          Array.isArray(consultantSpecialtyLovQueryResponse?.object)
                            ? consultantSpecialtyLovQueryResponse.object
                            : []
                        }
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'consultantSpeciality'}
                        record={formData}
                        setRecord={() => {}}
                        required
                                disableByField='isValid'

                      />

                      <button
                        type="button"
                        className="ai-icon-btn"
                        disabled={true}
                        title="AI Assistant"
                      >
                        <FontAwesomeIcon icon={faRobot} />
                        <span className="ai-badge">AI</span>
                      </button>
                    </div>

                    <MyInput
                      width={'12vw'}
                      disabled={true}
                      fieldType="select"
                      fieldLabel="Consultant"
                      fieldName={'practitionerId'}
                      selectData={Array.isArray(allPractitioners) ? allPractitioners : []}
                      selectDataLabel={['firstName', 'lastName']}
                      selectDataValue="id"
                      record={{
                        ...formData,
                        practitionerId: formData?.practitionerId
                          ? Number(formData.practitionerId)
                          : undefined
                      }}
                      setRecord={() => {}}
                      searchable
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
                  disabled={true}
                  fieldType="select"
                  fieldLabel="Consultation Method"
                  selectData={
                    Array.isArray(consultationMethodLovQueryResponse?.object)
                      ? consultationMethodLovQueryResponse.object
                      : []
                  }
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName={'consultationMethod'}
                  record={formData}
                  setRecord={() => {}}
                  required
                          disableByField='isValid'

                />
                <MyInput
                  width={'12vw'}
                  disabled={true}
                  fieldType="select"
                  fieldLabel="Consultation Type"
                  selectData={Array.isArray(consultationType) ? consultationType : []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  fieldName={'consultationType'}
                  record={formData}
                  setRecord={() => {}}
                  required
                          disableByField='isValid'

                />
                <MyInput
                  width={'12vw'}
                  disabled={true}
                  fieldType="select"
                  fieldLabel="Consultation Level"
                  fieldName="consultationLevel"
                  selectData={Array.isArray(consultationLevel) ? consultationLevel : []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={formData}
                  setRecord={() => {}}
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
                  disabled={true}
                  fieldName="consultationContent"
                  rows={6}
                  fieldType="textarea"
                  record={formData}
                  setRecord={() => {}}
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
                  disabled={true}
                  fieldName="notes"
                  rows={6}
                  fieldType="textarea"
                  record={formData}
                  setRecord={() => {}}
                />
                <MyInput
                  width={'12vw'}
                  disabled={true}
                  fieldName="extraDocument"
                  fieldLabel="Extra Documentation"
                  rows={6}
                  fieldType="textarea"
                  record={formData}
                  setRecord={() => {}}
                />
                <MyInput
                  width={'12vw'}
                  disabled={true}
                  fieldType="text"
                  fieldLabel="Approval Number"
                  fieldName="approvalNumber"
                  record={formData}
                  setRecord={() => {}}
                />
              </div>
            }
          />

          {showAiPanel && destinationType === 'CONSULTANT' && (
            <SectionContainer
              title={<Translate>Specialty Recommendations</Translate>}
              content={
                <div className="ai-panel-body">
                  {aiLoading && <div className="ai-spinner" />}
                  {!aiLoading && !aiError && (
                    <div className="ai-summary-text">
                      {aiSummary ?? 'Suggestions will appear here'}
                    </div>
                  )}
                </div>
              }
            />
          )}
        </div>
      </Form>
    </Panel>
    </div>
  );
};

export default PreviewConsultation;
