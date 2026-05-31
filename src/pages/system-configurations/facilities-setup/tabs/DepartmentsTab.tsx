import React, { useEffect, useState, useMemo } from 'react';
import { Form } from 'rsuite';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import MyModal from '@/components/MyModal/MyModal';
import PolicyAssignmentManager from '@/components/PolicyAssignment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSheetPlastic, faRotateRight, faUserNurse, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { Facility } from '@/types/model-types-new';
import { Department } from '@/types/model-types-new';
import { newDepartment } from '@/types/model-types-constructor-new';
import {
  useAddDepartmentMutation,
  useGetDepartmentsQuery,
  useLazyGetDepartmentByFacilityQuery,
  useLazyGetDepartmentByNameQuery,
  useLazyGetDepartmentByTypeQuery,
  useToggleDepartmentIsActiveMutation,
  useUpdateDepartmentMutation,
} from '@/services/security/departmentService';
import { MedicalSheets } from '@/config/modules-config';
import { useBulkSaveMedicalSheetsMutation, useBulkSaveNurseMedicalSheetsMutation } from '@/services/MedicalSheetsService';
import { useEnumOptions } from '@/services/enumsApi';
import { conjureValueBasedOnIDFromList, formatEnumString } from '@/utils';
import { PaginationPerPage } from '@/utils/paginationPerPage';
import ChooseScreen from '@/pages/setup/departments-setup/ChooseScreen';
import ChooseScreenNurse from '@/pages/setup/departments-setup/ChooseScreenNurse';
import AddEditDepartmentInline from './AddEditDepartmentInline';
import { MdHomeRepairService } from "react-icons/md";
import AddServiceToDepartment from './AddServiceToDepartment';

interface DepartmentsTabProps {
  facility: Facility;
  width: number;
}

const generateFiveDigitCode = (): string => {
  return String(Math.floor(10000 + Math.random() * 90000));
};

