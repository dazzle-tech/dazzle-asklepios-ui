import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useAddMedicationCategoryMutation, useUpdateMedicationCategoryMutation } from '@/services/setup/medication-categories/MedicationCategoriesService';
import { newMedicationCategory } from '@/types/model-types-constructor-new';

const AddEditMedCat = ({ open, setOpen, medCategory, setMedCategory, edit_new, refetch }) => {
  const [addMedCategories] = useAddMedicationCategoryMutation();
  const [updateMedCategories] = useUpdateMedicationCategoryMutation();
  const dispatch = useAppDispatch();
  const handleSaveAction = async () => {
    if (!medCategory?.id)
      await addMedCategories({
        ...medCategory
      })
        .unwrap()
        .then(() => {
          refetch();
          setMedCategory({ ...newMedicationCategory });
          dispatch(notify({ msg: 'Categories Added Successfully', sev: 'success' }));
        });
    else
      await updateMedCategories({
        ...medCategory
      })
        .unwrap()
        .then(() => {
          refetch();
          setMedCategory({ ...newMedicationCategory });
          dispatch(notify({ msg: 'Categories Updated Successfully', sev: 'success' }));
        });
  };

  const conjureFormContentOfModal = () => {
    if (edit_new) {
      return (
        <Form layout="inline" fluid>
          <div className="container-of-two-fields-vaccine">
            <MyInput
              width={250}
              column
              fieldLabel="Name"
              fieldName="name"
              record={medCategory}
              setRecord={setMedCategory}
            />
          </div>
        </Form>
      );
    }
  };

  return (
    <Form>
      <MyModal
        open={open}
        setOpen={setOpen}
        title="New/Edit Therapeutic Category "
        size="sm"
        bodyheight="65vh"
        content={conjureFormContentOfModal}
        hideCancel={false}
        hideBack={true}
        steps={[{ title: '', icon: <FontAwesomeIcon icon={faPaperclip} /> }]}
        actionButtonLabel="Save"
        actionButtonFunction={() => handleSaveAction()}
      />
    </Form>
  );
};
export default AddEditMedCat;
