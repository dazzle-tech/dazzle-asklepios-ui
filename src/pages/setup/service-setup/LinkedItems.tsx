import React, { useState } from 'react';
import { Form } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import './styles.less';
import { MdDelete } from 'react-icons/md';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import ChildModal from '@/components/ChildModal';
import { MdMedicalServices } from 'react-icons/md';
import { ColumnConfig } from '@/components/MyTable/MyTable';
const LinkedItems = ({ open, setOpen }) => {
  const [openChildModal, setOpenChildModal] = useState<boolean>(false);

  // Icons column (remove)
  const iconsForActions = () => (
      <MdDelete
        className="icons-service"
        title="Deactivate"
        size={24}
        fill="var(--primary-pink)"
      />
  );



const tableColumns: ColumnConfig[] = [
  {
    key: 'type',
    title: <Translate>Type</Translate>,
  //  align: 'right'
  },
  {
    key: 'name',
    title: <Translate>Name</Translate>,
    align: 'center'
  },
  {
    key: 'icons',
    title: <Translate>Remove</Translate>,
    width: 20,
    render: () => iconsForActions(),
    align: 'right'
  }
];


  // Main modal content
  const conjureFormMainContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <div>
            <div className="container-of-add-new-button-allergens">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => setOpenChildModal(true)}
                width="109px"
              >
                Link Item
              </MyButton>
            </div>
            <MyTable
              height={450}
              data={[]}
              columns={tableColumns}
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
          <Form fluid >
            <MyInput
              width="100%"
              fieldName="type"
              fieldLabel="Select Item type"
              fieldType="select"
              selectData={[]}
              record={""}
              setRecord={""}
            />
            <MyInput
              width="100%"
              fieldName="item"
              fieldLabel="Select Item"
              fieldType="select"
              selectData={[]}
              record={""}
              setRecord={""}
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
      title="Linked Items"
      mainContent={conjureFormMainContent}
      actionChildButtonFunction={null}
      hideActionBtn
      childTitle={'Link New Item to Service'} 
      childContent={conjureFormChildContent}
      mainSize="sm"
      mainStep={[{ title: 'Linked Items', icon: <MdMedicalServices /> }]}
      childStep={[{ title: 'Item', icon: <MdMedicalServices /> }]}
    />
  );
};
export default LinkedItems;
