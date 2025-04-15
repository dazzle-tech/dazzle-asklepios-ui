import React from 'react';
import type { ApPatient } from '@/types/model-types';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

interface DemographicsTabProps {
  localPatient: ApPatient;
  setLocalPatient: (patient: ApPatient) => void;
  validationResult: any;
}

const DemographicsTab: React.FC<DemographicsTabProps> = ({
  localPatient,
  setLocalPatient,
  validationResult
}) => {
  // Fetch LOV data
  const { data: maritalStatusLovQueryResponse } = useGetLovValuesByCodeQuery('MARI_STATUS');
  const { data: nationalityLovQueryResponse } = useGetLovValuesByCodeQuery('NAT');
  const { data: religeonLovQueryResponse } = useGetLovValuesByCodeQuery('REL');
  const { data: ethnicityLovQueryResponse } = useGetLovValuesByCodeQuery('ETH');
  const { data: occupationLovQueryResponse } = useGetLovValuesByCodeQuery('OCCP');
  const { data: responsiblePartyLovQueryResponse } = useGetLovValuesByCodeQuery('RESP_PARTY');
  const { data: educationalLevelLovQueryResponse } = useGetLovValuesByCodeQuery('EDU_LEVEL');

  return (
    <Form layout="inline" fluid>
      <MyInput
        vr={validationResult}
        width={165}
        column
        fieldLabel="First Name (Sec. Lang)"
        fieldName="firstNameOtherLang"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        width={165}
        column
        fieldLabel="Second Name (Sec. Lang)"
        fieldName="secondNameOtherLang"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldLabel="Third Name (Sec. Lang)"
        fieldName="thirdNameOtherLang"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldLabel="Last Name (Sec. Lang)"
        fieldName="lastNameOtherLang"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldLabel="Marital Status"
        fieldType="select"
        fieldName="maritalStatusLkey"
        selectData={maritalStatusLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldLabel="Nationality"
        fieldType="select"
        fieldName="nationalityLkey"
        selectData={nationalityLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldLabel="Religion"
        fieldType="select"
        fieldName="religionLkey"
        selectData={religeonLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldLabel="Ethnicity"
        fieldType="select"
        fieldName="ethnicityLkey"
        selectData={ethnicityLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldLabel="Occupation"
        fieldType="select"
        fieldName="occupationLkey"
        selectData={occupationLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldLabel="Responsible Party"
        fieldType="select"
        fieldName="responsiblePartyLkey"
        selectData={responsiblePartyLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldLabel="Educational Level"
        fieldType="select"
        fieldName="educationalLevelLkey"
        selectData={educationalLevelLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldLabel="Previous ID"
        fieldName="previousId"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldLabel="Archiving Number"
        fieldName="archivingNumber"
        record={localPatient}
        setRecord={setLocalPatient}
      />
    </Form>
  );
};

export default DemographicsTab;
