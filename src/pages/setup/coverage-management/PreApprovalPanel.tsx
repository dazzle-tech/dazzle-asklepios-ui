import React, { useMemo, useState } from 'react';
import { Form } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit, MdToggleOff } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import { useEnumOptions } from '@/services/enumsApi';
import { formatEnumString } from '@/utils';
import { useAppDispatch } from '@/hooks';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  useListPreApprovalsQuery,
  useSavePreApprovalMutation,
  useSearchCoverageDepartmentsQuery,
  useSearchCoverageFacilitiesQuery,
  useTogglePreApprovalActiveMutation
} from '@/services/setup/coverageManagement/coverageManagementService';
import CoveragePagedSelect, { useLookupPaging } from './CoveragePagedSelect';
import BillingCategoryItemFields from './BillingCategoryItemFields';
import { notifyError, notifySuccess, notifyWarning } from './coverageHelpers';

const emptyPage = { page: 0, size: 10, sort: 'id,desc' };

const LOV_BY_SOURCE: Record<string, string> = {
  LABORATORY: 'LAB_CATEGORIES',
  RADIOLOGY: 'RAD_CATEGORIES',
  PATHOLOGY: 'PATH_CATEGORY'
};

const ENUM_BY_SOURCE: Record<string, string> = {
  PROCEDURE: 'ProcedureCategory',
  SERVICE: 'ServiceCategory'
};

