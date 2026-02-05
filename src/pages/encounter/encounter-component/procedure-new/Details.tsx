import AdvancedModal from '@/components/AdvancedModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch, useAppSelector } from '@/hooks';
import SectionContainer from '@/components/SectionsoContainer';
import {
  useCreateProcdureMutation,
  useUpdateProcdureMutation
} from '@/services/patients/patientProcedureService';
import { useGetIcdListQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useLazyGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { faBroom, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CheckIcon from '@rsuite/icons/Check';
import SearchIcon from '@rsuite/icons/Search';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import PatientOrder from '../diagnostics-order';
import Diagnosis from '../../../medical-component/diagnosis/DiagnosisAndFindings';
import { AttachmentUploadModal } from '@/components/AttachmentModals';
import { useLazyGetProceduresByFacilityQuery } from '@/services/setup/procedure/procedureService';
import type { ProcedureLevel } from '@/types/model-types-new';

import './styles.less';
import { useEnumOptions } from '@/services/enumsApi';

const Details = ({
  patient,
  encounter,
  edit,
  procedure,
  setProcedure,
  openDetailsModal,
  setOpenDetailsModal,
  proRefetch
}) => {
  const authSlice = useAppSelector(state => state.auth);
  const [openOrderModel, setOpenOrderModel] = useState(false);
  const [editing, setEditing] = useState(false);
  const [procedurePage, setProcedurePage] = useState(0);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const dispatch = useAppDispatch();

  // Mutations
  const [createProcedure] = useCreateProcdureMutation();
  const [updateProcedure] = useUpdateProcdureMutation();

  // LOV Queries
  const { data: bodypartLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
  const { data: sideLovQueryResponse } = useGetLovValuesByCodeQuery('SIDES');
  const { data: CategoryLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');
  const { data: ProcedureLevelLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_LEVEL');
  const { data: priorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');

  const ProcedureLevel = useEnumOptions('ProcedureLevel');
  const Priority = useEnumOptions('Priority');
  // Lazy Queries
  const [getDepartmentsByFacility, { data: departmentListResponse }] =
    useLazyGetActiveDepartmentByFacilityListQuery();
  const [
    getProcedureByFacility,
    { data: procedureByFacility, isLoading: procedureByFacilityLoading }
  ] = useLazyGetProceduresByFacilityQuery();

  const { data: facilityListResponse } = useGetAllFacilitiesQuery(null);

  const [indicationsDescription, setIndicationsDescription] = useState<string>('');
  const [searchKeywordicd, setSearchKeywordicd] = useState('');

  const [icdListRequest, setIcdListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });

  const { data: icdListResponseLoading } = useGetIcdListQuery(icdListRequest);

  const modifiedData = (icdListResponseLoading?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.icdCode} - ${item.description}`
  }));

  // Helper function to map LOV code to ProcedureLevel enum
  const mapLovCodeToProcedureLevel = (lovCode: string | null | undefined): ProcedureLevel => {
    if (!lovCode) return 'MINOR';

    const upperCode = lovCode.toUpperCase();
    if (upperCode.includes('MAJOR')) return 'MAJOR';
    if (upperCode.includes('MEDIUM') || upperCode.includes('MODERATE')) return 'MEDIUM';
    return 'MINOR';
  };

  // Helper function to get LOV value from LOV code
  const getLovValue = (lovData: any[], lovCode: string | null | undefined) => {
    if (!lovCode || !lovData) return null;
    const lovItem = lovData.find(item => item.lovCode === lovCode);
    return lovItem?.lovDisplayVale || lovCode;
  };

  // Update indications description when indicationId changes
  useEffect(() => {
    if (procedure.indicationId != null && procedure.indicationId !== '') {
      const currentIcd = icdListResponseLoading?.object?.find(
        item => item.key === procedure.indicationId
      );
      if (currentIcd) {
        const newEntry = `${currentIcd.icdCode}, ${currentIcd.description}.`;
        setIndicationsDescription(newEntry);
      }
    }
  }, [procedure.indicationId, icdListResponseLoading]);

  // Update ICD search filters
  useEffect(() => {
    if (searchKeywordicd.trim() !== '') {
      setIcdListRequest({
        ...initialListRequest,
        filterLogic: 'or',
        filters: [
          {
            fieldName: 'icd_code',
            operator: 'containsIgnoreCase',
            value: searchKeywordicd
          },
          {
            fieldName: 'description',
            operator: 'containsIgnoreCase',
            value: searchKeywordicd
          }
        ]
      });
    }
  }, [searchKeywordicd]);

  // Load departments when toFacilityId changes
  useEffect(() => {
    if (procedure?.toFacilityId) {
      getDepartmentsByFacility({ facilityId: procedure.toFacilityId });
    }
  }, [procedure?.toFacilityId, getDepartmentsByFacility]);
  useEffect(() => {
    console.log('procedure?.toDepartmentd', procedure?.toDepartmentId);
  }, [procedure]);
  // Load procedures by facility and category - UPDATED
  useEffect(() => {
    const facilityId = procedure?.toFacilityId || authSlice?.selectedDepartment?.facilityId;

    if (facilityId && procedure.categoryKey) {
      console.log('Fetching procedures with:', {
        facilityId,
        category: procedure.categoryKey,
        page: procedurePage
      });

      getProcedureByFacility({
        facilityId: facilityId,
        category: procedure.categoryKey,
        page: procedurePage,
        size: 20,
        sort: 'name,asc'
      });
    }
  }, [
    procedure?.toFacilityId,
    authSlice?.selectedDepartment?.facilityId,
    procedure.categoryKey,
    procedurePage,
    getProcedureByFacility
  ]);

  // Reset department when currentDepartment is checked
  useEffect(() => {
    if (procedure.currentDepartment) {
      setProcedure({
        ...procedure,
        toDepartmentId: null,
        toFacilityId: authSlice?.selectedDepartment?.facilityId
      });
    }
  }, [procedure.currentDepartment]);

  // Reset procedure page when category changes
  useEffect(() => {
    setProcedurePage(0);
  }, [procedure.categoryKey]);

  const handleOpenAttachmentModal = () => {
    setShowAttachmentModal(true);
  };

  const hasMoreProcedures = procedureByFacility?.links?.next != null;

  const handleLoadMoreProcedures = () => {
    if (hasMoreProcedures && !procedureByFacilityLoading) {
      setProcedurePage(prev => prev + 1);
    }
  };

  const handleClear = () => {
    setProcedure({
      indicationId: null,
      bodyPart: '',
      side: null,
      toFacilityId: authSlice?.selectedDepartment?.facilityId,
      priority: null,
      procedureLevel: 'MINOR',
      toDepartmentId: null,
      categoryKey: null,
      procedureId: null,
      encounterId: encounter?.key,
      patientId: patient?.key,
      currentDepartment: true,
      notes: null,
      extraDocumentation: null,
      scheduledDateTime: null
    });
    setIndicationsDescription('');
    setProcedurePage(0);
  };

  const handleSave = async () => {
    try {
      // Get LOV object to extract lovCode

      const procedureData = {
        procedureId: procedure.procedureId,
        patientId: patient?.key,
        encounterId: encounter?.key,

        fromFacilityId: authSlice?.selectedDepartment?.facilityId,
        toFacilityId: procedure.currentDepartment
          ? authSlice?.selectedDepartment?.facilityId
          : procedure.toFacilityId,
        fromDepartmentId: authSlice?.selectedDepartment?.departmentId,
        toDepartmentId: procedure.toDepartmentId,

        indicationId: procedure.indicationId,

        procedureLevel: procedure.procedureLevel,
        priority: procedure.priority,

        bodyPart: procedure.bodyPart || '',
        side: procedure.side,

        scheduledDateTime: procedure.scheduledDateTime
          ? new Date(procedure.scheduledDateTime).toISOString()
          : null,

        notes: procedure.notes,
        extraDocumentation: procedure.extraDocumentation
      };
      console.log('procedureData', procedureData);

      if (procedure?.id) {
        await updateProcedure({
          id: procedure.id,

          procedureId: procedure.procedureId,
          indicationId: procedure.indicationId,

          procedureLevel: procedure.procedureLevel,
          priority: procedure.priority,

          bodyPart: procedure.bodyPart,
          side: procedure.side,

          toFacilityId: procedure.currentDepartment
            ? authSlice?.selectedDepartment?.facilityId
            : procedure.toFacilityId,

          toDepartmentId: procedure.toDepartmentId,

          scheduledDateTime: procedure.scheduledDateTime
            ? new Date(procedure.scheduledDateTime).toISOString()
            : null,

          notes: procedure.notes,
          extraDocumentation: procedure.extraDocumentation
        }).unwrap();
      } else {
        // Create new procedure
        await createProcedure(procedureData).unwrap();
      }

      proRefetch();
      setOpenDetailsModal(false);
      handleClear();
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: 'Save Failed', sev: 'error' }));
      console.error('Save error:', error);
    }
  };

  return (
    <>
      <AdvancedModal
        size="60vw"
        open={openDetailsModal}
        setOpen={setOpenDetailsModal}
        actionButtonFunction={handleSave}
        isDisabledActionBtn={edit ? true : procedure.id ? procedure?.status !== 'REQUESTED' : false}
        footerButtons={
          <div className="footer-buttons">
            <MyButton onClick={handleClear} prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}>
              Clear
            </MyButton>
            <MyButton
              onClick={handleOpenAttachmentModal}
              prefixIcon={() => <FontAwesomeIcon icon={faPaperclip} />}
              disabled={!procedure?.id}
            >
              Attachments
            </MyButton>
            <MyButton
              appearance="ghost"
              onClick={() => {
                setOpenOrderModel(true);
              }}
              disabled={editing}
              prefixIcon={() => <CheckIcon />}
            >
              Order Related Tests
            </MyButton>
          </div>
        }
        rightTitle="Procedure"
        rightContent={
          <div
            className={clsx({
              'disabled-panel': edit || (procedure?.id && procedure?.status !== 'REQUESTED')
            })}
          >
            <Form fluid>
              <div className="section-flex-procedures">
                {/* ➡️ Left Column */}
                <div className="section-column-procedures">
                  {/* Procedure Details */}
                  <SectionContainer
                    title="Procedure Details"
                    content={
                      <>
                        <MyInput
                          // disabled={editing || procedure.currentDepartment}
                          width="100%"
                          fieldLabel="Facility"
                          fieldName="toFacilityId"
                          fieldType="select"
                          selectData={
                            Array.isArray(facilityListResponse) ? facilityListResponse : []
                          }
                          selectDataLabel="name"
                          selectDataValue="id"
                          record={procedure}
                          setRecord={setProcedure}
                        />

                        <MyInput
                          disabled={editing}
                          width="100%"
                          fieldType="select"
                          fieldLabel="Category Type"
                          selectData={CategoryLovQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          fieldName="categoryKey"
                          record={procedure}
                          setRecord={updatedProcedure => {
                            setProcedure({
                              ...updatedProcedure,
                              procedureId: null // Reset procedure when category changes
                            });
                            setProcedurePage(0); // Reset pagination
                          }}
                        />

                        {procedure?.categoryKey && (
                          <MyInput
                            column
                            width="100%"
                            fieldLabel="Procedure Name"
                            fieldType="selectPagination"
                            fieldName="procedureId"
                            selectData={procedureByFacility?.data ?? []}
                            selectDataLabel="name"
                            selectDataValue="id"
                            record={procedure}
                            setRecord={setProcedure}
                            disabled={editing}
                            searchable={true}
                            loading={procedureByFacilityLoading}
                            hasMore={hasMoreProcedures}
                            onFetchMore={handleLoadMoreProcedures}
                            placeholder="Select Procedure..."
                          />
                        )}

                        {procedure?.categoryKey && (
                          <MyInput
                            // disabled={
                            //   editing || procedure.currentDepartment || !procedure?.toFacilityId
                            // }
                            width="100%"
                            fieldLabel="Department"
                            fieldName="toDepartmentId"
                            fieldType="select"
                            selectData={
                              Array.isArray(departmentListResponse) ? departmentListResponse : []
                            }
                            selectDataLabel="name"
                            selectDataValue="id"
                            record={procedure}
                            setRecord={setProcedure}
                          />
                        )}

                        <MyInput
                          disabled={editing}
                          width="100%"
                          fieldType="select"
                          fieldLabel="Procedure Level"
                          selectData={ProcedureLevel ?? []}
                          selectDataLabel="label"
                          selectDataValue="value"
                          fieldName="procedureLevel"
                          record={procedure}
                          setRecord={setProcedure}
                          searchable={false}
                        />

                        <MyInput
                          disabled={editing}
                          width="100%"
                          fieldType="select"
                          fieldLabel="Priority"
                          selectData={Priority ?? []}
                          selectDataLabel="label"
                          selectDataValue="value"
                          fieldName="priority"
                          record={procedure}
                          setRecord={setProcedure}
                          searchable={false}
                        />
                      </>
                    }
                  />

                  {/* Indications & Anatomy */}
                  <SectionContainer
                    title="Indications & Anatomy"
                    content={
                      <>
                        <div style={{ position: 'relative' }}>
                          <MyInput
                            width="100%"
                            fieldType="text"
                            placeholder="Search ICD-10"
                            fieldLabel="Indication"
                            fieldName="searchKeywordicd"
                            record={{ searchKeywordicd }}
                            setRecord={rec => setSearchKeywordicd(rec.searchKeywordicd)}
                            rightAddon={<SearchIcon />}
                          />

                          {searchKeywordicd && (
                            <div className="custom-dropdown-menu">
                              {modifiedData?.map(mod => (
                                <div
                                  key={mod.key}
                                  className="custom-dropdown-item"
                                  onClick={() => {
                                    setProcedure({
                                      ...procedure,
                                      indicationId: mod.key
                                    });
                                    setSearchKeywordicd('');
                                  }}
                                >
                                  <span style={{ marginRight: '12px' }}>{mod.icdCode}</span>
                                  <span>{mod.description}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <MyInput
                          width="100%"
                          fieldType="textarea"
                          disabled={true}
                          fieldName="indicationsDescription"
                          record={{
                            indicationsDescription: indicationsDescription || procedure.indicationId
                          }}
                          setRecord={() => {}}
                          rows={4}
                        />

                        <MyInput
                          width="100%"
                          fieldType="select"
                          fieldLabel="Body Part"
                          selectData={bodypartLovQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="lovDisplayVale"
                          fieldName="bodyPart"
                          record={procedure}
                          setRecord={setProcedure}
                        />

                        <MyInput
                          width="100%"
                          fieldType="select"
                          fieldLabel="Side"
                          selectData={sideLovQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="lovDisplayVale"
                          fieldName="side"
                          record={procedure}
                          setRecord={setProcedure}
                          searchable={false}
                        />
                      </>
                    }
                  />
                </div>

                {/* ➡️ Right Column */}
                <div className="section-column-procedures">
                  {/* Department & Scheduling */}
                  <SectionContainer
                    title="Department & Scheduling"
                    content={
                      <>
                        <MyInput
                          width="100%"
                          disabled={editing}
                          fieldLabel="Scheduled Date Time"
                          fieldName="scheduledDateTime"
                          fieldType="datetime"
                          record={procedure}
                          setRecord={setProcedure}
                        />
                      </>
                    }
                  />

                  {/* Notes & Documentation */}
                  <SectionContainer
                    title="Notes & Documentation"
                    content={
                      <>
                        <MyInput
                          width="100%"
                          disabled={editing}
                          fieldLabel="Notes"
                          fieldName="notes"
                          fieldType="textarea"
                          record={procedure}
                          setRecord={setProcedure}
                        />

                        <MyInput
                          width="100%"
                          disabled={editing}
                          fieldLabel="Extra Documentation"
                          fieldName="extraDocumentation"
                          fieldType="textarea"
                          record={procedure}
                          setRecord={setProcedure}
                        />
                      </>
                    }
                  />
                </div>
              </div>
            </Form>
          </div>
        }
        leftContent={<Diagnosis patient={patient} encounter={encounter} />}
      />

      <MyModal
        open={openOrderModel}
        setOpen={setOpenOrderModel}
        size="lg"
        title="Add Order"
        content={<PatientOrder edit={edit} patient={patient} encounter={encounter} />}
      />

      <AttachmentUploadModal
        isOpen={showAttachmentModal}
        setIsOpen={setShowAttachmentModal}
        encounterId={encounter?.id || encounter?.key}
        refetchData={() => {}}
        source="PROCEDURE_REQUEST_ATTACHMENT"
        sourceId={procedure?.id ? Number(procedure.id) : 0}
      />
    </>
  );
};

export default Details;
