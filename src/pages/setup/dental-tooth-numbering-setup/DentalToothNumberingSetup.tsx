import Translate from '@/components/Translate';
import React, { useEffect, useState } from 'react';
import './styles.less';
import { Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { extractErrorMessage } from '@/utils/extractErrorMessage';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import AddEditDentalToothNumberingMethod from './AddEditDentalToothNumberingMethod';
import { newDentalToothNumberingMethod } from '@/types/model-types-constructor-new';
import { DentalToothNumberingMethod } from '@/types/model-types-new';
import {
  useGetAllDentalToothNumberingMethodsQuery,
  useCreateDentalToothNumberingMethodMutation,
  useUpdateDentalToothNumberingMethodMutation,
  useToggleDentalToothNumberingMethodActiveMutation
} from '@/services/setup/dental-tooth-numbering/dentalToothNumberingService';
import {
  ALL_TOOTH_IDS,
  NUMBERING_LABEL_MAX,
  NUMBERING_METHOD_DESCRIPTION_MAX,
  NUMBERING_METHOD_NAME_MAX,
  isToothLabelSetComplete,
  type ToothLabelMap
} from '@/utils/toothNumberingSystems';

const labelledCount = (labels?: ToothLabelMap | null) =>
  ALL_TOOTH_IDS.filter(id => (labels?.[id] ?? '').trim()).length;

const DentalToothNumberingSetup = () => {
  const dispatch = useAppDispatch();
  const [method, setMethod] = useState<DentalToothNumberingMethod>({ ...newDentalToothNumberingMethod });
  const [popupOpen, setPopupOpen] = useState(false);
  const [openConfirmToggle, setOpenConfirmToggle] = useState(false);
  const [toggleAction, setToggleAction] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [width, setWidth] = useState<number>(window.innerWidth);
  // Header filters: draft value typed in the input, applied on Enter.
  // Everything is sent to one endpoint and combined with AND.
  const emptyHeaderFilters = { name: '' };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';
  const [paginationParams, setPaginationParams] = useState({ page: 0, size: 15, sort: 'id,asc' });
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  const [createMethod] = useCreateDentalToothNumberingMethodMutation();
  const [updateMethod] = useUpdateDentalToothNumberingMethodMutation();
  const [toggleActive] = useToggleDentalToothNumberingMethodActiveMutation();

  useEffect(() => {
    dispatch(setPageCode('Dental_Tooth_Numbering_Setup'));
    dispatch(setDivContent('Dental Tooth Numbering Setup'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: listResponse, isFetching: isListFetching, refetch } =
    useGetAllDentalToothNumberingMethodsQuery({ ...paginationParams, ...appliedFilters, isActive: activeFilter });

  // Copy source list (all saved methods) for the form's "Start from" selector.
  const { data: allMethodsResponse } = useGetAllDentalToothNumberingMethodsQuery({
    page: 0,
    size: 500,
    sort: 'name,asc'
  });

  const cleanLabels = (labels?: ToothLabelMap | null): ToothLabelMap => {
    const cleaned: ToothLabelMap = {};
    ALL_TOOTH_IDS.forEach(id => {
      const label = (labels?.[id] ?? '').trim();
      if (label) cleaned[id] = label;
    });
    return cleaned;
  };

  // Mirrors the backend rules; the backend remains the source of truth.
  const validateClient = (payload: DentalToothNumberingMethod): string | null => {
    const name = payload.name?.trim() ?? '';
    if (!name) return 'Name is required';
    if (name.length > NUMBERING_METHOD_NAME_MAX) {
      return `Name must be at most ${NUMBERING_METHOD_NAME_MAX} characters`;
    }
    if ((payload.description ?? '').length > NUMBERING_METHOD_DESCRIPTION_MAX) {
      return `Description must be at most ${NUMBERING_METHOD_DESCRIPTION_MAX} characters`;
    }
    const labels = payload.toothLabels ?? {};
    if (ALL_TOOTH_IDS.some(id => (labels[id] ?? '').length > NUMBERING_LABEL_MAX)) {
      return `Labels must be at most ${NUMBERING_LABEL_MAX} characters`;
    }
    if (payload.isActive && !isToothLabelSetComplete(labels)) {
      return 'Label all 52 teeth without duplicates before activating, or save the method as inactive';
    }
    return null;
  };

  const handleNew = () => {
    setMethod({ ...newDentalToothNumberingMethod, toothLabels: {} });
    setPopupOpen(true);
  };

  const handleSave = async () => {
    const payload: DentalToothNumberingMethod = {
      name: method.name?.trim() ?? '',
      description: method.description?.trim() ?? '',
      toothLabels: cleanLabels(method.toothLabels),
      isActive: method.isActive ?? false
    };

    const clientError = validateClient(payload);
    if (clientError) {
      dispatch(notify({ msg: clientError, sev: 'warning' }));
      return;
    }

    try {
      dispatch(showSystemLoader());
      if (method.id) {
        await updateMethod({ id: method.id, body: { ...payload, id: method.id } }).unwrap();
        dispatch(notify({ msg: 'Tooth numbering method updated successfully', sev: 'success' }));
      } else {
        await createMethod(payload).unwrap();
        dispatch(notify({ msg: 'Tooth numbering method created successfully', sev: 'success' }));
      }
      setPopupOpen(false);
      refetch();
    } catch (err) {
      const msg = extractErrorMessage(err) || 'Failed to save tooth numbering method';
      dispatch(notify({ msg, sev: 'error' }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const handleToggle = async () => {
    if (!method.id) return;
    try {
      dispatch(showSystemLoader());
      await toggleActive(method.id).unwrap();
      dispatch(
        notify({
          msg:
            toggleAction === 'deactivate'
              ? 'Tooth numbering method deactivated successfully'
              : 'Tooth numbering method reactivated successfully',
          sev: 'success'
        })
      );
      setOpenConfirmToggle(false);
      refetch();
    } catch (err) {
      const msg = extractErrorMessage(err) || 'Action failed, please try again';
      dispatch(notify({ msg, sev: 'error' }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const isSelected = (rowData: DentalToothNumberingMethod) =>
    rowData && method && rowData.id === method.id ? 'selected-row' : '';

  const iconsForActions = (rowData: DentalToothNumberingMethod) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setMethod({ ...rowData, toothLabels: { ...(rowData.toothLabels ?? {}) } });
          setPopupOpen(true);
        }}
      />
      {rowData.isActive ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setMethod(rowData);
            setToggleAction('deactivate');
            setOpenConfirmToggle(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
          onClick={() => {
            setMethod(rowData);
            setToggleAction('reactivate');
            setOpenConfirmToggle(true);
          }}
        />
      )}
    </div>
  );

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

  const tableColumns = [
    { key: 'name', title: <Translate>Name</Translate>, width: 220, ...headerSearch('name', 'Search name') },
    {
      key: 'description',
      title: <Translate>Description</Translate>,
      flexGrow: 4,
      render: (rowData: DentalToothNumberingMethod) => rowData.description || '-'
    },
    {
      key: 'toothLabels',
      title: <Translate>Labelled Teeth</Translate>,
      flexGrow: 2,
      render: (rowData: DentalToothNumberingMethod) =>
        `${labelledCount(rowData.toothLabels)}/${ALL_TOOTH_IDS.length}`
    },
    {
      key: 'isActive',
      title: <Translate>Active</Translate>,
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
      render: (rowData: DentalToothNumberingMethod) => (rowData.isActive ? 'Yes' : 'No')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: (rowData: DentalToothNumberingMethod) => iconsForActions(rowData)
    }
  ];

  const handlePageChange = (_event, newPage) => {
    setPaginationParams(prev => ({ ...prev, page: newPage }));
  };

  const handleSortChange = (column: string, type: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortType(type);
    const sortValue = `${column},${type}`;
    setPaginationParams(prev => ({ ...prev, sort: sortValue, page: 0 }));
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const tableData = listResponse?.data ?? [];
  const totalCount = listResponse?.totalCount ?? 0;

  return (
    <Panel dir={dir}>
      <p className="dental-chart-setup-hint">
        Define named tooth-numbering methods and assign display labels to each tooth. Universal, FDI and Palmer
        stay available as built-in systems; active methods here also appear in Dental Chart Setup. Labels are
        display only, and existing charts keep the numbering they were created with.
      </p>
      <MyTable
        data={tableData}
        totalCount={totalCount}
        loading={isListFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(rowData: DentalToothNumberingMethod) => setMethod(rowData)}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={e => {
          const newSize = Number(e.target.value);
          setPaginationParams(prev => ({ ...prev, size: newSize, page: 0 }));
        }}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
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

      <DeletionConfirmationModal
        open={openConfirmToggle}
        setOpen={setOpenConfirmToggle}
        itemToDelete="Tooth Numbering Method"
        actionButtonFunction={handleToggle}
        actionType={toggleAction}
      />

      <AddEditDentalToothNumberingMethod
        open={popupOpen}
        setOpen={setPopupOpen}
        method={method}
        setMethod={setMethod}
        existingMethods={allMethodsResponse?.data ?? []}
        handleSave={handleSave}
        width={width}
      />
    </Panel>
  );
};

export default DentalToothNumberingSetup;
