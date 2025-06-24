import MyModal from '@/components/MyModal/MyModal';
import React, { useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form, Input } from 'rsuite';
import './styles.less';
import { IoIosListBox } from 'react-icons/io';
import { useGetLovValuesQuery } from '@/services/setupService';
import { initialListRequest, ListRequest } from '@/types/types';
import MyLabel from '@/components/MyLabel';
const AddEditLovValue = ({
  open,
  setOpen,
  width,
  lov,
  lovValue,
  setLovValue,
  handleSave,
  isdefault
}) => {
  const [parentLovValueListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true
  });
  const { data: parentLovValueListResponse } = useGetLovValuesQuery(parentLovValueListRequest);

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid >
            <div className='container-of-two-fields-lov'>
              <div className='container-of-my-input-lov'>
                <MyInput
                  fieldName="valueCode"
                  record={lovValue}
                  setRecord={setLovValue}
                  width="100%"
                />
              </div>
              <div className='container-of-my-input-lov'>
                <MyInput
                  fieldLabel="Lov Display Value"
                  fieldName="lovDisplayVale"
                  record={lovValue}
                  setRecord={setLovValue}
                  width="100%"
                />
              </div>
            </div>
            <br />
            <MyInput
              fieldName="valueDescription"
              fieldType="textarea"
              record={lovValue}
              setRecord={setLovValue}
              width="100%"
            />
            <div className='container-of-two-fields-lov' >
              <div className='container-of-my-input-lov'>
                <MyInput
                  fieldName="valueOrder"
                  fieldType="number"
                  record={lovValue}
                  setRecord={setLovValue}
                  width="100%"
                />
              </div>
              <div className='container-of-my-input-lov'>
                <MyInput
                  disabled={!lov.parentLov}
                  fieldName="parentValueId"
                  fieldType="select"
                  selectData={parentLovValueListResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={lovValue}
                  setRecord={setLovValue}
                  width="100%"
                />
              </div>
            </div>
            <br />
            <Form.ControlLabel >
              <MyLabel label="Select Color" />
            </Form.ControlLabel>
            <Input
              type="color"
              value={lovValue.valueColor}
              onChange={value => setLovValue({ ...lovValue, valueColor: value })}
            />
            <br />
            <div className='container-of-two-fields-lov' >
              <div className='container-of-my-input-lov'>
                <MyInput
                  disabled={isdefault == true ? (lovValue.isdefault == true ? false : true) : false}
                  fieldLabel="Is Default"
                  fieldName="isdefault"
                  fieldType="checkbox"
                  record={lovValue}
                  setRecord={setLovValue}
                />
              </div>
              <div className='container-of-my-input-lov'>

                <MyInput
                  width="100%"
                  fieldType='number'
                  fieldName="score"
                  record={lovValue}
                  setRecord={setLovValue} />
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
      title={lovValue?.key ? 'Edit LOV value' : 'New LOV value'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={lovValue?.key ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'LOV Info', icon: <IoIosListBox /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditLovValue;
