import React from 'react';
import type { ApPatient } from '@/types/model-types';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

interface ContactTabProps {
  localPatient: ApPatient;
  setLocalPatient: (patient: ApPatient) => void;
  validationResult: any;
}

const ContactTab: React.FC<ContactTabProps> = ({
  localPatient,
  setLocalPatient,
  validationResult
}) => {
  // Fetch LOV data
  const { data: preferredWayOfContactLovQueryResponse } =
    useGetLovValuesByCodeQuery('PREF_WAY_OF_CONTACT');
  const { data: primaryLangLovQueryResponse } = useGetLovValuesByCodeQuery('LANG');
  const { data: relationsLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
  const { data: roleLovQueryResponse } = useGetLovValuesByCodeQuery('ER_CONTACTP_ROLE');

  return (
    <Form layout="inline" fluid>
      <MyInput
        vr={validationResult}
        column
        required
        width={165}
        fieldName="phoneNumber"
        fieldLabel="Primary Mobile Number"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldType="checkbox"
        fieldName="receiveSms"
        fieldLabel="Receive SMS"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldLabel="Secondary Mobile Number"
        fieldName="secondaryMobileNumber"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldName="homePhone"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldName="workPhone"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldName="email"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldType="checkbox"
        fieldName="receiveEmail"
        fieldLabel="Receive Email"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldLabel="Preferred Way of Contact"
        fieldType="select"
        fieldName="preferredContactLkey"
        selectData={preferredWayOfContactLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldLabel="Native Language"
        fieldType="select"
        fieldName="primaryLanguageLkey"
        selectData={primaryLangLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldName="emergencyContactName"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldLabel="Emergency Contact Relation"
        fieldType="select"
        fieldName="emergencyContactRelationLkey"
        selectData={relationsLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldName="emergencyContactPhone"
        record={localPatient}
        setRecord={setLocalPatient}
      />
      <MyInput
        vr={validationResult}
        column
        width={165}
        fieldLabel="Role"
        fieldType="select"
        fieldName="roleLkey"
        selectData={roleLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
      />
    </Form>
  );
};

export default ContactTab;
