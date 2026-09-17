import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { useAppDispatch } from '@/hooks';
import {
  useGetUserEncountersAccessQuery,
  useLazyGetUserByLoginQuery,
  useUpdateUserEncountersAccessMutation,
} from '@/services/userService';
import { notify } from '@/utils/uiReducerActions';
import { ApUser } from '@/types/model-types-new';

type EncountersAccessProps = {
  user: ApUser;
};

type EncountersAccessRecord = {
  allowOngoingVisit: boolean;
  canUnDischargeUrgentCare: boolean;
  canUnCompleteEncounter: boolean;
};

const EncountersAccess = ({ user }: EncountersAccessProps) => {
  const dispatch = useAppDispatch();
  const userId = user?.id;

  const [record, setRecord] = useState<EncountersAccessRecord>({
    allowOngoingVisit: false,
    canUnDischargeUrgentCare: false,
    canUnCompleteEncounter: false,
  });

  const {
    data: encountersAccess,
    isLoading: isLoadingAccess,
  } = useGetUserEncountersAccessQuery(userId!, {
    skip: !userId,
  });

  const [getUserByLogin, { data: userByLogin }] =
    useLazyGetUserByLoginQuery();

  useEffect(() => {
    if (user?.login) {
      getUserByLogin(user.login);
    }
  }, [user?.login, getUserByLogin]);

  console.log('userByLogin:', userByLogin);

  const [updateUserEncountersAccess, { isLoading: isSaving }] =
    useUpdateUserEncountersAccessMutation();

  useEffect(() => {
    if (!userId) {
      setRecord({
        allowOngoingVisit: false,
        canUnDischargeUrgentCare: false,
        canUnCompleteEncounter: false,
      });
      return;
    }

    if (encountersAccess) {
      setRecord({
        allowOngoingVisit: encountersAccess.allowOngoingVisit ?? false,
        canUnDischargeUrgentCare:
          encountersAccess.canUnDischargeUrgentCare ?? false,
        canUnCompleteEncounter:
          encountersAccess.canUnCompleteEncounter ?? false,
      });
    }
  }, [userId, encountersAccess]);

  const handleSave = async () => {
    if (!userId) {
      dispatch(
        notify({
          msg: 'Please select a user first',
          sev: 'error',
        })
      );
      return;
    }

    try {
      await updateUserEncountersAccess({
        userId,
        data: record,
      }).unwrap();

      dispatch(
        notify({
          msg: 'Encounters Access saved successfully',
          sev: 'success',
        })
      );
    } catch (error: any) {
      let message =
        error?.data?.message ||
        error?.data?.detail ||
        error?.error ||
        'Failed to save Encounters Access';

      if (typeof message === 'string' && message.startsWith('error.')) {
        message = message.replace('error.', '').replace(/\./g, ' ');
      }

      dispatch(
        notify({
          msg: message,
          sev: 'error',
        })
      );
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <Form
      fluid
      className="encounters-access-check-boxes-handle-positions"
    >
      <MyInput
        fieldType="checkbox"
        fieldName="allowOngoingVisit"
        fieldLabel="Allow Ongoing Visit"
        record={record}
        setRecord={setRecord}
        disabled={isLoadingAccess}
      />

      <MyInput
        fieldType="checkbox"
        fieldName="canUnDischargeUrgentCare"
        fieldLabel="Can UnDischarge Urgent Care"
        record={record}
        setRecord={setRecord}
        disabled={isLoadingAccess}
      />

      <MyInput
        fieldType="checkbox"
        fieldName="canUnCompleteEncounter"
        fieldLabel="Can UnComplete Encounter"
        record={record}
        setRecord={setRecord}
        disabled={isLoadingAccess}
      />

      <MyButton
        appearance="primary"
        loading={isSaving}
        onClick={handleSave}
        disabled={isLoadingAccess}
      >
        Save
      </MyButton>
    </Form>
  );
};

export default EncountersAccess;
