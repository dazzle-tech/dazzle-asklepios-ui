

// import React, { useState, useEffect } from 'react';
// import { Panel, Form } from 'rsuite';
// import MyInput from '@/components/MyInput';
// import MyTable from '@/components/MyTable';
// import MyButton from '@/components/MyButton/MyButton';
// import AddEditConfiguration from './AddEditConfiguration';
// import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
// import { notify } from '@/utils/uiReducerActions';
// import { useAppDispatch } from '@/hooks';
// import { setDivContent, setPageCode } from '@/reducers/divSlice';
// import {
//   useGetConfigurationsQuery,
//   useAddConfigurationMutation,
//   useUpdateConfigurationMutation
// } from '@/services/setup/systemConfiguration/systemConfigurationService';
// import { newConfigurationCreateVM, newConfigurationUpdateVM } from '@/types/model-types-constructor-new';
// import { Configuration } from '@/types/model-types-new';
// import { MdDelete } from 'react-icons/md';
// import { MdModeEdit } from 'react-icons/md';
// import { FaUndo } from 'react-icons/fa';
// import { isAction } from '@reduxjs/toolkit';
// import { formatEnumString } from '@/utils';
// import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
// import AddOutlineIcon from '@rsuite/icons/AddOutline';

// const SystemConfiguration = () => {
//   const dispatch = useAppDispatch();
//   const [selectedConfig, setSelectedConfig] = useState<Configuration | null>(null);
//   const [popupOpen, setPopupOpen] = useState(false);
//   const [openConfirmDeactivateReactivate, setOpenConfirmDeactivateReactivate] = useState(false);
//   const [filterRecord, setFilterRecord] = useState({ filter: '', value: '' });
//   const [filteredList, setFilteredList] = useState<Configuration[]>([]);
//   const [isFiltered, setIsFiltered] = useState(false);
//   const [stateOfDeleteModal, setStateOfDeleteModal] = useState("deactivate");
//   const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });

//   const [paginationParams, setPaginationParams] = useState({
//     page: 0,
//     size: 5,
//     sort: 'id,asc',
//     timestamp: Date.now()
//   });

//   const { data: configListResponse, refetch, isFetching } = useGetConfigurationsQuery(paginationParams);
//   const [updateConfiguration] = useUpdateConfigurationMutation();
//   // Header page setup
//   dispatch(setPageCode('SystemConfiguration'));
//   dispatch(setDivContent('System Configuration'));

//   const totalCount = isFiltered ? filteredList.length : configListResponse?.totalCount ?? 0;
//   // class name for selected row
//   const isSelected = rowData => {
//     if (rowData && selectedConfig && rowData?.id === selectedConfig?.id) {
//       return 'selected-row';
//     } else return '';
//   };

//   // Icons column (Edit, reactive/Deactivate)
//   const iconsForActions = rowData => (
//     <div className="container-of-icons">
//       <MdModeEdit
//         className="icons-style"
//         title="Edit"
//         size={24}
//         fill="var(--primary-gray)"
//         onClick={() => setPopupOpen(true)}
//       />
//       {rowData?.isActive ? (
//         <MdDelete
//           className="icons-style"
//           title="Deactivate"
//           size={24}
//           fill="var(--primary-pink)"
//           onClick={() => {
//             // setPriceList(rowData);
//             setStateOfDeleteModal("deactivate");
//             setOpenConfirmDeactivateReactivate(true);
//           }}
//         />
//       ) : (
//         <FaUndo
//           className="icons-style"
//           title="Activate"
//           size={24}
//           fill="var(--primary-gray)"
//           onClick={() => {
//             // setPriceList(rowData);
//             setStateOfDeleteModal("reactivate");
//             setOpenConfirmDeactivateReactivate(true);
//           }}
//         />
//       )}
//     </div>
//   );
//   const tableColumns = [
//     {
//       key: 'facilityId',
//       title: 'Facility',
//       render: (rowData: Configuration) => <p>{rowData?.facility?.name}</p>
//     },
//     {
//       key: 'key',
//       title: 'Key',
//       render: (rowData: Configuration) => (
//         <span>{formatEnumString(rowData.key)}</span>
//       ),
//     },
//     {
//       key: 'valueType',
//       title: 'Value Type',
//       render: (rowData: Configuration) => (
//         <span>{formatEnumString(rowData.valueType)}</span>
//       ),
//     },
//     { key: 'value',
//       title: 'Value'
//     },
//     { key: 'referenceType',
//       title: 'Reference Type',
//       render: (rowData: Configuration) => (
//         <span>{formatEnumString(rowData.referenceType)}</span>
//       ),
//     },
//     {
//       key: 'icons',
//       title: '',
//       render: rowData => iconsForActions(rowData)
//     }
//   ];

