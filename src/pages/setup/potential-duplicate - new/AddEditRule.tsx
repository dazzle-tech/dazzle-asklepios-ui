import MyModal from '@/components/MyModal/MyModal';
import React, { useState, useEffect } from 'react';
import MyInput from '@/components/MyInput';
import { HiDocumentDuplicate } from 'react-icons/hi2';
import { Form } from 'rsuite';
import './styles.less';
import { useEnumByName } from '@/services/enumsApi';

const AddEditRule = ({ open, setOpen, width, candidate, setCandidate, handleSave }) => {
  const fieldsEnum = useEnumByName("DuplicationField");
  const [fieldsState, setFieldsState] = useState<Record<string, boolean>>({});

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
      <div className="container-of-three-fields-potintial">
        {fieldsEnum?.map((field) => (
          <div key={field} className="container-of-field-potintial">
            <MyInput
              width="100%"
              fieldName={field}
              fieldLabel={field.replace(/_/g, ' ')}
              fieldType="checkbox"
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
      actionButtonFunction={()=>{
        setCandidate({...candidate ,fields:fieldsState})
        handleSave();}}
      steps={[{ title: 'Rule Info', icon: <HiDocumentDuplicate /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};

export default AddEditRule;
