import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { useSaveAccessRoleMutation } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';

const AddEditAccessRole = ({
  open,
  setOpen,
  width,
  accessRole,
  setAccessRole,
  setLoad,
  refetch
}) => {
  //save AccessRole
  const [saveAccessRole] = useSaveAccessRoleMutation();

  // Handle save Access Role
  const handleSave = async () => {
    setLoad(true);
    setOpen(false);
    await saveAccessRole(accessRole).unwrap();
    if (refetch != null) {
      refetch();
      setLoad(false);
    }
  };

  // Modal contant
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              fieldName="name"
              record={accessRole}
              setRecord={setAccessRole}
              width={width > 600 ? 520 : 250}
            />
            <MyInput
              fieldName="description"
              record={accessRole}
              setRecord={setAccessRole}
              width={width > 600 ? 520 : 250}
            />
            <div
              className={clsx('', {
                'container-of-two-fields-access-roles': width > 600
              })}
            >
              <MyInput
                fieldName="accessLevel"
                record={accessRole}
                setRecord={setAccessRole}
                width={250}
              />
              <MyInput
                fieldName="passwordErrorRetries"
                record={accessRole}
                setRecord={setAccessRole}
                width={250}
              />
            </div>
            <div
              className={clsx('', {
                'container-of-passwordExpires': width > 600
              })}
            >
              <Form className='form' >
                <MyInput
                  fieldName="passwordExpires"
                  fieldType="checkbox"
                  record={accessRole}
                  setRecord={setAccessRole}
                />
              </Form>
              <MyInput
                fieldName="passwordExpiresAfterDays"
                record={accessRole}
                disabled={!accessRole.passwordExpires}
                setRecord={setAccessRole}
                width={250}
              />
            </div>
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={accessRole?.key ? 'Edit AccessRole' : 'New AccessRole'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={accessRole?.key ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Access Rule Rule info', icon: faKey }]}
      size={width > 600 ? '570px' : '300px'}
    />
  );
};
export default AddEditAccessRole;