//   const filters = () => (
//       <div className='my-table-filters'>
//       <Form layout="inline" fluid style={{ display: 'flex', gap: 10 }}>
//       {/* <MyInput
//         selectDataValue="value"
//         selectDataLabel="label"
//         selectData={filterFields}
//         fieldName="filter"
//         fieldType="select"
//         record={recordOfFilter}
//         setRecord={updatedRecord => {
//           setRecordOfFilter({
//             ...recordOfFilter,
//             filter: updatedRecord.filter,
//             value: ''
//           });
//         }}
//         showLabel={false}
//         placeholder="Select Filter"
//         searchable={false}
//       /> */}
//         <MyInput
//           fieldName="value"
//           //  width={350}
//           // fieldType="select"
//           // selectData={departmentListResponse ?? []}
//           // selectDataLabel="name"
//           // selectDataValue="id"
//           record={recordOfFilter}
//           setRecord={setRecordOfFilter}
//           // menuMaxHeight={150}
//           showLabel={false}
//           placeholder='Search'
//           // searchable={false}
//         />

//       {/* <MyButton
//         color="var(--deep-blue)"
//         onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
//         width="80px"
//       >
//         Search
//       </MyButton> */}
//     </Form>

//             <AdvancedSearchFilters
//           searchFilter={true}
//           content={<Form layout="inline" fluid style={{ display: 'flex', gap: 10 }}>
//       <MyInput
//         selectDataValue="value"
//         selectDataLabel="label"
//         selectData={[]}
//         fieldName="filter"
//         fieldType="select"
//         record={recordOfFilter}
//         setRecord={updatedRecord => {
//           setRecordOfFilter({
//             ...recordOfFilter,
//             filter: updatedRecord.filter,
//             value: ''
//           });
//         }}
//         showLabel={false}
//         placeholder="Select Filter"
//         searchable={false}
//       />
//         <MyInput
//           fieldName="value"
//           record={recordOfFilter}
//           setRecord={setRecordOfFilter}
//           showLabel={false}
//         />

//     </Form>}
//         />
//       </div>
//     );

//   const handleNew = () => {
//     setSelectedConfig(null);
//     setPopupOpen(true);
//   };

//   const handleDeactivateReactivate = () => {
//     if (stateOfDeleteModal === 'reactivate') {
//       const toUpdate = {
//         id: selectedConfig.id,
//         key: selectedConfig.key,
//         value: selectedConfig.value,
//         valueType: selectedConfig.valueType,
//         referenceType: selectedConfig.referenceType,
//         description: selectedConfig.description,
//         facilityId: Number(selectedConfig?.facility?.id),
//         isActive: true,
//       };
//       updateConfiguration({ id: selectedConfig.id, body: toUpdate })
//         .unwrap()
//         .then(() => { dispatch(notify({ msg: 'Configuration updated successfully', sev: 'success' })); refetch() })
//         .catch(() => dispatch(notify({ msg: 'Failed to update configuration', sev: 'error' })));
//     }
//     else {
//       const toUpdate = {
//         id: selectedConfig.id,
//         key: selectedConfig.key,
//         value: selectedConfig.value,
//         valueType: selectedConfig.valueType,
//         referenceType: selectedConfig.referenceType,
//         description: selectedConfig.description,
//         facilityId: Number(selectedConfig?.facility?.id),
//         isActive: false,
//       };
//       updateConfiguration({ id: selectedConfig.id, body: toUpdate })
//         .unwrap()
//         .then(() => { dispatch(notify({ msg: 'Configuration updated successfully', sev: 'success' })); refetch() })
//         .catch(() => dispatch(notify({ msg: 'Failed to update configuration', sev: 'error' })));
//     }
//     setOpenConfirmDeactivateReactivate(false);
//   };

//   useEffect(() => {
//     return () => {
//       dispatch(setPageCode(''));
//       dispatch(setDivContent(''));
//     };
//   }, [dispatch]);

//   return (
//     <Panel>