const blankTarget = {
  approvalScope: 'FACILITY',
  encounterType: 'ALL',
  valueType: 'PERCENTAGE',
  targetLevel: 'FACILITY',
  source: null,
  sourceId: null,
  subcategoryKey: null
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
  const valueTypes = useEnumOptions('InsuranceCoverageType');
  const levels = useEnumOptions('CoveragePreApprovalLevel');
  const [isActive, setIsActive] = useState(true);
  const [paging, setPaging] = useState(emptyPage);
  const [open, setOpen] = useState(false);
  const [record, setRecord] = useState<any>({});
  const facilityLookup = useLookupPaging(String(open));
  const departmentLookup = useLookupPaging(`${record.facilityId || ''}-${open}`);
  const departmentRequired =
    record.targetLevel === 'DEPARTMENT' ||
    (record.approvalScope === 'DEPARTMENT' && record.targetLevel !== 'FACILITY');

  const facilities = useSearchCoverageFacilitiesQuery(
    { page: facilityLookup.page, size: 15, search: facilityLookup.appliedSearch },
    { skip: !open }
  );
  const departments = useSearchCoverageDepartmentsQuery(
    {
      facilityId: Number(record.facilityId || 0),
      page: departmentLookup.page,
      size: 15,
      search: departmentLookup.appliedSearch
    },
    { skip: !open || !record.facilityId || !departmentRequired }
  );
  const owner = tpaId ? { tpaId } : { classId: Number(classId) };
  const { data, isFetching } = useListPreApprovalsQuery({ ...owner, isActive, ...paging });
  const [save] = useSavePreApprovalMutation();
  const [toggleActive] = useTogglePreApprovalActiveMutation();

  const persist = async () => {
    if (!record.targetLevel) {
      notifyWarning(dispatch, 'Level is required');
      return;
    }
    if (!record.valueType) {
      notifyWarning(dispatch, 'Value type is required');
      return;
    }
    if (record.limitValue == null || Number(record.limitValue) <= 0) {
      notifyWarning(dispatch, 'Limit value must be greater than zero');
      return;
    }
    if (record.valueType === 'PERCENTAGE' && Number(record.limitValue) > 100) {
      notifyWarning(dispatch, 'Percentage limit cannot be greater than 100');
      return;
    }
    if (record.targetLevel !== 'DEPARTMENT' && record.targetLevel !== 'FACILITY' && !record.source) {
      notifyWarning(dispatch, 'Category is required');
      return;
    }
    if (record.targetLevel === 'SUBCATEGORY' && !record.subcategoryKey) {
      notifyWarning(dispatch, 'Subcategory is required');
      return;
    }
    if (record.targetLevel === 'ITEM' && !record.sourceId) {
      notifyWarning(dispatch, 'Item is required');
      return;
    }
    const body = {
      id: record.id,
      approvalScope: departmentRequired ? 'DEPARTMENT' : 'FACILITY',
      facilityId: record.facilityId,
      departmentId: departmentRequired ? record.departmentId : null,
      encounterType: record.encounterType,
      valueType: record.valueType,
      limitValue: record.limitValue,
      targetLevel: record.targetLevel,
      source: record.targetLevel === 'DEPARTMENT' || record.targetLevel === 'FACILITY' ? null : record.source,
      sourceId: record.targetLevel === 'ITEM' ? record.sourceId : null,
      subcategoryKey: record.targetLevel === 'SUBCATEGORY' ? record.subcategoryKey : null,
      isActive: record.isActive
    };
    try {
      await save({ ...owner, body }).unwrap();
      notifySuccess(dispatch, record.id ? 'Pre-approval updated' : 'Pre-approval saved');
      setOpen(false);
    } catch (error: any) {
      notifyError(dispatch, error, 'Unable to save pre-approval');
    }
  };

  const changeStatus = async (row: any) => {
    try {
      await toggleActive(row.id).unwrap();
      notifySuccess(dispatch, row.isActive ? 'Pre-approval deactivated' : 'Pre-approval activated');
    } catch (error: any) {
      notifyError(dispatch, error, 'Unable to update pre-approval status');
    }
  };

  const setLevel = (next: any) => {
    const level = next?.targetLevel;
    if (level === record.targetLevel) {
      setRecord(next);
      return;
    }
    setRecord({
      ...next,
      approvalScope: level === 'DEPARTMENT' ? 'DEPARTMENT' : 'FACILITY',
      departmentId: level === 'DEPARTMENT' ? next.departmentId : null,
      source: null,
      sourceId: null,
      subcategoryKey: null
    });
  };

  return (
    <>
      <div className="coverage-rule-toolbar">
        <Form fluid>
          <MyInput
            width="160px"
            fieldLabel="Status"
            fieldType="select"
            fieldName="isActive"
            record={{ isActive }}
            setRecord={(next: any) => setIsActive(Boolean(next.isActive))}
            selectData={[
              { label: 'Active', value: true },
              { label: 'Inactive', value: false }
            ]}
            selectDataLabel="label"
            selectDataValue="value"
            searchable={false}
          />
        </Form>
        {!readOnly && (
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={() => {
              setRecord({ ...blankTarget });
              setOpen(true);
            }}
            width="109px"
          >
            Add
          </MyButton>
        )}
      </div>
      <MyTable
        data={data?.data ?? []}
        totalCount={data?.totalCount ?? 0}
        loading={isFetching}
        height={420}
        page={paging.page}
        rowsPerPage={paging.size}
        onPageChange={(_e: any, page: number) => setPaging(prev => ({ ...prev, page }))}
        onRowsPerPageChange={(e: any) => setPaging(prev => ({ ...prev, size: Number(e.target.value), page: 0 }))}
        columns={[
          { key: 'approvalScope', title: 'Approval type', flexGrow: 2, render: (row: any) => formatEnumString(row.approvalScope) },
          { key: 'facilityName', title: 'Facility', flexGrow: 2 },
          { key: 'departmentName', title: 'Department', flexGrow: 2 },
          { key: 'encounterType', title: 'Encounter Type', flexGrow: 2, render: (row: any) => formatEnumString(row.encounterType) },
          { key: 'targetLevel', title: 'Level', flexGrow: 2, render: (row: any) => formatEnumString(row.targetLevel) },
          { key: 'scopeLabel', title: 'Scope', flexGrow: 3, render: (row: any) => row.scopeLabel || '-' },
          { key: 'valueType', title: 'Value Type', flexGrow: 1, render: (row: any) => formatEnumString(row.valueType) },
          { key: 'limitValue', title: 'Limit Value', flexGrow: 1 },
          { key: 'isActive', title: 'Status', flexGrow: 1, render: (row: any) => (row.isActive ? 'Active' : 'Inactive') },
          {
            key: 'actions',
            title: '',
            flexGrow: 1,
            render: (row: any) => (
              !readOnly && (
                <div className="coverage-row-actions">
                  <MdModeEdit
                    className="icons-style"
                    size={22}
                    title="Edit"
                    onClick={event => {
                      event.stopPropagation();
                      setRecord({
                        ...row,
                        itemName: row.targetLevel === 'ITEM' ? row.scopeLabel : null
                      });
                      setOpen(true);
                    }}
                  />
                  {row.isActive ? (
                    <MdToggleOff
                      className="icons-style"
                      size={24}
                      title="Deactivate"
                      onClick={event => {
                        event.stopPropagation();
                        changeStatus(row);
                      }}
                    />
                  ) : (
                    <FaUndo
                      className="icons-style"
                      size={18}
                      title="Activate"
                      onClick={event => {
                        event.stopPropagation();
                        changeStatus(row);
                      }}
                    />
                  )}
                </div>
              )
            )
          }
        ]}
      />
      <MyModal
        open={open}
        setOpen={setOpen}
        title={record.id ? 'Edit Pre-Approval' : 'Pre-Approval'}
        size="56vw"
        bodyheight="72vh"
        actionButtonFunction={persist}
        content={
          <Form fluid className="coverage-form-grid">
            <MyInput
              required
              width="100%"
              fieldLabel="Level"
              fieldType="select"
              fieldName="targetLevel"
              record={record}
              setRecord={setLevel}
              selectData={levels}
            />
            <MyInput
              required
              width="100%"
              fieldLabel="Approval type"
              fieldType="select"
              fieldName="approvalScope"
              record={record}
              setRecord={(next: any) =>
                setRecord({
                  ...next,
                  departmentId: next.approvalScope === 'FACILITY' && record.targetLevel !== 'DEPARTMENT'
                    ? null
                    : next.departmentId
                })
              }
              selectData={scopes}
              disabled={record.targetLevel === 'DEPARTMENT' || record.targetLevel === 'FACILITY'}
            />
            <CoveragePagedSelect
              fieldName="facilityId"
              fieldLabel="Facility name"
              record={record}
              setRecord={next => setRecord({ ...next, departmentId: undefined })}
              result={facilities}
              page={facilityLookup.page}
              setPage={facilityLookup.setPage}
              search={facilityLookup.search}
              setSearch={facilityLookup.setSearch}
              required
            />
            {departmentRequired && (
              <CoveragePagedSelect
                fieldName="departmentId"
                fieldLabel="Department name"
                record={record}
                setRecord={setRecord}
                result={departments}
                page={departmentLookup.page}
                setPage={departmentLookup.setPage}
                search={departmentLookup.search}
                setSearch={departmentLookup.setSearch}
                required
                disabled={!record.facilityId}
              />
            )}
            <MyInput
              required
              width="100%"
              fieldLabel="Encounter type"
              fieldType="select"
              fieldName="encounterType"
              record={record}
              setRecord={setRecord}
              selectData={encounterTypes}
            />
            {record.targetLevel && record.targetLevel !== 'DEPARTMENT' && record.targetLevel !== 'FACILITY' && (
              <PreApprovalSourceFields open={open} record={record} setRecord={setRecord} />
            )}
            <MyInput
              required
              width="100%"
              fieldLabel="Value type"
              fieldType="select"
              fieldName="valueType"
              record={record}
              setRecord={setRecord}
              selectData={valueTypes}
            />
            <MyInput
              required
              width="100%"
              fieldLabel="Limit Value"
              fieldType="number"
              fieldName="limitValue"
              record={record}
              setRecord={setRecord}
            />
          </Form>
        }
      />
    </>
  );
};

