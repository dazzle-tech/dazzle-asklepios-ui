import React, { useState } from 'react';
import './styles.less';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdDelete } from 'react-icons/md';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { FaBuilding } from 'react-icons/fa';
import ChildModal from '@/components/ChildModal';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import {
  useAddUserDepartmentMutation,
  useLazyGetUserDepartmentsByUserQuery,
  useDeleteUserDepartmentMutation
  
} from '@/services/security/userDepartmentsService';
import { Department, UserDepartment } from '@/types/model-types-new';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { newUserDepartment } from '@/types/model-types-constructor-new';
import { useGetDepartmentsQuery, useLazyGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { conjureValueBasedOnIDFromList } from '@/utils';

const ViewDepartments = ({ open, setOpen, user, width }) => {
  const dispatch = useAppDispatch();

  const { data: departmentListResponse } = useGetDepartmentsQuery({ page: 0, size: 10000 });
  const departmentList = React.useMemo(
    () => departmentListResponse?.data ?? [],
    [departmentListResponse]
  );

  // Lazy fetch user departments list
  const [getUserDepartmentsByUser, { data: userDepartmentsResponse }] =
    useLazyGetUserDepartmentsByUserQuery();

  const [userDepartment, setuserDepartment] = useState<UserDepartment>({
    ...newUserDepartment,
    isDefault: false
  });

  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
  const facilities = Array.isArray(facilityListResponse) ? facilityListResponse : [];

  const [getDepartmentsByFacility, { data: departmentsResponse, isFetching: deptLoading }] =
    useLazyGetActiveDepartmentByFacilityListQuery();
  console.log('departmentsResponse from lazy query:', departmentsResponse);

  // Delete user department
  const [deleteUserDepartment] = useDeleteUserDepartmentMutation();
  const [openConfirmDeleteDepartmentModal, setOpenConfirmDeleteDepartmentModal] =
    useState<boolean>(false);
  const [openChildModal, setOpenChildModal] = useState<boolean>(false);

  // Save department
  const [saveDepartment] = useAddUserDepartmentMutation();

  const userId = user?.id;

  // Initial load of user departments when userId is available
  React.useEffect(() => {
    if (userId) {
      getUserDepartmentsByUser(userId);
    }
  }, [userId, getUserDepartmentsByUser]);

  // Refetch helper to keep existing calls working
  const refetchUserDepartments = React.useCallback(() => {
    if (userId) {
      getUserDepartmentsByUser(userId);
    }
  }, [userId, getUserDepartmentsByUser]);

  // Handle delete user department
  const handleDeleteUserDepartment = UFD => {
    deleteUserDepartment(UFD.id)
      .unwrap()
      .then(() => {
        setOpenConfirmDeleteDepartmentModal(false);
        dispatch(
          notify({
            msg: 'The department was successfully deleted for this user',
            sev: 'success'
          })
        );
        refetchUserDepartments();
      })
      .catch(() => {
        setOpenConfirmDeleteDepartmentModal(false);
        dispatch(
          notify({
            msg: 'Failed to delete department for this User',
            sev: 'error'
          })
        );
      });
  };

  const onChangeFacility = async (next: string) => {
    const nextFacilityId = next;
    setuserDepartment(prev => ({
      ...prev,
      facilityId: nextFacilityId,
      departmentId: undefined,
      isDefault: false
    }));
    if (nextFacilityId) {
      await getDepartmentsByFacility({ facilityId: nextFacilityId });
    }
  };

  // Handle Save Facility Department
  const handleFacilityDepartmentSave = () => {
    // Remove facilityId from the object before saving (API expects only userId and departmentId)
    const { facilityId, ...dataToSave } = userDepartment;

    saveDepartment(dataToSave)
      .unwrap()
      .then(() => {
        setOpenChildModal(false);
        dispatch(
          notify({
            msg: 'The Department has been saved successfully',
            sev: 'success'
          })
        );
        refetchUserDepartments();
      })
      .catch(() => {
        setOpenChildModal(false);
        dispatch(
          notify({
            msg: 'Failed to save this Department',
            sev: 'error'
          })
        );
      });
  };

  // Table columns
  const userDepartmentTableColumns = [
    {
      key: 'facilityId',
      title: <Translate>Facility Name</Translate>,
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
      key: 'departmentId',
      title: <Translate>Department Name</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {conjureValueBasedOnIDFromList(
            departmentList as any,
            rowData.departmentId,
            'name'
          )}
        </span>
      )
    },
    {
      key: 'isDefault',
      title: <Translate>Default</Translate>,
      flexGrow: 2,
      render: rowData => <p>{rowData?.isDefault ? 'Yes' : 'No'}</p>
    },
    {
      key: 'isActive',
      title: <Translate key="STATUS">Status</Translate>,
      flexGrow: 4,
      render: rowData => <p>{rowData?.isActive ? 'Active' : 'Inactive'}</p>
    },
    {
      key: 'icon',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: rowData => {
        return (
          <MdDelete
            style={{ cursor: 'pointer' }}
            title="Delete"
            size={24}
            fill="var(--primary-pink)"
            onClick={() => {
              setuserDepartment(rowData);
              setOpenConfirmDeleteDepartmentModal(true);
            }}
          />
        );
      }
    }
  ];

  // Main modal content
  const conjureFormContentOfMainModal = () => {
    return (
      <Form>
        <div className="container-of-add-new-button">
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={() => {
              setuserDepartment({
                ...newUserDepartment,
                userId: user?.id,
                isDefault: false
              });
              setOpenChildModal(true);
            }}
            width={width > 600 ? '150px' : '109px'}
          >
            New Department
          </MyButton>
        </div>
        <MyTable
          height={250}
          data={userDepartmentsResponse ?? []}
          columns={userDepartmentTableColumns}
        />
        <DeletionConfirmationModal
          open={openConfirmDeleteDepartmentModal}
          setOpen={setOpenConfirmDeleteDepartmentModal}
          itemToDelete="userDepartment"
          actionButtonFunction={() => handleDeleteUserDepartment(userDepartment)}
          actionType="delete"
        />
      </Form>
    );
  };

  // Child modal content
  const conjureFormContentOfChildModal = () => {
    return (
      <Form fluid layout="inline">
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
            setuserDepartment(updateRecord);
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
          setRecord={setuserDepartment}
          required
          disabled={!userDepartment?.facilityId || deptLoading}
        />
        <MyInput
          column
          fieldLabel="Set as Default"
          fieldType="checkbox"
          fieldName="isDefault"
          record={userDepartment}
          setRecord={setuserDepartment}
        />
      </Form>
    );
  };

  return (
    <ChildModal
      open={open}
      setOpen={setOpen}
      hideActionBtn
      showChild={openChildModal}
      setShowChild={setOpenChildModal}
      title="Departments"
      childTitle="New Department"
      mainContent={conjureFormContentOfMainModal}
      mainStep={[{ title: 'Departments', icon: <FaBuilding /> }]}
      childStep={[{ title: 'Department Info', icon: <FaBuilding /> }]}
      childContent={conjureFormContentOfChildModal}
      actionChildButtonLabel="Save"
      actionChildButtonFunction={handleFacilityDepartmentSave}
      mainSize="sm"
    />
  );
};

export default ViewDepartments;
