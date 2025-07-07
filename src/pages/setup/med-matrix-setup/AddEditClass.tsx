import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { useGetResourceTypeQuery } from '@/services/appointmentService';
import { GrScheduleNew } from "react-icons/gr";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyButton from '@/components/MyButton/MyButton';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { useSaveMedicationCategoriesClassMutation, useSaveMedicationCategoriesMutation } from '@/services/medicationsSetupService';
import { useAppDispatch } from '@/hooks';
import { hideLoading, notify, showLoading } from '@/utils/uiReducerActions';
import { newApMedicationCategoriesClass } from '@/types/model-types-constructor';

const AddEditClass = ({
  open,
  setOpen,
  medClass,
  setMedClass,
  edit_new,
  setEdit_new,
  refetch,
  medCat
}) => {


    const [medClasss, medClassListMutation] = useSaveMedicationCategoriesClassMutation();
    const dispatch = useAppDispatch();
     const handleAction = () => {
          {
            medClasss({
                  ...medClass,
                  therapeuticCategoryKey: medCat.key
              })
                  .unwrap()
                  .then(() => {
                    refetch();
                    setMedClass({...newApMedicationCategoriesClass});
                       dispatch(notify({ msg: 'class Added Successfully', sev: 'success' }));
                  });
          }
      };

  const conjureFormContentOfModal = () => {
    if(edit_new) {
     return (
      <Form layout="inline" fluid>
      <div className="container-of-two-fields-vaccine">
        <MyInput
          width={250}
          column
          fieldLabel="Name"
          fieldName="className"
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
            steps={[{ title: "", icon: <FontAwesomeIcon icon={faPaperclip }/>}]}
            actionButtonLabel="Save"
            actionButtonFunction={() => handleAction()}
            // isDisabledActionBtn={actionType ? false : !uploadedAttachmentOpject?.formData}
        />
        </Form>
  ); 

};
export default AddEditClass;