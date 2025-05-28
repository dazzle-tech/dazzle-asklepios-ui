import React from 'react';
import type { ApPatient } from '@/types/model-types';
import { Form, Stack } from 'rsuite';
import MyInput from '@/components/MyInput';

interface BasicInfoTabProps {
  localPatient: ApPatient;
  setLocalPatient: (patient: ApPatient) => void;
  validationResult: any;
  genderLovQueryResponse: any;
  docTypeLovQueryResponse: any;
  countryLovQueryResponse: any;
  patientClassLovQueryResponse: any;
  ageFormatType: { ageFormat: string };
  ageGroupValue: { ageGroup: string };
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  localPatient,
  setLocalPatient,
  validationResult,
  genderLovQueryResponse,
  docTypeLovQueryResponse,
  countryLovQueryResponse,
  patientClassLovQueryResponse,
  ageFormatType,
  ageGroupValue
}) => {
  return (
    <Stack>
      <Stack.Item grow={1}></Stack.Item>
      <Stack.Item grow={15}>
        <Form layout="inline" fluid>
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
            fieldLabel="Document Type"
            fieldType="select"
            fieldName="documentTypeLkey"
            selectData={docTypeLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={localPatient}
            setRecord={setLocalPatient}
            searchable={false}
          />
          <MyInput
            required
            vr={validationResult}
            column
            fieldLabel="Document Country"
            fieldType="select"
            fieldName="documentCountryLkey"
            selectData={countryLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={localPatient}
            setRecord={setLocalPatient}
            disabled={localPatient.documentTypeLkey === 'NO_DOC'}
          />
          <MyInput
            required
            vr={validationResult}
            column
            fieldLabel="Document Number"
            fieldName="documentNo"
            record={localPatient}
            setRecord={setLocalPatient}
            disabled={localPatient.documentTypeLkey === 'NO_DOC'}
          />
        </Form>
      </Stack.Item>
    </Stack>
  );
};

export default BasicInfoTab;
