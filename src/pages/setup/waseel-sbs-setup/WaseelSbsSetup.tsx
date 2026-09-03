import React, { useEffect, useMemo, useState } from 'react';
import './styles.less';

import { Form, Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdCheckCircle, MdDelete, MdEdit } from 'react-icons/md';

import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

import { useAppDispatch, useAppSelector } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';

import { useGetActiveServicesByFacilityQuery } from '@/services/setup/serviceService';
import { useGetBrandMedicationsByIsActiveQuery } from '@/services/setup/brandmedication/BrandMedicationService';
import { useGetActiveDiagnosticTestsByTypeQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetActiveProceduresByFacilityQuery } from '@/services/setup/procedure/procedureService';

import {
  useImportSbsExcelMutation,
  useSearchSbsQuery,
  useCreateItemMappingMutation,
  useSearchItemMappingsQuery,
  useDeactivateItemMappingMutation,
  useUpdateItemMappingMutation
} from '@/services/waseel-integration/waseelSbsSetupService';

import type { WaseelItemMapping, WaseelSbsCatalog } from '@/types/model-types-new';

type ItemOption = {
  id: number;
  name: string;
  code?: string;
  internalCode?: string;
  displayName: string;
  original: any;
};

type MappingForm = {
  itemType: string;
  sourceId: number | null;
  itemCode: string;
  itemName: string;
  sbsCatalogId: number | null;
  isActive: boolean;
  notes: string;
};

const itemTypeOptions = [
  { label: 'Medication', value: 'MEDICATION' },
  { label: 'Laboratory', value: 'LABORATORY' },
  { label: 'Radiology', value: 'RADIOLOGY' },
  { label: 'Service', value: 'SERVICE' },
  { label: 'Procedure', value: 'PROCEDURE' }
];

const normalizePageData = (response: any) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.content)) return response.content;
  return [];
};

const normalizeItemOptions = (items: any[]): ItemOption[] => {
  return items.map(item => {
    const name =
      item?.name ??
      item?.brandName ??
      item?.displayName ??
      item?.description ??
      item?.shortDescription ??
      '';

    const code =
      item?.code ??
      item?.internalCode ??
      item?.itemCode ??
      item?.sku ??
      '';

    return {
      id: item?.id,
      name,
      code,
      internalCode: item?.internalCode,
      displayName: code ? `${name} - ${code}` : name,
      original: item
    };
  });
};

