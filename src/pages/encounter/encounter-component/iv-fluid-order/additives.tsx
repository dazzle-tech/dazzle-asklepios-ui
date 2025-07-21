import React, { useState } from 'react';
import { Form } from 'rsuite';
import { initialListRequest, ListRequest } from '@/types/types';
import './styles.less';
import { faSyringe } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MdDelete } from 'react-icons/md';
import { MdModeEdit } from 'react-icons/md';
import PlusIcon from '@rsuite/icons/Plus';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import ChildModal from '@/components/ChildModal';
import { useGetActiveIngredientQuery } from '@/services/medicationsSetupService';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
const Additives = ({ open, setOpen }) => {
  const [openChildModal, setOpenChildModal] = useState<boolean>(false);
  const [additive, setAdditive] = useState({});
  const [openConfirmDeleteModel, setOpenConfirmDeleteModel] = useState<boolean>(false);

  const { data: unitsLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const [activeIngredientsListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  const { data: activeIngredientListResponseData } = useGetActiveIngredientQuery(
    activeIngredientsListRequest
  );
  
  // dummy data
  const data = [
    { key: '1', activeIngredient: 'Naproxen', dose: '3', unit: 'ml' },
    { key: '2', activeIngredient: 'Amlodipine', dose: '4', unit: 'ml' },
    { key: '3', activeIngredient: 'Ibuprofen', dose: '5', unit: 'ml' }
  ];

  // Class name of selected row
  const isSelected = rowData => {
    if (rowData && additive && rowData.key === setAdditive.key) {
      return 'selected-row';
    } else return '';
  };

  // Icons column (Edit, reactive/Deactivate)
  const iconsForActions = () => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setOpenChildModal(true);
        }}
      />
      <MdDelete className="icons-style" title="Delete" size={24} fill="var(--primary-pink)" onClick={() => setOpenConfirmDeleteModel(true)} />
    </div>
  );

  // handle click on Add New button
  const handleNew = () => {
    setAdditive({});
    setOpenChildModal(true);
  };

  //Table columns
  const tableColumns = [
    {
      key: 'activeIngredient',
      title: <Translate>Active Ingredient</Translate>
    },
    {
      key: 'dose',
      title: <Translate>Dose</Translate>
    },
    {
      key: 'unit',
      title: <Translate>Unit</Translate>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: () => iconsForActions()
    }
  ];

  // Main modal content
  const conjureFormMainContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <div>
            <div className="container-of-add-new-button">
              <MyButton
                color="var(--deep-blue)"
                prefixIcon={() => <PlusIcon />}
                onClick={handleNew}
                width="109px"
              >
                Add New
              </MyButton>
            </div>
            <MyTable
              height={450}
              data={data}
              columns={tableColumns}
              rowClassName={isSelected}
              onRowClick={rowData => {
                setAdditive(rowData);
              }}
            />
            <DeletionConfirmationModal
                         open={openConfirmDeleteModel}
                         setOpen={setOpenConfirmDeleteModel}
                         itemToDelete='Additive'
                        actionButtonFunction=""
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
              placeholder="Select A.I"
              selectDataValue="key"
              selectDataLabel="name"
              selectData={activeIngredientListResponseData?.object ?? []}
              fieldName="activeIngredientKey"
              fieldType="select"
              record={additive}
              setRecord={setAdditive}
              menuMaxHeight={200}
              width="100%"
            />
            <MyInput
              fieldName="dose"
              fieldType="number"
              record={additive}
              setRecord={setAdditive}
              width="100%"
            />
            <MyInput
              fieldName="unit"
              fieldType="select"
              selectData={unitsLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={additive}
              setRecord={setAdditive}
              width="100%"
              menuMaxHeight={200}
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
      title="Additives"
      mainContent={conjureFormMainContent}
      actionChildButtonFunction=""
      hideActionBtn
      childTitle={additive?.key ? 'Edit Additive' : 'New Additive'}
      childContent={conjureFormChildContent}
      mainSize="sm"
      mainStep={[{ title: 'Additives', icon: <FontAwesomeIcon icon={faSyringe} /> }]}
      childStep={[{ title: 'Additive Info', icon: <FontAwesomeIcon icon={faSyringe} /> }]}
    />
  );
};
export default Additives;
