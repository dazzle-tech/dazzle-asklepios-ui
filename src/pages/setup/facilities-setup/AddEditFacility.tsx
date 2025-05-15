import MyModal from '@/components/MyModal/MyModal';
import React, { useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetLovValuesByCodeAndParentQuery } from '@/services/setupService';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import { faUser, faPhone } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const AddEditFacility = ({
  open,
  setOpen,
  width,
  facility,
  setFacility,
  address,
  setAddress,
  handleSave
}) => {
  const [validationResult] = useState({});

  // Fetch facility type Lov list response
  const { data: fsltyTypeLovQueryResponse } = useGetLovValuesByCodeQuery('FSLTY_TYP');
  // Fetch country Lov list response
  const { data: contryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');
  // Fetch state Lov list response
  const { data: stateLovQueryResponse } = useGetLovValuesByCodeQuery('STATE_PROV');
  // Fetch currency Lov list response
  const { data: currencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');
  // Fetch city Lov list response
  const { data: cityLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({
    code: 'CITY',
    parentValueKey: address?.countryLkey
  });

  // modal content
  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid layout="inline">
            <div className={clsx('', { 'container-of-two-fields-facility': width > 600 })}>
              <MyInput
                fieldLabel="Facility ID"
                fieldName="facilityId"
                required
                record={facility}
                setRecord={setFacility}
                width={250}
              />
              <MyInput
                column
                required
                width={250}
                vr={validationResult}
                fieldLabel="Facility Type"
                fieldType="select"
                fieldName="facilityTypeLkey"
                selectData={fsltyTypeLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={facility}
                setRecord={setFacility}
              />
            </div>
            <MyInput
              fieldName="facilityName"
              record={facility}
              setRecord={setFacility}
              width={width > 600 ? 520 : 250}
            />
            <div
              className={clsx('', {
                'container-of-two-fields-facility': width > 600
              })}
            >
              <MyInput
                column
                fieldName="facilityRegistrationDate"
                fieldType="date"
                record={facility}
                setRecord={setFacility}
                width={250}
              />
              <MyInput
                required
                width={250}
                vr={validationResult}
                column
                fieldLabel="Default Currency"
                fieldType="select"
                fieldName="defaultCurrencyLkey"
                selectData={currencyLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={facility}
                setRecord={setFacility}
              />
            </div>
            <MyInput
              column
              fieldName="facilityBriefDesc"
              fieldType="textarea"
              record={facility}
              setRecord={setFacility}
              width={width > 600 ? 520 : 250}
            />
          </Form>
        );
      case 1:
        return (
          <Form layout="inline" fluid>
            <div
              className={clsx('', {
                'container-of-two-fields-facility': width > 600
              })}
            >
              <MyInput
                required
                width={250}
                vr={validationResult}
                column
                fieldLabel="Facility Country"
                fieldType="select"
                fieldName="countryLkey"
                selectData={contryLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={address}
                setRecord={setAddress}
              />
              <MyInput
                required
                width={250}
                vr={validationResult}
                column
                fieldLabel="Facility City"
                fieldType="select"
                fieldName="cityLkey"
                selectData={cityLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={address}
                setRecord={setAddress}
              />
            </div>
            <div
              className={clsx('', {
                'container-of-two-fields-facility': width > 600
              })}
            >
              <MyInput
                width={250}
                vr={validationResult}
                column
                fieldLabel="State/Region"
                fieldType="select"
                fieldName="stateProvinceRegionLkey"
                selectData={stateLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={address}
                setRecord={setAddress}
              />
              <MyInput
                column
                fieldLabel="Street"
                fieldName="streetAddressLine1"
                required
                record={address}
                setRecord={setAddress}
                width={250}
              />
            </div>
            <MyInput
              column
              fieldLabel="Facility Postal/ZIP"
              fieldName="postalCode"
              record={address}
              setRecord={setAddress}
              width={width > 600 ? 520 : 250}
            />
          </Form>
        );
      case 2:
        return (
          <Form layout="inline" fluid>
            <div
              className={clsx('', {
                'container-of-two-fields-facility': width > 600
              })}
            >
              <MyInput
                column
                fieldName="facilityPhone1"
                fieldLabel="Primary Phone Number"
                required
                record={facility}
                setRecord={setFacility}
                width={250}
              />
              <MyInput
                column
                fieldName="facilityPhone2"
                fieldLabel="Secondary Phone Number"
                required
                record={facility}
                setRecord={setFacility}
                width={250}
              />
            </div>
            <MyInput
              column
              fieldName="facilityEmailAddress"
              record={facility}
              setRecord={setFacility}
              width={width > 600 ? 520 : 250}
            />
            <MyInput
              column
              fieldName="facilityFax"
              required
              record={facility}
              setRecord={setFacility}
              width={width > 600 ? 520 : 250}
            />
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={facility?.key ? 'Edit Facility' : 'New Facility'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={facility?.key ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      size={width > 600 ? '36vw' : '25vw'}
      steps={[
        { title: 'Basic Info', icon:<FontAwesomeIcon icon={ faUser }/>},
        { title: 'Address', icon:<FontAwesomeIcon icon={ faLocationDot }/>},
        { title: 'Contact', icon: <FontAwesomeIcon icon={faPhone }/>}
      ]}
    />
  );
};
export default AddEditFacility;
