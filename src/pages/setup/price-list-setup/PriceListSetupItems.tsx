import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { Form } from 'rsuite';

import {
  MdDelete,
  MdModeEdit
} from 'react-icons/md';

import AddOutlineIcon from '@rsuite/icons/AddOutline';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
import FileUploadIcon from '@rsuite/icons/FileUpload';

import CodesExcelCsvImportModal from '@/components/CodesExcelCsvImportModal/CodesExcelCsvImportModal';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';

import MyTable, {
  ColumnConfig
} from '@/components/MyTable/MyTable';

import Translate from '@/components/Translate';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

import { useAppDispatch } from '@/hooks';

import {
  notify
} from '@/utils/uiReducerActions';

import {
  extractApiErrorMessage,
  PRICE_LIST_SETUP_ERROR_MAP
} from '@/utils/apiErrorMessage';

import {
  formatEnumString
} from '@/utils';

import {
  extractPaginationFromLink
} from '@/utils/paginationHelper';

import {
  useAddPriceListSetupItemMutation,
  useDeletePriceListSetupItemMutation,
  useGetPriceListSetupItemsQuery,
  useImportPriceListSetupItemsMutation,
  useLazyDownloadPriceListSetupItemsTemplateQuery,
  useLazyExportPriceListSetupItemsQuery,
  useUpdatePriceListSetupItemMutation
} from '@/services/setup/priceListSetup/priceListSetupService';

import {
  useSearchItemMappingsQuery
} from '@/services/waseel-integration/waseelSbsSetupService';

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

import type {
  PriceListItemType,
  PriceListSetupItem,
  PriceListSetupType,
  PriceListVisitType,
  PricingMethod,
  SavePriceListSetupItemRequest,
  WaseelItemMapping
} from '@/types/model-types-new';

import {
  newPriceListSetupItem
} from '@/types/model-types-constructor-new';
import { useEnumOptions } from '@/services/enumsApi';

type Props = {
  open: boolean;

  setOpen: (
    value: boolean
  ) => void;

  priceListSetupId:
  number | string;

  priceListName?: string;

  priceListType?:
  PriceListSetupType;

  facilityId?: number;
};

type MappingOption =
  WaseelItemMapping & {
    displayName: string;
  };

type ServiceProductOption = {
  id: number;

  name: string;

  code?: string;

  displayName: string;

  original: any;
};

const normalizePageData = (
  response: any
): any[] => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.content)) {
    return response.content;
  }

  return [];
};

const normalizeServiceProductOptions = (
  rows: any[]
): ServiceProductOption[] => {
  return rows
    .filter(row =>
      row?.id !== undefined &&
      row?.isActive !== false &&
      row?.active !== false
    )
    .map(row => {
      const name =
        row?.name ??
        row?.brandName ??
        row?.displayName ??
        row?.description ??
        row?.shortDescription ??
        '';

      const code =
        row?.code ??
        row?.internalCode ??
        row?.itemCode ??
        row?.sku ??
        '';

      return {
        id: Number(row.id),

        name,

        code,

        displayName:
          code
            ? `${name} - ${code}`
            : name,

        original: row
      };
    });
};

const createMappingOption = (
  mapping: WaseelItemMapping
): MappingOption => {
  const displayParts = [
    mapping.itemName,
    mapping.itemCode,
    mapping.sbsCode
  ].filter(Boolean);

  return {
    ...mapping,

    displayName:
      displayParts.join(' - ') ||
      `Mapping #${mapping.id}`
  };
};

const mergeOptions = (
  previous: ServiceProductOption[],
  incoming: ServiceProductOption[],
  page: number
): ServiceProductOption[] => {
  if (page === 0) {
    return incoming;
  }

  const existingIds =
    new Set(
      previous.map(
        item => Number(item.id)
      )
    );

  return [
    ...previous,

    ...incoming.filter(
      item =>
        !existingIds.has(
          Number(item.id)
        )
    )
  ];
};

