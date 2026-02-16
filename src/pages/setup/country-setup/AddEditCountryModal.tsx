import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { Country } from '@/types/model-types-new';
import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import './styles.less';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

interface AddEditCountryModalProps {
  open: boolean;
  onClose: () => void;
  country: Country;
  onSave: (country: Country) => void;
}

const AddEditCountryModal: React.FC<AddEditCountryModalProps> = ({
  open,
  onClose,
  country,
  onSave
}) => {
  const [formData, setFormData] = useState<Country>(country);
  const [loading, setLoading] = useState(false);
  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');

  useEffect(() => {
    setFormData(country);
  }, [country]);

  const handleSubmit = () => {
    setLoading(true);

    const payload: Country = {
      ...formData,
      id: country.id ?? formData.id
    };

    onSave(payload);
    setLoading(false);
  };

  return (
    <div className={`modal-backdrop ${open ? 'show' : ''}`}>
      <div className="modal-content">
        <div className="modal-body">
          <Form fluid className="modal-body-2">
            <MyInput
              column
              fieldLabel="Country"
              fieldType="select"
              fieldName="name"
              selectData={countryLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={formData}
              setRecord={setFormData}
              menuMaxHeight={200}
            />

            <MyInput
              fieldName="code"
              fieldType="text"
              fieldLabel="code"
              record={formData}
              setRecord={setFormData}
              placeholder="Enter country code"
              width={300}
            />

            <div className="modal-2635">
              <MyButton
                onClick={handleSubmit}
                color="var(--deep-blue)"
                width="80px"
                loading={loading}
              >
                Save
              </MyButton>
            </div>
            <div className="modal-2635">
              <MyButton onClick={onClose} color="var(--primary-gray)" width="80px">
                Cancel
              </MyButton>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default AddEditCountryModal;
