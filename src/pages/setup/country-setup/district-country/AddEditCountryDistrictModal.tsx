import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { CountryDistrict } from '@/types/model-types-new';
import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import '../styles.less';

interface AddEditCountryDistrictModalProps {
  open: boolean;
  onClose: () => void;
  district: CountryDistrict;
  onSave: (district: CountryDistrict) => void;
}

const AddEditCountryDistrictModal: React.FC<AddEditCountryDistrictModalProps> = ({
  open,
  onClose,
  district,
  onSave
}) => {
  const [formData, setFormData] = useState<CountryDistrict>(district);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(district);
  }, [district]);

  const handleSubmit = () => {
    setLoading(true);

    // FIX: Ensure id/countryId never get lost
    const payload: CountryDistrict = {
      ...formData,
      id: district.id ?? formData.id,
      countryId: district.countryId ?? formData.countryId
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
              fieldName="name"
              fieldType="text"
              fieldLabel="District Name"
              record={formData}
              setRecord={setFormData}
              placeholder="Enter district name"
              width={300}
            />

            <MyInput
              fieldName="code"
              fieldType="text"
              fieldLabel="Code"
              record={formData}
              setRecord={setFormData}
              placeholder="Enter district code"
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

export default AddEditCountryDistrictModal;