const DepartmentsTab: React.FC<DepartmentsTabProps> = ({ facility, width }) => {
  const dispatch = useAppDispatch();
  const facilityId = facility?.id;

  const extractApiErrorMessage = (err: any) => {
    const status = err?.status ?? err?.originalStatus ?? err?.error?.status;
    const data = err?.data ?? err?.error?.data;

    let detail = '';
    if (typeof data === 'string') detail = data;
    else if (data && typeof data === 'object') {
      detail =
        (data as any)?.message ||
        (data as any)?.detail ||
        (data as any)?.title ||
        JSON.stringify(data);
    }

    const fallback = err?.error || err?.message || 'Request failed';
    const core = detail || fallback;
    return status != null ? `(${status}) ${core}` : core;
  };

  const stripUndefined = (obj: any) =>
    Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));

  // State
  const [openConfirmDeleteDepartmentModal, setOpenConfirmDeleteDepartmentModal] = useState(false);
  const [stateOfDeleteDepartmentModal, setStateOfDeleteDepartmentModal] = useState('delete');
  const [department, setDepartment] = useState<Department>({ ...newDepartment });
  const [load, setLoad] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [showScreen, setShowScreen] = useState({});
  const [showNurseScreen, setShowNurseScreen] = useState({});
  const [showService, setShowService] = useState({});
  const [openScreensPopup, setOpenScreensPopup] = useState(false);
  const [openScreensNursePopup, setOpenScreensNursePopup] = useState(false);
  const [openAddServicePopup, setOpenAddServicePopup] = useState(false);
  const [openPolicyAssignmentModal, setOpenPolicyAssignmentModal] = useState(false);
  const [selectedDepartmentForPolicyAssignment, setSelectedDepartmentForPolicyAssignment] =
    useState<Department | null>(null);
  const [recordOfDepartmentCode, setRecordOfDepartmentCode] = useState({ departmentCode: '' });
  const [nextDepartmentCode, setNextDepartmentCode] = useState<string>(generateFiveDigitCode());
  const [record, setRecord] = useState({ filter: '', value: '' });
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [isFiltered, setIsFiltered] = useState(false);
  const [addDefaultMedicalSheets, setAddDefaultMedicalSheets] = useState(false);
  const [addDefaultNurseMedicalSheets, setAddDefaultNurseMedicalSheets] = useState(false);
  const [linksState, setLinksState] = useState<{
    next?: string | null;
    prev?: string | null;
    first?: string | null;
    last?: string | null;
  }>({});
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
  });

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now(),
  });

  // Lazy queries for filtering
  const [getDepartmentsByFacility, { data: departmentListResponse, isFetching }] =
    useLazyGetDepartmentByFacilityQuery();
  const [getDepartmentsByType] = useLazyGetDepartmentByTypeQuery();
  const [getDepartmentsByName] = useLazyGetDepartmentByNameQuery();

  // Load departments when facility changes
  useEffect(() => {
    if (facilityId) {
      getDepartmentsByFacility({
        facilityId: facilityId,
        page: paginationParams.page,
        size: paginationParams.size,
        sort: paginationParams.sort,
      });
    }
  }, [facilityId, paginationParams.page, paginationParams.size, paginationParams.sort, paginationParams.timestamp]);

  const refetchDepartments = () => {
    if (facilityId) {
      getDepartmentsByFacility({
        facilityId: facilityId,
        page: paginationParams.page,
        size: paginationParams.size,
        sort: paginationParams.sort,
      });
    }
  };

  const totaldepartmentListResponseCount = departmentListResponse?.totalCount ?? 0;
  const links = departmentListResponse?.links || {};
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  // Mutations
  const [addDepartment, addDepartmentMutation] = useAddDepartmentMutation();
  const [updateDepartment, updateDepartmentMutation] = useUpdateDepartmentMutation();
  const [toggleDepartmentIsActive] = useToggleDepartmentIsActiveMutation();
  const [bulkSaveMedicalSheets] = useBulkSaveMedicalSheetsMutation();
  const [bulkSaveNurseMedicalSheets] = useBulkSaveNurseMedicalSheetsMutation();
  // Enums
  const depTypeOptions = useEnumOptions('DepartmentType');
  const encTypesEnum = useEnumOptions('EncounterType');
  const DayOfWeek = useEnumOptions('DayOfWeek');

  const filterFields = [
    { label: 'Department Name', value: 'name' },
    { label: 'Department Type', value: 'departmentType' },
  ];

  const buildWorkingDaysPayload = (workingDays: Department['workingDays']) => {
    if (!DayOfWeek || DayOfWeek.length === 0) return workingDays ?? [];

    const workingDaysMap: Record<string, boolean> = {};
    DayOfWeek.forEach(day => {
      workingDaysMap[day.value] = false;
    });

    (workingDays ?? []).forEach(day => {
      if (day?.dayOfWeek) {
        workingDaysMap[day.dayOfWeek] = day.isWorking !== false;
      }
    });

    return DayOfWeek.map(day => ({
      dayOfWeek: day.value,
      isWorking: !!workingDaysMap[day.value],
    }));
  };

  // Effects
  useEffect(() => {
    if (departmentListResponse?.links) {
      setLinksState(departmentListResponse.links);
    }
  }, [departmentListResponse?.links]);

  useEffect(() => {
    setRecordOfDepartmentCode({
      departmentCode: department?.departmentCode ?? '',
    });
  }, [department?.departmentCode]);


  // Handlers
  const handleNew = () => {
    setDepartment({ ...newDepartment, departmentCode: nextDepartmentCode, facilityId: facilityId! });
    setRecordOfDepartmentCode({ departmentCode: nextDepartmentCode });
    setOpenForm(true);
  };

  const validateRequiredFields = () => {
    const missingFields: string[] = [];
    if (!department?.name?.trim()) {
      missingFields.push('Department Name is required');
    }
    if (!department?.departmentType) {
      missingFields.push('Department Type is required');
    }

    const isEmpty = (val) => val === null || val === undefined || val === '';
    const isNotEmpty = (val) => val !== null && val !== undefined && val !== '';
    if (
      department?.parallelCapacityValue === null ||
      department?.parallelCapacityValue === undefined ||
      department?.parallelCapacityValue < 1
    ) {
      missingFields.push(
        'Field Parallel Capacity Value is required and should be greater than or equal to 1'
      );
    }
    if (department?.appointable) {
      if (isEmpty(department?.defaultDurationMinutes) || department?.defaultDurationMinutes <= 0) {
        missingFields.push('Field Default Duration Minutes is required and should be greater than 0')
      }
      if (isEmpty(department?.defaultBufferBeforeMinutes) || department?.defaultBufferBeforeMinutes < 0) {
        missingFields.push('Field Default Buffer Before Minutes is required and should be greater then or equal 0')
      }
      if (isEmpty(department?.defaultBufferAfterMinutes) || department?.defaultBufferAfterMinutes < 0) {
        missingFields.push('Field Default Buffer After Minutes is required and should be greater then or equal 0')
      }
    }
    else {
      if (isNotEmpty(department?.defaultDurationMinutes) && department?.defaultDurationMinutes <= 0) {
        missingFields.push('Field Default Duration Minutes should be greater than 0')
      }
      if (isNotEmpty(department?.defaultBufferBeforeMinutes) && department?.defaultBufferBeforeMinutes < 0) {
        missingFields.push('Field Default Buffer Before Minutes should be greater then or equal 0')
      }
      if (isNotEmpty(department?.defaultBufferAfterMinutes) && department?.defaultBufferAfterMinutes < 0) {
        missingFields.push('Field Default Buffer After Minutes should be greater then or equal 0')
      }
    }

    if (department?.appointable && !department.encounterType) {
      missingFields.push('Encounter Type is required for appointable department');
    }
    if (missingFields.length) {
      dispatch(
        notify({
          msg: missingFields.map(e => `• ${e}`).join('\n'),
          sev: 'warning'
        })
      );
      return false;
    }
    return true;
  };

  const handleAdd = () => {
  if (!validateRequiredFields()) {
    return;
  }

  if (!facilityId) {
    dispatch(notify({ msg: 'Facility is required to add a department', sev: 'warning' }));
    return;
  }

  setOpenForm(false);
  setLoad(true);

  const payload = stripUndefined({
    facilityId: Number(facilityId),
    name: (department?.name ?? '').trim(),
    departmentType: department?.departmentType,
    departmentCode: department?.departmentCode,
    appointable: Boolean(department?.appointable),
    encounterType: department?.encounterType || undefined,
    phoneNumber: department?.phoneNumber || undefined,
    email: department?.email || undefined,
    isActive: department?.isActive ?? true,
    hasMedicalSheets: Boolean(department?.hasMedicalSheets),
    hasNurseMedicalSheets: Boolean(department?.hasNurseMedicalSheets),
    parallelCapacityValue: department.parallelCapacityValue ?? 1,
    defaultDurationMinutes: department?.defaultDurationMinutes,
    defaultBufferBeforeMinutes: department?.defaultBufferBeforeMinutes ?? 0,
    defaultBufferAfterMinutes: department?.defaultBufferAfterMinutes ?? 0,
    parallelCapacityEnabled: department?.parallelCapacityEnabled,
    requirePractitioner: department?.requirePractitioner,
    requireBilling: department?.requireBilling,
    requirePreAssessment: department?.requirePreAssessment,
    workingDays: buildWorkingDaysPayload(department?.workingDays),
  });

  addDepartment(payload)
    .unwrap()
    .then(async (addedDepartment) => {
      dispatch(notify({ msg: 'Department added successfully', sev: 'success' }));

      const departmentId = addedDepartment?.id ?? addedDepartment?.data?.id;

      if (addDefaultMedicalSheets && departmentId) {
        const defaultSheetsPayload = MedicalSheets
          .filter(sheet => sheet.isDefaultMedicalSheet)
          .map(sheet => ({
            departmentId: departmentId,
            medicalSheet: sheet.code.toUpperCase(),
          }));

        if (defaultSheetsPayload.length) {
          await bulkSaveMedicalSheets(defaultSheetsPayload).unwrap();
        }
      }
      if (addDefaultNurseMedicalSheets && departmentId) {
        const defaultNurseSheetsPayload = MedicalSheets .filter(sheet => sheet.isDefaultNurseMedicalSheet)
          .map(sheet => ({
            departmentId: departmentId,
            medicalSheet: sheet.code.toUpperCase(),
          }));
        if (defaultNurseSheetsPayload.length) {
          await bulkSaveNurseMedicalSheets(defaultNurseSheetsPayload).unwrap();
        }
      }

      const newCode = generateFiveDigitCode();
      setNextDepartmentCode(newCode);
      setAddDefaultMedicalSheets(false);
      setAddDefaultNurseMedicalSheets(false);
      refetchDepartments();
    })
    .catch((err: any) => {
      const msg = extractApiErrorMessage(err);
      console.error('addDepartment failed:', { payload, err });
      dispatch(notify({ msg, sev: 'error' }));
    })
    .finally(() => setLoad(false));
};

 const handleUpdate = () => {
  if (!validateRequiredFields()) {
    return;
  }

  setOpenForm(false);
  setLoad(true);

  updateDepartment({
    ...department,
    encounterType: department?.encounterType || undefined,
    workingDays: buildWorkingDaysPayload(department?.workingDays),
  })
    .unwrap()
    .then(async () => {
      const departmentId = department?.id;

      if (addDefaultMedicalSheets && departmentId) {
        const defaultSheetsPayload = MedicalSheets
          .filter(sheet => sheet.isDefaultMedicalSheet)
          .map(sheet => ({
            departmentId,
            medicalSheet: sheet.code.toUpperCase(),
          }));

        if (defaultSheetsPayload.length) {
          await bulkSaveMedicalSheets(defaultSheetsPayload).unwrap();
        }
      }

      if (addDefaultNurseMedicalSheets && departmentId) {
        const defaultNurseSheetsPayload = MedicalSheets
          .filter(sheet => sheet.isDefaultNurseMedicalSheet)
          .map(sheet => ({
            departmentId,
            medicalSheet: sheet.code.toUpperCase(),
          }));

        if (defaultNurseSheetsPayload.length) {
          await bulkSaveNurseMedicalSheets(defaultNurseSheetsPayload).unwrap();
        }
      }

      dispatch(notify({ msg: 'Department updated successfully', sev: 'success' }));

      setAddDefaultMedicalSheets(false);
      setAddDefaultNurseMedicalSheets(false);
      refetchDepartments();
    })
    .catch((err: any) => {
      const msg = extractApiErrorMessage(err);
      dispatch(notify({ msg, sev: 'error' }));
    })
    .finally(() => setLoad(false));
};
  const handleFilterChange = async (fieldName, value, page = 0, size = filterPagination.size) => {
    if (!value) {
      setDepartmentList(departmentListResponse?.data ?? []);
      setIsFiltered(false);
      setFilteredTotal(0);
      setFilterPagination(prev => ({ ...prev, page: 0 }));
      setLinksState(links ?? {});
      return;
    }
    try {
      let response;
      if (fieldName === 'departmentType') {
        const result = await getDepartmentsByType({
          type: value?.toUpperCase().replace(/\s+/g, '_'),
          page,
          size,
          sort: filterPagination.sort,
        }).unwrap();
        // Filter by facility after getting results
        const filtered = result.data?.filter((dept: Department) => dept.facilityId === facilityId) ?? [];
        setDepartmentList(filtered);
        setFilteredTotal(filtered.length);
        setIsFiltered(true);
        setFilterPagination(prev => ({ ...prev, page, size }));
        setLinksState(result?.links ?? {});
      } else if (fieldName === 'name') {
        const result = await getDepartmentsByName({
          name: value,
          page,
          size,
          sort: filterPagination.sort,
        }).unwrap();
        // Filter by facility after getting results
        const filtered = result.data?.filter((dept: Department) => dept.facilityId === facilityId) ?? [];
        setDepartmentList(filtered);
        setFilteredTotal(filtered.length);
        setIsFiltered(true);
        setFilterPagination(prev => ({ ...prev, page, size }));
        setLinksState(result?.links ?? {});
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartmentList([]);
      setIsFiltered(false);
    }
  };

  const handleToggleActive = (id: number) => {
    toggleDepartmentIsActive(id)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Department status updated successfully', sev: 'success' }));
        setPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));
        refetchDepartments();
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to update department status', sev: 'error' }));
      });
  };

  const handleDeactiveReactivateDepartment = () => {
    handleToggleActive(department.id);
    setOpenConfirmDeleteDepartmentModal(false);
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    if (isFiltered) {
      handleFilterChange(record.filter, record.value, newPage);
    } else {
      PaginationPerPage.handlePageChange(event, newPage, paginationParams, linksState, setPaginationParams);
    }
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    if (isFiltered) {
      setFilterPagination(prev => ({ ...prev, size: newSize, page: 0 }));
      handleFilterChange(record.filter, record.value, 0, newSize);
    } else {
      setPaginationParams({
        ...paginationParams,
        size: newSize,
        page: 0,
        timestamp: Date.now(),
      });
    }
  };

  const isSelected = (rowData: Department) => (rowData?.id === department?.id ? 'selected-row' : '');

  const iconsForActions = (rowData: Department) => (
    <div className="container-of-icons">
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setDepartment(rowData);
          setOpenForm(true);
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

      {rowData.hasMedicalSheets && (
        <FontAwesomeIcon
          icon={faSheetPlastic}
          title="Medical Sheets"
          size="lg"
          style={{ color: 'var(--primary-gray)' }}
          onClick={() => {
            setDepartment(rowData);
            setOpenScreensPopup(true);
          }}
        />
      )}
      {rowData.hasNurseMedicalSheets && (
        <FontAwesomeIcon
          icon={faUserNurse}
          title="Medical Sheets Nurse"
          size="lg"
          style={{ color: 'var(--primary-gray)' }}
          onClick={() => {
            setDepartment(rowData);
            setOpenScreensNursePopup(true);
          }}
        />
      )}
      <MdHomeRepairService
        title="Services"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setDepartment(rowData);
          setOpenAddServicePopup(true);
        }}
      />
      <FontAwesomeIcon
        icon={faClipboardList}
        title="Policy Assignment"
        className="icons-style"
        style={{ color: 'var(--deep-blue)', cursor: 'pointer' }}
        size="lg"
        onClick={() => {
          setSelectedDepartmentForPolicyAssignment(rowData);
          setOpenPolicyAssignmentModal(true);
        }}
      />
    </div>
  );

  const tableColumns = [
    {
      key: 'departmentType',
      title: <Translate key="DEPARTMENT_TYPE">Department Type</Translate>,
      flexGrow: 4,
      render: (rowData: Department) => <p>{formatEnumString(rowData?.departmentType)}</p>,
    },
    {
      key: 'name',
      title: <Translate key="DEPARTMENT_NAME">Department Name</Translate>,
      flexGrow: 4,
    },
    {
      key: 'phoneNumber',
      title: <Translate key="PHONE_NUMBER">Phone Number</Translate>,
      flexGrow: 4,
    },
    {
      key: 'email',
      title: <Translate key="EMAIL">Email</Translate>,
      flexGrow: 4,
    },
    {
      key: 'departmentCode',
      title: <Translate key="DEPARTMENT_CODE">Department Code</Translate>,
      flexGrow: 1,
    },
    {
      key: 'appointable',
      title: <Translate key="APPOINTABLE">Appointable</Translate>,
      render: (rowData: Department) => <p>{rowData?.appointable ? 'Yes' : 'No'}</p>,
    },
    {
      key: 'encounterType',
      title: <Translate key="ENCOUNTER_TYPE">Encounter Type</Translate>,
      flexGrow: 4,
      render: (rowData: Department) => <p>{formatEnumString(rowData?.encounterType)}</p>,
    },
    {
      key: 'isActive',
      title: <Translate key="STATUS">Status</Translate>,
      flexGrow: 4,
      render: (rowData: Department) => <p>{rowData?.isActive ? 'Active' : 'Inactive'}</p>,
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 4,
      render: (rowData: Department) => iconsForActions(rowData),
    },
  ];

  const filters = () => {
    const selectedFilter = record.filter;
    let dynamicInput;

    if (selectedFilter === 'departmentType') {
      dynamicInput = (
        <MyInput
          width={170}
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
          width={170}
          fieldName="value"
          fieldLabel=""
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
              value: '',
            });
          }}
          showLabel={false}
          placeholder="Select Filter"
          searchable={false}
          width={180}
        />
        {dynamicInput}
        <MyButton
          color="var(--deep-blue)"
          onClick={() => {
            handleFilterChange(record.filter, record.value);
          }}
          width="80px"
        >
          Search
        </MyButton>
      </Form>
    );
  };

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
      {/* Inline Form for Add/Edit */}
      {openForm && (
        <AddEditDepartmentInline
          width={width}
          department={department}
          setDepartment={setDepartment}
          recordOfDepartmentCode={recordOfDepartmentCode}
          setRecordOfDepartmentCode={setRecordOfDepartmentCode}
          depTypeOptions={depTypeOptions ?? []}
          encTypesEnum={encTypesEnum ?? []}
          addDefaultMedicalSheets={addDefaultMedicalSheets}
          setAddDefaultMedicalSheets={setAddDefaultMedicalSheets}
          addDefaultNurseMedicalSheets={addDefaultNurseMedicalSheets}
          setAddDefaultNurseMedicalSheets={setAddDefaultNurseMedicalSheets}
          onSave={department?.id ? handleUpdate : handleAdd}
          onCancel={() => {
            setOpenForm(false);
            setDepartment({ ...newDepartment });
            setAddDefaultMedicalSheets(false);
            setAddDefaultNurseMedicalSheets(false);
          }}
        />
      )}

      {/* Add New Button */}
      {!openForm && (
        <div className="container-of-add-new-button" style={{ marginBottom: '20px' }}>
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={handleNew}
            width="150px"
            disabled={!facilityId}
          >
            New Department
          </MyButton>
        </div>
      )}

      {/* Table */}
      <MyTable
        data={isFiltered ? departmentList ?? [] : departmentListResponse?.data ?? []}
        totalCount={isFiltered ? filteredTotal : totaldepartmentListResponseCount}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => setDepartment(rowData)}
        filters={filters()}
        page={isFiltered ? filterPagination.page : pageIndex}
        rowsPerPage={isFiltered ? filterPagination.size : rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        loading={load || isFetching}
      />

      {/* Modals */}
      <ChooseScreen
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
      <AddServiceToDepartment
        open={openAddServicePopup}
        setOpen={setOpenAddServicePopup}
        width={width}
        department={department}
        showScreen={showService}
        setShowScreen={setShowService}
      />
      <MyModal
        open={openPolicyAssignmentModal}
        setOpen={setOpenPolicyAssignmentModal}
        title="Department Policy Assignment"
        bodyheight="70vh"
        size="70vw"
        hideBack
        hideActionBtn
        content={
          selectedDepartmentForPolicyAssignment ? (
            <PolicyAssignmentManager
              resourceType="DEPARTMENT"
              resourceId={selectedDepartmentForPolicyAssignment.id ?? 0}
              facilityId={facilityId ?? 0}
              showHeader={false}
            />
          ) : null
        }
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteDepartmentModal}
        setOpen={setOpenConfirmDeleteDepartmentModal}
        itemToDelete="Department"
        actionButtonFunction={handleDeactiveReactivateDepartment}
        actionType={stateOfDeleteDepartmentModal}
      />
    </div>
  );
};

export default DepartmentsTab;
