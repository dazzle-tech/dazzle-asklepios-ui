import MyModal from '@/components/MyModal/MyModal';
import React, { useState, useEffect } from 'react';
import MyInput from '@/components/MyInput';
import { HiDocumentDuplicate } from 'react-icons/hi2';
import { Form } from 'rsuite';
import './styles.less';
import { useEnumByName } from '@/services/enumsApi';
import { formatEnumString } from '@/utils';

const AddEditRule = ({ open, setOpen, width, candidate, setCandidate, handleSave }) => {
  const fieldsEnum = useEnumByName("DuplicationField");
  const [fieldsState, setFieldsState] = useState<Record<string, boolean>>({});

  const formatLabel = (text: string) => {
    return text
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => {
        if (word.toLowerCase() === 'dob') return 'DOB';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  useEffect(() => {
    if (fieldsEnum && fieldsEnum.length > 0 && open) {
      const defaults = fieldsEnum.reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {} as Record<string, boolean>);

      const initial = candidate?.fields ? { ...defaults, ...candidate.fields } : defaults;
      setFieldsState(initial);
    }
  }, [fieldsEnum, open]);

  useEffect(() => {
    if (Object.keys(fieldsState).length > 0) {
      setCandidate((prev) => ({
        ...prev,
        fields: fieldsState,
      }));
    }
  }, [fieldsState, setCandidate]);

  const conjureFormContent = () => (
    <Form fluid>
      <div className="container-of-fields-column">
        {fieldsEnum?.map((field) => (
          <div key={field} className="field-column-item">
            <label className="field-label-add-edit-rule">
              {formatLabel(field)}
            </label>

            <MyInput
              width="auto"
              fieldName={field}
              fieldType="checkbox"
              fieldLabel={formatEnumString(field)}
              showLabel={false}
              record={fieldsState}
              setRecord={setFieldsState}
            />
          </div>
        ))}
      </div>
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={candidate?.id ? 'Edit Rule' : 'New Rule'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={candidate?.id ? 'Save' : 'Create'}
      actionButtonFunction={() => {
        setCandidate({ ...candidate, fields: fieldsState });
        handleSave();
      }}
      steps={[{ title: 'Rule Info', icon: <HiDocumentDuplicate /> }]}
      size={width > 600 ? '30vw' : '70vw'}
    />
  );
};

export default AddEditRule;
