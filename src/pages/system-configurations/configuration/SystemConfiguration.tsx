
import React, { useState, useEffect } from 'react';
import { Panel, Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AddEditConfiguration from './AddEditConfiguration';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import {
  useGetConfigurationsQuery,
  useUpdateConfigurationMutation,
  useLazyFilterByValueTypeQuery,
  useLazyFilterByReferenceTypeQuery,
  useLazyQuickSearchConfigurationsQuery,
} from '@/services/setup/systemConfiguration/systemConfigurationService';
import { Configuration } from '@/types/model-types-new';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { formatEnumString } from '@/utils';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { useEnumOptions } from '@/services/enumsApi';

const SystemConfiguration = () => {
  const dispatch = useAppDispatch();

  const [selectedConfig, setSelectedConfig] = useState<Configuration | null>(null);
  const [popupOpen, setPopupOpen] = useState<boolean>(false);
  const [openConfirmDeactivateReactivate, setOpenConfirmDeactivateReactivate] = useState(false);
  const [stateOfDeleteModal, setStateOfDeleteModal] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);

  // Pagination
  const [paginationParams, setPaginationParams] = useState({ page: 0, size: 5, sort: 'id,asc', timestamp: Date.now() });
  const [filterPagination, setFilterPagination] = useState({ page: 0, size: 5, sort: 'id,asc' });

  // Quick Search
  const [quickSearchValue, setQuickSearchValue] = useState('');

  // Advanced Search
  const [advancedFilterRecord, setAdvancedFilterRecord] = useState({ filter: '', value: '' });

  // Data
  const { data: configListResponse, refetch, isFetching } = useGetConfigurationsQuery(paginationParams);
  const [updateConfiguration] = useUpdateConfigurationMutation();

  // Lazy Queries for server-side filtering
  const [fetchByValueType] = useLazyFilterByValueTypeQuery();
  const [fetchByReferenceType] = useLazyFilterByReferenceTypeQuery();
  const [fetchQuickSearch] = useLazyQuickSearchConfigurationsQuery();

  // Enums
  const configurationValueTypeEnumList = useEnumOptions('ConfigurationValueType');
  const configurationreferenceTypeEnumList = useEnumOptions('ConfigurationReferenceType');

  // Page Header
  dispatch(setPageCode('SystemConfiguration'));
  dispatch(setDivContent('System Configuration'));

  // Filtered list
  const [filteredList, setFilteredList] = useState<Configuration[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [isFiltered, setIsFiltered] = useState(false);

  const totalCount = isFiltered ? filteredTotal : configListResponse?.totalCount ?? 0;

  const filterFields = [
    { label: 'Value Type', value: 'valueType' },
    { label: 'Reference Type', value: 'referenceType' },
  ];


  // Row selected
  const isSelected = (rowData: Configuration) => rowData?.id === selectedConfig?.id ? 'selected-row' : '';

  // Icons
  const iconsForActions = (rowData: Configuration) => (
    <div className="container-of-icons">
      <MdModeEdit className="icons-style" title="Edit" size={24} fill="var(--primary-gray)" onClick={() => setPopupOpen(true)} />
      {rowData?.isActive ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => { setStateOfDeleteModal('deactivate'); setOpenConfirmDeactivateReactivate(true); }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => { setStateOfDeleteModal('reactivate'); setOpenConfirmDeactivateReactivate(true); }}
        />
      )}
    </div>
  );

  const tableColumns = [
    { key: 'facilityId', title: 'Facility', render: (rowData: Configuration) => <p>{rowData?.facility?.name}</p> },
    { key: 'key', title: 'Key', render: (rowData: Configuration) => formatEnumString(rowData.key) },
    { key: 'valueType', title: 'Value Type', render: (rowData: Configuration) => formatEnumString(rowData.valueType) },
    { key: 'value', title: 'Value' },
    { key: 'referenceType', title: 'Reference Type', render: (rowData: Configuration) => formatEnumString(rowData.referenceType) },
    { key: 'description', title: 'Description' },
    { key: 'icons', title: '', render: rowData => iconsForActions(rowData) }
  ];

  // advanced search
  const handleAdvancedSearch = async (page = 0, size = filterPagination.size) => {
    try {
      if (!advancedFilterRecord.filter || !advancedFilterRecord.value) {
        setIsFiltered(false);
        setFilteredList([]);
        return;
      }

      const params = { page, size, sort: filterPagination.sort };
      let response;

      if (advancedFilterRecord.filter === 'valueType') {
        response = await fetchByValueType({ valueType: advancedFilterRecord.value, ...params }).unwrap();
      } else if (advancedFilterRecord.filter === 'referenceType') {
        response = await fetchByReferenceType({ referenceType: advancedFilterRecord.value, ...params }).unwrap();
      }

      setFilteredList(response.data ?? []);
      setFilteredTotal(response.totalCount ?? 0);
      setIsFiltered(true);
      setFilterPagination({ ...filterPagination, page, size });
    } catch (error) {
      dispatch(notify({ msg: 'Failed to filter Configurations', sev: 'error' }));
      setIsFiltered(false);
    }
  };


  // quick search
  const handleQuickSearch = async (page = 0, size = filterPagination.size) => {
    if (!quickSearchValue || quickSearchValue.trim().length < 3) {
      dispatch(notify({ msg: 'Please enter at least 3 characters', sev: 'warning' }));
      return;
    }

    try {
      const response = await fetchQuickSearch({
        searchText: quickSearchValue,
        page,
        size,
        sort: filterPagination.sort
      }).unwrap();

      setFilteredList(response.data ?? []);
      setFilteredTotal(response.totalCount ?? 0);
      setIsFiltered(true);
      setFilterPagination({ ...filterPagination, page, size });

      setAdvancedFilterRecord({ filter: '', value: '' });
      setShowAdvanced(false);
    } catch (error) {
      dispatch(notify({ msg: 'Quick search failed', sev: 'error' }));
    }
  };

  const filters = () => (
    <div className="my-table-filters">
      <Form layout="inline" fluid style={{ display: 'flex', gap: 10 }}>
        <MyInput
          fieldName="value"
          record={{ value: quickSearchValue }}
          setRecord={rec => setQuickSearchValue(rec.value)}
          showLabel={false}
          placeholder="Search"
          disabled={showAdvanced}
        />

      </Form>

      <AdvancedSearchFilters
        showAdvanced={showAdvanced}
        setShowAdvanced={setShowAdvanced}
        searchFilter={true}
        content={
          <Form layout="inline" fluid style={{ display: 'flex', gap: 10 }}>
            <MyInput
              selectDataValue="value"
              selectDataLabel="label"
              selectData={filterFields}
              fieldName="filter"
              fieldType="select"
              record={advancedFilterRecord}
              setRecord={updated => setAdvancedFilterRecord({ ...advancedFilterRecord, filter: updated.filter, value: '' })}
              showLabel={false}
              placeholder="Select Filter"
              searchable={false}
            />
            {advancedFilterRecord.filter === 'valueType' ? (
              <MyInput
                fieldName="value"
                fieldType="select"
                selectData={configurationValueTypeEnumList ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                record={advancedFilterRecord}
                setRecord={setAdvancedFilterRecord}
                searchable={false}
                showLabel={false}
              />
            ) : advancedFilterRecord.filter === 'referenceType' ? (
              <MyInput
                fieldName="value"
                fieldType="select"
                selectData={configurationreferenceTypeEnumList ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                record={advancedFilterRecord}
                setRecord={setAdvancedFilterRecord}
                searchable={false}
                showLabel={false}
              />
            ) : (
              <MyInput fieldName="value" record={advancedFilterRecord} setRecord={setAdvancedFilterRecord} showLabel={false} placeholder='Value' />
            )}
          </Form>
        }
        searchOnClick={showAdvanced ? () => handleAdvancedSearch(0, filterPagination.size) : () => handleQuickSearch(0, filterPagination.size)}
      />
    </div>
  );

  const handleNew = () => {
    setSelectedConfig(null);
    setPopupOpen(true);
  };

  //handle deativate/reactivate
  const handleDeactivateReactivate = () => {
    if (!selectedConfig) return;

    const toUpdate = {
      id: selectedConfig.id,
      key: selectedConfig.key,
      value: selectedConfig.value,
      valueType: selectedConfig.valueType,
      referenceType: selectedConfig.referenceType,
      description: selectedConfig.description,
      facilityId: Number(selectedConfig?.facility?.id),
      isActive: stateOfDeleteModal === 'reactivate'
    };

    updateConfiguration({ id: selectedConfig.id, body: toUpdate })
      .unwrap()
      .then(() => { dispatch(notify({ msg: 'Configuration updated successfully', sev: 'success' })); refetch(); })
      .catch(() => dispatch(notify({ msg: 'Failed to update configuration', sev: 'error' })));

    setOpenConfirmDeactivateReactivate(false);
  };

  const handlePageChange = (event, newPage) => {
    if (isFiltered) {
      if (showAdvanced) {
        handleAdvancedSearch(newPage, filterPagination.size);
      } else {
        handleQuickSearch(newPage, filterPagination.size);
      }
    } else {
      setPaginationParams({ ...paginationParams, page: newPage });
    }
  };

  const handleRowsPerPageChange = e => {
    const newSize = Number(e.target.value);
    if (isFiltered) {
      if (showAdvanced) {
        handleAdvancedSearch(filterPagination.page, newSize);
      } else {
        handleQuickSearch(filterPagination.page, newSize);
      }
    } else {
      setPaginationParams({ ...paginationParams, size: newSize, page: 0 });
    }
  };

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  return (
    <Panel>
      <MyTable
        height={450}
        rowClassName={isSelected}
        totalCount={totalCount}
        data={isFiltered ? filteredList : configListResponse?.data ?? []}
        loading={isFetching}
        columns={tableColumns}
        onRowClick={rowData => setSelectedConfig(rowData)}

        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterPagination.size : paginationParams.size}

        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        filters={filters()}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton prefixIcon={() => <AddOutlineIcon />} color="var(--deep-blue)" onClick={handleNew} width="109px">
              Add New
            </MyButton>
          </div>
        }
      />

      <AddEditConfiguration open={popupOpen} setOpen={setPopupOpen} configuration={selectedConfig} width={width} />

      <DeletionConfirmationModal
        open={openConfirmDeactivateReactivate}
        setOpen={setOpenConfirmDeactivateReactivate}
        itemToDelete="Configuration"
        actionButtonFunction={handleDeactivateReactivate}
        actionType={stateOfDeleteModal}
      />
    </Panel>
  );
};

export default SystemConfiguration;
