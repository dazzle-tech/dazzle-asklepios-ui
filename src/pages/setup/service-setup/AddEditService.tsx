import React, { useState } from 'react';
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
  width,
  service,
  setService,
  handleSave,
}) => {
  // enums
  const serviceCategoryOptions = useEnumOptions('ServiceCategory');
  const currencyOptions = useEnumCapitalized('Currency');

  // facilities (same pattern used in AddEditDepartment)
  const [facilityListRequest] = useState<ListRequest>({
    ...initialListRequest,
  });
  const { data: facilityListResponse } = useGetAllFacilitiesQuery(facilityListRequest);

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
                  disabled={service?.facilityId}
                />
              </div>
              <div className="container-of-field-service">
                <MyInput
                  required
                  width="100%"
                  fieldName="name"
                  record={service}
                  setRecord={setService} />
              </div>
            </div>
            <br />
            <div className="container-of-two-fields-service">
              <div className="container-of-field-service">
                <MyInput required width="100%" fieldName="code" record={service} setRecord={setService} />
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
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};

export default AddEditService;
