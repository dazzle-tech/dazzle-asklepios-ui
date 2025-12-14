import React, { useEffect } from 'react';
import { Panel, Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useLazyGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { useLazyGetActivePractitionersBySubSpecialtyQuery } from '@/services/setup/practitioner/PractitionerService';
import './styles.less';

interface PreviewConsultationProps {
  consultation: any;
  onClose?: () => void;
}

const PreviewConsultation: React.FC<PreviewConsultationProps> = ({
  consultation,
  onClose
}) => {
  // LOV Queries
  const { data: consultantSpecialtyLovQueryResponse } =
    useGetLovValuesByCodeQuery('PRACT_SUB_SPECIALTY ');
  const { data: facilityListResponse } = useGetAllFacilitiesQuery(null);
  const [getDepartmentsByFacility, { data: departmentListResponse }] = 
    useLazyGetActiveDepartmentByFacilityListQuery();
  const [getPractitionersBySpecialty, { data: practitionerListResponse }] = 
    useLazyGetActivePractitionersBySubSpecialtyQuery();
  const { data: consultationMethodLovQueryResponse } =
    useGetLovValuesByCodeQuery('CONSULT_METHOD');
  const { data: consultationTypeLovQueryResponse } =
    useGetLovValuesByCodeQuery('CONSULT_TYPE');
  const { data: orderPriorityLovQueryResponse } =
    useGetLovValuesByCodeQuery('ORDER_PRIORITY');

  // Transform practitioner data to show firstName + lastName
  const practitionerList = (practitionerListResponse?.data ?? []).map(practitioner => ({
    ...practitioner,
    fullName: `${practitioner.firstName || ''} ${practitioner.lastName || ''}`.trim()
  }));

  // Load departments when facilityKey exists
  useEffect(() => {
    if (consultation?.facilityKey) {
      getDepartmentsByFacility({ facilityId: consultation.facilityKey });
    }
  }, [consultation?.facilityKey, getDepartmentsByFacility]);

  // Load practitioners when consultantSpecialtyLkey exists
  useEffect(() => {
    if (consultation?.consultantSpecialtyLkey) {
      getPractitionersBySpecialty({ 
        specialty: consultation.consultantSpecialtyLkey,
        page: 0,
        size: 100
      });
    }
  }, [consultation?.consultantSpecialtyLkey, getPractitionersBySpecialty]);

  if (!consultation) return null;

  return (
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
      <Form fluid>
        <div className="main-details-consultion-page-container">
          {/* Choose Consultant */}
          <SectionContainer
            title="Choose Consultant"
            content={
              <div className="consultion-details-modal-handle-position">
                <MyInput
                  disabled
                  width={'8vw'}
                  fieldType="select"
                  fieldLabel="Facility"
                  selectData={Array.isArray(facilityListResponse) ? facilityListResponse : []}
                  selectDataLabel="name"
                  selectDataValue="id"
                  fieldName="facilityKey"
                  record={{
                    ...consultation,
                    facilityKey: consultation?.facilityKey ? Number(consultation.facilityKey) : undefined
                  }}
                  setRecord={() => { }}
                />
                <MyInput
                  disabled
                  width={'8vw'}
                  fieldType="select"
                  fieldLabel="Department"
                  selectData={Array.isArray(departmentListResponse) ? departmentListResponse : []}
                  selectDataLabel="name"
                  selectDataValue="id"
                  fieldName="departmentKey"
                  record={{
                    ...consultation,
                    departmentKey: consultation?.departmentKey ? Number(consultation.departmentKey) : undefined
                  }}
                  setRecord={() => { }}
                />
                <MyInput
                  disabled
                  width={'8vw'}
                  fieldType="select"
                  fieldLabel="Consultant Specialty"
                  selectData={consultantSpecialtyLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName="consultantSpecialtyLkey"
                  record={consultation}
                  setRecord={() => { }}
                />
                <MyInput
                  width={'8vw'}
                  disabled
                  fieldType="select"
                  fieldLabel="Consultant"
                  fieldName="preferredConsultantKey"
                  selectData={practitionerList}
                  selectDataLabel="fullName"
                  selectDataValue="id"
                  record={{
                    ...consultation,
                    preferredConsultantKey: consultation?.preferredConsultantKey ? Number(consultation.preferredConsultantKey) : undefined
                  }}
                  setRecord={() => { }}
                />
              </div>
            }
          />

          {/* Details */}
          <SectionContainer
            title="Details"
            content={
              <div className="consultion-details-modal-handle-position">
                <MyInput
                  width={'8vw'}
                  disabled
                  fieldType="select"
                  fieldLabel="Consultation Method"
                  selectData={consultationMethodLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName="consultationMethodLkey"
                  record={consultation}
                  setRecord={() => { }}
                  searchable={false}
                />
                <MyInput
                  width={'8vw'}
                  disabled
                  fieldType="select"
                  fieldLabel="Consultation Type"
                  selectData={consultationTypeLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName="consultationTypeLkey"
                  record={consultation}
                  setRecord={() => { }}
                  searchable={false}
                />
                <MyInput
                  width={'8vw'}
                  disabled
                  fieldType="select"
                  fieldLabel="Priority Level"
                  fieldName="priorityLkey"
                  selectData={orderPriorityLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={consultation}
                  setRecord={() => { }}
                />
              </div>
            }
          />

          {/* Question */}
          <SectionContainer
            title="Question to Consultant"
            content={
              <div className="text-area-positions-detail-consultion">
                <MyInput
                  width={'24vw'}
                  disabled
                  fieldName="consultationContent"
                  rows={6}
                  fieldType="textarea"
                  record={consultation}
                  setRecord={() => { }}
                />
              </div>
            }
          />

          {/* Notes */}
          <SectionContainer
            title="Notes & Documentation"
            content={
              <div className="text-area-positions-detail-consultion">
                <MyInput
                  width={'8vw'}
                  disabled
                  fieldName="notes"
                  rows={6}
                  fieldType="textarea"
                  record={consultation}
                  setRecord={() => { }}
                />
                <MyInput
                  width={'8vw'}
                  disabled
                  fieldName="extra documentation"
                  rows={6}
                  fieldType="textarea"
                  record={consultation}
                  setRecord={() => { }}
                />
                <MyInput
                  width={'8vw'}
                  disabled
                  fieldType="text"
                  fieldLabel="Approval Number"
                  fieldName="approvalNumber"
                  record={consultation}
                  setRecord={() => { }}
                />
              </div>
            }
          />
        </div>
      </Form>
    </Panel>
  );
};

export default PreviewConsultation;
