import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { FaFilePrescription } from "react-icons/fa";
import { useCreatePrescriptionInstructionMutation, useUpdatePrescriptionInstructionMutation } from '@/services/setup/prescription-instruction/prescriptionInstructionService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useEnumOptions } from '@/services/enumsApi';
const AddEditPrescriptionInstructions = ({ open, setOpen, width, prescriptionInstructions, setPrescriptionInstructions, refetchPrescriotionInstructions }) => {

  const dispatch = useAppDispatch();
  
  const categoryEnumList = useEnumOptions("AgeGroupType");
  const uomEnumList = useEnumOptions("UOM");
  const routEnumList = useEnumOptions("MedRoa");
  const frequencyEnumList = useEnumOptions("MedFrequency");

 const [createPrescriptionInstruction] =
    useCreatePrescriptionInstructionMutation();

    const [updatePrescriptionInstruction] =
    useUpdatePrescriptionInstructionMutation();


    const validatePrescriptionInstruction = () => {
      if (!prescriptionInstructions?.category) {
        dispatch(notify({ msg: 'Category is required', sev: 'warning' }));
        return false;
      }

      if (!prescriptionInstructions?.dose) {
        dispatch(notify({ msg: 'Dose is required', sev: 'warning' }));
        return false;
      }

      if (!prescriptionInstructions?.unit) {
        dispatch(notify({ msg: 'Unit is required', sev: 'warning' }));
        return false;
      }

      if (!prescriptionInstructions?.rout) {
        dispatch(notify({ msg: 'Route is required', sev: 'warning' }));
        return false;
      }

      if (!prescriptionInstructions?.frequency) {
        dispatch(notify({ msg: 'Frequency is required', sev: 'warning' }));
        return false;
      }

      return true;
    };


    const handleSave = () => {
      if (!validatePrescriptionInstruction()) return;

      if (!prescriptionInstructions?.id) {
        createPrescriptionInstruction(prescriptionInstructions)
          .unwrap()
          .then(() => {
            refetchPrescriotionInstructions();
            dispatch(
              notify({
                msg: 'The Prescription Instruction has been created successfully',
                sev: 'success'
              })
            );
            setOpen(false);
          })
          .catch(() => {
            dispatch(
              notify({
                msg: 'Failed to create Prescription Instruction',
                sev: 'error'
              })
            );
          });
      } else {
        updatePrescriptionInstruction(prescriptionInstructions)
          .unwrap()
          .then(() => {
            refetchPrescriotionInstructions();
            dispatch(
              notify({
                msg: 'The Prescription Instruction has been updated successfully',
                sev: 'success'
              })
            );
            setOpen(false);
          })
          .catch(() => {
            dispatch(
              notify({
                msg: 'Failed to update Prescription Instruction',
                sev: 'error'
              })
            );
          });
      }
    };


  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
            width="100%"
            fieldName="category" 
            fieldType="select"
            selectData={categoryEnumList ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            record={prescriptionInstructions}
            setRecord={setPrescriptionInstructions}
            menuMaxHeight={200}
            searchable={false}
            required
            />
             <div className="container-of-two-fields-prescription">
                <div className="container-of-field-prescription">
            <MyInput width="100%" fieldName="dose" fieldType="number" record={prescriptionInstructions} setRecord={setPrescriptionInstructions} required/>
            </div>
            <div className="container-of-field-prescription">
            <MyInput
             width="100%"
              fieldName="unit"
              fieldType="select"
              selectData={uomEnumList ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={prescriptionInstructions}
              setRecord={setPrescriptionInstructions}
              menuMaxHeight={200}
              searchable={true}
              required
            />
            </div>
            </div>
             <br/>
             <div className="container-of-two-fields-prescription">
                <div className="container-of-field-prescription">
             <MyInput
              width="100%"
              fieldName="rout"
              fieldType="select"
              selectData={routEnumList ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={prescriptionInstructions}
              setRecord={setPrescriptionInstructions}
              menuMaxHeight={200}
              searchable={false}
              required
              />
              </div>
              <div className="container-of-field-prescription">
             <MyInput
              width="100%"
              fieldName="frequency" 
             fieldType="select"
              selectData={frequencyEnumList ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={prescriptionInstructions}
              setRecord={setPrescriptionInstructions} 
              menuMaxHeight={200}
              searchable={false}
              required
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
      title={prescriptionInstructions?.id ? 'Edit Prescription Instruction' : 'New Prescription Instruction'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={prescriptionInstructions?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Prescription Instruction Info', icon: <FaFilePrescription /> }]} 
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditPrescriptionInstructions;
