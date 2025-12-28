// import Translate from '@/components/Translate';
// import React, { useEffect, useState } from 'react';
// import { Panel, Form } from 'rsuite';
// import { MdModeEdit, MdDelete } from 'react-icons/md';
// import { FaUndo } from 'react-icons/fa';
// import AddOutlineIcon from '@rsuite/icons/AddOutline';

// import MyTable from '@/components/MyTable';
// import MyButton from '@/components/MyButton/MyButton';
// import MyInput from '@/components/MyInput';
// import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

// import {
//   useGetConfigurationsQuery,
//   useAddConfigurationMutation,
//   useUpdateConfigurationMutation
// }  from '@/services/setup/systemConfiguration/systemConfigurationService'
// import { Configuration } from '@/types/model-types-new';
// import { useAppDispatch } from '@/hooks';
// import { notify } from '@/utils/uiReducerActions';
// import AddEditConfiguration from './AddEditConfiguration';

// const SystemConfiguration = () => {
//   const dispatch = useAppDispatch();

//   const [popupOpen, setPopupOpen] = useState(false);
//   const [confirmOpen, setConfirmOpen] = useState(false);
//   const [actionType, setActionType] = useState<'deactivate' | 'reactivate'>('deactivate');

//   const [selectedConfig, setSelectedConfig] = useState<Configuration | null>(null);

//   const [paginationParams, setPaginationParams] = useState({
//     page: 0,
//     size: 10,
//     sort: 'id,asc',
//     timestamp: Date.now()
//   });

//   /** Fetch list */
//   const {
//     data: configurationResponse,
//     isFetching,
//     refetch
//   } = useGetConfigurationsQuery(paginationParams);

//   /** Mutations */
//   const [addConfiguration] = useAddConfigurationMutation();
//   const [updateConfiguration] = useUpdateConfigurationMutation();

//   const totalCount = configurationResponse?.totalCount ?? 0;

//   /** Table actions */
//   const iconsForActions = (rowData: Configuration) => (
//     <div className="container-of-icons">
//       <MdModeEdit
//         className="icons-style"
//         size={22}
//         onClick={() => {
//           setSelectedConfig(rowData);
//           setPopupOpen(true);
//         }}
//       />

//       {rowData?.isActive  ? (
//         <MdDelete
//           className="icons-style"
//           size={22}
//           onClick={() => {
//             setSelectedConfig(rowData);
//             setActionType('deactivate');
//             setConfirmOpen(true);
//           }}
//         />
//       ) : (
//         <FaUndo
//           className="icons-style"
//           size={20}
//           onClick={() => {
//             setSelectedConfig(rowData);
//             setActionType('reactivate');
//             setConfirmOpen(true);
//           }}
//         />
//       )}
//     </div>
//   );

//   /** Table columns */
//   const tableColumns = [
//     {
//       key: 'key',
//       title: <Translate>Key</Translate>
//     },
//     {
//       key: 'value',
//       title: <Translate>Value</Translate>
//     },
//     {
//       key: 'facilityId',
//       title: <Translate>Facility</Translate>,
//       render: (rowData: Configuration) =>
//         rowData.facilityId ? rowData.facilityId : 'Organization'
//     },
//     {
//       key: 'status',
//       title: <Translate>Status</Translate>,
//       render: (rowData: Configuration) =>
//         rowData?.isActive ? 'Active' : 'Inactive'
//     },
//     {
//       key: 'icons',
//       title: '',
//       flexGrow: 2,
//       render: iconsForActions
//     }
//   ];

//   /** Save handler */
//   const handleSave = (config: Configuration) => {
//     const action = config.id
//       ? updateConfiguration({ id: config.id, body: config })
//       : addConfiguration(config);

//     action
//       .unwrap()
//       .then(() => {
//         dispatch(notify({ msg: 'Configuration saved successfully', sev: 'success' }));
//         setPopupOpen(false);
//         refetch();
//       })
//       .catch(() => {
//         dispatch(notify({ msg: 'Failed to save configuration', sev: 'error' }));
//       });
//   };

//   /** Activate / Deactivate */
//   const handleStatusChange = () => {
//     if (!selectedConfig) return;

