import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import { Panel, Form } from 'rsuite';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { faSheetPlastic, faRotateRight, faUserNurse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useGetMedicalSheetsByDepartmentIdQuery } from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { newApMedicalSheets } from '@/types/model-types-constructor';
import MyInput from '@/components/MyInput';
import { conjureValueBasedOnIDFromList, formatEnumString } from '@/utils';
import { useDispatch } from 'react-redux';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import './styles.less';
import MyButton from '@/components/MyButton/MyButton';
import AddEditDepartment from './AddEditDepartment';
import ChooseDepartment from './ChooseScreen';
import { notify } from '@/utils/uiReducerActions';
import { Department } from '@/types/model-types-new';
import { newDepartment } from '@/types/model-types-constructor-new';
import { useAddDepartmentMutation, useGetDepartmentsQuery, useLazyGetDepartmentByFacilityQuery, useLazyGetDepartmentByNameQuery, useLazyGetDepartmentByTypeQuery, useToggleDepartmentIsActiveMutation, useUpdateDepartmentMutation } from '@/services/security/departmentService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useEnumByName, useEnumOptions } from '@/services/enumsApi';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import ChooseScreenNurse from './ChooseScreenNurse';
import { extractPaginationFromLink } from "@/utils/paginationHelper";


const Departments = () => {
  const dispatch = useDispatch();
  const [openConfirmDeleteDepartmentModal, setOpenConfirmDeleteDepartmentModal] = useState(false);
  const [stateOfDeleteDepartmentModal, setStateOfDeleteDepartmentModal] = useState('delete');
  const [department, setDepartment] = useState<Department>({ ...newDepartment });
  const [load, setLoad] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [showScreen, setShowScreen] = useState({});
  const [showNurseScreen, setShowNurseScreen] = useState({});
  const [openScreensPopup, setOpenScreensPopup] = useState(false);
  const [openScreensNursePopup,setOpenScreensNursePopup]=useState(false)
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [recordOfDepartmentCode, setRecordOfDepartmentCode] = useState({ departmentCode: '' });
  const [generateCode, setGenerateCode] = useState<string>('');
  const [record, setRecord] = useState({ filter: '', value: '' });
  const [getDepartmentsByFacility] = useLazyGetDepartmentByFacilityQuery();
  const [getDepartmentsByType] = useLazyGetDepartmentByTypeQuery();
  const [getDepartmentsByName] = useLazyGetDepartmentByNameQuery();
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [isFiltered, setIsFiltered] = useState(false);

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });


  // Data fetching
  const { data: departmentListResponse, isFetching } = useGetDepartmentsQuery(paginationParams);

  const totaldepartmentListResponseCount = departmentListResponse?.totalCount ?? 0;
  const links = departmentListResponse?.links || {};
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;
  // Add New Department

  const [addDepartment, addDepartmentMutation] = useAddDepartmentMutation();
  // Update Department 
  const [updateDepartment, updateDepartmentMutation] = useUpdateDepartmentMutation();

  const filterFields = [
    { label: 'Facility', value: 'facilityName' },
    { label: 'Department Name', value: 'name' },
    { label: 'Department Type', value: 'departmentType' }
  ];



  // Header setup
  useEffect(() => {
    const divContent = (
      <div className="page-title">
        <h5><Translate>Departments</Translate></h5>
      </div>
    );
    dispatch(setPageCode('Departments'));
    dispatch(setDivContent(divContent));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  useEffect(() => {
    console.log("ShowScreen", showScreen)
  }, [showScreen])
  

  // Update department code field when department or code changes
  useEffect(() => {
    setRecordOfDepartmentCode({
      departmentCode: department?.departmentCode ?? generateCode
    });
  }, [department?.departmentCode, generateCode]);

  // Refresh table on successful add/update 
  useEffect(() => {
    if (addDepartmentMutation.data) {
      setPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));

    }
  }, [addDepartmentMutation.data]);

  useEffect(() => {
    if (updateDepartmentMutation.data) {
      setPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));

    }
  }, [updateDepartmentMutation.data]);


  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
  const [facilitiesList, setFacilitiesList] = useState<{ label: string; value: string }[]>([]);
  useEffect(() => {
    if (facilityListResponse?.length) {
      const facilityOptions = facilityListResponse.map(facility => ({
        label: facility.name,
        value: facility.id
      }));
      setFacilitiesList(facilityOptions);
    }
  }, [facilityListResponse]);
  // Fetch DepartmentType enum from the new enum API
  const depTypeOptions = useEnumOptions("DepartmentType");
  // Handle new department creation
  const handleNew = () => {
    const code = generateFiveDigitCode();
    setGenerateCode(code);
    setDepartment({ ...newDepartment, departmentCode: code });
    setPopupOpen(true);
  };
  // add department
  const handleAdd = () => {
    setPopupOpen(false);
    setLoad(true);
    addDepartment(department)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Department added successfully', sev: 'success' }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to add department', sev: 'error' }));
      })
      .finally(() => setLoad(false));
  };
  // update department
  const handleUpdate = () => {
    setPopupOpen(false);
    setLoad(true);
    updateDepartment(department)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Department updated successfully', sev: 'success' }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to update department', sev: 'error' }));
      })
      .finally(() => setLoad(false));
  };

  const handleFilterChange = async (fieldName, value) => {
    if (!value) {
      setDepartmentList(departmentListResponse?.data ?? []);
      setIsFiltered(false);
      setFilteredTotal(0);
      return;
    }
    try {
      let response;
      if (fieldName === "facilityName") {
        response = await getDepartmentsByFacility({
          facilityId: value,
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort
        }).unwrap();
      } else if (fieldName === "departmentType") {
        response = await getDepartmentsByType({
          type: value?.toUpperCase().replace(/\s+/g, '_'),
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort
        }).unwrap();
      } else if (fieldName === "name") {
        response = await getDepartmentsByName({
          name: value,
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort
        }).unwrap();
      }
      setDepartmentList(response?.data ?? []);
      setIsFiltered(true);
      setFilteredTotal(response?.totalCount ?? 0);

    } catch (error) {
      console.error("Error fetching departments:", error);
      setDepartmentList([]);
      setIsFiltered(false);
    }
  };
  const generateFiveDigitCode = (): string => {
    return String(Math.floor(10000 + Math.random() * 90000));
  };

  const isSelected = rowData => (rowData?.id === department?.id ? 'selected-row' : '');
  const [toggleDepartmentIsActive] = useToggleDepartmentIsActiveMutation();
  const handleToggleActive = (id: number) => {
    toggleDepartmentIsActive(id)
      .unwrap()
      .then(() => {
        dispatch(
          notify({
            msg: 'Department status updated successfully',
            sev: 'success'
          })
        );
        setPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Failed to update department status',
            sev: 'error'
          })
        );
      });
  };
  const iconsForActions = (rowData: Department) => (
    <div className="container-of-icons">
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setDepartment(rowData);
          setPopupOpen(true);
        }}
      />
      {!rowData?.isActive ? (
        <FontAwesomeIcon
          title="Activate"
          icon={faRotateRight}
          className="icons-style"
          color="var(--primary-gray)"
          onClick={() => {
            setDepartment(rowData);
            setStateOfDeleteDepartmentModal('reactivate');
            setOpenConfirmDeleteDepartmentModal(true);
          }}
        />
      ) : (
        <MdDelete
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          className="icons-style"
          onClick={() => {
            setDepartment(rowData);
            setStateOfDeleteDepartmentModal('deactivate');
            setOpenConfirmDeleteDepartmentModal(true);
          }}
        />
      )}
      <FontAwesomeIcon
        icon={faSheetPlastic}
        title="Medical Sheets"
        size="lg"
        style={{

          color: 'var(--primary-gray)'
        }}
        onClick={() => {
          
          setDepartment(rowData);
          setOpenScreensPopup(true);
        }}

      />
      <FontAwesomeIcon icon={faUserNurse}
       title="Medical Sheets Nurse"
        size="lg"
        style={{
          color: 'var(--primary-gray)'
        }}
        onClick={() => {
          
          setDepartment(rowData);
         
          setOpenScreensNursePopup(true);
        }}
      />
    </div>
  );
  const tableColumns = [
    {
      key: 'facilityId',
      title: <Translate key="FACILITY_NAME">Facility Name</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {conjureValueBasedOnIDFromList(
            facilityListResponse ?? [],
            rowData.facilityId,
            'name'
          )}
        </span>
      )
    },
    {
      key: 'departmentType',
      title: <Translate key="DEPARTMENT_TYPE">Department Type</Translate>,
      flexGrow: 4,
      render: rowData => <p>{formatEnumString(rowData?.departmentType)}</p>
    },
    {
      key: 'name',
      title: <Translate key="DEPARTMENT_NAME">Department Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'phoneNumber',
      title: <Translate key="PHONE_NUMBER">Phone Number</Translate>,
      flexGrow: 4
    },
    {
      key: 'email',
      title: <Translate keY="EMAIL">Email</Translate>,
      flexGrow: 4
    },
    {
      key: 'departmentCode',
      title: <Translate key="DEPARTMENT_CODE">Department Code</Translate>,
      flexGrow: 1
    },
    {
      key: 'appointable',
      title: <Translate key='APPOINTABLE'>Appointable</Translate>,
      render: rowData => <p>{rowData?.appointable ? 'Yes' : 'No'}</p>
    },
    {
      key: 'encounterType',
      title: <Translate key="ENCOUNTER_TYPE">Encounter Type</Translate>,
      flexGrow: 4,
      render: rowData => <p>{formatEnumString(rowData?.encounterType)}</p>
    },
    {
      key: 'isActive',
      title: <Translate key='STATUS'>Status</Translate>,
      flexGrow: 4,
      render: rowData => <p>{rowData?.isActive ? 'Active' : 'Inactive'}</p>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 4,
      render: rowData => iconsForActions(rowData)
    }
  ];
  const getFilterWidth = (filter: string): string => {
    switch (filter) {
      case 'facilityName':
        return '100px';
      case 'departmentType':
        return '200px';
      case 'name':
        return '170px';
      default:
        return '150px';
    }
  };

  const filters = () => {
    const selectedFilter = record.filter;

    let dynamicInput;

    if (selectedFilter === 'facilityName') {
      dynamicInput = (
        <MyInput
          width={250}
          fieldLabel=""
          fieldName="value"
          fieldType="select"
          selectData={facilityListResponse ?? []}
          selectDataLabel="name"
          selectDataValue="id"
          record={record}
          setRecord={setRecord}
        />

      );
    } else if (selectedFilter === 'departmentType') {
      dynamicInput = (
        <MyInput
          width={250}
          fieldName="value"
          fieldLabel=""
          fieldType="select"
          selectData={depTypeOptions ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={record}
          setRecord={setRecord}
        />
      );
    } else {
      dynamicInput = (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={record}
          setRecord={setRecord}
          showLabel={false}
          placeholder="Enter Value"
        />
      );
    }

    return (
      <Form layout="inline" fluid style={{ display: 'flex', gap: '10px' }}>
        <MyInput
          selectDataValue="value"
          selectDataLabel="label"
          selectData={filterFields}
          fieldName="filter"
          fieldType="select"
          record={record}
          setRecord={updatedRecord => {
            setRecord({
              filter: updatedRecord.filter,
              value: ''
            });
          }}
          showLabel={false}
          placeholder="Select Filter"
          searchable={false}
          width={getFilterWidth(record.filter)}
        />

        {dynamicInput}

        <MyButton
          color="var(--deep-blue)"
          onClick={() => {
            handleFilterChange(record.filter, record.value);
          }}
          width="80px"
        >
         <Translate key="SEARCH">Search</Translate>
        </MyButton>
      </Form>
    );
  };
  const handlePageChange = (_: unknown, newPage: number) => {
    let targetLink: string | null | undefined = null;

    if (newPage > paginationParams.page && links.next) targetLink = links.next;
    else if (newPage < paginationParams.page && links.prev)
      targetLink = links.prev;
    else if (newPage === 0 && links.first) targetLink = links.first;
    else if (newPage > paginationParams.page + 1 && links.last)
      targetLink = links.last;

    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setPaginationParams({
        ...paginationParams,
        page,
        size,
        timestamp: Date.now(),
      });
    }
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaginationParams({
      ...paginationParams,
      size: parseInt(event.target.value, 10),
      page: 0,
      timestamp: Date.now()
    });
  };
  const handleDeactiveReactivateDepartment = () => {
    handleToggleActive(department.id);
    setOpenConfirmDeleteDepartmentModal(false);
  };
  return (
    <Panel>
      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={handleNew}
          width="109px"
        >
         <Translate key="ADD_NEW">Add New</Translate>
        </MyButton>
      </div>
      <MyTable
        data={
          isFiltered
            ? departmentList ?? []
            : departmentListResponse?.data ?? []
        }
        totalCount={isFiltered ? filteredTotal : totaldepartmentListResponseCount}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => setDepartment(rowData)}
        filters={filters()}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        loading={load || isFetching}
      />

      <AddEditDepartment
        open={popupOpen}
        setOpen={setPopupOpen}
        department={department}
        setDepartment={setDepartment}
        recordOfDepartmentCode={recordOfDepartmentCode}
        setRecordOfDepartmentCode={setRecordOfDepartmentCode}
        width={width}
        handleAddNew={handleAdd}
        handleUpdate={handleUpdate}
      />
      <ChooseDepartment
        open={openScreensPopup}
        setOpen={setOpenScreensPopup}
        showScreen={showScreen}
        setShowScreen={setShowScreen}
        department={department}
        width={width}
      />
      <ChooseScreenNurse
      open={openScreensNursePopup}
        setOpen={setOpenScreensNursePopup}
        showScreen={showNurseScreen}
        setShowScreen={setShowNurseScreen}
        department={department}
        width={width}
       />
      <DeletionConfirmationModal
        open={openConfirmDeleteDepartmentModal}
        setOpen={setOpenConfirmDeleteDepartmentModal}
        itemToDelete="Department"
        actionButtonFunction={handleDeactiveReactivateDepartment}
        actionType={stateOfDeleteDepartmentModal}
      />
    </Panel>
  );
};
export default Departments;
