import MyModal from '@/components/MyModal/MyModal';
import React,{useEffect} from 'react';
import { faLaptop } from '@fortawesome/free-solid-svg-icons';
import { useSaveAccessRoleMutation } from '@/services/setupService';
import MyIconInput from '@/components/MyInput/MyIconInput';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { faKey } from '@fortawesome/free-solid-svg-icons';

const AddEditAccessRole = ({ open, setOpen, width, accessRole, setAccessRole, setLoad ,refetch }) => {
  //save module
  const [saveAccessRole, saveAccessRoleMutation] = useSaveAccessRoleMutation();

  //handle save module
//   const handleModuleSave = async () => {
//     setOpen(false);
//     await saveModule(module).unwrap();
//     if (refetch != null) {
//       refetch();
//     }
//   };

const handleSave = async () => {
  setLoad(true);
    console.log("in add access role");
    setOpen(false);
    await saveAccessRole(accessRole).unwrap();
    console.log("after add");
    if (refetch != null) {
              refetch();
              setLoad(false);
              console.log("refetch");
            }
  };
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput fieldName="name" record={accessRole} setRecord={setAccessRole} width={520} />
            <MyInput
              fieldName="description"
              record={accessRole}
              setRecord={setAccessRole}
              width={520}
            />
            <div className="container-of-two-fields">
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
            <div className="container-of-passwordExpires">
              <MyInput
                fieldName="passwordExpires"
                fieldType="checkbox"
                record={accessRole}
                setRecord={setAccessRole}
              />
              <MyInput
                fieldName="passwordExpiresAfterDays"
                record={accessRole}
                disabled={!accessRole.passwordExpires}
                setRecord={setAccessRole}
                width={245}
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
