import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { FaLayerGroup } from 'react-icons/fa6';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import {
  SurveySection,
  useCreateSurveySectionMutation,
  useUpdateSurveySectionMutation
} from '@/services/setup/survey-question/surveySectionService';

const SECTION_ERROR_MAP: Record<string, string> = {
  notfound: 'Survey section not found.'
};

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  width: number;
  section: SurveySection;
  setSection: (v: SurveySection) => void;
};

const AddEditSurveySection = ({ open, setOpen, width, section, setSection }: Props) => {
  const dispatch = useAppDispatch();
  const [createSection, { isLoading: isCreating }] = useCreateSurveySectionMutation();
  const [updateSection, { isLoading: isUpdating }] = useUpdateSurveySectionMutation();

  const handleSave = async () => {
    const missing: string[] = [];
    if (!section?.nameEn?.trim()) missing.push('Name (English)');
    if (!section?.nameAr?.trim()) missing.push('Name (Arabic)');
    if (section?.displayOrder === null || String(section?.displayOrder ?? '').trim() === '') missing.push('Order');

    if (missing.length > 0) {
      dispatch(notify({ msg: `Please fill required fields:\n${missing.join(', ')}`, sev: 'warning' }));
      return;
    }

    if (Number(section.displayOrder) < 1) {
      dispatch(notify({ msg: 'Order must be at least 1', sev: 'warning' }));
      return;
    }

    const body = {
      nameEn: section.nameEn.trim(),
      nameAr: section.nameAr.trim(),
      displayOrder: Number(section.displayOrder)
    };

    try {
      if (section?.id) {
        await updateSection({ id: section.id, ...body }).unwrap();
        dispatch(notify({ msg: 'Survey section updated successfully', sev: 'success' }));
      } else {
        await createSection(body).unwrap();
        dispatch(notify({ msg: 'Survey section created successfully', sev: 'success' }));
      }
      setOpen(false);
    } catch (err: any) {
      const key = String(err?.data?.message ?? '').replace(/^error\./, '');
      dispatch(
        notify({
          msg: SECTION_ERROR_MAP[key] || err?.data?.detail || err?.data?.title || 'Failed to save survey section',
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
        fieldType="text"
        fieldName="nameEn"
        fieldLabel="Name (English)"
        record={section}
        setRecord={setSection}
        required
      />

      <div dir="rtl">
        <MyInput
          width="100%"
          fieldType="text"
          fieldName="nameAr"
          fieldLabel="Name (Arabic)"
          record={section}
          setRecord={setSection}
          required
        />
      </div>

      <MyInput
        width="100%"
        fieldType="number"
        fieldName="displayOrder"
        fieldLabel="Order"
        record={section}
        setRecord={setSection}
        required
      />
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={section?.id ? 'Edit Survey Section' : 'New Survey Section'}
      position="right"
      content={() => content()}
      actionButtonLabel={section?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      isDisabledActionBtn={isCreating || isUpdating}
      steps={[{ title: 'Survey Section Info', icon: <FaLayerGroup /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};

export default AddEditSurveySection;
