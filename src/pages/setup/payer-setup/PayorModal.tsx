import React from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Payor } from '@/types/model-types-new';
import SectionContainer from '@/components/SectionsoContainer';
import './styles.less';
import { useEnumOptions } from '@/services/enumsApi';

type PayorModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  payor: Payor;
  setPayor: React.Dispatch<React.SetStateAction<Payor>>;
  onSave: () => void;
};

const PayorModal: React.FC<PayorModalProps> = ({ open, setOpen, payor, setPayor, onSave }) => {
  const payorCategories = useEnumOptions('PayorCategory');

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={payor.id ? 'Edit Payor' : 'Add Payor'}
      size="80vw"
      actionButtonLabel="Save"
      actionButtonFunction={onSave}
      modalColor="var(--primary-blue)"
      steps={[]}
      content={
        <Form fluid>
          <div className="flex-row-payor-modal-section-container">
            <SectionContainer
              title="Information"
              content={
                <div className="flex-row-payor-modal-in-sections">
                  <MyInput
                    fieldName="code"
                    fieldType="text"
                    fieldLabel="Payor Code"
                    record={payor}
                    setRecord={setPayor}
                    width="12vw"
                    required
                  />
                  <MyInput
                    fieldName="name"
                    fieldType="text"
                    fieldLabel="Payor Name"
                    record={payor}
                    setRecord={setPayor}
                    width="12vw"
                    required
                  />
                  <MyInput
                    fieldName="category"
                    fieldType="select"
                    fieldLabel="Category"
                    selectData={payorCategories ?? []}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={payor}
                    setRecord={setPayor}
                    width="12vw"
                    searchable={false}
                    required
                  />
                </div>
              }
            />
            <SectionContainer
              title="Waseel / NPHIES"
              content={
                <div className="flex-row-payor-modal-in-sections">
                  <MyInput
                    fieldName="nphiesId"
                    fieldType="text"
                    fieldLabel="NPHIES ID"
                    record={payor}
                    setRecord={setPayor}
                    width="12vw"
                  />

                  <MyInput
                    fieldName="waseelPayerId"
                    fieldType="text"
                    fieldLabel="Waseel Payer ID"
                    record={payor}
                    setRecord={setPayor}
                    width="12vw"
                  />

                  <MyInput
                    fieldName="tpaNphiesId"
                    fieldType="text"
                    fieldLabel="TPA NPHIES ID"
                    record={payor}
                    setRecord={setPayor}
                    width="12vw"
                  />

                  <MyInput
                    fieldName="isWaseelEnabled"
                    fieldType="checkbox"
                    fieldLabel="Waseel Enabled"
                    record={payor}
                    setRecord={setPayor}
                  />
                </div>
              }
            />
            {/* Section: Contract Period */}
            <SectionContainer
              title="Contract Period"
              content={
                <div className="flex-row-payor-modal-in-sections">
                  <MyInput
                    fieldName="startDate"
                    fieldType="date"
                    fieldLabel="Start Date"
                    record={payor}
                    setRecord={setPayor}
                    width="12vw"
                    required
                  />
                  <MyInput
                    fieldName="expiryDate"
                    fieldType="date"
                    fieldLabel="Expiry Date"
                    record={payor}
                    setRecord={setPayor}
                    width="12vw"
                  />
                  <MyInput
                    fieldName="renewable"
                    fieldType="checkbox"
                    fieldLabel="Renewable"
                    record={payor}
                    setRecord={setPayor}
                  />
                </div>
              }
            />

            {/* Section: Contact */}
            <SectionContainer
              title="Contact"
              content={
                <div className="flex-row-payor-modal-in-sections">
                  <MyInput
                    fieldName="address"
                    fieldType="text"
                    fieldLabel="Address"
                    record={payor}
                    setRecord={setPayor}
                    width="12vw"
                  />
                  <MyInput
                    fieldName="phone"
                    fieldType="text"
                    fieldLabel="Phone"
                    record={payor}
                    setRecord={setPayor}
                    width="12vw"
                    required
                  />
                  <MyInput
                    fieldName="email"
                    fieldType="text"
                    fieldLabel="Email"
                    record={payor}
                    setRecord={setPayor}
                    width="12vw"
                  />
                  <MyInput
                    fieldName="contractManagerContact"
                    fieldType="text"
                    fieldLabel="Contract Manager Contact"
                    record={payor}
                    setRecord={setPayor}
                    width="12vw"
                  />
                </div>
              }
            />

            {/* Section: Rules */}

            <SectionContainer
              title="Rules"
              content={
                <div className="flex-row-payor-modal-in-sections rules-grid">
                  <MyInput
                    fieldName="allowPartialCoverage"
                    fieldType="checkbox"
                    fieldLabel="Allow partial coverage"
                    record={payor}
                    setRecord={setPayor}
                  />
                  <MyInput
                    fieldName="acceptCopay"
                    fieldType="checkbox"
                    fieldLabel="Accept co-pay"
                    record={payor}
                    setRecord={setPayor}
                  />
                  <MyInput
                    fieldName="acceptDeductibles"
                    fieldType="checkbox"
                    fieldLabel="Accept deductibles"
                    record={payor}
                    setRecord={setPayor}
                  />
                  <MyInput
                    fieldName="allowPackagePricing"
                    fieldType="checkbox"
                    fieldLabel="Allow package pricing"
                    record={payor}
                    setRecord={setPayor}
                  />
                  <MyInput
                    fieldName="allowDrgBilling"
                    fieldType="checkbox"
                    fieldLabel="Allow DRG billing"
                    record={payor}
                    setRecord={setPayor}
                  />
                  <MyInput
                    fieldName="forcePreApproval"
                    fieldType="checkbox"
                    fieldLabel="Force pre-approval"
                    record={payor}
                    setRecord={setPayor}
                  />
                </div>
              }
            />
          </div>
        </Form>
      }
    />
  );
};

export default PayorModal;