//       <MyTable
//         rowClassName={isSelected}
//         height={450}
//         totalCount={totalCount}
//         data={isFiltered ? filteredList : configListResponse?.data ?? []}
//         loading={isFetching}
//         columns={tableColumns}
//         onRowClick={rowData => setSelectedConfig(rowData)}
//         page={paginationParams.page}
//         rowsPerPage={paginationParams.size}
//         onPageChange={(e, newPage) => setPaginationParams({ ...paginationParams, page: newPage })}
//         onRowsPerPageChange={e => setPaginationParams({ ...paginationParams, size: Number(e.target.value), page: 0 })}
//         filters={filters()}
//         tableButtons={
//           <div className="container-of-add-new-button">
//             <MyButton
//               prefixIcon={() => <AddOutlineIcon />}
//               color="var(--deep-blue)"
//               onClick={handleNew}
//               width="109px"
//             >
//               Add New
//             </MyButton>
//           </div>
//         }
//       />

//       <AddEditConfiguration
//         open={popupOpen}
//         setOpen={setPopupOpen}
//         configuration={selectedConfig}
//       />

//       <DeletionConfirmationModal
//         open={openConfirmDeactivateReactivate}
//         setOpen={setOpenConfirmDeactivateReactivate}
//         itemToDelete="Configuration"
//         actionButtonFunction={handleDeactivateReactivate}
//         actionType={stateOfDeleteModal}
//       />
//     </Panel>
//   );
// };

// export default SystemConfiguration;




// import React, { useState, useEffect } from 'react';
// import { Panel, Form } from 'rsuite';
// import MyInput from '@/components/MyInput';
// import MyTable from '@/components/MyTable';
// import MyButton from '@/components/MyButton/MyButton';
// import AddEditConfiguration from './AddEditConfiguration';
// import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
// import { notify } from '@/utils/uiReducerActions';
// import { useAppDispatch } from '@/hooks';
// import { setDivContent, setPageCode } from '@/reducers/divSlice';
// import {
//   useGetConfigurationsQuery,
//   useAddConfigurationMutation,
//   useUpdateConfigurationMutation
// } from '@/services/setup/systemConfiguration/systemConfigurationService';
// import { Configuration } from '@/types/model-types-new';
// import { MdDelete, MdModeEdit } from 'react-icons/md';
// import { FaUndo } from 'react-icons/fa';
// import { formatEnumString } from '@/utils';
// import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
// import AddOutlineIcon from '@rsuite/icons/AddOutline';
// // import  MyButton  from '@/components/MyButton/MyButton';

// const SystemConfiguration = () => {
//   const dispatch = useAppDispatch();
//   const [selectedConfig, setSelectedConfig] = useState<Configuration | null>(null);
//   const [popupOpen, setPopupOpen] = useState(false);
//   const [openConfirmDeactivateReactivate, setOpenConfirmDeactivateReactivate] = useState(false);
//   const [stateOfDeleteModal, setStateOfDeleteModal] = useState('deactivate');
//   const [showAdvanced, setShowAdvanced] = useState(false);
//   // Pagination params
//   const [paginationParams, setPaginationParams] = useState({
//     page: 0,
//     size: 5,
//     sort: 'id,asc',
//     timestamp: Date.now()
//   });

//   // Quick Search
//   const [quickSearchValue, setQuickSearchValue] = useState('');


//   // Advanced Search
//   const [advancedFilterRecord, setAdvancedFilterRecord] = useState({ filter: '', value: '' });

//   const { data: configListResponse, refetch, isFetching } = useGetConfigurationsQuery(paginationParams);
//   const [updateConfiguration] = useUpdateConfigurationMutation();

//   // Header page setup
//   dispatch(setPageCode('SystemConfiguration'));
//   dispatch(setDivContent('System Configuration'));

//   // Filtered list
//   const [filteredList, setFilteredList] = useState<Configuration[]>([]);
//   const [isFiltered, setIsFiltered] = useState(false);

//   const totalCount = isFiltered ? filteredList.length : configListResponse?.totalCount ?? 0;

//    // Available fields for filtering
//   const filterFields = [
//     { label: 'Value Type', value: 'valueType' },
//     { label: 'Reference Type', value: 'referenceType' },
//   ];
//   // Update filtered list automatically for Quick Search
//   useEffect(() => {
//     if (!configListResponse?.data) return;

