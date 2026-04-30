import React, { useEffect, useMemo } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';

import { useFindLogsQuery } from '@/services/patients/progressNoteService';
import { useGetUsersBasicQuery } from '@/services/userService';
import { useAppSelector } from '@/hooks';

import { ProgressNoteLogVM } from '@/types/model-types-new';
import './styles.less';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  progressNoteId: number | null;
};

const UserFullName = ({ login }: { login: string }) => {
  const authUser = useAppSelector(state => state.auth.user);

  const { data: usersResponse } = useGetUsersBasicQuery({
    page: 0,
    size: 100
  });

  const userMap = useMemo(() => {
    const map = new Map<string, string>();

    usersResponse?.data?.forEach((u: any) => {
      map.set(u.login, `${u.firstName} ${u.lastName}`);
    });

    return map;
  }, [usersResponse]);

  console.log('👤 Login:', login);

  if (authUser && authUser.login === login) {
    const fullName = `${authUser.firstName} ${authUser.lastName}`;
    console.log('✅ Auth user:', fullName);
    return <span>{fullName}</span>;
  }

  const fullName = userMap.get(login);

  console.log('🧠 From Map:', login, fullName);

  return <span>{fullName || login}</span>;
};

const ProgressNoteLogsModal: React.FC<Props> = ({ open, setOpen, progressNoteId }) => {
  console.log('🔥 Modal Props:', { open, progressNoteId });

  const {
    data: logs = [],
    isLoading,
    refetch
  } = useFindLogsQuery(progressNoteId!, {
    skip: !progressNoteId
  });

  console.log('🔥 Logs Response:', logs);

  useEffect(() => {
    if (open && progressNoteId) {
      console.log('🔥 Refetching logs...');
      refetch();
    }
  }, [open, progressNoteId, refetch]);

  const columns = useMemo(
    () => [
      {
        key: 'indicator',
        title: '',
        width: 40,
        render: (row: ProgressNoteLogVM) => {
          const colors: any = {
            INSERT: '#16a34a',
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
        render: (row: ProgressNoteLogVM) =>
          formatEnumString(row.action)
      },

      {
        key: 'before',
        title: 'BEFORE EDIT',
        flexGrow: 1,
        render: (row: ProgressNoteLogVM) =>
          row.action === 'UPDATE' ? (
            <span style={{ color: '#dc2626' }}>
              {row.oldNoteText ?? 'No previous value'}
            </span>
          ) : null
      },

      {
        key: 'value',
        title: 'VALUE',
        flexGrow: 1,
        render: (row: ProgressNoteLogVM) => {
          if (row.action === 'INSERT') {
            return (
              <span style={{ color: '#16a34a' }}>
                {row.newNoteText ?? 'No value'}
              </span>
            );
          }

          if (row.action === 'UPDATE') {
            return (
              <span style={{ color: '#16a34a' }}>
                {row.newNoteText ?? 'No new value'}
              </span>
            );
          }

          return null;
        }
      },

      {
        key: 'lastModifiedDate',
        title: 'EDIT DATE',
        width: 180,
        render: (row: ProgressNoteLogVM) =>
          row.lastModifiedDate
            ? formatDateWithoutSeconds(row.lastModifiedDate)
            : null
      },


      {
        key: 'modified',
        title: 'BY',
        width: 180,
        render: (row: ProgressNoteLogVM) => (
          <UserFullName login={row.lastModifiedBy} />
        )
      }
    ],
    []
  );


  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';


  return (
    <MyModal
      open={open}
      setOpen={setOpen}
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
            rowClassName={(row: ProgressNoteLogVM) => {
              if (row.action === 'UPDATE') return 'edited-row';
              if (row.action === 'INSERT') return 'inserted-row';
              if (row.action === 'CANCEL') return 'cancelled-row';
              return '';
            }}
          />
        </div>
      }
    />
  );
};

export default ProgressNoteLogsModal;