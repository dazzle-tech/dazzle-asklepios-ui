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


            <div className="container-of-two-fields-allergens">
              <div className="container-of-field-allergens">
            <MyInput
              required
              width="100%"
              fieldName="code"
              record={allergens}
              setRecord={setAllergens}
            />
              </div>
              <div className="container-of-field-allergens">
                <MyInput
                  width="100%"
                  fieldName="description"
                  record={allergens}
                  setRecord={setAllergens}
                />
              </div>
            </div>
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={allergens?.id ? 'Edit Allergens' : 'New Allergens'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={allergens?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Allergens Info', icon: <MdSick /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditAllergens;
