import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useAddMedicationCategoryClassMutation, useUpdateMedicationCategoryClassMutation } from '@/services/setup/medication-categories/MedicationCategoriesClassService';
import { newMedicationCategoryClass } from '@/types/model-types-constructor-new';

const AddEditClass = ({
  open,
  setOpen,
  medClass,
  medicationcategory,
  setMedClass,
  edit_new,
  refetch
}) => {
  const [addMedClasss] = useAddMedicationCategoryClassMutation();
  const [updateMedClasss] = useUpdateMedicationCategoryClassMutation();
  const dispatch = useAppDispatch();
  const handleAction = async () => {
    const med = { ...medClass, medicationCategoriesId: medicationcategory?.id };
    if(!med?.id)
    await addMedClasss(med)
      .unwrap()
      .then(() => {
        refetch();
        setMedClass({ ...newMedicationCategoryClass });
        dispatch(notify({ msg: 'class Added Successfully', sev: 'success' }));
      });
      else
        await updateMedClasss(med)
      .unwrap()
      .then(() => {
        refetch();
        setMedClass({ ...newMedicationCategoryClass });
        dispatch(notify({ msg: 'class Updated Successfully', sev: 'success' }));
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
              record={medClass}
              setRecord={setMedClass}
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
        title="New/Edit Medication Class"
        size="sm"
        bodyheight="65vh"
        content={conjureFormContentOfModal}
        hideCancel={false}
        hideBack={true}
        steps={[{ title: '', icon: <FontAwesomeIcon icon={faPaperclip} /> }]}
        actionButtonLabel="Save"
        actionButtonFunction={() => handleAction()}
      />
    </Form>
  );
};
export default AddEditClass;
