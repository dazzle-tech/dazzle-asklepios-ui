import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { BiQuestionMark } from 'react-icons/bi';
import { useAppDispatch } from '@/hooks';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApVaccine } from '@/types/model-types';
import './styles.less';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import AddEditQuestionnaire from './AddEditQuestionnaire';
import Questions from './Questions';
const Questionnaire = () => {
  const dispatch = useAppDispatch();
  const [questionnaire, setQuestionnaire] = useState({});
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openConfirmDeleteQuestionnaireModal, setOpenConfirmDeleteQuestionnaireModal] =
      useState<boolean>(false);
    const [stateOfDeleteQuestionnaireModal, setStateOfDeleteQuestionnaireModal] = useState<string>('delete');
  const [openAddEditQuestionnairePopup, setOpenAddEditQuestionnairePopup] =
    useState<boolean>(false);
  const [openQestionsPopup, setOpenQestionsPopup] = useState<boolean>(false);
  const data = [
    {
      key: '1',
      questionnaireName: 'name1',
      questionnaireType: 'type1',
      sequenceOrFullView: 'seq',
      isValid: true
    },
    {
      key: '2',
      questionnaireName: 'name2',
      questionnaireType: 'type2',
      sequenceOrFullView: 'fv',
      isValid: true
    },
    {
      key: '3',
      questionnaireName: 'name3',
      questionnaireType: 'type3',
      sequenceOrFullView: 'seq',
      isValid: true
    },
    {
      key: '4',
      questionnaireName: 'name4',
      questionnaireType: 'type4',
      sequenceOrFullView: 'fv',
      isValid: false
    }
  ];
  // class name for selected row
  const isSelected = rowData => {
    if (rowData && questionnaire && questionnaire.key === rowData.key) {
      return 'selected-row';
    } else return '';
  };

  // Icons column (Edit,Does Schedule, reactive/Deactivate)
  const iconsForActions = (rowData: ApVaccine) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setOpenAddEditQuestionnairePopup(true)}
      />
      <BiQuestionMark
        className="icons-style"
        title="Questions"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setOpenQestionsPopup(true)}
      />
      {rowData?.isValid ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteQuestionnaireModal('deactivate');
            setOpenConfirmDeleteQuestionnaireModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={22}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteQuestionnaireModal('reactivate');
            setOpenConfirmDeleteQuestionnaireModal(true);
          }}
        />
      )}
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'questionnaireName',
      title: <Translate>Questionnaire Name</Translate>
    },
    {
      key: 'questionnaireType',
      title: <Translate>Questionnaire Type</Translate>
    },
    {
      key: 'sequenceOrFullView',
      title: <Translate>Sequence or Full View</Translate>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];
  // Effects
   useEffect(() => {
      // Header page setUp
      const divContent = (
       "Questionnaire"
      );
      dispatch(setPageCode('Questionnaire'));
      dispatch(setDivContent(divContent));
  
      return () => {
        dispatch(setPageCode(''));
        dispatch(setDivContent(''));
      };
    }, [dispatch]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Panel>
      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={() => setOpenAddEditQuestionnairePopup(true)}
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
          setQuestionnaire(rowData);
        }}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteQuestionnaireModal}
        setOpen={setOpenConfirmDeleteQuestionnaireModal}
        itemToDelete="Questionnaire"
        actionButtonFunction=""
        actionType={stateOfDeleteQuestionnaireModal}
      />
      <AddEditQuestionnaire
        open={openAddEditQuestionnairePopup}
        setOpen={setOpenAddEditQuestionnairePopup}
        questionnaire={questionnaire}
        setQuestionnaire={setQuestionnaire}
        width={width}
      />
      <Questions
        open={openQestionsPopup}
        setOpen={setOpenQestionsPopup}
        questionnaire={questionnaire}
      />
    </Panel>
  );
};

export default Questionnaire;
