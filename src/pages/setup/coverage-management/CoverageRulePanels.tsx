import React, { useMemo, useState } from 'react';
import { Form, Nav } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit, MdToggleOff } from 'react-icons/md';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import { useEnumOptions } from '@/services/enumsApi';
import { formatEnumString } from '@/utils';
import { useAppDispatch } from '@/hooks';
import CoveragePagedSelect, { useLookupPaging } from './CoveragePagedSelect';
import { notifyError, notifySuccess } from './coverageHelpers';
import Icd10Search from '@/components/ICD10SearchComponent/IcdSearchable';
import {
  useCreateDiscountMutation,
  useCreateExclusionMutation,
  useCreatePreApprovalItemMutation,
  useDeactivateDiscountMutation,
  useDeactivateExclusionMutation,
  useDeactivatePreApprovalItemMutation,
  useListCopaymentsQuery,
  useListDiscountsQuery,
  useListExclusionsQuery,
  useListPreApprovalItemsQuery,
  useListPreApprovalsQuery,
  useListTermItemsQuery,
  useListTermsQuery,
  useSaveCopaymentMutation,
  useSavePreApprovalMutation,
  useSaveTermItemMutation,
  useSaveTermMutation,
  useSearchCoverageDepartmentsQuery,
  useSearchCoverageFacilitiesQuery,
  useSearchCoverageServicesQuery
} from '@/services/setup/coverageManagement/coverageManagementService';

const CoverageIcd10Field = ({
  record,
  setRecord,
  required
}: {
  record: any;
  setRecord: (next: any) => void;
  required?: boolean;
}) => (
  <div className="coverage-icd10-field">
    <Icd10Search
      object={record}
      setOpject={updater => {
        setRecord((prev: any) => {
          const next = typeof updater === 'function' ? updater(prev) : updater;
          const raw = next?.diagnosisId;
          const diagnosisId = raw == null || raw === '' ? null : Number(raw);
          return {
            ...next,
            diagnosisId: Number.isFinite(diagnosisId as number) ? diagnosisId : null
          };
        });
      }}
      fieldName="diagnosisId"
      label="Diagnosis"
      mode="singleICD10"
      required={required}
    />
  </div>
);

const statusOptions = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false }
];

const emptyPage = { page: 0, size: 10, sort: 'id,desc' };

const CoverageRulePanels = ({ contractId }: { contractId: number }) => {
  const [tab, setTab] = useState('copayment');

  return (
    <div className="coverage-rules">
      <Nav appearance="tabs" activeKey={tab} onSelect={setTab} className="coverage-rules-nav">
        <Nav.Item eventKey="copayment">Patient Co-Payment</Nav.Item>
        <Nav.Item eventKey="COVERAGE">Coverages</Nav.Item>
        <Nav.Item eventKey="LIMIT">Coverage Limit</Nav.Item>
        <Nav.Item eventKey="CASH_LIMIT">Cash Limit</Nav.Item>
        <Nav.Item eventKey="discount">Discount</Nav.Item>
        <Nav.Item eventKey="exclusion">Exclusions</Nav.Item>
        <Nav.Item eventKey="preApproval">Pre-Approval</Nav.Item>
      </Nav>

      {tab === 'copayment' && <CopaymentPanel contractId={contractId} />}
      {(tab === 'COVERAGE' || tab === 'LIMIT' || tab === 'CASH_LIMIT') && (
        <TermPanel contractId={contractId} termType={tab} />
      )}
      {tab === 'discount' && <DiscountPanel contractId={contractId} />}
      {tab === 'exclusion' && <ExclusionPanel contractId={contractId} />}
      {tab === 'preApproval' && <PreApprovalPanel contractId={contractId} />}
    </div>
  );
};

const RuleToolbar = ({
  isActive,
  setIsActive,
  onAdd
}: {
  isActive: boolean;
  setIsActive: (value: boolean) => void;
  onAdd: () => void;
}) => (
  <div className="coverage-rule-toolbar">
    <Form fluid>
      <MyInput
        width="160px"
        fieldLabel="Status"
        fieldType="select"
        fieldName="isActive"
        record={{ isActive }}
        setRecord={(next: any) => setIsActive(Boolean(next.isActive))}
        selectData={statusOptions}
        selectDataLabel="label"
        selectDataValue="value"
        searchable={false}
      />
    </Form>
    <MyButton prefixIcon={() => <AddOutlineIcon />} color="var(--deep-blue)" onClick={onAdd} width="109px">
      Add
    </MyButton>
  </div>
);

