import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import {  useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { faCheckDouble, faUser } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './styles.less';
import { useGetAllRolesQuery, useGetRolesByFacilityQuery } from '@/services/security/roleService';
import MyButton from '@/components/MyButton/MyButton';
import AccessRole from './AccessRole';
import { useGetGenderQuery } from '@/services/enumService';

const AddEditUser = ({
  open,
  setOpen,
  width,
  user,
  setUser,
  handleSave,
 
}) => {
  // Fetch accessRoles list response
 const {data:accessRoles}=useGetAllRolesQuery(null);
  // Fetch gender lov list response
  const { data: gndrLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  // Fetch jobRole lov list response
  const { data: jobRoleLovQueryResponse } = useGetLovValuesByCodeQuery('JOB_ROLE');
   const {data:genderList}=useGetGenderQuery(null);
     const genders = (genderList ?? []).map((type) => ({
    id: type,
    displayValue: type,
  }));
   console.log("genderList",genderList); 
   console.log("user",user);
  // Modal content
  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form layout="inline" fluid>
            <div className={clsx('', { 'container-of-two-fields-users': width > 600 })}>
              <MyInput
                column
                fieldName="firstName"
                required
                record={user}
                setRecord={setUser}
                width={width > 600 ? 160 : 250}
              />
            
              <MyInput
                column
                fieldName="lastName"
                required
                record={user}
                setRecord={setUser}
                width={width > 600 ? 160 : 250}
              />
            </div>
            <div className={clsx('', { 'container-of-two-fields-users': width > 600 })}>
              <MyInput
                column
                fieldName="login"
                required
                record={user}
                setRecord={setUser}
                width={250}
              />

            </div>
            <div className={clsx('', { 'container-of-two-fields-users': width > 600 })}>
              <MyInput
                column
                fieldLabel="sex at birth"
                fieldType="select"
                fieldName="gender"
                selectData={genders?? []}
                selectDataLabel="displayValue"
                selectDataValue="id"
                record={user}
                setRecord={setUser}
                width={250}
              />
              <MyInput
                column
                fieldType="date"
                fieldLabel="DOB"
                fieldName="birthDate"
                record={user}
                setRecord={setUser}
                width={250}
              />
            </div>
            <div className={clsx('', { 'container-of-two-fields-users': width > 600 })}>
              <MyInput
                column
                fieldName="email"
                required
                record={user}
                setRecord={setUser}
                width={250}
              />
              <MyInput
                column
                fieldName="phoneNumber"
                required
                record={user}
                setRecord={setUser}
                width={250}
              />
            </div>
            <MyInput
              width={width > 600 ? 520 : 250}
              column
              fieldLabel="job role"
              fieldType="select"
              fieldName="jobRoleLkey"
              selectData={jobRoleLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={user}
              setRecord={setUser}
            />
          
            <MyInput
              column
              fieldName="jobDescription"
              fieldType="textarea"
              required
              record={user}
              setRecord={setUser}
              width={width > 600 ? 520 : 250}
            />
            
          </Form>
        );
    

      case 1:
      return (
       <AccessRole user={user}  />
      );}

  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={user?.key ? 'Edit User' : 'New User'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={user?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      size={width > 600 ? '38vw' : '25vw'}
      steps={[{ title: 'User Info', icon: <FontAwesomeIcon icon={faUser} /> ,disabledNext:!user.id, footer: <>

                    <MyButton
                        disabled={false}
                        onClick={handleSave}
                        prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}>Save</MyButton> </>},{
        title: 'Roles', icon: <FontAwesomeIcon icon={faUser} />
      }]}
    />
  );
};
export default AddEditUser;
