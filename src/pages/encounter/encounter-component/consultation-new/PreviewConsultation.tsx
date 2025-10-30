import React from 'react';
import { Panel, Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import {
  useGetLovValuesByCodeQuery,
  useGetPractitionersQuery
} from '@/services/setupService';
import { initialListRequest } from '@/types/types';
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
  const { data: practitionerListResponse } = useGetPractitionersQuery({
    ...initialListRequest
  });
  const { data: consultantSpecialtyLovQueryResponse } =
    useGetLovValuesByCodeQuery('PRACT_SUB_SPECIALTY ');
  const { data: cityLovQueryResponse } = useGetLovValuesByCodeQuery('CITY');
  const { data: consultationMethodLovQueryResponse } =
    useGetLovValuesByCodeQuery('CONSULT_METHOD');
  const { data: consultationTypeLovQueryResponse } =
    useGetLovValuesByCodeQuery('CONSULT_TYPE');
  const { data: orderPriorityLovQueryResponse } =
    useGetLovValuesByCodeQuery('ORDER_PRIORITY');

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
                  fieldLabel="Preferred Consultant"
                  fieldName="preferredConsultantKey"
                  selectData={practitionerListResponse?.object ?? []}
                  selectDataLabel="practitionerFullName"
                  selectDataValue="key"
                  record={consultation}
                  setRecord={() => { }}
                />
                <MyInput
                  width={'8vw'}
                  disabled
                  fieldType="select"
                  fieldLabel="City"
                  selectData={cityLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName="cityLkey"
                  record={consultation}
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
