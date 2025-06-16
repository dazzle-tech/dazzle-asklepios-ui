import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { FaFilePrescription } from "react-icons/fa";
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
const AddEditPrescriptionInstructions = ({ open, setOpen, width, prescriptionInstructions, setPrescriptionInstructions, handleSave }) => {

  // Fetch age group Lov response
  const { data: ageGroupLovQueryResponse} = useGetLovValuesByCodeQuery('AGE_GROUPS'); 
  // Fetch uom Lov response
  const { data: uomLovQueryResponse} = useGetLovValuesByCodeQuery('UOM'); 
  // Fetch med rout Lov response
  const { data: medRoutLovQueryResponse} = useGetLovValuesByCodeQuery('MED_ROA'); 
  // Fetch med Freq Lov response
  const { data: medFreqLovQueryResponse} = useGetLovValuesByCodeQuery('MED_FREQUENCY');
  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
            width="100%"
            fieldName="categoryLkey" 
            fieldType="select"
            selectData={ageGroupLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={prescriptionInstructions}
            setRecord={setPrescriptionInstructions}
            menuMaxHeight={200}
            />
             <div className="container-of-two-fields-prescription">
                <div className="container-of-field-prescription">
            <MyInput width="100%" fieldName="dose" fieldType="number" record={prescriptionInstructions} setRecord={setPrescriptionInstructions} />
            </div>
            <div className="container-of-field-prescription">
            <MyInput
             width="100%"
              fieldName="unitLkey"
              fieldType="select"
              selectData={uomLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={prescriptionInstructions}
              setRecord={setPrescriptionInstructions}
              menuMaxHeight={200}
            />
            </div>
            </div>
             <br/>
             <div className="container-of-two-fields-prescription">
                <div className="container-of-field-prescription">
             <MyInput
              width="100%"
              fieldName="routLkey"
              fieldType="select"
              selectData={medRoutLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={prescriptionInstructions}
              setRecord={setPrescriptionInstructions}
              menuMaxHeight={200}
              />
              </div>
              <div className="container-of-field-prescription">
             <MyInput
              width="100%"
              fieldName="frequencyLkey" 
             fieldType="select"
              selectData={medFreqLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={prescriptionInstructions}
              setRecord={setPrescriptionInstructions} 
              menuMaxHeight={200}
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
      title={prescriptionInstructions?.key ? 'Edit Prescription Instruction' : 'New Prescription Instruction'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={prescriptionInstructions?.key ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Prescription Instruction Info', icon: <FaFilePrescription /> }]} 
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditPrescriptionInstructions;
