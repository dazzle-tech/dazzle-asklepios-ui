import React, { useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { GrTestDesktop } from 'react-icons/gr';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import { MdDelete } from 'react-icons/md';
import MyTable from '@/components/MyTable';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import Translate from '@/components/Translate';
import './styles.less';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
const LinkCheckList = ({ open, setOpen, width }) => {
  const [check, setCheck] = useState({});
  const [openConfirmDeleteChecklist, setOpenConfirmDeleteChecklist] = useState<boolean>(false);
  // dummy data
  const data = [
    { key: '1', check: 'check1' },
    { key: '2', check: 'check2' },
    { key: '3', check: 'check3' }
  ];
  // className for selected row
  const isSelected = rowData => {
    if (rowData && check && rowData.key === check.key) {
      return 'selected-row';
    } else return '';
  };

  // Icons column (Remove)
  const iconsForActions = () => (
    <div className="container-of-icons">
      <MdDelete
        className="icons-style"
        title="Remove"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => {
          setOpenConfirmDeleteChecklist(true);
        }}
      />
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'check',
      title: <Translate>Check</Translate>
    },
    {
      key: 'icons',
      title: <Translate>Remove</Translate>,
      flexGrow: 3,
      render: () => iconsForActions()
    }
  ];

  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid layout="inline">
            <div className="container-of-add-bar-checklist">
              <MyInput
                width={200}
                showLabel={false}
                placeholder="Check"
                fieldName=""
                record=""
                setRecord=""
              />
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                width="109px"
              >
                Add
              </MyButton>
            </div>
            <MyTable
              height={380}
              data={data}
              columns={tableColumns}
              rowClassName={isSelected}
              onRowClick={rowData => {
                setCheck(rowData);
              }}
            />
            <DeletionConfirmationModal
              open={openConfirmDeleteChecklist}
              setOpen={setOpenConfirmDeleteChecklist}
              itemToDelete="Check"
              actionButtonFunction=""
              actionType="Delete"
            />
          </Form>
        );
    }
  };

  return (
    <MyModal
      hideActionBtn
      open={open}
      setOpen={setOpen}
      position="right"
      title={'Linked CheckList'}
      content={conjureFormContentOfMainModal}
      steps={[
        {
          title: 'Basic Info',
          icon: <GrTestDesktop />
        }
      ]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default LinkCheckList;
