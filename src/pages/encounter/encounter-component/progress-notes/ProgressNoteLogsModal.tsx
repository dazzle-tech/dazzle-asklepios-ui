import React, { useEffect, useMemo } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';

import { useFindLogsQuery } from '@/services/patients/progressNoteService';
import { ProgressNoteLogVM } from '@/types/model-types-new';
import './styles.less';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  progressNoteId: number | null;
};

const ProgressNoteLogsModal: React.FC<Props> = ({ open, setOpen, progressNoteId }) => {
  const {
    data: logs = [],
    isLoading,
    refetch
  } = useFindLogsQuery(progressNoteId!, {
    skip: !progressNoteId
  });

  useEffect(() => {
    if (open && progressNoteId) {
      refetch();
    }
  }, [open, progressNoteId, refetch]);

  const columns = useMemo(
    () => [
      {
        key: 'indicator',
        title: '',
        width: 40,
        render: row => {
          const colors = {
            CREATE: '#16a34a',
            UPDATE: '#f59e0b',
            CANCEL: '#dc2626'
          };

          return (
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: colors[row.action] || '#ccc',
                display: 'inline-block'
              }}
            />
          );
        }
      },

      {
        key: 'action',
        title: 'ACTION',
        width: 100,
        render: (row: ProgressNoteLogVM) => formatEnumString(row.action)
      },

      {
        key: 'before',
        title: 'BEFORE EDIT',
        flexGrow: 1,
        render: (row: ProgressNoteLogVM) =>
          row.action === 'UPDATE' ? (
            <span style={{ color: '#dc2626' }}>{row.oldNoteText ?? 'No previous value'}</span>
          ) : null
      },

      {
        key: 'after',
        title: 'AFTER EDIT',
        flexGrow: 1,
        render: (row: ProgressNoteLogVM) =>
          row.action === 'UPDATE' ? (
            <span style={{ color: '#16a34a' }}>{row.newNoteText ?? 'No new value'}</span>
          ) : null
      },

      {
        key: 'lastModifiedDate',
        title: 'EDIT DATE',
        width: 180,
        render: (row: ProgressNoteLogVM) =>
          row.lastModifiedDate ? formatDateWithoutSeconds(row.lastModifiedDate) : null
      },

      {
        key: 'modified',
        title: 'BY',
        width: 150,
        render: (row: ProgressNoteLogVM) => row.lastModifiedBy
      }
    ],
    []
  );

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={open => {
        setOpen(open);
      }}
      title="Progress Note History"
      size="35vw"
      position="center"
      hideActionBtn={true}
      content={
        <div dir={dir}>
          <MyTable
            data={logs}
            columns={columns}
            height={400}
            loading={isLoading}
            rowClassName={(row: ProgressNoteLogVM) => (row.action === 'UPDATE' ? 'edited-row' : '')}
          />
        </div>
      }
    />
  );
};

export default ProgressNoteLogsModal;
