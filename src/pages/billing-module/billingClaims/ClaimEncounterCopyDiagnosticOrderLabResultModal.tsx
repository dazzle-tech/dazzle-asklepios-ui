import React, { useEffect, useMemo, useState } from 'react';
import { Form, Panel } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlask } from '@fortawesome/free-solid-svg-icons';
import { MdCancel } from 'react-icons/md';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import CancellationModal from '@/components/CancellationModal';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import { useGetActiveLabProfilesByTestIdsMutation } from '@/services/setup/diagnosticTest/diagnosticTestProfileService';
import {
  useGetLovAllValuesQuery,
  useGetLovsQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { initialListRequest, initialListRequestAllValues } from '@/types/types';

import {
  useCreateClaimEncounterCopyDiagnosticOrderTestResultMutation,
  useUpdateClaimEncounterCopyDiagnosticOrderTestResultMutation,
  useCancelClaimEncounterCopyDiagnosticOrderTestResultMutation
} from '@/services/billing/claimEncounterCopyDiagnosticOrderTestResultService';

interface ClaimEncounterCopyDiagnosticOrderLabResultModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  claimEncounterCopyId: number;
  orderTest: any;
  testName?: string;
  existingCopies: any[];
}

const getResultType = (profile?: any) =>
  profile?.resultType?.toUpperCase()?.trim();

const isLovProfile = (profile?: any) => getResultType(profile) === 'LOV';
const isTextProfile = (profile?: any) => getResultType(profile) === 'TEXT';

