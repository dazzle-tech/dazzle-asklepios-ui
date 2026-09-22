import React, { useMemo, useState } from 'react';
import { Form, Nav } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdAdd, MdModeEdit, MdToggleOff } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import { useEnumOptions } from '@/services/enumsApi';
import { formatEnumString } from '@/utils';
import { useAppDispatch } from '@/hooks';
import CoveragePagedSelect, { useLookupPaging } from './CoveragePagedSelect';
import BillingCategoryItemFields from './BillingCategoryItemFields';
import { discountCategoryLabel, discountItemLabel, exclusionResultLabel, exclusionTypeLabel, notifyError, notifySuccess, notifyWarning } from './coverageHelpers';
import Icd10DiagnosisSearch from '@/components/Icd10DiagnosisSearch';
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
    <Icd10DiagnosisSearch
      diagnosisId={record?.diagnosisId ?? null}
      setDiagnosisId={id => setRecord({ ...record, diagnosisId: id })}
      label="Diagnosis"
      required={required}
      compact
    />
    <p className="coverage-icd10-hint">
      <Translate>
        Selecting a parent code (for example A00) applies this rule to every diagnosis under it (A00.0, A00.1, …).
      </Translate>
    </p>
  </div>
);

const statusOptions = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false }
];

const emptyPage = { page: 0, size: 10, sort: 'id,desc' };

const CoverageRulePanels = ({ classId, readOnly }: { classId: number; readOnly?: boolean }) => {
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

      {tab === 'copayment' && <CopaymentPanel classId={classId} readOnly={readOnly} />}
      {(tab === 'COVERAGE' || tab === 'LIMIT' || tab === 'CASH_LIMIT') && (
        <TermPanel key={tab} classId={classId} termType={tab} readOnly={readOnly} />
      )}
      {tab === 'discount' && <DiscountPanel classId={classId} readOnly={readOnly} />}
      {tab === 'exclusion' && <ExclusionPanel classId={classId} readOnly={readOnly} />}
      {tab === 'preApproval' && <PreApprovalPanel classId={classId} readOnly={readOnly} />}
    </div>
  );
};

const RuleToolbar = ({
  isActive,
  setIsActive,
  onAdd,
  readOnly,
  includeAll
}: {
  isActive: boolean | '';
  setIsActive: (value: any) => void;
  onAdd: () => void;
  readOnly?: boolean;
  includeAll?: boolean;
}) => (
  <div className="coverage-rule-toolbar">
    <Form fluid>
      <MyInput
        width="160px"
        fieldLabel="Status"
        fieldType="select"
        fieldName="isActive"
        record={{ isActive }}
        setRecord={(next: any) => {
          if (includeAll) {
            setIsActive(next.isActive === true || next.isActive === false ? next.isActive : '');
            return;
          }
          setIsActive(Boolean(next.isActive));
        }}
        selectData={
          includeAll
            ? [
                { label: 'All', value: '' },
                { label: 'Active', value: true },
                { label: 'Inactive', value: false }
              ]
            : statusOptions
        }
        selectDataLabel="label"
        selectDataValue="value"
        searchable={false}
      />
    </Form>
    {!readOnly && (
      <MyButton prefixIcon={() => <AddOutlineIcon />} color="var(--deep-blue)" onClick={onAdd} width="109px">
        Add
      </MyButton>
    )}
  </div>
);

