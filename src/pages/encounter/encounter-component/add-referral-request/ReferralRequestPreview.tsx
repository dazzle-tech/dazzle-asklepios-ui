import React, { useEffect, useMemo, useState } from 'react';
import { Loader, Panel, Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import './styles.less';

import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetDepartmentsBulkMutation } from '@/services/security/departmentService';

interface ReferralRequestPreviewProps {
  referral: any;
  onClose?: () => void;
}

const ReferralRequestPreview: React.FC<ReferralRequestPreviewProps> = ({ referral, onClose }) => {
  const referralTypeOptions = useEnumOptions('ReferralType');
  const priorityOptions = useEnumOptions('ReferralPriority');

  const { data: facilityResponse, isFetching: isFacilitiesFetching } = useGetAllFacilitiesQuery({});
  const [getDepartmentsBulk] = useGetDepartmentsBulkMutation();

  const [departmentMap, setDepartmentMap] = useState<Record<number, string>>({});
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(false);

  const facilityMap = useMemo(() => {
    const map: Record<number, string> = {};
    facilityResponse?.forEach((f: any) => {
      map[f.id] = f.name ?? '';
    });
    return map;
  }, [facilityResponse]);

  useEffect(() => {
    let cancelled = false;

    const loadDepartments = async () => {
      if (!referral) {
        setDepartmentMap({});
        return;
      }

      const uniqueIds = Array.from(
        new Set(
          [referral.fromDepartmentId, referral.toDepartmentId].filter(
            (id): id is number => id != null && id !== undefined && Number(id) > 0
          )
        )
      );

      if (!uniqueIds.length) {
        setDepartmentMap({});
        return;
      }

      try {
        setIsDepartmentsLoading(true);
        const departments = await getDepartmentsBulk(uniqueIds).unwrap();

        if (cancelled) return;

        setDepartmentMap(
          Object.fromEntries((departments ?? []).map((d: any) => [d.id, d.name ?? '']))
        );
      } catch {
        if (!cancelled) {
          setDepartmentMap({});
        }
      } finally {
        if (!cancelled) {
          setIsDepartmentsLoading(false);
        }
      }
    };

    loadDepartments();

    return () => {
      cancelled = true;
    };
  }, [referral?.id, referral?.fromDepartmentId, referral?.toDepartmentId, getDepartmentsBulk]);

  if (!referral) return null;

  const fromFacilityName = facilityMap[referral.fromFacilityId] ?? '';
  const toFacilityName = facilityMap[referral.toFacilityId] ?? '';
  const fromDepartmentName = departmentMap[referral.fromDepartmentId] ?? '';
  const toDepartmentName = departmentMap[referral.toDepartmentId] ?? '';

  const referralTypeLabel =
    referralTypeOptions?.find(o => o.value === referral.referralType)?.label ?? '';

  const priorityLabel =
    priorityOptions?.find(o => o.value === referral.priority)?.label ?? '';

  const isLoading = isFacilitiesFetching || isDepartmentsLoading;

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <Panel
    dir={dir}
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
      <div style={{ position: 'relative' }}>
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 5,
              background: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Loader size="md" content="Loading..." vertical />
          </div>
        )}

        <Form fluid>
          <div className="main-details-referral-preview-container">
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
                      fieldLabel="Priority"
                      fieldName="priorityText"
                      record={{ priorityText: priorityLabel }}
                      setRecord={() => {}}
                    />
                  </div>

                  <div className="refferal-type-facility-container">
                    <MyInput
                      disabled
                      width="15vw"
                      fieldType="text"
                      fieldLabel="From Facility"
                      fieldName="fromFacilityName"
                      record={{ fromFacilityName }}
                      setRecord={() => {}}
                    />

                    <MyInput
                      disabled
                      width="15vw"
                      fieldType="text"
                      fieldLabel="From Department"
                      fieldName="fromDepartmentName"
                      record={{ fromDepartmentName }}
                      setRecord={() => {}}
                    />
                  </div>

                  <div className="refferal-type-facility-container">
                    <MyInput
                      disabled
                      width="15vw"
                      fieldType="text"
                      fieldLabel="To Facility"
                      fieldName="toFacilityName"
                      record={{ toFacilityName }}
                      setRecord={() => {}}
                    />

                    <MyInput
                      disabled
                      width="15vw"
                      fieldType="text"
                      fieldLabel="To Department"
                      fieldName="toDepartmentName"
                      record={{ toDepartmentName }}
                      setRecord={() => {}}
                    />
                  </div>
                </>
              }
            />

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
      </div>
    </Panel>
  );
};

export default ReferralRequestPreview;