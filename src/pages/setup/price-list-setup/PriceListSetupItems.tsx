import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import { Form } from 'rsuite';

import {
  MdDelete,
  MdModeEdit,
  MdPriceChange
} from 'react-icons/md';

import AddOutlineIcon from '@rsuite/icons/AddOutline';

import ChildModal from '@/components/ChildModal';
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
  useUpdatePriceListSetupItemMutation
} from '@/services/setup/priceListSetup/priceListSetupService';

import {
  useSearchItemMappingsQuery
} from '@/services/waseel-integration/waseelSbsSetupService';

import {
  useGetActiveServicesByFacilityQuery
} from '@/services/setup/serviceService';

import {
  useGetBrandMedicationsByIsActiveQuery
} from '@/services/setup/brandmedication/BrandMedicationService';

import {
  useGetActiveDiagnosticTestsByTypeQuery
} from '@/services/setup/diagnosticTest/diagnosticTestService';

import {
  useGetActiveProceduresByFacilityQuery
} from '@/services/setup/procedure/procedureService';

import type {
  PriceListItemType,
  PriceListSetupItem,
  PriceListSetupType,
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
    .filter(row => row?.id !== undefined)
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
  const [
    servicePage,
    setServicePage
  ] = useState(0);

  const [
    serviceCache,
    setServiceCache
  ] = useState<ServiceProductOption[]>([]);

  const [
    medicationPage,
    setMedicationPage
  ] = useState(0);

  const [
    medicationCache,
    setMedicationCache
  ] = useState<ServiceProductOption[]>([]);

  const [
    laboratoryPage,
    setLaboratoryPage
  ] = useState(0);

  const [
    laboratoryCache,
    setLaboratoryCache
  ] = useState<ServiceProductOption[]>([]);

  const [
    radiologyPage,
    setRadiologyPage
  ] = useState(0);

  const [
    radiologyCache,
    setRadiologyCache
  ] = useState<ServiceProductOption[]>([]);

  const [
    pathologyPage,
    setPathologyPage
  ] = useState(0);

  const [
    pathologyCache,
    setPathologyCache
  ] = useState<ServiceProductOption[]>([]);

  const [
    procedurePage,
    setProcedurePage
  ] = useState(0);

  const [
    procedureCache,
    setProcedureCache
  ] = useState<ServiceProductOption[]>([]);

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

  /*
   * Direct service query.
   */
  const {
    data: servicesResponse,
    isFetching: isFetchingServices
  } = useGetActiveServicesByFacilityQuery(
    {
      facilityId: Number(facilityId),
      page: servicePage,
      size: 50,
      sort: 'name,asc'
    },
    {
      skip:
        !open ||
        !childModalOpen ||
        isInsurancePriceList ||
        !facilityId ||
        selectedItem.itemType !==
          'SERVICE'
    }
  );

  /*
   * Direct medication query.
   */
  const {
    data: medicationsResponse,
    isFetching: isFetchingMedications
  } = useGetBrandMedicationsByIsActiveQuery(
    {
      isActive: true,
      page: medicationPage,
      size: 50,
      sort: 'id,asc'
    },
    {
      skip:
        !open ||
        !childModalOpen ||
        isInsurancePriceList ||
        selectedItem.itemType !==
          'MEDICATION'
    }
  );

  /*
   * Direct laboratory query.
   */
  const {
    data: laboratoryResponse,
    isFetching: isFetchingLaboratory
  } = useGetActiveDiagnosticTestsByTypeQuery(
    {
      type: 'LABORATORY',
      page: laboratoryPage,
      size: 50,
      sort: 'name,asc'
    },
    {
      skip:
        !open ||
        !childModalOpen ||
        isInsurancePriceList ||
        selectedItem.itemType !==
          'LABORATORY'
    }
  );

  /*
   * Direct radiology query.
   */
  const {
    data: radiologyResponse,
    isFetching: isFetchingRadiology
  } = useGetActiveDiagnosticTestsByTypeQuery(
    {
      type: 'RADIOLOGY',
      page: radiologyPage,
      size: 50,
      sort: 'name,asc'
    },
    {
      skip:
        !open ||
        !childModalOpen ||
        isInsurancePriceList ||
        selectedItem.itemType !==
          'RADIOLOGY'
    }
  );

  /*
   * Direct pathology query.
   */
  const {
    data: pathologyResponse,
    isFetching: isFetchingPathology
  } = useGetActiveDiagnosticTestsByTypeQuery(
    {
      type: 'PATHOLOGY',
      page: pathologyPage,
      size: 50,
      sort: 'name,asc'
    },
    {
      skip:
        !open ||
        !childModalOpen ||
        isInsurancePriceList ||
        selectedItem.itemType !==
          'PATHOLOGY'
    }
  );

  /*
   * Direct procedure query.
   */
  const {
    data: proceduresResponse,
    isFetching: isFetchingProcedures
  } = useGetActiveProceduresByFacilityQuery(
    {
      facilityId: Number(facilityId),
      page: procedurePage,
      size: 50,
      sort: 'name,asc'
    },
    {
      skip:
        !open ||
        !childModalOpen ||
        isInsurancePriceList ||
        !facilityId ||
        selectedItem.itemType !==
          'PROCEDURE'
    }
  );

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

  const actionLoading =
    isAdding ||
    isUpdating;

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
        displayParts.join(' - ')
    };
  };

  const mappingNextLink =
    mappingResponse?.links?.next ??
    null;

  const mappingTotalCount =
    Number(
      mappingResponse?.totalCount ??
      0
    );

  const hasMoreMappings =
    Boolean(mappingNextLink) ||
    mappingTotalCount >
      mappingCache.length;

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

    const options =
      rows.map(
        createMappingOption
      );

    setMappingCache(previous => {
      if (mappingPage === 0) {
        return options;
      }

      const existingIds =
        new Set(
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

  /*
   * Direct Service & Product caches.
   */
  useEffect(() => {
    const options =
      normalizeServiceProductOptions(
        normalizePageData(
          servicesResponse
        )
      );

    setServiceCache(previous =>
      mergeOptions(
        previous,
        options,
        servicePage
      )
    );
  }, [
    servicesResponse,
    servicePage
  ]);

  useEffect(() => {
    const options =
      normalizeServiceProductOptions(
        normalizePageData(
          medicationsResponse
        )
      );

    setMedicationCache(previous =>
      mergeOptions(
        previous,
        options,
        medicationPage
      )
    );
  }, [
    medicationsResponse,
    medicationPage
  ]);

  useEffect(() => {
    const options =
      normalizeServiceProductOptions(
        normalizePageData(
          laboratoryResponse
        )
      );

    setLaboratoryCache(previous =>
      mergeOptions(
        previous,
        options,
        laboratoryPage
      )
    );
  }, [
    laboratoryResponse,
    laboratoryPage
  ]);

  useEffect(() => {
    const options =
      normalizeServiceProductOptions(
        normalizePageData(
          radiologyResponse
        )
      );

    setRadiologyCache(previous =>
      mergeOptions(
        previous,
        options,
        radiologyPage
      )
    );
  }, [
    radiologyResponse,
    radiologyPage
  ]);

  useEffect(() => {
    const options =
      normalizeServiceProductOptions(
        normalizePageData(
          pathologyResponse
        )
      );

    setPathologyCache(previous =>
      mergeOptions(
        previous,
        options,
        pathologyPage
      )
    );
  }, [
    pathologyResponse,
    pathologyPage
  ]);

  useEffect(() => {
    const options =
      normalizeServiceProductOptions(
        normalizePageData(
          proceduresResponse
        )
      );

    setProcedureCache(previous =>
      mergeOptions(
        previous,
        options,
        procedurePage
      )
    );
  }, [
    proceduresResponse,
    procedurePage
  ]);

  const directItemSelectConfig =
    useMemo(() => {
      switch (
        selectedItem.itemType
      ) {
        case 'MEDICATION':
          return {
            fieldLabel:
              'Medication',

            selectData:
              medicationCache,

            loading:
              isFetchingMedications,

            hasMore:
              Boolean(
                medicationsResponse
                  ?.links?.next
              ) ||
              Number(
                medicationsResponse
                  ?.totalCount ??
                0
              ) >
                medicationCache.length,

            onFetchMore: () =>
              setMedicationPage(
                previous =>
                  previous + 1
              )
          };

        case 'LABORATORY':
          return {
            fieldLabel:
              'Laboratory Test',

            selectData:
              laboratoryCache,

            loading:
              isFetchingLaboratory,

            hasMore:
              Boolean(
                laboratoryResponse
                  ?.links?.next
              ) ||
              Number(
                laboratoryResponse
                  ?.totalCount ??
                0
              ) >
                laboratoryCache.length,

            onFetchMore: () =>
              setLaboratoryPage(
                previous =>
                  previous + 1
              )
          };

        case 'RADIOLOGY':
          return {
            fieldLabel:
              'Radiology Test',

            selectData:
              radiologyCache,

            loading:
              isFetchingRadiology,

            hasMore:
              Boolean(
                radiologyResponse
                  ?.links?.next
              ) ||
              Number(
                radiologyResponse
                  ?.totalCount ??
                0
              ) >
                radiologyCache.length,

            onFetchMore: () =>
              setRadiologyPage(
                previous =>
                  previous + 1
              )
          };

        case 'PATHOLOGY':
          return {
            fieldLabel:
              'Pathology Test',

            selectData:
              pathologyCache,

            loading:
              isFetchingPathology,

            hasMore:
              Boolean(
                pathologyResponse
                  ?.links?.next
              ) ||
              Number(
                pathologyResponse
                  ?.totalCount ??
                0
              ) >
                pathologyCache.length,

            onFetchMore: () =>
              setPathologyPage(
                previous =>
                  previous + 1
              )
          };

        case 'SERVICE':
          return {
            fieldLabel:
              'Service',

            selectData:
              serviceCache,

            loading:
              isFetchingServices,

            hasMore:
              Boolean(
                servicesResponse
                  ?.links?.next
              ) ||
              Number(
                servicesResponse
                  ?.totalCount ??
                0
              ) >
                serviceCache.length,

            onFetchMore: () =>
              setServicePage(
                previous =>
                  previous + 1
              )
          };

        case 'PROCEDURE':
          return {
            fieldLabel:
              'Procedure',

            selectData:
              procedureCache,

            loading:
              isFetchingProcedures,

            hasMore:
              Boolean(
                proceduresResponse
                  ?.links?.next
              ) ||
              Number(
                proceduresResponse
                  ?.totalCount ??
                0
              ) >
                procedureCache.length,

            onFetchMore: () =>
              setProcedurePage(
                previous =>
                  previous + 1
              )
          };

        default:
          return null;
      }
    }, [
      selectedItem.itemType,

      medicationCache,
      laboratoryCache,
      radiologyCache,
      pathologyCache,
      serviceCache,
      procedureCache,

      medicationsResponse,
      laboratoryResponse,
      radiologyResponse,
      pathologyResponse,
      servicesResponse,
      proceduresResponse,

      isFetchingMedications,
      isFetchingLaboratory,
      isFetchingRadiology,
      isFetchingPathology,
      isFetchingServices,
      isFetchingProcedures
    ]);

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

  const resetDirectItemDropdowns =
    () => {
      setServicePage(0);
      setServiceCache([]);

      setMedicationPage(0);
      setMedicationCache([]);

      setLaboratoryPage(0);
      setLaboratoryCache([]);

      setRadiologyPage(0);
      setRadiologyCache([]);

      setPathologyPage(0);
      setPathologyCache([]);

      setProcedurePage(0);
      setProcedureCache([]);
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
        'SERVICE',

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
    row:
      PriceListSetupItem
  ) => {
    setSelectedItem({
      ...row
    });

    if (
      isInsurancePriceList &&
      row.waseelItemMappingId
    ) {
      setSelectedMapping({
        id:
          Number(
            row.waseelItemMappingId
          ),

        itemType:
          row.itemType,

        sourceId:
          row.sourceId,

        itemCode:
          row.itemCode,

        itemName:
          row.itemName,

        sbsCatalogId:
          Number(
            row.sbsCatalogId ?? 0
          ),

        sbsCode:
          '',

        isActive:
          row.isActive ?? true
      });
    } else {
      setSelectedMapping(null);
    }

    resetAllDropdowns();

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
          ? Number(
              mapping.sbsCatalogId
            )
          : undefined,

      itemType:
        (
          mapping.itemType ||
          previous.itemType
        ) as PriceListItemType,

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

  const handleFetchMoreMappings =
    () => {
      if (
        loadingMappings ||
        !hasMoreMappings
      ) {
        return;
      }

      if (mappingNextLink) {
        const {
          page
        } =
          extractPaginationFromLink(
            mappingNextLink
          );

        setMappingPage(page);
        return;
      }

      setMappingPage(
        previous =>
          previous + 1
      );
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

      itemName:
        String(
          selectedItem.itemName
        ).trim(),


      unitPrice:
        Number(
          selectedItem.unitPrice
        ),

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
      key: 'unitPrice',
      title:
        <Translate>
          Unit Price
        </Translate>,
      align: 'center'
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
    <Form fluid>
      <div className="price-list-two-columns">
        <MyInput
          required
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
          <div className="price-list-mapping-field">
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
              selectData={mappingCache}
              selectDataLabel="displayName"
              selectDataValue="id"
              record={selectedItem}
              setRecord={updatedItem => {
                setSelectedItem(
                  updatedItem
                );

                const mapping =
                  mappingCache.find(
                    item =>
                      Number(item.id) ===
                      Number(
                        updatedItem
                          .waseelItemMappingId
                      )
                  );

                handleMappingSelected(
                  mapping || null
                );
              }}
              searchable
              searchKeyWard={
                mappingSearch
              }
              setSearchKeyWard={
                setMappingSearch
              }
              loading={
                loadingMappings
              }
              hasMore={
                hasMoreMappings
              }
              onFetchMore={
                handleFetchMoreMappings
              }
              onSelectItem={mapping =>
                handleMappingSelected(
                  mapping
                )
              }
              disabled={
                !selectedItem.itemType
              }
              menuMaxHeight={380}
              placeholder={
                !selectedItem.itemType
                  ? 'Select item type first'
                  : 'Select Waseel mapping'
              }
            />
          </div>
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
                directItemSelectConfig
                  .fieldLabel
              }
              fieldType="selectPagination"
              fieldName="sourceId"
              selectData={
                directItemSelectConfig
                  .selectData
              }
              selectDataLabel="displayName"
              selectDataValue="id"
              record={selectedItem}
              setRecord={updatedItem => {
                setSelectedItem(
                  updatedItem
                );

                const selected =
                  directItemSelectConfig
                    .selectData
                    .find(
                      item =>
                        Number(
                          item.id
                        ) ===
                        Number(
                          updatedItem
                            .sourceId
                        )
                    );

                handleDirectItemSelected(
                  selected || null
                );
              }}
              searchable
              loading={
                directItemSelectConfig
                  .loading
              }
              hasMore={
                directItemSelectConfig
                  .hasMore
              }
              onFetchMore={
                directItemSelectConfig
                  .onFetchMore
              }
              onSelectItem={selected =>
                handleDirectItemSelected(
                  selected
                )
              }
              disabled={
                !selectedItem.itemType
              }
              placeholder={
                !selectedItem.itemType
                  ? 'Select item type first'
                  : `Select ${directItemSelectConfig.fieldLabel}`
              }
              menuMaxHeight={380}
            />
          )
        )}
      </div>

      <br />

      <div className="price-list-two-columns">
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
      </div>

      {isInsurancePriceList && (
        <>
          <br />

          <div className="price-list-two-columns">
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
          </div>

          <br />

          <div className="price-list-two-columns">
            <MyInput
              disabled
              width="100%"
              fieldLabel="SBS Code"
              fieldName="sbsCode"
              record={
                selectedMapping ?? {}
              }
              setRecord={() => {}}
            />

            <MyInput
              disabled
              width="100%"
              fieldLabel="SBS Description"
              fieldName="sbsDescription"
              record={
                selectedMapping ?? {}
              }
              setRecord={() => {}}
            />
          </div>
        </>
      )}

      <div className="price-list-two-columns">
        <MyInput
          required
          width="100%"
          fieldLabel="Unit Price"
          fieldType="number"
          fieldName="unitPrice"
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
      </div>

      <br />

      <div className="price-list-two-columns">
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
      </div>
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
    <div>
      <div className="price-list-items-header">
        <div>
          <strong>
            {priceListName}
          </strong>
        </div>

        <MyButton
          prefixIcon={() => (
            <AddOutlineIcon />
          )}
          color="var(--deep-blue)"
          onClick={openCreate}
          width="135px"
          disabled={!priceListSetupId}
        >
          Add Item
        </MyButton>
      </div>

      <MyTable
        height={470}
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

  return (
    <>
      <ChildModal
        open={open}
        setOpen={value => {
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
        }}
        showChild={
          childModalOpen
        }
        setShowChild={
          setChildModalOpen
        }
        title="Price List Items"
        mainContent={
          <div dir={dir}>
            {mainContent()}
          </div>
        }
        actionChildButtonFunction={
          handleSave
        }
        hideActionBtn
        childTitle={
          selectedItem.id
            ? 'Edit Price List Item'
            : 'Add Price List Item'
        }
        childContent={
          <div dir={dir}>
            {childForm()}
          </div>
        }
        mainSize="lg"
        childSize="md"
        actionButtonLabel={
          selectedItem.id
            ? 'Save'
            : 'Add'
        }
        isDisabledActionChildBtn={
          actionLoading
        }
        mainStep={[
          {
            title:
              'Price List Items',
            icon:
              <MdPriceChange />
          }
        ]}
        childStep={[
          {
            title:
              'Item Details',
            icon:
              <MdPriceChange />
          }
        ]}
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
    </>
  );
};

export default PriceListSetupItems;