import MyModal from '@/components/MyModal/MyModal';
import React, { useState } from 'react';
import { faLaptop } from '@fortawesome/free-solid-svg-icons';
import MyInput from '@/components/MyInput';
import { Divider, Form } from 'rsuite';
import clsx from 'clsx';
import { initialListRequest, ListRequest } from '@/types/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './styles.less';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useEnumByName, useEnumOptions } from '@/services/enumsApi';
const AddEditDepartment = ({
  open,
  setOpen,
  width,
  department,
  setDepartment,
  recordOfDepartmentCode,
  setRecordOfDepartmentCode,
  handleAddNew,
  handleUpdate
}) => {
  const [facilityListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  // Fetch  facility list response
  const { data: facilityListResponse } = useGetAllFacilitiesQuery(facilityListRequest);
  // Fetch  encTypesEnum list response
  const encTypesEnum = useEnumOptions("EncounterType");
  // Fetch  depTTypesEnum list response
  const depTypeOptions = useEnumOptions("DepartmentType");
  // Modal content
    

  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid className='add-edit-department-main-container'>
            <div className={clsx('', { 'container-of-two-fields-departments': width > 600 })}>
              <MyInput
                width={250}
                fieldLabel="Facility"
                fieldName="facilityId"
                required
                fieldType="select"
                selectData={facilityListResponse ?? []}
                selectDataLabel="name"
                selectDataValue="id"
                record={department}
                setRecord={setDepartment}
              />

              <MyInput
                width={250}
                fieldName="departmentType"
                fieldLabel="Department Type"
                fieldType="select"
                selectData={depTypeOptions ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                record={department}
                setRecord={setDepartment}
                required
                menuMaxHeight={200}              
              />
            </div>
            <div className={clsx('', { 'container-of-two-fields-departments': width > 600 })}>
            <MyInput
              width={250}
              fieldName="name"
              record={department}
              setRecord={setDepartment}
              required
            />
            <MyInput
              width={250}
              fieldName="departmentCode"
              record={recordOfDepartmentCode}
              setRecord={setRecordOfDepartmentCode}
              disabled={true}
            />
            </div>
            <br />
            <Divider />
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
            <br />
            <Divider />
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
                  fieldName="encounterType"
                  fieldType="select"
                  fieldLabel="Encounter Type"
                  selectData={encTypesEnum ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={department}
                  setRecord={setDepartment}
                />
              ) : null}
            </div>
            <br />
            <Divider />
            <div className={clsx('', { 'container-of-two-fields-departments': width > 600 })}>
              <Form className="container-of-appointable">
                <MyInput
                  fieldLabel="Has Medical Sheets"
                  fieldType="checkbox"
                  fieldName="hasMedicalSheets"
                  record={department}
                  setRecord={setDepartment}
                />
              </Form>
              <Form className="container-of-appointable">
                <MyInput
                  fieldLabel="Has Nurse Medical Sheets"
                  fieldType="checkbox"
                  fieldName="hasNurseMedicalSheets"
                  record={department}
                  setRecord={setDepartment}
                />
              </Form>
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
      actionButtonFunction={department?.id ? handleUpdate : handleAddNew}
      steps={[{ title: 'Department Info', icon: <FontAwesomeIcon icon={faLaptop} /> }]}
      size={width > 650 ? '38vw' : '27vw'}
    />
  );
};
export default AddEditDepartment;
