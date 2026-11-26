import React, { useState } from 'react';
import { Form, Tooltip, Whisper } from 'rsuite';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { FaClipboardQuestion } from 'react-icons/fa6';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import Translate from '@/components/Translate';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { formatEnumString } from '@/utils';
import { SurveySection } from '@/services/setup/survey-question/surveySectionService';
import {
  SurveyQuestion,
  newSurveyQuestion,
  useGetSurveyQuestionsBySectionQuery,
  useToggleSurveyQuestionActiveMutation,
  useUpdateSurveyQuestionMutation
} from '@/services/setup/survey-question/surveyQuestionService';
import AddSurveyQuestion from './AddSurveyQuestion';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  width: number;
  section: SurveySection;
};

/** The questions of one section: add, edit the order and isRequired, deactivate */
const SectionQuestionsModal = ({ open, setOpen, width, section }: Props) => {
  const dispatch = useAppDispatch();

  const [question, setQuestion] = useState<SurveyQuestion>({ ...newSurveyQuestion });
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'reactivate'>('deactivate');

  const { data: questions = [], isFetching } = useGetSurveyQuestionsBySectionQuery(section?.id as number, {
    skip: !open || !section?.id
  });

  const [toggleActive] = useToggleSurveyQuestionActiveMutation();
  const [updateQuestion, { isLoading: isUpdating }] = useUpdateSurveyQuestionMutation();

  const errorMessage = (err: any, fallback: string) => err?.data?.detail || fallback;

  // A new question goes after the last active one by default
  const handleNew = () => {
    const lastOrder = Math.max(
      0,
      ...questions.filter(q => q.isActive).map(q => Number(q.displayOrder) || 0)
    );
    setQuestion({ ...newSurveyQuestion, displayOrder: lastOrder + 1 });
    setOpenAdd(true);
  };

  const handleToggle = async () => {
    if (!question?.id) return;
    try {
      await toggleActive(question.id).unwrap();
      dispatch(
        notify({
          msg: question.isActive ? 'Survey question deactivated' : 'Survey question activated',
          sev: 'success'
        })
      );
    } catch (err: any) {
      dispatch(notify({ msg: errorMessage(err, 'Failed to update status'), sev: 'error' }));
    } finally {
      setOpenConfirm(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!question?.id) return;
    if (!question.displayOrder || Number(question.displayOrder) < 1) {
      dispatch(notify({ msg: 'Order must be at least 1', sev: 'warning' }));
      return;
    }
    try {
      await updateQuestion({
        id: question.id,
        displayOrder: Number(question.displayOrder),
        isRequired: !!question.isRequired
      }).unwrap();
      dispatch(notify({ msg: 'Survey question updated successfully', sev: 'success' }));
      setOpenEdit(false);
    } catch (err: any) {
      dispatch(notify({ msg: errorMessage(err, 'Failed to update survey question'), sev: 'error' }));
    }
  };

  // Edit changes only the order and isRequired
  const iconsForActions = (row: SurveyQuestion) => (
    <div className="container-of-icons">
      <Whisper placement="top" speaker={<Tooltip><Translate>Edit</Translate></Tooltip>}>
        <MdModeEdit
          className="icons-style"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setQuestion({ ...row });
            setOpenEdit(true);
          }}
        />
      </Whisper>
      {row?.isActive ? (
        <Whisper placement="top" speaker={<Tooltip><Translate>Deactivate</Translate></Tooltip>}>
          <MdDelete
            className="icons-style"
            size={24}
            fill="var(--primary-pink)"
            onClick={() => {
              setQuestion({ ...row });
              setConfirmAction('deactivate');
              setOpenConfirm(true);
            }}
          />
        </Whisper>
      ) : (
        <Whisper placement="top" speaker={<Tooltip><Translate>Activate</Translate></Tooltip>}>
          <FaUndo
            className="icons-style"
            size={22}
            fill="var(--primary-gray)"
            onClick={() => {
              setQuestion({ ...row });
              setConfirmAction('reactivate');
              setOpenConfirm(true);
            }}
          />
        </Whisper>
      )}
    </div>
  );

  const tableColumns = [
    {
      key: 'displayOrder',
      title: <Translate>Order</Translate>,
      flexGrow: 1
    },
    {
      key: 'questionEn',
      title: <Translate>Question (English)</Translate>,
      flexGrow: 5
    },
    {
      key: 'questionAr',
      title: <Translate>Question (Arabic)</Translate>,
      flexGrow: 5,
      render: (row: SurveyQuestion) => <span dir="rtl">{row?.questionAr}</span>
    },
    {
      key: 'answerType',
      title: <Translate>Answer Type</Translate>,
      flexGrow: 2,
      render: (row: SurveyQuestion) => formatEnumString(row?.answerType) || '-'
    },
    {
      key: 'scaleRange',
      title: <Translate>Scale Range</Translate>,
      flexGrow: 2,
      // e.g. "1 - 5"; TEXT questions have no range
      render: (row: SurveyQuestion) =>
        row?.answerType === 'SCALE' ? `${row.minValue} - ${row.maxValue}` : '-'
    },
    {
      key: 'isRequired',
      title: <Translate>Required</Translate>,
      flexGrow: 1,
      render: (row: SurveyQuestion) => <Translate>{row?.isRequired ? 'Yes' : 'No'}</Translate>
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 2,
      render: (row: SurveyQuestion) =>
        row?.isActive ? (
          <MyBadgeStatus contant="Active" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="Inactive" color="#969fb0" />
        )
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 2,
      render: (row: SurveyQuestion) => iconsForActions(row)
    }
  ];

  const dir = (localStorage.getItem('direction') || 'LTR') === 'RTL' ? 'rtl' : 'ltr';

  const content = () => (
    <div dir={dir}>
      <MyTable
        height={450}
        data={questions}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={(row: SurveyQuestion) => (row?.id === question?.id ? 'selected-row' : '')}
        onRowClick={(row: SurveyQuestion) => setQuestion(row)}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={handleNew}
              disabled={!section?.isActive}
              width="109px"
            >
              Add New
            </MyButton>
          </div>
        }
      />
    </div>
  );

  return (
    <>
      <MyModal
        open={open}
        setOpen={setOpen}
        title={`${section?.nameEn ?? ''} - Questions`}
        content={content}
        hideActionBtn
        cancelButtonLabel="Close"
        size={width > 600 ? '80vw' : '95vw'}
      />

      {section?.id && (
        <AddSurveyQuestion
          open={openAdd}
          setOpen={setOpenAdd}
          width={width}
          sectionId={section.id}
          question={question}
          setQuestion={setQuestion}
        />
      )}

      <MyModal
        open={openEdit}
        setOpen={setOpenEdit}
        title="Edit Survey Question"
        position="right"
        content={() => (
          <Form fluid dir={dir}>
            <MyInput
              width="100%"
              fieldType="number"
              fieldName="displayOrder"
              fieldLabel="Order"
              record={question}
              setRecord={setQuestion}
              required
            />
            <MyInput
              fieldType="checkbox"
              fieldName="isRequired"
              fieldLabel="Required"
              record={question}
              setRecord={setQuestion}
            />
          </Form>
        )}
        actionButtonLabel="Save"
        actionButtonFunction={handleSaveEdit}
        isDisabledActionBtn={isUpdating}
        steps={[{ title: 'Survey Question Info', icon: <FaClipboardQuestion /> }]}
        size={width > 600 ? '30vw' : '70vw'}
      />

      <DeletionConfirmationModal
        open={openConfirm}
        setOpen={setOpenConfirm}
        itemToDelete="Survey Question"
        actionButtonFunction={handleToggle}
        actionType={confirmAction}
      />
    </>
  );
};

export default SectionQuestionsModal;
