import MyModal from '@/components/MyModal/MyModal';
import React, { useState } from 'react';
import { faLaptop } from '@fortawesome/free-solid-svg-icons';
import { useGetFacilitiesQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import clsx from 'clsx';
import { initialListRequest, ListRequest } from '@/types/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import './styles.less';
const AddEditDepartment = ({
  open,
  setOpen,
  width,
  department,
  setDepartment,
  recordOfDepartmentCode,
  setRecordOfDepartmentCode,
  handleSave
}) => {
  const [facilityListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  // Fetch  facility list response
  const { data: facilityListResponse } = useGetFacilitiesQuery(facilityListRequest);
  // Fetch  encTypesLov list response
  const { data: encTypesLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_TYPE');
  // Fetch  depTTypesLov list response
  const { data: depTTypesLovQueryResponse } = useGetLovValuesByCodeQuery('DEPARTMENT-TYP');

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <div className={clsx('', { 'container-of-two-fields-departments': width > 600 })}>
              <MyInput
                width={250}
                fieldName="facilityId"
                required
                fieldType="select"
                selectData={facilityListResponse?.object ?? []}
                selectDataLabel="facilityName"
                selectDataValue="Id"
                record={department}
                setRecord={setDepartment}
              />
              <MyInput
                width={250}
                fieldName="departmentType"
                fieldLabel="Department Type"
                fieldType="select"
                selectData={depTTypesLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="Id"
                record={department}
                setRecord={setDepartment}
              />
            </div>
            <MyInput
              width={width > 600 ? 520 : 250}
              fieldName="name"
              record={department}
              setRecord={setDepartment}
            />
            <div className={clsx('', { 'container-of-two-fields-departments': width > 600 })}>
              <MyInput
                width={250}
                fieldName="phoneNumber"
                record={department}
                setRecord={setDepartment}
              />
              <MyInput
                width={250}
                fieldName="email"
                record={department}
                setRecord={setDepartment}
              />
            </div>
            <MyInput
              width={width > 600 ? 520 : 250}
              fieldName="departmentCode"
              record={recordOfDepartmentCode}
              setRecord={setRecordOfDepartmentCode}
              disabled={true}
            />
            <div className={clsx('', { 'container-of-two-fields-departments': width > 600 })}>
              <Form className="container-of-appointable">
                <MyInput
                  fieldLabel="Appointable"
                  fieldType="checkbox"
                  fieldName="appointable"
                  record={department}
                  setRecord={setDepartment}
                />
              </Form>
              {department?.appointable ? (
                <MyInput
                  width={250}
                  fieldName="encountertypelkey"
                  fieldType="select"
                  fieldLabel="Encounter Type"
                  selectData={encTypesLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={department}
                  setRecord={setDepartment}
                />
              ) : null}
            </div>
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={department?.id ? 'Edit Department' : 'New Department'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={department?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Department Info', icon:<FontAwesomeIcon icon={ faLaptop }/>}]}
      size={width > 600 ? '36vw' : '25vw'}
    />
  );
};
export default AddEditDepartment;
