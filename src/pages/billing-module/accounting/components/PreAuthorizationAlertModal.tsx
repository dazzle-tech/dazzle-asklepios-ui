import React, { useRef, useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import { useClosePreAuthorizationAlertMutation } from '@/services/billing/billingTransactionService';
import { notify } from '@/utils/uiReducerActions';
import { PRE_AUTHORIZATION_HOLD_MESSAGE } from '../utils/billingAccountingUtils';

export type PreAuthorizationAlertItem = {
  patientServiceProductId?: number | null;
  label: string;
};

type Props = {
  open: boolean;
  encounterId?: number | null;
  items: PreAuthorizationAlertItem[];
  onClosed: () => void;
};

const PreAuthorizationAlertModal = ({ open, encounterId, items, onClosed }: Props) => {
  const dispatch = useAppDispatch();
  const [closeAlert] = useClosePreAuthorizationAlertMutation();
  const [saving, setSaving] = useState(false);
  const closing = useRef(false);

  const close = async () => {
    if (closing.current) {
      return;
    }
    if (!encounterId) {
      dispatch(notify({ msg: 'The visit is missing, so this alert cannot be saved.', sev: 'error' }));
      return;
    }
    closing.current = true;
    setSaving(true);
    try {
      await closeAlert({
        encounterId: Number(encounterId),
        message: PRE_AUTHORIZATION_HOLD_MESSAGE,
        items: (items.length ? items : [{ label: 'Service' }]).map(item => ({
          patientServiceProductId: item.patientServiceProductId ?? null,
          label: item.label
        }))
      }).unwrap();
      onClosed();
    } catch (error: any) {
      closing.current = false;
      dispatch(
        notify({
          msg: error?.data?.message || 'The alert could not be saved. Close it again.',
          sev: 'error'
        })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={next => {
        if (!next) {
          void close();
        }
      }}
      title="Pre-authorization"
      size="42vw"
      bodyheight="auto"
      hideCancel
      actionButtonLabel="Close"
      actionButtonLoading={saving}
      isDisabledActionBtn={saving}
      actionButtonFunction={close}
      content={
        <div>
          <p>{PRE_AUTHORIZATION_HOLD_MESSAGE}</p>
          {items.length > 0 && (
            <ul>
              {items.map(item => (
                <li key={`${item.patientServiceProductId ?? 'item'}-${item.label}`}>{item.label}</li>
              ))}
            </ul>
          )}
        </div>
      }
    />
  );
};

export default PreAuthorizationAlertModal;
