import AdvancedModal from '@/components/AdvancedModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import SectionContainer from '@/components/SectionsoContainer';
import { useSaveProceduresMutation } from '@/services/procedureService';
import {
  useGetIcdListQuery,
  useGetLovValuesByCodeQuery,
  useGetProcedureListQuery
} from '@/services/setupService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useLazyGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { newApProcedure } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { faBroom, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CheckIcon from '@rsuite/icons/Check';
import SearchIcon from '@rsuite/icons/Search';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { Dropdown, Form } from 'rsuite';
import PatientOrder from '../diagnostics-order';
import Diagnosis from '../../../medical-component/diagnosis/DiagnosisAndFindings';
import { AttachmentUploadModal } from '@/components/AttachmentModals';

import './styles.less';

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
  const [openOrderModel, setOpenOrderModel] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const dispatch = useAppDispatch();
  const [saveProcedures, saveProcedureMutation] = useSaveProceduresMutation();
  const { data: bodypartLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
  const { data: sideLovQueryResponse } = useGetLovValuesByCodeQuery('SIDES');
  const { data: CategoryLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');
  const { data: ProcedureLevelLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_LEVEL');
  const { data: priorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');

  const [getDepartmentsByFacility, { data: departmentListResponse }] = 
    useLazyGetActiveDepartmentByFacilityListQuery();

  const [listRequestPro, setListRequestPro] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'category_lkey',
        operator: 'match',
        value: procedure.categoryKey
      }
    ]
  });

  const { data: facilityListResponse } = useGetAllFacilitiesQuery(null);
  const { data: procedureQueryResponse, refetch: profetch } = useGetProcedureListQuery(
    listRequestPro,
    { skip: procedure.categoryKey == undefined }
  );

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

  useEffect(() => {
    if (procedure.indications != null && procedure.indications !== '') {
      const currentIcd = icdListResponseLoading?.object?.find(
        item => item.key === procedure.indications
      );
      if (currentIcd) {
        const newEntry = `${currentIcd.icdCode}, ${currentIcd.description}.`;
        setIndicationsDescription(newEntry);
      }
    }
  }, [procedure.indications, icdListResponseLoading]);

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

  useEffect(() => {
    setListRequestPro(prev => ({
      ...prev,
      filters: [
        ...(procedure?.categoryKey
          ? [
              {
                fieldName: 'category_lkey',
                operator: 'match',
                value: procedure?.categoryKey
              }
            ]
          : [])
      ]
    }));
  }, [procedure?.categoryKey]);

  // Load departments when facilityKey changes
  useEffect(() => {
    if (procedure?.facilityKey) {
      getDepartmentsByFacility({ facilityId: procedure.facilityKey });
    }
  }, [procedure?.facilityKey, getDepartmentsByFacility]);

  useEffect(() => {
    if (procedure.currentDepartment) {
      setProcedure({ ...procedure, departmentKey: null, faciltyLkey: null });
    }
  }, [procedure.currentDepartment]);

  const handleOpenAttachmentModal = () => {
    setShowAttachmentModal(true);
  };

  const handleClear = () => {
    setProcedure({
      ...newApProcedure,
      statusLkey: '3621653475992516',
      indications: indicationsDescription,
      bodyPartLkey: null,
      sideLkey: null,
      faciltyLkey: null,
      priorityLkey: null,
      procedureLevelLkey: null,
      departmentKey: null,
      categoryKey: null,
      procedureNameKey: null
    });
  };

  const handleSave = async () => {
    try {
      await saveProcedures({
        ...procedure,
        statusLkey: '3621653475992516',
        indications: indicationsDescription,
        encounterKey: encounter?.key,
        patientKey: patient?.key,
        scheduledDateTime: procedure.scheduledDateTime
          ? new Date(procedure?.scheduledDateTime)?.getTime()
          : null
      }).unwrap();

      proRefetch();
      setOpenDetailsModal(false);
      handleClear();
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: 'Save Failed', sev: 'error' }));
    }
  };

  return (
    <>
      <AdvancedModal
        size="60vw"
        open={openDetailsModal}
        setOpen={setOpenDetailsModal}
        actionButtonFunction={handleSave}
        isDisabledActionBtn={
          edit ? true : procedure.key ? procedure?.statusLvalue?.valueCode !== 'PROC_REQ' : false
        }
        footerButtons={
          <div className="footer-buttons">
            <MyButton onClick={handleClear} prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}>
              Clear
            </MyButton>
            <MyButton
              onClick={handleOpenAttachmentModal}
              prefixIcon={() => <FontAwesomeIcon icon={faPaperclip} />}
              disabled={!procedure?.key}
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
            <MyButton appearance="ghost">Devices & Implants</MyButton>
          </div>
        }
        rightTitle="Procedure"
        rightContent={
          <div
            className={clsx({
              'disabled-panel':
                edit || (procedure?.key && procedure?.statusLvalue?.valueCode !== 'PROC_REQ')
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
                          disabled={editing}
                          width="100%"
                          fieldType="select"
                          fieldLabel="Category Type"
                          selectData={CategoryLovQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          fieldName="categoryKey"
                          record={procedure}
                          setRecord={setProcedure}
                        />
                        <MyInput
                          disabled={editing}
                          width="100%"
                          fieldType="select"
                          fieldLabel="Procedure Name"
                          selectData={procedureQueryResponse?.object ?? []}
                          selectDataLabel="name"
                          selectDataValue="key"
                          fieldName="procedureNameKey"
                          record={procedure}
                          setRecord={setProcedure}
                        />
                        <MyInput
                          disabled={editing}
                          width="100%"
                          fieldType="select"
                          fieldLabel="Procedure Level"
                          selectData={ProcedureLevelLovQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          fieldName="procedureLevelLkey"
                          record={procedure}
                          setRecord={setProcedure}
                          searchable={false}
                        />
                        <MyInput
                          disabled={editing}
                          width="100%"
                          fieldType="select"
                          fieldLabel="Priority"
                          selectData={priorityLovQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          fieldName="priorityLkey"
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
                                      indications: mod.key
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
                            indicationsDescription: indicationsDescription || procedure.indications
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
                          selectDataValue="key"
                          fieldName="bodyPartLkey"
                          record={procedure}
                          setRecord={setProcedure}
                        />
                        <MyInput
                          width="100%"
                          fieldType="select"
                          fieldLabel="Side"
                          selectData={sideLovQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          fieldName="sideLkey"
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
                          disabled={editing || procedure.currentDepartment}
                          width="100%"
                          fieldName="facilityKey"
                          fieldType="select"
                          selectData={Array.isArray(facilityListResponse) ? facilityListResponse : []}
                          selectDataLabel="name"
                          selectDataValue="id"
                          record={{
                            ...procedure,
                            facilityKey: procedure?.facilityKey ? Number(procedure.facilityKey) : undefined
                          }}
                          setRecord={setProcedure}
                        />
                        <MyInput
                          disabled={
                            editing || procedure.currentDepartment || !procedure?.facilityKey
                          }
                          width="100%"
                          fieldName="departmentKey"
                          fieldType="select"
                          selectData={Array.isArray(departmentListResponse) ? departmentListResponse : []}
                          selectDataLabel="name"
                          selectDataValue="id"
                          record={{
                            ...procedure,
                            departmentKey: procedure?.departmentKey ? Number(procedure.departmentKey) : undefined
                          }}
                          setRecord={setProcedure}
                        />
                        <MyInput
                          disabled={editing}
                          width="100%"
                          fieldType="checkbox"
                          fieldName="currentDepartment"
                          record={procedure}
                          setRecord={setProcedure}
                        />
                        <MyInput
                          width="100%"
                          disabled={editing}
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
                          fieldName="notes"
                          fieldType="textarea"
                          record={procedure}
                          setRecord={setProcedure}
                        />
                        <MyInput
                          width="100%"
                          disabled={editing}
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
        size={'full'}
        title="Add Order"
        content={<PatientOrder edit={edit} patient={patient} encounter={encounter} />}
      />

      <AttachmentUploadModal
        isOpen={showAttachmentModal}
        setIsOpen={setShowAttachmentModal}
        encounterId={encounter?.id || encounter?.key}
        refetchData={() => {}}
        source="PROCEDURE_REQUEST_ATTACHMENT"
        sourceId={procedure?.key ? Number(procedure.key) : 0}
      />
    </>
  );
};

export default Details;
