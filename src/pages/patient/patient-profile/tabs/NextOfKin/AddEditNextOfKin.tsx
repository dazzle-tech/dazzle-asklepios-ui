import React from 'react';
import { Form } from 'rsuite';
import '../styles.less';
import { useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import PhoneNumberInput from '@/components/PhoneNumberInput/PhoneNumberInput';
import { notify } from '@/utils/uiReducerActions';
import MyModal from '@/components/MyModal/MyModal';
import { GiRelationshipBounds } from 'react-icons/gi';
import { useEnumOptions } from '@/services/enumsApi';

import {
  useAddNextOfKinMutation,
  useUpdateNextOfKinMutation
} from '@/services/patients/NextOfKinService';

const AddEditNextOfKin = ({ open, setOpen, patientId, nextOfKin, setNextOfKin }) => {
  const dispatch = useAppDispatch();

  const relationships = useEnumOptions('RelationType');

  const [addNextOfKin] = useAddNextOfKinMutation();
  const [updateNextOfKin] = useUpdateNextOfKinMutation();

  const parsePhoneWithPrefix = (phoneValue: unknown): string => {
    if (!phoneValue) return '';
    if (typeof phoneValue === 'string') return phoneValue;
    if (typeof phoneValue !== 'object') return String(phoneValue);

    const valueObject = phoneValue as Record<string, unknown>;
    const directPhone =
      valueObject.phone ??
      valueObject.phoneNumber ??
      valueObject.mobileNumber ??
      valueObject.value ??
      valueObject.number;

    if (typeof directPhone === 'string' && directPhone.trim()) {
      return directPhone.trim();
    }

    const rawPrefix =
      valueObject.prefix ??
      valueObject.countryCode ??
      valueObject.dialCode ??
      valueObject.code;
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

  const formatApiValidationError = err => {
    const data = err?.data ?? err;
    const fieldErrors = data?.fieldErrors ?? [];

    const byField = fieldErrors.reduce((acc, fe) => {
      if (!fe?.field) return acc;
      acc[fe.field] = fe.message ?? 'Invalid';
      return acc;
    }, {});

    const lines = Object.entries(byField).map(([field, msg]) => `• ${field}: ${msg}`);

    return {
      title: data?.title ?? 'Validation error',
      detail: data?.detail,
      byField,
      message: lines.length ? lines.join('\n') : (data?.detail ?? 'Save failed')
    };
  };

  const toUpdateDto = nok => ({
    name: nok?.name ?? '',
    relationship: nok?.relationship ?? null,
    address: nok?.address ?? '',
    email: nok?.email ?? '',
    mobileNumber: nok?.mobileNumber ?? '',
    telephone: nok?.telephone ?? null,
    internationalNumber: nok?.internationalNumber ?? null,
    landlineNumber: nok?.landlineNumber ?? null,
  });


  const handleSave = async () => {
    if (!patientId) {
      dispatch(notify({ msg: 'Missing patientId', sev: 'error' }));
      return;
    }

    const requiredFieldErrors: string[] = [];
    if (!String(nextOfKin?.name ?? '').trim()) requiredFieldErrors.push('Name is required');
    if (!nextOfKin?.relationship) requiredFieldErrors.push('Relationship is required');
    if (!String(nextOfKin?.address ?? '').trim()) requiredFieldErrors.push('Address is required');
    if (!String(nextOfKin?.email ?? '').trim()) requiredFieldErrors.push('Email is required');
    if (!String(nextOfKin?.mobileNumber ?? '').trim()) {
      requiredFieldErrors.push('Mobile Number is required');
    }

    if (requiredFieldErrors.length) {
      dispatch(
        notify({
          msg: requiredFieldErrors.join('\n'),
          sev: 'error'
        })
      );
      return;
    }

    try {
      if (nextOfKin?.id) {
        await updateNextOfKin({
          id: nextOfKin.id,
          data: { ...toUpdateDto(nextOfKin) }
        }).unwrap();
      } else {
        const { ...rest } = nextOfKin || {};
        await addNextOfKin({
          ...rest,
          patientId
        }).unwrap();
      }

      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
      setNextOfKin({});
      setOpen(false);
    } catch (e) {
      const formatted = formatApiValidationError(e);

      dispatch(
        notify({
          msg: formatted.message,
          sev: 'warning'
        })
      );
    }
  };

  // MyModal content
  const content = () => (
    <Form layout="inline" className="ph-main-container" fluid>
      <MyInput required column fieldName="name" record={nextOfKin} setRecord={setNextOfKin} />

      <MyInput
        required
        column
        fieldType="select"
        fieldName="relationship"
        selectData={relationships ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={nextOfKin}
        setRecord={setNextOfKin}
      />

      <MyInput required column fieldName="address" record={nextOfKin} setRecord={setNextOfKin} />
      <MyInput required column fieldName="email" record={nextOfKin} setRecord={setNextOfKin} />

      <PhoneNumberInput
        required
        column
        fieldLabel="Mobile Number"
        fieldName="mobileNumber"
        record={nextOfKin}
        setRecord={setNextOfKin}
        value={parsePhoneWithPrefix(nextOfKin?.mobileNumber)}
      />

      <MyInput column fieldType="textnumber" fieldName="telephone" record={nextOfKin} setRecord={setNextOfKin} />
      <PhoneNumberInput
        column
        fieldLabel="International Number"
        fieldName="internationalNumber"
        record={nextOfKin}
        setRecord={setNextOfKin}
        value={parsePhoneWithPrefix(nextOfKin?.internationalNumber)}
      />
      <MyInput
        column
        fieldType="textnumber"
        fieldName="landlineNumber"
        record={nextOfKin}
        setRecord={setNextOfKin}
      />
    </Form>
  );

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="New/Edit Next Of Kin"
      actionButtonLabel="Save"
      bodyheight="65vh"
      actionButtonFunction={handleSave}
      size="35vw"
      content={<div dir={dir}>{content()}</div>}
      steps={[{ title: 'Next Of Kin', icon: <GiRelationshipBounds /> }]}
    />
  );
};

export default AddEditNextOfKin;
