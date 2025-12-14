import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { CiDiscount1 } from 'react-icons/ci';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
const DiscountModal = ({ open, setOpen, record, setRecord }) => {

  const { data: LovQueryResponse } = useGetLovValuesByCodeQuery('INS_COVG_TYP');
  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              fieldName="discountAmount"
              fieldType="number"
              record={record}
              setRecord={setRecord}
              width="100%"
            />
            <MyInput
              fieldName="discountType"
              fieldType="select"
              selectData={LovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={record}
              setRecord={setRecord}
              menuMaxHeight={200}
              width="100%"
            />

          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Discount"
      position="center"
      content={conjureFormContent}
      actionButtonLabel="Save"
      steps={[{ title: 'Discount', icon: <CiDiscount1 size={24} /> }]}
      size="xs"
      bodyheight="80vh"
    />
  );
};
export default DiscountModal;
