import MyModal from '@/components/MyModal/MyModal';
import React, { useState } from 'react';
import { useGetWarehouseQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { faBottleDroplet } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { initialListRequest, ListRequest } from '@/types/types';
import MyButton from '@/components/MyButton/MyButton';
import "./styles.less";
const Dispense = ({ open, setOpen, width }) => {
  const [listRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 15
  });
  const {
    data: warehouseListResponseLoading,
  } = useGetWarehouseQuery(listRequest);

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <div className='container-of-fields-dispense'>
            <div className='container-of-field-dispense'>
            <MyInput
              width="100%"
              fieldName=""
              fieldLabel="Quantity Dispensed"
              record=""
              setRecord=""
              fieldType="number"
            />
            </div>
            <div className='container-of-field-dispense'>
            <MyInput
              width="100%"
              fieldName="warehouseKey"
              fieldType="select"
              selectData={warehouseListResponseLoading?.object ?? []}
              selectDataLabel="warehouseName"
              selectDataValue="key"
              record=""
              setRecord=""
            />
            </div>
            </div>
            <br/>
            <div className='container-of-fields-dispense'>
                <div className='container-of-field-dispense'>
            <MyInput
              width="100%"
              fieldName=""
              fieldLabel="Available quantity"
              record=""
              setRecord=""
              disabled
            />
            </div>
            <div className='container-of-field-dispense'>
            <MyInput
              width="100%"
              fieldName=""
              fieldLabel="Dosage Form"
              record=""
              setRecord=""
              disabled
            />
            </div>
            </div>
            <br/>
            <div className='container-of-fields-dispense'>
            <div className='container-of-field3-dispense'>
            <MyInput
              width="100%"
              fieldName=""
              fieldType="select"
              fieldLabel="Batch Number"
              selectData={[]}
              record=""
              setRecord=""
            />
            </div>
            <div className='container-of-field3-dispense'>
            <MyInput
              width="100%"
              fieldName=""
              fieldLabel="Expiry Date"
              fieldType="date"
              record=""
              setRecord=""
              disabled
            />
            </div>
            <div className='container-of-field3-dispense'>
            <MyInput
              width="100%"
              fieldName=""
              fieldLabel="Storage Location"
              record=""
              setRecord=""
              disabled
            />
            </div>
            </div>
            <br/>
            <div className='container-of-fields-dispense'>
                <div className='container-of-field-dispense'>
            <MyInput
              width="100%"
              fieldName=""
              fieldLabel="Witness Name"
              record=""
              setRecord=""
              required
            />
            </div>
            <div className='container-of-field-dispense'>
            <MyInput width="100%" fieldName="" fieldLabel="Reason" record="" setRecord="" />
            </div>
            </div>
            <br/>
            <MyInput
              width="100%"
              fieldName=""
              fieldType="textarea"
              fieldLabel="Comments"
              record=""
              setRecord=""
            />
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title='Dispense'
      position="right"
      content={conjureFormContent}
      actionButtonLabel="Save"
      actionButtonFunction=""
      steps={[
        {
          title: 'Dispense',
          icon: <FontAwesomeIcon
                  icon={faBottleDroplet}
                />,
          footer: <MyButton>Print label</MyButton>
        }
      ]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default Dispense;