//     if (quickSearchValue.trim() === '') {
//       setFilteredList(configListResponse.data);
//       setIsFiltered(false);
//     } else {
//       const filtered = configListResponse.data.filter(config =>
//         config.value?.toString().toLowerCase().includes(quickSearchValue.toLowerCase())
//       );
//       setFilteredList(filtered);
//       setIsFiltered(true);
//     }
//   }, [quickSearchValue, configListResponse]);

//   // Cleanup
//   useEffect(() => {
//     return () => {
//       dispatch(setPageCode(''));
//       dispatch(setDivContent(''));
//     };
//   }, [dispatch]);

//   // Table row selected class
//   const isSelected = rowData => {
//     if (rowData && selectedConfig && rowData?.id === selectedConfig?.id) {
//       return 'selected-row';
//     } else return '';
//   };

//   // Icons column
//   const iconsForActions = rowData => (
//     <div className="container-of-icons">
//       <MdModeEdit
//         className="icons-style"
//         title="Edit"
//         size={24}
//         fill="var(--primary-gray)"
//         onClick={() => setPopupOpen(true)}
//       />
//       {rowData?.isActive ? (
//         <MdDelete
//           className="icons-style"
//           title="Deactivate"
//           size={24}
//           fill="var(--primary-pink)"
//           onClick={() => {
//             setStateOfDeleteModal('deactivate');
//             setOpenConfirmDeactivateReactivate(true);
//           }}
//         />
//       ) : (
//         <FaUndo
//           className="icons-style"
//           title="Activate"
//           size={24}
//           fill="var(--primary-gray)"
//           onClick={() => {
//             setStateOfDeleteModal('reactivate');
//             setOpenConfirmDeactivateReactivate(true);
//           }}
//         />
//       )}
//     </div>
//   );

//   // Table columns
//   const tableColumns = [
//     {
//       key: 'facilityId',
//       title: 'Facility',
//       render: (rowData: Configuration) => <p>{rowData?.facility?.name}</p>
//     },
//     {
//       key: 'key',
//       title: 'Key',
//       render: (rowData: Configuration) => <span>{formatEnumString(rowData.key)}</span>
//     },
//     {
//       key: 'valueType',
//       title: 'Value Type',
//       render: (rowData: Configuration) => <span>{formatEnumString(rowData.valueType)}</span>
//     },
//     { key: 'value', title: 'Value' },
//     {
//       key: 'referenceType',
//       title: 'Reference Type',
//       render: (rowData: Configuration) => <span>{formatEnumString(rowData.referenceType)}</span>
//     },
//     {
//       key: 'icons',
//       title: '',
//       render: rowData => iconsForActions(rowData)
//     }
//   ];




//   // Advanced Search Filter
//   const handleAdvancedSearch = () => {
//     if (!configListResponse?.data) return;

//     let filtered = [...configListResponse.data];
//     if (advancedFilterRecord.filter && advancedFilterRecord.value) {
//       filtered = filtered.filter(config => {
//         const key = advancedFilterRecord.filter;
//         const val = advancedFilterRecord.value.toLowerCase();
//         return config[key]?.toString().toLowerCase().includes(val);
//       });
//     }
//     setFilteredList(filtered);
//     setIsFiltered(true);
//   };


//   const filters = () => (
//     <div className='my-table-filters'>
//       <Form layout="inline" fluid style={{ display: 'flex', gap: 10 }}>
//         <MyInput
//           fieldName="value"
//           record={{ value: quickSearchValue }}
//           setRecord={(rec) => setQuickSearchValue(rec.value)}
//           showLabel={false}
//           placeholder="Search"
//           disabled={showAdvanced}
//         />
//       </Form>

//       <AdvancedSearchFilters
//         showAdvanced={showAdvanced}
//         setShowAdvanced={setShowAdvanced}
//         searchFilter={true}
//             content={
//               <Form layout="inline" fluid style={{ display: 'flex', gap: 10 }}>
//                 <MyInput
//                   selectDataValue="value"
//                   selectDataLabel="label"
//                   selectData={filterFields}
//                   fieldName="filter"
//                   fieldType="select"
//                   record={advancedFilterRecord}
//                   setRecord={updatedRecord =>
//                     setAdvancedFilterRecord({ ...advancedFilterRecord, filter: updatedRecord.filter, value: '' })
//                   }
//                   showLabel={false}
//                   placeholder="Select Filter"
//                   searchable={false}
//                 />
//                 <MyInput
//                   fieldName="value"
//                   record={advancedFilterRecord}
//                   setRecord={setAdvancedFilterRecord}
//                   showLabel={false}
//                 />
//                 <MyButton color="var(--deep-blue)" width="80px" onClick={handleAdvancedSearch}>
//                   Search
//                 </MyButton>
//               </Form>
//             }

