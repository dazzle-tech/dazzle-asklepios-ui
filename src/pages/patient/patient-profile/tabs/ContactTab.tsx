import React from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Patient } from '@/types/model-types-new';
import { useEnumOptions } from '@/services/enumsApi';

interface ContactTabProps {
  localPatient: Patient;
  setLocalPatient: (patient: Patient) => void;
  validationResult: any;
}
const ContactTab: React.FC<ContactTabProps> = ({
  localPatient,
  setLocalPatient,
  validationResult
}) => {
  // Fetch LOV data for various fields
  const { data: preferredWayOfContactLovQueryResponse } =
    useGetLovValuesByCodeQuery('PREF_WAY_OF_CONTACT');
  const preferredWayOfContactEnum = useEnumOptions('PreferredWayOfContact');
  const { data: primaryLangLovQueryResponse } = useGetLovValuesByCodeQuery('LANG');
  const { data: relationsLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
  const { data: roleLovQueryResponse } = useGetLovValuesByCodeQuery('ER_CONTACTP_ROLE');

  return (
    <Form layout="inline" fluid>
      <MyInput
        vr={validationResult}
        column
        required
        fieldName="primaryMobileNumber"
        fieldLabel="Primary Mobile Number"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldType="checkbox"
        fieldName="receiveSms"
        fieldLabel="Receive SMS"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Secondary Mobile Number"
        fieldName="secondMobileNumber"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldName="homePhone"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldName="workPhone"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldName="email"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldType="checkbox"
        fieldName="receiveEmail"
        fieldLabel="Receive Email"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Preferred Way of Contact"
        fieldType="select"
        fieldName="preferredWayOfContact"
        selectData={preferredWayOfContactEnum ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={localPatient}
        setRecord={setLocalPatient}
        searchable={false}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Native Language"
        fieldType="select"
        fieldName="nativeLanguage"
        selectData={primaryLangLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
        searchable={false}
      />
      <MyInput
        vr={validationResult}
        column
        fieldName="emergencyContactName"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Emergency Contact Relation"
        fieldType="select"
        fieldName="emergencyContactRelation"
        selectData={relationsLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
        searchable={false}
        menuMaxHeight={200}
      />
      <MyInput
        vr={validationResult}
        column
        fieldName="emergencyContactPhone"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Role"
        fieldType="select"
        fieldName="role"
        selectData={roleLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
        searchable={false}
      />
    </Form>
  );
};

export default ContactTab;
