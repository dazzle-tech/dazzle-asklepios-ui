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

    const [search, setSearch] = useState('');
    const [popupOpen, setPopupOpen] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState<any>({ ...emptyConfig });
    const [width, setWidth] = useState(window.innerWidth);

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

    const filteredConfigs = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) {
            return tableConfigs;
        }

        return tableConfigs.filter((item: any) => {
            return (
                item.tableName?.toLowerCase().includes(value) ||
                item.entityName?.toLowerCase().includes(value) ||
                item.mergeCategory?.toLowerCase().includes(value)
            );
        });
    }, [tableConfigs, search]);

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
                patientColumnName: columns.includes('patient_id')
                    ? 'patient_id'
                    : ''
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
  const {
    availableColumns,
    ...payload
  } = selectedConfig;

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
    const filters = () => (
        <Form layout="inline" fluid>
            <MyInput
                fieldName="search"
                fieldType="text"
                record={{ search }}
                setRecord={(updated: any) => setSearch(updated?.search || '')}
                showLabel={false}
                placeholder="Search by table, entity, or category"
                width={320}
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
            title: <Translate>Table Name</Translate>
        },
        {
            key: 'entityName',
            title: <Translate>Entity Name</Translate>
        },
        {
            key: 'mergeCategory',
            title: <Translate>Category</Translate>
        },
        {
            key: 'enabled',
            title: <Translate>Status</Translate>,
            render: (rowData: any) => (rowData.enabled ? 'Enabled' : 'Disabled')
        },
        {
            key: 'autoDiscoverFields',
            title: <Translate>Auto Fields</Translate>,
            render: (rowData: any) => (rowData.autoDiscoverFields ? 'Yes' : 'No')
        },
        {
            key: 'matchKeyColumns',
            title: <Translate>Match Keys</Translate>,
            render: (rowData: any) =>
                rowData.matchKeyColumns?.length ? rowData.matchKeyColumns.join(', ') : '-'
        },
        {
            key: 'excludedColumns',
            title: <Translate>Excluded Columns</Translate>,
            render: (rowData: any) =>
                rowData.excludedColumns?.length ? rowData.excludedColumns.join(', ') : '-'
        },
        {
            key: 'sortOrder',
            title: <Translate>Sort</Translate>
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
                data={filteredConfigs}
                loading={isFetching || syncMutation.isLoading || saveMutation.isLoading}
                columns={tableColumns}
                filters={filters()}
                onRowClick={rowData => setSelectedConfig(rowData)}
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