//       />
//     </div>
//   );

//   const handleNew = () => {
//     setSelectedConfig(null);
//     setPopupOpen(true);
//   };

//   const handleDeactivateReactivate = () => {
//     if (!selectedConfig) return;

//     const toUpdate = {
//       id: selectedConfig.id,
//       key: selectedConfig.key,
//       value: selectedConfig.value,
//       valueType: selectedConfig.valueType,
//       referenceType: selectedConfig.referenceType,
//       description: selectedConfig.description,
//       facilityId: Number(selectedConfig?.facility?.id),
//       isActive: stateOfDeleteModal === 'reactivate'
//     };

//     updateConfiguration({ id: selectedConfig.id, body: toUpdate })
//       .unwrap()
//       .then(() => {
//         dispatch(notify({ msg: 'Configuration updated successfully', sev: 'success' }));
//         refetch();
//       })
//       .catch(() => dispatch(notify({ msg: 'Failed to update configuration', sev: 'error' })));

//     setOpenConfirmDeactivateReactivate(false);
//   };

//   return (
//     <Panel>
//       <MyTable
//         rowClassName={isSelected}
//         height={450}
//         totalCount={totalCount}
//         data={isFiltered ? filteredList : configListResponse?.data ?? []}
//         loading={isFetching}
//         columns={tableColumns}
//         onRowClick={rowData => setSelectedConfig(rowData)}
//         page={paginationParams.page}
//         rowsPerPage={paginationParams.size}
//         onPageChange={(e, newPage) => setPaginationParams({ ...paginationParams, page: newPage })}
//         onRowsPerPageChange={e => setPaginationParams({ ...paginationParams, size: Number(e.target.value), page: 0 })}
//         filters={filters()
//         }
//         tableButtons={
//           <div className="container-of-add-new-button">
//             <MyButton
//               prefixIcon={() => <AddOutlineIcon />}
//               color="var(--deep-blue)"
//               onClick={handleNew}
//               width="109px"
//             >
//               Add New
//             </MyButton>
//           </div>
//         }
//       />

//       <AddEditConfiguration
//         open={popupOpen}
//         setOpen={setPopupOpen}
//         configuration={selectedConfig}
//       />

//       <DeletionConfirmationModal
//         open={openConfirmDeactivateReactivate}
//         setOpen={setOpenConfirmDeactivateReactivate}
//         itemToDelete="Configuration"
//         actionButtonFunction={handleDeactivateReactivate}
//         actionType={stateOfDeleteModal}
//       />
//     </Panel>
//   );
// };

// export default SystemConfiguration;



// import React, { useState, useEffect } from 'react';
// import { Panel, Form } from 'rsuite';
// import MyInput from '@/components/MyInput';
// import MyTable from '@/components/MyTable';
// import MyButton from '@/components/MyButton/MyButton';
// import AddEditConfiguration from './AddEditConfiguration';
// import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
// import { notify } from '@/utils/uiReducerActions';
// import { useAppDispatch } from '@/hooks';
// import { setDivContent, setPageCode } from '@/reducers/divSlice';
// import {
//   useGetConfigurationsQuery,
//   useUpdateConfigurationMutation
// } from '@/services/setup/systemConfiguration/systemConfigurationService';
// import { Configuration } from '@/types/model-types-new';
// import { MdDelete, MdModeEdit } from 'react-icons/md';
// import { FaUndo } from 'react-icons/fa';
// import { formatEnumString } from '@/utils';
// import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
// import AddOutlineIcon from '@rsuite/icons/AddOutline';
// import { useEnumOptions } from '@/services/enumsApi';

// const SystemConfiguration = () => {
//   const dispatch = useAppDispatch();

//   const [selectedConfig, setSelectedConfig] = useState<Configuration | null>(null);
//   const [popupOpen, setPopupOpen] = useState(false);
//   const [openConfirmDeactivateReactivate, setOpenConfirmDeactivateReactivate] = useState(false);
//   const [stateOfDeleteModal, setStateOfDeleteModal] = useState<'deactivate' | 'reactivate'>(
//     'deactivate'
//   );

