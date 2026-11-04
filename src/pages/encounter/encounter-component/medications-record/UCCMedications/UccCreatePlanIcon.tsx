import React, { useMemo, useState } from 'react';
import { Tooltip, Whisper } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus } from '@fortawesome/free-solid-svg-icons';
import Translate from '@/components/Translate';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useCreateUccMedicationOrderPlanMutation } from '@/services/medicalsheetsEncounter/uccMedicationOrder/uccMedicationOrderService';
import { useGetMedFrequencySetupsByStatusQuery } from '@/services/setup/med-frequency-setup/medFrequencySetupService';

type Props = {
  row: {
    id: number;
    orderGroupId?: number;
    status?: string;
    frequency?: string;
    doseTime?: string;
  };
  disabled?: boolean;
  onSaved?: () => void;
};

/**
 * Create Plan: splits a submitted order that was not split on submit (e.g. submitted before its
 * frequency had a setup), with the same logic as the submit. Shown only while the order is
 * SUBMITTED (not administered), not split yet, and its frequency has an active setup.
 */
const UccCreatePlanIcon = ({ row, disabled = false, onSaved }: Props) => {
  const dispatch = useAppDispatch();
  const [openConfirm, setOpenConfirm] = useState(false);

  // Same args in every row, so it is fetched once and shared
  const { data: activeSetups } = useGetMedFrequencySetupsByStatusQuery({ isActive: true, page: 0, size: 1000 });
  const activeFrequencies = useMemo(
    () => new Set((activeSetups?.data ?? []).map(setup => setup.frequency)),
    [activeSetups?.data]
  );

  const [createPlan, { isLoading }] = useCreateUccMedicationOrderPlanMutation();

  const canCreatePlan =
    row.status === 'SUBMITTED' &&
    !row.doseTime &&
    !!row.frequency &&
    row.frequency !== 'STAT' &&
    activeFrequencies.has(row.frequency);

  if (!canCreatePlan) return null;

  const handleCreatePlan = async () => {
    try {
      const doses = await createPlan({ orderGroupId: row.orderGroupId ?? row.id }).unwrap();
      dispatch(notify({ msg: `Plan created: ${doses?.length ?? 0} doses`, sev: 'success' }));
      onSaved?.();
    } catch (err: any) {
      dispatch(notify({ msg: err?.data?.detail || 'Failed to create plan', sev: 'error' }));
    } finally {
      setOpenConfirm(false);
    }
  };

  const isDisabled = disabled || isLoading;

  return (
    <>
      <Whisper placement="top" speaker={<Tooltip><Translate>Create Plan</Translate></Tooltip>}>
        <FontAwesomeIcon
          icon={faCalendarPlus}
          className="icons-style medication-record-order-icons-size"
          style={{ cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.5 : 1 }}
          onClick={() => {
            if (isDisabled) return;
            setOpenConfirm(true);
          }}
        />
      </Whisper>

      <DeletionConfirmationModal
        open={openConfirm}
        setOpen={setOpenConfirm}
        actionType="confirm"
        confirmationQuestion="Split this medication into doses for 24 hours from its submit time?"
        actionButtonLabel="Create Plan"
        actionButtonFunction={handleCreatePlan}
      />
    </>
  );
};

export default UccCreatePlanIcon;