const CopaymentPanel = ({ contractId }: { contractId: number }) => {
  const dispatch = useAppDispatch();
  const encounterTypes = useEnumOptions('EncounterType');
  const valueTypes = useEnumOptions('InsuranceCoverageType');
  const [isActive, setIsActive] = useState(true);
  const [paging, setPaging] = useState(emptyPage);
  const [open, setOpen] = useState(false);
  const [record, setRecord] = useState<any>({});
  const { data, isFetching } = useListCopaymentsQuery({ contractId, isActive, ...paging });
  const [save] = useSaveCopaymentMutation();

  const saveRow = async () => {
    try {
      await save({ contractId, body: record }).unwrap();
      notifySuccess(dispatch, 'Co-payment saved');
      setOpen(false);
    } catch (error: any) {
      notifyError(dispatch, error, 'Unable to save co-payment');
    }
  };

  return (
    <>
      <RuleToolbar
        isActive={isActive}
        setIsActive={value => {
          setIsActive(value);
          setPaging(prev => ({ ...prev, page: 0 }));
        }}
        onAdd={() => {
          setRecord({
            encounterType: 'ALL',
            valueType: 'PERCENTAGE',
            discountOnExcluded: false,
            discountOnCash: false,
            discountOnExceededCash: false
          });
          setOpen(true);
        }}
      />
      <MyTable
        data={data?.data ?? []}
        totalCount={data?.totalCount ?? 0}
        loading={isFetching}
        height={280}
        page={paging.page}
        rowsPerPage={paging.size}
        onPageChange={(_e: any, page: number) => setPaging(prev => ({ ...prev, page }))}
        onRowsPerPageChange={(e: any) => setPaging(prev => ({ ...prev, size: Number(e.target.value), page: 0 }))}
        columns={[
          { key: 'encounterType', title: 'Encounter Type', flexGrow: 2, render: (row: any) => formatEnumString(row.encounterType) },
          { key: 'valueType', title: 'Value Type', flexGrow: 1, render: (row: any) => formatEnumString(row.valueType) },
          { key: 'valueAmount', title: 'Value', flexGrow: 1 },
          { key: 'isActive', title: 'Status', flexGrow: 1, render: (row: any) => (row.isActive ? 'Active' : 'Inactive') },
          {
            key: 'actions',
            title: '',
            flexGrow: 1,
            render: (row: any) => (
              <MdModeEdit className="icons-style" size={22} onClick={() => { setRecord(row); setOpen(true); }} />
            )
          }
        ]}
      />
      <MyModal open={open} setOpen={setOpen} title="Patient Co-Payment" size="56vw" bodyheight="68vh" actionButtonFunction={saveRow} content={
        <Form fluid className="coverage-form-grid">
          <MyInput required width="100%" fieldLabel="Encounter Type" fieldType="select" fieldName="encounterType" record={record} setRecord={setRecord} selectData={encounterTypes} />
          <MyInput required width="100%" fieldLabel="Value Type" fieldType="select" fieldName="valueType" record={record} setRecord={setRecord} selectData={valueTypes} />
          <MyInput required width="100%" fieldLabel="Value Entry" fieldType="number" fieldName="valueAmount" record={record} setRecord={setRecord} />
          <MyInput width="100%" fieldLabel="Discount on excluded" fieldType="check" fieldName="discountOnExcluded" record={record} setRecord={setRecord} />
          <MyInput width="100%" fieldLabel="Discount on Cash" fieldType="check" fieldName="discountOnCash" record={record} setRecord={setRecord} />
          <MyInput width="100%" fieldLabel="Discount on exceeded cash" fieldType="check" fieldName="discountOnExceededCash" record={record} setRecord={setRecord} />
        </Form>
      } />
    </>
  );
};

