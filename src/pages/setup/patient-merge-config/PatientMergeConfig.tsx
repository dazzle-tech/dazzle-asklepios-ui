import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Form } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit } from 'react-icons/md';
import { FaSyncAlt } from 'react-icons/fa';

import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { setDivContent, setPageCode } from '@/reducers/divSlice';

import {
  useGetMergeConfigTablesQuery,
  useGetAvailablePatientTablesQuery,
  useSyncMissingMergeTablesMutation,
  useSaveMergeConfigTableMutation,
  useLazyGetMergeTableColumnsQuery
} from '@/services/patients/patientMergeService';

import AddEditPatientMergeConfig from './AddEditPatientMergeConfig';
import './styles.less';

const emptyConfig = {
  id: null,
  entityName: '',
  tableName: '',
  primaryKeyColumnName: 'id',
  patientColumnName: 'patient_id',
  enabled: false,
  sortOrder: 999,
  mergeCategory: 'EMR',
  autoDiscoverFields: false,
  matchKeyColumns: [],
  excludedColumns: [],
  availableColumns: []
};

const PatientMergeConfig = () => {
  const dispatch = useAppDispatch();

  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<any>({ ...emptyConfig });
  const [width, setWidth] = useState(window.innerWidth);

  const [recordOfFilter, setRecordOfFilter] = useState({
    filter: '',
    value: ''
  });

  const [sortColumn, setSortColumn] = useState<string | undefined>();
  const [sortType, setSortType] = useState<'asc' | 'desc' | undefined>();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const {
    data: tableConfigs = [],
    isFetching,
    refetch
  } = useGetMergeConfigTablesQuery();

  const {
    data: availablePatientTables = [],
    refetch: refetchAvailableTables
  } = useGetAvailablePatientTablesQuery();

  const [syncMissingTables, syncMutation] = useSyncMissingMergeTablesMutation();
  const [saveMergeConfigTable, saveMutation] = useSaveMergeConfigTableMutation();
  const [getMergeTableColumns] = useLazyGetMergeTableColumnsQuery();

  const filterFields = [
    { label: 'Table Name', value: 'tableName' },
    { label: 'Entity Name', value: 'entityName' },
    { label: 'Category', value: 'mergeCategory' },
    { label: 'Status', value: 'enabled' },
    { label: 'Auto Fields', value: 'autoDiscoverFields' },
    { label: 'Sort', value: 'sortOrder' }
  ];

  useEffect(() => {
    dispatch(setPageCode('PatientMergeConfig'));
    dispatch(setDivContent('Patient Merge Setup Configuration'));

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

  useEffect(() => {
    setPage(0);
  }, [recordOfFilter]);

  const filteredConfigs = useMemo(() => {
    let result = [...tableConfigs];

    const filterKey = recordOfFilter.filter;
    const filterValue = recordOfFilter.value?.trim().toLowerCase();

    if (filterKey && filterValue) {
      result = result.filter((item: any) => {
        const itemValue = item?.[filterKey];

        if (typeof itemValue === 'boolean') {
          const displayValue = itemValue ? 'enabled yes true' : 'disabled no false';
          return displayValue.includes(filterValue);
        }

        if (Array.isArray(itemValue)) {
          return itemValue.join(', ').toLowerCase().includes(filterValue);
        }

        return String(itemValue ?? '')
          .toLowerCase()
          .includes(filterValue);
      });
    }

    if (sortColumn && sortType) {
      result.sort((a: any, b: any) => {
        const aValue = a?.[sortColumn];
        const bValue = b?.[sortColumn];

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return sortType === 'asc' ? -1 : 1;
        if (bValue === null || bValue === undefined) return sortType === 'asc' ? 1 : -1;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortType === 'asc' ? aValue - bValue : bValue - aValue;
        }

        if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          return sortType === 'asc'
            ? Number(aValue) - Number(bValue)
            : Number(bValue) - Number(aValue);
        }

        return sortType === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }

    return result;
  }, [tableConfigs, recordOfFilter, sortColumn, sortType]);

  const pagedConfigs = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredConfigs.slice(start, end);
  }, [filteredConfigs, page, rowsPerPage]);

  const handleNew = () => {
    setSelectedConfig({ ...emptyConfig });
    setPopupOpen(true);
  };

  const handleEdit = (rowData: any) => {
    setSelectedConfig({
      ...rowData,
      matchKeyColumns: rowData.matchKeyColumns ?? [],
      excludedColumns: rowData.excludedColumns ?? [],
      availableColumns: rowData.availableColumns ?? []
    });

    setPopupOpen(true);
  };

  const handleTableColumnsLoad = async (tableName: string) => {
    if (!tableName) {
      return;
    }

    try {
      const columns = await getMergeTableColumns({
        tableName
      }).unwrap();

      setSelectedConfig((prev: any) => ({
        ...prev,
        tableName,
        entityName: tableName.toUpperCase(),
        availableColumns: columns,
        matchKeyColumns: [],
        excludedColumns: [],
        primaryKeyColumnName: columns.includes('id') ? 'id' : '',
        patientColumnName: columns.includes('patient_id') ? 'patient_id' : ''
      }));
    } catch {
      dispatch(
        notify({
          msg: 'Failed to load table columns',
          sev: 'error'
        })
      );
    }
  };

  const handleSyncMissingTables = () => {
    syncMissingTables()
      .unwrap()
      .then(inserted => {
        dispatch(
          notify({
            msg: `${inserted} missing table(s) synced successfully`,
            sev: 'success'
          })
        );
        refetch();
        refetchAvailableTables();
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Failed to sync missing patient tables',
            sev: 'error'
          })
        );
      });
  };

  const handleSave = () => {
    const { availableColumns, ...payload } = selectedConfig;

    saveMergeConfigTable(payload)
      .unwrap()
      .then(() => {
        setPopupOpen(false);
        dispatch(
          notify({
            msg: 'Patient merge table configuration saved successfully',
            sev: 'success'
          })
        );
        refetch();
        refetchAvailableTables();
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Failed to save patient merge table configuration',
            sev: 'error'
          })
        );
      });
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
        setRecord={(updatedRecord: any) => {
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
        fieldType="text"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        placeholder="Search"
      />
    </Form>
  );

  const iconsForActions = (rowData: any) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => handleEdit(rowData)}
      />
    </div>
  );

  const tableColumns = [
    {
      key: 'tableName',
      title: <Translate>Table Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'entityName',
      title: <Translate>Entity Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'mergeCategory',
      title: <Translate>Category</Translate>,
      flexGrow: 3
    },
    {
      key: 'enabled',
      title: <Translate>Status</Translate>,
      flexGrow: 3,
      render: (rowData: any) => (rowData.enabled ? 'Enabled' : 'Disabled')
    },
    {
      key: 'autoDiscoverFields',
      title: <Translate>Auto Fields</Translate>,
      flexGrow: 3,
      render: (rowData: any) => (rowData.autoDiscoverFields ? 'Yes' : 'No')
    },
    {
      key: 'matchKeyColumns',
      title: <Translate>Match Keys</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData.matchKeyColumns?.length ? rowData.matchKeyColumns.join(', ') : '-'
    },
    {
      key: 'excludedColumns',
      title: <Translate>Excluded Columns</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData.excludedColumns?.length ? rowData.excludedColumns.join(', ') : '-'
    },
    {
      key: 'sortOrder',
      title: <Translate>Sort</Translate>,
      flexGrow: 2
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: (rowData: any) => iconsForActions(rowData)
    }
  ];

  return (
    <Panel>
      <MyTable
        height={520}
        data={pagedConfigs}
        loading={isFetching || syncMutation.isLoading || saveMutation.isLoading}
        columns={tableColumns}
        filters={filters()}
        onRowClick={rowData => setSelectedConfig(rowData)}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={(column: string, type: 'asc' | 'desc') => {
          setSortColumn(column);
          setSortType(type);
          setPage(0);
        }}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={filteredConfigs.length}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        tableButtons={
          <div className="patient-merge-config-buttons">
            <MyButton
              prefixIcon={() => <FaSyncAlt />}
              appearance="ghost"
              onClick={handleSyncMissingTables}
              loading={syncMutation.isLoading}
            >
              Sync Missing
            </MyButton>

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

      <AddEditPatientMergeConfig
        open={popupOpen}
        setOpen={setPopupOpen}
        record={selectedConfig}
        setRecord={setSelectedConfig}
        availablePatientTables={availablePatientTables}
        width={width}
        handleSave={handleSave}
        handleTableColumnsLoad={handleTableColumnsLoad}
        loading={saveMutation.isLoading}
      />
    </Panel>
  );
};

export default PatientMergeConfig;