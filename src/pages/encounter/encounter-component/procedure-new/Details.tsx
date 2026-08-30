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
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetActiveFacilitiesQuery } from '@/services/security/facilityService';
import { useLazyGetDepartmentByFacilityQuery } from '@/services/security/departmentService';
import { notify } from '@/utils/uiReducerActions';
import { isUncoveredCashCancelled } from '@/utils/uncoveredInsuranceConfirm';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CheckIcon from '@rsuite/icons/Check';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import UncoveredInsuranceWarning from '@/components/UncoveredInsuranceWarning';
import { useInsurancePriceListCoverage } from '@/hooks/useInsurancePriceListCoverage';
import PatientOrder from '../diagnostics-order-new';
import Diagnosis from '../../../medical-component/diagnosis/DiagnosisAndFindings';
import { AttachmentUploadModal } from '@/components/AttachmentModals';
import {
  useLazyGetActiveProceduresByFacilityAndCategoryQuery,
  useLazyGetActiveProceduresByFacilityAndCategorySearchQuery
} from '@/services/setup/procedure/procedureService';
import Icd10DiagnosisSearch from '@/components/Icd10DiagnosisSearch';
import './styles.less';
import { useEnumOptions } from '@/services/enumsApi';
import PatientDiagnosisTable from '../../medical-notes-and-assessments/patient-diagnosis/PatientDiagnosisTable';
import { extractPaginationFromLink } from '@/utils/paginationHelper';

const FIELD_ORDER = [
  'categoryId',
  'procedureId',
  'toFacilityId',
  'toDepartmentId',
  'procedureLevel',
  'priority',
  'scheduledDateTime',
  'bodyPart',
  'side',
  'indicationId'
];

const REQUIRED_FIELDS = [
  'categoryId',
  'procedureId',
  'toFacilityId',
  'procedureLevel',
  'priority',
  'scheduledDateTime',
  'bodyPart'
];

