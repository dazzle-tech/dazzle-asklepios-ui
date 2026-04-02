import React, { useEffect, useMemo } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';

import { useFindLogsQuery } from '@/services/patients/progressNoteService';
import { ProgressNoteLogVM } from '@/types/model-types-new';

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
        key: 'action',
        title: 'ACTION',
        dataKey: 'action',
        width: 100,
        render: (row: ProgressNoteLogVM) => formatEnumString(row.action)
      },
      {
        key: 'lastModifiedDate',
        title: 'EDIT DATE',
        width: 200,
        render: (row: ProgressNoteLogVM) =>
          row.lastModifiedDate ? formatDateWithoutSeconds(row.lastModifiedDate) : null
      },
      {
        key: 'modified',
        title: 'BY',
        render: (row: ProgressNoteLogVM) =>
          row.lastModifiedDate ? <>{row.lastModifiedBy}</> : null
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
      content={<div dir={dir}><MyTable data={logs} columns={columns} height={400} loading={isLoading} /></div>}
    />
  );
};

export default ProgressNoteLogsModal;
