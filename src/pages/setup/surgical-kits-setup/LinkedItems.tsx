import React, { useState } from 'react';
import { Form } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
// import './styles.less';
import { MdDelete } from 'react-icons/md';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import ChildModal from '@/components/ChildModal';
import { MdMedicalServices } from 'react-icons/md';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetProductQuery } from '@/services/setupService';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
const LinkedItems = ({ open, setOpen, surgicalKits }) => {
  const [openChildModal, setOpenChildModal] = useState<boolean>(false);
  const [item, setItem] = useState({});
  const [openConfirmDeleteItem, setOpenConfirmDeleteItem] = useState<boolean>(false);
  const [productselectListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });

  // Fetch products list response
  const { data: productselectListResponseLoading } = useGetProductQuery(productselectListRequest);

  // Icons column (remove)
  const iconsForActions = () => (
    <div className="container-of-icons">
      <MdDelete
        className="icons-style"
        title="Delete"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => setOpenConfirmDeleteItem(true)}
      />
    </div>
  );

  // Columns
  const tableColumns = [
    {
      key: 'kitCode',
      title: <Translate>Kit Code</Translate>
    },
    {
      key: 'lookup',
      title: <Translate>Lookup</Translate>
    },
    {
      key: 'quantity',
      title: <Translate>Quantity</Translate>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      render: () => iconsForActions()
    }
  ];

  // handle delete item 
  const handleDelete = () => {
    setOpenConfirmDeleteItem(false);
  };

  // Main modal content
  const conjureFormMainContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <div>
            <div className="container-of-add-new-button">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => setOpenChildModal(true)}
                width="109px"
              >
                Link Item
              </MyButton>
            </div>
            <MyTable height={450} data={surgicalKits?.items} columns={tableColumns} />
            <DeletionConfirmationModal
              open={openConfirmDeleteItem}
              setOpen={setOpenConfirmDeleteItem}
              itemToDelete="Item"
              actionButtonFunction={handleDelete}
              actionType="Delete"
            />
          </div>
        );
    }
  };

  // Child modal content
  const conjureFormChildContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              fieldType="select"
              fieldName="lookup"
              selectData={productselectListResponseLoading?.object ?? []}
              selectDataLabel="name"
              selectDataValue="key"
              record={item}
              setRecord={setItem}
              width="100%"
              menuMaxWidth={200}
            />
            <MyInput
              width="100%"
              fieldName="quantity"
              fieldType="number"
              record={item}
              setRecord={setItem}
            />
          </Form>
        );
    }
  };
  return (
    <ChildModal
      open={open}
      setOpen={setOpen}
      showChild={openChildModal}
      setShowChild={setOpenChildModal}
      title="Add Items"
      mainContent={conjureFormMainContent}
      actionChildButtonFunction={null}
      hideActionBtn
      childTitle={'Add New Item to Surgical Kit'}
      childContent={conjureFormChildContent}
      mainSize="sm"
      mainStep={[{ title: 'Items', icon: <MdMedicalServices /> }]}
      childStep={[{ title: 'Item', icon: <MdMedicalServices /> }]}
    />
  );
};
export default LinkedItems;
