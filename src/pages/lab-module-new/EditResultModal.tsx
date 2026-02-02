import React, { useState, useEffect } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import { Form, HStack } from 'rsuite';

import {
  useUpdateDiagnosticOrderTestResultMutation
} from '@/services/setup/diagnosticTest/diagnosticOrderTestResultService';

import {
  useGetLovValuesByCodeQuery,
  useGetLovAllValuesQuery,
  useGetLovsQuery
} from '@/services/setupService';

import {
  initialListRequestAllValues,
  initialListRequest
} from '@/types/types';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  result?: any;
  onSuccess?: () => void;
};

const isLovProfile = (profile?: any) =>
  profile?.resultType?.toUpperCase() === 'LOV';

const EditResultModal = ({
  open,
  setOpen,
  result,
  onSuccess
}: Props) => {

  const profile = result?.profile;
  const [form, setForm] = useState<any>({
    resultValueNumber: null,
    resultValueText: null,
    resultUnit: null
  });

const dispatch = useAppDispatch();

  const { data: valueUnitLov } =
    useGetLovValuesByCodeQuery('VALUE_UNIT');

  const { data: allLovValues } =
    useGetLovAllValuesQuery({ ...initialListRequestAllValues });

  const { data: lovDefinitions } =
    useGetLovsQuery({ ...initialListRequest, pageSize: 1000 });

  const resolveLovOptions = () => {
    if (
      !profile?.listOfValueId ||
      !lovDefinitions?.object ||
      !allLovValues?.object
    ) return [];

    const def = lovDefinitions.object.find(
      (d: any) => String(d.key) === String(profile.listOfValueId)
    );

    if (!def?.lovCode) return [];

    return allLovValues.object.filter(
      (v: any) => String(v.lovCode) === String(def.lovCode)
    );
  };

  useEffect(() => {
    if (!result) return;

    setForm({
      resultValueNumber: result.resultValueNumber ?? null,
      resultValueText: result.resultValueText ?? null,
      resultUnit: profile?.resultUnit
        ? String(profile.resultUnit)
        : null
    });
  }, [result, profile]);

  const [
    updateResult,
    { isLoading }
  ] = useUpdateDiagnosticOrderTestResultMutation();

const handleSave = async () => {
  if (!result?.id) return;

  const isLov = isLovProfile(profile);

  try {
    await updateResult({
      id: result.id,
    body: {
    id: result.id,
    orderId: result.orderId,
    orderTestId: result.orderTestId,
    profileTestId: result.profileTestId,

    resultValueNumber: isLov ? null : form.resultValueNumber,
    resultValueText: isLov ? form.resultValueText : null
    }
    }).unwrap();

    setOpen(false);
    onSuccess?.();

  } catch (err: any) {
    console.error('Update result failed:', err);

    const msg =
      err?.data?.message ||
      err?.data?.detail ||
      err?.error ||
      'Update result failed';

    dispatch(
      notify({
        msg,
        sev: 'error'
      })
    );
  }
};


  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Edit Result"
      size="30vw"
      bodyheight='40vh'
      actionButtonFunction={handleSave}
      actionButtonLabel='Save'
      position="center"
      content={
        <Form fluid>

          {isLovProfile(profile) ? (
            <MyInput
              fieldName="resultValueText"
              fieldType="select"
              label="RESULT"
              record={form}
              setRecord={setForm}
              selectData={resolveLovOptions()}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              width={"20vw"}
            />
          ) : (
            <MyInput
              fieldName="resultValueNumber"
              fieldType="number"
              label="RESULT"
              record={form}
              setRecord={setForm}
              width={"20vw"}
            />
          )}

        </Form>
      }
    />
  );
};

export default EditResultModal;
