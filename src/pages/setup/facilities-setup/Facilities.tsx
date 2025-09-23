import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import {Panel, Form } from 'rsuite';
import { notify } from '@/utils/uiReducerActions';
import {
} from '@fortawesome/free-solid-svg-icons';
import {
  useGetFacilitiesQuery,
  useSaveFacilityMutation,
  useRemoveFacilityMutation
} from '@/services/setupService';
import { MdDelete } from 'react-icons/md';
import { MdModeEdit } from 'react-icons/md';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApAddresses, ApDepartment } from '@/types/model-types';
import { newApAddresses, newApDepartment } from '@/types/model-types-constructor';
import { FaUndo } from 'react-icons/fa';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { RiInformationFill } from 'react-icons/ri';
import { Address } from 'cluster';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import './styles.less';
import AddEditFacility from './AddEditFacility';
import FacilityDepartment from './FacilityDepartment';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { FaBuilding } from 'react-icons/fa';
import { CreateFacility, Facility } from '@/types/model-types-new';
import { newCreateFacility, newFacility } from '@/types/model-types-constructor-new';
import { useAddFacilityMutation, useDeleteFacilityMutation, useGetAllFacilitiesQuery, useUpdateFacilityMutation } from '@/services/security/facilityService';


import { FaKey } from 'react-icons/fa6';

import RoleManegment from '../role-managemen';

