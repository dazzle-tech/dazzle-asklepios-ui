import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import {Pagination, Panel, Form } from 'rsuite';
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
import { ApFacility } from '@/types/model-types';
import { newApAddresses, newApFacility, newApDepartment } from '@/types/model-types-constructor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { FcDepartment } from 'react-icons/fc';
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
const Facilities = () => {

  const dispatch = useAppDispatch();
  const [facility, setFacility] = useState<ApFacility>({ ...newApFacility });
  const [address, setAddress] = useState<Address>({ ...newApAddresses });
  const [departments, setDepartments] = useState<Address>({ ...newApDepartment });
  const [popupOpen, setPopupOpen] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [facilityDepartmentPopupOpen, setFacilityDepartmentPopupOpen] = useState<boolean>(false);
  const [openConfirmDeleteModel, setOpenConfirmDeleteModel] = useState<boolean>(false);
  const [load, setLoad] = useState<boolean>(false);
  const [recordOfSearchForFacility, setRecordOfSearchForFacility] = useState({ facilityName: '' });
  // Initialize list request with default filters
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  // Fetch Facilities list response
  const { data: facilityListResponse, refetch: refetchFacility, isFetching} = useGetFacilitiesQuery(listRequest);
  // Save Facility
  const [saveFacility, saveFacilityMutation] = useSaveFacilityMutation();
  // Remove Facility
  const [removeFacility] = useRemoveFacilityMutation();

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
    <div className="title-facilities">
      <h5>Facilities</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Facilities'));
  dispatch(setDivContent(divContentHTML));

  // Handle click on Add New Button
  const handleNew = () => {
    setAddress(newApAddresses);
    setFacility(newApFacility);
    setDepartments(newApDepartment);
    setPopupOpen(true);
  };
  //icons column (View Departments, Add Details, Edite, Active/Deactivate)
  const iconsForActions = (rowData: ApFacility) => (
    <div className='container-of-icons-facilities'>
      <FcDepartment
        title="View Departments"
        size={24}
        onClick={() => {
          setFacility(rowData);
          setFacilityDepartmentPopupOpen(true);
        }}
      />
      <RiInformationFill
        title="Add Details"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setFacility(rowData);
        }}
      />
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setFacility(facility);
          setPopupOpen(true);
        }}
      />
      {rowData?.deletedAt ?
      // back to this function when update the filter(status) in back end 
      <FontAwesomeIcon title="Active" icon={faRotateRight} fill="var(--primary-gray)" onClick={handleActive}/>
      :
      <MdDelete
       title="Deactivate"
       size={24}
       fill="var(--primary-pink)"
       onClick={() => setOpenConfirmDeleteModel(true)}
       />
      }
    </div>
  );
  // Handle click on Save Facility button
  const handleSave = async () => {
    setPopupOpen(false);
    setLoad(true);
   await saveFacility({ ...facility, address }).unwrap().then(() => {
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
        dispatch(notify({ msg: 'Failed to delete this Facility', sev: 'error' }));
      });
      setLoad(false);
      setOpenConfirmDeleteModel(false);
  };
  // back to this function when update the filter in back end 
  // Handle Activation Facility
  const handleActive = async () => { 
    await saveFacility({ ...facility, deletedAt: null }).unwrap();
  };
  // ClassName for selected row
  const isSelected = rowData => {
    if (rowData && facility && rowData.key === facility.key) {
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
      key: 'facilityId',
      title: <Translate>ID</Translate>,
      flexGrow: 1,
      dataKey: 'facilityId'
    },
    {
      key: 'facilityName',
      title: <Translate>Facility Name</Translate>,
      flexGrow: 4,
      dataKey: 'facilityName'
    },
    {
      key: 'facilityRegistrationDate',
      title: <Translate>Registration Date</Translate>,
      flexGrow: 4,
      dataKey: 'facilityRegistrationDate'
    },
    {
      key: 'facilityEmailAddress',
      title: <Translate>Email Address</Translate>,
      flexGrow: 4,
      dataKey: 'facilityEmailAddress'
    },
    {
      key: 'deletedAt',
      title: <Translate>Status</Translate>,
      flexGrow: 4,
      render: (rowData: ApFacility) => {return(<p>{rowData?.deletedAt ? "Inactive" : "Active"}</p>)} 
    },
    {
      key: 'facilityBriefDesc',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: (rowData: ApFacility) => iconsForActions(rowData)
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
              data={facilityListResponse?.object ?? []}
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
            />
            <div className='container-of-pagination-facilities'>
              <Pagination
                prev
                next
                first={width > 500}
                last={width > 500}
                ellipsis={width > 500}
                boundaryLinks={width > 500}
                maxButtons={width < 500 ? 1 : 2}
                size="xs"
                layout={['limit', '|', 'pager']}
                limitOptions={[5, 15, 30]}
                limit={listRequest.pageSize}
                activePage={listRequest.pageNumber}
                onChangePage={pageNumber => {
                  setListRequest({ ...listRequest, pageNumber });
                }}
                onChangeLimit={pageSize => {
                  setListRequest({ ...listRequest, pageSize });
                }}
                total={facilityListResponse?.extraNumeric ?? 0}
              />
            </div> 
            <AddEditFacility 
              open={popupOpen}
              setOpen={setPopupOpen}
              facility={facility}
              setFacility={setFacility}
              address={address}
              setAddress={setAddress}
              handleSave = {handleSave}
              width={width}
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
