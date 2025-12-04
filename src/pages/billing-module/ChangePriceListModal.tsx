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

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  forAllServises: boolean;
  record: any;
  setRecord: (r: any) => void;
};

const ChangePriceListModal: React.FC<Props> = ({
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
          </Form>
        );
    }
  };

  const handleSave = () => {
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