const PreApprovalSourceFields = ({
  open,
  record,
  setRecord
}: {
  open: boolean;
  record: any;
  setRecord: React.Dispatch<React.SetStateAction<any>>;
}) => {
  const categories = useEnumOptions('BillingItemTypes', {
    exclude: record.targetLevel === 'SUBCATEGORY' ? ['MEDICATION'] : []
  });
  const lovCode = LOV_BY_SOURCE[record.source];
  const enumName = ENUM_BY_SOURCE[record.source];
  const { data: lovResponse } = useGetLovValuesByCodeQuery(lovCode, { skip: !lovCode || record.targetLevel !== 'SUBCATEGORY' });
  const enumOptions = useEnumOptions(enumName || 'ServiceCategory');
  const subcategoryOptions = useMemo(() => {
    if (lovCode) {
      return (lovResponse?.object ?? [])
        .filter((row: any) => row?.isValid !== false)
        .map((row: any) => ({ value: row.key, label: row.lovDisplayVale }));
    }
    if (enumName) {
      return enumOptions;
    }
    return [];
  }, [lovCode, lovResponse, enumName, enumOptions]);

  const setSource = (next: any) => {
    if (next?.source === record.source) {
      setRecord(next);
      return;
    }
    setRecord({ ...next, sourceId: null, subcategoryKey: null, itemName: null });
  };

  if (record.targetLevel === 'ITEM') {
    return (
      <BillingCategoryItemFields
        open={open}
        includeAll={false}
        record={{ ...record, billingItemType: record.source, itemId: record.sourceId }}
        setRecord={(next: any) =>
          setRecord((prev: any) => {
            const resolved =
              typeof next === 'function'
                ? next({ ...prev, billingItemType: prev.source, itemId: prev.sourceId })
                : next;
            return {
              ...prev,
              source: resolved?.billingItemType ?? null,
              sourceId: resolved?.itemId ?? null,
              itemName: resolved?.itemName ?? null,
              subcategoryKey: null
            };
          })
        }
        categoryField="billingItemType"
        itemField="itemId"
        nameField="itemName"
      />
    );
  }

  return (
    <>
      <MyInput
        required
        width="100%"
        fieldLabel="Category"
        fieldType="select"
        fieldName="source"
        record={record}
        setRecord={setSource}
        selectData={categories}
        searchable={false}
      />
      {record.targetLevel === 'SUBCATEGORY' && record.source && (
        <MyInput
          required
          width="100%"
          fieldLabel="Subcategory"
          fieldType="select"
          fieldName="subcategoryKey"
          record={record}
          setRecord={setRecord}
          selectData={subcategoryOptions}
          selectDataLabel="label"
          selectDataValue="value"
          searchable
        />
      )}
    </>
  );
};

export default PreApprovalPanel;
