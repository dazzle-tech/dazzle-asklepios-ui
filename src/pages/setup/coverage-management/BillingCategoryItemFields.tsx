import React, { useEffect, useMemo, useState } from 'react';
import MyInput from '@/components/MyInput';
import { useEnumOptions } from '@/services/enumsApi';
import { useAppSelector } from '@/hooks';
import {
  useGetActiveServicesByFacilityQuery,
  useGetServicesByNameQuery
} from '@/services/setup/serviceService';
import {
  useGetBrandMedicationsByIsActiveQuery,
  useGetBrandMedicationsByNameQuery
} from '@/services/setup/brandmedication/BrandMedicationService';
import {
  useGetActiveDiagnosticTestsByTypeQuery,
  useGetAllDiagnosticTestsByNameAndTypeQuery
} from '@/services/setup/diagnosticTest/diagnosticTestService';
import {
  useGetActiveProceduresByFacilityQuery,
  useGetProceduresByNameQuery
} from '@/services/setup/procedure/procedureService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

const LOV_BY_SOURCE: Record<string, string> = {
  LABORATORY: 'LAB_CATEGORIES',
  RADIOLOGY: 'RAD_CATEGORIES',
  PATHOLOGY: 'PATH_CATEGORY'
};

const ENUM_BY_SOURCE: Record<string, string> = {
  PROCEDURE: 'ProcedureCategory',
  SERVICE: 'ServiceCategory'
};

const ITEM_LABELS: Record<string, string> = {
  MEDICATION: 'Medication',
  LABORATORY: 'Laboratory Test',
  RADIOLOGY: 'Radiology Test',
  SERVICE: 'Service',
  PROCEDURE: 'Procedure'
};

type Props = {
  open: boolean;
  record: any;
  setRecord: React.Dispatch<React.SetStateAction<any>>;
  includeAll?: boolean;
  categoryField?: string;
  itemField?: string;
  nameField?: string;
  showSubcategory?: boolean;
  subcategoryField?: string;
};

const itemNameOf = (item: any) =>
  String(item?.name ?? item?.brandName ?? item?.code ?? '').trim() || null;

