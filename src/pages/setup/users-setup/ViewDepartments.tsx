import MyModal from '@/components/MyModal/MyModal';
import React, { useState } from 'react';
import {
  useGetUserDepartmentsQuery,
  useRemoveUserFacilityDepartmentMutation
} from '@/services/setupService';
import './styles.less';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { FaBuilding } from 'react-icons/fa';

const ViewDepartments = ({ open, setOpen, user, width }) => {
  const dispatch = useAppDispatch();

  const [department, setDepartment] = useState();
  const [openConfirmDeleteDepartmentModal, setOpenConfirmDeleteDepartmentModal] = useState<boolean>(false);
  const[stateOfDeleteUserModal, setStateOfDeleteUserModal] = useState<string>("delete");
  // Fetch user departments list response
  const { data: userDepartmentsResponse, refetch: refetchUserDepartments } =
    useGetUserDepartmentsQuery(user?.key);
  // Remove user facility department
  const [removeUserFacilityDepartment] = useRemoveUserFacilityDepartmentMutation();
  // ClassName for selected row
  const isSelected = rowData => {
    if (rowData && department && rowData.key === department?.key) {
      return 'selected-row';
    } else return '';
  };
  // Handle remove user facility department
  const handleRemoveUserFacilityDepartment = rowData => {
    removeUserFacilityDepartment(rowData)
      .unwrap()
      .then(() => {
        setOpenConfirmDeleteDepartmentModal(false);
        dispatch(notify({ msg: 'The Department was successfully Deactivated', sev: 'success' }));
        refetchUserDepartments();
      })
      .catch(() => {
        setOpenConfirmDeleteDepartmentModal(false);
        dispatch(notify({ msg: 'Failed to Deactivated this User', sev: 'error' }));
      });
  };
  //Table columns
  const departmentTableColumns = [
    {
      key: 'facilityName',
      title: <Translate>Facility Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'departmentName',
      title: <Translate>Department Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'icon',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: rowData => {
        return rowData?.deletedAt ? (
          <FaUndo
            style={{ cursor: 'pointer' }}
            title="Activate"
            size={24}
            fill="var(--primary-gray)"
          />
        ) : (
          <MdDelete
            style={{ cursor: 'pointer' }}
            title="Deactivate"
            size={24}
            fill="var(--primary-pink)"
            onClick={() => {setStateOfDeleteUserModal("deactivate"); setOpenConfirmDeleteDepartmentModal(true);}}
          />
        );
      }
    }
  ];
  // Modal content
  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <div>
            <div className='container-of-add-button-user' >
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                // onClick={handleAddNew}
                width={width > 600 ? '150px' : '109px'}
              >
                New Department
              </MyButton>
            </div>
            <MyTable
              height={250}
              data={userDepartmentsResponse?.object ?? []}
              columns={departmentTableColumns}
              rowClassName={isSelected}
              onRowClick={rowData => {
                setDepartment(rowData);
              }}
            />
            <DeletionConfirmationModal
              open={openConfirmDeleteDepartmentModal}
              setOpen={setOpenConfirmDeleteDepartmentModal}
              itemToDelete="User"
              actionButtonFunction={() => handleRemoveUserFacilityDepartment(department)}
              actionType={stateOfDeleteUserModal}
            />
          </div>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Departments"
      position="right"
      content={conjureFormContent}
      hideActionBtn
      size={width > 600 ? '570px' : '300px'}
      steps={[{ title: 'Departments', icon: <FaBuilding /> }]}
    />
  );
};
export default ViewDepartments;
