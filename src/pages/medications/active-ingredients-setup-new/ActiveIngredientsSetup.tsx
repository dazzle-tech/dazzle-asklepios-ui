import Translate from '@/components/Translate';
import { initialListRequestNew, ListRequest } from '@/types/types';
import React, { useState, useEffect, useMemo } from 'react';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { Carousel, Form, Panel } from 'rsuite';
import {
  useGetActiveIngredientsQuery,
  useGetActiveIngredientsByNameQuery,
  useGetActiveIngredientsByDrugClassQuery,
  useGetActiveIngredientsByAtcCodeQuery,
  useToggleActiveIngredientIsActiveMutation
} from '@/services/setup/activeIngredients/activeIngredientsService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApActiveIngredient } from '@/types/model-types';
import { newApActiveIngredient } from '@/types/model-types-constructor';
import NewActiveIngredients from './NewActiveIngredients';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyInput from '@/components/MyInput';
import {
  useGetLovValuesByCodeQuery,
  useGetLovValuesByCodeAndParentQuery
} from '@/services/setupService';
import { PaginationPerPage } from '@/utils/paginationPerPage';
const ActiveIngredientsSetup = () => {
  const dispatch = useAppDispatch();
  type ActiveIngredientRow = ApActiveIngredient & {
    id?: number | string;
    isActive?: boolean | null;
  };
  const [activeIngredient, setActiveIngredient] = useState<ActiveIngredientRow | null>(null);
  const [openConfirmDeleteActiveIngredient, setOpenConfirmDeleteActiveIngredient] =
    useState<boolean>(false);
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [appliedFilter, setAppliedFilter] = useState<{ filter: string; value: string }>({
    filter: '',
    value: ''
  });
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);
  const [stateOfDeleteActiveIngredient, setStateOfDeleteActiveIngredient] =
    useState<string>('delete');
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequestNew });

  const queryParams = useMemo(
    () => ({
      page: Math.max(listRequest.pageNumber - 1, 0),
      size: listRequest.pageSize,
      sort: listRequest.sortBy ? `${listRequest.sortBy},${listRequest.sortType ?? 'asc'}` : undefined,
      timestamp: listRequest.timestamp
    }),
    [
      listRequest.pageNumber,
      listRequest.pageSize,
      listRequest.sortBy,
      listRequest.sortType,
      listRequest.timestamp
    ]
  );

  const normalizedFilterValue =
    typeof appliedFilter.value === 'string' ? appliedFilter.value.trim() : '';
  const hasFilterValue =
    appliedFilter.filter === 'medicalCategory'
      ? Boolean(appliedFilter.value)
      : normalizedFilterValue.length > 0;
  const hasFilter = Boolean(appliedFilter.filter && hasFilterValue);
  const isNameFilter = hasFilter && appliedFilter.filter === 'name';
  const isMedicalCategoryFilter = hasFilter && appliedFilter.filter === 'medicalCategory';
  const isDrugClassFilter = hasFilter && appliedFilter.filter === 'drugClass';
  const isAtcFilter = hasFilter && appliedFilter.filter === 'atcCode';
  const isAllQuery = !hasFilter;

  const { data: medicalCategoryLovResponse } = useGetLovValuesByCodeQuery('MED_CATEGORY');
  const { data: filterClassLovResponse } = useGetLovValuesByCodeAndParentQuery(
    {
      code: 'MED_ClASS',
      parentValueKey: recordOfFilter.value
    },
    {
      skip: recordOfFilter.filter !== 'medicalCategory' || !recordOfFilter.value
    }
  );
  const { data: appliedClassLovResponse } = useGetLovValuesByCodeAndParentQuery(
    {
      code: 'MED_ClASS',
      parentValueKey: isMedicalCategoryFilter ? appliedFilter.value : undefined
    },
    {
      skip: !isMedicalCategoryFilter || !appliedFilter.value
    }
  );

  const effectiveDrugClassIds = useMemo(() => {
    if (isMedicalCategoryFilter) {
      return (appliedClassLovResponse?.object ?? [])
        .map(item => item.key)
        .filter(Boolean);
    }
    if (isDrugClassFilter) {
      return normalizedFilterValue
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);
    }
    return [];
  }, [isMedicalCategoryFilter, appliedClassLovResponse, isDrugClassFilter, normalizedFilterValue]);

  const noClassAvailable =
    isMedicalCategoryFilter &&
    appliedClassLovResponse !== undefined &&
    effectiveDrugClassIds.length === 0;

  const shouldRunDrugClassQuery =
    (isDrugClassFilter && effectiveDrugClassIds.length > 0) ||
    (isMedicalCategoryFilter &&
      appliedClassLovResponse !== undefined &&
      effectiveDrugClassIds.length > 0);

  const nameQueryParams = useMemo(
    () => ({
      ...queryParams,
      name: normalizedFilterValue
    }),
    [queryParams, normalizedFilterValue]
  );

  const drugClassQueryParams = useMemo(
    () => ({
      ...queryParams,
      drugClassIds: effectiveDrugClassIds
    }),
    [queryParams, effectiveDrugClassIds]
  );

  const atcQueryParams = useMemo(
    () => ({
      ...queryParams,
      atcCode: normalizedFilterValue
    }),
    [queryParams, normalizedFilterValue]
  );

  const {
    data: activeIngredientsAll,
    refetch: refetchActiveIngredientsAll,
    isFetching: isFetchingAll
  } = useGetActiveIngredientsQuery(queryParams, { skip: !isAllQuery });

  const {
    data: activeIngredientsByName,
    refetch: refetchActiveIngredientsByName,
    isFetching: isFetchingByName
  } = useGetActiveIngredientsByNameQuery(nameQueryParams, { skip: !isNameFilter });

  const {
    data: activeIngredientsByDrugClass,
    refetch: refetchActiveIngredientsByDrugClass,
    isFetching: isFetchingByDrugClass
  } = useGetActiveIngredientsByDrugClassQuery(drugClassQueryParams, {
    skip: !shouldRunDrugClassQuery
  });

  const {
    data: activeIngredientsByAtcCode,
    refetch: refetchActiveIngredientsByAtcCode,
    isFetching: isFetchingByAtcCode
  } = useGetActiveIngredientsByAtcCodeQuery(atcQueryParams, { skip: !isAtcFilter });

  const [toggleActiveIngredient, toggleActiveIngredientMutation] =
    useToggleActiveIngredientIsActiveMutation();

  const emptyDrugClassResponse = useMemo(
    () =>
      noClassAvailable
        ? {
            data: [],
            totalCount: 0
          }
        : null,
    [noClassAvailable]
  );

  const activeIngredientListResponse =
    emptyDrugClassResponse ||
    (isAllQuery && activeIngredientsAll) ||
    (isNameFilter && activeIngredientsByName) ||
    (shouldRunDrugClassQuery && activeIngredientsByDrugClass) ||
    (isAtcFilter && activeIngredientsByAtcCode) ||
    activeIngredientsAll;

  const activeIngredientRefetch =
    emptyDrugClassResponse
      ? async () => {}
      : (isAllQuery && refetchActiveIngredientsAll) ||
        (isNameFilter && refetchActiveIngredientsByName) ||
        (shouldRunDrugClassQuery && refetchActiveIngredientsByDrugClass) ||
        (isAtcFilter && refetchActiveIngredientsByAtcCode) ||
        refetchActiveIngredientsAll;

  const isFetching =
    (isAllQuery && isFetchingAll) ||
    (isNameFilter && isFetchingByName) ||
    (shouldRunDrugClassQuery && isFetchingByDrugClass) ||
    (isAtcFilter && isFetchingByAtcCode) ||
    isFetchingAll;

  const tableData: ActiveIngredientRow[] = useMemo(() => {
    const raw = activeIngredientListResponse?.data ?? [];
    return (raw as any[]).map(item => {
      const derivedId = item.id ?? item.key;
      return {
        ...item,
        id: derivedId,
        key: item.key ?? derivedId,
        isActive: item.isActive ?? item.isValid
      } as ActiveIngredientRow;
    });
  }, [activeIngredientListResponse]);

  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = activeIngredientListResponse?.totalCount ?? 0;

  // Available fields for filtering
  const filterFields = [
    { label: 'Active Ingredients Name', value: 'name' },
    { label: 'Medical Category', value: 'medicalCategory' },
    { label: 'Medication Class', value: 'drugClass' },
    { label: 'ATC Code', value: 'atcCode' }
  ];

  const medicalCategoryOptions = useMemo(
    () => medicalCategoryLovResponse?.object ?? [],
    [medicalCategoryLovResponse]
  );

  // class name for selected row
  const getRowIdentifier = (row?: ActiveIngredientRow | null) =>
    row?.id ?? row?.key ?? null;

  const isSelected = (rowData?: ActiveIngredientRow) => {
    if (!rowData) return '';
    const selectedId = getRowIdentifier(activeIngredient);
    const rowId = getRowIdentifier(rowData);
    if (rowId != null && selectedId != null && rowId === selectedId) {
      return 'selected-row';
    }
    return '';
  };

  // Icons column (Edit,Does Schedule, reactive/Deactivate)
  const iconsForActions = (rowData: ActiveIngredientRow) => {
    const isRowActive = rowData?.isActive ?? rowData?.isValid;
    return (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
          onClick={() => {
            setActiveIngredient(rowData);
            setCarouselActiveIndex(1);
          }}
      />
        {isRowActive ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
              setActiveIngredient(rowData);
            setStateOfDeleteActiveIngredient('deactivate');
            setOpenConfirmDeleteActiveIngredient(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
              setActiveIngredient(rowData);
            setStateOfDeleteActiveIngredient('reactivate');
            setOpenConfirmDeleteActiveIngredient(true);
          }}
        />
      )}
    </div>
  );
  };

  // Filter table
  const filters = () => (
    <Form layout="inline" fluid>
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={updatedRecord => {
          setRecordOfFilter({
            ...recordOfFilter,
            filter: updatedRecord.filter,
            value: ''
          });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
      />
      {recordOfFilter.filter === 'medicalCategory' ? (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={medicalCategoryOptions}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder="Select Medical Category"
        />
      ) : (
      <MyInput
        fieldName="value"
        fieldType="text"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
          placeholder={
            recordOfFilter.filter === 'drugClass'
              ? 'Enter class IDs (comma separated)'
              : 'Search'
          }
        />
      )}
      <MyButton
        color="var(--deep-blue)"
        width="100px"
        onClick={() => {
          const trimmedValue =
            typeof recordOfFilter.value === 'string'
              ? recordOfFilter.value.trim()
              : recordOfFilter.value;

          const resetState = () => {
            setAppliedFilter({ filter: '', value: '' });
            setListRequest(prev => ({
              ...prev,
              pageNumber: 1,
              timestamp: Date.now()
            }));
          };

          if (!recordOfFilter.filter || !trimmedValue) {
            resetState();
            return;
          }

          const touchListRequest = () => {
            setListRequest(prev => ({
              ...prev,
              pageNumber: 1,
              timestamp: Date.now()
            }));
          };

          switch (recordOfFilter.filter) {
            case 'medicalCategory':
              setAppliedFilter({ filter: 'medicalCategory', value: String(trimmedValue) });
              touchListRequest();
              break;
            case 'drugClass': {
              const ids = String(trimmedValue)
                .split(',')
                .map(value => value.trim())
                .filter(Boolean);
              setAppliedFilter({ filter: 'drugClass', value: ids.join(',') });
              touchListRequest();
              break;
            }
            case 'name':
              setAppliedFilter({ filter: 'name', value: String(trimmedValue) });
              touchListRequest();
              break;
            case 'atcCode':
              setAppliedFilter({ filter: 'atcCode', value: String(trimmedValue) });
              touchListRequest();
              break;
            default:
              resetState();
              break;
          }
        }}
      >
        Search
      </MyButton>
    </Form>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'name',
      title: <Translate>Active Ingredients Name</Translate>
    },
    {
      key: 'drugClass',
      title: <Translate>Medication Class</Translate>,
      render: rowData =>
        rowData.drugClassLvalue ? rowData.drugClassLvalue.lovDisplayVale : rowData.drugClassLkey
    },
    {
      key: 'atcCode',
      title: <Translate>ATC Code</Translate>
    },
    {
      key: '',
      title: <Translate>Status</Translate>,
      render: rowData => ((rowData.isActive ?? rowData.isValid) ? 'Active' : 'Inactive')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      render: rowData => iconsForActions(rowData)
    }
  ];

  // handle new
  const handleNew = () => {
    setActiveIngredient({
      ...newApActiveIngredient,
      id: undefined,
      isActive: undefined
    });
    setCarouselActiveIndex(1);
  };

  // Handle page change in navigation
  const handlePageChange = (_: unknown, newPage: number) => {
    const links = !emptyDrugClassResponse
      ? (activeIngredientListResponse as { links?: any })?.links
      : undefined;
    if (!links) {
      setListRequest(prev => ({
        ...prev,
        pageNumber: newPage + 1,
        timestamp: Date.now()
      }));
      return;
    }

    PaginationPerPage.handlePageChange(
      _,
      newPage,
      {
        page: listRequest.pageNumber - 1,
        size: listRequest.pageSize,
        timestamp: listRequest.timestamp
      },
      links,
      updated => {
        const { page, size, timestamp } = updated ?? {};
        setListRequest(prev => ({
          ...prev,
          pageNumber: (page ?? 0) + 1,
          pageSize: size ?? prev.pageSize,
          timestamp: timestamp ?? Date.now()
        }));
      }
    );
  };

  // Handle change rows per page in navigation
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest(prev => ({
      ...prev,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1,
      timestamp: Date.now()
    }));
  };

  const handleToggleActiveIngredient = () => {
    const id = getRowIdentifier(activeIngredient);
    if (id === null) {
        dispatch(
          notify({
          msg: 'Unable to update this Active Ingredient. Please select a record first.',
          sev: 'warning'
        })
      );
      return;
    }

    setOpenConfirmDeleteActiveIngredient(false);
    toggleActiveIngredient({ id })
      .unwrap()
      .then(() => {
        if (activeIngredientRefetch) {
        activeIngredientRefetch();
        }
        dispatch(
          notify({
            msg:
              stateOfDeleteActiveIngredient === 'deactivate'
                ? 'The Active Ingredient was successfully Deactivated'
                : 'The Active Ingredient was successfully Reactivated',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg:
              stateOfDeleteActiveIngredient === 'deactivate'
                ? 'Failed to deactivate this Active Ingredient'
                : 'Failed to reactivate this Active Ingredient',
            sev: 'error'
          })
        );
      });
  };

  // Effects
  useEffect(() => {
    dispatch(setPageCode('Active_Ingredients'));
    dispatch(setDivContent('Active Ingredients'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [dispatch]);

  useEffect(() => {
    if (toggleActiveIngredientMutation.isSuccess) {
      setListRequest(prev => ({
        ...prev,
        timestamp: Date.now()
      }));
    }
  }, [toggleActiveIngredientMutation.isSuccess]);

  // update list when filter is changed
  useEffect(() => {
    if (activeIngredientRefetch) {
      activeIngredientRefetch();
    }
  }, [carouselActiveIndex, activeIngredientRefetch]);

  return (
    <Carousel
      style={{ height: 'auto', backgroundColor: 'var(--rs-body)' }}
      autoplay={false}
      activeIndex={carouselActiveIndex}
    >
      <Panel>

        <MyTable
          height={450}
          data={tableData}
          loading={isFetching}
          columns={tableColumns}
          rowClassName={isSelected}
          filters={filters()}
          onRowClick={rowData => {
            setActiveIngredient(rowData as ActiveIngredientRow);
          }}
          sortColumn={listRequest.sortBy}
          sortType={listRequest.sortType}
          onSortChange={(sortBy, sortType) => {
            if (sortBy) {
              setListRequest(prev => ({
                ...prev,
                sortBy,
                sortType,
                pageNumber: 1,
                timestamp: Date.now()
              }));
            }
          }}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          tableButtons={<div className="container-of-add-new-button">
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={handleNew}
            width="109px"
          >
            Add New
          </MyButton>
        </div>}
        />
        
        <DeletionConfirmationModal
          open={openConfirmDeleteActiveIngredient}
          setOpen={setOpenConfirmDeleteActiveIngredient}
          itemToDelete="Active Ingredient"
          actionButtonFunction={handleToggleActiveIngredient}
          actionType={stateOfDeleteActiveIngredient}
        />
      </Panel>
      <NewActiveIngredients
        selectedactiveIngredient={
          activeIngredient
            ? (activeIngredient as ApActiveIngredient)
            : { ...newApActiveIngredient }
        }
        goBack={() => {
          setCarouselActiveIndex(0);
        }}
      />
    </Carousel>
  );
};

export default ActiveIngredientsSetup;
