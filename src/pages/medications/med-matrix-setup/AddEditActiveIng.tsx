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
import { useGetActiveIngredientQuery, useSaveMedicationCategoriesActiveIngredientMutation, useSaveMedicationCategoriesClassMutation, useSaveMedicationCategoriesMutation } from '@/services/medicationsSetupService';
import { useAppDispatch } from '@/hooks';
import { hideLoading, notify, showLoading } from '@/utils/uiReducerActions';
import { newApMedicationCategoriesActiveIngredient, newApMedicationCategoriesClass } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';

const AddEditActiveIng = ({
  open,
  setOpen,
  medCatAI,
  setMedCatAI,
  edit_new,
  setEdit_new,
  refetch,
  medCat,
  medClass
}) => {

    const [activeIngredientsListRequest, setActiveIngredientsListRequest] = useState<ListRequest>({
        ...initialListRequest
      });
    const [selectedAI, setSelectedAI] = useState([]);
    const { data: activeIngredientListResponseData } = useGetActiveIngredientQuery(activeIngredientsListRequest);
    const [medAI, medAIListMutation] = useSaveMedicationCategoriesActiveIngredientMutation();
    const dispatch = useAppDispatch();
     const handleAction = () => {
          {
            medAI({
                medicationCategoriesActiveIngredient: { ...medCatAI, therapeuticCategoryKey: medCat.key  ,medicationClassKey: medClass.key },
                ai: selectedAI
              }).unwrap()
                  .then(() => {
                    refetch();
                    setMedCatAI({...newApMedicationCategoriesActiveIngredient});
                       dispatch(notify({ msg: 'Active Ingredient Added Successfully', sev: 'success' }));
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
                fieldLabel="Active Ingredient"
                selectData={activeIngredientListResponseData?.object ?? []}
                fieldType="multyPicker"
                selectDataLabel="name"
                selectDataValue="key"
                fieldName="activeIngredientList"
                record={medCatAI}
                setRecord={setMedCatAI}
              />
      </div>
    </Form>
        );
    }
  };

  useEffect(() => {
      if (medCatAI) {
        setSelectedAI(medCatAI.activeIngredientList);
      } else {
        setMedCatAI(newApMedicationCategoriesActiveIngredient);
      }
    }, [medCatAI]);

  return (
    <Form> 
  <MyModal 
            open={open}
            setOpen={setOpen}
            title="New/Edit Active Ingredient"
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
export default AddEditActiveIng;