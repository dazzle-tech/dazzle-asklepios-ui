import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { MdSick } from 'react-icons/md';
const AddEditAllergens = ({ open, setOpen, width, allergens, setAllergens, handleSave }) => {
  // Fetch allergens Type Lov response
  const { data: allergensTypeLovQueryResponse } = useGetLovValuesByCodeQuery('ALLERGEN_TYPES');
  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              width="100%"
              fieldName="allergenCode"
              record={allergens}
              setRecord={setAllergens}
            />
            <MyInput
              width="100%"
              fieldName="allergenName"
              record={allergens}
              setRecord={setAllergens}
            />
            <div className="container-of-two-fields-allergens">
              <div className="container-of-field-allergens">
                <MyInput
                  width="100%"
                  fieldName="allergenTypeLkey"
                  fieldType="select"
                  selectData={allergensTypeLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
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
      title={allergens?.key ? 'Edit Allergens' : 'New Allergens'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={allergens?.key ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Allergens Info', icon: <MdSick /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditAllergens;
