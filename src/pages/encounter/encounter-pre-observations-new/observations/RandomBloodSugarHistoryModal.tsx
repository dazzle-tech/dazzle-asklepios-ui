import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import UserDateCell from '@/components/UserDateCell/UserDateCell';
import { useGetRandomBloodSugarHistoryByEncounterIdQuery } from '@/services/medicalsheetsEncounter/observations/randomBloodSugarService';

type RandomBloodSugarHistoryModalProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  encounterId: number;
};

const RandomBloodSugarHistoryModal = ({
  open,
  setOpen,
  encounterId
}: RandomBloodSugarHistoryModalProps) => {
  const { data: history = [], isFetching } = useGetRandomBloodSugarHistoryByEncounterIdQuery(
    { encounterId },
    { skip: !open || !encounterId }
  );

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
      render: (row: any) => row?.oldValue ?? ''
    },
    {
      key: 'newValue',
      title: <Translate>New Value</Translate>,
      flexGrow: 2,
      render: (row: any) => row?.newValue ?? ''
    },
    {
      key: 'changedBy',
      title: <Translate>Changed By</Translate>,
      flexGrow: 2,
      render: (row: any) => <UserDateCell login={row?.changedBy} date={row?.changedAt} />
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

export default RandomBloodSugarHistoryModal;
