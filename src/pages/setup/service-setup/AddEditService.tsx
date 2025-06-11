import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { FaStar } from 'react-icons/fa';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
const AddEditService = ({ open, setOpen, width, service, setService, handleSave }) => {
  // Fetch  service Type Lov response
  const { data: serviceTypeLovQueryResponse } = useGetLovValuesByCodeQuery('SERVICE_TYPE');
  // Fetch  service Category Lov response
  const { data: serviceCategoryLovQueryResponse } = useGetLovValuesByCodeQuery('SERVICE_CATEGORY');
   // Fetch  currency Lov response
  const { data: currencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              width="100%"
              fieldName="typeLkey"
              fieldType="select"
              selectData={serviceTypeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={service}
              setRecord={setService}
            />
            <div className="container-of-two-fields-service">
              <div className="container-of-field-service">
                <MyInput width="100%" fieldName="name" record={service} setRecord={setService} />
              </div>
              <div className="container-of-field-service">
                <MyInput
                  width="100%"
                  fieldName="abbreviation"
                  record={service}
                  setRecord={setService}
                />
              </div>
            </div>
            <br/>
            <div className="container-of-two-fields-service">
              <div className="container-of-field-service">
                <MyInput width="100%" fieldName="code" record={service} setRecord={setService} />
              </div>
              <div className="container-of-field-service">
                <MyInput
                  width="100%"
                  fieldName="categoryLkey"
                  fieldType="select"
                  selectData={serviceCategoryLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={service}
                  setRecord={setService}
                />
              </div>
            </div>
            <br/>
            <div className="container-of-two-fields-service">
              <div className="container-of-field-service">
                <MyInput
                  width="100%"
                  fieldName="price"
                  fieldType="number"
                  record={service}
                  setRecord={setService}
                />
              </div>
              <div className="container-of-field-service">
                <MyInput
                  width="100%"
                  fieldName="currencyLkey"
                  fieldType="select"
                  selectData={currencyLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={service}
                  setRecord={setService}
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
      title={service?.key ? 'Edit Service' : 'New Service'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={service?.key ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Service Info', icon: <FaStar /> }]} 
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditService;
