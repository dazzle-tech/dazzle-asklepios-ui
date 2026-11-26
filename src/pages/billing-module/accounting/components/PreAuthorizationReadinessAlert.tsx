import React, { useMemo } from 'react';
import { Message, Text } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faRotateRight } from '@fortawesome/free-solid-svg-icons';

import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils';
import {
  type PreAuthorizationClaimType,
  type PreAuthorizationMissingField,
  useGetPreAuthorizationReadinessQuery,
  useSendPendingPreAuthorizationMutation
} from '@/services/waseel-integration/preAuthorizationService';
import { readMissingFields } from '@/reducers/preAuthorizationMissingFieldsSlice';

const CLAIM_TYPE_LABELS: Record<PreAuthorizationClaimType, string> = {
  PROFESSIONAL_OP: 'Professional - OP',
  PROFESSIONAL_EMERGENCY: 'Professional - Emergency',
  ORAL_OP: 'Dental - OP'
};

type Props = {
  encounterId: number | null;
  onSent?: () => void;
};

/** Missing fields grouped by the screen section where the user fills them. */
const groupBySection = (fields: PreAuthorizationMissingField[]) =>
  fields.reduce<Record<string, string[]>>((groups, field) => {
    (groups[field.section] ??= []).push(field.label);
    return groups;
  }, {});

/**
 * Shown while services of the visit wait for a Waseel pre-authorization that was not sent:
 * lists every mandatory field still missing and sends the request once they are filled.
 */
const PreAuthorizationReadinessAlert: React.FC<Props> = ({ encounterId, onSent }) => {
  const dispatch = useAppDispatch();
  const { data: readiness, isFetching, refetch } = useGetPreAuthorizationReadinessQuery(
    { encounterId: encounterId as number },
    { skip: encounterId == null, refetchOnFocus: true }
  );
  const [sendPendingPreAuthorization, { isLoading: isSending }] = useSendPendingPreAuthorizationMutation();

  const missingBySection = useMemo(() => groupBySection(readiness?.missingFields ?? []), [readiness?.missingFields]);

  if (encounterId == null || !readiness || readiness.waitingItems === 0) {
    return null;
  }

  const send = async () => {
    try {
      await sendPendingPreAuthorization({ encounterId }).unwrap();
      dispatch(notify({ msg: 'Pre-authorization sent to Waseel.', sev: 'success' }));
      onSent?.();
    } catch (error) {
      if (!readMissingFields(error)) {
        dispatch(notify({ msg: extractApiErrorMessage(error) || 'Pre-authorization was not sent.', sev: 'error' }));
      }
      refetch();
    }
  };

  return (
    <Message showIcon type={readiness.ready ? 'info' : 'warning'} style={{ marginBottom: 12 }}>
      <Text weight="semibold">
        {readiness.waitingItems} service(s) need a Waseel pre-authorization ({CLAIM_TYPE_LABELS[readiness.claimType]})
      </Text>
      {readiness.ready ? (
        <Text size="sm" style={{ display: 'block', marginTop: 4 }}>
          All required fields are filled. Send the pre-authorization to continue.
        </Text>
      ) : (
        <>
          <Text size="sm" style={{ display: 'block', marginTop: 4 }}>
            Fill these fields in the visit, then send the pre-authorization. The services wait off the patient
            account until then.
          </Text>
          <ul style={{ margin: '6px 0 0', paddingInlineStart: 18 }}>
            {Object.entries(missingBySection).map(([section, labels]) => (
              <li key={section}>
                <Text size="sm">
                  <strong>{section}:</strong> {labels.join(', ')}
                </Text>
              </li>
            ))}
          </ul>
        </>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <MyButton
          appearance="primary"
          loading={isSending}
          disabled={!readiness.ready}
          prefixIcon={() => <FontAwesomeIcon icon={faPaperPlane} />}
          onClick={send}
        >
          Send pre-authorization
        </MyButton>
        <MyButton
          appearance="ghost"
          loading={isFetching}
          prefixIcon={() => <FontAwesomeIcon icon={faRotateRight} />}
          onClick={() => refetch()}
        >
          Check again
        </MyButton>
      </div>
    </Message>
  );
};

export default PreAuthorizationReadinessAlert;
