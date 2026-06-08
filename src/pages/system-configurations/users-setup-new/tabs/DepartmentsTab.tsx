import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Form } from 'rsuite';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import MyInput from '@/components/MyInput';
import {
  useAddUserDepartmentMutation,
  useLazyGetUserDepartmentsByUserQuery,
  useDeleteUserDepartmentMutation,
  useUpdateUserDepartmentTogglesMutation,
} from '@/services/security/userDepartmentsService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetDepartmentsQuery, useLazyGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { UserDepartment, Department } from '@/types/model-types-new';
import { newUserDepartment } from '@/types/model-types-constructor-new';
import { ApUser } from '@/types/model-types-new';
import { conjureValueBasedOnIDFromList } from '@/utils';

interface DepartmentsTabProps {
  user: ApUser;
  width: number;
}

// Mode to distinguish add vs edit
type FormMode = 'add' | 'edit';

const DepartmentsTab: React.FC<DepartmentsTabProps> = ({ user, width }) => {
  const dispatch = useAppDispatch();
  const userId = user?.id;

  const { data: departmentListResponse } = useGetDepartmentsQuery({ page: 0, size: 10000 });
  const departmentList = useMemo<Department[]>(() => departmentListResponse?.data ?? [], [departmentListResponse]);

  const [getUserDepartmentsByUser, { data: userDepartmentsResponse }] =
    useLazyGetUserDepartmentsByUserQuery();

  const [userDepartment, setUserDepartment] = useState<UserDepartment>({
    ...newUserDepartment,
    isDefault: false,
  });

  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
  const facilities = Array.isArray(facilityListResponse) ? facilityListResponse : [];

  const [getDepartmentsByFacility, { data: departmentsResponse, isFetching: deptLoading }] =
    useLazyGetActiveDepartmentByFacilityListQuery();

  const [deleteUserDepartment] = useDeleteUserDepartmentMutation();
  const [updateToggles] = useUpdateUserDepartmentTogglesMutation(); 
  const [openConfirmDeleteDepartmentModal, setOpenConfirmDeleteDepartmentModal] =
    useState<boolean>(false);
  const [openForm, setOpenForm] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<FormMode>('add'); 

  const [saveDepartment] = useAddUserDepartmentMutation();

  const [pageIndex, setPageIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const isSelected = (rowData: any) =>
    rowData?.id === userDepartment?.id ? "selected-row" : "";

  useEffect(() => {
    if (userId) {
      getUserDepartmentsByUser(userId);
      setUserDepartment({
        ...newUserDepartment,
        userId,
        isDefault: false,
      });
    } else {
      setUserDepartment({
        ...newUserDepartment,
        isDefault: false,
      });
    }
  }, [userId, getUserDepartmentsByUser]);

  const refetchUserDepartments = useCallback(() => {
    if (userId) {
      getUserDepartmentsByUser(userId);
    }
  }, [userId, getUserDepartmentsByUser]);

  const onChangeFacility = async (next: string) => {
    const nextFacilityId = next;
    setUserDepartment(prev => ({
      ...prev,
      facilityId: nextFacilityId,
      departmentId: undefined,
      isDefault: false,
      appointmentBookingAllowed: false,
    }));
    if (nextFacilityId) {
      await getDepartmentsByFacility({ facilityId: nextFacilityId });
    }
  };

  //  Reset form to empty add mode
  const resetToAddMode = () => {
    setFormMode('add');
    setOpenForm(false);
    setUserDepartment({
      ...newUserDepartment,
      userId,
      isDefault: false,
    });
  };

  //  Handle save — branches on formMode
  const handleFacilityDepartmentSave = () => {
    if (formMode === 'edit') {
      handleTogglesSave();
    } else {
      handleAddSave();
    }
  };

  const handleAddSave = () => {
    if (!userDepartment?.facilityId || !userDepartment?.departmentId) {
      dispatch(notify({ msg: 'Please select both Facility and Department', sev: 'error' }));
      return;
    }

    const { facilityId, ...dataToSave } = userDepartment;

    saveDepartment(dataToSave)
      .unwrap()
      .then(() => {
        resetToAddMode();
        dispatch(notify({ msg: 'The Department has been saved successfully', sev: 'success' }));
        refetchUserDepartments();
      })
      .catch((err) => {
        let message =
          err?.data?.message ||
          err?.data?.detail ||
          err?.error ||
          'Something went wrong';

        if (typeof message === 'string' && message.startsWith('error.')) {
          message = message.replace('error.', '').replace(/\./g, ' ');
        }

        dispatch(notify({ msg: message, sev: 'error' }));
      });
  };

  //  Save only toggles in edit mode
  const handleTogglesSave = () => {
    if (!userDepartment?.id) return;

    updateToggles({
      id: userDepartment.id,
      isDefault: !!userDepartment.isDefault,
      appointmentBookingAllowed: !!userDepartment.appointmentBookingAllowed,
    })
      .unwrap()
      .then(() => {
        resetToAddMode();
        dispatch(notify({ msg: 'Department settings updated successfully', sev: 'success' }));
        refetchUserDepartments();
      })
      .catch((err) => {
        let message =
          err?.data?.message ||
          err?.data?.detail ||
          err?.error ||
          'Something went wrong';

        if (typeof message === 'string' && message.startsWith('error.')) {
          message = message.replace('error.', '').replace(/\./g, ' ');
        }

        dispatch(notify({ msg: message, sev: 'error' }));
      });
  };

  const handleDeleteUserDepartment = (UFD: any) => {
    deleteUserDepartment(UFD.id)
      .unwrap()
      .then(() => {
        setOpenConfirmDeleteDepartmentModal(false);
        dispatch(notify({ msg: 'The department was successfully deleted for this user', sev: 'success' }));
        refetchUserDepartments();
      })
      .catch(() => {
        setOpenConfirmDeleteDepartmentModal(false);
        dispatch(notify({ msg: 'Failed to delete department for this User', sev: 'error' }));
      });
  };

  const userDepartmentTableColumns = [
    {
      key: 'facilityId',
      title: <Translate>Facility Name</Translate>,
      flexGrow: 4,
      render: (rowData: any) => (
        <span>
          {conjureValueBasedOnIDFromList(facilities ?? [], rowData.facilityId, 'name')}
        </span>
      ),
    },
    {
      key: 'departmentId',
      title: <Translate>Department Name</Translate>,
      flexGrow: 4,
      render: (rowData: any) => (
        <span>
          {conjureValueBasedOnIDFromList(departmentList as any, rowData.departmentId, 'name')}
        </span>
      ),
    },
    {
      key: 'isDefault',
      title: <Translate>Default</Translate>,
      flexGrow: 2,
      render: (rowData: any) => <p>{rowData?.isDefault ? 'Yes' : 'No'}</p>,
    },
    {
      key: 'appointmentBookingAllowed',
      title: <Translate>Appointment Booking Allowed</Translate>,
      flexGrow: 3,
      render: (rowData: any) => (
        <p>{rowData?.appointmentBookingAllowed ? 'Yes' : 'No'}</p>
      ),
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 4,
      render: (rowData: any) => <p>{rowData?.isActive ? 'Active' : 'Inactive'}</p>,
    },
    {
      key: 'icon',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: (rowData: any) => {
        return (
          <div className="container-of-icons">
            <MdDelete
              style={{ cursor: 'pointer' }}
              title="Delete"
              size={24}
              fill="var(--primary-pink)"
              onClick={() => {
                setUserDepartment(rowData);
                setOpenConfirmDeleteDepartmentModal(true);
              }}
            />
            {/*  Edit icon — opens form in edit mode */}
            <MdModeEdit
              className="icons-style"
              title="Edit"
              size={24}
              fill="var(--primary-gray)"
              onClick={() => {
                setUserDepartment(rowData);   // load row data into form
                setFormMode('edit');          // switch to edit mode
                setOpenForm(true);            // open the form
                if (rowData.facilityId) {
                  getDepartmentsByFacility({ facilityId: rowData.facilityId });
                }
              }}
            />
          </div>
        );
      },
    },
  ];

  const handlePageChange = (_: unknown, newPage: number) => {
    setPageIndex(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPageIndex(0);
  };

  const paginatedData = useMemo(() => {
    const start = pageIndex * rowsPerPage;
    const end = start + rowsPerPage;
    return (userDepartmentsResponse ?? []).slice(start, end);
  }, [userDepartmentsResponse, pageIndex, rowsPerPage]);

  const totalCount = userDepartmentsResponse?.length ?? 0;

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      {openForm && (
        <Form
          fluid
          layout="inline"
          style={{
            marginBottom: '20px',
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        >
          {/*  Facility — always disabled in edit mode */}
          <MyInput
            column
            width={350}
            fieldLabel="Facility"
            fieldName="facilityId"
            required
            fieldType="select"
            selectData={facilities}
            selectDataLabel="name"
            selectDataValue="id"
            record={userDepartment}
            setRecord={updateRecord => {
              setUserDepartment(updateRecord);
              onChangeFacility(updateRecord.facilityId);
            }}
            searchable
            disabled={formMode === 'edit'}
          />

          {/*  Department — always disabled in edit mode */}
          <MyInput
            column
            fieldLabel="Select Departments"
            fieldType="select"
            fieldName="departmentId"
            selectData={departmentsResponse ?? []}
            selectDataLabel="name"
            selectDataValue="id"
            width={350}
            record={userDepartment}
            setRecord={setUserDepartment}
            required
            disabled={formMode === 'edit' || !userDepartment?.facilityId || deptLoading}
          />

          {/*  Toggles — always enabled */}
          <MyInput
            column
            fieldLabel="Set as Default"
            fieldType="checkbox"
            fieldName="isDefault"
            record={userDepartment}
            setRecord={setUserDepartment}
          />
          <MyInput
            column
            fieldLabel="Appointment Booking Allowed"
            fieldType="checkbox"
            fieldName="appointmentBookingAllowed"
            record={userDepartment}
            setRecord={setUserDepartment}
          />

          <div style={{ display: 'flex', alignItems: 'flex-end', marginLeft: '10px' }}>
            <MyButton
              onClick={handleFacilityDepartmentSave}
              appearance="primary"
            >
              Save
            </MyButton>
            <MyButton
              onClick={resetToAddMode}
              appearance="subtle"
              style={{ marginLeft: '10px' }}
            >
              Cancel
            </MyButton>
          </div>
        </Form>
      )}

      {!openForm && (
        <div className="container-of-add-new-button" style={{ marginBottom: '20px' }}>
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={() => {
              setUserDepartment({
                ...newUserDepartment,
                userId,
                isDefault: false,
              });
              setFormMode('add');
              setOpenForm(true);
            }}
            width={width > 600 ? '150px' : '109px'}
            disabled={!userId}
          >
            New Department
          </MyButton>
        </div>
      )}

      <MyTable
        height={300}
        data={paginatedData}
        columns={userDepartmentTableColumns}
        onRowClick={(row: UserDepartment) => {
          setUserDepartment(row);
        }}
        rowClassName={isSelected}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      <DeletionConfirmationModal
        open={openConfirmDeleteDepartmentModal}
        setOpen={setOpenConfirmDeleteDepartmentModal}
        itemToDelete="userDepartment"
        actionButtonFunction={() => handleDeleteUserDepartment(userDepartment)}
        actionType="delete"
      />
    </div>
  );
};

export default DepartmentsTab;