const PriceListSetupItems: React.FC<Props> = ({
  open,
  setOpen,
  priceListSetupId,
  priceListName,
  priceListType,
  facilityId
}) => {
  const dispatch = useAppDispatch();

  const isInsurancePriceList =
    priceListType === 'INSURANCE';

  const isSelfPayPriceList =
    priceListType === 'SELF_PAY';

  const encounterTypeOptions = useEnumOptions('EncounterType', { exclude: ['ALL'] });
  const visitTypeOptions = [
    { label: 'All', value: 'ALL' },
    ...(encounterTypeOptions ?? [])
  ];

  const [
    childModalOpen,
    setChildModalOpen
  ] = useState(false);

  const [
    selectedItem,
    setSelectedItem
  ] = useState<PriceListSetupItem>({
    ...newPriceListSetupItem
  });

  const isEditItem = Boolean(selectedItem.id);

  const [
    selectedMapping,
    setSelectedMapping
  ] = useState<WaseelItemMapping | null>(
    null
  );

  const [
    deleteConfirmationOpen,
    setDeleteConfirmationOpen
  ] = useState(false);

  const [
    importModalOpen,
    setImportModalOpen
  ] = useState(false);

  const [
    tableHeight,
    setTableHeight
  ] = useState(560);

  const itemsPageRef = useRef<HTMLDivElement>(null);

  const [
    paginationParams,
    setPaginationParams
  ] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });

  const [
    searchFilters,
    setSearchFilters
  ] = useState<{
    search: string;
    itemType: string | null;
  }>({
    search: '',
    itemType: null
  });

  const [
    appliedFilters,
    setAppliedFilters
  ] = useState<{
    search?: string;
    itemType?: PriceListItemType;
  }>({});

  /*
   * Waseel mapping pagination.
   */
  const [
    mappingPage,
    setMappingPage
  ] = useState(0);

  const [
    mappingSearch,
    setMappingSearch
  ] = useState('');

  const [
    appliedMappingSearch,
    setAppliedMappingSearch
  ] = useState('');

  const [
    mappingCache,
    setMappingCache
  ] = useState<MappingOption[]>([]);

  const [
    mappingRefreshToken,
    setMappingRefreshToken
  ] = useState(0);

  /*
   * Non-insurance Service & Product pagination.
   */
  const [selectPage, setSelectPage] = useState(0);
  const [selectSearch, setSelectSearch] = useState('');
  const [debouncedSelectSearch, setDebouncedSelectSearch] = useState('');
  const [selectedDirectItem, setSelectedDirectItem] =
    useState<ServiceProductOption | null>(null);
  const [selectData, setSelectData] = useState<ServiceProductOption[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSelectSearch(selectSearch.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [selectSearch]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let frame = 0;
    let observer: ResizeObserver | undefined;

    const measure = (node: HTMLDivElement) => {
      const header = node.querySelector('.price-list-items-header');
      const filters = node.querySelector('.my-table-filters');
      const pagination = node.querySelector('.MuiTablePagination-root');
      const used =
        (header instanceof HTMLElement ? header.offsetHeight : 0) +
        (filters instanceof HTMLElement ? filters.offsetHeight : 0) +
        (pagination instanceof HTMLElement ? pagination.offsetHeight : 56) +
        8;

      setTableHeight(Math.max(360, node.clientHeight - used));
    };

    const attach = () => {
      const node = itemsPageRef.current;

      if (!node) {
        frame = window.requestAnimationFrame(attach);
        return;
      }

      measure(node);
      observer = new ResizeObserver(() => measure(node));
      observer.observe(node);
    };

    attach();

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [open]);

  /*
   * Existing price-list items.
   */
  const {
    data: itemPage,
    isFetching,
    refetch
  } = useGetPriceListSetupItemsQuery(
    {
      priceListSetupId,
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort,
      ...(appliedFilters.search
        ? { search: appliedFilters.search }
        : {}),
      ...(appliedFilters.itemType
        ? { itemType: appliedFilters.itemType }
        : {})
    },
    {
      skip:
        !open ||
        !priceListSetupId
    }
  );

  /*
   * Insurance mapping query.
   */
  const {
    data: mappingResponse,
    isFetching: loadingMappings
  } = useSearchItemMappingsQuery(
    {
      page: mappingPage,
      size: 50,
      sort: 'itemName,asc',

      search:
        appliedMappingSearch ||
        undefined,

      itemType:
        selectedItem.itemType ||
        undefined,

      refreshToken:
        mappingRefreshToken
    },
    {
      skip:
        !open ||
        !childModalOpen ||
        !isInsurancePriceList ||
        !selectedItem.itemType
    }
  );

  const {
    data: activeServicesResponse,
    isFetching: isFetchingServices
  } = useGetActiveServicesByFacilityQuery(
    {
      facilityId: Number(facilityId),
      page: selectPage,
      size: 20,
      sort: 'name,asc'
    },
    {
      skip:
        !open ||
        !childModalOpen ||
        isInsurancePriceList ||
        !facilityId ||
        selectedItem.itemType !== 'SERVICE' ||
        Boolean(debouncedSelectSearch)
    }
  );

  const {
    data: servicesSearchResponse,
    isFetching: isFetchingServicesSearch
  } = useGetServicesByNameQuery(
    {
      name: debouncedSelectSearch,
      page: selectPage,
      size: 20,
      sort: 'name,asc'
    },
    {
      skip:
        !open ||
        !childModalOpen ||
        isInsurancePriceList ||
        selectedItem.itemType !== 'SERVICE' ||
        !debouncedSelectSearch
    }
  );

  const {
    data: medicationsResponse,
    isFetching: isFetchingMedications
  } = useGetBrandMedicationsByIsActiveQuery(
    {
      isActive: true,
      page: selectPage,
      size: 20,
      sort: 'id,asc'
    },
    {
      skip:
        !open ||
        !childModalOpen ||
        isInsurancePriceList ||
        selectedItem.itemType !== 'MEDICATION' ||
        Boolean(debouncedSelectSearch)
    }
  );

  const {
    data: medicationsSearchResponse,
    isFetching: isFetchingMedicationsSearch
  } = useGetBrandMedicationsByNameQuery(
    {
      name: debouncedSelectSearch,
      page: selectPage,
      size: 20,
      sort: 'id,asc'
    },
    {
      skip:
        !open ||
        !childModalOpen ||
        isInsurancePriceList ||
        selectedItem.itemType !== 'MEDICATION' ||
        !debouncedSelectSearch
    }
  );

  const {
    data: laboratoryResponse,
    isFetching: isFetchingLaboratory
  } = useGetActiveDiagnosticTestsByTypeQuery(
    {
      type: 'LABORATORY',
      page: selectPage,
      size: 20,
      sort: 'name,asc'
    },
    {
      skip:
        !open ||
        !childModalOpen ||
        isInsurancePriceList ||
        selectedItem.itemType !== 'LABORATORY' ||
        Boolean(debouncedSelectSearch)
    }
  );

  const {
    data: laboratorySearchResponse,
    isFetching: isFetchingLaboratorySearch
  } = useGetAllDiagnosticTestsByNameAndTypeQuery(
    {
      type: 'LABORATORY',
      name: debouncedSelectSearch,
      page: selectPage,
      size: 20,
      sort: 'name,asc'
    },
    {
      skip:
        !open ||
        !childModalOpen ||
        isInsurancePriceList ||
        selectedItem.itemType !== 'LABORATORY' ||
        !debouncedSelectSearch
    }
  );

  const {
    data: radiologyResponse,
    isFetching: isFetchingRadiology
  } = useGetActiveDiagnosticTestsByTypeQuery(
    {
      type: 'RADIOLOGY',
      page: selectPage,
      size: 20,
      sort: 'name,asc'
    },
    {
      skip:
        !open ||
        !childModalOpen ||
        isInsurancePriceList ||
        selectedItem.itemType !== 'RADIOLOGY' ||
        Boolean(debouncedSelectSearch)
    }
  );

  const {
    data: radiologySearchResponse,
    isFetching: isFetchingRadiologySearch
  } = useGetAllDiagnosticTestsByNameAndTypeQuery(
    {
      type: 'RADIOLOGY',
      name: debouncedSelectSearch,
      page: selectPage,
      size: 20,
      sort: 'name,asc'
    },
    {
      skip:
        !open ||
        !childModalOpen ||
        isInsurancePriceList ||
        selectedItem.itemType !== 'RADIOLOGY' ||
        !debouncedSelectSearch
    }
  );

  const {
    data: pathologyResponse,
    isFetching: isFetchingPathology
  } = useGetActiveDiagnosticTestsByTypeQuery(
    {
      type: 'PATHOLOGY',
      page: selectPage,
      size: 20,
      sort: 'name,asc'
    },
    {
      skip:
        !open ||
        !childModalOpen ||
        isInsurancePriceList ||
        selectedItem.itemType !== 'PATHOLOGY' ||
        Boolean(debouncedSelectSearch)
    }
  );

  const {
    data: pathologySearchResponse,
    isFetching: isFetchingPathologySearch
  } = useGetAllDiagnosticTestsByNameAndTypeQuery(
    {
      type: 'PATHOLOGY',
      name: debouncedSelectSearch,
      page: selectPage,
      size: 20,
      sort: 'name,asc'
    },
    {
      skip:
        !open ||
        !childModalOpen ||
        isInsurancePriceList ||
        selectedItem.itemType !== 'PATHOLOGY' ||
        !debouncedSelectSearch
    }
  );

  const {
    data: proceduresResponse,
    isFetching: isFetchingProcedures
  } = useGetActiveProceduresByFacilityQuery(
    {
      facilityId: Number(facilityId),
      page: selectPage,
      size: 20,
      sort: 'name,asc'
    },
    {
      skip:
        !open ||
        !childModalOpen ||
        isInsurancePriceList ||
        !facilityId ||
        selectedItem.itemType !== 'PROCEDURE' ||
        Boolean(debouncedSelectSearch)
    }
  );

  const {
    data: proceduresSearchResponse,
    isFetching: isFetchingProceduresSearch
  } = useGetProceduresByNameQuery(
    {
      name: debouncedSelectSearch,
      page: selectPage,
      size: 20,
      sort: 'name,asc'
    },
    {
      skip:
        !open ||
        !childModalOpen ||
        isInsurancePriceList ||
        selectedItem.itemType !== 'PROCEDURE' ||
        !debouncedSelectSearch
    }
  );

  const currentSelectResponse = useMemo(() => {
    switch (selectedItem.itemType) {
      case 'MEDICATION':
        return debouncedSelectSearch
          ? medicationsSearchResponse
          : medicationsResponse;

      case 'LABORATORY':
        return debouncedSelectSearch
          ? laboratorySearchResponse
          : laboratoryResponse;

      case 'RADIOLOGY':
        return debouncedSelectSearch
          ? radiologySearchResponse
          : radiologyResponse;

      case 'PATHOLOGY':
        return debouncedSelectSearch
          ? pathologySearchResponse
          : pathologyResponse;

      case 'SERVICE':
        return debouncedSelectSearch
          ? servicesSearchResponse
          : activeServicesResponse;

      case 'PROCEDURE':
        return debouncedSelectSearch
          ? proceduresSearchResponse
          : proceduresResponse;

      default:
        return null;
    }
  }, [
    selectedItem.itemType,
    debouncedSelectSearch,

    medicationsResponse,
    medicationsSearchResponse,

    laboratoryResponse,
    laboratorySearchResponse,

    radiologyResponse,
    radiologySearchResponse,

    pathologyResponse,
    pathologySearchResponse,

    activeServicesResponse,
    servicesSearchResponse,

    proceduresResponse,
    proceduresSearchResponse
  ]);


  useEffect(() => {
    if (!currentSelectResponse?.data) {
      return;
    }

    const incomingRows = normalizeServiceProductOptions(
      normalizePageData(currentSelectResponse)
    );

    setSelectData(previous => {
      if (selectPage === 0) {
        return incomingRows;
      }

      const existingIds = new Set(
        previous.map(item => Number(item.id))
      );

      return [
        ...previous,
        ...incomingRows.filter(
          item => !existingIds.has(Number(item.id))
        )
      ];
    });
  }, [
    currentSelectResponse,
    selectPage
  ]);




  const [
    addPriceListItem,
    {
      isLoading: isAdding
    }
  ] =
    useAddPriceListSetupItemMutation();

  const [
    updatePriceListItem,
    {
      isLoading: isUpdating
    }
  ] =
    useUpdatePriceListSetupItemMutation();

  const [
    deletePriceListItem
  ] =
    useDeletePriceListSetupItemMutation();

  const [
    downloadItemsTemplate
  ] =
    useLazyDownloadPriceListSetupItemsTemplateQuery();

  const [
    exportItems
  ] =
    useLazyExportPriceListSetupItemsQuery();

  const [
    importItems
  ] =
    useImportPriceListSetupItemsMutation();

  const actionLoading =
    isAdding ||
    isUpdating;

  const downloadBlob = (
    blob: Blob,
    fileName: string
  ) => {
    const url =
      window.URL.createObjectURL(blob);
    const link =
      document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate =
    async () => {
      if (!priceListSetupId) {
        return;
      }

      try {
        const blob =
          await downloadItemsTemplate({
            priceListSetupId
          }).unwrap();

        downloadBlob(
          blob,
          'price-list-items-template.xlsx'
        );
      } catch (error: any) {
        dispatch(
          notify({
            msg:
              extractApiErrorMessage(
                error,
                PRICE_LIST_SETUP_ERROR_MAP
              ) ||
              'Failed to download the template',
            sev: 'error'
          })
        );
      }
    };

  const handleExportItems =
    async () => {
      if (!priceListSetupId) {
        return;
      }

      try {
        const blob =
          await exportItems({
            priceListSetupId
          }).unwrap();

        downloadBlob(
          blob,
          `price-list-items-${priceListSetupId}.xlsx`
        );
      } catch (error: any) {
        dispatch(
          notify({
            msg:
              extractApiErrorMessage(
                error,
                PRICE_LIST_SETUP_ERROR_MAP
              ) ||
              'Failed to export price-list items',
            sev: 'error'
          })
        );
      }
    };

  const handleImportItems = async (
    file: File
  ) => {
    try {
    const result =
      await importItems({
        priceListSetupId,
        file
      }).unwrap();

    const failureSummary =
      result.errors
        ?.slice(0, 3)
        .map(error =>
          `Row ${error.rowNumber}${
            error.itemCode
              ? ` (${error.itemCode})`
              : ''
          }: ${error.message}`
        )
        .join(' | ');

    dispatch(
      notify({
        msg:
          result.failed > 0
            ? `Imported ${result.inserted} new and ${result.updated} updated items. ${result.failed} row(s) failed.${
                failureSummary
                  ? ` ${failureSummary}`
                  : ''
              }`
            : `Imported successfully. Added ${result.inserted}, updated ${result.updated}.`,
        sev:
          result.failed > 0
            ? 'warning'
            : 'success'
      })
    );

    await refetch();
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            extractApiErrorMessage(
              error,
              PRICE_LIST_SETUP_ERROR_MAP
            ) ||
            'Failed to import price-list items',
          sev: 'error'
        })
      );

      throw error;
    }
  };

  const tableData = useMemo(
    () => itemPage?.data ?? [],
    [itemPage?.data]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setSearchFilters({
      search: '',
      itemType: null
    });
    setAppliedFilters({});
    setPaginationParams({
      page: 0,
      size: 15,
      sort: 'id,asc'
    });
  }, [open, priceListSetupId]);

  useEffect(() => {
    const delay =
      setTimeout(() => {
        setAppliedFilters({
          search:
            searchFilters.search.trim() ||
            undefined,
          itemType:
            (searchFilters.itemType as
              PriceListItemType) ||
            undefined
        });

        setPaginationParams(
          previous => ({
            ...previous,
            page: 0
          })
        );
      }, 300);

    return () =>
      clearTimeout(delay);
  }, [
    searchFilters.search,
    searchFilters.itemType
  ]);

  const typeOptions = useEnumOptions('PriceListItemType');


  /*
   * Insurance mapping helpers.
   */
  const normalizeMappingRows = (
    response: any
  ): WaseelItemMapping[] => {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.content)) {
      return response.content;
    }

    return [];
  };

  const mappingTotalPages = Number(
    mappingResponse?.totalPages ?? 0
  );

  const mappingNextLink =
    mappingResponse?.links?.next ??
    null;

  const mappingTotalCount =
    Number(
      mappingResponse?.totalCount ??
      0
    );

  const hasMoreMappings =
    mappingTotalPages > 0 &&
    mappingPage + 1 < mappingTotalPages;
  useEffect(() => {
    const timeout =
      setTimeout(() => {
        setAppliedMappingSearch(
          mappingSearch.trim()
        );

        setMappingPage(0);
        setMappingCache([]);
      }, 300);

    return () =>
      clearTimeout(timeout);
  }, [mappingSearch]);

  useEffect(() => {
    const rows =
      normalizeMappingRows(
        mappingResponse
      );

    const filteredRows = rows.filter(
      mapping =>
        mapping.itemType ===
        selectedItem.itemType
    );

    const options = filteredRows.map(
      createMappingOption
    );

    setMappingCache(previous => {
      if (mappingPage === 0) {
        return options;
      }

      const existingIds = new Set(
        previous.map(
          item => Number(item.id)
        )
      );

      return [
        ...previous,
        ...options.filter(
          item =>
            !existingIds.has(
              Number(item.id)
            )
        )
      ];
    });
  }, [
    mappingResponse,
    mappingPage
  ]);

  const mappingSelectData = useMemo(() => {
    const filteredCache =
      mappingCache
        .filter(
          item =>
            item.itemType ===
            selectedItem.itemType
        )
        .map(createMappingOption);

    if (
      !selectedMapping?.id ||
      selectedMapping.itemType !==
      selectedItem.itemType
    ) {
      return filteredCache;
    }

    const exists = filteredCache.some(
      item =>
        Number(item.id) ===
        Number(selectedMapping.id)
    );

    if (exists) {
      return filteredCache;
    }

    return [
      createMappingOption(selectedMapping),
      ...filteredCache
    ];
  }, [
    mappingCache,
    selectedMapping,
    selectedItem.itemType
  ]);


  const directSelectData = useMemo(() => {
    if (!selectedDirectItem?.id) {
      return selectData;
    }

    const exists = selectData.some(
      item =>
        Number(item.id) === Number(selectedDirectItem.id)
    );

    if (exists) {
      return selectData;
    }

    return [
      selectedDirectItem,
      ...selectData
    ];
  }, [
    selectData,
    selectedDirectItem
  ]);


  const currentSelectTotal = Number(
    currentSelectResponse?.totalCount ?? 0
  );

  const hasMoreDirectItems =
    currentSelectTotal > 0 &&
    selectData.length < currentSelectTotal;

  const handleFetchMore = () => {
    if (
      isFetchingMedications ||
      isFetchingMedicationsSearch ||
      isFetchingLaboratory ||
      isFetchingLaboratorySearch ||
      isFetchingRadiology ||
      isFetchingRadiologySearch ||
      isFetchingPathology ||
      isFetchingPathologySearch ||
      isFetchingServices ||
      isFetchingServicesSearch ||
      isFetchingProcedures ||
      isFetchingProceduresSearch
    ) {
      return;
    }

    if (!hasMoreDirectItems) {
      return;
    }

    setSelectPage(previous => previous + 1);
  };



  const directItemSelectConfig = useMemo(() => {
    switch (selectedItem.itemType) {
      case 'MEDICATION':
        return {
          fieldLabel: 'Medication',
          selectData: directSelectData,
          loading:
            isFetchingMedications ||
            isFetchingMedicationsSearch,
          hasMore: hasMoreDirectItems,
          onFetchMore: handleFetchMore
        };

      case 'LABORATORY':
        return {
          fieldLabel: 'Laboratory Test',
          selectData: directSelectData,
          loading:
            isFetchingLaboratory ||
            isFetchingLaboratorySearch,
          hasMore: hasMoreDirectItems,
          onFetchMore: handleFetchMore

        };

      case 'RADIOLOGY':
        return {
          fieldLabel: 'Radiology Test',
          selectData,
          loading:
            isFetchingRadiology ||
            isFetchingRadiologySearch,
          hasMore: hasMoreDirectItems,
          onFetchMore: handleFetchMore
        };

      case 'PATHOLOGY':
        return {
          fieldLabel: 'Pathology Test',
          selectData,
          loading:
            isFetchingPathology ||
            isFetchingPathologySearch,
          hasMore: hasMoreDirectItems,
          onFetchMore: handleFetchMore
        };

      case 'SERVICE':
        return {
          fieldLabel: 'Service',
          selectData,
          loading:
            isFetchingServices ||
            isFetchingServicesSearch,
          hasMore: hasMoreDirectItems,
          onFetchMore: handleFetchMore
        };

      case 'PROCEDURE':
        return {
          fieldLabel: 'Procedure',
          selectData,
          loading:
            isFetchingProcedures ||
            isFetchingProceduresSearch,
          hasMore: hasMoreDirectItems,
          onFetchMore: handleFetchMore
        };

      default:
        return null;
    }
  }, [
    selectedItem.itemType,
    selectData,
    currentSelectResponse,

    isFetchingMedications,
    isFetchingMedicationsSearch,

    isFetchingLaboratory,
    isFetchingLaboratorySearch,

    isFetchingRadiology,
    isFetchingRadiologySearch,

    isFetchingPathology,
    isFetchingPathologySearch,

    isFetchingServices,
    isFetchingServicesSearch,

    isFetchingProcedures,
    isFetchingProceduresSearch
  ]);



  const handleSelectSearch = (value: string) => {
    setSelectSearch(value);
    setSelectPage(0);
    setSelectData([]);
  };


  const resetMappingDropdown =
    () => {
      setSelectedMapping(null);

      setMappingPage(0);
      setMappingSearch('');
      setAppliedMappingSearch('');
      setMappingCache([]);

      setMappingRefreshToken(
        previous =>
          previous + 1
      );
    };

  const resetDirectItemDropdowns = () => {
    setSelectPage(0);
    setSelectSearch('');
    setDebouncedSelectSearch('');
    setSelectData([]);
  };

  const resetAllDropdowns = () => {
    resetMappingDropdown();
    resetDirectItemDropdowns();
  };

  const handleItemTypeChange = (
    updatedItem:
      PriceListSetupItem
  ) => {
    setSelectedItem({
      ...updatedItem,

      sourceId:
        undefined,

      itemCode:
        undefined,

      nonStandardCode:
        undefined,

      itemName:
        undefined,

      waseelItemMappingId:
        undefined,

      sbsCatalogId:
        undefined
    });

    resetAllDropdowns();
  };

  const openCreate = () => {
    setSelectedItem({
      ...newPriceListSetupItem,

      priceListSetupId:
        Number(priceListSetupId),

      itemType:
        undefined,

      sourceId:
        undefined,

      itemCode:
        undefined,

      itemName:
        undefined,

      waseelItemMappingId:
        undefined,

      sbsCatalogId:
        undefined,

      discountPercentage:
        0,

      isActive:
        true,

      requiresPreAuthorization:
        false
    });

    resetAllDropdowns();

    setChildModalOpen(true);
  };

  const openEdit = (
    row: PriceListSetupItem
  ) => {
    resetAllDropdowns();

    setSelectedItem({
      ...row
    });

    if (
      isInsurancePriceList &&
      row.waseelItemMappingId
    ) {
      setSelectedMapping(
        createMappingOption({
          id: Number(row.waseelItemMappingId),
          itemType: row.itemType,
          sourceId: row.sourceId,
          itemCode: row.itemCode,
          itemName: row.itemName,
          sbsCatalogId: Number(
            row.sbsCatalogId ?? 0
          ),
          sbsCode: '',
          isActive: row.isActive ?? true
        })
      );
    } else {
      setSelectedMapping(null);
    }

    setChildModalOpen(true);
  };

  useEffect(() => {
    if (
      !selectedItem
        .waseelItemMappingId ||
      mappingCache.length === 0
    ) {
      return;
    }



    const mapping =
      mappingCache.find(
        item =>
          Number(item.id) ===
          Number(
            selectedItem
              .waseelItemMappingId
          )
      );

    if (mapping) {
      setSelectedMapping(mapping);
    }
  }, [
    mappingCache,
    selectedItem
      .waseelItemMappingId
  ]);

  const handleMappingSelected = (
    mapping:
      MappingOption |
      WaseelItemMapping |
      null
  ) => {
    if (!mapping) {
      setSelectedMapping(null);

      setSelectedItem(previous => ({
        ...previous,

        waseelItemMappingId:
          undefined,

        sourceId:
          undefined,

        sbsCatalogId:
          undefined,

        itemCode:
          undefined,

        itemName:
          undefined
      }));

      return;
    }

    setSelectedMapping(mapping);

    setSelectedItem(previous => ({
      ...previous,

      waseelItemMappingId:
        Number(mapping.id),

      sourceId:
        mapping.sourceId
          ? Number(mapping.sourceId)
          : undefined,

      sbsCatalogId:
        mapping.sbsCatalogId
          ? Number(mapping.sbsCatalogId)
          : undefined,

      itemCode:
        mapping.itemCode || '',

      itemName:
        mapping.itemName || ''
    }));
  };

  const handleDirectItemSelected = (
    option:
      ServiceProductOption |
      null
  ) => {
    if (!option) {
      setSelectedItem(previous => ({
        ...previous,

        sourceId:
          undefined,

        itemCode:
          undefined,

        itemName:
          undefined,

        waseelItemMappingId:
          undefined,

        sbsCatalogId:
          undefined
      }));

      return;
    }

    const original =
      option.original ??
      option;

    setSelectedItem(previous => ({
      ...previous,

      sourceId:
        Number(option.id),

      itemCode:
        option.code ||
        original?.code ||
        original?.internalCode ||
        '',

      itemName:
        option.name ||
        original?.name ||
        original?.brandName ||
        '',

      waseelItemMappingId:
        undefined,

      sbsCatalogId:
        undefined
    }));
  };

  const handleFetchMoreMappings = () => {
    if (loadingMappings || !hasMoreMappings) {
      return;
    }

    setMappingPage(previous => previous + 1);
  };

  const validate = ():
    string | null => {
    if (!selectedItem.itemType) {
      return 'Item type is required.';
    }

    if (!selectedItem.sourceId) {
      return 'Service or product is required.';
    }

    if (isInsurancePriceList) {
      if (
        !selectedItem
          .waseelItemMappingId
      ) {
        return 'Waseel item mapping is required.';
      }

      if (
        !selectedItem
          .sbsCatalogId
      ) {
        return 'SBS catalog is required.';
      }
    }

    if (
      !selectedItem.itemCode ||
      !selectedItem.itemCode.trim()
    ) {
      return 'Item code is required.';
    }

    if (
      !selectedItem.itemName ||
      !selectedItem.itemName.trim()
    ) {
      return 'Item name is required.';
    }


    if (
      !isInsurancePriceList &&
      !selectedItem.visitType
    ) {
      return 'Visit type is required.';
    }

    if (
      selectedItem.unitPrice ===
      undefined ||
      selectedItem.unitPrice ===
      null ||
      Number(
        selectedItem.unitPrice
      ) < 0
    ) {
      return 'Unit price must be zero or greater.';
    }

    const discount =
      Number(
        selectedItem
          .discountPercentage ??
        0
      );

    if (
      discount < 0 ||
      discount > 100
    ) {
      return 'Discount must be between 0 and 100.';
    }

    if (
      selectedItem.pricingMethod ===
      'NO_CHARGE' &&
      Number(
        selectedItem.unitPrice
      ) !== 0
    ) {
      return 'Unit price must be zero for no-charge items.';
    }

    return null;
  };

  const handleSave = async () => {
    const validationMessage =
      validate();

    if (validationMessage) {
      dispatch(
        notify({
          msg:
            validationMessage,
          sev:
            'warning'
        })
      );

      return;
    }

    const payload:
      SavePriceListSetupItemRequest = {
      waseelItemMappingId:
        isInsurancePriceList &&
          selectedItem
            .waseelItemMappingId
          ? Number(
            selectedItem
              .waseelItemMappingId
          )
          : null,

      sbsCatalogId:
        isInsurancePriceList &&
          selectedItem
            .sbsCatalogId
          ? Number(
            selectedItem
              .sbsCatalogId
          )
          : null,

      itemType:
        selectedItem
          .itemType as
        PriceListItemType,

      sourceId:
        Number(
          selectedItem.sourceId
        ),

      itemCode:
        String(
          selectedItem.itemCode
        ).trim(),

      nonStandardCode:
        isSelfPayPriceList ||
        selectedItem.nonStandardCode == null ||
        String(selectedItem.nonStandardCode).trim() === ''
          ? null
          : String(selectedItem.nonStandardCode).trim(),

      itemName:
        String(
          selectedItem.itemName
        ).trim(),

      category:
        selectedItem.category ||
        undefined,

      visitType:
        selectedItem.visitType &&
        selectedItem.visitType !== 'ALL'
          ? (selectedItem.visitType as PriceListVisitType)
          : undefined,

      unitPrice:
        Number(
          selectedItem.unitPrice
        ),

      cost:
        selectedItem.cost ===
          undefined ||
        selectedItem.cost ===
          null
          ? undefined
          : Number(selectedItem.cost),

      discountPercentage:
        Number(
          selectedItem
            .discountPercentage ??
          0
        ),

      isActive:
        selectedItem.isActive ??
        true,

      requiresPreAuthorization:
        isInsurancePriceList
          ? Boolean(
            selectedItem
              .requiresPreAuthorization
          )
          : false
    };

    try {
      if (selectedItem.id) {
        await updatePriceListItem({
          priceListSetupId,

          itemId:
            selectedItem.id,

          data:
            payload
        }).unwrap();

        dispatch(
          notify({
            msg:
              'Price-list item updated successfully',
            sev:
              'success'
          })
        );
      } else {
        await addPriceListItem({
          priceListSetupId,

          data:
            payload
        }).unwrap();

        dispatch(
          notify({
            msg:
              'Price-list item added successfully',
            sev:
              'success'
          })
        );
      }

      setChildModalOpen(false);

      setSelectedItem({
        ...newPriceListSetupItem
      });

      setSelectedMapping(null);

      await refetch();
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            extractApiErrorMessage(
              error,
              PRICE_LIST_SETUP_ERROR_MAP
            ) || 'Failed to save price-list item',

          sev:
            'error'
        })
      );
    }
  };

  const handleDelete = async () => {
    if (!selectedItem.id) {
      return;
    }

    try {
      await deletePriceListItem({
        priceListSetupId,

        itemId:
          selectedItem.id
      }).unwrap();

      dispatch(
        notify({
          msg:
            'Price-list item deleted successfully',
          sev:
            'success'
        })
      );

      setDeleteConfirmationOpen(
        false
      );

      setSelectedItem({
        ...newPriceListSetupItem
      });

      await refetch();
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            extractApiErrorMessage(
              error,
              PRICE_LIST_SETUP_ERROR_MAP
            ) || 'Failed to delete price-list item',

          sev:
            'error'
        })
      );
    }
  };

  const calculateNetPrice = (
    row:
      PriceListSetupItem
  ) => {
    const price =
      Number(
        row.unitPrice ?? 0
      );

    const discount =
      Number(
        row.discountPercentage ??
        0
      );

    return (
      price -
      price *
      discount /
      100
    ).toFixed(4);
  };

  const columns:
    ColumnConfig[] = [
      {
        key: 'itemCode',
        title:
          <Translate>
            Item Code
          </Translate>
      },

      ...(isSelfPayPriceList
        ? []
        : [
            {
              key: 'nonStandardCode',
              title:
                <Translate>
                  Non Standard Code
                </Translate>,
              render: (
                row:
                  PriceListSetupItem
              ) =>
                row.nonStandardCode || '-'
            }
          ]),

      {
        key: 'itemName',
        title:
          <Translate>
            Item Name
          </Translate>
      },

      {
        key: 'itemType',
        title:
          <Translate>
            Item Type
          </Translate>,

        render: (
          row:
            PriceListSetupItem
        ) =>
          row.itemType
            ? formatEnumString(
              row.itemType
            )
            : ''
      },

      {
        key: 'visitType',
        title: <Translate>Visit Type</Translate>,
        render: (row: PriceListSetupItem) =>
          row.visitType && row.visitType !== 'ALL'
            ? formatEnumString(row.visitType)
            : 'All'
      },

      {
        key: 'unitPrice',
        title:
          <Translate>
            Price
          </Translate>,
        align: 'center'
      },

      {
        key: 'cost',
        title: <Translate>Cost</Translate>,
        align: 'center',
        render: (row: PriceListSetupItem) =>
          row.cost ?? '-'
      },

      {
        key:
          'discountPercentage',
        title:
          <Translate>
            Discount %
          </Translate>,
        align: 'center'
      },

      {
        key: 'netPrice',
        title:
          <Translate>
            Net Price
          </Translate>,
        align: 'center',

        render: (
          row:
            PriceListSetupItem
        ) =>
          calculateNetPrice(row)
      },

      ...(isInsurancePriceList
        ? [{
          key: 'requiresPreAuthorization',
          title:
            <Translate>
              PreAuth
            </Translate>,
          align: 'center' as const,
          render: (
            row:
              PriceListSetupItem
          ) =>
            row.requiresPreAuthorization
              ? 'Yes'
              : 'No'
        }]
        : []),

      {
        key: 'isActive',
        title: <Translate>Status</Translate>,
        align: 'center' as const,
        render: (row: PriceListSetupItem) =>
          row.isActive === false ? 'Inactive' : 'Active'
      },

      {
        key: 'createdBy',
        title: <Translate>Created By</Translate>,
        render: (row: PriceListSetupItem) => row.createdBy || '-'
      },

      {
        key: 'createdDate',
        title: <Translate>Created Date</Translate>,
        render: (row: PriceListSetupItem) => row.createdDate || '-'
      },

      {
        key: 'lastModifiedBy',
        title: <Translate>Updated By</Translate>,
        render: (row: PriceListSetupItem) => row.lastModifiedBy || '-'
      },

      {
        key: 'lastModifiedDate',
        title: <Translate>Updated Date</Translate>,
        render: (row: PriceListSetupItem) => row.lastModifiedDate || '-'
      },

      {
        key: 'actions',
        title:
          <Translate>
            Actions
          </Translate>,
        width: 100,
        align: 'right',

        render: (
          row:
            PriceListSetupItem
        ) => (
          <div className="container-of-icons">
            <MdModeEdit
              className="icons-style"
              title="Edit"
              size={22}
              fill="var(--primary-gray)"
              onClick={() =>
                openEdit(row)
              }
            />

            <MdDelete
              className="icons-style"
              title="Delete"
              size={22}
              fill="var(--primary-pink)"
              onClick={() => {
                setSelectedItem(row);

                setDeleteConfirmationOpen(
                  true
                );
              }}
            />
          </div>
        )
      }
    ];

  const childForm = () => (
    <Form fluid className="price-list-item-form">
      <MyInput
        required
        disabled={isEditItem}
        width="100%"
        fieldLabel="Item Type"
        fieldType="select"
        fieldName="itemType"
        selectData={typeOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={selectedItem}
        setRecord={
          handleItemTypeChange
        }
        searchable={false}
      />

      {isInsurancePriceList ? (
        <MyInput
          key={
            selectedItem.itemType ||
            'no-item-type'
          }
          required
          width="100%"
          fieldLabel="Waseel Item Mapping"
          fieldType="selectPagination"
          fieldName="waseelItemMappingId"
          selectData={mappingSelectData}
          selectDataLabel="displayName"
          selectDataValue="id"
          record={selectedItem}
          setRecord={updatedItem => {
            setSelectedItem(updatedItem);
          }}
          searchable
          searchKeyWard={mappingSearch}
          setSearchKeyWard={setMappingSearch}
          loading={loadingMappings}
          hasMore={hasMoreMappings}
          onFetchMore={handleFetchMoreMappings}
          onSelectItem={handleMappingSelected}
          disabled={!selectedItem.itemType}
          placeholder={
            !selectedItem.itemType
              ? 'Select item type first'
              : 'Select Waseel mapping'
          }
          menuMaxHeight={380}
        />
      ) : (
        directItemSelectConfig && (
          <MyInput
            key={
              selectedItem.itemType ||
              'no-item-type'
            }
            required
            width="100%"
            fieldLabel={
              directItemSelectConfig.fieldLabel
            }
            fieldType="selectPagination"
            fieldName="sourceId"
            selectData={directSelectData}
            selectDataLabel="displayName"
            selectDataValue="id"
            record={selectedItem}
            setRecord={updatedItem => {
              setSelectedItem(updatedItem);

              const selected =
                directItemSelectConfig.selectData.find(
                  item =>
                    Number(item.id) ===
                    Number(updatedItem.sourceId)
                );

              handleDirectItemSelected(
                selected || null
              );
            }}
            searchable
            searchKeyWard={selectSearch}
            setSearchKeyWard={handleSelectSearch}
            loading={
              directItemSelectConfig.loading
            }
            hasMore={
              directItemSelectConfig.hasMore
            }
            onFetchMore={
              directItemSelectConfig.onFetchMore
            }
            onSelectItem={selected => {
              setSelectedDirectItem(selected);
              handleDirectItemSelected(selected);
            }}
            disabled={!selectedItem.itemType}
            placeholder={
              !selectedItem.itemType
                ? 'Select item type first'
                : `Select ${directItemSelectConfig.fieldLabel}`
            }
            menuMaxHeight={380}
          />
        )
      )}

      <MyInput
        required
        disabled
        width="100%"
        fieldLabel="Item Code"
        fieldName="itemCode"
        record={selectedItem}
        setRecord={setSelectedItem}
      />

      <MyInput
        required
        disabled
        width="100%"
        fieldLabel="Item Name"
        fieldName="itemName"
        record={selectedItem}
        setRecord={setSelectedItem}
      />

      {!isSelfPayPriceList && (
        <MyInput
          width="100%"
          fieldLabel="Non Standard Code"
          fieldName="nonStandardCode"
          record={selectedItem}
          setRecord={setSelectedItem}
        />
      )}

      {isInsurancePriceList && (
        <>
          <MyInput
            disabled
            width="100%"
            fieldLabel="Source ID"
            fieldType="number"
            fieldName="sourceId"
            record={selectedItem}
            setRecord={setSelectedItem}
          />

          <MyInput
            disabled
            width="100%"
            fieldLabel="SBS Catalog ID"
            fieldType="number"
            fieldName="sbsCatalogId"
            record={selectedItem}
            setRecord={setSelectedItem}
          />

          <MyInput
            disabled
            width="100%"
            fieldLabel="SBS Code"
            fieldName="sbsCode"
            record={
              selectedMapping ?? {}
            }
            setRecord={() => { }}
          />

          <MyInput
            disabled
            width="100%"
            fieldLabel="SBS Description"
            fieldName="sbsDescription"
            record={
              selectedMapping ?? {}
            }
            setRecord={() => { }}
          />
        </>
      )}

      <MyInput
        required={!isInsurancePriceList}
        disabled={Boolean(selectedItem.visitTypeLocked)}
        width="100%"
        fieldLabel="Visit Type"
        fieldType="select"
        fieldName="visitType"
        selectData={visitTypeOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={selectedItem}
        setRecord={setSelectedItem}
        searchable={false}
      />

      <MyInput
        required
        width="100%"
        fieldLabel="Price"
        fieldType="number"
        fieldName="unitPrice"
        record={selectedItem}
        setRecord={setSelectedItem}
      />

      <MyInput
        width="100%"
        fieldLabel="Cost"
        fieldType="number"
        fieldName="cost"
        record={selectedItem}
        setRecord={setSelectedItem}
      />

      <MyInput
        required
        width="100%"
        fieldLabel="Discount Percentage"
        fieldType="number"
        fieldName="discountPercentage"
        record={selectedItem}
        setRecord={setSelectedItem}
      />

      {isInsurancePriceList && (
        <MyInput
          width="100%"
          fieldLabel="Requires PreAuthorization"
          fieldType="checkbox"
          fieldName="requiresPreAuthorization"
          record={selectedItem}
          setRecord={setSelectedItem}
        />
      )}

      <MyInput
        width="100%"
        fieldLabel="Active"
        fieldType="checkbox"
        fieldName="isActive"
        record={selectedItem}
        setRecord={setSelectedItem}
      />
    </Form>
  );

  const itemTableFilters = () => (
    <Form
      fluid
      className="form-of-filters-set-up"
    >
      <MyInput
        width="18vw"
        fieldName="search"
        fieldType="text"
        record={searchFilters}
        setRecord={setSearchFilters}
        showLabel={false}
        placeholder="Search Item Name / Code"
      />

      <MyInput
        width="12vw"
        fieldName="itemType"
        fieldType="select"
        record={searchFilters}
        setRecord={setSearchFilters}
        showLabel={false}
        placeholder="Item Type"
        selectData={typeOptions}
        selectDataLabel="label"
        selectDataValue="value"
      />

      <AdvancedSearchFilters
        showAdvancedButton={false}
        clearOnClick={() => {
          setSearchFilters({
            search: '',
            itemType: null
          });
          setAppliedFilters({});
          setPaginationParams(
            previous => ({
              ...previous,
              page: 0
            })
          );
        }}
      />
    </Form>
  );

  const mainContent = () => (
    <div className="price-list-items-page" ref={itemsPageRef}>
      <div className="price-list-items-header">
        <div>
          <strong>
            {priceListName}
          </strong>
        </div>

        <div className="container-of-add-new-button price-list-items-actions">
          <MyButton
            prefixIcon={() => (
              <FileDownloadIcon />
            )}
            color="var(--deep-blue)"
            onClick={() => {
              void handleExportItems();
            }}
            width="125px"
            disabled={!priceListSetupId}
          >
            Export
          </MyButton>

          <MyButton
            prefixIcon={() => (
              <FileUploadIcon />
            )}
            color="var(--deep-blue)"
            onClick={() =>
              setImportModalOpen(true)
            }
            width="125px"
            disabled={!priceListSetupId}
          >
            Import
          </MyButton>

          <MyButton
            prefixIcon={() => (
              <AddOutlineIcon />
            )}
            color="var(--deep-blue)"
            onClick={openCreate}
            width="125px"
            disabled={!priceListSetupId}
          >
            Add Item
          </MyButton>
        </div>
      </div>

      <MyTable
        height={tableHeight}
        loading={isFetching}
        data={tableData}
        totalCount={
          itemPage?.totalCount ??
          0
        }
        columns={columns}
        filters={itemTableFilters()}
        page={
          paginationParams.page
        }
        rowsPerPage={
          paginationParams.size
        }
        onPageChange={(
          _: unknown,
          page: number
        ) => {
          setPaginationParams(
            previous => ({
              ...previous,
              page
            })
          );
        }}
        onRowsPerPageChange={(
          event:
            React.ChangeEvent<HTMLInputElement>
        ) => {
          setPaginationParams(
            previous => ({
              ...previous,
              page: 0,
              size: Number(
                event.target.value
              )
            })
          );
        }}
      />
    </div>
  );

  const direction =
    localStorage.getItem(
      'direction'
    ) ||
    'LTR';

  const dir =
    direction === 'RTL'
      ? 'rtl'
      : 'ltr';

  const closeItemsPage = (value: boolean) => {
    setOpen(value);

    if (!value) {
      setChildModalOpen(false);
      setSearchFilters({
        search: '',
        itemType: null
      });
      setAppliedFilters({});

      setSelectedItem({
        ...newPriceListSetupItem
      });

      resetAllDropdowns();
    }
  };

  return (
    <>
      <MyModal
        open={open}
        setOpen={closeItemsPage}
        title="Price List Items"
        size="full"
        bodyheight="auto"
        hideActionBtn
        hideBack
        customClassName="price-list-items-page-modal"
        content={
          <div dir={dir}>
            {mainContent()}
          </div>
        }
      />

      <MyModal
        open={childModalOpen}
        setOpen={setChildModalOpen}
        title={
          selectedItem.id
            ? 'Edit Price List Item'
            : 'Add Price List Item'
        }
        size="lg"
        bodyheight="auto"
        hideBack
        customClassName="price-list-item-form-modal"
        actionButtonFunction={handleSave}
        actionButtonLabel={
          selectedItem.id
            ? 'Save'
            : 'Add'
        }
        isDisabledActionBtn={actionLoading}
        content={
          <div dir={dir}>
            {childForm()}
          </div>
        }
      />

      <DeletionConfirmationModal
        open={
          deleteConfirmationOpen
        }
        setOpen={
          setDeleteConfirmationOpen
        }
        itemToDelete={
          'Price List Item'
        }
        actionButtonFunction={
          handleDelete
        }
        actionType="delete"
      />

      <CodesExcelCsvImportModal
        open={importModalOpen}
        setOpen={setImportModalOpen}
        title="Price List Items Import"
        excelTemplateFileName="price-list-items-template.xlsx"
        onDownloadTemplate={
          handleDownloadTemplate
        }
        onImport={handleImportItems}
      />
    </>
  );
};

export default PriceListSetupItems;