import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Form } from 'rsuite';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdDelete } from 'react-icons/md';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import MyInput from '@/components/MyInput';
import {
  useAddUserDepartmentMutation,
  useLazyGetUserDepartmentsByUserQuery,
  useDeleteUserDepartmentMutation,
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
  const [openConfirmDeleteDepartmentModal, setOpenConfirmDeleteDepartmentModal] =
    useState<boolean>(false);
  const [openForm, setOpenForm] = useState<boolean>(false);

  const [saveDepartment] = useAddUserDepartmentMutation();

  const [pageIndex, setPageIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);


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
    }));
    if (nextFacilityId) {
      await getDepartmentsByFacility({ facilityId: nextFacilityId });
    }
  };

  const handleFacilityDepartmentSave = () => {
    if (!userDepartment?.facilityId || !userDepartment?.departmentId) {
      dispatch(
        notify({ msg: 'Please select both Facility and Department', sev: 'error' }),
      );
      return;
    }

    const { facilityId, ...dataToSave } = userDepartment;

    saveDepartment(dataToSave)
      .unwrap()
      .then(() => {
        setOpenForm(false);
        dispatch(
          notify({
            msg: 'The Department has been saved successfully',
            sev: 'success',
          }),
        );
        refetchUserDepartments();
        setUserDepartment({
          ...newUserDepartment,
          userId,
          isDefault: false,
        });
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

  dispatch(
    notify({
      msg: message,
      sev: 'error',
    }),
  );
});
  };

  const handleDeleteUserDepartment = (UFD: any) => {
    deleteUserDepartment(UFD.id)
      .unwrap()
      .then(() => {
        setOpenConfirmDeleteDepartmentModal(false);
        dispatch(
          notify({
            msg: 'The department was successfully deleted for this user',
            sev: 'success',
          }),
        );
        refetchUserDepartments();
      })
      .catch(() => {
        setOpenConfirmDeleteDepartmentModal(false);
        dispatch(
          notify({
            msg: 'Failed to delete department for this User',
            sev: 'error',
          }),
        );
      });
  };

  const userDepartmentTableColumns = [
    {
      key: 'facilityId',
      title: <Translate>Facility Name</Translate>,
      flexGrow: 4,
      render: (rowData: any) => (
        <span>
          {conjureValueBasedOnIDFromList(
            facilities ?? [],
            rowData.facilityId,
            'name',
          )}
        </span>
      ),
    },
    {
      key: 'departmentId',
      title: <Translate>Department Name</Translate>,
      flexGrow: 4,
      render: (rowData: any) => (
        <span>
          {conjureValueBasedOnIDFromList(
            departmentList as any,
            rowData.departmentId,
            'name',
          )}
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

  // Direction handling for RTL/LTR
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
          />
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
            disabled={!userDepartment?.facilityId || deptLoading}
          />
          <MyInput
            column
            fieldLabel="Set as Default"
            fieldType="checkbox"
            fieldName="isDefault"
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
              onClick={() => {
                setOpenForm(false);
                setUserDepartment({
                  ...newUserDepartment,
                  userId,
                  isDefault: false,
                });
              }}
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


