import MyInput from '@/components/MyInput';
import clsx from 'clsx';
import React from 'react';
import { Form } from 'rsuite';

const BasicInfo = ({
  validationResult,
  localPatient,
  setLocalPatient,
  genderEnum,
  ageFormatType,
  ageGroupValue,
  patientClassLovQueryResponse
}) => {
  return (
    <Form layout="inline"  className={clsx('', { 'disabled-panel': localPatient.patientStatus === 'MERGED' })}>
      <MyInput
        required
        vr={validationResult}
        column
        fieldName="firstName"
        record={localPatient}
        setRecord={setLocalPatient}
        width={170}
      />
      <MyInput
        width={170}
        vr={validationResult}
        column
        required
        fieldName="secondName"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldName="thirdName"
        record={localPatient}
        setRecord={setLocalPatient}
        width={170}
      />
      <MyInput
        required
        vr={validationResult}
        column
        fieldName="lastName"
        record={localPatient}
        setRecord={setLocalPatient}
        width={170}
      />
      <MyInput
        required
        vr={validationResult}
        column
        fieldLabel="Gender"
        fieldType="select"
        fieldName="sexAtBirth"
        selectData={genderEnum ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={localPatient}
        setRecord={setLocalPatient}
        searchable={false}
        width={170}
      />
      <MyInput
        required
        vr={validationResult}
        column
        fieldType="date"
        fieldLabel="DOB"
        fieldName="dateOfBirth"
        record={localPatient}
        setRecord={setLocalPatient}
        width={170}
        disableFutureDates
        showWarningIfBeforeYear1900
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Age"
        fieldType="text"
        disabled
        fieldName="ageFormat"
        record={localPatient?.dateOfBirth ? ageFormatType : null}
        width={170}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Patient Category"
        fieldType="text"
        fieldName="ageGroup"
        disabled
        record={localPatient?.dateOfBirth ? ageGroupValue : null}
        isEnum
        width={170}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Patient Class"
        fieldType="select"
        fieldName="patientClasses"
        selectData={patientClassLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
        searchable={false}
        width={170}
      />
      {localPatient?.incompletePatient ? (
        <MyInput
          vr={validationResult}
          column
          fieldLabel="Unknown Patient"
          fieldType="checkbox"
          fieldName="isUnknown"
          record={localPatient}
          setRecord={setLocalPatient}
          disabled
          width={170}
        />
      ) : null}
       <MyInput
        vr={validationResult}
        column
        fieldLabel="Private Patient"
        fieldType="checkbox"
        fieldName="isPrivatePatient"
        record={localPatient}
        setRecord={setLocalPatient}
        width={170}
      />
      <MyInput
        vr={validationResult}
        width={170}
        column
        fieldLabel="First Name (Sec. Lang)"
        fieldName="firstNameSecondaryLang"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Second Name (Sec. Lang)"
        fieldName="secondNameSecondaryLang"
        record={localPatient}
        setRecord={setLocalPatient}
        width={170}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Third Name (Sec. Lang)"
        fieldName="thirdNameSecondaryLang"
        record={localPatient}
        setRecord={setLocalPatient}
        width={170}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Last Name (Sec. Lang)"
        fieldName="lastNameSecondaryLang"
        record={localPatient}
        setRecord={setLocalPatient}
        width={170}
      />
    </Form>
  );
};

export default BasicInfo;
