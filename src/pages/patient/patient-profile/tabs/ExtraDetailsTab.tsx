import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Patient } from '@/types/model-types-new';
import React from 'react';
import { Form } from 'rsuite';
interface ExtraDetailsTabProps {
  localPatient: Patient;
  setLocalPatient: (patient: Patient) => void;
  validationResult: any;
}
const ExtraDetailsTab: React.FC<ExtraDetailsTabProps> = ({
  localPatient,
  setLocalPatient,
  validationResult
}) => {
  // Fetch LOV data for various fields
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
        column
        fieldLabel="Marital Status"
        fieldType="select"
        fieldName="maritalStatus"
        selectData={maritalStatusLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
        searchable={false}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Nationality"
        fieldType="select"
        fieldName="nationality"
        selectData={nationalityLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Religion"
        fieldType="select"
        fieldName="religion"
        selectData={religeonLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
        searchable={false}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Ethnicity"
        fieldType="select"
        fieldName="ethnicity"
        selectData={ethnicityLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
        searchable={false}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Occupation"
        fieldType="select"
        fieldName="occupation"
        selectData={occupationLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
        menuMaxHeight={200}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Responsible Party"
        fieldType="select"
        fieldName="responsibleParty"
        selectData={responsiblePartyLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
        searchable={false}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Educational Level"
        fieldType="select"
        fieldName="educationalLevel"
        selectData={educationalLevelLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
        searchable={false}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Previous ID"
        fieldName="previousId"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Archiving Number"
        fieldName="archivingNumber"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Details"
        fieldType="textarea"
        fieldName="details"
        record={localPatient}
        setRecord={setLocalPatient}
      />
    </Form>
  );
};

export default ExtraDetailsTab;
