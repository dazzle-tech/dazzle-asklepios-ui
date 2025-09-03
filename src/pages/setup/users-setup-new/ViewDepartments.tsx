import React, { useEffect, useState } from 'react';
import {
  useGetFacilitiesQuery,
  useGetUserDepartmentsQuery,
  useRemoveUserFacilityDepartmentMutation,
  useSaveFacilityDepartmentMutation
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
import ChildModal from '@/components/ChildModal';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { initialListRequest } from '@/types/types';

const ViewDepartments = ({ open, setOpen, user, width }) => {
  const dispatch = useAppDispatch();

  const [department, setDepartment] = useState();
  const [openConfirmDeleteDepartmentModal, setOpenConfirmDeleteDepartmentModal] = useState<boolean>(false);
  const[stateOfDeleteUserModal, setStateOfDeleteUserModal] = useState<string>("delete");
  const[openChildModal, setOpenChildModal] = useState<boolean>(false);
  const [selectedDepartment, setSelectedDepartment] = useState({ department: '' });
  const [facilityRecord, setFacilityRecord] = useState({ facility: ' ' });
  const [selectedFacility, setSelectedFacility] = useState<any>();
  // Fetch user departments list response
  const { data: userDepartmentsResponse, refetch: refetchUserDepartments } =
    useGetUserDepartmentsQuery(user?.key);
  // Remove user facility department
  const [removeUserFacilityDepartment] = useRemoveUserFacilityDepartmentMutation();
  // Fetch Facilities list response
  const { data: facilityListResponse } = useGetFacilitiesQuery({
       ...initialListRequest,
       pageSize: 1000
  });
     // Save department
     const [saveDepartment] = useSaveFacilityDepartmentMutation();

  // ClassName for selected row
  const isSelected = rowData => {
    if (rowData && department && rowData.key === department?.key) {
      return 'selected-row';
    } else return '';
  };

  //Effects
  useEffect(() => {
      const targetFacility = facilityListResponse?.object?.find(
        facility => facility.key === facilityRecord.facility
      );
      setSelectedFacility(targetFacility);
    }, [facilityRecord]);

  // Handle remove user facility department
  const handleRemoveUserFacilityDepartment = rowData => {
    removeUserFacilityDepartment(rowData)
      .unwrap()
      .then(() => {
        setOpenConfirmDeleteDepartmentModal(false);
        dispatch(notify({ msg: 'The Department was successfully Deactivated', sev: 'success' }));
        setFacilityRecord({ facility: ' ' });
        refetchUserDepartments();
      })
      .catch(() => {
        setOpenConfirmDeleteDepartmentModal(false);
        dispatch(notify({ msg: 'Failed to Deactivated this User', sev: 'error' }));
      });
  };

  // Handle Save Facility Department
    const handleFacilityDepartmentSave = () => {
      const facilityDepartment = {
        userKey: user?.key,
        departmentKey: selectedDepartment?.department,
        facilitiyKey: facilityRecord?.facility
      };
      saveDepartment(facilityDepartment)
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
  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <div>
            <div className='container-of-add-new-button' >
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {setFacilityRecord({ facility: ' ' }); setOpenChildModal(true)}}
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
              itemToDelete="Department"
              actionButtonFunction={() => handleRemoveUserFacilityDepartment(department)}
              actionType={stateOfDeleteUserModal}
            />
          </div>
        );
    }
  };
    // Cild modal content
    const conjureFormContentOfChildModal = stepNumber => {
      switch (stepNumber) {
        case 0:
          return (
            <Form fluid layout="inline">
              <MyInput
                column
                fieldLabel="Select Facility"
                fieldType="select"
                fieldName="facility"
                selectData={facilityListResponse?.object ?? []}
                selectDataLabel="facilityName"
                selectDataValue="key"
                record={facilityRecord}
                setRecord={setFacilityRecord}
                width={350}
              />
              <MyInput
                column
                fieldLabel="Select Departments"
                fieldType="select"
                fieldName="department"
                selectData={selectedFacility?.department}
                selectDataLabel="name"
                selectDataValue="key"
                record={selectedDepartment}
                setRecord={setSelectedDepartment}
                width={350}
              />
            </Form>
          );
      }
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
          actionChildButtonLabel="Create"
          actionChildButtonFunction={handleFacilityDepartmentSave}
          mainSize="sm"
    />
  );
};
export default ViewDepartments;
