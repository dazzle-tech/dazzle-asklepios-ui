import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { faLaptop } from '@fortawesome/free-solid-svg-icons';
import { useSaveScreenMutation } from '@/services/setupService';
import MyIconInput from '@/components/MyInput/MyIconInput';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import clsx from 'clsx';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
const AddEditScreen = ({ open, setOpen, width, setLoad, screen, setScreen, refetch }) => {
  const dispatch = useAppDispatch();
  //Save screen
  const [saveScreen] = useSaveScreenMutation();

  //handle save screen
  const handleScreenSave = async () => {
    try {
      setLoad(true);
      setOpen(false);
      await saveScreen(screen).unwrap();
      if (refetch != null) {
        refetch();
      }
      dispatch(notify({ msg: 'The screen has been saved Successfully', sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: 'Failed to save the Screen', sev: 'error' }));
    } finally {
      setLoad(false);
    }
  };

  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              fieldName="name"
              record={screen}
              setRecord={setScreen}
              width="100%"
            />
            <MyInput
              fieldName="description"
              fieldType="textarea"
              record={screen}
              setRecord={setScreen}
              width="100%"
            />
            <MyInput
              fieldName="viewOrder"
              fieldType="number"
              record={screen}
              setRecord={setScreen}
              width="100%"
            />
            <div className='container-of-two-fields-module'>
              <div className='container-of-field-module'>
              <MyIconInput
                fieldName="iconImagePath"
                fieldLabel="Icon"
                record={screen}
                setRecord={setScreen}
                width="100%"
              />
              </div>
              <div className='container-of-field-module'>
              <MyInput fieldName="navPath" record={screen} setRecord={setScreen} width="100%" />
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
      title={screen?.key ? 'Edit Screen' : 'New Screen'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={screen?.key ? 'Save' : 'Create'}
      actionButtonFunction={handleScreenSave}
      steps={[{ title: 'Screen Info', icon: <FontAwesomeIcon icon={faLaptop} /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditScreen;
