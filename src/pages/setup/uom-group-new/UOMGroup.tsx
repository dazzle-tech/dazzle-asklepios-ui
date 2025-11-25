import React, { useState, useEffect } from 'react';
import { Form, Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit } from 'react-icons/md';
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
import {
  useDeleteUOMGroupMutation,
  useGetAllUOMGroupsQuery
} from '@/services/setup/uom-group/uomGroupService';
import { uomGroup } from '@/types/model-types-new';
import MyInput from '@/components/MyInput';

const UOMGroup = () => {
  const dispatch = useAppDispatch();
  const [uomGroup, setUomGroup] = useState<uomGroup>({ ...newUOMGroup });
  const [uomGrpupOpen, setUomGroupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState({ value: '' });
  const [openConfirmDeleteUOMGroupModal, setOpenConfirmDeleteUOMGroupModal] =
    useState<boolean>(false);
  // Pagination values
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: 'id,asc',
    timestamp: Date.now()
  });
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  // Fetch uom groups list response
  const {
    data: uomGroupsListResponse,
    refetch: refetchUomGroups,
    isFetching
  } = useGetAllUOMGroupsQuery({ name: searchTerm['value'], ...paginationParams });
  // delete group
  const [deleteUomGroup] = useDeleteUOMGroupMutation();
  // number of all groups
  const totalCount = uomGroupsListResponse?.totalCount ?? 0;
  // Header page setUp
  const divContent = 'UOM Groups';
  dispatch(setPageCode('UOM_Groups'));
  dispatch(setDivContent(divContent));

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && uomGroup && rowData.id === uomGroup.id) {
      return 'selected-row';
    } else return '';
  };

  // handle click on Add New button
  const handleUomGroupNew = () => {
    setUomGroupOpen(true);
    setUomGroup({ ...newUOMGroup });
  };

  // handle delete uom group
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

  // ──────────────────────────── PAGINATION ────────────────────────────
  const handlePageChange = (event, newPage) => {
    setPaginationParams({ ...paginationParams, page: newPage });
  };

  //_________________________SORT LOGIC______________________
  const handleSortChange = (sortColumn: string, sortType: 'asc' | 'desc') => {
    setSortColumn(sortColumn);
    setSortType(sortType);

    const sortValue = `${sortColumn},${sortType}`;
    setPaginationParams({
      ...paginationParams,
      sort: sortValue,
      page: 0,
      timestamp: Date.now()
    });
  };

  // Icons column (Edite, delete)
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
      title: 'Group Name',
      flexGrow: 4
    },
    {
      key: 'description',
      title: 'Description',
      flexGrow: 4
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 3,
      render: () => iconsForActions()
    }
  ];

  // filters
  const filters = () => (
    <div className="container-of-header-actions-medication-matrix">
      <Form layout="inline" className="form-medication-matrix">
        <MyInput
          fieldName="value"
          fieldType="text"
          record={searchTerm}
          setRecord={setSearchTerm}
          showLabel={false}
          placeholder="Search by Name"
          width="220px"
          height={32}
        />
      </Form>
    </div>
  );

  // Effects
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  return (
    <Panel>
      <MyTable
        height={450}
        totalCount={totalCount}
        data={uomGroupsListResponse?.data ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setUomGroup(rowData);
        }}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={e => {
          const newSize = Number(e.target.value);
          setPaginationParams({
            ...paginationParams,
            size: newSize,
            page: 0,
            timestamp: Date.now()
          });
        }}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={handleUomGroupNew}
              width="109px"
            >
              Add New
            </MyButton>
          </div>
        }
      />

      <AddEditUom
        open={uomGrpupOpen}
        setOpen={setUomGroupOpen}
        uom={uomGroup}
        setUom={setUomGroup}
        refetchUomGroups={refetchUomGroups}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteUOMGroupModal}
        setOpen={setOpenConfirmDeleteUOMGroupModal}
        itemToDelete="UOM group"
        actionButtonFunction={() => handleDeleteUomGroup()}
        actionType="delete"
      />
    </Panel>
  );
};

export default UOMGroup;