const TermPanel = ({ contractId, termType }: { contractId: number; termType: string }) => {
  const dispatch = useAppDispatch();
  const diagnosisScopes = useEnumOptions('CoverageDiagnosisScope');
  const periodTypes = useEnumOptions('CoveragePeriodBasis');
  const coverageBasis = useEnumOptions('CoverageBasis');
  const valueTypes = useEnumOptions('InsuranceCoverageType');
  const categoryScopes = useEnumOptions('CoverageRuleTarget', { exclude: ['SERVICE', 'DIAGNOSIS'] });
  const categories = useEnumOptions('ServiceCategory');
  const allEncounterTypes = useEnumOptions('EncounterType');
  const [isActive, setIsActive] = useState(true);
  const [paging, setPaging] = useState(emptyPage);
  const [open, setOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [record, setRecord] = useState<any>({});
  const [item, setItem] = useState<any>({});
  const [selectedTerm, setSelectedTerm] = useState<any>(null);
  const facilityLookup = useLookupPaging(String(open));
  const departmentLookup = useLookupPaging(`${record.facilityId || ''}-${open}`);
  const serviceLookup = useLookupPaging(String(itemOpen));
  const facilities = useSearchCoverageFacilitiesQuery({ page: facilityLookup.page, size: 15, search: facilityLookup.appliedSearch }, { skip: !open });
  const departments = useSearchCoverageDepartmentsQuery(
    { facilityId: Number(record.facilityId), page: departmentLookup.page, size: 15, search: departmentLookup.appliedSearch },
    { skip: !open || !record.facilityId }
  );
  const services = useSearchCoverageServicesQuery(
    { page: serviceLookup.page, size: 15, search: serviceLookup.appliedSearch, category: item.serviceCategory },
    { skip: !itemOpen }
  );
  const { data, isFetching } = useListTermsQuery({ contractId, termType, isActive, ...paging });
  const itemsQuery = useListTermItemsQuery(
    { termId: Number(selectedTerm?.id), isActive: true, page: 0, size: 10 },
    { skip: !selectedTerm?.id }
  );
  const [saveTerm] = useSaveTermMutation();
  const [saveItem] = useSaveTermItemMutation();

  const encounterOptions = useMemo(() => {
    const selectedDept = (departments.data?.data ?? []).find(row => Number(row.id) === Number(record.departmentId));
    if (!record.departmentId || Number(record.departmentId) === 0 || !selectedDept?.encounterType) {
      return allEncounterTypes;
    }
    return allEncounterTypes.filter(option => option.value === 'ALL' || option.value === selectedDept.encounterType);
  }, [allEncounterTypes, departments.data, record.departmentId]);

  const persistTerm = async () => {
    try {
      await saveTerm({
        contractId,
        body: {
          ...record,
          termType,
          diagnosisId: record.diagnosisId == null || record.diagnosisId === '' ? null : Number(record.diagnosisId),
          diagnosisCode: record.diagnosisCode || null,
          allDepartments: !record.departmentId || Number(record.departmentId) === 0,
          departmentId: !record.departmentId || Number(record.departmentId) === 0 ? null : record.departmentId
        }
      }).unwrap();
      notifySuccess(dispatch, 'Coverage rule saved');
      setOpen(false);
    } catch (error: any) {
      notifyError(dispatch, error, 'Unable to save coverage rule');
    }
  };

  const persistItem = async () => {
    try {
      await saveItem({ termId: Number(selectedTerm.id), body: item }).unwrap();
      notifySuccess(dispatch, 'Item saved');
      setItemOpen(false);
    } catch (error: any) {
      notifyError(dispatch, error, 'Unable to save item');
    }
  };

  return (
    <>
      <RuleToolbar
        isActive={isActive}
        setIsActive={value => {
          setIsActive(value);
          setPaging(prev => ({ ...prev, page: 0 }));
        }}
        onAdd={() => {
          setRecord({
            termType,
            diagnosisScope: 'ALL_DIAGNOSIS',
            allDepartments: true,
            encounterType: 'ALL',
            valueType: 'PERCENTAGE',
            coverageBasis: 'GROSS',
            periodBasis: 'PER_ENCOUNTER'
          });
          setOpen(true);
        }}
      />
      <MyTable
        data={data?.data ?? []}
        totalCount={data?.totalCount ?? 0}
        loading={isFetching}
        height={260}
        page={paging.page}
        rowsPerPage={paging.size}
        onPageChange={(_e: any, page: number) => setPaging(prev => ({ ...prev, page }))}
        onRowsPerPageChange={(e: any) => setPaging(prev => ({ ...prev, size: Number(e.target.value), page: 0 }))}
        onRowClick={(row: any) => setSelectedTerm(row)}
        rowClassName={(row: any) => (selectedTerm?.id === row.id ? 'selected-row' : '')}
        columns={[
          { key: 'diagnosisScope', title: 'Coverage Type', flexGrow: 2, render: (row: any) => formatEnumString(row.diagnosisScope) },
          { key: 'facilityName', title: 'Facility', flexGrow: 2 },
          { key: 'departmentName', title: 'Department', flexGrow: 2 },
          { key: 'encounterType', title: 'Encounter Type', flexGrow: 2, render: (row: any) => formatEnumString(row.encounterType) },
          { key: 'limitValue', title: 'Limit Value', flexGrow: 1 },
          { key: 'isActive', title: 'Status', flexGrow: 1, render: (row: any) => (row.isActive ? 'Active' : 'Inactive') },
          {
            key: 'actions',
            title: '',
            flexGrow: 1,
            render: (row: any) => (
              <MdModeEdit className="icons-style" size={22} onClick={() => { setRecord(row); setOpen(true); }} />
            )
          }
        ]}
      />

      {selectedTerm?.id && (
        <div className="coverage-nested-block">
          <div className="coverage-nested-title">
            <Translate>Category / Service rules</Translate>
            <MyButton prefixIcon={() => <AddOutlineIcon />} color="var(--deep-blue)" width="109px" onClick={() => {
              setItem({ categoryScope: 'ALL', valueType: 'PERCENTAGE' });
              setItemOpen(true);
            }}>
              Add
            </MyButton>
          </div>
          <MyTable
            data={itemsQuery.data?.data ?? []}
            totalCount={itemsQuery.data?.totalCount ?? 0}
            loading={itemsQuery.isFetching}
            height={220}
            columns={[
              { key: 'categoryScope', title: 'Category', flexGrow: 2, render: (row: any) => formatEnumString(row.categoryScope) },
              { key: 'serviceCategory', title: 'Service Category', flexGrow: 2, render: (row: any) => formatEnumString(row.serviceCategory) },
              { key: 'serviceName', title: 'Service', flexGrow: 2 },
              { key: 'valueType', title: 'Value Type', flexGrow: 1, render: (row: any) => formatEnumString(row.valueType) },
              { key: 'limitValue', title: 'Limit Value', flexGrow: 1 },
              {
                key: 'actions',
                title: '',
                flexGrow: 1,
                render: (row: any) => (
                  <MdModeEdit className="icons-style" size={22} onClick={() => { setItem(row); setItemOpen(true); }} />
                )
              }
            ]}
          />
        </div>
      )}

      <MyModal open={open} setOpen={setOpen} title="Coverage Rule" size="72vw" bodyheight="72vh" actionButtonFunction={persistTerm} content={
        <Form fluid className="coverage-form-grid">
          <MyInput required width="100%" fieldLabel="Coverage Type" fieldType="select" fieldName="diagnosisScope" record={record} setRecord={setRecord} selectData={diagnosisScopes} />
          {record.diagnosisScope === 'SPECIFIC_DIAGNOSIS' && (
            <CoverageIcd10Field record={record} setRecord={setRecord} required />
          )}
          <CoveragePagedSelect fieldName="facilityId" fieldLabel="Facility name" record={record} setRecord={next => setRecord({ ...next, departmentId: undefined })} result={facilities} page={facilityLookup.page} setPage={facilityLookup.setPage} search={facilityLookup.search} setSearch={facilityLookup.setSearch} required />
          <CoveragePagedSelect fieldName="departmentId" fieldLabel="Department" record={record} setRecord={setRecord} result={departments} page={departmentLookup.page} setPage={departmentLookup.setPage} search={departmentLookup.search} setSearch={departmentLookup.setSearch} includeAll required disabled={!record.facilityId} />
          <MyInput width="100%" fieldLabel="Encounter Type" fieldType="select" fieldName="encounterType" record={record} setRecord={setRecord} selectData={encounterOptions} />
          {termType !== 'COVERAGE' && (
            <>
              <MyInput required width="100%" fieldLabel="Period type" fieldType="select" fieldName="periodBasis" record={record} setRecord={setRecord} selectData={periodTypes} />
              <MyInput required width="100%" fieldLabel="Discount Type" fieldType="select" fieldName="coverageBasis" record={record} setRecord={setRecord} selectData={coverageBasis} />
            </>
          )}
          <MyInput required width="100%" fieldLabel="Value type" fieldType="select" fieldName="valueType" record={record} setRecord={setRecord} selectData={valueTypes} />
          <MyInput required width="100%" fieldLabel="Limit Value" fieldType="number" fieldName="limitValue" record={record} setRecord={setRecord} />
        </Form>
      } />

      <MyModal open={itemOpen} setOpen={setItemOpen} title="Category / Service" size="56vw" bodyheight="68vh" actionButtonFunction={persistItem} content={
        <Form fluid className="coverage-form-grid">
          <MyInput required width="100%" fieldLabel="Category" fieldType="select" fieldName="categoryScope" record={item} setRecord={setItem} selectData={categoryScopes} />
          {item.categoryScope === 'CATEGORY' && (
            <MyInput required width="100%" fieldLabel="Specific category" fieldType="select" fieldName="serviceCategory" record={item} setRecord={setItem} selectData={categories} />
          )}
          <CoveragePagedSelect fieldName="serviceId" fieldLabel="Service name" record={item} setRecord={setItem} result={services} page={serviceLookup.page} setPage={serviceLookup.setPage} search={serviceLookup.search} setSearch={serviceLookup.setSearch} />
          <MyInput required width="100%" fieldLabel="Value type" fieldType="select" fieldName="valueType" record={item} setRecord={setItem} selectData={valueTypes} />
          <MyInput required width="100%" fieldLabel="Limit Value" fieldType="number" fieldName="limitValue" record={item} setRecord={setItem} />
        </Form>
      } />
    </>
  );
};

const DiscountPanel = ({ contractId }: { contractId: number }) => {
  const dispatch = useAppDispatch();
  const targets = useEnumOptions('CoverageRuleTarget', { exclude: ['DIAGNOSIS'] });
  const encounterTypes = useEnumOptions('EncounterType');
  const discountTypes = useEnumOptions('DiscountType');
  const categories = useEnumOptions('ServiceCategory');
  const [isActive, setIsActive] = useState(true);
  const [paging, setPaging] = useState(emptyPage);
  const [open, setOpen] = useState(false);
  const [record, setRecord] = useState<any>({});
  const serviceLookup = useLookupPaging(String(open));
  const services = useSearchCoverageServicesQuery(
    { page: serviceLookup.page, size: 15, search: serviceLookup.appliedSearch, category: record.serviceCategory },
    { skip: !open || record.targetType !== 'SERVICE' }
  );
  const { data, isFetching } = useListDiscountsQuery({ contractId, isActive, ...paging });
  const [create] = useCreateDiscountMutation();
  const [deactivate] = useDeactivateDiscountMutation();

  const persist = async () => {
    try {
      await create({ contractId, body: record }).unwrap();
      notifySuccess(dispatch, 'Discount added');
      setOpen(false);
    } catch (error: any) {
      notifyError(dispatch, error, 'Unable to add discount');
    }
  };

  return (
    <>
      <RuleToolbar isActive={isActive} setIsActive={setIsActive} onAdd={() => {
        setRecord({ targetType: 'ALL', encounterType: 'ALL', discountType: 'PERCENTAGE' });
        setOpen(true);
      }} />
      <MyTable
        data={data?.data ?? []}
        totalCount={data?.totalCount ?? 0}
        loading={isFetching}
        height={280}
        page={paging.page}
        rowsPerPage={paging.size}
        onPageChange={(_e: any, page: number) => setPaging(prev => ({ ...prev, page }))}
        onRowsPerPageChange={(e: any) => setPaging(prev => ({ ...prev, size: Number(e.target.value), page: 0 }))}
        columns={[
          { key: 'targetType', title: 'Discount Name', flexGrow: 2, render: (row: any) => formatEnumString(row.targetType) },
          { key: 'serviceName', title: 'Service / Category', flexGrow: 2, render: (row: any) => row.serviceName || formatEnumString(row.serviceCategory) },
          { key: 'encounterType', title: 'Encounter Type', flexGrow: 2, render: (row: any) => formatEnumString(row.encounterType) },
          { key: 'discountType', title: 'Discount type', flexGrow: 2, render: (row: any) => formatEnumString(row.discountType) },
          { key: 'discountValue', title: 'Value', flexGrow: 1 },
          { key: 'isActive', title: 'Status', flexGrow: 1, render: (row: any) => (row.isActive ? 'Active' : 'Inactive') },
          {
            key: 'actions',
            title: '',
            flexGrow: 1,
            render: (row: any) =>
              row.isActive ? (
                <MdToggleOff className="icons-style" size={24} title="Deactivate" onClick={() => deactivate(row.id)} />
              ) : null
          }
        ]}
      />
      <MyModal open={open} setOpen={setOpen} title="Discount" size="56vw" bodyheight="68vh" actionButtonFunction={persist} content={
        <Form fluid className="coverage-form-grid">
          <MyInput required width="100%" fieldLabel="Discount Name" fieldType="select" fieldName="targetType" record={record} setRecord={setRecord} selectData={targets} />
          {record.targetType === 'CATEGORY' && (
            <MyInput required width="100%" fieldLabel="Category" fieldType="select" fieldName="serviceCategory" record={record} setRecord={setRecord} selectData={categories} />
          )}
          {record.targetType === 'SERVICE' && (
            <CoveragePagedSelect fieldName="serviceId" fieldLabel="Service Name" record={record} setRecord={setRecord} result={services} page={serviceLookup.page} setPage={serviceLookup.setPage} search={serviceLookup.search} setSearch={serviceLookup.setSearch} required />
          )}
          <MyInput required width="100%" fieldLabel="Encounter Type" fieldType="select" fieldName="encounterType" record={record} setRecord={setRecord} selectData={encounterTypes} />
          <MyInput required width="100%" fieldLabel="Discount type" fieldType="select" fieldName="discountType" record={record} setRecord={setRecord} selectData={discountTypes} />
          <MyInput required width="100%" fieldLabel="Value" fieldType="number" fieldName="discountValue" record={record} setRecord={setRecord} />
        </Form>
      } />
    </>
  );
};

const ExclusionPanel = ({ contractId }: { contractId: number }) => {
  const dispatch = useAppDispatch();
  const types = useEnumOptions('CoverageRuleTarget', { exclude: ['ALL'] });
  const encounterTypes = useEnumOptions('EncounterType');
  const yesNo = useEnumOptions('YesNoQuestion', { exclude: ['NOT_YET_DETERMINED'] });
  const categories = useEnumOptions('ServiceCategory');
  const [isActive, setIsActive] = useState(true);
  const [paging, setPaging] = useState(emptyPage);
  const [open, setOpen] = useState(false);
  const [record, setRecord] = useState<any>({});
  const serviceLookup = useLookupPaging(String(open));
  const services = useSearchCoverageServicesQuery({ page: serviceLookup.page, size: 15, search: serviceLookup.appliedSearch }, { skip: !open || record.exclusionType !== 'SERVICE' });
  const { data, isFetching } = useListExclusionsQuery({ contractId, isActive, ...paging });
  const [create] = useCreateExclusionMutation();
  const [deactivate] = useDeactivateExclusionMutation();

  const persist = async () => {
    try {
      await create({ contractId, body: record }).unwrap();
      notifySuccess(dispatch, 'Exclusion added');
      setOpen(false);
    } catch (error: any) {
      notifyError(dispatch, error, 'Unable to add exclusion');
    }
  };

  return (
    <>
      <RuleToolbar isActive={isActive} setIsActive={setIsActive} onAdd={() => {
        setRecord({ exclusionType: 'CATEGORY', encounterType: 'ALL', excludedResult: 'YES', allDiagnoses: false });
        setOpen(true);
      }} />
      <MyTable
        data={data?.data ?? []}
        totalCount={data?.totalCount ?? 0}
        loading={isFetching}
        height={280}
        page={paging.page}
        rowsPerPage={paging.size}
        onPageChange={(_e: any, page: number) => setPaging(prev => ({ ...prev, page }))}
        onRowsPerPageChange={(e: any) => setPaging(prev => ({ ...prev, size: Number(e.target.value), page: 0 }))}
        columns={[
          { key: 'exclusionType', title: 'Excluded type', flexGrow: 2, render: (row: any) => formatEnumString(row.exclusionType) },
          { key: 'serviceName', title: 'Result', flexGrow: 2, render: (row: any) => row.serviceName || row.diagnosisName || formatEnumString(row.serviceCategory) },
          { key: 'encounterType', title: 'Encounter Type', flexGrow: 2, render: (row: any) => formatEnumString(row.encounterType) },
          { key: 'excludedResult', title: 'Excluded Result', flexGrow: 1, render: (row: any) => formatEnumString(row.excludedResult) },
          { key: 'isActive', title: 'Status', flexGrow: 1, render: (row: any) => (row.isActive ? 'Active' : 'Inactive') },
          {
            key: 'actions',
            title: '',
            flexGrow: 1,
            render: (row: any) =>
              row.isActive ? (
                <MdToggleOff className="icons-style" size={24} title="Deactivate" onClick={() => deactivate(row.id)} />
              ) : null
          }
        ]}
      />
      <MyModal open={open} setOpen={setOpen} title="Exclusion" size="56vw" bodyheight="68vh" actionButtonFunction={persist} content={
        <Form fluid className="coverage-form-grid">
          <MyInput required width="100%" fieldLabel="Excluded type" fieldType="select" fieldName="exclusionType" record={record} setRecord={setRecord} selectData={types} />
          {record.exclusionType === 'CATEGORY' && (
            <MyInput required width="100%" fieldLabel="Category" fieldType="select" fieldName="serviceCategory" record={record} setRecord={setRecord} selectData={categories} />
          )}
          {record.exclusionType === 'SERVICE' && (
            <CoveragePagedSelect fieldName="serviceId" fieldLabel="Service Name" record={record} setRecord={setRecord} result={services} page={serviceLookup.page} setPage={serviceLookup.setPage} search={serviceLookup.search} setSearch={serviceLookup.setSearch} required />
          )}
          {record.exclusionType === 'DIAGNOSIS' && (
            <>
              <MyInput width="100%" fieldLabel="All diagnoses" fieldType="check" fieldName="allDiagnoses" record={record} setRecord={setRecord} />
              {!record.allDiagnoses && (
                <CoverageIcd10Field record={record} setRecord={setRecord} required />
              )}
            </>
          )}
          <MyInput required width="100%" fieldLabel="Encounter Type" fieldType="select" fieldName="encounterType" record={record} setRecord={setRecord} selectData={encounterTypes} />
          <MyInput required width="100%" fieldLabel="Excluded Result" fieldType="select" fieldName="excludedResult" record={record} setRecord={setRecord} selectData={yesNo} />
        </Form>
      } />
    </>
  );
};

const PreApprovalPanel = ({ contractId }: { contractId: number }) => {
  const dispatch = useAppDispatch();
  const scopes = useEnumOptions('CoverageApprovalScope');
  const encounterTypes = useEnumOptions('EncounterType');
  const itemTypes = useEnumOptions('CoverageRuleTarget');
  const categories = useEnumOptions('ServiceCategory');
  const [isActive, setIsActive] = useState(true);
  const [paging, setPaging] = useState(emptyPage);
  const [open, setOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [record, setRecord] = useState<any>({});
  const [item, setItem] = useState<any>({});
  const [selected, setSelected] = useState<any>(null);
  const facilityLookup = useLookupPaging(String(open));
  const departmentLookup = useLookupPaging(`${record.facilityId || ''}-${open}`);
  const serviceLookup = useLookupPaging(String(itemOpen));
  const facilities = useSearchCoverageFacilitiesQuery({ page: facilityLookup.page, size: 15, search: facilityLookup.appliedSearch }, { skip: !open });
  const departments = useSearchCoverageDepartmentsQuery(
    { facilityId: Number(record.facilityId || 0), page: departmentLookup.page, size: 15, search: departmentLookup.appliedSearch },
    { skip: !open || record.approvalScope !== 'DEPARTMENT' || !record.facilityId }
  );
  const services = useSearchCoverageServicesQuery({ page: serviceLookup.page, size: 15, search: serviceLookup.appliedSearch }, { skip: !itemOpen || item.itemType !== 'SERVICE' });
  const { data, isFetching } = useListPreApprovalsQuery({ contractId, isActive, ...paging });
  const itemsQuery = useListPreApprovalItemsQuery(
    { preApprovalId: Number(selected?.id), isActive: true, page: 0, size: 10 },
    { skip: !selected?.id }
  );
  const [save] = useSavePreApprovalMutation();
  const [createItem] = useCreatePreApprovalItemMutation();
  const [deactivateItem] = useDeactivatePreApprovalItemMutation();

  const persist = async () => {
    try {
      await save({ contractId, body: record }).unwrap();
      notifySuccess(dispatch, 'Pre-approval saved');
      setOpen(false);
    } catch (error: any) {
      notifyError(dispatch, error, 'Unable to save pre-approval');
    }
  };

  const persistItem = async () => {
    try {
      await createItem({ preApprovalId: Number(selected.id), body: item }).unwrap();
      notifySuccess(dispatch, 'Pre-approval item added');
      setItemOpen(false);
    } catch (error: any) {
      notifyError(dispatch, error, 'Unable to add item');
    }
  };

  return (
    <>
      <RuleToolbar isActive={isActive} setIsActive={setIsActive} onAdd={() => {
        setRecord({ approvalScope: 'FACILITY', encounterType: 'ALL' });
        setOpen(true);
      }} />
      <MyTable
        data={data?.data ?? []}
        totalCount={data?.totalCount ?? 0}
        loading={isFetching}
        height={260}
        page={paging.page}
        rowsPerPage={paging.size}
        onPageChange={(_e: any, page: number) => setPaging(prev => ({ ...prev, page }))}
        onRowsPerPageChange={(e: any) => setPaging(prev => ({ ...prev, size: Number(e.target.value), page: 0 }))}
        onRowClick={(row: any) => setSelected(row)}
        rowClassName={(row: any) => (selected?.id === row.id ? 'selected-row' : '')}
        columns={[
          { key: 'approvalScope', title: 'Approval type', flexGrow: 2, render: (row: any) => formatEnumString(row.approvalScope) },
          { key: 'facilityName', title: 'Facility', flexGrow: 2 },
          { key: 'departmentName', title: 'Department', flexGrow: 2 },
          { key: 'encounterType', title: 'Encounter Type', flexGrow: 2, render: (row: any) => formatEnumString(row.encounterType) },
          { key: 'isActive', title: 'Status', flexGrow: 1, render: (row: any) => (row.isActive ? 'Active' : 'Inactive') },
          {
            key: 'actions',
            title: '',
            flexGrow: 1,
            render: (row: any) => (
              <MdModeEdit className="icons-style" size={22} onClick={() => { setRecord(row); setOpen(true); }} />
            )
          }
        ]}
      />
      {selected?.id && selected.isActive && (
        <div className="coverage-nested-block">
          <div className="coverage-nested-title">
            <Translate>Pre-approval items</Translate>
            <MyButton prefixIcon={() => <AddOutlineIcon />} color="var(--deep-blue)" width="109px" onClick={() => {
              setItem({ itemType: 'ALL', allDiagnoses: false });
              setItemOpen(true);
            }}>
              Add
            </MyButton>
          </div>
          <MyTable
            data={itemsQuery.data?.data ?? []}
            totalCount={itemsQuery.data?.totalCount ?? 0}
            loading={itemsQuery.isFetching}
            height={220}
            columns={[
              { key: 'itemType', title: 'Pre Approval type', flexGrow: 2, render: (row: any) => formatEnumString(row.itemType) },
              { key: 'serviceName', title: 'Scope', flexGrow: 3, render: (row: any) => row.serviceName || row.diagnosisName || formatEnumString(row.serviceCategory) || 'All' },
              { key: 'isActive', title: 'Status', flexGrow: 1, render: (row: any) => (row.isActive ? 'Active' : 'Inactive') },
              {
                key: 'actions',
                title: '',
                flexGrow: 1,
                render: (row: any) =>
                  row.isActive ? (
                    <MdToggleOff className="icons-style" size={24} title="Deactivate" onClick={() => deactivateItem(row.id)} />
                  ) : null
              }
            ]}
          />
        </div>
      )}
      <MyModal open={open} setOpen={setOpen} title="Pre-Approval" size="56vw" bodyheight="68vh" actionButtonFunction={persist} content={
        <Form fluid className="coverage-form-grid">
          <MyInput required width="100%" fieldLabel="Approval type" fieldType="select" fieldName="approvalScope" record={record} setRecord={setRecord} selectData={scopes} />
          {record.approvalScope === 'FACILITY' && (
            <>
              <CoveragePagedSelect fieldName="facilityId" fieldLabel="Facility name" record={record} setRecord={setRecord} result={facilities} page={facilityLookup.page} setPage={facilityLookup.setPage} search={facilityLookup.search} setSearch={facilityLookup.setSearch} required />
              <MyInput required width="100%" fieldLabel="Encounter type" fieldType="select" fieldName="encounterType" record={record} setRecord={setRecord} selectData={encounterTypes} />
            </>
          )}
          {record.approvalScope === 'DEPARTMENT' && (
            <>
              <CoveragePagedSelect fieldName="facilityId" fieldLabel="Facility name" record={record} setRecord={next => setRecord({ ...next, departmentId: undefined })} result={facilities} page={facilityLookup.page} setPage={facilityLookup.setPage} search={facilityLookup.search} setSearch={facilityLookup.setSearch} required />
              <CoveragePagedSelect fieldName="departmentId" fieldLabel="Department name" record={record} setRecord={setRecord} result={departments} page={departmentLookup.page} setPage={departmentLookup.setPage} search={departmentLookup.search} setSearch={departmentLookup.setSearch} required disabled={!record.facilityId} />
            </>
          )}
        </Form>
      } />
      <MyModal open={itemOpen} setOpen={setItemOpen} title="Pre-Approval Item" size="56vw" bodyheight="68vh" actionButtonFunction={persistItem} content={
        <Form fluid className="coverage-form-grid">
          <MyInput required width="100%" fieldLabel="Pre Approval type" fieldType="select" fieldName="itemType" record={item} setRecord={setItem} selectData={itemTypes} />
          {item.itemType === 'CATEGORY' && (
            <MyInput required width="100%" fieldLabel="Category" fieldType="select" fieldName="serviceCategory" record={item} setRecord={setItem} selectData={categories} />
          )}
          {item.itemType === 'SERVICE' && (
            <CoveragePagedSelect fieldName="serviceId" fieldLabel="Service name" record={item} setRecord={setItem} result={services} page={serviceLookup.page} setPage={serviceLookup.setPage} search={serviceLookup.search} setSearch={serviceLookup.setSearch} required />
          )}
          {item.itemType === 'DIAGNOSIS' && (
            <>
              <MyInput width="100%" fieldLabel="All diagnoses" fieldType="check" fieldName="allDiagnoses" record={item} setRecord={setItem} />
              {!item.allDiagnoses && (
                <CoverageIcd10Field record={item} setRecord={setItem} required />
              )}
            </>
          )}
        </Form>
      } />
    </>
  );
};

export default CoverageRulePanels;
