import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { IoIosListBox } from 'react-icons/io';
const AddEditLov = ({ open, setOpen, width, lov, setLov, handleSave, lovListResponse }) => {
  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <div className= 'container-of-two-fields-lov'>
              <div className='container-of-my-input-lov' >
                <MyInput fieldName="lovCode" record={lov} setRecord={setLov} width="100%" disabled={lov?.key} />
              </div>
              <div className='container-of-my-input-lov'>
                <MyInput fieldName="lovName" record={lov} setRecord={setLov} width="100%" />
              </div>
            </div>
            <br/>
            <MyInput
              fieldName="lovDescription"
              fieldType="textarea"
              record={lov}
              setRecord={setLov}
              width='100%'
            />
            <div className='container-of-two-fields-lov'>
                <div className='container-of-my-input-lov'>
              <MyInput
                fieldName="defaultValueId"
                record={lov}
                disabled={!lov.autoSelectDefault}
                setRecord={setLov}
                width="100%"
              />
              </div>
               <div className='container-of-my-input-lov'>
              <MyInput
                fieldName="parentLov"
                fieldType="select"
                selectData={lovListResponse?.object ?? []}
                selectDataLabel="lovName"
                selectDataValue="key"
                record={lov}
                setRecord={setLov}
                width="100%"
                menuMaxHeight={150}
              />
              </div>
            </div>
            <br />
            <MyInput
              fieldName="autoSelectDefault"
              fieldType="checkbox"
              record={lov}
              setRecord={setLov}
            />
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={lov?.key ? 'Edit LOV' : 'New LOV'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={lov?.key ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'LOV Info', icon: <IoIosListBox /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditLov;
