
import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import { Form } from 'rsuite';

import { MdPriceChange } from 'react-icons/md';

import MyInput from '@/components/MyInput';

import MyTable, {
  ColumnConfig
} from '@/components/MyTable/MyTable';

import Translate from '@/components/Translate';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';

import {
  formatEnumString
} from '@/utils';

import {
  useGetPriceListSetupItemsQuery
} from '@/services/setup/priceListSetup/priceListSetupService';

import type {
  PriceListItemType,
  PriceListSetupItem,
  PriceListSetupType
} from '@/types/model-types-new';

import { useEnumOptions } from '@/services/enumsApi';
import MyModal from '@/components/MyModal/MyModal';

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
};

const ViewPriceListItemsModal: React.FC<Props> = ({
  open,
  setOpen,
  priceListSetupId,
  priceListName,
  priceListType
}) => {
  const isInsurancePriceList =
    priceListType === 'INSURANCE';

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

  
  const {
    data: itemPage,
    isFetching
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

    const typeOptions = useEnumOptions('PriceListItemType');


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
        : [])
    ];

  const itemTableFilters = () => (
    <Form
      fluid
       className="form-of-filters-set-up"
    >
      <MyInput
        width="16vw"
        fieldName="search"
        record={searchFilters}
        setRecord={setSearchFilters}
        showLabel={false}
        placeholder="Search"
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
        hideSearchBtn
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
    <MyModal
      open={open}
      setOpen={setOpen}
      title={priceListName || 'Price List Items'}
      icon={<MdPriceChange />}
      size="md"
      content={
        <div dir={dir}>
          {mainContent()}
        </div>
      }
    />
  );
};

export default ViewPriceListItemsModal;