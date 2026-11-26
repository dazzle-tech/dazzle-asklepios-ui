import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import UserDateCell from '@/components/UserDateCell/UserDateCell';
import { useGetVitalSignsHistoryByEncounterIdQuery } from '@/services/medicalsheetsEncounter/observations/vitalSignsService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { conjureValueBasedOnKeyFromList } from '@/utils';

type VitalSignsHistoryModalProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  encounterId: number;
};

const VitalSignsHistoryModal = ({
  open,
  setOpen,
  encounterId
}: VitalSignsHistoryModalProps) => {
  const { data: history = [], isFetching } = useGetVitalSignsHistoryByEncounterIdQuery(
    { encounterId },
    { skip: !open || !encounterId }
  );

  const { data: measurementSiteLov } = useGetLovValuesByCodeQuery('BP_MEASURMENT_SITE', {
    skip: !open
  });

  const resolveHistoryValue = (fieldName: string | null | undefined, value: string | null | undefined) => {
    if (value == null || value === '') return '';

    if (fieldName === 'Measurement Site') {
      return conjureValueBasedOnKeyFromList(
        measurementSiteLov?.object ?? [],
        value,
        'lovDisplayVale'
      );
    }

    return value;
  };

  const columns = [
    {
      key: 'fieldName',
      title: <Translate>Changed Field</Translate>,
      flexGrow: 2,
      render: (row: any) => row?.fieldName ?? ''
    },
    {
      key: 'oldValue',
      title: <Translate>Previous Value</Translate>,
      flexGrow: 2,
      render: (row: any) => resolveHistoryValue(row?.fieldName, row?.oldValue)
    },
    {
      key: 'newValue',
      title: <Translate>New Value</Translate>,
      flexGrow: 2,
      render: (row: any) => resolveHistoryValue(row?.fieldName, row?.newValue)
    },
    {
      key: 'changedBy',
      title: <Translate>Changed By</Translate>,
      flexGrow: 2,
      render: (row: any) => (
        <UserDateCell login={row?.changedBy} date={row?.changedAt} />
      )
    }
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Reading History"
      size="70vw"
      hideActionBtn
      content={
        <MyTable
          data={history}
          columns={columns}
          height={450}
          loading={isFetching}
          dontTranslateData
        />
      }
    />
  );
};

export default VitalSignsHistoryModal;
