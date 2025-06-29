import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { useSaveAccessRoleMutation } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
const AddEditAccessRole = ({
  open,
  setOpen,
  width,
  accessRole,
  setAccessRole,
  setLoad,
  refetch
}) => {
  const dispatch = useAppDispatch();
  //save AccessRole
  const [saveAccessRole] = useSaveAccessRoleMutation();

  // Handle save Access Role
  const handleSave = async () => {
    try {
      setLoad(true);
      setOpen(false);
      await saveAccessRole(accessRole).unwrap();
      if (refetch != null) {
        refetch();
      }
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: 'Error while saving access role', sev: 'error' }));
    } finally {
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
              width="100%"
            />
            <MyInput
              fieldName="description"
              record={accessRole}
              setRecord={setAccessRole}
              width="100%"
            />
            <div
              className="container-of-two-fields-access-role"
            >
              <div className='container-of-field-access-role'>
              <MyInput
                fieldName="accessLevel"
                record={accessRole}
                setRecord={setAccessRole}
                width="100%"
              />
              </div>
              <div className='container-of-field-access-role'>
              <MyInput
                fieldName="passwordErrorRetries"
                record={accessRole}
                setRecord={setAccessRole}
                width="100%"
              />
              </div>
            </div>
            <br/>
            <div
              className="container-of-two-fields-access-role"
            >
              <div className='container-of-field-access-role'>
                <MyInput
                  fieldName="passwordExpires"
                  fieldType="checkbox"
                  record={accessRole}
                  setRecord={setAccessRole}
                  width="100%"
                />
                </div>
                <div className='container-of-field-access-role'>
              <MyInput
                fieldName="passwordExpiresAfterDays"
                record={accessRole}
                disabled={!accessRole.passwordExpires}
                setRecord={setAccessRole}
                width="100%"
              />
              </div>
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
      steps={[{ title: 'Access Rule Rule info', icon: <FontAwesomeIcon icon={faKey} /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditAccessRole;
