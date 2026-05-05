import React, { useEffect } from 'react';
import { Panel, Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useLazyGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { useLazyGetProceduresByFacilityQuery } from '@/services/setup/procedure/procedureService';
import Icd10DiagnosisSearch from '@/components/Icd10DiagnosisSearch';
import { useEnumOptions } from '@/services/enumsApi';
import './styles.less';

interface PreviewProcedureProps {
  procedure: any;
  onClose?: () => void;
}

const PreviewProcedure: React.FC<PreviewProcedureProps> = ({ procedure, onClose }) => {
  // LOV Queries
  const { data: bodypartLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
  const { data: sideLovQueryResponse } = useGetLovValuesByCodeQuery('SIDES');
  const { data: facilityListResponse } = useGetAllFacilitiesQuery(null);

  // Enums
  const categoryOptions = useEnumOptions('ProcedureCategory');
  const ProcedureLevel = useEnumOptions('ProcedureLevel');
  const Priority = useEnumOptions('Priority');

  // Lazy Queries
  const [getDepartmentsByFacility, { data: departmentListResponse }] =
    useLazyGetActiveDepartmentByFacilityListQuery();
  const [
    getProcedureByFacility,
    { data: procedureByFacility, isLoading: procedureByFacilityLoading }
  ] = useLazyGetProceduresByFacilityQuery();

  // Load departments when toFacilityId exists
  useEffect(() => {
    if (procedure?.toFacilityId) {
      getDepartmentsByFacility({ facilityId: procedure.toFacilityId });
    }
  }, [procedure?.toFacilityId, getDepartmentsByFacility]);

  // Load procedures by facility and category
  useEffect(() => {
    const facilityId = procedure?.toFacilityId;

    if (facilityId && procedure?.categoryKey) {
      getProcedureByFacility({
        facilityId: facilityId,
        category: procedure.categoryKey,
        page: 0,
        size: 20,
        sort: 'name,asc'
      });
    }
  }, [procedure?.toFacilityId, procedure?.categoryKey, getProcedureByFacility]);

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
        <div className='margin-bottom-10' >
          <SectionContainer
            title="Procedure Details"
            content={
              <div className="procedure-details-row">
                <MyInput
                  disabled
                  width="100%"
                  fieldLabel="Facility"
                  fieldName="toFacilityId"
                  fieldType="select"
                  selectData={Array.isArray(facilityListResponse) ? facilityListResponse : []}
                  selectDataLabel="name"
                  selectDataValue="id"
                  record={procedure}
                  setRecord={() => {}}
                />

                <MyInput
                  disabled
                  width="100%"
                  fieldType="select"
                  fieldLabel="Category Type"
                  selectData={categoryOptions ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  fieldName="categoryKey"
                  record={procedure}
                  setRecord={() => {}}
                />

                <MyInput
                  disabled
                  column
                  width="100%"
                  fieldLabel="Procedure Name"
                  fieldType="selectPagination"
                  fieldName="procedureId"
                  selectData={procedureByFacility?.data ?? []}
                  selectDataLabel="name"
                  selectDataValue="id"
                  record={procedure}
                  setRecord={() => {}}
                  searchable={true}
                  loading={procedureByFacilityLoading}
                  hasMore={false}
                  onFetchMore={() => {}}
                  placeholder="Select Procedure..."
                />

                <MyInput
                  disabled
                  width="100%"
                  fieldLabel="Department"
                  fieldName="toDepartmentId"
                  fieldType="select"
                  selectData={Array.isArray(departmentListResponse) ? departmentListResponse : []}
                  selectDataLabel="name"
                  selectDataValue="id"
                  record={procedure}
                  setRecord={() => {}}
                />

                <MyInput
                  disabled
                  width="100%"
                  fieldType="select"
                  fieldLabel="Procedure Level"
                  selectData={ProcedureLevel ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  fieldName="procedureLevel"
                  record={procedure}
                  setRecord={() => {}}
                  searchable={false}
                />

                <MyInput
                  disabled
                  width="100%"
                  fieldType="select"
                  fieldLabel="Priority"
                  selectData={Priority ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  fieldName="priority"
                  record={procedure}
                  setRecord={() => {}}
                  searchable={false}
                />
              </div>
            }
          />
        </div>

        <div className="section-flex-procedures">
          <div className="section-column-procedures">
            <div className="fill-height-section">
              <SectionContainer
                title="Indications & Anatomy"
                content={
                  <>
                    <div className="fill-height-content">
                      <Icd10DiagnosisSearch
                        diagnosisId={procedure.indicationId}
                        setDiagnosisId={() => {}}
                        label="Indication"
                        disabled={true}
                        pageSize={15}
                      />

                      <MyInput
                        disabled
                        width="100%"
                        fieldType="select"
                        fieldLabel="Body Part"
                        selectData={bodypartLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="lovDisplayVale"
                        fieldName="bodyPart"
                        record={procedure}
                        setRecord={() => {}}
                      />

                      <MyInput
                        disabled
                        width="100%"
                        fieldType="select"
                        fieldLabel="Side"
                        selectData={sideLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="lovDisplayVale"
                        fieldName="side"
                        record={procedure}
                        setRecord={() => {}}
                        searchable={false}
                      />
                    </div>
                  </>
                }
              />
            </div>
          </div>

          <div className="section-column-procedures">
            <SectionContainer
              title="Scheduling"
              content={
                <MyInput
                  disabled
                  width="100%"
                  fieldLabel="Scheduled Date Time"
                  fieldName="scheduledDateTime"
                  fieldType="datetime"
                  record={procedure}
                  setRecord={() => {}}
                />
              }
            />

            <SectionContainer
              title="Notes & Documentation"
              content={
                <>
                  <MyInput
                    disabled
                    width="100%"
                    fieldLabel="Notes"
                    fieldName="notes"
                    fieldType="textarea"
                    record={procedure}
                    setRecord={() => {}}
                  />

                  <MyInput
                    disabled
                    width="100%"
                    fieldLabel="Extra Documentation"
                    fieldName="extraDocumentation"
                    fieldType="textarea"
                    record={procedure}
                    setRecord={() => {}}
                  />
                </>
              }
            />
          </div>
        </div>
      </Form>
    </Panel>
  );
};

export default PreviewProcedure;
