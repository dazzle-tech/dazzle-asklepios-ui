import React, { useState, useEffect } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import BillingRuleSelect from '@/components/BillingRuleSelect/BillingRuleSelect';
import { Col, Form, Row } from 'rsuite';
import './styles.less';
import { FaStar } from 'react-icons/fa';
import { useEnumOptions, useEnumCapitalized } from '@/services/enumsApi';
import { useGetActiveFacilitiesQuery } from '@/services/security/facilityService';
import { initialListRequest, ListRequest } from '@/types/types';

type AddEditServiceProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
  width: number;
  service: any;
  setService: (next: any) => void;
  handleSave: () => void;
};

const AddEditService: React.FC<AddEditServiceProps> = ({
  open,
  setOpen,
  service,
  setService,
  handleSave
}) => {
  const serviceCategoryOptions = useEnumOptions('ServiceCategory');
  const currencyOptions = useEnumCapitalized('Currency');

  const [facilityListRequest] = useState<ListRequest>({ ...initialListRequest });
  const { data: facilityListResponse } = useGetActiveFacilitiesQuery(facilityListRequest);

  useEffect(() => {
    if (!open) return;
    if (!facilityListResponse || !service?.facilityId) return;

    const selectedFacility = facilityListResponse.find(
      (f: any) => Number(f.id) === Number(service.facilityId)
    );

    if (selectedFacility?.defaultCurrency) {
      setService((prev: any) => ({
        ...prev,
        currency: selectedFacility.defaultCurrency
      }));
    }
  }, [open, service?.facilityId, facilityListResponse]);

   useEffect(() => {
   
     if (!service?.appointable) {
       
         setService(prev => ({
           ...prev,
           defaultDurationMinutes: undefined, defaultBufferAfterMinutes: 0, defaultBufferBeforeMinutes: 0
         }));
       
     }
   }, [service?.appointable]);

  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
      default:
        return (
          <Form fluid>
            <div className="container-of-two-fields-service">
              <div className="container-of-field-service">
                <MyInput
                  width="100%"
                  fieldLabel="Facility"
                  fieldName="facilityId"
                  required
                  fieldType="select"
                  selectData={facilityListResponse ?? []}
                  selectDataLabel="name"
                  selectDataValue="id"
                  record={service}
                  setRecord={setService}
                  disabled={service?.facilityId && service?.id}
                />
              </div>
              <div className="container-of-field-service">
                <MyInput
                  required
                  width="100%"
                  fieldName="name"
                  record={service}
                  setRecord={setService}
                />
              </div>
            </div>
            <br />
            <div className="container-of-two-fields-service">
              <div className="container-of-field-service">
                <MyInput
                  required
                  width="100%"
                  fieldName="code"
                  record={service}
                  setRecord={setService}
                />
              </div>
              <div className="container-of-field-service">
                <MyInput
                  width="100%"
                  required
                  fieldName="category"
                  fieldType="select"
                  selectData={serviceCategoryOptions}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={service}
                  setRecord={setService}
                />
              </div>
            </div>
            <br />
            <div className="container-of-two-fields-service">
              <div className="container-of-field-service">
                <MyInput
                  width="100%"
                  fieldName="abbreviation"
                  record={service}
                  setRecord={setService}
                />
              </div>
              <div className="container-of-field-service">
                <MyInput
                  width="100%"
                  fieldName="price"
                  fieldType="number"
                  record={service}
                  setRecord={setService}
                  required
                />
              </div>
            </div>
            <br />
            <div className="container-of-two-fields-service">
              <div className="container-of-field-service">
                <MyInput
                  required
                  width="100%"
                  fieldName="currency"
                  fieldType="select"
                  selectData={currencyOptions ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={service}
                  setRecord={setService}
                  disabled
                />
              </div>
              <div className="container-of-field-service">
              <MyInput
                width="100%"
                fieldType="checkbox"
                fieldName="appointable"
                record={service}
                setRecord={setService}
              />
              </div>
            </div>
            <br />
            <div className="container-of-two-fields-service">
              <div className="container-of-field-service">
                <BillingRuleSelect
                  billingItemType="SERVICE"
                  record={service}
                  setRecord={setService}
                />
              </div>
            </div>
             <br />
            <div className="container-of-two-fields-service">
              <div className="container-of-field-service">
                <MyInput
                  fieldType="number"
                  fieldName="parallelCapacityValue"
                  record={service}
                  setRecord={setService}
                  width="100%"
                  required
                  showZero
                />
               </div>
               {service?.appointable && (
              <div className="container-of-field-service">
                <MyInput
                  fieldType="number"
                  fieldName="defaultDurationMinutes"
                  record={service}
                  setRecord={setService}
                  width="100%"
                  required={service.appointable}
                  showZero
                />
               </div>
               )}
            </div>
             <br />
              {service?.appointable && (
             <div className="container-of-two-fields-service">
              <div className="container-of-field-service">
                <MyInput
                  fieldType="number"
                  fieldName="defaultBufferBeforeMinutes"
                  record={service}
                  setRecord={setService}
                  width="100%"
                  required={service.appointable}
                  showZero
                />
               </div>
              <div className="container-of-field-service">
                <MyInput
                  fieldType="number"
                  fieldName="defaultBufferAfterMinutes"
                  record={service}
                  setRecord={setService}
                  width="100%"
                  required={service.appointable}
                  showZero
                />
               </div>
             </div>
              )}
          </Form>
        );
    }
  };

  const isEdit = !!(service?.id ?? service?.key);

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={isEdit ? 'Edit Service' : 'New Service'}
      position="right"
      content={(stepNumber) => (<div dir={dir}>{conjureFormContent(stepNumber)}</div>)}
      actionButtonLabel={isEdit ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Service Info', icon: <FaStar /> }]}
      size={'40vw'}
    />
  );
};

export default AddEditService;
