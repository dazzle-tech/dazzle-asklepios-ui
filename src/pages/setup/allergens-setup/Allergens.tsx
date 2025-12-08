import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Form } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import AddEditAllergens from './AddEditAllergens';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import './styles.less';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { formatEnumString } from '@/utils';
import {
  useGetAllergensQuery,
  useAddAllergenMutation,
  useUpdateAllergenMutation,
  useToggleAllergenIsActiveMutation,
  useLazyGetAllergensByTypeQuery,
  useLazyGetAllergensByNameQuery
} from '@/services/setup/allergensService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { Allergen } from '@/types/model-types-new';
import { newAllergen } from '@/types/model-types-constructor-new';
import { useEnumOptions } from '@/services/enumsApi';

const Allergens: React.FC = () => {
  const dispatch = useAppDispatch();

  // Row state
  const [allergens, setAllergens] = useState<Allergen>({ ...newAllergen });

  // UI state
  const [width, setWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const [popupOpen, setPopupOpen] = useState(false);
  const [openConfirmDeleteAllergens, setOpenConfirmDeleteAllergens] = useState<boolean>(false);
  const [stateOfDeleteAllergens, setStateOfDeleteAllergens] = useState<
    'delete' | 'deactivate' | 'reactivate'
  >('delete');

  // Filters state
  const [recordOfFilter, setRecordOfFilter] = useState<{ filter: string; value: any }>({
    filter: '',
    value: ''
  });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<Allergen[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [filteredLinks, setFilteredLinks] = useState<any | undefined>(undefined);

  // Pagination (unfiltered list via Link headers)
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  // Pagination for filtered mode
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });

  // API hooks
  const {
    data: allergensPage,
    isFetching,
    refetch
  } = useGetAllergensQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort
  });

  const [addAllergen] = useAddAllergenMutation();
  const [updateAllergen] = useUpdateAllergenMutation();
  const [toggleAllergenIsActive] = useToggleAllergenIsActiveMutation();

  const [fetchByType] = useLazyGetAllergensByTypeQuery();
  const [fetchByName] = useLazyGetAllergensByNameQuery();

  // Enum options for type filter
  const allergenTypeOptions = useEnumOptions('AllergenType');

  // Derived data
  const totalCount = useMemo(
    () => (isFiltered ? filteredTotal : allergensPage?.totalCount ?? 0),
    [isFiltered, filteredTotal, allergensPage?.totalCount]
  );
  const links = (isFiltered ? filteredLinks : allergensPage?.links) || {};
  const tableData = useMemo(
    () => (isFiltered ? filteredData : allergensPage?.data ?? []),
    [isFiltered, filteredData, allergensPage?.data]
  );

  // Filter fields
  const filterFields = [
    { label: 'Allergens Type', value: 'type' },
    { label: 'Allergens Name', value: 'name' }
  ];

  // Helpers
  const resetToUnfiltered = () => {
    setIsFiltered(false);
    setFilteredData([]);
    setFilteredTotal(0);
    setFilteredLinks(undefined);
    setFilterPagination(prev => ({ ...prev, page: 0 }));
    setPaginationParams(prev => ({ ...prev, page: 0, sort: 'id,asc', timestamp: Date.now() }));
    refetch();
  };

  const runFilterQuery = async (
    fieldName: string,
    value: any,
    page = 0,
    size = filterPagination.size,
    sort = filterPagination.sort
  ) => {
    if (!value && value !== 0) return undefined;

    if (fieldName === 'type') {
      return await fetchByType({ type: String(value), page, size, sort }).unwrap();
    } else if (fieldName === 'name') {
      return await fetchByName({ name: String(value), page, size, sort }).unwrap();
    }
    return undefined;
  };

  const handleFilterChange = async (
    fieldName: string,
    value: any,
    page = 0,
    size = filterPagination.size,
    sort = filterPagination.sort
  ) => {
    if (!value) {
      resetToUnfiltered();
      return;
    }
    try {
      const resp = await runFilterQuery(fieldName, value, page, size, sort);
      setFilteredData(resp?.data ?? []);
      setFilteredTotal(resp?.totalCount ?? 0);
      setFilteredLinks(resp?.links || {});
      setIsFiltered(true);
      setFilterPagination(prev => ({ ...prev, page, size, sort }));
    } catch {
      resetToUnfiltered();
    }
  };

  // CRUD handlers
  const handleNew = () => {
    setAllergens({ ...newAllergen });
    setPopupOpen(true);
  };

  const handleSave = async () => {
    setPopupOpen(false);
    const isUpdate = !!allergens.id;

    const payload: any = {
      ...allergens,
      name: (allergens.name || '').trim(),
      description: allergens.description ?? '',
      isActive: !!allergens.isActive
    };

    try {
      if (isUpdate) {
        const updated = await updateAllergen({ id: allergens.id!, ...payload }).unwrap();
        dispatch(notify({ msg: 'Allergen updated successfully', sev: 'success' }));

        if (isFiltered) {
          // Update the row in filtered list
          setFilteredData(prev => prev.map(row => (row.id === updated.id ? updated : row)));
        } else {
          // Unfiltered: refetch
          setPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));
          refetch();
        }
      } else {
        // Create
        const created = await addAllergen(payload).unwrap();
        dispatch(notify({ msg: 'Allergen added successfully', sev: 'success' }));

        if (isFiltered) {
          // نتحقق إذا الـ allergen الجديد يطابق شروط الفلتر
          const filterField = recordOfFilter.filter;
          const filterValue = recordOfFilter.value;
          let matchesFilter = false;

          if (filterField === 'type') {
            matchesFilter = created.type === String(filterValue);
          } else if (filterField === 'name') {
            matchesFilter = (created.name ?? '')
              .toLowerCase()
              .includes(String(filterValue).toLowerCase());
          }

          if (matchesFilter) {
            // نضيف الـ allergen الجديد في أول القائمة المفلترة
            setFilteredData(prev => [created, ...prev]);
            setFilteredTotal(prev => prev + 1);
            // نرجع لأول صفحة عشان نشوف الـ allergen الجديد
            setFilterPagination(prev => ({ ...prev, page: 0 }));
          } else {
            // إذا ما بطابق الفلتر، نعلم المستخدم
            dispatch(
              notify({
                msg: 'Allergen added but does not match current filter',
                sev: 'info'
              })
            );
          }
        } else {
          // Unfiltered: back to first page and refetch
          setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
          refetch();
        }
      }
    } catch (err: any) {
      const data = err?.data ?? {};
      const traceId = data?.traceId || data?.requestId || data?.correlationId;
      const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

      const isValidation =
        data?.message === 'error.validation' ||
        data?.title === 'Method argument not valid' ||
        (typeof data?.type === 'string' && data.type.includes('constraint-violation'));

      if (isValidation && Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
        const fieldLabels: Record<string, string> = {
          id: 'Id',
          name: 'Name',
          type: 'Type',
          description: 'Description',
          isActive: 'Active'
        };
        const normalizeMsg = (msg: string) => {
          const m = (msg || '').toLowerCase();
          if (m.includes('must not be null')) return 'is required';
          if (m.includes('must not be blank')) return 'must not be blank';
          if (m.includes('size must be between')) return 'length is out of range';
          if (m.includes('must be greater')) return 'value is too small';
          if (m.includes('must be less')) return 'value is too large';
          if (m.includes('not a valid enum')) return 'has invalid value';
          return msg || 'invalid value';
        };

        const lines = data.fieldErrors.map((fe: any) => {
          const label = fieldLabels[fe.field] ?? fe.field;
          return `• ${label}: ${normalizeMsg(fe.message)}`;
        });

        dispatch(
          notify({
            msg: `Please fix the following fields:\n${lines.join('\n')}` + suffix,
            sev: 'error'
          })
        );
        return;
      }

      const messageProp: string = data?.message || '';
      const errorKey = messageProp.startsWith('error.') ? messageProp.substring(6) : undefined;
      const keyMap: Record<string, string> = {
        'payload.required': 'Allergen payload is required.',
        'name.required': 'Allergen name is required.',
        'type.required': 'Allergen type is required.',
        'unique.name': 'Allergen name already exists.',
        'db.constraint': 'Database constraint violation.',
        notfound: 'Allergen not found.',
        'id.mismatch': 'Path id and body id mismatch.'
      };

      const humanMsg =
        (errorKey && keyMap[errorKey]) ||
        data?.detail ||
        data?.title ||
        data?.message ||
        'Unexpected error';

      dispatch(notify({ msg: humanMsg + suffix, sev: 'error' }));
    }
  };

  const doToggle = async () => {
    try {
      if (!allergens?.id) return;
      const toggledId = allergens.id as number;
      const res = await toggleAllergenIsActive({ id: toggledId as any }).unwrap();
      const newIsActive =
        res && typeof (res as any).isActive === 'boolean'
          ? (res as any).isActive
          : !allergens.isActive;

      setAllergens(prev =>
        prev && prev.id === toggledId ? { ...prev, isActive: newIsActive } : prev
      );

      if (isFiltered) {
        setFilteredData(prev =>
          prev.map(row => (row.id === toggledId ? { ...row, isActive: newIsActive } : row))
        );
      } else {
        refetch();
      }

      dispatch(
        notify({
          msg:
            stateOfDeleteAllergens === 'deactivate'
              ? 'The Allergens was successfully Deactivated'
              : 'The Allergens was successfully Reactivated',
          sev: 'success'
        })
      );
    } catch {
      dispatch(
        notify({
          msg:
            stateOfDeleteAllergens === 'deactivate'
              ? 'Faild to Deactivate this Allergens'
              : 'Faild to Reactivate this Allergens',
          sev: 'error'
        })
      );
    }
  };

  const handleDeactivate = () => {
    setOpenConfirmDeleteAllergens(false);
    setStateOfDeleteAllergens('deactivate');
    doToggle();
  };

  const handleReactivate = () => {
    setOpenConfirmDeleteAllergens(false);
    setStateOfDeleteAllergens('reactivate');
    doToggle();
  };

  // Pagination handlers
  const handlePageChange = (_: unknown, newPage: number) => {
    if (isFiltered) {
      // Filtered mode: re-run same filter with new page
      handleFilterChange(
        recordOfFilter.filter,
        recordOfFilter.value,
        newPage,
        filterPagination.size,
        filterPagination.sort
      );
      return;
    }

    // Unfiltered mode: use Link headers
    const currentPage = paginationParams.page;
    let targetLink: string | null | undefined = null;

    if (newPage > currentPage && links.next) targetLink = links.next;
    else if (newPage < currentPage && links.prev) targetLink = links.prev;
    else if (newPage === 0 && links.first) targetLink = links.first;
    else if (newPage > currentPage + 1 && links.last) targetLink = links.last;

    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setPaginationParams(prev => ({
        ...prev,
        page,
        size,
        timestamp: Date.now()
      }));
    }
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);

    if (isFiltered) {
      setFilterPagination(prev => ({ ...prev, size: newSize, page: 0 }));
      handleFilterChange(
        recordOfFilter.filter,
        recordOfFilter.value,
        0,
        newSize,
        filterPagination.sort
      );
    } else {
      setPaginationParams(prev => ({
        ...prev,
        size: newSize,
        page: 0,
        timestamp: Date.now()
      }));
    }
  };

  // Row selection style
  const isSelected = (rowData: any) =>
    rowData && allergens && rowData.id === allergens.id ? 'selected-row' : '';

  // Columns
  const tableColumns = [
    { key: 'name', title: <Translate>Allergens Name</Translate>, flexGrow: 4 },
    {
      key: 'type',
      title: <Translate>Allergens Type</Translate>,
      flexGrow: 4,
      render: (rowData: any) => formatEnumString(rowData.type)
    },
    { key: 'description', title: <Translate>Description</Translate>, flexGrow: 4 },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: (rowData: any) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => {
              setAllergens(rowData);
              setPopupOpen(true);
            }}
          />
          {rowData?.isActive ? (
            <MdDelete
              className="icons-style"
              title="Deactivate"
              size={24}
              fill="var(--primary-pink)"
              onClick={() => {
                setAllergens(rowData);
                setStateOfDeleteAllergens('deactivate');
                setOpenConfirmDeleteAllergens(true);
              }}
            />
          ) : (
            <FaUndo
              className="icons-style"
              title="Activate"
              size={20}
              fill="var(--primary-gray)"
              onClick={() => {
                setAllergens(rowData);
                setStateOfDeleteAllergens('reactivate');
                setOpenConfirmDeleteAllergens(true);
              }}
            />
          )}
        </div>
      )
    }
  ];

  // Filters UI
  const filters = () => {
    const selected = recordOfFilter.filter;

    const dynamicInput =
      selected === 'type' ? (
        <MyInput
          width={220}
          fieldName="value"
          fieldLabel=""
          fieldType="select"
          selectData={allergenTypeOptions ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          searchable={false}
        />
      ) : (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder="Search"
          width={220}
        />
      );

    return (
      <Form layout="inline" fluid style={{ display: 'flex', gap: 10 }}>
        <MyInput
          selectDataValue="value"
          selectDataLabel="label"
          selectData={filterFields}
          fieldName="filter"
          fieldType="select"
          record={recordOfFilter}
          setRecord={(updatedRecord: any) => {
            setRecordOfFilter({ filter: updatedRecord.filter, value: '' });
          }}
          showLabel={false}
          placeholder="Select Filter"
          searchable={false}
          width="180px"
        />
        {dynamicInput}
        <MyButton
          color="var(--deep-blue)"
          onClick={() => {
            if (!recordOfFilter.value && recordOfFilter.value !== 0) {
              resetToUnfiltered();
            } else {
              handleFilterChange(
                recordOfFilter.filter,
                recordOfFilter.value,
                0,
                filterPagination.size,
                filterPagination.sort
              );
            }
          }}
          width="80px"
        >
          Search
        </MyButton>
      </Form>
    );
  };

  // Effects
  useEffect(() => {
    dispatch(setPageCode('Allergens'));
    dispatch(setDivContent('Allergens'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // If user clears value manually, revert to unfiltered list
  useEffect(() => {
    if (!recordOfFilter.value && isFiltered) {
      resetToUnfiltered();
    }
  }, [recordOfFilter.value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Panel>
      <MyTable
        height={450}
        data={tableData}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={(rowData: any) => setAllergens(rowData)}
        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterPagination.size : paginationParams.size}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={handleNew}
              width="109px"
            >
              Add New
            </MyButton>
          </div>
        }
      />

      <AddEditAllergens
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        allergens={allergens as any}
        setAllergens={setAllergens as any}
        handleSave={handleSave}
      />

      <DeletionConfirmationModal
        open={openConfirmDeleteAllergens}
        setOpen={setOpenConfirmDeleteAllergens}
        itemToDelete="Allergens"
        actionButtonFunction={
          stateOfDeleteAllergens === 'deactivate' ? handleDeactivate : handleReactivate
        }
        actionType={stateOfDeleteAllergens}
      />
    </Panel>
  );
};

export default Allergens;
