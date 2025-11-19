import React, { useState, useEffect } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FaClock } from 'react-icons/fa6';

import PostalCodeModal from './postal-code-details/PostalCodeModal';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';

import {
  useGetLovValuesByCodeQuery,
  useGetLovValuesByCodeAndParentQuery
} from '@/services/setupService';

import {
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useGetPatientAddressesQuery
} from '@/services/patients/AddressService';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import { Patient, Address } from '@/types/model-types-new';
import { newAddress } from '@/types/model-types-constructor-new';

interface AddressTabProps {
  localPatient: Patient;
  setLocalPatient: (patient: Patient) => void;
  validationResult: any;
}

const AddressTab: React.FC<AddressTabProps> = ({
  localPatient,
  setLocalPatient,
  validationResult
}) => {
  const [address, setAddress] = useState<Address>({ ...newAddress });
  const [showModal, setShowModal] = useState(false);

  const dispatch = useAppDispatch();

  const [createAddress] = useCreateAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();

  const patientId = localPatient?.id;

  const { data: addressesResult, isFetching: isAddressesFetching } = useGetPatientAddressesQuery(
    { patientId: patientId as number },
    { skip: !patientId }
  );

  const stripUndefined = (obj: Record<string, any>) =>
    Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));

  useEffect(() => {
    if (!patientId) {
      setAddress({ ...newAddress });
      return;
    }

    if (isAddressesFetching) return;

    const list = addressesResult?.data ?? [];
    const current = list.length > 0 ? list[0] : undefined;

    if (current) {
      setAddress(current as Address);
    } else {
      setAddress({ ...newAddress });
    }
  }, [patientId, addressesResult, isAddressesFetching]);

  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');

  const { data: cityLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({
    code: 'CITY',
    parentValueKey: address.country
  });

  const handleSave = async () => {
    if (!localPatient?.id) return;

    const raw: Partial<Address> = {
      ...(address?.id ? { id: address.id } : {}),
      ...address
    };

    const payload = stripUndefined(raw) as Address;

    try {
      const saved = address?.id
        ? await updateAddress({
            id: address.id as number,
            patientId: localPatient.id as number,
            body: payload
          }).unwrap()
        : await createAddress({
            patientId: localPatient.id as number,
            body: payload
          }).unwrap();

      setAddress(saved);

      dispatch(
        notify({
          msg: address?.id ? 'Address Updated Successfully' : 'Address Added Successfully',
          sev: 'success'
        })
      );
    } catch (err: any) {
      const backendMsg =
        err?.data?.detail || err?.data?.message || err?.error || 'Error while saving address';

      dispatch(
        notify({
          msg: backendMsg,
          sev: 'error'
        })
      );
    }
  };

  return (
    <SectionContainer
      title={
        <div className="flex-row-22">
          <Translate>Address</Translate>
          <MyButton onClick={handleSave} disabled={!localPatient?.id}>
            {address?.id ? 'Update' : 'Save'}
          </MyButton>
        </div>
      }
      content={
        <Form layout="inline" fluid>
          <div>
            <MyButton prefixIcon={() => <FaClock />} disabled={!localPatient?.id}>
              Address Change Log
            </MyButton>
          </div>

          {/* Country */}
          <MyInput
            vr={validationResult}
            column
            fieldLabel="Country"
            fieldType="select"
            fieldName="country"
            selectData={countryLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={address}
            setRecord={setAddress}
            menuMaxHeight={200}
          />

          {/* State / Province */}
          <MyInput
            vr={validationResult}
            column
            fieldLabel="State/Province"
            fieldType="select"
            fieldName="stateProvince"
            selectData={cityLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={address}
            setRecord={setAddress}
          />

          {/* City */}
          <MyInput
            vr={validationResult}
            column
            fieldLabel="City"
            fieldType="select"
            fieldName="city"
            selectData={cityLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={address}
            setRecord={setAddress}
          />

          {/* Street Name */}
          <MyInput
            vr={validationResult}
            column
            fieldLabel="Street Name"
            fieldName="streetName"
            record={address}
            setRecord={setAddress}
          />

          {/* House/Apartment Number */}
          <MyInput
            vr={validationResult}
            column
            fieldLabel="House/Apartment Number"
            fieldName="houseApartmentNumber"
            record={address}
            setRecord={setAddress}
          />

          {/* Postal / ZIP Code */}
          <MyInput
            fieldLabel="Postal/ZIP code"
            fieldName="postalZipCode"
            record={address}
            setRecord={setAddress}
            rightAddon={
              <span onClick={() => setShowModal(true)} style={{ cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faSearch} />
              </span>
            }
          />

          <PostalCodeModal
            open={showModal}
            setOpen={setShowModal}
            onSelect={selectedPostalCode => {
              setAddress(prev => ({
                ...prev,
                postalZipCode: selectedPostalCode
              }));
            }}
          />

          {/* Additional Address Line */}
          <MyInput
            vr={validationResult}
            column
            fieldLabel="Additional Address Line"
            fieldName="additionalAddressLine"
            record={address}
            setRecord={setAddress}
          />

          {/* Country ID */}
          <MyInput
            vr={validationResult}
            column
            fieldLabel="Country ID"
            fieldType="text"
            fieldName="countryId"
            record={address}
            setRecord={setAddress}
            disabled
          />
        </Form>
      }
    />
  );
};

export default AddressTab;
