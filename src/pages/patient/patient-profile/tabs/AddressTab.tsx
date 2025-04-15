import React from 'react';
import type { ApPatient } from '@/types/model-types';
import { Form, ButtonToolbar, Button } from 'rsuite';
import { Icon } from '@rsuite/icons';
import MyInput from '@/components/MyInput';
import {
  useGetLovValuesByCodeQuery,
  useGetLovValuesByCodeAndParentQuery
} from '@/services/setupService';
import { FaClock } from 'react-icons/fa6';

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
  // Fetch LOV data
  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');
  const { data: cityLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({
    code: 'CITY',
    parentValueKey: localPatient.countryLkey
  });

  return (
    <Form layout="inline" fluid>
      <ButtonToolbar style={{ zoom: 0.8 }}>
        <Button
          style={{
            backgroundColor: 'var(--primary-blue)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
          disabled={!localPatient.key}
        >
          <Icon as={FaClock} /> Address Change Log
        </Button>
      </ButtonToolbar>
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldLabel="Country"
        fieldType="select"
        fieldName="countryLkey"
        selectData={countryLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
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
        width={165}
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
        width={165}
        fieldLabel="Street Name"
        fieldName="streetAddressLine1"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldLabel="House/Apartment Number"
        fieldName="apartmentNumber"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldLabel="Postal/ZIP code"
        fieldName="postalCode"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldLabel="Additional Address Line"
        fieldName="streetAddressLine2"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
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