const ClaimEncounterCopyDiagnosticOrderLabResultModal = ({
  open,
  setOpen,
  claimEncounterCopyId,
  orderTest,
  testName,
  existingCopies
}: ClaimEncounterCopyDiagnosticOrderLabResultModalProps) => {
  const dispatch = useAppDispatch();

  const [getProfilesForLab] = useGetActiveLabProfilesByTestIdsMutation();
  const [profiles, setProfiles] = useState<any[]>([]);

  const [form, setForm] = useState<Record<number, any>>({});

  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);

  const { data: valueUnitLov } = useGetLovValuesByCodeQuery('VALUE_UNIT');

  const { data: allLovValues } = useGetLovAllValuesQuery({
    ...initialListRequestAllValues
  });

  const { data: lovDefinitions } = useGetLovsQuery({
    ...initialListRequest,
    pageSize: 1000
  });

  const [createResult, { isLoading: isCreating }] =
    useCreateClaimEncounterCopyDiagnosticOrderTestResultMutation();

  const [updateResult, { isLoading: isUpdating }] =
    useUpdateClaimEncounterCopyDiagnosticOrderTestResultMutation();

  const [cancelResult] =
    useCancelClaimEncounterCopyDiagnosticOrderTestResultMutation();

  useEffect(() => {
    if (!open || !orderTest?.testId) {
      return;
    }

    getProfilesForLab([orderTest.testId])
      .unwrap()
      .then(res => setProfiles(res?.[orderTest.testId] ?? []))
      .catch(() => {
        dispatch(
          notify({ msg: 'Failed to load test profiles', sev: 'error' })
        );
      });
  }, [open, orderTest?.testId, getProfilesForLab, dispatch]);

  const copyByProfileId = useMemo(() => {
    const map = new Map<number, any>();

    existingCopies
      .filter(c => c.status !== 'CANCELLED')
      .forEach(c => {
        if (c.profileTestId != null) {
          map.set(c.profileTestId, c);
        }
      });

    return map;
  }, [existingCopies]);

  useEffect(() => {
    if (!open) {
      setForm({});
      return;
    }

    const initial: Record<number, any> = {};

    profiles.forEach(profile => {
      const existing = copyByProfileId.get(profile.id);

      initial[profile.id] = {
        resultValueNumber: existing?.resultValueNumber ?? null,
        resultValueText: existing?.resultValueText ?? null
      };
    });

    setForm(initial);
  }, [open, profiles, copyByProfileId]);

  const resolveUnitLabel = (profile: any) => {
    if (!profile?.resultUnit) return '';

    return (
      valueUnitLov?.object?.find(
        (u: any) => String(u.key) === String(profile.resultUnit)
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
      (def: any) => String(def.key) === String(profile.listOfValueId)
    );

    if (!definition?.lovCode) return [];

    return allLovValues.object.filter(
      (lov: any) => String(lov.lovCode) === String(definition.lovCode)
    );
  };

  const handleSaveProfile = async (profile: any) => {
    const existing = copyByProfileId.get(profile.id);
    const value = form[profile.id] ?? {};

    const isLov = isLovProfile(profile);
    const isText = isTextProfile(profile);

    const resultValueNumber =
      isLov || isText ? null : value.resultValueNumber;

    const resultValueText =
      isLov || isText ? value.resultValueText : null;

    if (resultValueNumber == null && !resultValueText) {
      dispatch(
        notify({ msg: 'Result value is required', sev: 'warning' })
      );
      return;
    }

    try {
      if (existing) {
        await updateResult({
          id: existing.id,
          data: { resultValueNumber, resultValueText }
        }).unwrap();
      } else {
        await createResult({
          claimEncounterCopyId,
          data: {
            orderTestId: orderTest.id,
            profileTestId: profile.id,
            resultValueNumber,
            resultValueText,
            resultTypeAtEntry: getResultType(profile)
          }
        }).unwrap();
      }

      dispatch(
        notify({ msg: 'Result saved successfully', sev: 'success' })
      );
    } catch (error: any) {
      const data = error?.data ?? {};

      dispatch(
        notify({
          msg:
            data?.detail ||
            data?.message ||
            data?.title ||
            'Failed to save result',
          sev: 'error'
        })
      );
    }
  };

  const handleCancel = async () => {
    if (!cancelTargetId || !cancelReason.trim()) {
      return;
    }

    try {
      await cancelResult({
        id: cancelTargetId,
        data: { cancellationReason: cancelReason.trim() }
      }).unwrap();

      setOpenCancelModal(false);
      setCancelReason('');
      setCancelTargetId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <MyModal
        open={open}
        setOpen={setOpen}
        title="Laboratory Results"
        size="50vw"
        hideActionBtn
        steps={[
          { title: 'Results', icon: <FontAwesomeIcon icon={faFlask} /> }
        ]}
        content={
          <div dir={dir}>
            <Panel
              bordered
              header={<strong>{testName || `Test #${orderTest?.testId}`}</strong>}
            >
              <Form fluid>
                {profiles.map(profile => {
                  const existing = copyByProfileId.get(profile.id);

                  const isLov = isLovProfile(profile);
                  const isText = isTextProfile(profile);

                  const rowRecord = form[profile.id] ?? {
                    resultValueNumber: null,
                    resultValueText: null
                  };

                  return (
                    <div
                      key={profile.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '8px 0',
                        borderBottom: '1px solid var(--rs-border-primary)'
                      }}
                    >
                      <div style={{ width: 180, fontWeight: 600 }}>
                        {profile.name}
                      </div>

                      <MyInput
                        fieldName={isLov || isText ? 'resultValueText' : 'resultValueNumber'}
                        fieldType={isLov ? 'select' : isText ? 'text' : 'number'}
                        selectData={isLov ? resolveLovOptions(profile) : undefined}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        allowDecimal
                        showLabel={false}
                        record={rowRecord}
                        setRecord={(newRecord: any) =>
                          setForm(prev => ({
                            ...prev,
                            [profile.id]: { ...prev[profile.id], ...newRecord }
                          }))
                        }
                        width={isText ? 220 : 140}
                      />

                      {!isLov && !isText && (
                        <span style={{ color: '#666' }}>
                          {resolveUnitLabel(profile)}
                        </span>
                      )}

                      <MyButton
                        size="sm"
                        disabled={isCreating || isUpdating}
                        onClick={() => handleSaveProfile(profile)}
                      >
                        Save
                      </MyButton>

                      {existing && existing.status !== 'CANCELLED' && (
                        <MdCancel
                          size={20}
                          className="pointer"
                          color="#dc3545"
                          onClick={() => {
                            setCancelTargetId(existing.id);
                            setOpenCancelModal(true);
                          }}
                        />
                      )}

                      {existing?.status === 'CANCELLED' && (
                        <span style={{ color: '#dc3545', fontSize: 12 }}>
                          Cancelled
                        </span>
                      )}
                    </div>
                  );
                })}

                {profiles.length === 0 && (
                  <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>
                    No profiles configured for this test
                  </div>
                )}
              </Form>
            </Panel>
          </div>
        }
      />

      <CancellationModal
        title="Cancel Laboratory Result"
        fieldLabel="Cancellation Reason"
        open={openCancelModal}
        setOpen={value => {
          setOpenCancelModal(value);

          if (!value) {
            setCancelReason('');
          }
        }}
        object={{ cancellationReason: cancelReason }}
        setObject={(object: any) =>
          setCancelReason(object.cancellationReason || '')
        }
        handleCancle={handleCancel}
        fieldName="cancellationReason"
        required
      />
    </div>
  );
};

export default ClaimEncounterCopyDiagnosticOrderLabResultModal;
