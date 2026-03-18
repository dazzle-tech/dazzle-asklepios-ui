import React, { useState, useEffect } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { FaStar } from 'react-icons/fa';
import { useEnumOptions, useEnumCapitalized } from '@/services/enumsApi';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
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
  const { data: facilityListResponse } = useGetAllFacilitiesQuery(facilityListRequest);

  useEffect(() => {
    if (!facilityListResponse || !service?.facilityId) return;

    const selectedFacility = facilityListResponse.find(
      (f: any) => Number(f.id) === Number(service.facilityId)
    );

    if (
      selectedFacility?.defaultCurrency &&
      selectedFacility.defaultCurrency !== service.currency
    ) {
      setService({
        ...service,
        currency: selectedFacility.defaultCurrency
      });
    }
  }, [service?.facilityId, facilityListResponse]);

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
              <div className="container-of-field-service" />
            </div>
          </Form>
        );
    }
  };

  const isEdit = !!(service?.id ?? service?.key);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={isEdit ? 'Edit Service' : 'New Service'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={isEdit ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Service Info', icon: <FaStar /> }]}
      size={'40vw'}
    />
  );
};

export default AddEditService;
