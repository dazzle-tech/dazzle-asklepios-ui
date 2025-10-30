import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { IoSettingsSharp } from 'react-icons/io5';
import { ApResources } from '@/types/model-types';
import { newApResources } from '@/types/model-types-constructor';
import { Form } from 'rsuite';
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import MyInput from '@/components/MyInput';
import { MdDelete } from 'react-icons/md';
import AddEditResources from './AddEditResources';
import './styles.less';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import {
  useDeactiveActiveResourceMutation,
  useGetResourcesQuery,
  useGetResourcesWithAvailabilityQuery,
  useGetResourceWithDetailsQuery,
  useSaveResourcesMutation
} from '@/services/appointmentService';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AvailabilityTimeModal from './AvailabilityTimeModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';
import NewAvailabilityTimeModal from './NewAvailabilityTimeModal';
const Resources = () => {
  const dispatch = useAppDispatch();
  const [resources, setResources] = useState<ApResources>({ ...newApResources });
  const [selectedResources, setSelectedResources] = useState<ApResources>({ ...newApResources });
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [popupOpen, setPopupOpen] = useState(false); // to open add/edit resource pop up
  const [openAvailabilityTimePopup, setOpenAvailabilityTimePopup] = useState<boolean>(false); // to open availability time pop up
  const [openConfirmDeleteUserModal, setOpenConfirmDeleteUserModal] = useState<boolean>(false);
  const [stateOfDeleteUserModal, setStateOfDeleteUserModal] = useState<string>('delete');
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });

 
  // save resource
  const [saveResources, saveResourcesMutation] = useSaveResourcesMutation();
  // Fetch resources list response
  const { data: resourcesListResponse, refetch: refetchResources, isFetching } = useGetResourcesQuery(listRequest);
  // Deactivate resource
  const [deactiveResource] = useDeactiveActiveResourceMutation();
  // Header page setUp
  const divContent = (
        "Resources"
  );
  dispatch(setPageCode('Resources'));
  dispatch(setDivContent(divContent));
  const { data: resourcesWithAvailabilityResponse } = useGetResourcesWithAvailabilityQuery(listRequest);
  const { data: resourceAvailabilityDetails, error, isLoading } = useGetResourceWithDetailsQuery(selectedResources.key || '', {
    skip: !selectedResources.key
  });


  useEffect(() => {
    if (openAvailabilityTimePopup) {
      console.log("resourceAvailabilityDetails:", resourceAvailabilityDetails);
    }
  }, [ openAvailabilityTimePopup]);

  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = resourcesListResponse?.extraNumeric ?? 0;
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  // Available fields for filtering
  const filterFields = [
    { label: 'Resource Type', value: 'resourceTypeLkey' },
    { label: 'Resource Name', value: 'resourceName' },
    { label: 'Status', value: 'isValid' },
    { label: 'Creation Date', value: 'createdAt' },
  ]
  // Class name of selected row
  const isSelected = rowData => {
    if (rowData && resources && rowData.key === resources.key) {
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
    if (saveResourcesMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveResourcesMutation.data]);
  // to handle filter change
  useEffect(() => {
    if (recordOfFilter['filter']) {
      handleFilterChange(recordOfFilter['filter'], recordOfFilter['value']);
    } else {
      setListRequest({
        ...initialListRequest,
        pageSize: listRequest.pageSize,
        pageNumber: 1
      });
    }
  }, [recordOfFilter]);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

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
  // Handle click on Add New button
  const handleNew = () => {
    setResources({ ...newApResources });
    setPopupOpen(true); // open Add/Edit pop up
  };
  // Handle save resource
  const handleSave = () => {
    setPopupOpen(false); // close pop up
    saveResources(resources)
      .unwrap()
      .then(() => {
        // display success message
        dispatch(notify({ msg: 'The Resource has been saved successfully', sev: 'success' }));
      })
      .catch(() => {
        // display error message
        dispatch(notify({ msg: 'Failed to save this Resource', sev: 'error' }));
      });
  };

  // Handle deactivate Resource
  const handleDeactiveResource = () => {
    setOpenConfirmDeleteUserModal(false); // close confirm delete modal
    deactiveResource(resources)
      .unwrap()
      .then(() => {
        refetchResources();
        setResources(newApResources);
        // display success message
        dispatch(
          notify({
            msg: 'The Resource was successfully ' + stateOfDeleteUserModal,
            sev: 'success'
          })
        );
      })
      .catch(() => {
        // display error message
        dispatch(
          notify({
            msg: 'Failed to ' + stateOfDeleteUserModal + ' this Resource',
            sev: 'error'
          })
        );
      });
  };
  //handle Reactivate
  const handleReactiveResource = () => {
    setOpenConfirmDeleteUserModal(false);
    const updatedResource = { ...resources, deletedAt: null };
    saveResources(updatedResource)
      .unwrap()
      .then(() => {
        // display success message
        dispatch(notify({ msg: 'The Resource has been activated successfully', sev: 'success' }));
      })
      .catch(() => {
        // display error message
        dispatch(notify({ msg: 'Failed to activated  this Resource', sev: 'error' }));
      });
  };

  // handle change filter
  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'containsIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };

  //Table columns
  const tableColumns = [
    {
      key: 'resourceTypeLkey',
      title: <Translate>Resource Type</Translate>,
      flexGrow: 4,
      render: rowData =>
        rowData.resourceTypeLvalue
          ? rowData.resourceTypeLvalue.lovDisplayVale
          : rowData.resourceTypeLkey
    },
    {
      key: 'resourceName',
      title: <Translate>Resource Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 4,
      render: rowData => (!rowData.deletedAt ? 'Active' : 'InActive')
    },
    {
      key: 'createdAt',
      title: <Translate>Creation Date</Translate>,
      flexGrow: 4,
      render: rowData => (rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : '')
    },
    {
      key: 'createdBy',
      title: <Translate>Created By</Translate>,
      flexGrow: 4
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];
  // Filter table
  const filters = () => (
    <Form layout="inline" fluid>
      <MyInput
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
  // Icons column (Edite, reactive/Deactivate)
  const iconsForActions = (rowData: ApResources) => (
    <div className="container-of-icons">
      {/* display availability time when click on this icon */}
      <IoSettingsSharp
        className="icons-style"
        title="Availability Time"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setOpenAvailabilityTimePopup(true);
          setSelectedResources(rowData);
        }}
      />
      {/* open edit resource when click on this icon */}
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setPopupOpen(true)}
      />
      {/* deactivate/activate  when click on one of these icon */}
      {!rowData?.deletedAt ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteUserModal('deactivate');
            setOpenConfirmDeleteUserModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteUserModal('reactivate');
            setOpenConfirmDeleteUserModal(true);
          }}
        />
      )}
    </div>
  );
 
  return (
    <Panel>

      <MyTable
        height={450}
        data={resourcesListResponse?.object ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setSelectedResources(rowData);
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
        tableButtons={<div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={handleNew}
          width="109px"
        >
          Add New
        </MyButton>
      </div>}
      />
      {/* <AvailabilityTimeModal
        open={openAvailabilityTimePopup}
        setOpen={setOpenAvailabilityTimePopup}
        resource={resources}
      /> */}
      <NewAvailabilityTimeModal
        open={openAvailabilityTimePopup}
        setOpen={setOpenAvailabilityTimePopup}
        selectedResource={resourceAvailabilityDetails}
      />
      <AddEditResources
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        resources={resources}
        setResources={setResources}
        handleSave={handleSave}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteUserModal}
        setOpen={setOpenConfirmDeleteUserModal}
        itemToDelete="Resource"
        actionButtonFunction={stateOfDeleteUserModal == 'deactivate' ? handleDeactiveResource : handleReactiveResource}
        actionType={stateOfDeleteUserModal}
      />
    </Panel>
  );
};

export default Resources;