const WaseelSbsSetup = () => {
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);

  const selectedFacilityId =
    authSlice?.selectedDepartment?.facilityId ?? authSlice?.tenant?.selectedFacility?.id;

  const [activeTab, setActiveTab] = useState<'SBS' | 'MAPPING'>('SBS');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchFilters, setSearchFilters] = useState({ search: '' });
  const [appliedSearch, setAppliedSearch] = useState('');

  const [mappingFilters, setMappingFilters] = useState({
    itemType: '',
    itemName: '',
    itemCode: '',
    sbsCode: ''
  });

  const [appliedMappingFilters, setAppliedMappingFilters] = useState({
    itemType: '',
    itemName: '',
    itemCode: '',
    sbsCode: ''
  });

  const [openMappingModal, setOpenMappingModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<WaseelItemMapping | null>(null);
  const [editingMapping, setEditingMapping] = useState<WaseelItemMapping | null>(null);

  const [mappingForm, setMappingForm] = useState<MappingForm>({
    itemType: '',
    sourceId: null,
    itemCode: '',
    itemName: '',
    sbsCatalogId: null,
    isActive: true,
    notes: ''
  });
  const [sbsDropdownSearch, setSbsDropdownSearch] = useState('');
  const [appliedSbsDropdownSearch, setAppliedSbsDropdownSearch] = useState('');
  const [sbsDropdownPage, setSbsDropdownPage] = useState(0);
  const [sbsDropdownCache, setSbsDropdownCache] = useState<WaseelSbsCatalog[]>([]);
  const [servicePage, setServicePage] = useState(0);
  const [serviceCache, setServiceCache] = useState<ItemOption[]>([]);
  const [medicationPage, setMedicationPage] = useState(0);
  const [medicationCache, setMedicationCache] = useState<ItemOption[]>([]);
  const [laboratoryPage, setLaboratoryPage] = useState(0);
  const [laboratoryCache, setLaboratoryCache] = useState<ItemOption[]>([]);
  const [radiologyPage, setRadiologyPage] = useState(0);
  const [radiologyCache, setRadiologyCache] = useState<ItemOption[]>([]);
  const [procedurePage, setProcedurePage] = useState(0);
  const [procedureCache, setProcedureCache] = useState<ItemOption[]>([]);

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });

  const [mappingPaginationParams, setMappingPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });

  const { data: sbsResponse, isFetching: isSbsFetching, refetch: refetchSbs } =
    useSearchSbsQuery({
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort,
      search: appliedSearch
    });

  const { data: mappingResponse, isFetching: isMappingFetching } =
    useSearchItemMappingsQuery({
      page: mappingPaginationParams.page,
      size: mappingPaginationParams.size,
      sort: mappingPaginationParams.sort,
      itemType: appliedMappingFilters.itemType || undefined,
      itemName: appliedMappingFilters.itemName || undefined,
      itemCode: appliedMappingFilters.itemCode || undefined,
      sbsCode: appliedMappingFilters.sbsCode || undefined
    });

  const { data: sbsDropdownResponse, isFetching: isFetchingSbsDropdown } =
    useSearchSbsQuery({
      page: sbsDropdownPage,
      size: 50,
      search: appliedSbsDropdownSearch,
      sort: 'sbsCode,asc',
      activeOnly: true
    }, {
      skip: !openMappingModal
    });

  const { data: activeServicesResponse, isFetching: isFetchingServices } =
    useGetActiveServicesByFacilityQuery(
      {
        facilityId: selectedFacilityId,
        page: servicePage,
        size: 50,
        sort: 'id,asc'
      },
      {
        skip: !openMappingModal || !selectedFacilityId || mappingForm.itemType !== 'SERVICE'
      }
    );

  const { data: medicationsResponse, isFetching: isFetchingMedications } =
    useGetBrandMedicationsByIsActiveQuery(
      {
        isActive: true,
        page: medicationPage,
        size: 50,
        sort: 'id,asc'
      },
      {
        skip: !openMappingModal || mappingForm.itemType !== 'MEDICATION'
      }
    );

  const { data: laboratoryResponse, isFetching: isFetchingLaboratory } =
    useGetActiveDiagnosticTestsByTypeQuery(
      {
        type: 'LABORATORY',
        page: laboratoryPage,
        size: 50,
        sort: 'id,asc'
      },
      {
        skip: !openMappingModal || mappingForm.itemType !== 'LABORATORY'
      }
    );

  const { data: radiologyResponse, isFetching: isFetchingRadiology } =
    useGetActiveDiagnosticTestsByTypeQuery(
      {
        type: 'RADIOLOGY',
        page: radiologyPage,
        size: 50,
        sort: 'id,asc'
      },
      {
        skip: !openMappingModal || mappingForm.itemType !== 'RADIOLOGY'
      }
    );

  const { data: proceduresResponse, isFetching: isFetchingProcedures } =
    useGetActiveProceduresByFacilityQuery(
      {
        facilityId: selectedFacilityId,
        page: procedurePage,
        size: 50,
        sort: 'id,asc'
      },
      {
        skip: !openMappingModal || !selectedFacilityId || mappingForm.itemType !== 'PROCEDURE'
      }
    );

  const [importSbsExcel, { isLoading: importing }] = useImportSbsExcelMutation();
  const [createItemMapping, { isLoading: creatingMapping }] = useCreateItemMappingMutation();
  const [updateItemMapping, { isLoading: updatingMapping }] = useUpdateItemMappingMutation();
  const [deactivateItemMapping] = useDeactivateItemMappingMutation();
  const isSavingMapping = creatingMapping || updatingMapping;

  const itemSelectConfig = useMemo(() => {
    switch (mappingForm.itemType) {
      case 'MEDICATION':
        return {
          fieldLabel: 'Medication',
          selectData: medicationCache,
          loading: isFetchingMedications,
          hasMore:
            Boolean(medicationsResponse?.links?.next) ||
            Number(medicationsResponse?.totalCount ?? 0) > medicationCache.length,
          onFetchMore: () => setMedicationPage(prev => prev + 1)
        };

      case 'LABORATORY':
        return {
          fieldLabel: 'Laboratory',
          selectData: laboratoryCache,
          loading: isFetchingLaboratory,
          hasMore:
            Boolean(laboratoryResponse?.links?.next) ||
            Number(laboratoryResponse?.totalCount ?? 0) > laboratoryCache.length,
          onFetchMore: () => setLaboratoryPage(prev => prev + 1)
        };

      case 'RADIOLOGY':
        return {
          fieldLabel: 'Radiology',
          selectData: radiologyCache,
          loading: isFetchingRadiology,
          hasMore:
            Boolean(radiologyResponse?.links?.next) ||
            Number(radiologyResponse?.totalCount ?? 0) > radiologyCache.length,
          onFetchMore: () => setRadiologyPage(prev => prev + 1)
        };

      case 'SERVICE':
        return {
          fieldLabel: 'Service',
          selectData: serviceCache,
          loading: isFetchingServices,
          hasMore:
            Boolean(activeServicesResponse?.links?.next) ||
            Number(activeServicesResponse?.totalCount ?? 0) > serviceCache.length,
          onFetchMore: () => setServicePage(prev => prev + 1)
        };

      case 'PROCEDURE':
        return {
          fieldLabel: 'Procedure',
          selectData: procedureCache,
          loading: isFetchingProcedures,
          hasMore:
            Boolean(proceduresResponse?.links?.next) ||
            Number(proceduresResponse?.totalCount ?? 0) > procedureCache.length,
          onFetchMore: () => setProcedurePage(prev => prev + 1)
        };

      default:
        return null;
    }
  }, [
    mappingForm.itemType,
    medicationsResponse?.links?.next,
    medicationsResponse?.totalCount,
    laboratoryResponse?.links?.next,
    laboratoryResponse?.totalCount,
    radiologyResponse?.links?.next,
    radiologyResponse?.totalCount,
    activeServicesResponse?.links?.next,
    activeServicesResponse?.totalCount,
    proceduresResponse?.links?.next,
    proceduresResponse?.totalCount,
    isFetchingMedications,
    isFetchingLaboratory,
    isFetchingRadiology,
    isFetchingServices,
    isFetchingProcedures,
    medicationCache.length,
    laboratoryCache.length,
    radiologyCache.length,
    serviceCache.length,
    procedureCache.length
  ]);

  const sbsDropdownOptions = useMemo(() => {
    return sbsDropdownCache.map((item: WaseelSbsCatalog) => ({
      ...item,
      sbsDisplay: `${item.waseelItemType ?? ''} - ${item.sbsCode ?? ''} - ${item.shortDescription ?? ''}`
    }));
  }, [sbsDropdownCache]);

  const hasMoreSbsDropdown =
    ((sbsDropdownResponse?.number ?? 0) + 1) <
    (sbsDropdownResponse?.totalPages ?? 0);
  useEffect(() => {
    dispatch(setPageCode('WASEEL_SBS_SETUP'));
    dispatch(setDivContent('Waseel SBS Setup'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    const delay = setTimeout(() => {
      setAppliedSearch(searchFilters.search.trim());
      setPaginationParams(prev => ({ ...prev, page: 0 }));
    }, 300);

    return () => clearTimeout(delay);
  }, [searchFilters.search]);

  useEffect(() => {
    const delay = setTimeout(() => {
      setAppliedSbsDropdownSearch(sbsDropdownSearch.trim());
      setSbsDropdownPage(0);
      setSbsDropdownCache([]);
    }, 300);

    return () => clearTimeout(delay);
  }, [sbsDropdownSearch]);

  useEffect(() => {
    if (!openMappingModal) return;
    setSbsDropdownSearch('');
    setAppliedSbsDropdownSearch('');
    setSbsDropdownPage(0);
    setSbsDropdownCache([]);
    setServicePage(0);
    setServiceCache([]);
    setMedicationPage(0);
    setMedicationCache([]);
    setLaboratoryPage(0);
    setLaboratoryCache([]);
    setRadiologyPage(0);
    setRadiologyCache([]);
    setProcedurePage(0);
    setProcedureCache([]);
  }, [openMappingModal]);

  useEffect(() => {
    const rows = normalizePageData(activeServicesResponse);
    const options = normalizeItemOptions(rows);
    setServiceCache(prev => {
      if (servicePage === 0) return options;
      const existing = new Set(prev.map(item => Number(item.id)));
      const merged = [...prev];
      options.forEach(item => {
        if (!existing.has(Number(item.id))) merged.push(item);
      });
      return merged;
    });
  }, [activeServicesResponse, servicePage]);

  useEffect(() => {
    const rows = normalizePageData(medicationsResponse);
    const options = normalizeItemOptions(rows);
    setMedicationCache(prev => {
      if (medicationPage === 0) return options;
      const existing = new Set(prev.map(item => Number(item.id)));
      const merged = [...prev];
      options.forEach(item => {
        if (!existing.has(Number(item.id))) merged.push(item);
      });
      return merged;
    });
  }, [medicationsResponse, medicationPage]);

  useEffect(() => {
    const rows = normalizePageData(laboratoryResponse);
    const options = normalizeItemOptions(rows);
    setLaboratoryCache(prev => {
      if (laboratoryPage === 0) return options;
      const existing = new Set(prev.map(item => Number(item.id)));
      const merged = [...prev];
      options.forEach(item => {
        if (!existing.has(Number(item.id))) merged.push(item);
      });
      return merged;
    });
  }, [laboratoryResponse, laboratoryPage]);

  useEffect(() => {
    const rows = normalizePageData(radiologyResponse);
    const options = normalizeItemOptions(rows);
    setRadiologyCache(prev => {
      if (radiologyPage === 0) return options;
      const existing = new Set(prev.map(item => Number(item.id)));
      const merged = [...prev];
      options.forEach(item => {
        if (!existing.has(Number(item.id))) merged.push(item);
      });
      return merged;
    });
  }, [radiologyResponse, radiologyPage]);

  useEffect(() => {
    const rows = normalizePageData(proceduresResponse);
    const options = normalizeItemOptions(rows);
    setProcedureCache(prev => {
      if (procedurePage === 0) return options;
      const existing = new Set(prev.map(item => Number(item.id)));
      const merged = [...prev];
      options.forEach(item => {
        if (!existing.has(Number(item.id))) merged.push(item);
      });
      return merged;
    });
  }, [proceduresResponse, procedurePage]);

  useEffect(() => {
    const rows = sbsDropdownResponse?.content ?? [];
    setSbsDropdownCache(prev => {
      if (sbsDropdownPage === 0) return rows;
      const existing = new Set(prev.map(item => Number(item.id)));
      const merged = [...prev];
      rows.forEach(item => {
        if (!existing.has(Number(item.id))) merged.push(item);
      });
      return merged;
    });
  }, [sbsDropdownResponse?.content, sbsDropdownPage]);

  const handleImport = async () => {
    if (!selectedFile) {
      dispatch(notify({ msg: 'Please select SBS Excel file first', sev: 'warning' }));
      return;
    }

    try {
      dispatch(showSystemLoader());

      const result = await importSbsExcel(selectedFile).unwrap();

      dispatch(
        notify({
          msg: `Import done. Total: ${result.totalRows}, Success: ${result.successRows}, Failed: ${result.failedRows}`,
          sev: result.failedRows > 0 ? 'warning' : 'success'
        })
      );

      setSelectedFile(null);
      refetchSbs();
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.message || error?.data?.detail || 'Failed to import SBS file',
          sev: 'warning'
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const buildMappingRequestBody = () => ({
    itemType: mappingForm.itemType,
    sourceId: Number(mappingForm.sourceId),
    itemCode: mappingForm.itemCode,
    itemName: mappingForm.itemName,
    sbsCatalogId: Number(mappingForm.sbsCatalogId),
    isActive: mappingForm.isActive,
    notes: mappingForm.notes
  });

  const handleOpenMappingModal = () => {
    setEditingMapping(null);
    setMappingForm({
      itemType: '',
      sourceId: null,
      itemCode: '',
      itemName: '',
      sbsCatalogId: null,
      isActive: true,
      notes: ''
    });

    setOpenMappingModal(true);
  };

  const handleOpenEditMapping = (row: WaseelItemMapping) => {
    setEditingMapping(row);
    setMappingForm({
      itemType: row.itemType ?? '',
      sourceId: row.sourceId ?? null,
      itemCode: row.itemCode ?? '',
      itemName: row.itemName ?? '',
      sbsCatalogId: row.sbsCatalogId ?? null,
      isActive: row.isActive ?? true,
      notes: row.notes ?? ''
    });

    if (row.sbsCatalogId) {
      setSbsDropdownCache([
        {
          id: row.sbsCatalogId,
          sbsCode: row.sbsCode,
          shortDescription: row.sbsDescription,
          waseelItemType: row.waseelItemType,
          isActive: true
        } as WaseelSbsCatalog
      ]);
    }

    setOpenMappingModal(true);
  };

  const handleSaveMapping = async () => {
    if (!mappingForm.itemType || !mappingForm.sourceId || !mappingForm.sbsCatalogId) {
      dispatch(
        notify({
          msg: 'Category, Item, and SBS Code are required',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      dispatch(showSystemLoader());

      const body = buildMappingRequestBody();

      if (editingMapping?.id) {
        await updateItemMapping({
          id: editingMapping.id,
          body
        }).unwrap();
        dispatch(notify({ msg: 'Mapping updated successfully', sev: 'success' }));
      } else {
        await createItemMapping(body).unwrap();
        dispatch(notify({ msg: 'Mapping saved successfully', sev: 'success' }));
      }

      setEditingMapping(null);
      setOpenMappingModal(false);
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.message || error?.data?.detail || 'Failed to save mapping',
          sev: 'warning'
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const handleActivateMapping = async (row: WaseelItemMapping) => {
    if (!row.id || !row.itemType || row.sourceId == null || !row.sbsCatalogId) {
      return;
    }

    try {
      dispatch(showSystemLoader());

      await updateItemMapping({
        id: row.id,
        body: {
          itemType: row.itemType,
          sourceId: Number(row.sourceId),
          itemCode: row.itemCode,
          itemName: row.itemName,
          sbsCatalogId: Number(row.sbsCatalogId),
          isActive: true,
          notes: row.notes
        }
      }).unwrap();

      dispatch(notify({ msg: 'Mapping activated successfully', sev: 'success' }));
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.message || error?.data?.detail || 'Failed to activate mapping',
          sev: 'warning'
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const handleDeactivateMapping = async () => {
    if (!selectedMapping?.id) return;

    try {
      dispatch(showSystemLoader());

      await deactivateItemMapping(selectedMapping.id).unwrap();

      dispatch(notify({ msg: 'Mapping deactivated successfully', sev: 'success' }));
      setOpenDeleteModal(false);
    } catch {
      dispatch(notify({ msg: 'Failed to deactivate mapping', sev: 'warning' }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const sbsColumns = [
    {
      key: 'waseelItemType',
      title: <Translate>Waseel Type</Translate>,
      flexGrow: 2
    },
    {
      key: 'sbsCode',
      title: <Translate>SBS Code</Translate>,
      flexGrow: 2
    },
    {
      key: 'shortDescription',
      title: <Translate>Short Description</Translate>,
      flexGrow: 4
    },
    {
      key: 'longDescription',
      title: <Translate>Long Description</Translate>,
      flexGrow: 5
    },
    {
      key: 'updateType',
      title: <Translate>Update Type</Translate>,
      flexGrow: 1
    },
    {
      key: 'isActive',
      title: <Translate>Active</Translate>,
      flexGrow: 1,
      render: (rowData: WaseelSbsCatalog) => <span>{rowData.isActive ? 'Yes' : 'No'}</span>
    }
  ];

  const mappingColumns = [
    {
      key: 'itemType',
      title: <Translate>Category</Translate>,
      flexGrow: 2
    },
    {
      key: 'itemName',
      title: <Translate>Item Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'itemCode',
      title: <Translate>Item Code</Translate>,
      flexGrow: 2
    },
    {
      key: 'sbsCode',
      title: <Translate>SBS Code</Translate>,
      flexGrow: 2
    },
    {
      key: 'sbsDescription',
      title: <Translate>SBS Description</Translate>,
      flexGrow: 4
    },
    {
      key: 'isActive',
      title: <Translate>Active</Translate>,
      flexGrow: 1,
      render: (rowData: WaseelItemMapping) => <span>{rowData.isActive ? 'Yes' : 'No'}</span>
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      flexGrow: 2,
      render: (rowData: WaseelItemMapping) => (
        <div className="container-of-icons">
          <MdEdit
            className="icons-style"
            title="Edit"
            size={23}
            fill="var(--primary-gray)"
            onClick={() => handleOpenEditMapping(rowData)}
          />

          {!rowData.isActive ? (
            <MdCheckCircle
              className="icons-style"
              title="Activate"
              size={23}
              fill="var(--primary-green, #28a745)"
              onClick={() => {
                void handleActivateMapping(rowData);
              }}
            />
          ) : (
            <MdDelete
              className="icons-style"
              title="Deactivate"
              size={23}
              fill="var(--primary-pink)"
              onClick={() => {
                setSelectedMapping(rowData);
                setOpenDeleteModal(true);
              }}
            />
          )}
        </div>
      )
    }
  ];

  const sbsFilters = () => (
    <Form fluid className="form-of-filters-set-up waseel-sbs-filters">
      <MyInput
        width="18vw"
        fieldName="search"
        fieldType="text"
        record={searchFilters}
        setRecord={setSearchFilters}
        showLabel={false}
        placeholder="Search SBS Code / Description"
      />

      <AdvancedSearchFilters
        clearOnClick={() => {
          setSearchFilters({ search: '' });
          setAppliedSearch('');
        }}
      />

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
      />

      <MyButton
        onClick={handleImport}
        loading={importing}
        disabled={!selectedFile}
        color="var(--deep-blue)"
      >
        Import SBS
      </MyButton>
    </Form>
  );

  const isEditMode = Boolean(editingMapping?.id);


  const mappingModalContent = (
    <Form fluid className="waseel-mapping-form">
      <MyInput
        required
        fieldLabel="Category"
        fieldType="select"
        fieldName="itemType"
        selectData={itemTypeOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={mappingForm}
        setRecord={val =>
          setMappingForm({
            ...val,
            sourceId: null,
            itemCode: '',
            itemName: ''
          })
        }
        width="100%"
        searchable={false}
        disabled={isEditMode}
      />

      {isEditMode ? (
        <>
          <MyInput
            fieldLabel="Item Name"
            fieldType="text"
            fieldName="itemName"
            record={mappingForm}
            setRecord={setMappingForm}
            width="100%"
            disabled
          />
          <MyInput
            fieldLabel="Item Code"
            fieldType="text"
            fieldName="itemCode"
            record={mappingForm}
            setRecord={setMappingForm}
            width="100%"
            disabled
          />
        </>
      ) : (
        itemSelectConfig && (
          <MyInput
            key={mappingForm.itemType}
            required
            fieldLabel={itemSelectConfig.fieldLabel}
            fieldType="selectPagination"
            fieldName="sourceId"
            selectData={itemSelectConfig.selectData}
            selectDataLabel="displayName"
            selectDataValue="id"
            record={mappingForm}
            setRecord={setMappingForm}
            width="100%"
            searchable
            loading={itemSelectConfig.loading}
            hasMore={itemSelectConfig.hasMore}
            onFetchMore={itemSelectConfig.onFetchMore}
            onSelectItem={(selectedItem: ItemOption | null) => {
              const original = selectedItem?.original ?? selectedItem;
              setMappingForm(prev => ({
                ...prev,
                sourceId: selectedItem?.id ?? null,
                itemCode: original?.code ?? original?.internalCode ?? '',
                itemName: original?.name ?? original?.brandName ?? ''
              }));
            }}
          />
        )
      )}

      <MyInput
        required
        fieldLabel="SBS Code"
        fieldType="selectPagination"
        fieldName="sbsCatalogId"
        selectData={sbsDropdownOptions}
        selectDataLabel="sbsDisplay"
        selectDataValue="id"
        record={mappingForm}
        setRecord={setMappingForm}
        width="100%"
        searchKeyWard={sbsDropdownSearch}
        setSearchKeyWard={setSbsDropdownSearch}
        loading={isFetchingSbsDropdown}
        hasMore={hasMoreSbsDropdown}
        onFetchMore={() => {
          if (!isFetchingSbsDropdown && hasMoreSbsDropdown) {
            setSbsDropdownPage(prev => prev + 1);
          }
        }}
        placeholder="Search SBS Code / Type / Description"
        onSelectItem={(selectedSbs: WaseelSbsCatalog) => {
          setMappingForm(prev => ({
            ...prev,
            sbsCatalogId: selectedSbs?.id ?? null,
          }));
        }}
      />

      <MyInput
        fieldType="checkbox"
        fieldLabel="Active"
        fieldName="isActive"
        record={mappingForm}
        setRecord={setMappingForm}
        width="100%"
      />

      <MyInput
        fieldName="notes"
        fieldLabel="Notes"
        fieldType="textarea"
        record={mappingForm}
        setRecord={setMappingForm}
        width="100%"
      />
    </Form>
  );


  const mappingFiltersContent = () => (
    <Form fluid className="form-of-filters-set-up waseel-sbs-filters">
      <MyInput
        fieldName="itemType"
        fieldLabel="Category"
        fieldType="select"
        selectData={itemTypeOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={mappingFilters}
        setRecord={setMappingFilters}
        width="18vw"
        showLabel={false}
        placeholder="Search Category"
        searchable={false}
      />

      <MyInput
        fieldName="itemName"
        fieldLabel="Item Name"
        fieldType="text"
        record={mappingFilters}
        setRecord={setMappingFilters}
        width="18vw"
        showLabel={false}
        placeholder="Search Item Name"
      />

      <MyInput
        fieldName="itemCode"
        fieldLabel="Item Code"
        fieldType="text"
        record={mappingFilters}
        setRecord={setMappingFilters}
        width="18vw"
        showLabel={false}
        placeholder="Search Item Code"
      />

      <MyInput
        fieldName="sbsCode"
        fieldLabel="SBS Code"
        fieldType="text"
        record={mappingFilters}
        setRecord={setMappingFilters}
        width="18vw"
        showLabel={false}
        placeholder="Search SBS Code"
      />

      <AdvancedSearchFilters
        showAdvancedButton={false}
        searchOnClick={() => {
          setAppliedMappingFilters({
            itemType: mappingFilters.itemType,
            itemName: mappingFilters.itemName.trim(),
            itemCode: mappingFilters.itemCode.trim(),
            sbsCode: mappingFilters.sbsCode.trim()
          });

          setMappingPaginationParams(prev => ({
            ...prev,
            page: 0
          }));
        }}
        clearOnClick={() => {
          setMappingFilters({
            itemType: '',
            itemName: '',
            itemCode: '',
            sbsCode: ''
          });

          setAppliedMappingFilters({
            itemType: '',
            itemName: '',
            itemCode: '',
            sbsCode: ''
          });

          setMappingPaginationParams(prev => ({
            ...prev,
            page: 0
          }));
        }}
      />
    </Form>
  );

  return (
    <Panel>
      <div className="waseel-sbs-tabs">
        <MyButton
          appearance={activeTab === 'SBS' ? 'primary' : 'subtle'}
          onClick={() => setActiveTab('SBS')}
        >
          SBS Catalog
        </MyButton>

        <MyButton
          appearance={activeTab === 'MAPPING' ? 'primary' : 'subtle'}
          onClick={() => setActiveTab('MAPPING')}
        >
          Item Mapping
        </MyButton>
      </div>

      {activeTab === 'SBS' && (
        <MyTable
          data={sbsResponse?.content ?? []}
          totalCount={sbsResponse?.totalElements ?? 0}
          loading={isSbsFetching}
          columns={sbsColumns}
          filters={sbsFilters()}
          page={paginationParams.page}
          rowsPerPage={paginationParams.size}
          onPageChange={(_event, newPage) =>
            setPaginationParams(prev => ({ ...prev, page: newPage }))
          }
          onRowsPerPageChange={e =>
            setPaginationParams(prev => ({
              ...prev,
              size: Number(e.target.value),
              page: 0
            }))
          }
        />
      )}

      {activeTab === 'MAPPING' && (
        <MyTable
          data={mappingResponse?.data ?? []}
          totalCount={mappingResponse?.totalCount ?? 0}
          loading={isMappingFetching}
          columns={mappingColumns}
          filters={mappingFiltersContent()}
          page={mappingPaginationParams.page}
          rowsPerPage={mappingPaginationParams.size}
          onPageChange={(_event, newPage) =>
            setMappingPaginationParams(prev => ({
              ...prev,
              page: newPage
            }))
          }
          onRowsPerPageChange={e =>
            setMappingPaginationParams(prev => ({
              ...prev,
              size: Number(e.target.value),
              page: 0
            }))
          }
          tableButtons={
            <div className="container-of-add-new-button">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={handleOpenMappingModal}
                width="130px"
              >
                Add Mapping
              </MyButton>
            </div>
          }
        />
      )}

      <MyModal
        open={openMappingModal}
        setOpen={open => {
          setOpenMappingModal(open);
          if (!open) {
            setEditingMapping(null);
          }
        }}
        title={isEditMode ? 'Edit Waseel Item Mapping' : 'Add Waseel Item Mapping'}
        actionButtonLabel={isEditMode ? 'Update' : 'Save'}
        actionButtonLoading={isSavingMapping}
        actionButtonFunction={handleSaveMapping}
        position="right"
        size="32vw"
        bodyheight="80vh"
        content={mappingModalContent}
      />

      <DeletionConfirmationModal
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
        itemToDelete="Waseel Item Mapping"
        actionButtonFunction={handleDeactivateMapping}
        actionType="deactivate"
      />
    </Panel>
  );
};

export default WaseelSbsSetup;