//   const [showAdvanced, setShowAdvanced] = useState(false);

//   // Pagination
//   const [paginationParams, setPaginationParams] = useState({
//     page: 0,
//     size: 5,
//     sort: 'id,asc',
//     timestamp: Date.now()
//   });

//   // Quick Search
//   const [quickSearchValue, setQuickSearchValue] = useState('');

//   // Advanced Search
//   const [advancedFilterRecord, setAdvancedFilterRecord] = useState({
//     filter: '',
//     value: ''
//   });

//   // Data
//   const { data: configListResponse, refetch, isFetching } =
//     useGetConfigurationsQuery(paginationParams);

//   const [updateConfiguration] = useUpdateConfigurationMutation();
//   const configurationValueTypeEnumList = useEnumOptions('ConfigurationValueType');
//   const configurationreferenceTypeEnumList = useEnumOptions('ConfigurationReferenceType');

//   // Page Header
//   dispatch(setPageCode('SystemConfiguration'));
//   dispatch(setDivContent('System Configuration'));

//   // Filtered list
//   const [filteredList, setFilteredList] = useState<Configuration[]>([]);
//   const [isFiltered, setIsFiltered] = useState(false);

//   const totalCount = isFiltered
//     ? filteredList.length
//     : configListResponse?.totalCount ?? 0;

//   // Available fields for Advanced Search
//   const filterFields = [
//     { label: 'Value Type', value: 'valueType' },
//     { label: 'Reference Type', value: 'referenceType' }
//   ];

//   // Cleanup
//   useEffect(() => {
//     return () => {
//       dispatch(setPageCode(''));
//       dispatch(setDivContent(''));
//     };
//   }, [dispatch]);

//   // Row selected
//   const isSelected = (rowData: Configuration) =>
//     rowData?.id === selectedConfig?.id ? 'selected-row' : '';

//   // Icons
//   const iconsForActions = (rowData: Configuration) => (
//     <div className="container-of-icons">
//       <MdModeEdit
//         className="icons-style"
//         title="Edit"
//         size={24}
//         fill="var(--primary-gray)"
//         onClick={() => setPopupOpen(true)}
//       />
//       {rowData?.isActive ? (
//         <MdDelete
//           className="icons-style"
//           title="Deactivate"
//           size={24}
//           fill="var(--primary-pink)"
//           onClick={() => {
//             setStateOfDeleteModal('deactivate');
//             setOpenConfirmDeactivateReactivate(true);
//           }}
//         />
//       ) : (
//         <FaUndo
//           className="icons-style"
//           title="Activate"
//           size={24}
//           fill="var(--primary-gray)"
//           onClick={() => {
//             setStateOfDeleteModal('reactivate');
//             setOpenConfirmDeactivateReactivate(true);
//           }}
//         />
//       )}
//     </div>
//   );

//   // Table columns
//   const tableColumns = [
//     {
//       key: 'facilityId',
//       title: 'Facility',
//       render: (rowData: Configuration) => <p>{rowData?.facility?.name}</p>
//     },
//     {
//       key: 'key',
//       title: 'Key',
//       render: (rowData: Configuration) => formatEnumString(rowData.key)
//     },
//     {
//       key: 'valueType',
//       title: 'Value Type',
//       render: (rowData: Configuration) => formatEnumString(rowData.valueType)
//     },
//     { key: 'value', title: 'Value' },
//     {
//       key: 'referenceType',
//       title: 'Reference Type',
//       render: (rowData: Configuration) => formatEnumString(rowData.referenceType)
//     },
//     {
//       key: 'icons',
//       title: '',
//       render: rowData => iconsForActions(rowData)
//     }
//   ];

//   // ─────────────── QUICK SEARCH ───────────────
//   const handleQuickSearch = () => {
//     if (!configListResponse?.data) return;

//     if (quickSearchValue.trim().length < 3) {
//       dispatch(
//         notify({
//           msg: 'Please enter at least 3 characters',
//           sev: 'warning'
//         })
//       );
//       return;
//     }

//     // Cancel Advanced Search
//     setAdvancedFilterRecord({ filter: '', value: '' });
//     setShowAdvanced(false);

//     const filtered = configListResponse.data.filter(config =>
//       config.value
//         ?.toString()
//         .toLowerCase()
//         .includes(quickSearchValue.toLowerCase())
//     );

