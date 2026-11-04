import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { MdSick } from 'react-icons/md';
import { useEnumOptions } from '@/services/enumsApi';

const AddEditAllergens = ({ open, setOpen, width, allergens, setAllergens, handleSave }) => {
  // Fetch allergen type enum options
  const allergenTypeOptions = useEnumOptions('AllergenType');
  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
              <MyInput
                required
                width="100%"
                fieldName="type"
                fieldType="select"
                selectData={allergenTypeOptions ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                record={allergens}
                setRecord={setAllergens}
              />
            <MyInput
              required
              width="100%"
              fieldName="name"
              record={allergens}
              setRecord={setAllergens}
            />
                <MyInput
                  width="100%"
                  fieldName="description"
                  record={allergens}
                  setRecord={setAllergens}
                />
        
          </Form>
        );
    }
  };

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={allergens?.id ? 'Edit Allergens' : 'New Allergens'}
      position="right"
      content={(stepNumber) => (<div dir={dir}>{conjureFormContent(stepNumber)}</div>)}
      actionButtonLabel={allergens?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Allergens Info', icon: <MdSick /> }]}
      size={'40vw'}
    />
  );
};
export default AddEditAllergens;
