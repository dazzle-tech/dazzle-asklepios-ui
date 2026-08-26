import React, {
  useEffect,
  useState
} from 'react';

import { Form } from 'rsuite';

import {
  FaMoneyBillWave
} from 'react-icons/fa';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';

import { useAppDispatch } from '@/hooks';

import {
  notify
} from '@/utils/uiReducerActions';

import {
  extractApiErrorMessage,
  PRICE_LIST_SETUP_ERROR_MAP
} from '@/utils/apiErrorMessage';

import {
  extractPaginationFromLink
} from '@/utils/paginationHelper';

import {
  useGetAllFacilitiesQuery
} from '@/services/security/facilityService';



import {
  useAddPriceListSetupMutation,
  useClonePriceListSetupMutation,
  useGetPriceListSetupsQuery,
  useUpdatePriceListSetupMutation
} from '@/services/setup/priceListSetup/priceListSetupService';

import type {
  ClonePriceListSetupRequest,
  PriceListSetup,
  PriceListSetupType,
  SavePriceListSetupRequest
} from '@/types/model-types-new';
import { useGetAllNphiesPayersQuery } from '@/services/setup/payer/NphiesPayerSetupService';
import { useGetAllPayorsQuery } from '@/services/setup/payer/PayorService';
import { useGetActiveTaxesByFacilityQuery } from '@/services/billing/taxService';
import { useEnumOptions } from '@/services/enumsApi';

type Props = {
  open: boolean;

  setOpen: (
    value: boolean
  ) => void;

  width: number;

  priceList:
    PriceListSetup;

  setPriceList:
    React.Dispatch<
      React.SetStateAction<PriceListSetup>
    >;

  onSaveSuccess?: () => void;

  cloneSourceId?: number;
};

