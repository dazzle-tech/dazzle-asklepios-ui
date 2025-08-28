import React, { useState } from 'react';
import type { ApPatient } from '@/types/model-types';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import PostalCodeModal from './postal-code-details/PostalCodeModal';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery, useGetLovValuesByCodeAndParentQuery } from '@/services/setupService';
import { FaClock } from 'react-icons/fa6';
import MyButton from '@/components/MyButton/MyButton';
interface AddressTabProps {
  localPatient: ApPatient;
  setLocalPatient: (patient: ApPatient) => void;
  validationResult: any;
}
const AddressTab: React.FC<AddressTabProps> = ({
  localPatient,
  setLocalPatient,
  validationResult
  
}) => {
  // Fetch LOV data for various fields
  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');
  const { data: cityLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({
    code: 'CITY',
    parentValueKey: localPatient.countryLkey
  });

  const [showModal, setShowModal] = useState(false);

  
  return (
    <Form layout="inline" fluid>
      <div>
        <MyButton
        prefixIcon={() => <FaClock />}
        disabled={!localPatient.key}
      >
        Address Change Log
      </MyButton></div>
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Country"
        fieldType="select"
        fieldName="countryLkey"
        selectData={countryLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
        menuMaxHeight={200}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="State/Province"
        fieldType="select"
        fieldName="stateProvinceRegionLkey"
        selectData={cityLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="City"
        fieldType="select"
        fieldName="cityLkey"
        selectData={cityLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Street Name"
        fieldName="streetAddressLine1"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="House/Apartment Number"
        fieldName="apartmentNumber"
        record={localPatient}
        setRecord={setLocalPatient}
      />
  <MyInput
        fieldLabel="Postal/ZIP code"
        fieldName="postalCode"
        record={localPatient}
        setRecord={setLocalPatient}
        rightAddon={
          <span onClick={() => setShowModal(true)} style={{ cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faSearch} />
          </span>
        }
      />

         <PostalCodeModal
        open={showModal}
        setOpen={setShowModal}
        onSelect={(selectedPostalCode) => {
          setLocalPatient((prev) => ({
            ...prev,
            postalCode: selectedPostalCode
          }));
        }}
      />

      <MyInput
        vr={validationResult}
        column
        fieldLabel="Additional Address Line"
        fieldName="streetAddressLine2"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Country ID"
        fieldType="text"
        fieldName="countryId"
        record={localPatient}
        setRecord={setLocalPatient}
        disabled
      />
    </Form>
  );
};

export default AddressTab;
