import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { faCheckDouble, faUser } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import React, { useState } from 'react';
import { Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AccessRole from './tabs/AccessRole';
import './styles.less';
import { useEnumOptions } from '@/services/enumsApi';
const AddEditUser = ({ open, setOpen, width, user, setUser, handleSave, canProceed, setCanProceed }) => {


  const jobRoles = useEnumOptions("JobRole");

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
                width={'13vw'}
              />

              <MyInput
                fieldName="lastName"
                required
                record={user}
                setRecord={setUser}
                width={'13vw'}
              />
            </div>
            <div className={clsx('', { 'container-of-two-fields-users': width > 600 })}>
              <MyInput
                disabled={!!user?.id}
                fieldName="login" required record={user} setRecord={setUser} width={'13vw'} />
              <MyInput
                width={'13vw'}
                fieldLabel="Job Role"
                fieldType="select"
                fieldName="jobRole"
                selectData={jobRoles ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                record={user}
                setRecord={setUser}
                required
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
                width={'13vw'}
                searchable={false}
              />
              <MyInput
                fieldType="date"
                fieldLabel="DOB"
                fieldName="birthDate"
                record={user}
                setRecord={setUser}
                width={'13vw'}
              />
            </div>
            <div className={clsx('', { 'container-of-two-fields-users': width > 600 })}>
              <MyInput fieldName="email" required record={user} setRecord={setUser} width={'13vw'} />
              <MyInput
                fieldName="phoneNumber"
                required
                record={user}
                setRecord={setUser}
                width={'13vw'}
              />
            </div>
            <MyInput
              fieldName="jobDescription"
              fieldType="textarea"
              required
              record={user}
              setRecord={setUser}
              width={'13vw'}
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
      title={user?.id ? 'Edit User' : 'New User'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={user?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      size={width > 600 ? '38vw' : '25vw'}
      steps={[
        {
          title: 'User Info',
          icon: <FontAwesomeIcon icon={faUser} />,
          disabledNext: !canProceed,
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
