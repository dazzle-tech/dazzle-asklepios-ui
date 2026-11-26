import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useState } from 'react';
import { Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
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
  useToggleAllergenIsActiveMutation
} from '@/services/setup/allergensService';
import { Allergen } from '@/types/model-types-new';
import { newAllergen } from '@/types/model-types-constructor-new';
import { useEnumOptions } from '@/services/enumsApi';
import TranslationModal from '@/components/TranslationModal';

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
   const [showTranslationModal, setShowTranslationModal] = useState<boolean>(false);
    
  // Header filters: draft values typed in the inputs, applied on Enter / select change.
  // Everything is sent to one endpoint and combined with AND.
  const emptyHeaderFilters = { name: '', type: '' };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });

  // API hooks
  const {
    data: allergensPage,
    isFetching,
    refetch
  } = useGetAllergensQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort,
    isActive: activeFilter,
    ...appliedFilters
  });

  const [addAllergen] = useAddAllergenMutation();
  const [updateAllergen] = useUpdateAllergenMutation();
  const [toggleAllergenIsActive] = useToggleAllergenIsActiveMutation();

  // Enum options for type filter
  const allergenTypeOptions = useEnumOptions('AllergenType');

  const totalCount = allergensPage?.totalCount ?? 0;
  const tableData = useMemo(() => allergensPage?.data ?? [], [allergensPage?.data]);

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
        setShowTranslationModal(true);
        setAllergens(prev => (prev?.id === updated?.id ? { ...prev, ...updated } : prev));
        refetch();
      } else {
        // Create
        const created = await addAllergen(payload).unwrap();
        dispatch(notify({ msg: 'Allergen added successfully', sev: 'success' }));
        setShowTranslationModal(true);
        setAllergens(created);
        // Reload the list with the current filters
        refetch();
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

      refetch();

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
    setPaginationParams(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setPaginationParams(prev => ({ ...prev, size: newSize, page: 0 }));
  };

  // Applying one header filter also applies whatever is typed in the others
  const applyHeaderFilter = (field: HeaderFilterField, value: string) => {
    const next = { ...headerFilters, [field]: value };
    setHeaderFilters(next);
    setAppliedFilters(next);
    setPaginationParams(prev => ({ ...prev, page: 0 }));
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
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  }, [statusFilter]);

  // Row selection style
  const isSelected = (rowData: any) =>
    rowData && allergens && rowData.id === allergens.id ? 'selected-row' : '';

  // Columns
  const tableColumns = [
    {
      key: 'name',
      title: <Translate>Allergens Name</Translate>,
      width: 220,
      ...headerSearch('name', 'Search name')
    },
    {
      key: 'type',
      title: <Translate>Allergens Type</Translate>,
      width: 180,
      ...headerSearch('type'),
      searchType: 'select' as const,
      searchOptions: [{ label: 'All', value: '' }, ...(allergenTypeOptions ?? [])],
      render: (rowData: any) => formatEnumString(rowData.type)
    },
    { key: 'description', title: <Translate>Description</Translate>, flexGrow: 4 },
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
      render: (rowData: any) => (
        <MyBadgeStatus
          contant={rowData?.isActive ? 'Active' : 'Inactive'}
          color={rowData?.isActive ? '#415be7' : '#b1acacff'}
        />
      )
    },
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

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';
  
  return (
    <Panel dir={dir}>
      <MyTable
        height={450}
        data={tableData}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(rowData: any) => setAllergens(rowData)}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
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
        dontTranslateData 
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
       <TranslationModal
        open={showTranslationModal}
        setOpen={setShowTranslationModal}
        fields={[
          {
            fieldName: 'name',
            value: allergens.name
          }
        ]}
      />
    </Panel>
  );
};

export default Allergens;