//     setFilteredList(filtered);
//     setIsFiltered(true);
//   };

//   // ─────────────── ADVANCED SEARCH ───────────────
//   const handleAdvancedSearch = () => {
//     if (!configListResponse?.data) return;

//     // Cancel Quick Search
//     setQuickSearchValue('');

//     let filtered = [...configListResponse.data];

//     if (advancedFilterRecord.filter && advancedFilterRecord.value) {
//       filtered = filtered.filter(config => {
//         const key = advancedFilterRecord.filter;
//         const val = advancedFilterRecord.value.toLowerCase();
//         return config[key]?.toString().toLowerCase().includes(val);
//       });
//     }

//     setFilteredList(filtered);
//     setIsFiltered(true);
//   };

//   // Filters UI
//   const filters = () => (
//     <div className="my-table-filters">
//       {/* Quick Search */}
//       <Form layout="inline" fluid style={{ display: 'flex', gap: 10 }}>
//         <MyInput
//           fieldName="value"
//           record={{ value: quickSearchValue }}
//           setRecord={rec => setQuickSearchValue(rec.value)}
//           showLabel={false}
//           placeholder="Search"
//           disabled={showAdvanced}
//         />
//         <MyButton
//           color="var(--deep-blue)"
//           width="80px"
//           onClick={handleQuickSearch}
//           disabled={showAdvanced}
//         >
//           Search
//         </MyButton>
//       </Form>

//       {/* Advanced Search */}
//       <AdvancedSearchFilters
//         showAdvanced={showAdvanced}
//         setShowAdvanced={setShowAdvanced}
//         searchFilter={true}
//         content={
//           <Form layout="inline" fluid style={{ display: 'flex', gap: 10 }}>
//             <MyInput
//               selectDataValue="value"
//               selectDataLabel="label"
//               selectData={filterFields}
//               fieldName="filter"
//               fieldType="select"
//               record={advancedFilterRecord}
//               setRecord={updated =>
//                 setAdvancedFilterRecord({
//                   ...advancedFilterRecord,
//                   filter: updated.filter,
//                   value: ''
//                 })
//               }
//               showLabel={false}
//               placeholder="Select Filter"
//               searchable={false}
//             />
//             {advancedFilterRecord['filter'] == 'valueType' ? (
//             <MyInput
//               fieldName="value"
//               fieldType="select"
//               selectData={configurationValueTypeEnumList ?? []}
//               selectDataLabel="label"
//               selectDataValue="value"
//               record={advancedFilterRecord}
//               setRecord={setAdvancedFilterRecord}
//               searchable={false}
//               showLabel={false}
//             /> ) : advancedFilterRecord['filter'] == 'referenceType' ? (
//             <MyInput
//               fieldName="value"
//               fieldType="select"
//               selectData={configurationreferenceTypeEnumList ?? []}
//               selectDataLabel="label"
//               selectDataValue="value"
//               record={advancedFilterRecord}
//               setRecord={setAdvancedFilterRecord}
//               searchable={false}
//               showLabel={false}
//             />
//             ) : (
//                <MyInput
//               fieldName="value"
//               record={advancedFilterRecord}
//               setRecord={setAdvancedFilterRecord}
//               showLabel={false}
//             />
//             )}
//             <MyButton
//               color="var(--deep-blue)"
//               width="80px"
//               onClick={handleAdvancedSearch}
//             >
//               Search
//             </MyButton>
//           </Form>
//         }
//       />
//     </div>
//   );

//   const handleNew = () => {
//     setSelectedConfig(null);
//     setPopupOpen(true);
//   };

//   const handleDeactivateReactivate = () => {
//     if (!selectedConfig) return;

//     const toUpdate = {
//       id: selectedConfig.id,
//       key: selectedConfig.key,
//       value: selectedConfig.value,
//       valueType: selectedConfig.valueType,
//       referenceType: selectedConfig.referenceType,
//       description: selectedConfig.description,
//       facilityId: Number(selectedConfig?.facility?.id),
//       isActive: stateOfDeleteModal === 'reactivate'
//     };

//     updateConfiguration({ id: selectedConfig.id, body: toUpdate })
//       .unwrap()
//       .then(() => {
//         dispatch(
//           notify({ msg: 'Configuration updated successfully', sev: 'success' })
//         );
//         refetch();
//       })
//       .catch(() =>
//         dispatch(
//           notify({ msg: 'Failed to update configuration', sev: 'error' })
//         )
//       );

