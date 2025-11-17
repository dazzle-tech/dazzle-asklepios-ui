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
import { useDeleteUOMGroupMutation, useGetAllUOMGroupsQuery } from '@/services/setup/uom-group/uomGroupService';
import { uomGroup } from '@/types/model-types-new';
import MyInput from '@/components/MyInput';
import { PaginationPerPage } from '@/utils/paginationPerPage';

const UOMGroup = () => {
  const dispatch = useAppDispatch();
  const [uomGroup, setUomGroup] = useState<uomGroup>({ ...newUOMGroup });
  const [uomGrpupOpen, setUomGroupOpen] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [searchTerm, setSearchTerm] = useState({ value: '' });
  const [openConfirmDeleteUOMGroupModal, setOpenConfirmDeleteUOMGroupModal] =
    useState<boolean>(false);
  // Save uom group
  // remove uom group
  const [deleteUomGroup] = useDeleteUOMGroupMutation();
  const [paginationParams, setPaginationParams] = useState({
      page: 0,
      size: 5,
      sort: 'id,asc',
      timestamp: Date.now()
    });
    // const [filterPagination, setFilterPagination] = useState({
    //   page: 0,
    //   size: 5,
    //   sort: 'id,asc'
    // });
    const [sortColumn, setSortColumn] = useState('id');
    const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
    // Pagination values
 
  // Fetch uom groups list response
  const {
    data: uomGroupsListResponse,
    refetch: refetchUomGroups,
    isFetching
  } = useGetAllUOMGroupsQuery({name: searchTerm['value'], ...paginationParams});

  const totalCount = uomGroupsListResponse?.totalCount ?? 0;

  // Header page setUp
  const divContent = (
    "UOM Groups"
  );
  dispatch(setPageCode('UOM_Groups'));
  dispatch(setDivContent(divContent));
 // Pagination values

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
 
 
   // ──────────────────────────── PAGINATION ────────────────────────────
    const handlePageChange = (event, newPage) => {
      // if (isFiltered) {
      //   handleFilterChange(rec.filter, recordOfFilter.value, newPage);
      // } else {
        // PaginationPerPage.handlePageChange(
        //   event,
        //   newPage,
        //   paginationParams,
        //   link,
        //   setPaginationParams
        // );
        setPaginationParams({...paginationParams, page: newPage});
      // }
    };

    //_________________________SORT LOGIC______________________
  const handleSortChange = (sortColumn: string, sortType: 'asc' | 'desc') => {
    setSortColumn(sortColumn);
    setSortType(sortType);

    const sortValue = `${sortColumn},${sortType}`;

    // if (isFiltered) {
    //   setFilterPagination({ ...filterPagination, sort: sortValue, page: 0 });
    //   handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, filterPagination.size);
    // } else {
      setPaginationParams({
        ...paginationParams,
        sort: sortValue,
        page: 0,
        timestamp: Date.now()
      });
    // }
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
                  width='220px'
                  height={32}
                />
              </Form>
            </div>
    );

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

          // if (isFiltered) {
          //   setFilterPagination({ ...filterPagination, size: newSize, page: 0 });
          //   handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, newSize);
          // } else {
            setPaginationParams({
              ...paginationParams,
              size: newSize,
              page: 0,
              timestamp: Date.now()
            });
          // }
        }}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
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
