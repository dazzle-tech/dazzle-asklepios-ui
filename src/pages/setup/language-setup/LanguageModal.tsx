import React from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Language } from '@/types/model-types-new';

interface Option {
  label: string;
  value: string;
}

interface LanguageModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  mode: 'add' | 'edit';
  languages: Language;
  setLanguages: React.Dispatch<React.SetStateAction<Language>>;
  directionOptions: Option[];
  onSave: () => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({
  open,
  setOpen,
  mode,
  languages,
  setLanguages,
  directionOptions,
  onSave
}) => {

              // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={mode === 'add' ? 'Add New Language' : 'Edit Language'}
      actionButtonFunction={onSave}
      size="22vw"
      bodyheight="38vh"
      content={
        <Form fluid dir={dir}>
          <MyInput
            fieldLabel="Language Name"
            fieldName="langName"
            fieldType="text"
            record={languages}
            setRecord={setLanguages}
            required
            width={'13vw'}
          />
          <MyInput
            fieldLabel="Language Code"
            fieldName="langKey"
            fieldType="text"
            disabled={Boolean(languages?.id)}
            record={languages}
            setRecord={setLanguages}
            required
            width={'13vw'}
          />
          <MyInput
            required
            column
            fieldLabel="Direction"
            fieldType="select"
            fieldName="direction"
            selectData={directionOptions ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            record={languages}
            setRecord={setLanguages}
            width={'13vw'}
            searchable={false}
          />
        </Form>
      }
    />
  );
};
