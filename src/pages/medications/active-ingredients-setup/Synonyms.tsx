import React, { useState } from 'react';
import { Text, Form } from 'rsuite';
import { MdDelete } from 'react-icons/md';
import { Plus } from '@rsuite/icons';
import { MdModeEdit } from 'react-icons/md';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import './styles.less';
const Synonyms = ({ activeIngredients }) => {
  const [inputRecord, setInputRecord] = useState({ synonyms: '' });
  const [list, setList] = useState([]);
  const [openConfirmDeleteSynonymsModal, setOpenConfirmDeleteSynonymsModal] =
    useState<boolean>(false);

  // Icons column (edit, remove)
  const iconsForActions = () => (
    <div className="container-of-icons">
      <MdModeEdit className="icons-style" title="Edit" size={24} fill="var(--primary-gray)" />
      <MdDelete
        className="icons-style"
        title="Delete"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => setOpenConfirmDeleteSynonymsModal(true)}
      />
    </div>
  );

  // handle add new item
  const handleAddItem = () => {
    if (inputRecord['synonyms'].trim() !== '') {
      setList([...list, { synonyms: inputRecord['synonyms'] }]);
      setInputRecord({ synonyms: '' });
    }
  };

  //Table columns
  const tableColumns = [
    {
      key: 'synonyms',
      title: <Translate>Synonyms</Translate>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      render: () => iconsForActions()
    }
  ];

  if (activeIngredients.hasSynonyms) {
    return (
      <Form>
        <div className="container-of-fields-active">
          <MyInput
            fieldName="synonyms"
            record={inputRecord}
            setRecord={setInputRecord}
            width="100%"
          />
          <MyButton
            prefixIcon={() => <Plus />}
            color="var(--deep-blue)"
            onClick={handleAddItem}
            title="Add"
          >
            Add
          </MyButton>
        </div>
        <br />
        <MyTable noBorder height={450} data={list} columns={tableColumns} />
        <DeletionConfirmationModal
          open={openConfirmDeleteSynonymsModal}
          setOpen={setOpenConfirmDeleteSynonymsModal}
          itemToDelete="Synonyms"
          actionButtonFunction=""
          actionType="Delete"
        />
      </Form>
    );
  } else {
    return <Text>Does not have synonyms</Text>;
  }
};

export default Synonyms;
