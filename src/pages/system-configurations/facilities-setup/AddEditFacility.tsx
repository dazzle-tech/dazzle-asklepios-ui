import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useMemo, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Col, Form, Row } from 'rsuite';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import { faUser, faPhone } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useGetDepartmentByTypeAndFacilityAndActiveQuery } from '@/services/security/departmentService';
import { skipToken } from '@reduxjs/toolkit/query';
import { useEnumCapitalized, useEnumOptions } from '@/services/enumsApi';
import Translate from '@/components/Translate';
import { useGetCountriesQuery } from '@/services/setup/country/countryService';
import { useGetDistrictsByCountryQuery } from '@/services/setup/country/countryDistrictService';
import { PhoneNumberInput } from '@/components';

const AddEditFacility = ({
  open,
  setOpen,
  width,
  facility,
  setFacility,
  handleSave
}) => {
  const [validationResult] = useState({});

  const facilityTypeOptions = useEnumOptions('FacilityType');
  const currencyOptions = useEnumCapitalized('Currency');
  const DayOfWeek = useEnumOptions('DayOfWeek');
  const timeZone = useEnumOptions('TimeZone');
  const enumOptions = useEnumOptions('CountryName');

  const workingDaysRecord = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!DayOfWeek || DayOfWeek.length === 0) return map;

    DayOfWeek.forEach(day => {
      map[day.value] = false;
    });

    (facility.workingDays ?? []).forEach(day => {
      if (day?.dayOfWeek) {
        map[day.dayOfWeek] = day.isWorking !== false;
      }
    });

    return map;
  }, [facility.workingDays, DayOfWeek]);

  const setWorkingDaysRecord = (nextRecord: Record<string, boolean>) => {
    if (!DayOfWeek || DayOfWeek.length === 0) return;

    const nextWorkingDays = DayOfWeek.map(day => ({
      dayOfWeek: day.value,
      isWorking: !!nextRecord[day.value]
    }));

    setFacility(prev => ({
      ...prev,
      workingDays: nextWorkingDays
    }));
  };

  const { data: countriesResponse } = useGetCountriesQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });

  const countriesOptions = useMemo(() => {
    const labelMap = Object.fromEntries(enumOptions.map(item => [item.value, item.label]));

    return (countriesResponse?.data ?? []).map(country => ({
      ...country,
      displayName: labelMap[country.name] || country.name
    }));
  }, [countriesResponse, enumOptions]);

  const selectedCountryId = facility?.countryId ?? null;

  const { data: districtsResponse } = useGetDistrictsByCountryQuery(
    selectedCountryId
      ? {
          countryId: selectedCountryId,
          page: 0,
          size: 1000,
          sort: 'name,asc'
        }
      : skipToken
  );

  const districtOptions = useMemo(() => {
    const options = [...(districtsResponse?.data ?? [])];
    if (
      facility?.districtId != null &&
      facility?.districtName &&
      !options.some(item => Number(item.id) === Number(facility.districtId))
    ) {
      options.unshift({
        id: facility.districtId,
        name: facility.districtName
      });
    }
    return options;
  }, [districtsResponse?.data, facility?.districtId, facility?.districtName]);

  const facilityId = facility?.id;

  const { data: labDepartmentsResponse } = useGetDepartmentByTypeAndFacilityAndActiveQuery(
    facilityId ? { type: 'LABORATORY', facilityId, page: 0, size: 200 } : skipToken
  );

  const { data: radDepartmentsResponse } = useGetDepartmentByTypeAndFacilityAndActiveQuery(
    facilityId ? { type: 'RADIOLOGY', facilityId, page: 0, size: 200 } : skipToken
  );

  const labDepartmentOptions = useMemo(() => {
    const options = [...(labDepartmentsResponse?.data ?? [])];
    const selectedId = facility?.defaultLabDepartmentId;
    if (
      selectedId != null &&
      !options.some(department => Number(department.id) === Number(selectedId))
    ) {
      options.unshift({
        id: selectedId,
        name: facility?.defaultLabDepartmentName || `Department #${selectedId}`
      });
    }
    return options;
  }, [
    labDepartmentsResponse?.data,
    facility?.defaultLabDepartmentId,
    facility?.defaultLabDepartmentName
  ]);

  const radDepartmentOptions = useMemo(() => {
    const options = [...(radDepartmentsResponse?.data ?? [])];
    const selectedId = facility?.defaultRadDepartmentId;
    if (
      selectedId != null &&
      !options.some(department => Number(department.id) === Number(selectedId))
    ) {
      options.unshift({
        id: selectedId,
        name: facility?.defaultRadDepartmentName || `Department #${selectedId}`
      });
    }
    return options;
  }, [
    radDepartmentsResponse?.data,
    facility?.defaultRadDepartmentId,
    facility?.defaultRadDepartmentName
  ]);

  useEffect(() => {
    if (!open) return;
    if (facility?.districtId == null) return;
    if (!selectedCountryId) {
      setFacility(prev => ({ ...prev, districtId: null, districtName: null }));
    }
  }, [open, selectedCountryId]);

  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput fieldName="code" record={facility} setRecord={setFacility} width="16vw" required />

            <Row>
              <Col md={12}>
                <MyInput fieldName="name" record={facility} setRecord={setFacility} width="100%" required />
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
                width="100%"
              />
            </Row>
            <Row>
              <MyInput
                fieldName="vatRegistrationNumber"
                fieldLabel="Company VAT No"
                record={facility}
                setRecord={setFacility}
                width="100%"
              />
            </Row>
            <Row>
              <Col md={12}>
                <MyInput
                  fieldLabel="Default Lab Department"
                  fieldType="select"
                  fieldName="defaultLabDepartmentId"
                  selectData={labDepartmentOptions}
                  selectDataLabel="name"
                  selectDataValue="id"
                  record={facility}
                  setRecord={setFacility}
                  width="100%"
                  disabled={!facilityId}
                  searchable
                />
              </Col>
              <Col md={12}>
                <MyInput
                  fieldLabel="Default Radiology Department"
                  fieldType="select"
                  fieldName="defaultRadDepartmentId"
                  selectData={radDepartmentOptions}
                  selectDataLabel="name"
                  selectDataValue="id"
                  record={facility}
                  setRecord={setFacility}
                  width="100%"
                  disabled={!facilityId}
                  searchable
                />
              </Col>
            </Row>
            <Row>
              <MyInput
                fieldName="facilityBriefDesc"
                fieldType="textarea"
                record={facility}
                setRecord={setFacility}
                width="100%"
              />
              <Translate>Working Days</Translate>
              <div className="facility-working-days">
                {DayOfWeek?.map(day => (
                  <MyInput
                    key={day.value}
                    fieldType="check"
                    fieldName={day.value}
                    label={day.label}
                    record={workingDaysRecord}
                    setRecord={setWorkingDaysRecord}
                    showLabel={false}
                  />
                ))}
              </div>
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
                width="13vw"
                vr={validationResult}
                fieldLabel="Facility Country"
                fieldType="select"
                fieldName="countryId"
                selectData={countriesOptions}
                selectDataLabel="displayName"
                selectDataValue="id"
                record={facility}
                setRecord={next => {
                  const countryId = next?.countryId ?? null;
                  const previousCountryId = facility?.countryId ?? null;
                  setFacility({
                    ...next,
                    countryId,
                    districtId:
                      countryId != null && Number(countryId) === Number(previousCountryId)
                        ? next?.districtId ?? null
                        : null,
                    districtName:
                      countryId != null && Number(countryId) === Number(previousCountryId)
                        ? next?.districtName ?? null
                        : null
                  });
                }}
                searchable
              />
              <MyInput
                width="13vw"
                vr={validationResult}
                fieldLabel="Facility City"
                fieldType="select"
                fieldName="districtId"
                selectData={districtOptions}
                selectDataLabel="name"
                selectDataValue="id"
                record={facility}
                setRecord={setFacility}
                disabled={!selectedCountryId}
                searchable
              />
            </div>
            <div
              className={clsx('', {
                'container-of-two-fields-facility': width > 600
              })}
            >
              <MyInput
                fieldLabel="Street"
                fieldName="streetAddress"
                record={facility}
                setRecord={setFacility}
                width="13vw"
              />
              <MyInput
                fieldLabel="Facility Postal/ZIP"
                fieldName="postalCode"
                record={facility}
                setRecord={setFacility}
                width="13vw"
              />
            </div>
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
              <PhoneNumberInput
                fieldName="phone1"
                fieldLabel="Primary Phone Number"
                record={facility}
                setRecord={setFacility}
                width="13vw"
              />

              <PhoneNumberInput
                fieldName="phone2"
                fieldLabel="Secondary Phone Number"
                record={facility}
                setRecord={setFacility}
                width="13vw"
              />
            </div>
            <MyInput
              fieldName="emailAddress"
              record={facility}
              setRecord={setFacility}
              width="26vw"
            />
            <MyInput fieldName="fax" record={facility} setRecord={setFacility} width="26vw" />
          </Form>
        );
    }
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={facility?.id ? 'Edit Facility' : 'New Facility'}
      position="right"
      content={stepNumber => <div dir={dir}>{conjureFormContent(stepNumber)}</div>}
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
