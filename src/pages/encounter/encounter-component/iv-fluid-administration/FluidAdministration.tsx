import React from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import MyButton from '@/components/MyButton/MyButton';

const FluidAdministration = ({ fluidOrder, setFluidOrder, addLog }) => {
  return (
    <Form fluid className="administration-details">
      <div className="flexing">
        {/* Total Requested Amount */}
        <MyInput
          fieldType="text"
          fieldLabel="Total Requested Amount"
          fieldName="volume"
          value={fluidOrder.volume}
          disabled
          record={fluidOrder}
          setRecord={setFluidOrder}
          rightAddon={'ml'}
          width={120}
        />

        {/* Infusion Rate Requested */}
        <MyInput
          fieldType="text"
          fieldLabel="Infusion Rate Requested"
          fieldName="infusionRate"
          value={fluidOrder.infusionRate}
          disabled
          record={fluidOrder}
          setRecord={setFluidOrder}
          rightAddon={'ml/h'}
          width={120}
        />

        {/* Administered Amount */}
        <MyInput
          fieldType="number"
          fieldLabel="Administered Amount"
          fieldName="administeredAmount"
          record={fluidOrder}
          setRecord={setFluidOrder}
          rightAddon={'ml'}
          width={120}
        />

        {/* Administration Rate */}
        <MyInput
          fieldType="number"
          fieldLabel="Administration Rate"
          fieldName="administeredRate"
          record={fluidOrder}
          setRecord={setFluidOrder}
          rightAddon={'ml/hr'}
          rightAddonwidth={55}
          width={120}
        />

        {/* Rate Variation Reason */}
        <MyInput
          fieldType="text"
          fieldLabel="Rate Variation Reason"
          fieldName="rateVariationReason"
          record={fluidOrder}
          setRecord={setFluidOrder}
          width={140}
        />

        {/* Remaining Amount */}
        <MyInput
          fieldType="text"
          fieldLabel="Remaining Amount"
          fieldName="remainingAmount"
          value={fluidOrder.volume - (fluidOrder.administeredAmount || 0)}
          disabled
          record={fluidOrder}
          setRecord={setFluidOrder}
          rightAddon={'ml'}
          width={120}
        />

        {/* Nurse Notes */}
        <MyInput
          fieldType="textarea"
          fieldLabel="Nurse Notes"
          fieldName="nurseNotes"
          height={35}
          record={fluidOrder}
          setRecord={setFluidOrder}
          width={180}
        />
      </div>

      {/* Start Button */}
      <div className="margin-top-but">
        <MyButton
          onClick={() => {
            addLog('Start');
            setFluidOrder({
              ...fluidOrder,
              status: 'Started',
              actualStart: new Date()
            });
          }}
        >
          <FontAwesomeIcon icon={faPlay} />
          Start
        </MyButton>
      </div>
    </Form>
  );
};

export default FluidAdministration;
