// import MyModal from '@/components/MyModal/MyModal';
// import React from 'react';
// import MyInput from '@/components/MyInput';
// import { Form } from 'rsuite';
// import { MdOutlinePriceChange } from 'react-icons/md';

// const ChangePriceListModal = ({
//   open,
//   setOpen,
//   forAllServises, // true if we want to change price list for all services
//   record,
//   setRecord
// }) => {
//   // Modal content
//   const conjureFormContent = (stepNumber = 0) => {
//     switch (stepNumber) {
//       case 0:
//         return (
//           <Form fluid>
//             <MyInput
//               fieldLabel="Price Lists"
//               fieldName="priceList"
//               fieldType="select"
//               selectData={[]}
//               selectDataLabel=""
//               selectDataValue=""
//               record={record}
//               setRecord={setRecord}
//               menuMaxHeight={200}
//               width="100%"
//             />
//           </Form>
//         );
//     }
//   };
//   return (
//     <MyModal
//       open={open}
//       setOpen={setOpen}
//       title="Change Price List"
//       position="center"
//       content={conjureFormContent}
//       actionButtonLabel="Save"
//       steps={[{ title: 'Price List', icon: <MdOutlinePriceChange size={24} /> }]}
//       size="xs"
//       bodyheight="50vh"
//     />
//   );
// };
// export default ChangePriceListModal;


// src/pages/accounting/ChangePriceListModal.tsx
import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { MdOutlinePriceChange } from 'react-icons/md';

import { useGetAllActivePriceListsQuery } from '@/services/billing/PriceListService';
import { useGetPriceListItemsByPriceListIdQuery } from '@/services/billing/PriceListItemService';
import { set } from 'lodash';
import { useSaveNurseServiceProductMutation } from '@/services/encounterService';
import { ApNurseServiceProduct } from '@/types/model-types';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  forAllServises: boolean;
  record: any;
  setRecord: (r: any) => void;
};

const ChangePriceListModal = ({
  open,
  setOpen,
  forAllServises,
  record,
  setRecord,
}) => {
  const { data } = useGetAllActivePriceListsQuery({
    page: 0,
    size: 100,
    sort: 'name,asc',
  });
 const [saveNurseServiceProduct] = useSaveNurseServiceProductMutation();
   const { data: itemsRes, refetch, isFetching } =
      useGetPriceListItemsByPriceListIdQuery(
        { priceListId: record?.priceList?.id as number, page: 0, size: 50, sort: "id,asc" },
        { skip: !record?.priceList?.id }
      );

  const priceLists = data?.data ?? [];

  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
      default:
        return (
          <Form fluid>
            <MyInput
              fieldLabel="Price Lists"
              fieldName="priceListId"
              fieldType="select"
              selectData={priceLists}
              selectDataLabel="name"
              selectDataValue="id"
              record={record}
              setRecord={setRecord}
              menuMaxHeight={200}
              width="100%"
            />
              <MyInput
              fieldLabel="Price List Items"
              fieldName="priceListItemId"
              fieldType="select"
              selectData={itemsRes?.data || []}
              selectDataLabel="name"
              selectDataValue="id"
              record={record}
              setRecord={setRecord}
              menuMaxHeight={200}
              width="100%"
            />

    <MyInput
    readOnly={true}
              fieldLabel="Price List Items"
              fieldName="priceListItemPrice"
              fieldType="select"
              selectData={itemsRes?.data || []}
              selectDataLabel="price"
              selectDataValue="id"
              record={record}
              setRecord={setRecord}
              menuMaxHeight={200}
              width="100%"
            />

          </Form>
        );
    }
  };

  const handleSave = () => {
    const baseTotal =
        record?.totalPrice ?? record?.price * (record?.quantity || 1);
        setRecord((prev) => ({
          ...prev,
          priceListItemId: record?.priceListItemId,    
          price:
          itemsRes?.data.find((item) => item.id === record?.priceListItemId)?.price || prev.price,
          totalPrice:
          (itemsRes?.data.find((item) => item.id === record?.priceListItemId)?.price || prev.priceListItemPrice) *
            (record?.quantity || 1),
        }));        
          const updated: ApNurseServiceProduct = {
    ...record,
    totalPrice:
          (itemsRes?.data.find((item) => item.id === record?.priceListItemId)?.price || record?.priceListItemPrice) *

            (record.quantity || 1),
  };

  console.log('updating nurse row', updated);
 saveNurseServiceProduct(updated).unwrap();
    setOpen(false);
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Change Price List"
      position="center"
      content={conjureFormContent}
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      steps={[{ title: 'Price List', icon: <MdOutlinePriceChange size={24} /> }]}
      size="xs"
      bodyheight="50vh"
    />
  );
};

export default ChangePriceListModal;
