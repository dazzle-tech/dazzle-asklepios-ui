import React from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';

const BasicInfo = ({
 validationResult,
 localPatient,
 setLocalPatient,
 genderLovQueryResponse,
 ageFormatType,
 ageGroupValue,
 patientClassLovQueryResponse
}) => {
  return (
    <Form layout="inline">
      <MyInput
        required
        vr={validationResult}
        column
        fieldName="firstName"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        required
        vr={validationResult}
        column
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
      />
      <MyInput
        required
        vr={validationResult}
        column
        fieldName="lastName"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        required
        vr={validationResult}
        column
        fieldLabel="Sex at Birth"
        fieldType="select"
        fieldName="genderLkey"
        selectData={genderLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
        searchable={false}
      />
      <MyInput
        vr={validationResult}
        column
        fieldType="date"
        fieldLabel="DOB"
        fieldName="dob"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Age"
        fieldType="text"
        disabled
        fieldName="ageFormat"
        record={localPatient?.dob ? ageFormatType : null}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Patient Category"
        fieldType="text"
        fieldName="ageGroup"
        disabled
        record={localPatient?.dob ? ageGroupValue : null}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Patient Class"
        fieldType="select"
        fieldName="patientClassLkey"
        selectData={patientClassLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
        searchable={false}
      />
      {localPatient?.incompletePatient ? (
        <MyInput
          vr={validationResult}
          column
          fieldLabel="Unknown Patient"
          fieldType="checkbox"
          fieldName="unknownPatient"
          record={localPatient}
          setRecord={setLocalPatient}
          disabled
        />
      ) : null}
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Private Patient"
        fieldType="checkbox"
        fieldName="privatePatient"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="First Name (Sec. Lang)"
        fieldName="firstNameOtherLang"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Second Name (Sec. Lang)"
        fieldName="secondNameOtherLang"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Third Name (Sec. Lang)"
        fieldName="thirdNameOtherLang"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Last Name (Sec. Lang)"
        fieldName="lastNameOtherLang"
        record={localPatient}
        setRecord={setLocalPatient}
      />
    </Form>
  );
};

export default BasicInfo;
