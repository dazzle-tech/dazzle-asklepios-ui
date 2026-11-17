import Translate from '@/components/Translate';
import React, { useEffect, useState } from 'react';
import './styles.less';
import { Panel, Form } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { extractErrorMessage } from '@/utils/extractErrorMessage';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import AddEditDentalToothNumberingMethod from './AddEditDentalToothNumberingMethod';
import { newDentalToothNumberingMethod } from '@/types/model-types-constructor-new';
import { DentalToothNumberingMethod } from '@/types/model-types-new';
import {
  useGetAllDentalToothNumberingMethodsQuery,
  useGetDentalToothNumberingMethodsByNameQuery,
  useCreateDentalToothNumberingMethodMutation,
  useUpdateDentalToothNumberingMethodMutation,
  useToggleDentalToothNumberingMethodActiveMutation
} from '@/services/setup/dental-tooth-numbering/dentalToothNumberingService';
import { skipToken } from '@reduxjs/toolkit/query';
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
  const [isFiltered, setIsFiltered] = useState(false);
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [filterPagination, setFilterPagination] = useState({ page: 0, size: 15, sort: 'id,asc' });
  const [paginationParams, setPaginationParams] = useState({ page: 0, size: 15, sort: 'id,asc' });
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  const [createMethod] = useCreateDentalToothNumberingMethodMutation();
  const [updateMethod] = useUpdateDentalToothNumberingMethodMutation();
  const [toggleActive] = useToggleDentalToothNumberingMethodActiveMutation();

  const filterFields = [{ label: 'Name', value: 'name' }];

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

  const { data: listResponse, isFetching: isListFetching } =
    useGetAllDentalToothNumberingMethodsQuery(!isFiltered ? paginationParams : skipToken);

  const { data: filteredNameResponse, isFetching: isFetchingFilteredName } =
    useGetDentalToothNumberingMethodsByNameQuery(
      isFiltered && recordOfFilter.filter === 'name'
        ? {
            name: recordOfFilter.value,
            page: filterPagination.page,
            size: filterPagination.size,
            sort: filterPagination.sort
          }
        : skipToken
    );

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

  const tableColumns = [
    { key: 'name', title: <Translate>Name</Translate>, flexGrow: 3 },
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
      flexGrow: 1,
      render: (rowData: DentalToothNumberingMethod) => (rowData.isActive ? 'Yes' : 'No')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: (rowData: DentalToothNumberingMethod) => iconsForActions(rowData)
    }
  ];

  const handleFilterChange = (field: string, value: string, page = 0, size?: number) => {
    if (!field || !value) {
      setIsFiltered(false);
      return;
    }
    setIsFiltered(true);
    setFilterPagination({ ...filterPagination, page, size: size ?? filterPagination.size });
    setRecordOfFilter({ filter: field, value });
  };

  const handlePageChange = (_event, newPage) => {
    if (isFiltered) {
      setFilterPagination(prev => ({ ...prev, page: newPage }));
    } else {
      setPaginationParams(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleSortChange = (column: string, type: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortType(type);
    const sortValue = `${column},${type}`;
    if (isFiltered) {
      setFilterPagination({ ...filterPagination, sort: sortValue, page: 0 });
    } else {
      setPaginationParams({ ...paginationParams, sort: sortValue, page: 0 });
    }
  };

  const filters = () => (
    <Form fluid className="form-of-filters-set-up">
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={updatedRecord => {
          setRecordOfFilter({ filter: updatedRecord.filter, value: '' });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
      />
      <MyInput
        fieldName="value"
        fieldType="text"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        placeholder="Search"
      />
      <MyButton
        color="var(--deep-blue)"
        width="80px"
        onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
      >
        Search
      </MyButton>
    </Form>
  );

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const tableData = isFiltered ? filteredNameResponse?.data ?? [] : listResponse?.data ?? [];
  const totalCount = isFiltered ? filteredNameResponse?.totalCount ?? 0 : listResponse?.totalCount ?? 0;

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
        loading={isListFetching || isFetchingFilteredName}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(rowData: DentalToothNumberingMethod) => setMethod(rowData)}
        filters={filters()}
        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterPagination.size : paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={e => {
          const newSize = Number(e.target.value);
          if (isFiltered) {
            setFilterPagination({ ...filterPagination, size: newSize, page: 0 });
            handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, newSize);
          } else {
            setPaginationParams({ ...paginationParams, size: newSize, page: 0 });
          }
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
