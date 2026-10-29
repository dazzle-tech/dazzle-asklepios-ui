import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { FaClipboardQuestion } from 'react-icons/fa6';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useEnumOptions } from '@/services/enumsApi';
import {
  SurveyQuestion,
  useCreateSurveyQuestionMutation
} from '@/services/setup/survey-question/surveyQuestionService';
import './styles.less';

const QUESTION_ERROR_MAP: Record<string, string> = {
  scalerangeinvalid: 'Min Value must be less than Max Value.',
  scalerangerequired: 'Min Value and Max Value are required for a scale question.',
  sectioninactive: 'Questions cannot be added to an inactive section.'
};

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  width: number;
  sectionId: number;
  question: SurveyQuestion;
  setQuestion: (v: SurveyQuestion) => void;
};

/** Create only: after this, only the order of the question can change */
const AddSurveyQuestion = ({ open, setOpen, width, sectionId, question, setQuestion }: Props) => {
  const dispatch = useAppDispatch();
  const answerTypeOptions = useEnumOptions('SurveyAnswerType');
  const [createQuestion, { isLoading }] = useCreateSurveyQuestionMutation();

  const isScale = question?.answerType === 'SCALE';
  const isFilled = (value: unknown) => value !== null && value !== undefined && String(value).trim() !== '';

  const handleSave = async () => {
    const missing: string[] = [];
    if (!isFilled(question?.displayOrder)) missing.push('Order');
    if (!question?.questionEn?.trim()) missing.push('Question (English)');
    if (!question?.questionAr?.trim()) missing.push('Question (Arabic)');
    if (!question?.answerType) missing.push('Answer Type');
    if (isScale && !isFilled(question.minValue)) missing.push('Min Value');
    if (isScale && !isFilled(question.maxValue)) missing.push('Max Value');

    if (missing.length > 0) {
      dispatch(notify({ msg: `Please fill required fields:\n${missing.join(', ')}`, sev: 'warning' }));
      return;
    }

    if (Number(question.displayOrder) < 1) {
      dispatch(notify({ msg: 'Order must be at least 1', sev: 'warning' }));
      return;
    }

    if (isScale && Number(question.minValue) >= Number(question.maxValue)) {
      dispatch(notify({ msg: 'Min Value must be less than Max Value', sev: 'warning' }));
      return;
    }

    try {
      await createQuestion({
        sectionId,
        displayOrder: Number(question.displayOrder),
        questionEn: question.questionEn.trim(),
        questionAr: question.questionAr.trim(),
        answerType: question.answerType as string,
        isRequired: !!question.isRequired,
        ...(isScale ? { minValue: Number(question.minValue), maxValue: Number(question.maxValue) } : {})
      }).unwrap();
      dispatch(notify({ msg: 'Survey question created successfully', sev: 'success' }));
      setOpen(false);
    } catch (err: any) {
      const key = String(err?.data?.message ?? '').replace(/^error\./, '');
      dispatch(
        notify({
          msg: QUESTION_ERROR_MAP[key] || err?.data?.detail || err?.data?.title || 'Failed to save survey question',
          sev: 'error'
        })
      );
    }
  };

  const dir = (localStorage.getItem('direction') || 'LTR') === 'RTL' ? 'rtl' : 'ltr';

  const content = () => (
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
        width="100%"
        fieldType="textarea"
        fieldName="questionEn"
        fieldLabel="Question (English)"
        record={question}
        setRecord={setQuestion}
        required
      />

      <div dir="rtl">
        <MyInput
          width="100%"
          fieldType="textarea"
          fieldName="questionAr"
          fieldLabel="Question (Arabic)"
          record={question}
          setRecord={setQuestion}
          required
        />
      </div>

      <MyInput
        width="100%"
        fieldType="select"
        fieldName="answerType"
        fieldLabel="Answer Type"
        selectData={answerTypeOptions ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={question}
        setRecord={setQuestion}
        searchable={false}
        required
      />

      <MyInput
        fieldType="checkbox"
        fieldName="isRequired"
        fieldLabel="Required"
        record={question}
        setRecord={setQuestion}
      />

      {isScale && (
        <div className="survey-question-fields">
          <MyInput
            width="100%"
            fieldType="number"
            fieldName="minValue"
            fieldLabel="Min Value"
            record={question}
            setRecord={setQuestion}
            required
          />
          <MyInput
            width="100%"
            fieldType="number"
            fieldName="maxValue"
            fieldLabel="Max Value"
            record={question}
            setRecord={setQuestion}
            required
          />
        </div>
      )}
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="New Survey Question"
      position="right"
      content={() => content()}
      actionButtonLabel="Create"
      actionButtonFunction={handleSave}
      isDisabledActionBtn={isLoading}
      steps={[{ title: 'Survey Question Info', icon: <FaClipboardQuestion /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};

export default AddSurveyQuestion;