const BillingCategoryItemFields = ({
  open,
  record,
  setRecord,
  includeAll = true,
  categoryField = 'billingItemType',
  itemField = 'itemId',
  nameField = 'itemName',
  showSubcategory = false,
  subcategoryField = 'subcategoryKey'
}: Props) => {
  const auth = useAppSelector(state => state.auth);
  const selectedFacilityId =
    auth?.selectedDepartment?.facilityId ?? auth?.tenant?.selectedFacility?.id;

  const billingItemTypeOptions = useEnumOptions('BillingItemTypes', { exclude: ['PATHOLOGY'] });
  const categoryOptions = useMemo(
    () => (includeAll ? [{ value: 'ALL', label: 'All' }, ...billingItemTypeOptions] : billingItemTypeOptions),
    [billingItemTypeOptions, includeAll]
  );

  const [selectPage, setSelectPage] = useState(0);
  const [selectSearch, setSelectSearch] = useState('');
  const [debouncedSelectSearch, setDebouncedSelectSearch] = useState('');
  const [selectData, setSelectData] = useState<any[]>([]);
  const [selectedSelectItem, setSelectedSelectItem] = useState<any>(null);

  const category = record?.[categoryField];
  const selectedItemId = record?.[itemField];
  const selectedItemName = record?.[nameField];
  const showItems = Boolean(category && category !== 'ALL');
  const lovCode = showSubcategory ? LOV_BY_SOURCE[category] : undefined;
  const enumName = showSubcategory ? ENUM_BY_SOURCE[category] : undefined;
  const { data: lovResponse } = useGetLovValuesByCodeQuery(lovCode, { skip: !lovCode });
  const enumOptions = useEnumOptions(enumName || 'ServiceCategory');
  const subcategorySupported = Boolean(showSubcategory && (lovCode || enumName));
  const subcategoryOptions = useMemo(() => {
    if (!subcategorySupported) {
      return [];
    }
    if (lovCode) {
      return (lovResponse?.object ?? [])
        .filter((row: any) => row?.isValid !== false)
        .map((row: any) => ({ value: row.key, label: row.lovDisplayVale }));
    }
    if (enumName) {
      return enumOptions;
    }
    return [];
  }, [subcategorySupported, lovCode, lovResponse, enumName, enumOptions]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSelectSearch(selectSearch.trim()), 300);
    return () => clearTimeout(timer);
  }, [selectSearch]);

  useEffect(() => {
    setSelectPage(0);
    setSelectSearch('');
    setDebouncedSelectSearch('');
    setSelectData([]);
    setSelectedSelectItem(null);
  }, [category]);

  useEffect(() => {
    setSelectedSelectItem(current =>
      current?.id != null && String(current.id) === String(selectedItemId) ? current : null
    );
  }, [selectedItemId]);

  const skipType = (type: string) => !open || !showItems || category !== type;
  const skipList = (type: string) => skipType(type) || Boolean(debouncedSelectSearch);
  const skipSearch = (type: string) => skipType(type) || !debouncedSelectSearch;

  const { data: medicationsResponse, isFetching: isFetchingMedications } =
    useGetBrandMedicationsByIsActiveQuery(
      { isActive: true, page: selectPage, size: 5, sort: 'id,asc' },
      { skip: skipList('MEDICATION') }
    );
  const { data: medicationsSearchResponse, isFetching: isFetchingMedicationsSearch } =
    useGetBrandMedicationsByNameQuery(
      { name: debouncedSelectSearch, page: selectPage, size: 20, sort: 'id,asc' },
      { skip: skipSearch('MEDICATION') }
    );

  const { data: laboratoryResponse, isFetching: isFetchingLaboratory } =
    useGetActiveDiagnosticTestsByTypeQuery(
      { type: 'LABORATORY', page: selectPage, size: 5, sort: 'id,asc' },
      { skip: skipList('LABORATORY') }
    );
  const { data: laboratorySearchResponse, isFetching: isFetchingLaboratorySearch } =
    useGetAllDiagnosticTestsByNameAndTypeQuery(
      { type: 'LABORATORY', name: debouncedSelectSearch, page: selectPage, size: 20, sort: 'id,asc' },
      { skip: skipSearch('LABORATORY') }
    );

  const { data: radiologyResponse, isFetching: isFetchingRadiology } =
    useGetActiveDiagnosticTestsByTypeQuery(
      { type: 'RADIOLOGY', page: selectPage, size: 5, sort: 'id,asc' },
      { skip: skipList('RADIOLOGY') }
    );
  const { data: radiologySearchResponse, isFetching: isFetchingRadiologySearch } =
    useGetAllDiagnosticTestsByNameAndTypeQuery(
      { type: 'RADIOLOGY', name: debouncedSelectSearch, page: selectPage, size: 20, sort: 'id,asc' },
      { skip: skipSearch('RADIOLOGY') }
    );

  const { data: activeServicesResponse, isFetching: isFetchingServices } =
    useGetActiveServicesByFacilityQuery(
      { facilityId: selectedFacilityId, page: selectPage, size: 5, sort: 'id,asc' },
      { skip: skipList('SERVICE') || !selectedFacilityId }
    );
  const { data: servicesSearchResponse, isFetching: isFetchingServicesSearch } =
    useGetServicesByNameQuery(
      { name: debouncedSelectSearch, page: selectPage, size: 20, sort: 'id,asc' },
      { skip: skipSearch('SERVICE') }
    );

  const { data: proceduresResponse, isFetching: isFetchingProcedures } =
    useGetActiveProceduresByFacilityQuery(
      { facilityId: selectedFacilityId, page: selectPage, size: 5, sort: 'id,asc' },
      { skip: skipList('PROCEDURE') || !selectedFacilityId }
    );
  const { data: proceduresSearchResponse, isFetching: isFetchingProceduresSearch } =
    useGetProceduresByNameQuery(
      { name: debouncedSelectSearch, page: selectPage, size: 20, sort: 'id,asc' },
      { skip: skipSearch('PROCEDURE') }
    );

  const currentSelectResponse = useMemo(() => {
    switch (category) {
      case 'MEDICATION':
        return debouncedSelectSearch ? medicationsSearchResponse : medicationsResponse;
      case 'LABORATORY':
        return debouncedSelectSearch ? laboratorySearchResponse : laboratoryResponse;
      case 'RADIOLOGY':
        return debouncedSelectSearch ? radiologySearchResponse : radiologyResponse;
      case 'SERVICE':
        return debouncedSelectSearch ? servicesSearchResponse : activeServicesResponse;
      case 'PROCEDURE':
        return debouncedSelectSearch ? proceduresSearchResponse : proceduresResponse;
      default:
        return null;
    }
  }, [
    category,
    debouncedSelectSearch,
    medicationsResponse,
    medicationsSearchResponse,
    laboratoryResponse,
    laboratorySearchResponse,
    radiologyResponse,
    radiologySearchResponse,
    activeServicesResponse,
    servicesSearchResponse,
    proceduresResponse,
    proceduresSearchResponse
  ]);

  const loading =
    isFetchingMedications ||
    isFetchingMedicationsSearch ||
    isFetchingLaboratory ||
    isFetchingLaboratorySearch ||
    isFetchingRadiology ||
    isFetchingRadiologySearch ||
    isFetchingServices ||
    isFetchingServicesSearch ||
    isFetchingProcedures ||
    isFetchingProceduresSearch;

  useEffect(() => {
    if (!currentSelectResponse?.data) {
      return;
    }
    const incomingData = debouncedSelectSearch
      ? currentSelectResponse.data.filter((item: any) => item?.isActive !== false)
      : currentSelectResponse.data;
    setSelectData(prev => {
      const combined = selectPage === 0 ? incomingData : [...prev, ...incomingData];
      return Array.from(
        new Map(
          combined.filter((item: any) => item?.id != null).map((item: any) => [String(item.id), item])
        ).values()
      );
    });
  }, [currentSelectResponse, debouncedSelectSearch, selectPage]);

  const selectDataWithSelectedItem = useMemo(() => {
    const current =
      selectedSelectItem?.id
        ? selectedSelectItem
        : selectedItemId
          ? { id: selectedItemId, name: selectedItemName || `Item #${selectedItemId}` }
          : null;
    if (!current?.id) {
      return selectData;
    }
    const exists = selectData.some(row => String(row?.id) === String(current.id));
    return exists ? selectData : [current, ...selectData];
  }, [selectData, selectedSelectItem, selectedItemId, selectedItemName]);

  return (
    <>
      <MyInput
        required
        width="100%"
        fieldLabel="Category"
        fieldType="select"
        fieldName={categoryField}
        record={record}
        setRecord={(next: any) => {
          const nextCategory = next?.[categoryField];
          if (nextCategory !== category) {
            setRecord({
              ...next,
              [itemField]: null,
              [nameField]: null,
              [subcategoryField]: null
            });
            return;
          }
          setRecord(next);
        }}
        selectData={categoryOptions}
        selectDataLabel="label"
        selectDataValue="value"
        searchable={false}
        placeholder="Select"
      />
      {subcategorySupported && (
        <MyInput
          width="100%"
          fieldLabel="Subcategory"
          fieldType="select"
          fieldName={subcategoryField}
          record={record}
          setRecord={(next: any) => {
            const nextKey = next?.[subcategoryField];
            if (nextKey !== record?.[subcategoryField]) {
              setRecord({
                ...next,
                [itemField]: null,
                [nameField]: null
              });
              return;
            }
            setRecord(next);
          }}
          selectData={subcategoryOptions}
          selectDataLabel="label"
          selectDataValue="value"
          searchable
          cleanable
          placeholder="Leave empty to apply to the whole category"
        />
      )}
      {showItems && (
        <MyInput
          width="100%"
          fieldLabel={ITEM_LABELS[category] || 'Item'}
          fieldType="selectPagination"
          fieldName={itemField}
          record={record}
          selectData={selectDataWithSelectedItem}
          selectDataLabel="name"
          selectDataValue="id"
          searchable
          cleanable
          setRecord={(next: any) => {
            if (next?.[itemField]) {
              setRecord({ ...next, [subcategoryField]: null });
              return;
            }
            setRecord(next);
          }}
          searchKeyWard={selectSearch}
          setSearchKeyWard={(value: string) => {
            setSelectSearch(value);
            setSelectPage(0);
            setSelectData([]);
          }}
          loading={loading}
          hasMore={currentSelectResponse?.links?.next != null}
          onFetchMore={() => {
            if (!loading && currentSelectResponse?.links?.next != null) {
              setSelectPage(prev => prev + 1);
            }
          }}
          placeholder={
            record?.[subcategoryField]
              ? 'Leave empty to apply to this subcategory'
              : 'Leave empty to apply to the whole category'
          }
          onSelectItem={(item: any) => {
            setSelectedSelectItem(item);
            setRecord((prev: any) => ({
              ...prev,
              [itemField]: item?.id ?? null,
              [nameField]: itemNameOf(item),
              [subcategoryField]: null
            }));
          }}
        />
      )}
    </>
  );
};

export default BillingCategoryItemFields;
