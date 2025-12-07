import React from 'react';
import { Panel, Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import './styles.less';

import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetDepartmentByFacilityQuery } from '@/services/security/departmentService';
import { skipToken } from '@reduxjs/toolkit/query';

interface ReferralRequestPreviewProps {
  referral: any;
  onClose?: () => void;
}

const ReferralRequestPreview: React.FC<ReferralRequestPreviewProps> = ({
  referral,
  onClose
}) => {
  if (!referral) return null;

  // نفس الـ enums اللي بالـ Add/Edit
  const referralTypeOptions = useEnumOptions('ReferralType');
  const priorityOptions = useEnumOptions('ReferralPriority');

  // Facilities
  const { data: facilityResponse } = useGetAllFacilitiesQuery({});

  const facilityOptions =
    facilityResponse?.map((f) => ({
      label: f.name ?? '',
      value: f.id
    })) ?? [];

  const facilityName =
    facilityOptions.find((f) => f.value === referral.facilityId)?.label ?? '';

  // Departments حسب الـ facility
  const { data: departmentResponse } = useGetDepartmentByFacilityQuery(
    referral.facilityId
      ? { facilityId: referral.facilityId, page: 0, size: 100 }
      : skipToken
  );

  const departmentOptions =
    departmentResponse?.data?.map((d) => ({
      label: d.name,
      value: d.id
    })) ?? [];

  const departmentName =
    departmentOptions.find((d) => d.value === referral.departmentId)?.label ?? '';

  // Labels للـ enums
  const referralTypeLabel =
    referralTypeOptions?.find((o) => o.value === referral.referralType)?.label ??
    '';

  const priorityLabel =
    priorityOptions?.find((o) => o.value === referral.priority)?.label ?? '';

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
              <>
                <div className="refferal-type-facility-container">
                  <MyInput
                    disabled
                    width="15vw"
                    fieldType="text"
                    fieldLabel="Referral Type"
                    fieldName="referralTypeText"
                    record={{ referralTypeText: referralTypeLabel }}
                    setRecord={() => {}}
                  />

                  <MyInput
                    disabled
                    width="15vw"
                    fieldType="text"
                    fieldLabel="Facility"
                    fieldName="facilityName"
                    record={{ facilityName }}
                    setRecord={() => {}}
                  />
                </div>

                <div className="refferal-type-facility-container">
                  <MyInput
                    disabled
                    width="15vw"
                    fieldType="text"
                    fieldLabel="Department"
                    fieldName="departmentName"
                    record={{ departmentName }}
                    setRecord={() => {}}
                  />

                  <MyInput
                    disabled
                    width="15vw"
                    fieldType="text"
                    fieldLabel="Priority Level"
                    fieldName="priorityText"
                    record={{ priorityText: priorityLabel }}
                    setRecord={() => {}}
                  />
                </div>
              </>
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
                  fieldLabel="Referral Reason"
                  fieldName="referralReason"
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
                  fieldName="createdDate"
                  record={referral}
                  setRecord={() => {}}
                />
                <MyInput
                  disabled
                  width="12vw"
                  fieldType="text"
                  fieldLabel="Last Modified By"
                  fieldName="lastModifiedBy"
                  record={referral}
                  setRecord={() => {}}
                />
                <MyInput
                  disabled
                  width="12vw"
                  fieldType="text"
                  fieldLabel="Last Modified At"
                  fieldName="lastModifiedDate"
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
