import React from 'react';
import { Form } from 'rsuite';
import '../styles.less';
import { useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import { notify } from '@/utils/uiReducerActions';
import MyModal from '@/components/MyModal/MyModal';
import { GiRelationshipBounds } from 'react-icons/gi';
import { useEnumOptions } from '@/services/enumsApi';

// ✅ hooks من RTK Query service
import {
  useAddNextOfKinMutation,
  useUpdateNextOfKinMutation
} from '@/services/patients/NextOfKinService';

const AddEditNextOfKin = ({ open, setOpen, patientId, nextOfKin, setNextOfKin }) => {
  const dispatch = useAppDispatch();

  const relationships = useEnumOptions('RelationType');

  const [addNextOfKin, { isLoading: isCreating }] = useAddNextOfKinMutation();
  const [updateNextOfKin, { isLoading: isUpdating }] = useUpdateNextOfKinMutation();

  const isSaving = isCreating || isUpdating;
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
   const toUpdateDto = (nok) => ({
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

    try {
      if (nextOfKin?.id) {
       
        await updateNextOfKin({
          id: nextOfKin.id,
          data: { ...toUpdateDto(nextOfKin) }
        }).unwrap();
      } else {
        const { id, ...rest } = nextOfKin || {};
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

      <MyInput
        required
        column
        fieldType="text"
        fieldName="mobileNumber"
        record={nextOfKin}
        setRecord={setNextOfKin}
      />

      <MyInput column fieldType="text" fieldName="telephone" record={nextOfKin} setRecord={setNextOfKin} />
      <MyInput
        column
        fieldType="text"
        fieldName="internationalNumber"
        record={nextOfKin}
        setRecord={setNextOfKin}
      />
      <MyInput
        column
        fieldType="text"
        fieldName="landlineNumber"
        record={nextOfKin}
        setRecord={setNextOfKin}
      />
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="New/Edit Next Of Kin"
      actionButtonLabel="Save"
      bodyheight="65vh"
      actionButtonFunction={handleSave}
      size="35vw"
      content={content}
      steps={[{ title: 'Next Of Kin', icon: <GiRelationshipBounds /> }]}
    />
  );
};

export default AddEditNextOfKin;