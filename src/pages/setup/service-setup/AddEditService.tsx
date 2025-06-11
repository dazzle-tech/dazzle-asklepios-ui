import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { FaStar } from "react-icons/fa";
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
const AddEditService = ({ open, setOpen, width, service, setService, handleSave }) => {
  
     const { data: serviceTypeLovQueryResponse } = useGetLovValuesByCodeQuery('SERVICE_TYPE');
     const { data: serviceCategoryLovQueryResponse } = useGetLovValuesByCodeQuery('SERVICE_CATEGORY');
     const { data: currencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');
  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
           <MyInput
              fieldName="typeLkey"
              fieldType="select"
              selectData={serviceTypeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={service}
              setRecord={setService}
            />
            <MyInput fieldName="name" record={service} setRecord={setService} />
            <MyInput fieldName="abbreviation" record={service} setRecord={setService} />
            <MyInput fieldName="code" record={service} setRecord={setService} />
            <MyInput
              fieldName="categoryLkey"
              fieldType="select"
              selectData={serviceCategoryLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={service}
              setRecord={setService}
            />
            <MyInput fieldName="price" fieldType="number" record={service} setRecord={setService} />
            <MyInput
              fieldName="currencyLkey"
              fieldType="select"
              selectData={currencyLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={service}
              setRecord={setService}
            />
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
      steps={[{ title: 'Service Info', icon: <FaStar /> }]} //اغير الأيقونة 
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditService;
