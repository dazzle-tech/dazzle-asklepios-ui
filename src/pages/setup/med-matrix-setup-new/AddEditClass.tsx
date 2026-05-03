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
              width={"100%"}
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

              // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <Form>
      <MyModal
        open={open}
        setOpen={setOpen}
        title="New/Edit Medication Class"
        size="33vw"
        bodyheight="65vh"
        content={<div dir={dir}>{conjureFormContentOfModal()}</div>}
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
