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
import { useSaveMedicationCategoriesMutation } from '@/services/medicationsSetupService';
import { useAppDispatch } from '@/hooks';
import { hideLoading, notify, showLoading } from '@/utils/uiReducerActions';
import { newApMedicationCategories } from '@/types/model-types-constructor';

const AddEditMedCat = ({
  open,
  setOpen,
  medCategory,
  setMedCategory,
  edit_new,
  setEdit_new,
  refetch
}) => {


    const [medCategories, medCategoriesListMutation] = useSaveMedicationCategoriesMutation();
    const dispatch = useAppDispatch();
     const handleUploadAction = () => {
          {
            medCategories({
                  ...medCategory,
              })
                  .unwrap()
                  .then(() => {
                    refetch();
                      setMedCategory({...newApMedicationCategories});
                       dispatch(notify({ msg: 'Categories Added Successfully', sev: 'success' }));
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
          fieldName="medCategoriesName"
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
            steps={[{ title: "", icon: <FontAwesomeIcon icon={faPaperclip }/>}]}
            actionButtonLabel="Save"
            actionButtonFunction={() => handleUploadAction()}
            // isDisabledActionBtn={actionType ? false : !uploadedAttachmentOpject?.formData}
        />
        </Form>
  ); 

};
export default AddEditMedCat;