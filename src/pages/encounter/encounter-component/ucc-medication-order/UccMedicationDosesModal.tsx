import React, { useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import Translate from '@/components/Translate';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
import { useGetUccMedicationOrdersByGroupQuery } from '@/services/medicalsheetsEncounter/uccMedicationOrder/uccMedicationOrderService';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  orderGroupId?: number | null;
  medicationName?: string;
};

const STATUS_COLOR: Record<string, string> = {
  NEW: '#969fb0',
  SUBMITTED: '#2264e5',
  WAITING_DOUBLE_CHECK: '#fd7e14',
  ADMINISTERED: '#45b887',
  DISCARDED: '#6c757d',
  CANCELLED: '#dc3545'
};

// Order of the summary badges
const STATUS_ORDER = ['ADMINISTERED', 'WAITING_DOUBLE_CHECK', 'SUBMITTED', 'NEW', 'DISCARDED', 'CANCELLED'];

const UserFullName = ({ login }: { login?: string | null }) => {
  const { data } = useGetUserFullNameByLoginQuery(login || skipToken);
  return <>{data || login || '-'}</>;
};

// Who did the last action on the dose and when, based on its status
const doseAction = (dose: any): { by?: string | null; at?: string | null } => {
  switch (dose?.status) {
    case 'ADMINISTERED':
    case 'WAITING_DOUBLE_CHECK':
      return { by: dose.administeredBy, at: dose.actualAdministerTime ?? dose.administeredDate };
    case 'DISCARDED':
      return { by: dose.discardedBy, at: dose.discardedDate };
    case 'CANCELLED':
      return { by: dose.cancelledBy, at: dose.cancelledDate };
    default:
      return {};
  }
};

const UccMedicationDosesModal: React.FC<Props> = ({ open, setOpen, orderGroupId, medicationName }) => {
  const { data, isLoading, isFetching } = useGetUccMedicationOrdersByGroupQuery(
    open && orderGroupId ? orderGroupId : skipToken
  );

  // The backend returns the doses in dose time order
  const doses = useMemo(() => data ?? [], [data]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    doses.forEach((dose: any) => {
      const status = dose?.status ?? 'NEW';
      map[status] = (map[status] ?? 0) + 1;
    });
    return map;
  }, [doses]);

  const columns = [
    {
      key: 'index',
      title: <Translate>#</Translate>,
      width: 60,
      render: (_row: any, index?: number) => (index ?? 0) + 1
    },
    {
      key: 'doseTime',
      title: <Translate>DOSE TIME</Translate>,
      flexGrow: 1,
      render: (row: any) => (row?.doseTime ? formatDateWithoutSeconds(row.doseTime) : '-')
    },
    {
      key: 'status',
      title: <Translate>STATUS</Translate>,
      flexGrow: 1,
      render: (row: any) => (
        <MyBadgeStatus
          color={STATUS_COLOR[row?.status] ?? '#969fb0'}
          contant={formatEnumString(row?.status ?? 'NEW')}
        />
      )
    },
    {
      key: 'byAt',
      title: <Translate>BY / AT</Translate>,
      flexGrow: 1,
      render: (row: any) => {
        const { by, at } = doseAction(row);
        if (!by && !at) return '-';
        return (
          <>
            <UserFullName login={by} />
            <br />
            {at ? formatDateWithoutSeconds(at) : ''}
          </>
        );
      }
    },
    {
      key: 'doubleCheckedBy',
      title: <Translate>DOUBLE CHECKED BY</Translate>,
      flexGrow: 1,
      render: (row: any) => (row?.doubleCheckedBy ? <UserFullName login={row.doubleCheckedBy} /> : '-')
    },
    {
      key: 'reason',
      title: <Translate>REASON</Translate>,
      flexGrow: 1,
      render: (row: any) => row?.discardReason || row?.cancellationReason || '-'
    }
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={medicationName ? `${medicationName} Doses` : 'Medication Doses'}
      size="70vw"
      bodyheight="60vh"
      hideActionBtn
      content={
        <div className="ucc-doses">
          <div className="ucc-doses__summary">
            {STATUS_ORDER.filter(status => counts[status]).map(status => (
              <MyBadgeStatus
                key={status}
                color={STATUS_COLOR[status]}
                contant={`${formatEnumString(status)} · ${counts[status]}`}
              />
            ))}
          </div>
          <MyTable data={doses} columns={columns} loading={isLoading || isFetching} height={380} />
        </div>
      }
    />
  );
};

export default UccMedicationDosesModal;
