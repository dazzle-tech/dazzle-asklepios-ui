import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import {
  useSaveUomGroupMutation,
  useGetUomGroupsQuery,
  useRemoveUomGroupMutation
} from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApUomGroups } from '@/types/model-types';
import { newApUomGroups } from '@/types/model-types-constructor';
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import AddEditUom from './AddEditUom';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less';

const UOMGroup = () => {
  const dispatch = useAppDispatch();
  const [uomGroup, setUomGroup] = useState<ApUomGroups>({ ...newApUomGroups });
  const [uomGrpupOpen, setUomGroupOpen] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openConfirmDeleteUOMGroupModal, setOpenConfirmDeleteUOMGroupModal] =
    useState<boolean>(false);
  const [stateOfDeleteUOMGroupModal, setStateOfDeleteUOMGroupModal] = useState<string>('delete');
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  // Save uom group
  const [saveUomGroup, saveUomGroupMutation] = useSaveUomGroupMutation();
  // remove uom group
  const [removeUomGroup] = useRemoveUomGroupMutation();
  // Fetch uom groups list response
  const {
    data: uomGroupsListResponse,
    refetch: refetchUomGroups,
    isFetching
  } = useGetUomGroupsQuery(listRequest);
  // Header page setUp
  const divContent = (
    "UOM Groups"
  );
  dispatch(setPageCode('UOM_Groups'));
  dispatch(setDivContent(divContent));
 // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = uomGroupsListResponse?.extraNumeric ?? 0;

  const isSelected = rowData => {
    if (rowData && uomGroup && rowData.key === uomGroup.key) {
      return 'selected-row';
    } else return '';
  };

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (saveUomGroupMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveUomGroupMutation.data]);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  // handle click on Add New button
  const handleUomGroupNew = () => {
    setUomGroupOpen(true);
    setUomGroup({ ...newApUomGroups });
  };
  // Handle page change in navigation
  const handlePageChange = (_: unknown, newPage: number) => {
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };
  // Handle change rows per page in navigation
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };
  // handle deactivate uom group
  const handleDeactivateUomGroup = async data => {
    setOpenConfirmDeleteUOMGroupModal(false);
    try {
      await removeUomGroup({
        ...uomGroup
      })
        .unwrap()
        .then(() => {
          refetchUomGroups();
          dispatch(
            notify({
              msg: 'The UOM group was successfully ' + stateOfDeleteUOMGroupModal,
              sev: 'success'
            })
          );
        });
    } catch (error) {
      dispatch(
        notify({
          msg: 'Failed to ' + stateOfDeleteUOMGroupModal + ' this UOM group',
          sev: 'error'
        })
      );
    }
  };
  //handle Reactivate uom group
  const handleReactiveUom = () => {
    setOpenConfirmDeleteUOMGroupModal(false);
    const updatedUom = { ...uomGroup, deletedAt: null };
    saveUomGroup(updatedUom)
      .unwrap()
      .then(() => {
        // display success message
        dispatch(notify({ msg: 'The UOM group has been activated successfully', sev: 'success' }));
      })
      .catch(() => {
        // display error message
        dispatch(notify({ msg: 'Failed to activated this UOM group', sev: 'error' }));
      });
  };
  // const handleFilterChange = (fieldName, value) => {
  //   if (value) {
  //     setListRequest(
  //       addFilterToListRequest(
  //         fromCamelCaseToDBName(fieldName),
  //         'startsWithIgnoreCase',
  //         value,
  //         listRequest
  //       )
  //     );
  //   } else {
  //     setListRequest({ ...listRequest, filters: [] });
  //   }
  // };

  // Icons column (Edite, reactive/Deactivate)
  const iconsForActions = (rowData: ApUomGroups) => (
    <div className="container-of-icons">
      {/* open edit resource when click on this icon */}
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setUomGroupOpen(true)}
        // onClick={() => setPopupOpen(true)}
      />
      {/* deactivate/activate  when click on one of these icon */}
      {!rowData?.deletedAt ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteUOMGroupModal('deactivate');
            setOpenConfirmDeleteUOMGroupModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteUOMGroupModal('reactivate');
            setOpenConfirmDeleteUOMGroupModal(true);
          }}
        />
      )}
    </div>
  );
  //Table columns
  const tableColumns = [
    {
      key: 'name',
      title: <Translate>Group Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'code',
      title: <Translate>Group code</Translate>,
      flexGrow: 4
    },
    {
      key: 'description',
      title: <Translate>Description</Translate>,
      flexGrow: 4
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];
  return (
    <Panel>

      <MyTable
        height={450}
        data={uomGroupsListResponse?.object ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        // filters={filters()}
        onRowClick={rowData => {
          setUomGroup(rowData);
        }}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortChange={(sortBy, sortType) => {
          if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        tableButtons={      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={handleUomGroupNew}
          width="109px"
        >
          Add New
        </MyButton>
      </div>}
      />

      <AddEditUom open={uomGrpupOpen} setOpen={setUomGroupOpen} uom={uomGroup} setUom={setUomGroup} width={width} />
      <DeletionConfirmationModal
        open={openConfirmDeleteUOMGroupModal}
        setOpen={setOpenConfirmDeleteUOMGroupModal}
        itemToDelete="UOM group"
        actionButtonFunction={
          stateOfDeleteUOMGroupModal == 'deactivate'
            ? () => handleDeactivateUomGroup(uomGroup)
            : handleReactiveUom
        }
        actionType={stateOfDeleteUOMGroupModal}
      />
    </Panel>
  );
};

export default UOMGroup;
