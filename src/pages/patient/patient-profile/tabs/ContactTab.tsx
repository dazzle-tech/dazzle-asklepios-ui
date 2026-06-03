import React from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import PhoneNumberInput from '@/components/PhoneNumberInput/PhoneNumberInput';
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
  useGetLovValuesByCodeQuery('PREF_WAY_OF_CONTACT');
  const preferredWayOfContactEnum = useEnumOptions('PreferredWayOfContact');
  const { data: primaryLangLovQueryResponse } = useGetLovValuesByCodeQuery('LANG');
  const { data: relationsLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
  const { data: roleLovQueryResponse } = useGetLovValuesByCodeQuery('ER_CONTACTP_ROLE');

  const normalizePhoneE164 = (raw: string): string => {
    const s = raw.trim();
    if (!s) return '';
    if (s.startsWith('+')) return s;
    if (s.startsWith('00')) return '+' + s.slice(2);
    return '+' + s;
  };

  const parsePhoneWithPrefix = (phoneValue: unknown): string => {
    if (!phoneValue) return '';

    if (typeof phoneValue === 'string') return normalizePhoneE164(phoneValue);
    if (typeof phoneValue !== 'object') return normalizePhoneE164(String(phoneValue));

    const valueObject = phoneValue as Record<string, unknown>;
    const directPhone =
      valueObject.phone ??
      valueObject.phoneNumber ??
      valueObject.mobileNumber ??
      valueObject.value ??
      valueObject.number;

    if (typeof directPhone === 'string' && directPhone.trim()) {
      return normalizePhoneE164(directPhone);
    }

    const rawPrefix =
      valueObject.prefix ?? valueObject.countryCode ?? valueObject.dialCode ?? valueObject.code;
    const rawNumber =
      valueObject.localNumber ??
      valueObject.nationalNumber ??
      valueObject.mobile ??
      valueObject.lineNumber;

    const prefix = typeof rawPrefix === 'string' ? rawPrefix.trim() : '';
    const number = typeof rawNumber === 'string' ? rawNumber.trim() : '';
    if (!prefix || !number) return '';

    const normalizedPrefix = prefix.startsWith('+') ? prefix : `+${prefix}`;
    return `${normalizedPrefix}${number}`;
  };

  return (
    <Form layout="inline" fluid>
      <PhoneNumberInput
        column
        required
        fieldName="primaryMobileNumber"
        fieldLabel="Primary Mobile Number"
        record={localPatient}
        setRecord={setLocalPatient}
        value={parsePhoneWithPrefix(localPatient?.primaryMobileNumber)}
        width={170}
        resetKey={localPatient?.id ?? 'new'}
      />
      <MyInput
        vr={validationResult}
        column
        fieldType="checkbox"
        fieldName="receiveSms"
        fieldLabel="Receive SMS"
        record={localPatient}
        setRecord={setLocalPatient}
        width={170}
      />
      <PhoneNumberInput
        column
        fieldLabel="Secondary Mobile Number"
        fieldName="secondMobileNumber"
        record={localPatient}
        setRecord={setLocalPatient}
        value={parsePhoneWithPrefix(localPatient?.secondMobileNumber)}
        width={170}
        resetKey={localPatient?.id ?? 'new'}
      />
      <MyInput
        vr={validationResult}
        column
        fieldName="homePhone"
        record={localPatient}
        setRecord={setLocalPatient}
        width={170}
      />
      <MyInput
        vr={validationResult}
        column
        fieldName="workPhone"
        record={localPatient}
        setRecord={setLocalPatient}
        width={170}
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
        width={170}
        disableByField='isValid'

      />
      <MyInput
        required
        vr={validationResult}
        column
        fieldName="email"
        record={localPatient}
        setRecord={setLocalPatient}
        width={170}
      />
      <MyInput
        vr={validationResult}
        column
        fieldType="checkbox"
        fieldName="receiveEmail"
        fieldLabel="Receive Email"
        record={localPatient}
        setRecord={setLocalPatient}
        width={170}
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
        width={170}
        disableByField='isValid'

      />
      <MyInput
        vr={validationResult}
        column
        fieldName="emergencyContactName"
        record={localPatient}
        setRecord={setLocalPatient}
        width={170}
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
        width={170}
        disableByField='isValid'

      />
      <PhoneNumberInput
        column
        fieldLabel="Emergency Contact Phone"
        fieldName="emergencyContactPhone"
        record={localPatient}
        setRecord={setLocalPatient}
        value={parsePhoneWithPrefix(localPatient?.emergencyContactPhone)}
        width={170}
        resetKey={localPatient?.id ?? 'new'}
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
        width={170}
        disableByField='isValid'

      />
    </Form>
  );
};

export default ContactTab;
