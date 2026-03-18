import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import {
  useCreateDiagnosticOrderTestResultMutation,
  useGetFilledProfileTestIdsQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestResultService';
import { initialListRequest, initialListRequestAllValues } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { faFlask } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useMemo, useState } from 'react';
import { Form, Panel } from 'rsuite';

import {
  useGetActiveLabProfilesByTestIdsMutation
} from '@/services/setup/diagnosticTest/diagnosticTestProfileService';

import {
  useGetLovAllValuesQuery,
  useGetLovsQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { ColumnConfig } from '@/components/MyTable/MyTable';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  acceptedTests: any[];
  onSuccess?: () => void;
};

const AddResultModal = ({
  open,
  setOpen,
  acceptedTests,
  onSuccess
}: Props) => {
  const dispatch = useAppDispatch();
  const { data: valueUnitLov } =
    useGetLovValuesByCodeQuery('VALUE_UNIT');

  const { data: allLovValues } =
    useGetLovAllValuesQuery({ ...initialListRequestAllValues });

  const { data: lovDefinitions } =
    useGetLovsQuery({ ...initialListRequest, pageSize: 1000 });

  const [createResult, { isLoading: isSavingResult }] =
    useCreateDiagnosticOrderTestResultMutation();

  const [getProfilesForLab] =
    useGetActiveLabProfilesByTestIdsMutation();

  const [profilesByTestId, setProfilesByTestId] =
    useState<Record<number, any[]>>({});

  const [results, setResults] =
    useState<Record<number, Record<number, any>>>({});

  const orderTestIds = useMemo(
    () => acceptedTests.map(t => t.id),
    [acceptedTests]
  );

  const {
    data: filledProfileTestIds = [],
    refetch: refetchFilledProfiles
  } = useGetFilledProfileTestIdsQuery(
    { orderTestIds },
    {
      skip: !open || !orderTestIds.length
    }
  );

  const acceptedTestIds = useMemo(
    () => acceptedTests.map(t => t.testId),
    [acceptedTests]
  );


  useEffect(() => {
    if (!open || !acceptedTestIds.length) return;

    getProfilesForLab(acceptedTestIds)
      .unwrap()
      .then(res => setProfilesByTestId(res ?? {}))
      .catch(() => {
        dispatch(
          notify({
            msg: 'Failed to load test profiles',
            sev: 'error'
          })
        );
      });
  }, [open, acceptedTestIds, getProfilesForLab, dispatch]);


  const resolveUnitLabel = (profile: any) => {
    if (!profile?.resultUnit) return '';
    return (
      valueUnitLov?.object?.find(
        u => String(u.key) === String(profile.resultUnit)
      )?.lovDisplayVale ?? ''
    );
  };

  const resolveLovOptions = (profile: any) => {
    if (
      !profile?.listOfValueId ||
      !lovDefinitions?.object ||
      !allLovValues?.object
    ) {
      return [];
    }
    const definition = lovDefinitions.object.find(
      (def: any) =>
        String(def.key) === String(profile.listOfValueId)
    );

    if (!definition?.lovCode) return [];
    return allLovValues.object.filter(
      (lov: any) =>
        String(lov.lovCode) === String(definition.lovCode)
    );
  };

  const handleSaveSingleResult = async (orderTest: any, profile: any) => {
    const value = results?.[orderTest.testId]?.[profile.id];

    if (value === undefined || value === null || value === '') {
      dispatch(
        notify({
          msg: 'Please enter result value',
          sev: 'warning'
        })
      );
      return;
    }

    const resultType = profile?.resultType?.toUpperCase()?.trim();

    const isNumber = [
      'NUMBER',
      'NUMERIC',
      'INTEGER',
      'FLOAT',
      'DECIMAL'
    ].includes(resultType);

    const payload: any = {
      orderTestId: orderTest.id,
      profileTestId: profile.id,
      ...(isNumber
        ? { resultValueNumber: Number(value) }
        : { resultValueText: String(value) })
    };

    const res = await createResult(payload);
    if ('error' in res) {
      dispatch(
        notify({
          msg:
            (res.error as any)?.data?.message ||
            (res.error as any)?.data?.detail ||
            'Save result failed',
          sev: 'error'
        })
      );
      return;
    }

    dispatch(
      notify({
        msg: `Result saved for ${profile.name}`,
        sev: 'success'
      })
    );
    await refetchFilledProfiles();
    onSuccess?.();
  };

  const buildColumns = (orderTest: any): ColumnConfig[] => [
    {
      key: 'name',
      title: 'Name',
      width: 160,
      render: (rowData: any) => (
        <strong>{rowData.name}</strong>
      )
    },
    {
      key: 'result',
      title: 'Result',
      width: 270,
      render: (profile: any) => {
        const isLov =
          profile?.resultType?.toUpperCase() === 'LOV';

        if (filledProfileTestIds.includes(profile.id)) {
          return (
            <span style={{ color: '#4caf50', fontWeight: 600 }}>
              Result Entered
            </span>
          );
        }

        const rowRecord = {
          ...(results?.[orderTest.testId] ?? {}),
          [profile.id]:
            results?.[orderTest.testId]?.[profile.id] ?? ''
        };

        return (
          <div
            style={{
              display: 'flex',
              gap: 8,
            }}
          >
            <div>
              <MyInput
                fieldName={String(profile.id)}
                fieldType={isLov ? 'select' : 'number'}
                selectData={isLov ? resolveLovOptions(profile) : undefined}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                showLabel={false}
                record={rowRecord}
                setRecord={(newRowRecord: any) => {
                  setResults(prev => ({
                    ...prev,
                    [orderTest.testId]: {
                      ...(prev[orderTest.testId] ?? {}),
                      ...(newRowRecord ?? {})
                    }
                  }));
                }}
                width={140}
              />
            </div>
            {!isLov && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: 36,
                  marginTop: 2
                }}
              >
                <span
                  style={{
                    color: '#666',
                    whiteSpace: 'nowrap',
                    lineHeight: '36px'
                  }}
                >
                  {resolveUnitLabel(profile)}
                </span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'action',
      title: 'Action',
      width: 120,
      align: 'center',
      render: (profile: any) => {

        return (
          <MyButton
            size="sm"
            disabled={isSavingResult}
            onClick={() =>
              handleSaveSingleResult(orderTest, profile)
            }
          >
            Save
          </MyButton>
        );
      }
    }

  ];


  useEffect(() => {
    if (!open) {
      setResults({});
    }
  }, [open]);


  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add Results"
      size="40vw"
      hideActionBtn
      steps={[
        { title: 'Results', icon: <FontAwesomeIcon icon={faFlask} /> }
      ]}
      content={
        <Form fluid>
          {acceptedTests.map(orderTest => {
            const profiles =
              (profilesByTestId[orderTest.testId] ?? []).filter(
                profile => !filledProfileTestIds.includes(profile.id)
              );

            return (
              <Panel
                key={orderTest.id}
                bordered
                header={<strong>{orderTest.test?.name}</strong>}
                style={{ marginBottom: 16 }}
              >

                {profiles.length === 0 ? (
                  <p style={{ color: '#999' }}>
                    No active profiles for this test
                  </p>
                ) : (

                  <MyTable
                    height={260}
                    data={profiles}
                    columns={buildColumns(orderTest)}
                  />
                )}
              </Panel>
            );
          })}
        </Form>
      }
    />
  );
};

export default AddResultModal;