//     updateConfiguration({
//       id: selectedConfig.id,
//       body: {
//         ...selectedConfig,
//         isActive: actionType === 'deactivate' ? false : true  //baaaaaaaaaaaack
//       }
//     })
//       .unwrap()
//       .then(() => {
//         dispatch(
//           notify({
//             msg:
//               actionType === 'deactivate'
//                 ? 'Configuration deactivated'
//                 : 'Configuration activated',
//             sev: 'success'
//           })
//         );
//         setConfirmOpen(false);
//         refetch();
//       });
//   };

//   return (
//     <Panel>
//       <MyTable
//         height={450}
//         data={configurationResponse?.data ?? []}
//         loading={isFetching}
//         columns={tableColumns}
//         page={paginationParams.page}
//         rowsPerPage={paginationParams.size}
//         totalCount={totalCount}
//         onPageChange={(_, page) =>
//           setPaginationParams({ ...paginationParams, page })
//         }
//         onRowsPerPageChange={e =>
//           setPaginationParams({
//             ...paginationParams,
//             size: parseInt(e.target.value, 10),
//             page: 0
//           })
//         }
//         tableButtons={
//           <MyButton
//             prefixIcon={() => <AddOutlineIcon />}
//             onClick={() => {
//               setSelectedConfig(null);
//               setPopupOpen(true);
//             }}
//           >
//             Add New
//           </MyButton>
//         }
//       />

//       <AddEditConfiguration
//         open={popupOpen}
//         setOpen={setPopupOpen}
//         configuration={selectedConfig}
//         onSave={handleSave}
//       />

//       <DeletionConfirmationModal
//         open={confirmOpen}
//         setOpen={setConfirmOpen}
//         itemToDelete="Configuration"
//         actionButtonFunction={handleStatusChange}
//         actionType={actionType}
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
  useAddConfigurationMutation,
  useUpdateConfigurationMutation
} from '@/services/setup/systemConfiguration/systemConfigurationService';
import { newConfigurationCreateVM, newConfigurationUpdateVM } from '@/types/model-types-constructor-new';
import { Configuration } from '@/types/model-types-new';
import { MdDelete } from 'react-icons/md';
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';

const SystemConfiguration = () => {
  const dispatch = useAppDispatch();
  const [selectedConfig, setSelectedConfig] = useState<Configuration | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [filterRecord, setFilterRecord] = useState({ filter: '', value: '' });
  const [filteredList, setFilteredList] = useState<Configuration[]>([]);
  const [isFiltered, setIsFiltered] = useState(false);

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  const { data: configListResponse, refetch, isFetching } = useGetConfigurationsQuery(paginationParams);

  // Header page setup
  dispatch(setPageCode('SystemConfiguration'));
  dispatch(setDivContent('System Configuration'));

  const totalCount = isFiltered ? filteredList.length : configListResponse?.totalCount ?? 0;

   // Icons column (Edit, reactive/Deactivate)
    const iconsForActions = rowData => (
      <div className="container-of-icons">
        <MdModeEdit
          className="icons-style"
          title="Edit"
          size={24}
          fill="var(--primary-gray)"
          
        />
        {rowData?.isActive ? (
          <MdDelete
            className="icons-style"
            title="Deactivate"
            size={24}
            fill="var(--primary-pink)"
          />
        ) : (
          <FaUndo
            className="icons-style"
            title="Activate"
            size={24}
            fill="var(--primary-gray)"
          />
        )}
      </div>
    );
  const tableColumns = [
    { key: 'key', title: 'Key' },
    { key: 'value', title: 'Value' },
    { key: 'description', title: 'Description' },
     {
      key: 'icons',
      title: '',
      render: rowData => iconsForActions(rowData)
    }
  ];

  const handleNew = () => {
    setSelectedConfig(null);
    setPopupOpen(true);
  };

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  return (
    <Panel>
      <div style={{ marginBottom: 10 }}>
        <MyButton color="var(--deep-blue)" onClick={handleNew} width="120px">
          Add New
        </MyButton>
      </div>

      <MyTable
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
      />

      <AddEditConfiguration
        open={popupOpen}
        setOpen={setPopupOpen}
        configuration={selectedConfig}
      />

      <DeletionConfirmationModal
        open={openConfirmDelete}
        setOpen={setOpenConfirmDelete}
        itemToDelete="Configuration"
        actionButtonFunction={() => {}}
        actionType="delete"
      />
    </Panel>
  );
};

export default SystemConfiguration;
