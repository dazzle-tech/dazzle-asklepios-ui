import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { MdOutlinePriceChange } from 'react-icons/md';

const ChangePriceListModal = ({
  open,
  setOpen,
  forAllServises, // true if we want to change price list for all services
  record,
  setRecord
}) => {
  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              fieldLabel="Pricelists"
              fieldName="priceList"
              fieldType="select"
              selectData={[]}
              selectDataLabel=""
              selectDataValue=""
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
      title="Change Price List"
      position="center"
      content={conjureFormContent}
      actionButtonLabel="Save"
      steps={[{ title: 'Price List', icon: <MdOutlinePriceChange size={24} /> }]}
      size="xs"
      bodyheight="50vh"
    />
  );
};
export default ChangePriceListModal;
