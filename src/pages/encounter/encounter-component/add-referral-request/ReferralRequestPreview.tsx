import React from 'react';
import { Panel, Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import {
  useGetDepartmentsQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { initialListRequest } from '@/types/types';
import './styles.less';

interface ReferralRequestPreviewProps {
  referral: any;
  onClose?: () => void;
}

const ReferralRequestPreview: React.FC<ReferralRequestPreviewProps> = ({
  referral,
  onClose
}) => {
  const { data: referralTypeLovQueryResponse } = useGetLovValuesByCodeQuery('INTER_EXTER');
  const { data: referralReasonLovQueryResponse } = useGetLovValuesByCodeQuery('REFERRAL_REASONS');
  const { data: priorityLevelLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');
  const { data: departmentListResponse } = useGetDepartmentsQuery({
    ...initialListRequest
  });

  if (!referral) return null;

  return (
    <Panel
      bordered
      className="preview-referral-request"
      header={
        <div className="preview-header">
          <span>Referral Request Preview</span>
          {onClose && (
            <span className="close-btn" onClick={onClose}>
              ✕
            </span>
          )}
        </div>
      }
    >
      <Form fluid>
        <div className="main-details-referral-preview-container">

          {/* Referral Information */}
          <SectionContainer
            title="Referral Information"
            content={
              <div className="consultion-details-modal-handle-position">
                <MyInput
                  disabled
                  width="10vw"
                  fieldType="select"
                  fieldLabel="Referral Type"
                  selectData={referralTypeLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName="referralType"
                  record={referral}
                  setRecord={() => {}}
                />
                {referral?.referralType === '4925976052929804' && (
                  <MyInput
                    disabled
                    width="10vw"
                    fieldType="select"
                    fieldLabel="Department"
                    selectData={departmentListResponse?.object ?? []}
                    selectDataLabel="name"
                    selectDataValue="key"
                    fieldName="departmentKey"
                    record={referral}
                    setRecord={() => {}}
                  />
                )}
                <MyInput
                  disabled
                  width="10vw"
                  fieldType="select"
                  fieldLabel="Referral Reason"
                  selectData={referralReasonLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName="referralReason"
                  record={referral}
                  setRecord={() => {}}
                />
                <MyInput
                  disabled
                  width="10vw"
                  fieldType="select"
                  fieldLabel="Priority Level"
                  selectData={priorityLevelLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName="priorityLevel"
                  record={referral}
                  setRecord={() => {}}
                />
              </div>
            }
          />

          {/* Notes */}
          <SectionContainer
            title="Notes & Details"
            content={
              <div className="text-area-positions-detail-consultion">
                <MyInput
                  disabled
                  width="22vw"
                  rows={5}
                  fieldType="textarea"
                  fieldLabel="Notes"
                  fieldName="notes"
                  record={referral}
                  setRecord={() => {}}
                />
                <MyInput
                  disabled
                  width="10vw"
                  fieldType="text"
                  fieldLabel="Approval Number"
                  fieldName="approvalNumber"
                  record={referral}
                  setRecord={() => {}}
                />
              </div>
            }
          />

          {/* Audit Information */}
          <SectionContainer
            title="Audit Information"
            content={
              <div className="consultion-details-modal-handle-position">
                <MyInput
                  disabled
                  width="12vw"
                  fieldType="text"
                  fieldLabel="Created By"
                  fieldName="createdBy"
                  record={referral}
                  setRecord={() => {}}
                />
                <MyInput
                  disabled
                  width="12vw"
                  fieldType="text"
                  fieldLabel="Created At"
                  fieldName="createdAt"
                  record={referral}
                  setRecord={() => {}}
                />
                <MyInput
                  disabled
                  width="12vw"
                  fieldType="text"
                  fieldLabel="Submitted By"
                  fieldName="submittedBy"
                  record={referral}
                  setRecord={() => {}}
                />
                <MyInput
                  disabled
                  width="12vw"
                  fieldType="text"
                  fieldLabel="Submitted At"
                  fieldName="submittedAt"
                  record={referral}
                  setRecord={() => {}}
                />
              </div>
            }
          />

          {/* Cancellation Information */}
          <SectionContainer
            title="Cancellation Info"
            content={
              <div className="consultion-details-modal-handle-position">
                <MyInput
                  disabled
                  width="12vw"
                  fieldType="text"
                  fieldLabel="Cancelled By"
                  fieldName="cancelledBy"
                  record={referral}
                  setRecord={() => {}}
                />
                <MyInput
                  disabled
                  width="12vw"
                  fieldType="text"
                  fieldLabel="Cancelled At"
                  fieldName="cancelledAt"
                  record={referral}
                  setRecord={() => {}}
                />
                <MyInput
                  disabled
                  width="22vw"
                  rows={3}
                  fieldType="textarea"
                  fieldLabel="Cancellation Reason"
                  fieldName="cancelReason"
                  record={referral}
                  setRecord={() => {}}
                />
              </div>
            }
          />

        </div>
      </Form>
    </Panel>
  );
};

export default ReferralRequestPreview;