type NphiesPayerOption = {
  id: number;

  nphiesId?: string;

  nameEn?: string;

  nameAr?: string;

  isActive?: boolean;

  displayName: string;
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

const normalizePayerOptions = (
  rows: any[]
): NphiesPayerOption[] => {
  return rows
    .filter(
      row =>
        row?.id !== undefined &&
        row?.id !== null
    )
    .map(row => {
      const nameEn =
        row?.nameEn ??
        row?.name_en ??
        row?.name ??
        '';

      const nameAr =
        row?.nameAr ??
        row?.name_ar ??
        '';

      const nphiesId =
        row?.nphiesId ??
        row?.nphies_id ??
        '';

      const displayParts = [
        nameEn || nameAr,
        nphiesId
      ].filter(Boolean);

      return {
        ...row,

        id:
          Number(row.id),

        nphiesId,

        nameEn,

        nameAr,

        displayName:
          displayParts.join(' - ')
      };
    });
};

const toDateValue = (
  value?: string | null
): string | undefined => {
  if (!value) {
    return undefined;
  }

  return String(value).slice(0, 10);
};

const intervalsOverlap = (
  from1?: string | null,
  to1?: string | null,
  from2?: string | null,
  to2?: string | null
): boolean => {
  const start1 = toDateValue(from1);
  const start2 = toDateValue(from2);

  if (!start1 || !start2) {
    return false;
  }

  const end1 = toDateValue(to1) ?? '9999-12-31';
  const end2 = toDateValue(to2) ?? '9999-12-31';

  return start1 <= end2 && start2 <= end1;
};

const mergePayerOptions = (
  previous: NphiesPayerOption[],
  incoming: NphiesPayerOption[],
  page: number
): NphiesPayerOption[] => {
  if (page === 0) {
    return incoming;
  }

  const existingIds =
    new Set(
      previous.map(
        payer => Number(payer.id)
      )
    );

  return [
    ...previous,

    ...incoming.filter(
      payer =>
        !existingIds.has(
          Number(payer.id)
        )
    )
  ];
};

const AddEditPriceListSetup:
React.FC<Props> = ({
  open,
  setOpen,
  width,
  priceList,
  setPriceList,
  onSaveSuccess,
  cloneSourceId
}) => {
  const dispatch =
    useAppDispatch();

  const tenant =
    JSON.parse(
      localStorage.getItem(
        'tenant'
      ) || 'null'
    );

  const defaultFacility =
    tenant?.selectedFacility ||
    null;

  const {
    data:
      facilityListResponse
  } =
    useGetAllFacilitiesQuery({});

  const {
    data: taxListResponse
  } = useGetActiveTaxesByFacilityQuery(
    {
      facilityId: Number(priceList.facilityId || defaultFacility?.id || 0),
      page: 0,
      size: 200,
      sort: 'name,asc'
    },
    {
      skip: !priceList.facilityId && !defaultFacility?.id
    }
  );

  const {
    data: internalPayorResponse
  } = useGetAllPayorsQuery(
    {
      page: 0,
      size: 200,
      sort: 'name,asc',
      category: 'INSURANCE'
    },
    {
      skip: priceList.type !== 'INSURANCE'
    }
  );

  /*
   * ============================================================
   * NPHIES PAYER DROPDOWN STATE
   * ============================================================
   */

  const [
    payerPage,
    setPayerPage
  ] = useState(0);
  const typeOptions = useEnumOptions('PriceListSetupType');
  const statusOptions = useEnumOptions('PriceListSetupStatus');

  const [
    payerSearch,
    setPayerSearch
  ] = useState('');

  const [
    appliedPayerSearch,
    setAppliedPayerSearch
  ] = useState('');

  const [
    payerCache,
    setPayerCache
  ] =
    useState<
      NphiesPayerOption[]
    >([]);

  const [
    selectedPayer,
    setSelectedPayer
  ] =
    useState<
      NphiesPayerOption |
      null
    >(null);

  const [
    payerRefreshToken,
    setPayerRefreshToken
  ] = useState(0);

  /*
   * The hook arguments may be adjusted if your service uses
   * different property names.
   *
   * Expected arguments:
   *
   * {
   *   page,
   *   size,
   *   sort,
   *   search,
   *   isActive,
   *   refreshToken
   * }
   */
  const {
    data:
      payerResponse,

    isFetching:
      loadingPayers
  } =
    useGetAllNphiesPayersQuery(
      {
        page:
          payerPage,

        size:
          20,

        sort:
          'nameEn,asc',

        search:
          appliedPayerSearch ||
          undefined,

        isActive:
          true,

        refreshToken:
          payerRefreshToken
      } as any,
      {
        skip:
          !open ||
          priceList.type !==
            'INSURANCE'
      }
    );

  /*
   * ============================================================
   * MUTATIONS
   * ============================================================
   */

  const [
    addPriceListSetup,
    {
      isLoading:
        isAdding
    }
  ] =
    useAddPriceListSetupMutation();

  const [
    updatePriceListSetup,
    {
      isLoading:
        isUpdating
    }
  ] =
    useUpdatePriceListSetupMutation();

  const [
    clonePriceListSetup,
    {
      isLoading:
        isCloning
    }
  ] =
    useClonePriceListSetupMutation();

  const [
    cloneOptions,
    setCloneOptions
  ] = useState({
    cloneItems: true
  });

  const isEdit =
    Boolean(priceList.id);

  const isClone =
    Boolean(cloneSourceId) &&
    !isEdit;

  const isLoading =
    isAdding ||
    isUpdating ||
    isCloning;

  const {
    data: existingPriceListsPage
  } = useGetPriceListSetupsQuery(
    {
      page: 0,
      size: 500,
      sort: 'id,desc'
    },
    {
      skip: !open
    }
  );

  /*
   * ============================================================
   * OPTIONS
   * ============================================================
   */



  /*
   * ============================================================
   * INITIALIZE NEW PRICE LIST
   * ============================================================
   */

  useEffect(() => {
    if (
      !open ||
      priceList.id
    ) {
      return;
    }

    setPriceList(
      previous => ({
        ...previous,

        facilityId:
          previous.facilityId ??
          defaultFacility?.id,

        currency:
          previous.currency ??
          (
            defaultFacility
              ?.defaultCurrency
              ? String(
                  defaultFacility
                    .defaultCurrency
                ).toUpperCase()
              : undefined
          ),

        type:
          previous.type ??
          'SELF_PAY',

        status:
          previous.status ??
          'ACTIVE',

        versionNumber:
          previous
            .versionNumber ??
          1
      })
    );
  }, [
    open,
    priceList.id,
    defaultFacility?.id,
    defaultFacility
      ?.defaultCurrency,
    setPriceList
  ]);

  /*
   * ============================================================
   * PAYER SEARCH DEBOUNCE
   * ============================================================
   */

  useEffect(() => {
    const timeout =
      setTimeout(() => {
        setAppliedPayerSearch(
          payerSearch.trim()
        );

        setPayerPage(0);

        setPayerCache([]);
      }, 300);

    return () =>
      clearTimeout(timeout);
  }, [payerSearch]);

  /*
   * ============================================================
   * CACHE PAYER RESULTS
   * ============================================================
   */

  useEffect(() => {
    const rows =
      normalizePageData(
        payerResponse
      );

    const options =
      normalizePayerOptions(
        rows
      );

    setPayerCache(
      previous =>
        mergePayerOptions(
          previous,
          options,
          payerPage
        )
    );
  }, [
    payerResponse,
    payerPage
  ]);

  /*
   * ============================================================
   * PAGINATION INFORMATION
   * ============================================================
   */

  const payerNextLink =
    payerResponse
      ?.links?.next ??
    null;

  const payerTotalCount =
    Number(
      payerResponse
        ?.totalCount ??
      payerResponse
        ?.totalElements ??
      0
    );

  const hasMorePayers =
    Boolean(payerNextLink) ||
    payerTotalCount >
      payerCache.length;

  /*
   * ============================================================
   * AUTO-SELECT PAYER IN EDIT MODE
   * ============================================================
   */

  useEffect(() => {
    if (
      !open ||
      priceList.type !==
        'INSURANCE' ||
      !priceList.payerId ||
      payerCache.length === 0
    ) {
      return;
    }

    const matchingPayer =
      payerCache.find(
        payer =>
          Number(payer.id) ===
          Number(
            priceList.payerId
          )
      );

    if (matchingPayer) {
      setSelectedPayer(
        matchingPayer
      );
    }
  }, [
    open,
    priceList.type,
    priceList.payerId,
    payerCache
  ]);

  /*
   * ============================================================
   * RESET PAYER DROPDOWN
   * ============================================================
   */

  const resetPayerDropdown =
    () => {
      setSelectedPayer(null);

      setPayerPage(0);

      setPayerSearch('');

      setAppliedPayerSearch('');

      setPayerCache([]);

      setPayerRefreshToken(
        previous =>
          previous + 1
      );
    };

  /*
   * Reset state whenever the modal opens.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    setPayerPage(0);

    setPayerSearch('');

    setAppliedPayerSearch('');

    setPayerCache([]);

    setSelectedPayer(null);

    setCloneOptions({
      cloneItems: true
    });

    setPayerRefreshToken(
      previous =>
        previous + 1
    );
  }, [open]);

  /*
   * ============================================================
   * FETCH MORE PAYERS
   * ============================================================
   */

  const handleFetchMorePayers =
    () => {
      if (
        loadingPayers ||
        !hasMorePayers
      ) {
        return;
      }

      if (payerNextLink) {
        const {
          page
        } =
          extractPaginationFromLink(
            payerNextLink
          );

        setPayerPage(page);

        return;
      }

      setPayerPage(
        previous =>
          previous + 1
      );
    };

  /*
   * ============================================================
   * SELECT PAYER
   * ============================================================
   */

  const handlePayerSelected = (
    payer:
      NphiesPayerOption |
      null
  ) => {
    setSelectedPayer(
      payer
    );

    setPriceList(
      previous => ({
        ...previous,

        nphiesPayerId:
          payer?.id
            ? Number(
                payer.id
              )
            : undefined,

        nphiesPayerName:
          payer?.nameEn ||
          payer?.nameAr ||
          undefined,

        payerId: undefined,
        payerName: undefined
      })
    );
  };

  /*
   * ============================================================
   * VALIDATION
   * ============================================================
   */

  const validate = ():
    string | null => {
    if (!priceList.facilityId) {
      return 'Facility is required.';
    }

    if (!priceList.type) {
      return 'Price list type is required.';
    }

    if (
      priceList.type ===
        'INSURANCE' &&
      !priceList.payerId &&
      !priceList.nphiesPayerId
    ) {
      return 'Insurance company is required. Select a NPHIES payer or an internal insurance company.';
    }

    if (
      !priceList.name ||
      !priceList.name.trim()
    ) {
      return 'Price list name is required.';
    }

    if (
      !priceList
        .versionNumber ||
      priceList
        .versionNumber <= 0
    ) {
      return 'Version number must be greater than zero.';
    }

    if (
      !isClone &&
      !priceList.effectiveFrom
    ) {
      return 'Effective-from date is required.';
    }

    if (
      !isClone &&
      priceList.effectiveFrom &&
      priceList.effectiveFrom <
        new Date().toISOString().slice(0, 10)
    ) {
      return 'The start date cannot be in the past.';
    }

    if (
      priceList
        .effectiveTo &&
      priceList
        .effectiveTo <
        priceList
          .effectiveFrom
    ) {
      return 'Effective-to date cannot be before effective-from date.';
    }

    if (!priceList.currency) {
      return 'Currency is required.';
    }

    const overlappingList =
      (
        existingPriceListsPage?.data ??
        []
      ).find(list => {
        if (
          priceList.id &&
          Number(list.id) ===
            Number(priceList.id)
        ) {
          return false;
        }

        if (
          Number(list.facilityId) !==
          Number(priceList.facilityId)
        ) {
          return false;
        }

        if (
          priceList.type ===
          'INSURANCE'
        ) {
          const sameInternalPayer =
            priceList.payerId != null &&
            list.payerId != null &&
            Number(list.payerId) ===
              Number(priceList.payerId);

          const sameNphiesPayer =
            priceList.nphiesPayerId != null &&
            list.nphiesPayerId != null &&
            Number(list.nphiesPayerId) ===
              Number(priceList.nphiesPayerId);

          if (!sameInternalPayer && !sameNphiesPayer) {
            return false;
          }
        } else if (
          list.type !== priceList.type
        ) {
          return false;
        }

        return intervalsOverlap(
          priceList.effectiveFrom,
          priceList.effectiveTo,
          list.effectiveFrom,
          list.effectiveTo
        );
      });

    if (overlappingList) {
      return priceList.type ===
        'INSURANCE'
        ? PRICE_LIST_SETUP_ERROR_MAP[
            'interval.payer.duplicate'
          ]
        : PRICE_LIST_SETUP_ERROR_MAP[
            'interval.type.duplicate'
          ];
    }

    return null;
  };

  /*
   * ============================================================
   * SAVE
   * ============================================================
   */

  const handleSave =
    async () => {
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
        SavePriceListSetupRequest = {
        facilityId:
          Number(
            priceList.facilityId
          ),

        type:
          priceList
            .type as
            PriceListSetupType,

        payerId:
          priceList.type ===
            'INSURANCE' &&
          priceList.payerId &&
          !priceList.nphiesPayerId
            ? Number(
                priceList.payerId
              )
            : null,

        nphiesPayerId:
          priceList.type ===
            'INSURANCE' &&
          priceList.nphiesPayerId
            ? Number(
                priceList.nphiesPayerId
              )
            : null,

        name:
          String(
            priceList.name
          ).trim(),

        shortName:
          priceList.shortName?.trim() ||
          null,

        description:
          priceList
            .description
            ?.trim() ||
          null,

        versionNumber:
          Number(
            priceList
              .versionNumber
          ),

        effectiveFrom:
          priceList.effectiveFrom
            ? String(
                priceList.effectiveFrom
              )
            : null,

        effectiveTo:
          priceList
            .effectiveTo ||
          null,

        currency:
          String(
            priceList.currency
          ).toUpperCase(),

        status:
          (priceList.status as SavePriceListSetupRequest['status']) ??
          (isClone ? 'INACTIVE' : 'ACTIVE'),

        appliesToAllFacilities:
          Boolean(
            priceList.appliesToAllFacilities
          ),

        taxId:
          priceList.taxId
            ? Number(priceList.taxId)
            : null
      };

      try {
        if (
          isEdit &&
          priceList.id
        ) {
          await updatePriceListSetup({
            id:
              priceList.id,

            data:
              payload
          }).unwrap();

          dispatch(
            notify({
              msg:
                'Price list updated successfully',

              sev:
                'success'
            })
          );
        } else if (
          isClone &&
          cloneSourceId
        ) {
          const clonePayload:
            ClonePriceListSetupRequest = {
            ...payload,
            cloneItems:
              Boolean(
                cloneOptions.cloneItems
              )
          };

          await clonePriceListSetup({
            id: cloneSourceId,
            data: clonePayload
          }).unwrap();

          dispatch(
            notify({
              msg:
                cloneOptions.cloneItems
                  ? 'Price list and items cloned successfully'
                  : 'Price list cloned successfully',

              sev:
                'success'
            })
          );
        } else {
          await addPriceListSetup(
            payload
          ).unwrap();

          dispatch(
            notify({
              msg:
                'Price list created successfully',

              sev:
                'success'
            })
          );
        }

        setOpen(false);

        onSaveSuccess?.();
      } catch (
        error: any
      ) {
        dispatch(
          notify({
            msg:
              extractApiErrorMessage(
                error,
                PRICE_LIST_SETUP_ERROR_MAP
              ) ||
              (
                isEdit
                  ? 'Failed to update price list'
                  : isClone
                  ? 'Failed to clone price list'
                  : 'Failed to create price list'
              ),

            sev:
              'error'
          })
        );
      }
    };

  /*
   * ============================================================
   * TYPE CHANGE
   * ============================================================
   */

  const handleTypeChange = (
    value: any
  ) => {
    const type =
      value?.type as
      PriceListSetupType;

    setPriceList(
      previous => ({
        ...previous,

        type,

        payerId:
          type ===
            'INSURANCE'
            ? previous
                .payerId
            : undefined,

        nphiesPayerId:
          type ===
            'INSURANCE'
            ? previous
                .nphiesPayerId
            : undefined,

        nphiesPayerName:
          type ===
            'INSURANCE'
            ? previous
                .nphiesPayerName
            : undefined,

        payerName:
          type ===
            'INSURANCE'
            ? previous
                .payerName
            : undefined
      })
    );

    resetPayerDropdown();
  };

  /*
   * ============================================================
   * CONTENT
   * ============================================================
   */

  const content = () => (
    <Form fluid>
      <div className="price-list-two-columns">

        <MyInput
          required
          width="100%"
          fieldLabel="Facility"
          fieldType="select"
          fieldName="facilityId"
          selectData={
            facilityListResponse ??
            []
          }
          selectDataLabel="name"
          selectDataValue="id"
          record={
            priceList
          }
          setRecord={
            setPriceList
          }
          onSelectItem={(
            facility:
              any |
              null
          ) => {
            setPriceList(
              previous => ({
                ...previous,

                facilityId:
                  facility?.id,

                currency:
                  facility
                    ?.defaultCurrency
                    ? String(
                        facility
                          .defaultCurrency
                      ).toUpperCase()
                    : undefined
              })
            );
          }}
        />
      </div>

      <br />

      <MyInput
        width="100%"
        fieldLabel="Apply to all facilities"
        fieldType="checkbox"
        fieldName="appliesToAllFacilities"
        record={priceList}
        setRecord={setPriceList}
      />

      <br />

      <div className="price-list-two-columns">
        <MyInput
          required
          width="100%"
          fieldLabel="Price List Type"
          fieldType="select"
          fieldName="type"
          selectData={
            typeOptions
          }
          selectDataLabel="label"
          selectDataValue="value"
          record={
            priceList
          }
          setRecord={
            handleTypeChange
          }
          searchable={false}
        />
      </div>

      <br />

      <div className="price-list-two-columns">
        <MyInput
          required
          width="100%"
          fieldLabel="Name"
          fieldName="name"
          record={
            priceList
          }
          setRecord={
            setPriceList
          }
        />

        <MyInput
          width="100%"
          fieldLabel="Short Name"
          fieldName="shortName"
          record={
            priceList
          }
          setRecord={
            setPriceList
          }
        />

        <MyInput
          required
          width="100%"
          fieldLabel="Version"
          fieldType="number"
          fieldName="versionNumber"
          record={
            priceList
          }
          setRecord={
            setPriceList
          }
        />
      </div>

      <br />

      {priceList.type ===
        'INSURANCE' && (
        <>
          <MyInput
            key="nphies-payer-select"
            required={false}
            width="100%"
            fieldLabel="NPHIES Insurance Company"
            fieldType="selectPagination"
            fieldName="nphiesPayerId"
            selectData={
              payerCache
            }
            selectDataLabel="displayName"
            selectDataValue="id"
            record={
              priceList
            }
            setRecord={(
              updatedPriceList:
                PriceListSetup
            ) => {
              setPriceList(
                updatedPriceList
              );

              const payer =
                payerCache.find(
                  item =>
                    Number(
                      item.id
                    ) ===
                    Number(
                      updatedPriceList
                        .nphiesPayerId
                    )
                );

              handlePayerSelected(
                payer ||
                null
              );
            }}
            searchable
            searchKeyWard={
              payerSearch
            }
            setSearchKeyWard={
              setPayerSearch
            }
            loading={
              loadingPayers
            }
            hasMore={
              hasMorePayers
            }
            onFetchMore={
              handleFetchMorePayers
            }
            onSelectItem={(
              payer:
                NphiesPayerOption |
                null
            ) => {
              handlePayerSelected(
                payer
              );
            }}
            placeholder={
              loadingPayers &&
              payerCache.length === 0
                ? 'Loading payers...'
                : payerCache.length === 0
                ? 'No active payers found'
                : 'Select NPHIES payer'
            }
          />

          <br />

          <MyInput
            width="100%"
            fieldLabel="Internal insurance company (if not in NPHIES)"
            fieldType="select"
            fieldName="payerId"
            selectData={(internalPayorResponse?.data ?? []).filter(
              payor => payor?.isActive !== false
            )}
            selectDataLabel="name"
            selectDataValue="id"
            record={priceList}
            setRecord={(updated: PriceListSetup) => {
              setPriceList({
                ...updated,
                nphiesPayerId: updated.payerId
                  ? undefined
                  : updated.nphiesPayerId
              });
            }}
            searchable
            placeholder="Select from Payor master data"
          />

          {selectedPayer && (
            <>
              <br />

              <div className="price-list-two-columns">
                <MyInput
                  disabled
                  width="100%"
                  fieldLabel="NPHIES ID"
                  fieldName="nphiesId"
                  record={
                    selectedPayer
                  }
                  setRecord={() => {
                    // Read-only field.
                  }}
                />

                <MyInput
                  disabled
                  width="100%"
                  fieldLabel="Payer Name"
                  fieldName="nameEn"
                  record={
                    selectedPayer
                  }
                  setRecord={() => {
                    // Read-only field.
                  }}
                />
              </div>
            </>
          )}

          <br />
        </>
      )}

      <div className="price-list-two-columns">
        <MyInput
          required={!isClone}
          width="100%"
          fieldLabel="Effective From"
          fieldType="date"
          fieldName="effectiveFrom"
          record={
            priceList
          }
          setRecord={
            setPriceList
          }
        />

        <MyInput
          width="100%"
          fieldLabel="Effective To"
          fieldType="date"
          fieldName="effectiveTo"
          record={
            priceList
          }
          setRecord={
            setPriceList
          }
        />
      </div>

      <br />

      <MyInput
        required
        disabled
        width="100%"
        fieldLabel="Currency"
        fieldName="currency"
        record={
          priceList
        }
        setRecord={
          setPriceList
        }
      />

      <br />

      <MyInput
        width="100%"
        fieldLabel="Tax"
        fieldType="select"
        fieldName="taxId"
        selectData={taxListResponse?.data ?? []}
        selectDataLabel="name"
        selectDataValue="id"
        record={priceList}
        setRecord={setPriceList}
        searchable
        placeholder="Optional tax type"
      />

      <br />

      <MyInput
        required
        width="100%"
        fieldLabel="Status"
        fieldType="select"
        fieldName="status"
        selectData={statusOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={priceList}
        setRecord={setPriceList}
        searchable={false}
      />

      <br />

      <MyInput
        width="100%"
        fieldLabel="Remarks"
        fieldType="textarea"
        fieldName="description"
        record={
          priceList
        }
        setRecord={
          setPriceList
        }
      />

      {priceList.id ? (
        <>
          <br />
          <div className="price-list-two-columns">
            <MyInput
              disabled
              width="100%"
              fieldLabel="Created Date"
              fieldName="createdDate"
              record={priceList}
              setRecord={setPriceList}
            />
            <MyInput
              disabled
              width="100%"
              fieldLabel="Created By"
              fieldName="createdBy"
              record={priceList}
              setRecord={setPriceList}
            />
          </div>
          <br />
          <div className="price-list-two-columns">
            <MyInput
              disabled
              width="100%"
              fieldLabel="Updated Date"
              fieldName="lastModifiedDate"
              record={priceList}
              setRecord={setPriceList}
            />
            <MyInput
              disabled
              width="100%"
              fieldLabel="Updated By"
              fieldName="lastModifiedBy"
              record={priceList}
              setRecord={setPriceList}
            />
          </div>
        </>
      ) : null}

      {isClone && (
        <>
          <br />

          <MyInput
            width="100%"
            fieldLabel="Also clone items"
            fieldType="checkbox"
            fieldName="cloneItems"
            record={cloneOptions}
            setRecord={setCloneOptions}
          />

          <p className="price-list-clone-hint">
            A cloned price list is created as Inactive with an empty
            Effective Start Date. Set the start date before activating.
          </p>
        </>
      )}
    </Form>
  );

  /*
   * ============================================================
   * DIRECTION
   * ============================================================
   */

  const direction =
    localStorage.getItem(
      'direction'
    ) ||
    'LTR';

  const dir =
    direction ===
      'RTL'
      ? 'rtl'
      : 'ltr';

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <MyModal
      open={
        open
      }
      setOpen={value => {
        setOpen(value);

        if (!value) {
          resetPayerDropdown();
        }
      }}
      title={
        isEdit
          ? 'Edit Price List'
          : isClone
          ? 'Clone Price List'
          : 'New Price List'
      }
      position="right"
      content={() => (
        <div dir={dir}>
          {content()}
        </div>
      )}
      actionButtonLabel={
        isEdit
          ? 'Save'
          : isClone
          ? 'Clone'
          : 'Create'
      }
      actionButtonFunction={
        handleSave
      }
      isDisabledActionBtn={
        isLoading
      }
      steps={[
        {
          title:
            'Price List Information',

          icon:
            <FaMoneyBillWave />
        }
      ]}
      size={
        width > 600
          ? '40vw'
          : '75vw'
      }
    />
  );
};

export default AddEditPriceListSetup;