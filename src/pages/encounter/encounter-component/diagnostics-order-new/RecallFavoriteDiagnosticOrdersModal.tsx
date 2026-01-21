import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { formatEnumString } from '@/utils';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  favoriteTests: any[];
  loading?: boolean;
  onRecall: (test: any) => void;
};

const RecallFavoriteDiagnosticOrdersModal = ({
  open,
  setOpen,
  favoriteTests,
  loading,
  onRecall
}: Props) => {
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Recall Favorite Orders"
      size="60vw"
      content={
        <MyTable
          loading={loading}
          data={favoriteTests ?? []}
          columns={[
            {
              key: 'name',
              title: 'Test Name',
              render: row => row.name
            },
            {
              key: 'type',
              title: 'Type',
              render: row => formatEnumString(row.type)
            },
            {
              key: 'internalCode',
              title: 'Code',
              render: row => row.internalCode ?? '-'
            },
            {
              key: 'actions',
              title: 'Actions',
              render: row => (
                <MyButton size="xs" onClick={() => onRecall(row)}>
                  Recall
                </MyButton>
              )
            }
          ]}
        />
      }
    />
  );
};

export default RecallFavoriteDiagnosticOrdersModal;
