import React from "react";
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { Facility } from '@/types/model-types-new';
import { Form } from "rsuite";
import MyInput from "@/components/MyInput";
import MyButton from "@/components/MyButton/MyButton";
interface ConfigurationTabProps {
  facility: Facility;
  setFacility: (updatedFacility: Facility) => void;
  updateFacility: (updatedFacility: Facility) => void;
}
const ConfigurationTab: React.FC<ConfigurationTabProps> = ({
  facility,
  setFacility,
  updateFacility
}) => {
  const dispatch = useAppDispatch();

  return (
    <div style={{ padding: '16px' }}>
      <Form fluid>
        <MyInput
          fieldName="approvingDiagnosticTestSettlePayment"
          fieldLabel="Approving Diagnostic Test Settle Payment"
          fieldType="checkbox"
          record={facility}
          setRecord={setFacility}
        />
      </Form>

      <div
        style={{
          marginTop: '24px',
          display: 'flex',
          justifyContent: 'flex-end'
        }}
      >
        <MyButton
          appearance="primary"
          onClick={() => {
            const updatedFacility = {
              ...facility,
              name: facility.name + ' (Updated)'
            };

            updateFacility(updatedFacility);

            dispatch(
              notify({
                msg: 'Facility updated successfully!',
                sev: 'success'
              })
            );
          }}
        >
          Save
        </MyButton>
      </div>
    </div>
  );
};
export default ConfigurationTab;
