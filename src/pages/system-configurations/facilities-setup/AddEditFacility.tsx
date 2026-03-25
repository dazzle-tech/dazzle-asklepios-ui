import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Col, Form, Row } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetLovValuesByCodeAndParentQuery } from '@/services/setupService';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import { faUser, faPhone } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEnumCapitalized, useEnumOptions } from '@/services/enumsApi';


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


  // Fetch  facilityTypeOptions list response
  const facilityTypeOptions = useEnumOptions("FacilityType");

  const currencyOptions = useEnumCapitalized("Currency");
  // Fetch country Lov list response
  const { data: contryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');
  // Fetch state Lov list response
  const { data: stateLovQueryResponse } = useGetLovValuesByCodeQuery('STATE_PROV');
  // Fetch city Lov list response
  const { data: cityLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({
    code: 'CITY',
    parentValueKey: address?.countryLkey
  });
  const timeZone = useEnumOptions('TimeZone');

  // modal content
  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid >
           <Row>
            <Col md={12}>
              <MyInput
                fieldName="name"
                record={facility}
                setRecord={setFacility}
                width="100%"
                required
              />
              </Col>
              <Col md={12}>
              <MyInput
                required
                width="100%"
                vr={validationResult}
                fieldLabel="Facility Type"
                fieldType="select"
                fieldName="type"
                selectData={facilityTypeOptions ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                searchable={false}
                record={facility}
                setRecord={setFacility}
              />
              </Col>
               </Row>
            <Row>
              <Col md={12}>
              <MyInput
                required
                width="100%"
                vr={validationResult}
                fieldLabel="Default Currency"
                fieldType="select"
                fieldName="defaultCurrency"
                selectData={currencyOptions ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                record={facility}
                setRecord={setFacility}
                searchable={false}
              />
              </Col>
              <Col md={12}>
              <MyInput
                fieldName="registrationDate"
                fieldType="date"
                record={facility}
                setRecord={setFacility}
                width="100%"
              />
              </Col>
            </Row>
            <Row>
            <MyInput
              fieldName="timeZone"
              fieldType="select"
              selectData={timeZone ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={facility}
              setRecord={setFacility}
              width={"100%"}
            />
            </Row>
             <Row>
            <MyInput
              fieldName="facilityBriefDesc"
              fieldType="textarea"
              record={facility}
              setRecord={setFacility}
              width={"100%"}
            />
            </Row>
          </Form>
        );
      case 1:
        return (
          <Form fluid>
            <div
              className={clsx('', {
                'container-of-two-fields-facility': width > 600
              })}
            >
              <MyInput
                width={"13vw"}
                vr={validationResult}
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
                width={"13vw"}
                vr={validationResult}
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
                width={"13vw"}
                vr={validationResult}
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
                fieldLabel="Street"
                fieldName="streetAddressLine1"
                record={address}
                setRecord={setAddress}
                width={"13vw"}
              />
            </div>
            <MyInput
              fieldLabel="Facility Postal/ZIP"
              fieldName="postalCode"
              record={address}
              setRecord={setAddress}
              width={"26vw"}
            />
          </Form>
        );
      case 2:
        return (
          <Form fluid>
            <div
              className={clsx('', {
                'container-of-two-fields-facility': width > 600
              })}
            >
              <MyInput
                fieldName="phone1"
                fieldLabel="Primary Phone Number"
                record={facility}
                setRecord={setFacility}
                width={"13vw"}
              />
              <MyInput
                fieldName="phone2"
                fieldLabel="Secondary Phone Number"
                record={facility}
                setRecord={setFacility}
                width={"13vw"}
              />
            </div>
            <MyInput
              fieldName="emailAddress"
              record={facility}
              setRecord={setFacility}
              width={"26vw"}
            />
            <MyInput
              fieldName="fax"
              record={facility}
              setRecord={setFacility}
              width={"26vw"}
            />
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={facility?.id ? 'Edit Facility' : 'New Facility'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={facility?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      size="38vw"
      steps={[
        { title: 'Basic Info', icon: <FontAwesomeIcon icon={faUser} /> },
        { title: 'Address', icon: <FontAwesomeIcon icon={faLocationDot} /> },
        { title: 'Contact', icon: <FontAwesomeIcon icon={faPhone} /> }
      ]}
    />
  );
};
export default AddEditFacility;
