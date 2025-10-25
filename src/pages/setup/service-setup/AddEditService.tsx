import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { FaStar } from 'react-icons/fa';

import { useEnumOptions  , useEnumByName} from '@/services/enumsApi';

type AddEditServiceProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
  width: number;
  service: any;
  setService: (next: any) => void;
  handleSave: () => void;
  actionLoading?: boolean; // optional - if your MyModal supports it
};

const AddEditService: React.FC<AddEditServiceProps> = ({
  open,
  setOpen,
  width,
  service,
  setService,
  handleSave,
  actionLoading,
}) => {
  const serviceCategoryOptions = useEnumOptions('ServiceCategory');
  const currencyOptions = useEnumByName('Currency');
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
      default:
        return (
          <Form fluid>
            <div className="container-of-two-fields-service">
              <div className="container-of-field-service">
                <MyInput required width="100%" fieldName="name" record={service} setRecord={setService} />
              </div>
              <div className="container-of-field-service">
                <MyInput
                  width="100%"
                  fieldName="abbreviation"
                  record={service}
                  setRecord={setService}
                />
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
                  fieldName="price"
                  fieldType="number"
                  record={service}
                  setRecord={setService}
                />
              </div>
              <div className="container-of-field-service">
                <MyInput
                 required
                  width="100%"
                  fieldName="currency"
                  fieldType="select"
                  selectData={currencyOptions ?? []}
                  selectDataLabel="value"
                  selectDataValue="value"
                  record={service}
                  setRecord={setService}
                />
              </div>
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