const Facilities = () => {

  const dispatch = useAppDispatch();
  const [facility, setFacility] = useState<Facility>({ ...newFacility });
  const [createFacility, setCreateFacility] = useState<CreateFacility>({ ...newCreateFacility });
  const [address, setAddress] = useState<ApAddresses>({ ...newApAddresses });
  const [departments, setDepartments] = useState<ApDepartment>({ ...newApDepartment });
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupOpenRole, setPopupOpenRole] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [facilityDepartmentPopupOpen, setFacilityDepartmentPopupOpen] = useState<boolean>(false);
  const [openConfirmDeleteModel, setOpenConfirmDeleteModel] = useState<boolean>(false);
  const [load, setLoad] = useState<boolean>(false);
  const [recordOfSearchForFacility, setRecordOfSearchForFacility] = useState({ name: '' });
  // Initialize list request with default filters
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  // Fetch Facilities list response
  const { data: facilityListResponse, refetch: refetchFacility, isFetching} = useGetAllFacilitiesQuery({});
  // Save Facility
  const [saveFacility, saveFacilityMutation] = useAddFacilityMutation();
    // Update Facility
  const [updateFacility, updateFacilityMutation] = useUpdateFacilityMutation();
  // Remove Facility
  const [removeFacility] = useDeleteFacilityMutation(); 
   // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = facilityListResponse?.extraNumeric ?? 0;

  // Effects
  useEffect(() => {
      const handleResize = () => setWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    useEffect(() => {
      if (saveFacilityMutation.data) {
        setListRequest({ ...listRequest, timestamp: new Date().getTime() });
      }
    }, [saveFacilityMutation.data]);
  
    useEffect(() => {
      handleFilterChange('facilityName', recordOfSearchForFacility['facilityName']);
    }, [recordOfSearchForFacility]);

    useEffect(() => {
      return () => {
        dispatch(setPageCode(''));
        dispatch(setDivContent('  '));
      };
    }, [location.pathname, dispatch]);
  
  // Page header setup
  const divContent = (
    <div className="page-title">
      <h5>Facilities</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Facilities'));
  dispatch(setDivContent(divContentHTML));

  // Handle click on Add New Button
  const handleNew = () => {
    setAddress(newApAddresses);
    setFacility(newFacility);
    setDepartments(newApDepartment);
    setPopupOpen(true);
  };
  //icons column (View Departments, Add Details, Edite, Active/Deactivate)
  const iconsForActions = (rowData: Facility) => (
    <div className='container-of-icons'>
      <FaBuilding
        title="View Departments"
        fill="var(--primary-gray)"
        size={24}
        onClick={() => {
          setFacility(rowData);
          setFacilityDepartmentPopupOpen(true);
        }}
        className='icons-style'
      />
      <FaKey
        title="Facility Roles"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setFacility(rowData);
          setPopupOpenRole(true);
        }}
        className='icons-style'
      />
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setFacility(facility);
          setPopupOpen(true);
        }}
        className='icons-style'
      />
      {rowData?.isActive ?
        <MdDelete
       title="Deactivate"
       size={24}
       fill="var(--primary-pink)"
       onClick={() => setOpenConfirmDeleteModel(true)}
       className='icons-style'
       />
       :
      // back to this function when update the filter(status) in back end
      <FaUndo
                className="icons-style"
                title="Activate"
                size={21}
                fill="var(--primary-gray)"
                onClick={handleActive}
              />
      
    
      }
    </div>
  );
  // Handle click on Save Facility button
  const handleSave = async () => {
    setPopupOpen(false);
    setLoad(true);
    console.log(facility);
   await saveFacility({ ...facility }).unwrap().then(() => {
    dispatch(notify({ msg: 'The Facility has been saved successfully', sev: 'success' }));
   }).catch(() => {
    dispatch(notify({ msg: 'Failed to save this Facility', sev: 'error' }));
   });
   setLoad(false);
  };
  // Handle remove Facility
  const handleRemove = async () => {
    setPopupOpen(false);
    setLoad(true);
   await removeFacility(facility)
      .unwrap()
      .then(() => {
        refetchFacility();
        dispatch(notify({ msg: 'The Facility was deactivated  successfully', sev: 'success' }));
      }).catch(() => {
        dispatch(notify({ msg: 'Failed to deactivated this Facility', sev: 'error' }));
      });
      setLoad(false);
      setOpenConfirmDeleteModel(false);
  };
  // back to this function when update the filter in back end 
  // Handle Activation Facility
  const handleActive = async () => {
    await saveFacility({ ...facility, isActive: true }).unwrap();
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
  // ClassName for selected row
  const isSelected = rowData => {
    if (rowData && facility && rowData.id === facility.id) {
      return 'selected-row';
    } else return '';
  };
  // Filter table by Facility Name
  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'startsWithIgnoreCase',
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
      key: 'id',
      title: <Translate>ID</Translate>,
      flexGrow: 1,
      dataKey: 'id'
    },
    {
      key: 'name',
      title: <Translate>Facility Name</Translate>,
      flexGrow: 4,
      dataKey: 'name'
    },
    {
      key: 'type',
      title: <Translate>Facility Type</Translate>,
      flexGrow: 4,
      dataKey: 'type'
    },
    {
      key: 'emailAddress',
      title: <Translate>Email Address</Translate>,
      flexGrow: 4,
      dataKey: 'emailAddress'
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 4,
      render: (rowData: Facility) => {return(<p>{rowData?.isActive ? "Active" : "Inactive"}</p>);} 
    },
    {
      key: 'actions',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: (rowData: Facility) => iconsForActions(rowData)
    }
  ];

  return (
    <div>
        <div>
          <Panel >
            <div className='container-of-header-actions-facility' >
              <Form layout='inline'>
                <MyInput
                  fieldName="facilityName"
                  fieldType="text"
                  record={recordOfSearchForFacility}
                  setRecord={setRecordOfSearchForFacility}
                  showLabel={false}
                  placeholder="Search by Facility Name"
                  width={'220px'}
                />
              </Form> 
                <MyButton
                  prefixIcon={() => <AddOutlineIcon />}
                  color="var(--deep-blue)"
                  width="109px"
                  height="32px"
                  onClick={handleNew}
                >
                  Add New
                </MyButton>        
            </div>
            <MyTable
              height={450}
              data={facilityListResponse ?? []}
              loading={isFetching || load}
              columns={tableColumns}
              rowClassName={isSelected}
              onRowClick={rowData => {
                setFacility(rowData);
                setAddress(rowData.address);
                setDepartments(rowData.department);
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
            />
            <AddEditFacility 
              open={popupOpen}
              setOpen={setPopupOpen}
              facility={createFacility}
              setFacility={setCreateFacility}
              address={address}
              setAddress={setAddress}
              handleSave = {handleSave}
              width={width}
            />
            <RoleManegment
              open={popupOpenRole}
              setOpen={setPopupOpenRole}
              facility={facility}
              setFacility={setFacility}

            />
            <FacilityDepartment
             open={facilityDepartmentPopupOpen}
             setOpen={setFacilityDepartmentPopupOpen}
             departments={departments}
             width={width}
            />
            <DeletionConfirmationModal 
             open={openConfirmDeleteModel}
             setOpen={setOpenConfirmDeleteModel}
             itemToDelete='Facility'
            actionButtonFunction={handleRemove}
            />          
          </Panel>
        </div>
    </div>
  );
};

export default Facilities;
