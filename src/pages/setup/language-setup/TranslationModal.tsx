import React from 'react';
import { Form, Radio, RadioGroup } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { LanguageTranslation } from '@/types/model-types-new';

interface TranslationModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  valueForm: LanguageTranslation;
  setValueForm: React.Dispatch<React.SetStateAction<LanguageTranslation>>;
  onSave: () => void;
}

export const TranslationModal: React.FC<TranslationModalProps> = ({
  open,
  setOpen,
  valueForm,
  setValueForm,
  onSave
}) => {
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={valueForm?.id ? 'Edit Translation Value' : 'Add Translation Value'}
      size="24vw"
      bodyheight="52vh"
      content={
        <Form fluid>
          <MyInput
            fieldLabel="Key"
            fieldName="translationKey"
            fieldType="text"
            disabled={Boolean(valueForm?.id)}
            record={valueForm}
            setRecord={setValueForm}
            width="100%"
          />
          <MyInput
            fieldLabel="Value"
            fieldName="translationText"
            fieldType="textarea"
            record={valueForm}
            setRecord={setValueForm}
            width="100%"
          />
          <Form.Group>
            <Form.ControlLabel>Verify</Form.ControlLabel>
            <RadioGroup
              inline
              value={valueForm.verified ? 'Y' : 'N'}
              onChange={val => setValueForm(prev => ({ ...prev, verified: val === 'Y' }))}
            >
              <Radio value="Y">Yes</Radio>
              <Radio value="N">No</Radio>
            </RadioGroup>
          </Form.Group>
          <Form.Group>
            <Form.ControlLabel>Translate</Form.ControlLabel>
            <RadioGroup
              inline
              value={valueForm.translated ? 'Y' : 'N'}
              onChange={val =>
                setValueForm(prev => ({
                  ...prev,
                  translated: val === 'Y'
                }))
              }
            >
              <Radio value="Y">Yes</Radio>
              <Radio value="N">No</Radio>
            </RadioGroup>
          </Form.Group>
        </Form>
      }
      actionButtonFunction={onSave}
    />
  );
};