//     setOpenConfirmDeactivateReactivate(false);
//   };

//   return (
//     <Panel>
//       <MyTable
//         height={450}
//         rowClassName={isSelected}
//         totalCount={totalCount}
//         data={isFiltered ? filteredList : configListResponse?.data ?? []}
//         loading={isFetching}
//         columns={tableColumns}
//         onRowClick={rowData => setSelectedConfig(rowData)}
//         page={paginationParams.page}
//         rowsPerPage={paginationParams.size}
//         onPageChange={(e, newPage) =>
//           setPaginationParams({ ...paginationParams, page: newPage })
//         }
//         onRowsPerPageChange={e =>
//           setPaginationParams({
//             ...paginationParams,
//             size: Number(e.target.value),
//             page: 0
//           })
//         }
//         filters={filters()}
//         tableButtons={
//           <div className="container-of-add-new-button">
//             <MyButton
//               prefixIcon={() => <AddOutlineIcon />}
//               color="var(--deep-blue)"
//               onClick={handleNew}
//               width="109px"
//             >
//               Add New
//             </MyButton>
//           </div>
//         }
//       />

//       <AddEditConfiguration
//         open={popupOpen}
//         setOpen={setPopupOpen}
//         configuration={selectedConfig}
//       />

//       <DeletionConfirmationModal
//         open={openConfirmDeactivateReactivate}
//         setOpen={setOpenConfirmDeactivateReactivate}
//         itemToDelete="Configuration"
//         actionButtonFunction={handleDeactivateReactivate}
//         actionType={stateOfDeleteModal}
//       />
//     </Panel>
//   );
// };

// export default SystemConfiguration;




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
  // useLazyGetConfigurationByKeyQuery
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
  const [popupOpen, setPopupOpen] = useState(false);
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
  // const [fetchByKey] = useLazyGetConfigurationByKeyQuery();

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
    // { label: 'Key', value: 'key' }
  ];

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

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
    { key: 'icons', title: '', render: rowData => iconsForActions(rowData) }
  ];

  // ─────────────── FILTER HANDLERS ───────────────
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
      //  else if (advancedFilterRecord.filter === 'key') {
      //   response = await fetchByKey({ key: advancedFilterRecord.value, ...params }).unwrap();
      // }

      setFilteredList(response.data ?? []);
      setFilteredTotal(response.totalCount ?? 0);
      setIsFiltered(true);
      setFilterPagination({ ...filterPagination, page, size });
    } catch (error) {
      dispatch(notify({ msg: 'Failed to filter Configurations', sev: 'error' }));
      setIsFiltered(false);
    }
  };

  const handleQuickSearch = async (page = 0, size = filterPagination.size) => {
    if (!quickSearchValue || quickSearchValue.trim().length < 3) {
      dispatch(notify({ msg: 'Please enter at least 3 characters', sev: 'warning' }));
      return;
    }
    setAdvancedFilterRecord({ filter: '', value: '' });
    setShowAdvanced(false);
    await handleAdvancedSearch(page, size); // استخدم نفس lazy query لكن على key أو value حسب السيرفر
  };

  // Filters UI
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
        <MyButton
          color="var(--deep-blue)"
          width="80px"
          onClick={() => handleQuickSearch(0, filterPagination.size)}
          disabled={showAdvanced}
        >
          Search
        </MyButton>
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
              <MyInput fieldName="value" record={advancedFilterRecord} setRecord={setAdvancedFilterRecord} showLabel={false} />
            )}
            <MyButton color="var(--deep-blue)" width="80px" onClick={() => handleAdvancedSearch(0, filterPagination.size)}>
              Search
            </MyButton>
          </Form>
        }
      />
    </div>
  );

  const handleNew = () => {
    setSelectedConfig(null);
    setPopupOpen(true);
  };

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
      handleAdvancedSearch(newPage, filterPagination.size);
    } else {
      setPaginationParams({ ...paginationParams, page: newPage });
    }
  };

  const handleRowsPerPageChange = e => {
    const newSize = Number(e.target.value);
    if (isFiltered) {
      handleAdvancedSearch(filterPagination.page, newSize);
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

      <AddEditConfiguration open={popupOpen} setOpen={setPopupOpen} configuration={selectedConfig} width={width}/>

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
