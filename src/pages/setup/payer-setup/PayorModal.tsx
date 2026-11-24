import React, { useMemo } from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Payor } from '@/types/model-types-new';
import SectionContainer from '@/components/SectionsoContainer';
import './styles.less';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllNphiesPayersQuery } from '@/services/setup/payer/NphiesPayerSetupService';

type PayorModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  payor: Payor;
  setPayor: React.Dispatch<React.SetStateAction<Payor>>;
  onSave: () => void;
  /** Opened from an insurance company: identity and contact come from the company and are read-only. */
  linkedToCompany?: boolean;
};

const PayorModal: React.FC<PayorModalProps> = ({
  open,
  setOpen,
  payor,
  setPayor,
  onSave,
  linkedToCompany = false
}) => {
  const payorCategories = useEnumOptions('PayorCategory');

  const { data: nphiesPayerListResponse, isFetching: isNphiesPayersLoading } =
    useGetAllNphiesPayersQuery(
      { page: 0, size: 2000, sort: 'nameEn,asc' },
      { skip: !open }
    );

  const nphiesPayersList = useMemo(
    () => (nphiesPayerListResponse?.data ?? []).filter(payer => payer.isActive),
    [nphiesPayerListResponse]
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        linkedToCompany
          ? `Payor Settings${payor.name ? ` — ${payor.name}` : ''}`
          : payor.id
            ? 'Edit Payor'
            : 'Add Payor'
      }
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
                    disabled={linkedToCompany}
                    fieldType="text"
                    fieldLabel="Payor Code"
                    record={payor}
                    setRecord={setPayor}
                    width="12vw"
                    required
                  />
                  <MyInput
                    fieldName="name"
                    disabled={linkedToCompany}
                    fieldType="text"
                    fieldLabel="Payor Name"
                    record={payor}
                    setRecord={setPayor}
                    width="12vw"
                    required
                  />
                  <MyInput
                    fieldName="category"
                    disabled={linkedToCompany}
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
                    disabled={linkedToCompany}
                    fieldType="select"
                    fieldLabel="NPHIES ID"
                    selectData={nphiesPayersList}
                    selectDataLabel="nameEn"
                    selectDataValue="nphiesId"
                    record={payor}
                    setRecord={setPayor}
                    width="12vw"
                    searchable
                    loading={isNphiesPayersLoading}
                    placeholder={
                      isNphiesPayersLoading
                        ? 'Loading NPHIES payers...'
                        : nphiesPayersList.length === 0
                          ? 'No NPHIES payers found'
                          : 'Select NPHIES payer'
                    }
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

            {/* Section: Contact */}
            <SectionContainer
              title="Contact"
              content={
                <div className="flex-row-payor-modal-in-sections">
                  <MyInput
                    fieldName="address"
                    disabled={linkedToCompany}
                    fieldType="text"
                    fieldLabel="Address"
                    record={payor}
                    setRecord={setPayor}
                    width="12vw"
                  />
                  <MyInput
                    fieldName="phone"
                    disabled={linkedToCompany}
                    fieldType="text"
                    fieldLabel="Phone"
                    record={payor}
                    setRecord={setPayor}
                    width="12vw"
                    required
                  />
                  <MyInput
                    fieldName="email"
                    disabled={linkedToCompany}
                    fieldType="text"
                    fieldLabel="Email"
                    record={payor}
                    setRecord={setPayor}
                    width="12vw"
                  />
                  <MyInput
                    fieldName="contractManagerContact"
                    disabled={linkedToCompany}
                    fieldType="text"
                    fieldLabel="Contract Manager Contact"
                    record={payor}
                    setRecord={setPayor}
                    width="12vw"
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
