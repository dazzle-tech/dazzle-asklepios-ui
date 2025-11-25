import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { faCheckDouble, faUser } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import React from 'react';
import { Form } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AccessRole from './AccessRole';
import './styles.less';
import { useEnumOptions } from '@/services/enumsApi';
const AddEditUser = ({ open, setOpen, width, user, setUser, handleSave }) => {



  const jobRoles=useEnumOptions("JobRole");
   console.log("JobRoles",jobRoles)

  const genders = [
    {
      label: 'MALE',
      value: 'Male'
    },
    {
      label: 'FEMALE',
      value: 'Female'
    }
  ];

  // Modal content
  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <div className={clsx('', { 'container-of-two-fields-users': width > 600 })}>
              <MyInput
                fieldName="firstName"
                required
                record={user}
                setRecord={setUser}
                width={250}
              />

              <MyInput
                fieldName="lastName"
                required
                record={user}
                setRecord={setUser}
                width={250}
              />
            </div>
            <div className={clsx('', { 'container-of-two-fields-users': width > 600 })}>
              <MyInput fieldName="login" required record={user} setRecord={setUser} width={250} />
              <MyInput
                width={250}
                fieldLabel="Job Role"
                fieldType="select"
                fieldName="jobRole"
                selectData={jobRoles ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                record={user}
                setRecord={setUser}
              />
            </div>
            <div className={clsx('', { 'container-of-two-fields-users': width > 600 })}>
              <MyInput
                fieldLabel="Gender"
                fieldType="select"
                fieldName="gender"
                selectData={genders ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                record={user}
                setRecord={setUser}
                width={250}
                searchable={false}
              />
              <MyInput
                fieldType="date"
                fieldLabel="DOB"
                fieldName="birthDate"
                record={user}
                setRecord={setUser}
                width={250}
              />
            </div>
            <div className={clsx('', { 'container-of-two-fields-users': width > 600 })}>
              <MyInput fieldName="email" required record={user} setRecord={setUser} width={250} />
              <MyInput
                fieldName="phoneNumber"
                required
                record={user}
                setRecord={setUser}
                width={250}
              />
            </div>
            <MyInput
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
        return <AccessRole user={user} />;
    }
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
      steps={[
        {
          title: 'User Info',
          icon: <FontAwesomeIcon icon={faUser} />,
          // disabledNext: !user.id,
          footer: (
            <>
              <MyButton
                disabled={false}
                onClick={handleSave}
                prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
              >
                Save
              </MyButton>{' '}
            </>
          )
        },
        {
          title: 'Roles',
          icon: <FontAwesomeIcon icon={faUser} />
        }
      ]}
    />
  );
};
export default AddEditUser;
