

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
  useAddConfigurationMutation,
  useUpdateConfigurationMutation
} from '@/services/setup/systemConfiguration/systemConfigurationService';
import { newConfigurationCreateVM, newConfigurationUpdateVM } from '@/types/model-types-constructor-new';
import { Configuration } from '@/types/model-types-new';
import { MdDelete } from 'react-icons/md';
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { isAction } from '@reduxjs/toolkit';
import { formatEnumString } from '@/utils';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import AddOutlineIcon from '@rsuite/icons/AddOutline';

const SystemConfiguration = () => {
  const dispatch = useAppDispatch();
  const [selectedConfig, setSelectedConfig] = useState<Configuration | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [openConfirmDeactivateReactivate, setOpenConfirmDeactivateReactivate] = useState(false);
  const [filterRecord, setFilterRecord] = useState({ filter: '', value: '' });
  const [filteredList, setFilteredList] = useState<Configuration[]>([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [stateOfDeleteModal, setStateOfDeleteModal] = useState("deactivate");
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  const { data: configListResponse, refetch, isFetching } = useGetConfigurationsQuery(paginationParams);
  const [updateConfiguration] = useUpdateConfigurationMutation();
  // Header page setup
  dispatch(setPageCode('SystemConfiguration'));
  dispatch(setDivContent('System Configuration'));

  const totalCount = isFiltered ? filteredList.length : configListResponse?.totalCount ?? 0;
  // class name for selected row
  const isSelected = rowData => {
    if (rowData && selectedConfig && rowData?.id === selectedConfig?.id) {
      return 'selected-row';
    } else return '';
  };

  // Icons column (Edit, reactive/Deactivate)
  const iconsForActions = rowData => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setPopupOpen(true)}
      />
      {rowData?.isActive ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            // setPriceList(rowData);
            setStateOfDeleteModal("deactivate");
            setOpenConfirmDeactivateReactivate(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            // setPriceList(rowData);
            setStateOfDeleteModal("reactivate");
            setOpenConfirmDeactivateReactivate(true);
          }}
        />
      )}
    </div>
  );
  const tableColumns = [
    {
      key: 'facilityId',
      title: 'Facility',
      render: (rowData: Configuration) => <p>{rowData?.facility?.name}</p>
    },
    {
      key: 'key',
      title: 'Key',
      render: (rowData: Configuration) => (
        <span>{formatEnumString(rowData.key)}</span>
      ),
    },
    {
      key: 'valueType',
      title: 'Value Type',
      render: (rowData: Configuration) => (
        <span>{formatEnumString(rowData.valueType)}</span>
      ),
    },
    { key: 'value',
      title: 'Value'
    },
    { key: 'referenceType',
      title: 'Reference Type',
      render: (rowData: Configuration) => (
        <span>{formatEnumString(rowData.referenceType)}</span>
      ),
    },
    {
      key: 'icons',
      title: '',
      render: rowData => iconsForActions(rowData)
    }
  ];

  const filters = () => (
      <div className='my-table-filters'>
      <Form layout="inline" fluid style={{ display: 'flex', gap: 10 }}>
      {/* <MyInput
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
      /> */}
        <MyInput
          fieldName="value"
          //  width={350}
          // fieldType="select"
          // selectData={departmentListResponse ?? []}
          // selectDataLabel="name"
          // selectDataValue="id"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          // menuMaxHeight={150}
          showLabel={false}
          placeholder='Search'
          // searchable={false}
        />
      
      {/* <MyButton
        color="var(--deep-blue)"
        onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
        width="80px"
      >
        Search
      </MyButton> */}
    </Form>
  
            <AdvancedSearchFilters
          searchFilter={true}
          content={<Form layout="inline" fluid style={{ display: 'flex', gap: 10 }}>
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={[]}
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
        <MyInput
          fieldName="value"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
        />
      
    </Form>}
        />
      </div>
    );

  const handleNew = () => {
    setSelectedConfig(null);
    setPopupOpen(true);
  };

  const handleDeactivateReactivate = () => {
    if (stateOfDeleteModal === 'reactivate') {
      const toUpdate = {
        id: selectedConfig.id,
        key: selectedConfig.key,
        value: selectedConfig.value,
        valueType: selectedConfig.valueType,
        referenceType: selectedConfig.referenceType,
        description: selectedConfig.description,
        facilityId: Number(selectedConfig?.facility?.id),
        isActive: true,
      };
      updateConfiguration({ id: selectedConfig.id, body: toUpdate })
        .unwrap()
        .then(() => { dispatch(notify({ msg: 'Configuration updated successfully', sev: 'success' })); refetch() })
        .catch(() => dispatch(notify({ msg: 'Failed to update configuration', sev: 'error' })));
    }
    else {
      const toUpdate = {
        id: selectedConfig.id,
        key: selectedConfig.key,
        value: selectedConfig.value,
        valueType: selectedConfig.valueType,
        referenceType: selectedConfig.referenceType,
        description: selectedConfig.description,
        facilityId: Number(selectedConfig?.facility?.id),
        isActive: false,
      };
      updateConfiguration({ id: selectedConfig.id, body: toUpdate })
        .unwrap()
        .then(() => { dispatch(notify({ msg: 'Configuration updated successfully', sev: 'success' })); refetch() })
        .catch(() => dispatch(notify({ msg: 'Failed to update configuration', sev: 'error' })));
    }
    setOpenConfirmDeactivateReactivate(false);
  };

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  return (
    <Panel>

      <MyTable
        rowClassName={isSelected}
        height={450}
        totalCount={totalCount}
        data={isFiltered ? filteredList : configListResponse?.data ?? []}
        loading={isFetching}
        columns={tableColumns}
        onRowClick={rowData => setSelectedConfig(rowData)}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={(e, newPage) => setPaginationParams({ ...paginationParams, page: newPage })}
        onRowsPerPageChange={e => setPaginationParams({ ...paginationParams, size: Number(e.target.value), page: 0 })}
        filters={filters()}
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

      <AddEditConfiguration
        open={popupOpen}
        setOpen={setPopupOpen}
        configuration={selectedConfig}
      />

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