const handleProcedureCrudError = (
  err: any,
  dispatch: any,
  keyMap: Record<string, string>,
  record: any
) => {
  if (isUncoveredCashCancelled(err)) {
    return;
  }

  const data = err?.data ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  const FIELD_LABELS: Record<string, string> = {
    procedureId: 'procedure name',
    toFacilityId: 'facility',
    toDepartmentId: 'department',
    procedureLevel: 'procedure level',
    priority: 'priority',
    scheduledDateTime: 'scheduled date time',
    bodyPart: 'body part',
    side: 'side',
    indicationId: 'indication'
  };

  const normalizeMsg = (msg: string) => {
    const m = (msg || '').toLowerCase();
    if (m.includes('required')) return 'is required';
    if (m.includes('must not be null')) return 'is required';
    if (m.includes('must not be blank')) return 'is required';
    if (m.includes('cannot be null')) return 'is required';
    return msg || 'invalid value';
  };

  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    let errors = [...data.fieldErrors];

    const backendFields = errors.map((e: any) => e.field);

    REQUIRED_FIELDS.forEach(field => {
      const value = record?.[field];
      const isEmpty =
        value === null ||
        value === undefined ||
        value === '' ||
        (typeof value === 'string' && value.trim() === '');

      if (isEmpty && !backendFields.includes(field)) {
        errors.push({ field, message: `${field}.required` });
      }
    });

    const uniqueMap = new Map<string, any>();
    errors.forEach(e => uniqueMap.set(e.field, e));
    errors = Array.from(uniqueMap.values());

    const sortedErrors = [...errors].sort(
      (a, b) => FIELD_ORDER.indexOf(a.field) - FIELD_ORDER.indexOf(b.field)
    );

    const lines = sortedErrors.map((fe: any) => {
      const rawField = String(fe.field ?? '');
      const fieldLabel = FIELD_LABELS[rawField] ?? rawField;
      const cleanMsg = keyMap?.[fe.message] || normalizeMsg(fe.message);
      return `• ${fieldLabel}: ${cleanMsg}`;
    });

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${lines.join('\n')}` + suffix,
        sev: 'warning'
      })
    );

    return;
  }

  dispatch(
    notify({
      msg: data?.message || 'Unexpected error' + suffix,
      sev: 'warning'
    })
  );
};

const PROCEDURE_ERROR_MAP: Record<string, string> = {
  'categoryId.required': 'is required',
  'procedureId.required': 'is required',
  'toFacilityId.required': 'is required',
  'procedureLevel.required': 'is required',
  'priority.required': 'is required',
  'scheduledDateTime.required': 'is required',
  'bodyPart.required': 'is required'
};

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
  const [procedureOptions, setProcedureOptions] = useState<any[]>([]);
  const [procedureSearch, setProcedureSearch] = useState('');
  const [procedureSearchPage, setProcedureSearchPage] = useState(0);
  const [procedureSearchOptions, setProcedureSearchOptions] = useState<any[]>([]);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const deptSize = 20;
  const [deptPage, setDeptPage] = useState(0);
  const [allDepartments, setAllDepartments] = useState<any[]>([]);
  const [deptHasMore, setDeptHasMore] = useState(false);
  const [deptNextLink, setDeptNextLink] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const { uncoveredItems, checkItem, clearUncoveredItems, requiresCashConfirmation } =
    useInsurancePriceListCoverage(encounter?.id);

  const [createProcedure] = useCreateProcdureMutation();
  const [updateProcedure] = useUpdateProcdureMutation();

  const { data: bodypartLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
  const { data: sideLovQueryResponse } = useGetLovValuesByCodeQuery('SIDES');
  const categoryOptions = useEnumOptions('ProcedureCategory');
  const ProcedureLevel = useEnumOptions('ProcedureLevel');
  const Priority = useEnumOptions('Priority');

  const [getDepartmentsByFacility, { isFetching: deptLoading }] =
    useLazyGetDepartmentByFacilityQuery();

  const [
    getProcedureByFacility,
    { data: procedureByFacility, isLoading: procedureByFacilityLoading }
  ] = useLazyGetActiveProceduresByFacilityAndCategoryQuery();

  const [
    searchProceduresByFacilityAndCategory,
    {
      data: searchedProcedureByFacility,
      isLoading: searchedProcedureLoading
    }
  ] = useLazyGetActiveProceduresByFacilityAndCategorySearchQuery();

  const { data: facilityListResponse } = useGetActiveFacilitiesQuery(null);

  const loadDepartments = async ({
    facilityId,
    page = 0,
    append = false
  }: {
    facilityId: any;
    page?: number;
    append?: boolean;
  }) => {
    if (!facilityId) return;
    try {
      const response = await getDepartmentsByFacility({
        facilityId,
        page,
        size: deptSize,
        sort: 'id,asc'
      }).unwrap();

      const rows = response?.data ?? [];
      const nextLink = response?.links?.next ?? null;

      setDeptHasMore(Boolean(nextLink));
      setDeptNextLink(nextLink);

      if (append) {
        setAllDepartments(prev => {
          const seen = new Set(prev.map((d: any) => d.id));
          return [...prev, ...rows.filter((d: any) => !seen.has(d.id))];
        });
      } else {
        setAllDepartments(rows);
      }
    } catch {
      setAllDepartments([]);
    }
  };

  useEffect(() => {
    if (!searchedProcedureByFacility?.data) return;

    const apiData = searchedProcedureByFacility.data;

    console.log('🔎 PROCEDURE SEARCH', {
      search: procedureSearch,
      page: procedureSearchPage,
      returned: apiData.length,
      totalCount: searchedProcedureByFacility.totalCount,
      next: searchedProcedureByFacility.links?.next,
      names: apiData.map((p: any) => p.name)
    });

    setProcedureSearchOptions(prev => {
      // New search → replace old results
      if (procedureSearchPage === 0) {
        const selectedInApi = apiData.some(
          (p: any) => p.id === procedure?.procedureId
        );

        if (procedure?.procedureObj && !selectedInApi) {
          return [
            procedure.procedureObj,
            ...apiData
          ];
        }

        return apiData;
      }

      // Load More → append only new results
      const existingIds = new Set(
        prev.map((p: any) => p.id)
      );

      return [
        ...prev,
        ...apiData.filter(
          (p: any) => !existingIds.has(p.id)
        )
      ];
    });
  }, [
    searchedProcedureByFacility?.data,
    procedureSearchPage,
    procedure?.procedureId,
    procedure?.procedureObj
  ]);

  useEffect(() => {
    const facilityId = procedure?.toFacilityId || authSlice?.selectedDepartment?.facilityId;

    if (facilityId && procedure.categoryId) {
      if (procedurePage === 0) {
        setProcedureOptions(procedure?.procedureObj ? [procedure.procedureObj] : []);
      }
      getProcedureByFacility({
        facilityId,
        category: procedure.categoryId,
        page: procedurePage,
        size: 20,
        sort: 'name,asc'
      });
    } else {
      setProcedureOptions(procedure?.procedureObj ? [procedure.procedureObj] : []);
    }
  }, [
    procedure?.toFacilityId,
    authSlice?.selectedDepartment?.facilityId,
    procedure.categoryId,
    procedurePage,
    getProcedureByFacility
  ]);

  useEffect(() => {
    if (!procedureByFacility?.data) return;

    const apiData = procedureByFacility.data;

    if (procedurePage === 0) {
      const selectedInApi = apiData.some(
        (p: any) => p.id === procedure?.procedureId
      );

      if (procedure?.procedureObj && !selectedInApi) {
        setProcedureOptions([procedure.procedureObj, ...apiData]);
      } else {
        setProcedureOptions(apiData);
      }
    } else {
      setProcedureOptions(prev => {
        const existingIds = new Set(prev.map((p: any) => p.id));
        const merged = [...prev];
        apiData.forEach((p: any) => {
          if (!existingIds.has(p.id)) merged.push(p);
        });
        return merged;
      });
    }
  }, [procedureByFacility?.data]);

  useEffect(() => {
    if (procedure.currentDepartment) {
      setProcedure(prev => ({
        ...prev,
        toDepartmentId: null,
        toFacilityId: authSlice?.selectedDepartment?.facilityId
      }));
    }
  }, [procedure.currentDepartment, authSlice?.selectedDepartment?.facilityId]);

  // Reset & reload departments whenever facility changes
  useEffect(() => {
    setAllDepartments([]);
    setDeptHasMore(false);
    setDeptNextLink(null);
    setDeptPage(0);

    if (!procedure?.toFacilityId) {
      setProcedure(prev => ({ ...prev, toDepartmentId: null }));
      return;
    }

    loadDepartments({ facilityId: procedure.toFacilityId, page: 0 });
  }, [procedure?.toFacilityId]);

  useEffect(() => {
    setProcedurePage(0);
    setProcedureOptions(
      procedure?.procedureObj ? [procedure.procedureObj] : []
    );

    setProcedureSearch('');
    setProcedureSearchPage(0);
    setProcedureSearchOptions([]);
  }, [procedure?.categoryId, procedure?.toFacilityId]);

  useEffect(() => {
    if (!openDetailsModal || !procedure?.procedureId) {
      clearUncoveredItems();
      return;
    }

    void checkItem({
      billingItemType: 'PROCEDURE',
      procedureId: Number(procedure.procedureId)
    });
  }, [openDetailsModal, procedure?.procedureId, checkItem, clearUncoveredItems]);

  const handleProcedureSearch = (value: string) => {
    setProcedureSearch(value);
    setProcedureSearchPage(0);
    setProcedureSearchOptions([]);
  };

  const hasMoreProcedures =
    procedureByFacility?.links?.next != null;

  const hasMoreSearchedProcedures =
    searchedProcedureByFacility?.links?.next != null;

  console.log('🚀 PROCEDURE PAGINATION STATE', {
    procedureSearch,
    procedureSearchPage,
    hasMoreSearchedProcedures,
    searchedTotalCount: searchedProcedureByFacility?.totalCount,
    searchedNext: searchedProcedureByFacility?.links?.next,
    searchedDataLength: searchedProcedureByFacility?.data?.length,
  });


  const handleLoadMoreProcedures = () => {
    if (hasMoreProcedures && !procedureByFacilityLoading) {
      setProcedurePage(prev => prev + 1);
    }
  };

  const handleLoadMoreSearchedProcedures = () => {
    if (
      hasMoreSearchedProcedures &&
      !searchedProcedureLoading
    ) {
      setProcedureSearchPage(prev => prev + 1);
    }
  };

  const handleClear = () => {
    setProcedureOptions([]);
    setProcedurePage(0);
    setAllDepartments([]);
    setDeptHasMore(false);
    setDeptNextLink(null);
    setDeptPage(0);
    setProcedure({
      indicationId: null,
      bodyPart: '',
      side: null,
      toFacilityId: authSlice?.selectedDepartment?.facilityId,
      priority: null,
      procedureLevel: 'MINOR',
      toDepartmentId: null,
      categoryId: null,
      procedureId: null,
      procedureObj: null,
      procedureName: null,
      encounterId: encounter?.id,
      patientId: patient?.id,
      currentDepartment: true,
      notes: null,
      extraDocumentation: null,
      result: null,
      scheduledDateTime: null
    });
  };

  const validateRequiredFields = (): boolean => {
    const FIELD_LABELS: Record<string, string> = {
      categoryId: 'category type',
      procedureId: 'procedure name',
      toFacilityId: 'facility',
      procedureLevel: 'procedure level',
      priority: 'priority',
      scheduledDateTime: 'scheduled date time',
      bodyPart: 'body part'
    };

    const valuesMap: Record<string, any> = {
      categoryId: procedure.categoryId,
      procedureId: procedure.procedureId,
      toFacilityId: procedure.toFacilityId,
      procedureLevel: procedure.procedureLevel,
      priority: procedure.priority,
      scheduledDateTime: procedure.scheduledDateTime,
      bodyPart: procedure.bodyPart
    };

    const missing: string[] = [];

    REQUIRED_FIELDS.forEach(field => {
      const value = valuesMap[field];
      const isEmpty =
        value === null ||
        value === undefined ||
        value === '' ||
        (typeof value === 'string' && value.trim() === '');

      if (isEmpty) {
        missing.push(FIELD_LABELS[field] ?? field);
      }
    });

    if (missing.length > 0) {
      const lines = missing.map(label => `• ${label}: is required`).join('\n');
      dispatch(
        notify({
          msg: `Please fix the following fields:\n${lines}`,
          sev: 'warning'
        })
      );
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateRequiredFields()) {
      return;
    }

    try {
      const procedureData = {
        procedureId: procedure.procedureId,
        patientId: patient?.id,
        encounterId: encounter?.id,
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
        extraDocumentation: procedure.extraDocumentation,
        result: procedure.result
      };

      if (procedure?.id) {
        await updateProcedure({
          id: procedure.id,
          procedureId: procedure.procedureId,
          indicationId: Array.isArray(procedure.indicationId)
            ? procedure.indicationId[0]
            : procedure.indicationId,
          procedureLevel: procedure.procedureLevel,
          priority: procedure.priority,
          bodyPart: procedure.bodyPart || '',
          side: procedure.side,
          toFacilityId: procedure.currentDepartment
            ? authSlice?.selectedDepartment?.facilityId
            : procedure.toFacilityId,
          toDepartmentId: procedure.toDepartmentId,
          scheduledDateTime: procedure.scheduledDateTime
            ? new Date(procedure.scheduledDateTime).toISOString()
            : null,
          notes: procedure.notes,
          extraDocumentation: procedure.extraDocumentation,
          result: procedure.result
        }).unwrap();
      } else {
        await createProcedure({
          ...procedureData,
          acceptUncoveredAsCash: requiresCashConfirmation
        }).unwrap();
      }

      setOpenDetailsModal(false);
      handleClear();
      proRefetch();
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
    } catch (error) {
      handleProcedureCrudError(error, dispatch, PROCEDURE_ERROR_MAP, procedure);
    }
  };

  useEffect(() => {
    const search = procedureSearch.trim();

    if (!search || !procedure?.categoryId) {
      return;
    }

    const facilityId =
      procedure?.toFacilityId ||
      authSlice?.selectedDepartment?.facilityId;

    if (!facilityId) {
      return;
    }

    searchProceduresByFacilityAndCategory({
      facilityId,
      category: procedure.categoryId,
      name: search,
      page: procedureSearchPage,
      size: 20,
      sort: 'name,asc'
    });
  }, [
    procedureSearch,
    procedureSearchPage,
    procedure?.categoryId,
    procedure?.toFacilityId,
    authSlice?.selectedDepartment?.facilityId,
    searchProceduresByFacilityAndCategory
  ]);


  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <>
      <AdvancedModal
        size="80vw"
        open={openDetailsModal}
        setOpen={setOpenDetailsModal}
        actionButtonFunction={handleSave}
        isDisabledActionBtn={edit ? true : procedure.id ? procedure?.status !== 'REQUESTED' : false}
        footerButtons={
          <div className="footer-buttons" dir={dir}>
            <MyButton onClick={handleClear} prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}>
              Clear
            </MyButton>

            <MyButton
              appearance="ghost"
              onClick={() => setOpenOrderModel(true)}
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
            dir={dir}
            className={clsx({
              'disabled-panel': edit || (procedure?.id && procedure?.status !== 'REQUESTED')
            })}
          >
            <Form fluid>
              <UncoveredInsuranceWarning items={uncoveredItems} />
              <div className="margin-bottom-10">
                <SectionContainer
                  title="Procedure Details"
                  content={
                    <div className="procedure-details-row">
                      <MyInput
                        width="100%"
                        fieldLabel="Facility"
                        fieldName="toFacilityId"
                        fieldType="select"
                        selectData={Array.isArray(facilityListResponse) ? facilityListResponse : []}
                        selectDataLabel="name"
                        selectDataValue="id"
                        record={procedure}
                        setRecord={setProcedure}
                        required
                      />

                      <MyInput
                        disabled={editing}
                        width="100%"
                        fieldType="select"
                        fieldLabel="Category Type"
                        selectData={categoryOptions ?? []}
                        selectDataLabel="label"
                        selectDataValue="value"
                        fieldName="categoryId"
                        record={procedure}
                        setRecord={updatedProcedure => {
                          setProcedure({
                            ...updatedProcedure,
                            procedureId: null,
                            procedureObj: null,
                            procedureName: null
                          });
                          setProcedurePage(0);
                        }}
                        required
                      />

                      {procedure?.categoryId && (
                        <MyInput
                          column
                          width="100%"
                          fieldLabel="Procedure Name"
                          fieldType="selectPagination"
                          fieldName="procedureId"
                          selectData={procedureSearch ? procedureSearchOptions : procedureOptions}
                          selectDataLabel="name"
                          selectDataValue="id"
                          record={procedure}
                          setRecord={setProcedure}
                          disabled={editing}
                          searchable={true}
                          loading={procedureSearch ? searchedProcedureLoading : procedureByFacilityLoading}
                          hasMore={procedureSearch ? hasMoreSearchedProcedures : hasMoreProcedures}
                          onFetchMore={
                            procedureSearch
                              ? handleLoadMoreSearchedProcedures
                              : handleLoadMoreProcedures
                          }
                          searchKeyWard={procedureSearch}
                          setSearchKeyWard={handleProcedureSearch}
                          placeholder="Select Procedure"
                          required
                        />
                      )}

                      {procedure?.categoryId && (
                        <MyInput
                          width="100%"
                          fieldLabel="Department"
                          fieldName="toDepartmentId"
                          fieldType="selectPagination"
                          selectData={allDepartments}
                          selectDataLabel="name"
                          selectDataValue="id"
                          record={procedure}
                          setRecord={setProcedure}
                          disabled={!procedure?.toFacilityId}
                          loading={deptLoading}
                          hasMore={deptHasMore}
                          onFetchMore={async () => {
                            if (!deptNextLink || !procedure?.toFacilityId) return;
                            const { page } = extractPaginationFromLink(deptNextLink);
                            setDeptPage(page);
                            await loadDepartments({
                              facilityId: procedure.toFacilityId,
                              page,
                              append: true
                            });
                          }}
                          required
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
                        required
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
                        required
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
                            <div style={{ marginBottom: 10 }}>
                              <PatientDiagnosisTable
                                patient={patient}
                                disabled={
                                  editing ||
                                  edit ||
                                  (procedure?.id && procedure?.status !== 'REQUESTED')
                                }
                                selectMode
                                onSelectDiagnosis={(ids) => {
                                  const selectedIcd = ids?.[0];

                                  setProcedure(prev => ({
                                    ...prev,
                                    indicationId: selectedIcd
                                  }));
                                }}
                              />
                            </div>

                            <MyInput
                              width="100%"
                              fieldType="select"
                              fieldLabel="Body Part"
                              selectData={bodypartLovQueryResponse?.object ?? []}
                              selectDataLabel="lovDisplayVale"
                              disableByField='isValid'

                              selectDataValue="lovDisplayVale"
                              fieldName="bodyPart"
                              record={procedure}
                              setRecord={setProcedure}
                              required
                            />

                            <MyInput
                              width="100%"
                              fieldType="select"
                              fieldLabel="Side"
                              selectData={sideLovQueryResponse?.object ?? []}
                              selectDataLabel="lovDisplayVale"
                              disableByField='isValid'

                              selectDataValue="lovDisplayVale"
                              fieldName="side"
                              record={procedure}
                              setRecord={setProcedure}
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
                        width="100%"
                        disabled={editing}
                        fieldLabel="Scheduled Date Time"
                        fieldName="scheduledDateTime"
                        fieldType="datetime"
                        record={procedure}
                        setRecord={setProcedure}
                        required
                      />
                    }
                  />

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

                        <MyInput
                          width="100%"
                          disabled={editing}
                          fieldLabel="Result"
                          fieldName="result"
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
        leftContent={
          <div dir={dir}>
            <Diagnosis patient={patient} encounter={encounter} />
          </div>
        }
      />

      <MyModal
        open={openOrderModel}
        setOpen={setOpenOrderModel}
        size="lg"
        title="Add Order"
        content={
          <div dir={dir}>
            <PatientOrder edit={edit} patient={patient} encounter={encounter} />
          </div>
        }
      />

      <AttachmentUploadModal
        isOpen={showAttachmentModal}
        setIsOpen={setShowAttachmentModal}
        encounterId={encounter?.id}
        refetchData={() => { }}
        source="PROCEDURE_REQUEST_ATTACHMENT"
        sourceId={procedure?.id ? Number(procedure.id) : 0}
      />
    </>
  );
};

export default Details;