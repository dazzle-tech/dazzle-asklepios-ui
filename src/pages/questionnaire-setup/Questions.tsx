import React, { useState } from 'react';
import { Form } from 'rsuite';
import './styles.less';
import ChildModal from '@/components/ChildModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { BiQuestionMark } from 'react-icons/bi';
import MyButton from '@/components/MyButton/MyButton';
import { MdDelete } from 'react-icons/md';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit } from 'react-icons/md';
import AddEditQuestione from './AddEditQuestion';

const Questions = ({ open, setOpen, questionnaire }) => {
  const [showChild, setShowChild] = useState<boolean>(false);
  const [questione, setQuestione] = useState({});
 
  // dummy data
  const data = [
    { key: '1', questionNumber: 'Q1', questionContent: 'Con1', answerOption: 'textarea' },
    { key: '2', questionNumber: 'Q2', questionContent: 'Con2', answerOption: 'textfield' },
    { key: '3', questionNumber: 'Q3', questionContent: 'Con3', answerOption: 'lov' }
  ];

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && questione && rowData.key === questione.key) {
      return 'selected-row';
    } else return '';
  };

  // Icons column (Edit, Remove)
  const iconsForActions = () => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setShowChild(true);
        }}
      />
      <MdDelete
        className="icons-style"
        title="Remove"
        size={24}
        fill="var(--primary-pink)"
      />
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'questionNumber',
      title: <Translate>Question Number</Translate>
    },
    {
      key: 'questionContent',
      title: <Translate>Question Content</Translate>
    },
    {
      key: 'answerOption',
      title: <Translate>Answer Option</Translate>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: () => iconsForActions()
    }
  ];

  const handleAddNew = () => {
   setShowChild(true);
   setQuestione({});
  };

  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form layout="inline" fluid>
            <div className="container-of-add-new-button">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={handleAddNew}
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
                setQuestione(rowData);
              }}
            />
          </Form>
        );
    }
  };
  // Child modal content
  const conjureFormContentOfChildModal = () => {
    return (
      <AddEditQuestione
        question={questione}
        setQuestion={setQuestione}
      />
    );
  };
  // Effects

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <ChildModal
      actionButtonLabel={questionnaire?.key ? 'Save' : 'Create'}
      hideActionBtn
      open={open}
      setOpen={setOpen}
      showChild={showChild}
      setShowChild={setShowChild}
      title="Questions"
      mainContent={(stepNumber) => (
        <div dir={dir}>
          {conjureFormContentOfMainModal(stepNumber)}
        </div>
      )}
      mainStep={[{ title: 'Questions', icon: <BiQuestionMark /> }]}
      childStep={[{ title: 'Question Info', icon: <BiQuestionMark /> }]}
      childTitle={questione?.key ? 'Edit Question' : 'New Question'}
      childContent={conjureFormContentOfChildModal}
      mainSize="sm"
    />
  );
};
export default Questions;
