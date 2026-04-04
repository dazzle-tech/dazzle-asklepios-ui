import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useEnumOptions } from '@/services/enumsApi';
import { faCheckDouble, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import React from 'react';
import { Form } from 'rsuite';
import './styles.less';
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

    }
  };

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={user?.id ? 'Edit User' : 'New User'}
      position="right"
      content={(stepNumber) => (
        <div dir={dir}>
          {conjureFormContent(stepNumber)}
        </div>
      )}
      actionButtonLabel={user?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      size={width > 600 ? '38vw' : '25vw'}
      steps={[
        {
          title: 'User Info',
          icon: <FontAwesomeIcon icon={faUser} />,
          disabledNext: !canProceed,
          // disabledNext: !user.id,
         
        }
      ]}
    />
  );
};
export default AddEditUser;
