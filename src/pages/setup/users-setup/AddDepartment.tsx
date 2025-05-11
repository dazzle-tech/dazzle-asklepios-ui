import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import { useGetFacilitiesQuery, useSaveFacilityDepartmentMutation } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import clsx from 'clsx';
import { initialListRequest } from '@/types/types';
import './styles.less';
import { ApFacility } from '@/types/model-types';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

const AddDepartment = ({
  open,
  setOpen,
  //   width,
  user
}) => {
  const dispatch = useAppDispatch();

  const [selectedDepartment, setSelectedDepartment] = useState({ department: '' });
  const [facilityRecord, setFacilityRecord] = useState({ facility: ' ' });
  const [selectedFacility, setSelectedFacility] = useState<ApFacility>();
  // Fetch Facilities list response
  const { data: facilityListResponse } = useGetFacilitiesQuery({
    ...initialListRequest,
    pageSize: 1000
  });
  // Save department
  const [saveDepartment] = useSaveFacilityDepartmentMutation();

  // Effects
  useEffect(() => {
    const targetFacility = facilityListResponse?.object?.find(
      facility => facility.key === facilityRecord.facility
    );
    setSelectedFacility(targetFacility);
  }, [facilityRecord]);

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
        setOpen(false);
        dispatch(notify({ msg: 'The Department has been saved successfully', sev: 'success' }));
      })
      .catch(() => {
        setOpen(false);
        dispatch(notify({ msg: 'Failed to save this Department', sev: 'error' }));
      });
  };
  // Modal Content
  const conjureFormContent = stepNumber => {
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
              width={520}
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
              width={520}
            />
          </Form>
        );
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="New Department"
      position="right"
      content={conjureFormContent}
      actionButtonLabel="Create"
      actionButtonFunction={handleFacilityDepartmentSave}
      // size={width > 600 ? '570px' : '300px'}
      //   steps={[{ title: 'User Info', icon: faUser }]}
    />
  );
};
export default AddDepartment;
