import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { faLaptop } from '@fortawesome/free-solid-svg-icons';
import { useSaveScreenMutation } from '@/services/setupService';
import MyIconInput from '@/components/MyInput/MyIconInput';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import clsx from 'clsx';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
const AddEditScreen = ({
  open,
  setOpen,
  operationState,
  width,
  screen,
  setScreen,
  refetch, 
}) => {

  //Save screen
  const [saveScreen] = useSaveScreenMutation();
  
  //handle save screen
  const handleScreenSave = async () => {
    setOpen(false);
    await saveScreen(screen).unwrap();
    if (refetch != null) {
        refetch();
      }
  };
   const conjureFormContent = (stepNumber = 0) => {
        switch (stepNumber) {
          case 0:
            return (
              <Form fluid>
                  <MyInput fieldName="name" record={screen} setRecord={setScreen} width={width > 600 ? 520 : 250} />
                  <MyInput
                    fieldName="description"
                    fieldType="textarea"
                    record={screen}
                    setRecord={setScreen}
                    width={width > 600 ? 520 : 250}
                  />
                  <MyInput
                    fieldName="viewOrder"
                    fieldType="number"
                    record={screen}
                    setRecord={setScreen}
                    width={width > 600 ? 520 : 250}
                  />
                  <div className={clsx('', {'container-of-two-fields-module': width > 600})}>
                    <MyIconInput
                      fieldName="iconImagePath"
                      fieldLabel="Icon"
                      record={screen}
                      setRecord={setScreen}
                      width={250}
                    />
                    <MyInput fieldName="navPath" record={screen} setRecord={setScreen} width={250}/>
                  </div>
                </Form>
            );
        }
      };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={operationState + ' Screen'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={operationState === 'New' ? 'Create' : 'Save'}
      actionButtonFunction={handleScreenSave}
      steps={[{ title: 'Screen Info', icon:<FontAwesomeIcon icon={faLaptop }/>}]}
      size={width > 600 ? '36vw' : '25vw'}
    />
  );
};
export default AddEditScreen;