import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { faLaptop } from '@fortawesome/free-solid-svg-icons';
import { useSaveModuleMutation } from '@/services/setupService';
import MyIconInput from '@/components/MyInput/MyIconInput';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import clsx from 'clsx';
const AddEditModule = ({
  open,
  setOpen,
  operationState,
  width,
  module,
  setModule,
  refetch,
}) => {
  const dispatch = useAppDispatch();
  //save module
  const [saveModule] = useSaveModuleMutation();

  //handle save module
  const handleModuleSave = async () => {
    try {
      setOpen(false);
      await saveModule(module).unwrap();
      if (refetch != null) {
        refetch();
      }
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' })
      );
    } catch (error) {
      dispatch(notify({ msg: 'Error while saving module', sev: 'error' }));

    }
  };

  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              fieldName="name"
              record={module}
              setRecord={setModule}
              width={width > 600 ? 520 : 250}
            />
            <MyInput
              fieldType="textarea"
              fieldName="description"
              record={module}
              setRecord={setModule}
              width={width > 600 ? 520 : 250}
              height={150}
            />
            <div
              className={clsx('', {
                'container-of-two-fields-module': width > 600
              })}
            >
              <MyInput
                fieldName="viewOrder"
                fieldType="number"
                record={module}
                setRecord={setModule}
                width={250}
              />
              <MyIconInput
                fieldName="iconImagePath"
                fieldLabel="Icon"
                record={module}
                setRecord={setModule}
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
      title={operationState + ' Module'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={operationState === 'New' ? 'Create' : 'Save'}
      actionButtonFunction={handleModuleSave}
      steps={[{ title: 'Module Info', icon: <FontAwesomeIcon icon={faLaptop} /> }]}
      size={width > 600 ? '36vw' : '25vw'}
    />
  );
};
export default AddEditModule;