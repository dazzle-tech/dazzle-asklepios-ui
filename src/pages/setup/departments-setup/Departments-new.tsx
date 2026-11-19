import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { faSheetPlastic, faRotateRight, faUserNurse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useGetMedicalSheetsByDepartmentIdQuery } from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { newApMedicalSheets } from '@/types/model-types-constructor';
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
import { useAddDepartmentMutation, useGetDepartmentsQuery, useToggleDepartmentIsActiveMutation, useUpdateDepartmentMutation } from '@/services/security/departmentService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useEnumByName, useEnumOptions } from '@/services/enumsApi';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import ChooseScreenNurse from './ChooseScreenNurse';
import { has } from 'lodash';


const generateFiveDigitCode = (): string => {
  return String(Math.floor(10000 + Math.random() * 90000));
};

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
  const [nextDepartmentCode, setNextDepartmentCode] = useState<string>(generateFiveDigitCode());
  // Header filters: draft values typed in the inputs, applied on Enter / select change.
  // Everything is sent to one endpoint and combined with AND.
  const emptyHeaderFilters = { facilityId: '', type: '', name: '' };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });


  // Data fetching
  const { data: departmentListResponse, isFetching } = useGetDepartmentsQuery({
    ...paginationParams,
    ...appliedFilters,
    isActive: activeFilter
  });

  const totaldepartmentListResponseCount = departmentListResponse?.totalCount ?? 0;
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;
  // Add New Department

  const [addDepartment, addDepartmentMutation] = useAddDepartmentMutation();
  // Update Department 
  const [updateDepartment, updateDepartmentMutation] = useUpdateDepartmentMutation();




  // Header setup
  useEffect(() => {
    const divContent = (
      "Departments"
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

  

  // Update department code field when department or code changes
  useEffect(() => {
    setRecordOfDepartmentCode({
      departmentCode: department?.departmentCode ?? ''
    });
  }, [department?.departmentCode]);

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
    setDepartment({ ...newDepartment, departmentCode: nextDepartmentCode });
    setRecordOfDepartmentCode({ departmentCode: nextDepartmentCode });
    setPopupOpen(true);
  };
  const validateRequiredFields = () => {
    const missingFields: string[] = [];
    if (!department?.facilityId) {
      missingFields.push('Facility');
    }
    if (!department?.name?.trim()) {
      missingFields.push('Department Name');
    }
    if (!department?.departmentType) {
      missingFields.push('Department Type');
    }
    if (missingFields.length > 0) {
      const lines = missingFields.map(field => `• ${field}: is required`);
      dispatch(
        notify({
          msg: `Please fix the following fields:\n${lines.join('\n')}`,
          sev: 'warning'
        })
      );
      return false;
    }
    return true;
  };
  // add department
  const handleAdd = () => {
    if (!validateRequiredFields()) {
      return;
    }
    setPopupOpen(false);
    setLoad(true);
    addDepartment(department)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Department added successfully', sev: 'success' }));
        const newCode = generateFiveDigitCode();
        setNextDepartmentCode(newCode);
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to add department', sev: 'error' }));
      })
      .finally(() => setLoad(false));
  };
  // update department
  const handleUpdate = () => {
    if (!validateRequiredFields()) {
      return;
    }
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

      {rowData.hasMedicalSheets &&
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

      />}
      {rowData.hasNurseMedicalSheets&&
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
      />}
    </div>
  );
  // Applying one header filter also applies whatever is typed in the others
  const applyHeaderFilter = (field: HeaderFilterField, value: string) => {
    const next = { ...headerFilters, [field]: value };
    setHeaderFilters(next);
    setAppliedFilters(next);
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  };

  const headerSearch = (field: HeaderFilterField, placeholder?: string) => ({
    searchable: true,
    searchPlaceholder: placeholder,
    searchValue: headerFilters[field],
    onSearchChange: (value: string) => setHeaderFilters(prev => ({ ...prev, [field]: value })),
    onSearchSubmit: (value?: string) => applyHeaderFilter(field, value ?? headerFilters[field])
  });

  // Changing the status filter starts again from the first page
  useEffect(() => {
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  }, [statusFilter]);

  const tableColumns = [
    {
      key: 'facilityId',
      title: <Translate key="FACILITY_NAME">Facility Name</Translate>,
      width: 180,
      ...headerSearch('facilityId'),
      searchType: 'select' as const,
      searchOptions: [
        { label: 'All', value: '' },
        ...(facilityListResponse ?? []).map((f: any) => ({ label: f.name, value: String(f.id) }))
      ],
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
      width: 180,
      ...headerSearch('type'),
      searchType: 'select' as const,
      searchOptions: [{ label: 'All', value: '' }, ...(depTypeOptions ?? [])],
      render: rowData => <p>{formatEnumString(rowData?.departmentType)}</p>
    },
    {
      key: 'name',
      title: <Translate key="DEPARTMENT_NAME">Department Name</Translate>,
      width: 200,
      ...headerSearch('name', 'Search name')
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
      width: 120,
      searchable: true,
      searchType: 'select' as const,
      searchOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'All', value: 'all' }
      ],
      searchValue: statusFilter,
      onSearchChange: (value: string) => setStatusFilter(value as 'active' | 'inactive' | 'all'),
      render: rowData => <p>{rowData?.isActive ? 'Active' : 'Inactive'}</p>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 4,
      render: rowData => iconsForActions(rowData)
    }
  ];
  const handlePageChange = (event: unknown, newPage: number) => {
    setPaginationParams(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setPaginationParams(prev => ({ ...prev, size: newSize, page: 0, timestamp: Date.now() }));
  };
  const handleDeactiveReactivateDepartment = () => {
    handleToggleActive(department.id);
    setOpenConfirmDeleteDepartmentModal(false);
  };

  return (
    <Panel>

      <MyTable
        data={departmentListResponse?.data ?? []}
        totalCount={totaldepartmentListResponseCount}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => setDepartment(rowData)}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        loading={load || isFetching}
        tableButtons={<div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={handleNew}
          width="109px"
        >
         <Translate key="ADD_NEW">Add New</Translate>
        </MyButton>
      </div>}
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