const CopaymentPanel = ({ classId, readOnly }: { classId: number; readOnly?: boolean }) => {
  const dispatch = useAppDispatch();
  const encounterTypes = useEnumOptions('EncounterType');
  const valueTypes = useEnumOptions('InsuranceCoverageType');
  const [isActive, setIsActive] = useState(true);
  const [paging, setPaging] = useState(emptyPage);
  const [open, setOpen] = useState(false);
  const [record, setRecord] = useState<any>({});
  const { data, isFetching } = useListCopaymentsQuery({ classId, isActive, ...paging });
  const [save] = useSaveCopaymentMutation();

  const saveRow = async () => {
    try {
      await save({ classId, body: record }).unwrap();
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
        readOnly={readOnly}
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
            render: (row: any) =>
              readOnly ? null : (
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

const TermPanel = ({ classId, termType, readOnly }: { classId: number; termType: string; readOnly?: boolean }) => {
  const dispatch = useAppDispatch();
  const diagnosisScopes = useEnumOptions('CoverageDiagnosisScope');
  const periodTypes = useEnumOptions('CoveragePeriodBasis');
  const coverageBasis = useEnumOptions('CoverageBasis');
  const valueTypes = useEnumOptions('InsuranceCoverageType');
  const allEncounterTypes = useEnumOptions('EncounterType');
  const hasReadings = termType === 'COVERAGE' || termType === 'LIMIT' || termType === 'CASH_LIMIT';
  const readingTitle =
    termType === 'LIMIT'
      ? 'Coverage Limit readings'
      : termType === 'CASH_LIMIT'
        ? 'Cash Limit readings'
        : 'Coverage readings';
  const readingModalTitle =
    termType === 'LIMIT'
      ? 'Coverage Limit reading'
      : termType === 'CASH_LIMIT'
        ? 'Cash Limit reading'
        : 'Coverage reading';
  const [isActive, setIsActive] = useState(true);
  const [paging, setPaging] = useState(emptyPage);
  const [open, setOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [record, setRecord] = useState<any>({});
  const [item, setItem] = useState<any>({});
  const [selectedTerm, setSelectedTerm] = useState<any>(null);
  const facilityLookup = useLookupPaging(String(open));
  const departmentLookup = useLookupPaging(`${record.facilityId || ''}-${open}`);
  const facilities = useSearchCoverageFacilitiesQuery({ page: facilityLookup.page, size: 15, search: facilityLookup.appliedSearch }, { skip: !open });
  const departments = useSearchCoverageDepartmentsQuery(
    { facilityId: Number(record.facilityId), page: departmentLookup.page, size: 15, search: departmentLookup.appliedSearch },
    { skip: !open || !record.facilityId }
  );
  const { data, isFetching } = useListTermsQuery({ classId, termType, isActive, ...paging });
  const itemsQuery = useListTermItemsQuery(
    { termId: Number(selectedTerm?.id), page: 0, size: 10 },
    { skip: !hasReadings || !selectedTerm?.id }
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
        classId,
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
    if (!item.billingItemType) {
      notifyWarning(dispatch, 'Category is required');
      return;
    }
    if (!item.valueType) {
      notifyWarning(dispatch, 'Value type is required');
      return;
    }
    if (item.limitValue == null || Number(item.limitValue) <= 0) {
      notifyWarning(dispatch, 'Limit value must be greater than zero');
      return;
    }
    const billingItemType = item.billingItemType === 'ALL' ? null : item.billingItemType;
    const itemId = item.itemId == null || item.itemId === '' ? null : Number(item.itemId);
    try {
      await saveItem({
        termId: Number(selectedTerm.id),
        body: {
          id: item.id,
          categoryScope: billingItemType ? (itemId ? 'SERVICE' : 'CATEGORY') : 'ALL',
          billingItemType,
          serviceId: Number.isFinite(itemId as number) ? itemId : null,
          serviceName: itemId ? item.itemName || null : null,
          valueType: item.valueType,
          limitValue: item.limitValue,
          isActive: item.isActive !== false && item.isActive !== 'false'
        }
      }).unwrap();
      notifySuccess(dispatch, item.id ? `${readingModalTitle} updated` : `${readingModalTitle} added`);
      setItemOpen(false);
    } catch (error: any) {
      notifyError(dispatch, error, `Unable to save ${readingModalTitle.toLowerCase()}`);
    }
  };

  const persistReadingStatus = (row: any, nextActive: boolean) => {
    if (!selectedTerm?.id) {
      return;
    }
    saveItem({
      termId: Number(selectedTerm.id),
      body: {
        id: row.id,
        categoryScope: row.billingItemType ? (row.serviceId ? 'SERVICE' : 'CATEGORY') : 'ALL',
        billingItemType: row.billingItemType ?? null,
        serviceId: row.serviceId ?? null,
        serviceName: row.serviceId ? row.serviceName || null : null,
        valueType: row.valueType,
        limitValue: row.limitValue,
        isActive: nextActive
      }
    });
  };

  const openCoverageReading = (term: any, row?: any) => {
    setSelectedTerm(term);
    setItem(
      row
        ? {
            ...row,
            billingItemType: row.billingItemType ?? 'ALL',
            itemId: row.serviceId ?? null,
            itemName: row.serviceName ?? null
          }
        : { billingItemType: null, itemId: null, valueType: 'PERCENTAGE', isActive: true }
    );
    setItemOpen(true);
  };

  return (
    <>
      <RuleToolbar
        isActive={isActive}
        setIsActive={value => {
          setIsActive(value);
          setPaging(prev => ({ ...prev, page: 0 }));
        }}
        readOnly={readOnly}
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
            render: (row: any) =>
              readOnly ? null : (
                <div className="coverage-row-actions">
                  <MdModeEdit
                    className="icons-style"
                    size={22}
                    title="Edit"
                    onClick={event => {
                      event.stopPropagation();
                      setRecord(row);
                      setOpen(true);
                    }}
                  />
                  {hasReadings && (
                    <MdAdd
                      className="icons-style"
                      size={22}
                      title={`Add ${readingModalTitle.toLowerCase()}`}
                      onClick={event => {
                        event.stopPropagation();
                        openCoverageReading(row);
                      }}
                    />
                  )}
                </div>
              )
          }
        ]}
      />

      {hasReadings && selectedTerm?.id && (
        <div className="coverage-nested-block">
          <div className="coverage-nested-title">
            <Translate>{readingTitle}</Translate>
            {!readOnly && (
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                width="109px"
                onClick={() => openCoverageReading(selectedTerm)}
              >
                Add
              </MyButton>
            )}
          </div>
          <MyTable
            data={itemsQuery.data?.data ?? []}
            totalCount={itemsQuery.data?.totalCount ?? 0}
            loading={itemsQuery.isFetching}
            height={220}
            columns={[
              {
                key: 'billingItemType',
                title: 'Category',
                flexGrow: 2,
                render: (row: any) => discountCategoryLabel({ ...row, targetType: row.categoryScope })
              },
              {
                key: 'serviceName',
                title: termType === 'COVERAGE' ? 'Item' : 'Service name',
                flexGrow: 2,
                render: (row: any) => discountItemLabel({ ...row, targetType: row.categoryScope })
              },
              { key: 'valueType', title: 'Value Type', flexGrow: 1, render: (row: any) => formatEnumString(row.valueType) },
              { key: 'limitValue', title: 'Limit Value', flexGrow: 1 },
              { key: 'isActive', title: 'Status', flexGrow: 1, render: (row: any) => (row.isActive ? 'Active' : 'Inactive') },
              {
                key: 'actions',
                title: '',
                flexGrow: 1,
                render: (row: any) =>
                  readOnly ? null : (
                    <div className="coverage-row-actions">
                      <MdModeEdit
                        className="icons-style"
                        size={22}
                        title="Update"
                        onClick={() => openCoverageReading(selectedTerm, row)}
                      />
                      {row.isActive ? (
                        <MdToggleOff
                          className="icons-style"
                          size={24}
                          title="Deactivate"
                          onClick={() => persistReadingStatus(row, false)}
                        />
                      ) : (
                        <FaUndo
                          className="icons-style"
                          size={18}
                          title="Activate"
                          onClick={() => persistReadingStatus(row, true)}
                        />
                      )}
                    </div>
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

      <MyModal open={itemOpen} setOpen={setItemOpen} title={readingModalTitle} size="56vw" bodyheight="68vh" actionButtonFunction={persistItem} content={
        <Form fluid className="coverage-form-grid">
          <BillingCategoryItemFields open={itemOpen} record={item} setRecord={setItem} />
          <MyInput required width="100%" fieldLabel="Value type" fieldType="select" fieldName="valueType" record={item} setRecord={setItem} selectData={valueTypes} />
          <MyInput required width="100%" fieldLabel="Limit Value" fieldType="number" fieldName="limitValue" record={item} setRecord={setItem} />
          <MyInput required width="100%" fieldLabel="Status" fieldType="select" fieldName="isActive" record={item} setRecord={setItem} selectData={statusOptions} selectDataLabel="label" selectDataValue="value" searchable={false} />
        </Form>
      } />
    </>
  );
};

const DiscountPanel = ({
  classId,
  tpaId,
  readOnly
}: {
  classId?: number;
  tpaId?: number;
  readOnly?: boolean;
}) => {
  const dispatch = useAppDispatch();
  const encounterTypes = useEnumOptions('EncounterType');
  const discountTypes = useEnumOptions('DiscountType');
  const [isActive, setIsActive] = useState<boolean | ''>('');
  const [paging, setPaging] = useState(emptyPage);
  const [open, setOpen] = useState(false);
  const [record, setRecord] = useState<any>({});
  const owner = tpaId ? { tpaId } : { classId: Number(classId) };
  const { data, isFetching } = useListDiscountsQuery({
    ...owner,
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
    ...paging
  });
  const [create] = useCreateDiscountMutation();
  const [deactivate] = useDeactivateDiscountMutation();

  const persist = async () => {
    if (!record.discountType) {
      notifyWarning(dispatch, 'Discount type is required');
      return;
    }
    if (record.discountValue == null || Number(record.discountValue) <= 0) {
      notifyWarning(dispatch, 'Discount value must be greater than zero');
      return;
    }
    if (!record.billingItemType) {
      notifyWarning(dispatch, 'Category is required');
      return;
    }
    const billingItemType = record.billingItemType === 'ALL' ? null : record.billingItemType;
    const itemId = record.itemId == null || record.itemId === '' ? null : Number(record.itemId);
    try {
      await create({
        ...owner,
        body: {
          targetType: billingItemType ? (itemId ? 'SERVICE' : 'CATEGORY') : 'ALL',
          billingItemType,
          serviceId: Number.isFinite(itemId as number) ? itemId : null,
          serviceName: itemId ? record.itemName || null : null,
          encounterType: record.encounterType,
          discountType: record.discountType,
          discountValue: record.discountValue
        }
      }).unwrap();
      notifySuccess(dispatch, 'Discount added');
      setOpen(false);
    } catch (error: any) {
      notifyError(dispatch, error, 'Unable to add discount');
    }
  };

  return (
    <>
      <RuleToolbar
        readOnly={readOnly}
        includeAll
        isActive={isActive}
        setIsActive={setIsActive}
        onAdd={() => {
        setRecord({ encounterType: 'ALL', discountType: 'PERCENTAGE', billingItemType: null, itemId: null });
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
          { key: 'billingItemType', title: 'Category', flexGrow: 2, render: (row: any) => discountCategoryLabel(row) },
          { key: 'serviceName', title: 'Item', flexGrow: 2, render: (row: any) => discountItemLabel(row) },
          { key: 'encounterType', title: 'Encounter Type', flexGrow: 2, render: (row: any) => formatEnumString(row.encounterType) },
          { key: 'discountType', title: 'Discount type', flexGrow: 2, render: (row: any) => formatEnumString(row.discountType) },
          { key: 'discountValue', title: 'Value', flexGrow: 1 },
          { key: 'isActive', title: 'Status', flexGrow: 1, render: (row: any) => (row.isActive ? 'Active' : 'Inactive') },
          {
            key: 'actions',
            title: '',
            flexGrow: 1,
            render: (row: any) =>
              !readOnly ? (
                row.isActive ? (
                  <MdToggleOff
                    className="icons-style"
                    size={24}
                    title="Deactivate"
                    onClick={() => deactivate(row.id)}
                  />
                ) : (
                  <FaUndo
                    className="icons-style"
                    size={18}
                    title="Activate"
                    onClick={() => deactivate(row.id)}
                  />
                )
              ) : null
          }
        ]}
      />
      <MyModal open={open} setOpen={setOpen} title="Discount" size="56vw" bodyheight="68vh" actionButtonFunction={persist} content={
        <Form fluid className="coverage-form-grid">
          <MyInput required width="100%" fieldLabel="Discount type" fieldType="select" fieldName="discountType" record={record} setRecord={setRecord} selectData={discountTypes} />
          <MyInput required width="100%" fieldLabel="Value" fieldType="number" fieldName="discountValue" record={record} setRecord={setRecord} />
          <BillingCategoryItemFields open={open} record={record} setRecord={setRecord} />
          <MyInput required width="100%" fieldLabel="Encounter Type" fieldType="select" fieldName="encounterType" record={record} setRecord={setRecord} selectData={encounterTypes} />
        </Form>
      } />
    </>
  );
};

const exclusionTypeOptions = [
  { label: 'Category', value: 'CATEGORY' },
  { label: 'Diagnosis', value: 'DIAGNOSIS' }
];

const ExclusionPanel = ({
  classId,
  tpaId,
  readOnly
}: {
  classId?: number;
  tpaId?: number;
  readOnly?: boolean;
}) => {
  const dispatch = useAppDispatch();
  const encounterTypes = useEnumOptions('EncounterType');
  const yesNo = useEnumOptions('YesNoQuestion', { exclude: ['NOT_YET_DETERMINED'] });
  const [isActive, setIsActive] = useState<boolean | ''>('');
  const [paging, setPaging] = useState(emptyPage);
  const [open, setOpen] = useState(false);
  const [record, setRecord] = useState<any>({});
  const owner = tpaId ? { tpaId } : { classId: Number(classId) };
  const { data, isFetching } = useListExclusionsQuery({
    ...owner,
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
    ...paging
  });
  const [create] = useCreateExclusionMutation();
  const [deactivate] = useDeactivateExclusionMutation();

  const persist = async () => {
    if (!record.exclusionType) {
      notifyWarning(dispatch, 'Excluded type is required');
      return;
    }
    if (record.exclusionType === 'CATEGORY' && !record.billingItemType) {
      notifyWarning(dispatch, 'Category is required');
      return;
    }
    if (
      record.exclusionType === 'DIAGNOSIS' &&
      !record.allDiagnoses &&
      (record.diagnosisId == null || record.diagnosisId === '')
    ) {
      notifyWarning(dispatch, 'Diagnosis is required');
      return;
    }
    const billingItemType =
      record.exclusionType === 'CATEGORY' && record.billingItemType !== 'ALL'
        ? record.billingItemType
        : null;
    const itemId =
      record.exclusionType === 'CATEGORY' && record.itemId != null && record.itemId !== ''
        ? Number(record.itemId)
        : null;
    try {
      await create({
        ...owner,
        body: {
          exclusionType:
            record.exclusionType === 'DIAGNOSIS'
              ? 'DIAGNOSIS'
              : billingItemType
                ? itemId
                  ? 'SERVICE'
                  : 'CATEGORY'
                : 'ALL',
          billingItemType,
          serviceId: Number.isFinite(itemId as number) ? itemId : null,
          serviceName: itemId ? record.itemName || null : null,
          allDiagnoses: record.exclusionType === 'DIAGNOSIS' ? Boolean(record.allDiagnoses) : false,
          diagnosisId:
            record.exclusionType === 'DIAGNOSIS' && !record.allDiagnoses
              ? record.diagnosisId
              : null,
          encounterType: record.encounterType,
          excludedResult: record.excludedResult
        }
      }).unwrap();
      notifySuccess(dispatch, 'Exclusion added');
      setOpen(false);
    } catch (error: any) {
      notifyError(dispatch, error, 'Unable to add exclusion');
    }
  };

  return (
    <>
      <RuleToolbar
        readOnly={readOnly}
        includeAll
        isActive={isActive}
        setIsActive={setIsActive}
        onAdd={() => {
        setRecord({
          exclusionType: 'CATEGORY',
          encounterType: 'ALL',
          excludedResult: 'YES',
          allDiagnoses: false,
          billingItemType: null,
          itemId: null
        });
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
          { key: 'exclusionType', title: 'Excluded type', flexGrow: 2, render: (row: any) => exclusionTypeLabel(row) },
          { key: 'serviceName', title: 'Result', flexGrow: 2, render: (row: any) => exclusionResultLabel(row) },
          { key: 'encounterType', title: 'Encounter Type', flexGrow: 2, render: (row: any) => formatEnumString(row.encounterType) },
          { key: 'excludedResult', title: 'Excluded Result', flexGrow: 1, render: (row: any) => formatEnumString(row.excludedResult) },
          { key: 'isActive', title: 'Status', flexGrow: 1, render: (row: any) => (row.isActive ? 'Active' : 'Inactive') },
          {
            key: 'actions',
            title: '',
            flexGrow: 1,
            render: (row: any) =>
              !readOnly ? (
                row.isActive ? (
                  <MdToggleOff
                    className="icons-style"
                    size={24}
                    title="Deactivate"
                    onClick={() => deactivate(row.id)}
                  />
                ) : (
                  <FaUndo
                    className="icons-style"
                    size={18}
                    title="Activate"
                    onClick={() => deactivate(row.id)}
                  />
                )
              ) : null
          }
        ]}
      />
      <MyModal open={open} setOpen={setOpen} title="Exclusion" size="56vw" bodyheight="68vh" actionButtonFunction={persist} content={
        <Form fluid className="coverage-form-grid">
          <MyInput
            required
            width="100%"
            fieldLabel="Excluded type"
            fieldType="select"
            fieldName="exclusionType"
            record={record}
            setRecord={(next: any) => {
              if (next?.exclusionType !== record.exclusionType) {
                setRecord({
                  ...next,
                  billingItemType: null,
                  itemId: null,
                  itemName: null,
                  allDiagnoses: false,
                  diagnosisId: null
                });
                return;
              }
              setRecord(next);
            }}
            selectData={exclusionTypeOptions}
            selectDataLabel="label"
            selectDataValue="value"
            searchable={false}
          />
          {record.exclusionType === 'CATEGORY' && (
            <BillingCategoryItemFields open={open} record={record} setRecord={setRecord} />
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

const PreApprovalPanel = ({
  classId,
  tpaId,
  readOnly
}: {
  classId?: number;
  tpaId?: number;
  readOnly?: boolean;
}) => {
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
  const owner = tpaId ? { tpaId } : { classId: Number(classId) };
  const { data, isFetching } = useListPreApprovalsQuery({ ...owner, isActive, ...paging });
  const itemsQuery = useListPreApprovalItemsQuery(
    { preApprovalId: Number(selected?.id), isActive: true, page: 0, size: 10 },
    { skip: !selected?.id }
  );
  const [save] = useSavePreApprovalMutation();
  const [createItem] = useCreatePreApprovalItemMutation();
  const [deactivateItem] = useDeactivatePreApprovalItemMutation();

  const persist = async () => {
    try {
      await save({ ...owner, body: record }).unwrap();
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
      <RuleToolbar readOnly={readOnly} isActive={isActive} setIsActive={setIsActive} onAdd={() => {
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
            render: (row: any) =>
              readOnly ? null : (
                <MdModeEdit className="icons-style" size={22} onClick={() => { setRecord(row); setOpen(true); }} />
              )
          }
        ]}
      />
      {selected?.id && (
        <div className="coverage-nested-block">
          <div className="coverage-nested-title">
            <Translate>Pre-approval items</Translate>
            {!readOnly && selected.isActive && (
              <MyButton prefixIcon={() => <AddOutlineIcon />} color="var(--deep-blue)" width="109px" onClick={() => {
                setItem({ itemType: 'ALL', allDiagnoses: false });
                setItemOpen(true);
              }}>
                Add
              </MyButton>
            )}
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
                  !readOnly && row.isActive ? (
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

export { DiscountPanel, ExclusionPanel, PreApprovalPanel };
export default CoverageRulePanels;
