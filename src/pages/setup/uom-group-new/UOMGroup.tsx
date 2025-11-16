import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import {
  useSaveUomGroupMutation,
  useRemoveUomGroupMutation
} from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApUomGroups } from '@/types/model-types';
import { newApUomGroups } from '@/types/model-types-constructor';
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import AddEditUom from './AddEditUom';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less';
import { newUOMGroup } from '@/types/model-types-constructor-new';
import { useCreateUOMGroupMutation, useDeleteUOMGroupMutation, useGetAllUOMGroupsQuery } from '@/services/setup/uom-group/uomGroupService';
import { uomGroup } from '@/types/model-types-new';

const UOMGroup = () => {
  const dispatch = useAppDispatch();
  const [uomGroup, setUomGroup] = useState<uomGroup>({ ...newUOMGroup });
  const [uomGrpupOpen, setUomGroupOpen] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openConfirmDeleteUOMGroupModal, setOpenConfirmDeleteUOMGroupModal] =
    useState<boolean>(false);
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  // Save uom group
  const [saveUomGroup, saveUomGroupMutation] = useCreateUOMGroupMutation();
  // remove uom group
  const [deleteUomGroup] = useDeleteUOMGroupMutation();
  // Fetch uom groups list response
  const {
    data: uomGroupsListResponse,
    refetch: refetchUomGroups,
    isFetching
  } = useGetAllUOMGroupsQuery({});
  // Header page setUp
  const divContent = (
    "UOM Groups"
  );
  dispatch(setPageCode('UOM_Groups'));
  dispatch(setDivContent(divContent));
 // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  // const totalCount = uomGroupsListResponse?.extraNumeric ?? 0;

  const isSelected = rowData => {
    if (rowData && uomGroup && rowData.id === uomGroup.id) {
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
    setUomGroup({ ...newUOMGroup });
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
  const handleDeleteUomGroup = async () => {
    setOpenConfirmDeleteUOMGroupModal(false);
    try {
      await deleteUomGroup(uomGroup?.id)
        .unwrap()
        .then(() => {
          refetchUomGroups();
          dispatch(
            notify({
              msg: 'The UOM group was deleted successfully ',
              sev: 'success'
            })
          );
        });
    } catch (error) {
      dispatch(
        notify({
          msg: 'Failed to delete this UOM group',
          sev: 'error'
        })
      );
    }
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
  const iconsForActions = () => (
    <div className="container-of-icons">
      {/* delete  when click on this icon */}
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setUomGroupOpen(true)}
        // onClick={() => setPopupOpen(true)}
      />
        <MdDelete
          className="icons-style"
          title="Delete"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setOpenConfirmDeleteUOMGroupModal(true);
          }}
        />
    </div>
  );
  //Table columns
  const tableColumns = [
    {
      key: 'name',
      title: "Group Name",
      flexGrow: 4
    },
    {
      key: 'description',
      title: "Description",
      flexGrow: 4
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 3,
      render: () => iconsForActions()
    }
  ];
  return (
    <Panel>

      <MyTable
        height={450}
        data={uomGroupsListResponse?.content ?? []}
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
        // totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        tableButtons={<div className="container-of-add-new-button">
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

      <AddEditUom open={uomGrpupOpen} setOpen={setUomGroupOpen} uom={uomGroup} setUom={setUomGroup} width={width} refetchUomGroups={refetchUomGroups} />
      <DeletionConfirmationModal
        open={openConfirmDeleteUOMGroupModal}
        setOpen={setOpenConfirmDeleteUOMGroupModal}
        itemToDelete="UOM group"
        actionButtonFunction={
           () => handleDeleteUomGroup()
        }
        actionType="delete"
      />
    </Panel>
  );
};

export default UOMGroup;
