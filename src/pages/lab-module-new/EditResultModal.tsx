import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';

import {
  useUpdateDiagnosticOrderTestResultMutation
} from '@/services/setup/diagnosticTest/diagnosticOrderTestResultService';

import {
  useGetLovAllValuesQuery,
  useGetLovsQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';

import { useAppDispatch } from '@/hooks';
import {
  initialListRequest,
  initialListRequestAllValues
} from '@/types/types';
import { notify } from '@/utils/uiReducerActions';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  result?: any;
  onSuccess?: () => void;
};

const getResultType = (profile?: any) =>
  profile?.resultType?.toUpperCase()?.trim();

const isLovProfile = (profile?: any) =>
  getResultType(profile) === 'LOV';

const isTextProfile = (profile?: any) =>
  getResultType(profile) === 'TEXT';
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
  const isText = isTextProfile(profile);

  try {
    await updateResult({
      id: result.id,
      body: {
        id: result.id,
        orderTestId: result.orderTestId,
        profileTestId: result.profileTestId,

        resultValueNumber:
          isLov || isText
            ? null
            : form.resultValueNumber,

        resultValueText:
          isLov || isText
            ? form.resultValueText
            : null
      }
    }).unwrap();

    setOpen(false);
    onSuccess?.();

  } catch (err: any) {

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

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
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
          <div dir={dir}>
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
                  disableByField="isValid"
                  selectDataValue="key"
                  width="20vw"
                />

              ) : isTextProfile(profile) ? (

                <MyInput
                  fieldName="resultValueText"
                  fieldType="text"
                  label="RESULT"
                  record={form}
                  setRecord={setForm}
                  width="20vw"
                />

              ) : (

                <MyInput
                  fieldName="resultValueNumber"
                  fieldType="number"
                  label="RESULT"
                  allowDecimal
                  record={form}
                  setRecord={setForm}
                  width="20vw"
                />

              )}

            </Form>
          </div>
        }
      />
    </div>
  );
};

export default EditResultModal;
