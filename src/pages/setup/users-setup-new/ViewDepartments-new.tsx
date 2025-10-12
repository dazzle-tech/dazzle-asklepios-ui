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
import { useAddUserFacilityDepartmentMutation, useGetUserFacilityDepartmentsByUserQuery, useToggleUserFacilityDepartmentIsActiveMutation } from '@/services/security/userFacilityDepartmentsService';
import {Department, UserFacilityDepartment } from '@/types/model-types-new';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { newUserFacilityDepartment } from '@/types/model-types-constructor-new';
import { useGetDepartmentsQuery, useLazyGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { conjureValueBasedOnIDFromList } from '@/utils';

const ViewDepartments = ({ open, setOpen, user, width }) => {
  const dispatch = useAppDispatch();

  const { data: departmentListResponse } = useGetDepartmentsQuery({ page: 0, size: 10000 });
  const departmentList = React.useMemo(() => departmentListResponse?.data ?? [], [departmentListResponse]);
  // Fetch user departments list response
  const { data: userDepartmentsResponse, refetch: refetchUserDepartments } = useGetUserFacilityDepartmentsByUserQuery(user?.id);
  const [userFacilityDepartment, setUserFacilityDepartment] = useState<UserFacilityDepartment>({ ...newUserFacilityDepartment });

  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
  const facilities = Array.isArray(facilityListResponse) ? facilityListResponse : [];

  const [getDepartmentsByFacility, { data: departmentsResponse, isFetching: deptLoading }] = useLazyGetActiveDepartmentByFacilityListQuery();
  console.log('departmentsResponse from lazy query:', departmentsResponse);
  
  // change Status user facility department
  const [ChangeStatusUserFacilityDepartment] = useToggleUserFacilityDepartmentIsActiveMutation();
  const [openConfirmChangeStatusOfDepartmentModal, setOpenConfirmChangeStatusOfDepartmentModal] = useState<boolean>(false);
  const [stateOfStatusForUFDModal, setStateOfStatusForUFDModal] =  useState('delete');
  const [openChildModal, setOpenChildModal] = useState<boolean>(false);


  // Save department
  const [saveDepartment] = useAddUserFacilityDepartmentMutation();

  // Handle change status of user facility department
  const handleChangeStatusOfUserFacilityDepartment = UFD => {
    ChangeStatusUserFacilityDepartment(UFD.id)
      .unwrap()
      .then(() => {
        setOpenConfirmChangeStatusOfDepartmentModal(false);
        dispatch(notify({ msg: 'The department was successfully deactivated for this user', sev: 'success' }));
        refetchUserDepartments();
      })
      .catch(() => {
        setOpenConfirmChangeStatusOfDepartmentModal(false);
        dispatch(notify({ msg: 'Failed to deactivated department for this User', sev: 'error' }));
      });
  };
  const onChangeFacility = async (next: string) => {
    const nextFacilityId = next;
    setUserFacilityDepartment(prev => ({
      ...prev,
      facilityId: nextFacilityId,
      departmentId: undefined, 
    }));
    if (nextFacilityId) {
      await getDepartmentsByFacility({facilityId: nextFacilityId});
    }
  };
  // Handle Save Facility Department
  const handleFacilityDepartmentSave = () => {
    // Remove facilityId from the object before saving (API expects only userId and departmentId)
    const { facilityId, ...dataToSave } = userFacilityDepartment;
    
    saveDepartment(dataToSave)
      .unwrap()
      .then(() => {
        setOpenChildModal(false);
        dispatch(notify({ msg: 'The Department has been saved successfully', sev: 'success' }));
        refetchUserDepartments();
      })
      .catch(() => {
        setOpenChildModal(false);
        dispatch(notify({ msg: 'Failed to save this Department', sev: 'error' }));
      });
  };

  //Table columns
  const userDepartmentTableColumns = [
    {
      key: 'facilityId',
      title: <Translate>Facility Name</Translate>,
      flexGrow: 4 ,
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
      key: 'icon',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: rowData => {
        return !rowData?.isActive ? (
          <FontAwesomeIcon
            title="Activate"
            icon={faRotateRight}
            className="icons-style"
            color="var(--primary-gray)"
            onClick={() => {
              setUserFacilityDepartment(rowData);
              setStateOfStatusForUFDModal('reactivate');
              setOpenConfirmChangeStatusOfDepartmentModal(true);
            }}
          />
        ) : (
          <MdDelete
            style={{ cursor: 'pointer' }}
            title="Deactivate"
            size={24}
            fill="var(--primary-pink)"
            onClick={() => {
              setUserFacilityDepartment(rowData);
              setStateOfStatusForUFDModal("deactivate");
              setOpenConfirmChangeStatusOfDepartmentModal(true);
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
        <div className='container-of-add-new-button' >
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={() => { setUserFacilityDepartment({ ...newUserFacilityDepartment, userId: user?.id }); setOpenChildModal(true); }}
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
          open={openConfirmChangeStatusOfDepartmentModal}
          setOpen={setOpenConfirmChangeStatusOfDepartmentModal}
          itemToDelete="userFacilityDepartment"
          actionButtonFunction={() => handleChangeStatusOfUserFacilityDepartment(userFacilityDepartment)}
          actionType={stateOfStatusForUFDModal}
        />
      </Form>

    );
  };
  // Child modal content
  const conjureFormContentOfChildModal = () => {
    return (
    <Form fluid layout='inline'>
        <MyInput
          column
          width={250}
          fieldLabel="Facility"
          fieldName="facilityId"
          required
          fieldType="select"
          selectData={facilities}
          selectDataLabel="name"
          selectDataValue="id"
          record={userFacilityDepartment}
          setRecord={updateRecord => {
            setUserFacilityDepartment(updateRecord);
            onChangeFacility(updateRecord.facilityId);
          }}
          searchable
        />
        <MyInput
          column
          fieldLabel="Select Departments"
          fieldType="select"
          fieldName="departmentId"
          selectData={departmentsResponse??[]}
          selectDataLabel="name"
          selectDataValue="id"
          width={350}
          record={userFacilityDepartment}
          setRecord={setUserFacilityDepartment}
          required
          disabled={!userFacilityDepartment?.facilityId || deptLoading}
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
