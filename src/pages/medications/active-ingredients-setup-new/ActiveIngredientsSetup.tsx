import Translate from '@/components/Translate';
import React, { useState, useEffect, useMemo } from 'react';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { Carousel, Panel } from 'rsuite';
import {
  useGetActiveIngredientsQuery,
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
import { useGetAllMedicationCategoriesQuery } from '@/services/setup/medication-categories/MedicationCategoriesService';
import { useGetAllMedicationCategoriesClassesQuery } from '@/services/setup/medication-categories/MedicationCategoriesClassService';
import { ActiveIngredient } from '@/types/model-types-new';
const ActiveIngredientsSetup = () => {
  const dispatch = useAppDispatch();
  type ActiveIngredientRow = ActiveIngredient & {
    id?: number | string;
    isActive?: boolean | null;
  };
  const [activeIngredient, setActiveIngredient] = useState<ActiveIngredientRow | null>(null);
  const [openConfirmDeleteActiveIngredient, setOpenConfirmDeleteActiveIngredient] =
    useState<boolean>(false);
  // Header filters: draft values typed in the inputs, applied on Enter / select change.
  // Everything is sent to one endpoint and combined with AND.
  const emptyHeaderFilters = { name: '', medicalCategory: '', drugClass: '', atcCode: '' };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);
  const [stateOfDeleteActiveIngredient, setStateOfDeleteActiveIngredient] =
    useState<string>('delete');
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    timestamp: Date.now()
  });

  const queryParams = useMemo(
    () => ({
      page: paginationParams.page,
      size: paginationParams.size,
      sort: sortColumn ? `${sortColumn},${sortType ?? 'asc'}` : undefined,
      timestamp: paginationParams.timestamp
    }),
    [paginationParams, sortColumn, sortType]
  );

  const { data: medicationCategories } = useGetAllMedicationCategoriesQuery(undefined);
  const { data: medClassList } = useGetAllMedicationCategoriesClassesQuery({});

  // Category and class both narrow the drug classes: the category expands to its classes,
  // and with both chosen only the class inside that category is kept (none -> no rows).
  const drugClassIds = useMemo(() => {
    const { medicalCategory, drugClass } = appliedFilters;
    if (!medicalCategory && !drugClass) return undefined;
    let ids: string[] = drugClass ? [drugClass] : [];
    if (medicalCategory) {
      const inCategory = (medClassList ?? [])
        .filter((c: any) => String(c.medicationCategoriesId) === String(medicalCategory))
        .map((c: any) => String(c.id));
      ids = drugClass ? ids.filter(id => inCategory.includes(id)) : inCategory;
    }
    return ids.length ? ids : ['-1'];
  }, [appliedFilters, medClassList]);

  const {
    data: activeIngredientListResponse,
    refetch: activeIngredientRefetch,
    isFetching
  } = useGetActiveIngredientsQuery({
    ...queryParams,
    isActive: activeFilter,
    name: appliedFilters.name,
    atcCode: appliedFilters.atcCode,
    drugClassIds
  });

  const [toggleActiveIngredient, toggleActiveIngredientMutation] =
    useToggleActiveIngredientIsActiveMutation();

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
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;
  const totalCount = activeIngredientListResponse?.totalCount ?? 0;

  // Applying one header filter also applies whatever is typed in the others
  const applyHeaderFilter = (field: HeaderFilterField, value: string) => {
    const next = { ...headerFilters, [field]: value };
    setHeaderFilters(next);
    setAppliedFilters(next);
    setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
  };

  const headerSearch = (field: HeaderFilterField, placeholder?: string) => ({
    searchable: true,
    searchPlaceholder: placeholder,
    searchValue: headerFilters[field],
    onSearchChange: (value: string) => setHeaderFilters(prev => ({ ...prev, [field]: value })),
    onSearchSubmit: (value?: string) => applyHeaderFilter(field, value ?? headerFilters[field])
  });

  // Changing the status filter starts again from the first page
  useEffect(() => {
    setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
  }, [statusFilter]);

  const medicalCategoryOptions = useMemo(
    () => medicationCategories ?? [],
    [medicationCategories]
  );

  // class name for selected row
  const getRowIdentifier = (row?: ActiveIngredientRow | null) =>
    row?.id ?? row?.id ?? null;

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
    const isRowActive = rowData?.isActive
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

  //Table columns
  const tableColumns = [
    {
      key: 'name',
      title: <Translate>Active Ingredients Name</Translate>,
      width: 220,
      ...headerSearch('name', 'Search name')
    },
    {
      key: 'medicalCategory',
      title: <Translate>Medical Category</Translate>,
      width: 190,
      ...headerSearch('medicalCategory'),
      searchType: 'select' as const,
      searchOptions: [
        { label: 'All', value: '' },
        ...medicalCategoryOptions.map((c: any) => ({ label: c.name, value: String(c.id) }))
      ],
      render: rowData => {
        const medClass = medClassList?.find(item => item.id === rowData.drugClassId);
        const category = medicalCategoryOptions.find(
          (c: any) => c.id === medClass?.medicationCategoriesId
        );
        return category?.name ?? '';
      }
    },
    {
      key: 'drugClassId',
      title: <Translate>Medication Class</Translate>,
      width: 200,
      ...headerSearch('drugClass'),
      searchType: 'select' as const,
      searchOptions: [
        { label: 'All', value: '' },
        ...(medClassList ?? []).map((c: any) => ({ label: c.name, value: String(c.id) }))
      ],
      render: rowData => {
                const medClass = medClassList?.find(
                 item => item.id === rowData.drugClassId
                );
                return medClass ? medClass.name : rowData.drugClassId;
      }
    },
    {
      key: 'atcCode',
      title: <Translate>ATC Code</Translate>,
      width: 140,
      ...headerSearch('atcCode', 'Search ATC')
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      width: 120,
      searchable: true,
      searchType: 'select' as const,
      searchOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'All', value: 'all' }
      ],
      searchValue: statusFilter,
      onSearchChange: (value: string) => setStatusFilter(value as 'active' | 'inactive' | 'all'),
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

  const handlePageChange = (event: unknown, newPage: number) => {
    setPaginationParams(prev => ({ ...prev, page: newPage, timestamp: Date.now() }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    if (Number.isNaN(newSize) || newSize <= 0) {
      return;
    }
    setPaginationParams(prev => ({ ...prev, size: newSize, page: 0, timestamp: Date.now() }));
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
        activeIngredientRefetch();
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
      setPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));
    }
  }, [toggleActiveIngredientMutation.isSuccess]);

  // update list when filter is changed
  // Reload the list when coming back from the add/edit view
  useEffect(() => {
    activeIngredientRefetch();
  }, [carouselActiveIndex]); // eslint-disable-line react-hooks/exhaustive-deps

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <Carousel
      style={{ height: 'auto', backgroundColor: 'var(--rs-body)' }}
      autoplay={false}
      activeIndex={carouselActiveIndex}
    >
      <Panel dir={dir}>

        <MyTable
          height={450}
          data={tableData}
          loading={isFetching}
          columns={tableColumns}
          rowClassName={isSelected}
          onRowClick={rowData => {
            setActiveIngredient(rowData as ActiveIngredientRow);
          }}
          sortColumn={sortColumn}
          sortType={sortType}
          onSortChange={(sortBy, sortType) => {
            if (sortBy) {
              setSortColumn(sortBy);
              setSortType((sortType ?? 'asc') as 'asc' | 'desc');
              setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
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
