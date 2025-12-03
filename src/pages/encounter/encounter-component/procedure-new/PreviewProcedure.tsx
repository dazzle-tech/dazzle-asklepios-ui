import React, { useEffect } from 'react';
import { Panel, Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import {
  useGetLovValuesByCodeQuery,
  useGetProcedureListQuery
} from '@/services/setupService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useLazyGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { initialListRequest } from '@/types/types';
import './styles.less';

interface PreviewProcedureProps {
  procedure: any;
  onClose?: () => void;
}

const PreviewProcedure: React.FC<PreviewProcedureProps> = ({ procedure, onClose }) => {
  const { data: bodypartLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
  const { data: sideLovQueryResponse } = useGetLovValuesByCodeQuery('SIDES');
  const { data: categoryLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');
  const { data: procedureLevelLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_LEVEL');
  const { data: priorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
  const { data: facilityListResponse } = useGetAllFacilitiesQuery(null);
  const [getDepartmentsByFacility, { data: departmentListResponse }] = 
    useLazyGetActiveDepartmentByFacilityListQuery();
  const { data: procedureListResponse } = useGetProcedureListQuery(
    { ...initialListRequest },
    { skip: !procedure?.categoryKey }
  );

  // Load departments when facilityKey exists
  useEffect(() => {
    if (procedure?.facilityKey) {
      getDepartmentsByFacility({ facilityId: procedure.facilityKey });
    }
  }, [procedure?.facilityKey, getDepartmentsByFacility]);

  if (!procedure) return null;

  return (
    <Panel
      bordered
      className="preview-procedure"
      header={
        <div className="preview-header">
          <span>Procedure Preview</span>
          {onClose && (
            <span className="close-btn" onClick={onClose}>
              ✕
            </span>
          )}
        </div>
      }
    >
      <Form fluid>
        <div className="main-details-procedure-page-container">
          {/* Procedure Details */}
          <SectionContainer
            title="Procedure Details"
            content={
              <div className="procedure-preview-section">
                <MyInput
                  disabled
                  width="12vw"
                  fieldType="select"
                  fieldLabel="Category Type"
                  selectData={categoryLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName="categoryKey"
                  record={procedure}
                  setRecord={() => {}}
                />
                <MyInput
                  disabled
                  width="12vw"
                  fieldType="select"
                  fieldLabel="Procedure Name"
                  selectData={procedureListResponse?.object ?? []}
                  selectDataLabel="name"
                  selectDataValue="key"
                  fieldName="procedureNameKey"
                  record={procedure}
                  setRecord={() => {}}
                />
                <MyInput
                  disabled
                  width="12vw"
                  fieldType="select"
                  fieldLabel="Procedure Level"
                  selectData={procedureLevelLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName="procedureLevelLkey"
                  record={procedure}
                  setRecord={() => {}}
                />
                <MyInput
                  disabled
                  width="12vw"
                  fieldType="select"
                  fieldLabel="Priority"
                  selectData={priorityLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName="priorityLkey"
                  record={procedure}
                  setRecord={() => {}}
                />
              </div>
            }
          />

          {/* Indications & Anatomy */}
          <SectionContainer
            title="Indications & Anatomy"
            content={
              <div className="procedure-preview-section">
                <MyInput
                disabled
                width="24vw"
                fieldType="textarea"
                fieldLabel="Indications Description"
                fieldName="indications"
                record={procedure}
                setRecord={() => {}}
                rows={4}
                />

                <MyInput
                  disabled
                  width="12vw"
                  fieldType="select"
                  fieldLabel="Body Part"
                  selectData={bodypartLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName="bodyPartLkey"
                  record={procedure}
                  setRecord={() => {}}
                />
                <MyInput
                  disabled
                  width="12vw"
                  fieldType="select"
                  fieldLabel="Side"
                  selectData={sideLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName="sideLkey"
                  record={procedure}
                  setRecord={() => {}}
                />
              </div>
            }
          />

          {/* Department & Scheduling */}
          <SectionContainer
            title="Department & Scheduling"
            content={
              <div className="procedure-preview-section">
                <MyInput
                  disabled
                  width="12vw"
                  fieldType="select"
                  fieldLabel="Facility"
                  selectData={Array.isArray(facilityListResponse) ? facilityListResponse : []}
                  selectDataLabel="name"
                  selectDataValue="id"
                  fieldName="facilityKey"
                  record={{
                    ...procedure,
                    facilityKey: procedure?.facilityKey ? Number(procedure.facilityKey) : undefined
                  }}
                  setRecord={() => {}}
                />
                <MyInput
                  disabled
                  width="12vw"
                  fieldType="select"
                  fieldLabel="Department"
                  selectData={Array.isArray(departmentListResponse) ? departmentListResponse : []}
                  selectDataLabel="name"
                  selectDataValue="id"
                  fieldName="departmentKey"
                  record={{
                    ...procedure,
                    departmentKey: procedure?.departmentKey ? Number(procedure.departmentKey) : undefined
                  }}
                  setRecord={() => {}}
                />
                <MyInput
                  disabled
                  width="12vw"
                  fieldType="datetime"
                  fieldLabel="Scheduled Date/Time"
                  fieldName="scheduledDateTime"
                  record={procedure}
                  setRecord={() => {}}
                />
              </div>
            }
          />

          {/* Notes & Documentation */}
          <SectionContainer
            title="Notes & Documentation"
            content={
              <div className="procedure-preview-section">
                <MyInput
                  disabled
                  width="24vw"
                  fieldType="textarea"
                  fieldLabel="Notes"
                  fieldName="notes"
                  record={procedure}
                  setRecord={() => {}}
                  rows={4}
                />
                <MyInput
                  disabled
                  width="24vw"
                  fieldType="textarea"
                  fieldLabel="Extra Documentation"
                  fieldName="extraDocumentation"
                  record={procedure}
                  setRecord={() => {}}
                  rows={4}
                />
              </div>
            }
          />
        </div>
      </Form>
    </Panel>
  );
};

export default PreviewProcedure;
