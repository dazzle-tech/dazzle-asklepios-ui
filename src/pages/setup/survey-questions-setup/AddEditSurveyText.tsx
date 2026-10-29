import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { FaLanguage } from 'react-icons/fa6';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import {
  SurveyText,
  useCreateSurveyTextMutation,
  useUpdateSurveyTextMutation
} from '@/services/setup/survey-question/surveyTextService';

const TEXT_ERROR_MAP: Record<string, string> = {
  keyexists: 'A text already exists with this key.',
  notfound: 'Survey text not found.'
};

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  width: number;
  text: SurveyText;
  setText: (v: SurveyText) => void;
};

const AddEditSurveyText = ({ open, setOpen, width, text, setText }: Props) => {
  const dispatch = useAppDispatch();
  const [createText, { isLoading: isCreating }] = useCreateSurveyTextMutation();
  const [updateText, { isLoading: isUpdating }] = useUpdateSurveyTextMutation();

  const isEdit = !!text?.id;

  const handleSave = async () => {
    const missing: string[] = [];
    if (!isEdit && !text?.textKey?.trim()) missing.push('Key');
    if (!text?.textEn?.trim()) missing.push('Text (English)');
    if (!text?.textAr?.trim()) missing.push('Text (Arabic)');

    if (missing.length > 0) {
      dispatch(notify({ msg: `Please fill required fields:\n${missing.join(', ')}`, sev: 'warning' }));
      return;
    }

    if (!isEdit && !/^[A-Za-z][A-Za-z0-9_]*$/.test(text.textKey.trim())) {
      dispatch(notify({ msg: 'Key can only have letters, numbers and _', sev: 'warning' }));
      return;
    }

    try {
      if (isEdit) {
        await updateText({ id: text.id as number, textEn: text.textEn.trim(), textAr: text.textAr.trim() }).unwrap();
        dispatch(notify({ msg: 'Survey text updated successfully', sev: 'success' }));
      } else {
        await createText({
          textKey: text.textKey.trim(),
          textEn: text.textEn.trim(),
          textAr: text.textAr.trim()
        }).unwrap();
        dispatch(notify({ msg: 'Survey text created successfully', sev: 'success' }));
      }
      setOpen(false);
    } catch (err: any) {
      const key = String(err?.data?.message ?? '').replace(/^error\./, '');
      dispatch(
        notify({
          msg: TEXT_ERROR_MAP[key] || err?.data?.detail || err?.data?.title || 'Failed to save survey text',
          sev: 'error'
        })
      );
    }
  };

  const dir = (localStorage.getItem('direction') || 'LTR') === 'RTL' ? 'rtl' : 'ltr';

  const content = () => (
    <Form fluid dir={dir}>
      {/* The key is fixed after creation: the survey page finds the text by it */}
      <MyInput
        width="100%"
        fieldType="text"
        fieldName="textKey"
        fieldLabel="Key"
        record={text}
        setRecord={setText}
        disabled={isEdit}
        required
      />

      <MyInput
        width="100%"
        fieldType="textarea"
        fieldName="textEn"
        fieldLabel="Text (English)"
        record={text}
        setRecord={setText}
        required
      />

      <div dir="rtl">
        <MyInput
          width="100%"
          fieldType="textarea"
          fieldName="textAr"
          fieldLabel="Text (Arabic)"
          record={text}
          setRecord={setText}
          required
        />
      </div>
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={isEdit ? 'Edit Survey Text' : 'New Survey Text'}
      position="right"
      content={() => content()}
      actionButtonLabel={isEdit ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      isDisabledActionBtn={isCreating || isUpdating}
      steps={[{ title: 'Survey Text Info', icon: <FaLanguage /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};

export default AddEditSurveyText;
