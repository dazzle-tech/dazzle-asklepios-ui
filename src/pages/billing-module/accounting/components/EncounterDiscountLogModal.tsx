import React, { useMemo } from 'react';
import { Loader, Text } from 'rsuite';

import MyModal from '@/components/MyModal/MyModal';
import MyTable, { type ColumnConfig } from '@/components/MyTable/MyTable';
import { useGetEncounterDiscountCodeUsagesQuery } from '@/services/billing/billingTransactionService';
import type { DiscountCodeUsageRow } from '@/services/billing/billingTransactionService';
import { useGetUsersByIdsQuery } from '@/services/userService';
import type { PatientEncounter } from '@/types/model-types-new';
import { formatBillingTimestamp, formatEncounterDisplayLabel, formatMoney } from '../utils/billingAccountingUtils';

type EncounterDiscountLogModalProps = {
  open: boolean;
  encounter: PatientEncounter | null;
  onClose: () => void;
};

const discountValue = (row: DiscountCodeUsageRow) => {
  if (row.discountType === 'FIXED_AMOUNT') {
    return formatMoney(row.fixedAmount, row.currency || 'SAR');
  }
  return `${row.percentage ?? 0}%`;
};

const itemLabel = (row: DiscountCodeUsageRow) => {
  if (row.itemDescription?.trim()) {
    return row.itemDescription.trim();
  }
  if (row.serviceId) {
    return `Service ${row.serviceId}`;
  }
  if (row.procedureId) {
    return `Procedure ${row.procedureId}`;
  }
  return '—';
};

const EncounterDiscountLogModal = ({ open, encounter, onClose }: EncounterDiscountLogModalProps) => {
  const encounterId = encounter?.id;
  const { data = [], isFetching, isError } = useGetEncounterDiscountCodeUsagesQuery(encounterId ?? 0, {
    skip: !open || encounterId == null
  });

  const userIds = useMemo(
    () =>
      Array.from(
        new Set(
          data
            .map(row => row.authorizedUserId)
            .filter((id): id is number => id != null && Number(id) > 0)
        )
      ),
    [data]
  );

  const { data: users = [] } = useGetUsersByIdsQuery(userIds, {
    skip: !open || userIds.length === 0
  });

  const usersById = useMemo(() => {
    const map = new Map<string, string>();
    (users ?? []).forEach((user: { id?: number; firstName?: string; lastName?: string; login?: string }) => {
      if (user?.id == null) {
        return;
      }
      const name =
        [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.login || String(user.id);
      map.set(String(user.id), name);
    });
    return map;
  }, [users]);

  const columns: ColumnConfig[] = [
    {
      key: 'appliedAt',
      title: 'Applied',
      width: 160,
      render: (row: DiscountCodeUsageRow) => formatBillingTimestamp(row.appliedAt)
    },
    {
      key: 'code',
      title: 'Code',
      width: 110,
      render: (row: DiscountCodeUsageRow) => row.code || '—'
    },
    {
      key: 'discountName',
      title: 'Discount',
      width: 160,
      render: (row: DiscountCodeUsageRow) => row.discountName || '—'
    },
    {
      key: 'discountType',
      title: 'Value',
      width: 120,
      render: (row: DiscountCodeUsageRow) => discountValue(row)
    },
    {
      key: 'item',
      title: 'Item',
      width: 180,
      render: (row: DiscountCodeUsageRow) => itemLabel(row)
    },
    {
      key: 'grossAmount',
      title: 'Gross',
      width: 120,
      align: 'right',
      render: (row: DiscountCodeUsageRow) => formatMoney(row.grossAmount, row.currency || 'SAR')
    },
    {
      key: 'discountAmount',
      title: 'Discount amount',
      width: 140,
      align: 'right',
      render: (row: DiscountCodeUsageRow) => formatMoney(row.discountAmount, row.currency || 'SAR')
    },
    {
      key: 'authorizedUser',
      title: 'Applied by',
      width: 160,
      render: (row: DiscountCodeUsageRow) =>
        (row.authorizedUserId != null ? usersById.get(String(row.authorizedUserId)) : null) || '—'
    }
  ];

  const encounterLabel = encounter ? formatEncounterDisplayLabel(encounter) ?? 'Encounter' : 'Encounter';

  return (
    <MyModal
      open={open}
      setOpen={nextOpen => {
        if (!nextOpen) {
          onClose();
        }
      }}
      title={`Discount log · ${encounterLabel}`}
      size="78vw"
      bodyheight="56vh"
      hideActionBtn
      cancelButtonLabel="Close"
      content={
        <div className="billing-accounting__discount-log">
          <Text muted size="sm">
            Discount codes recorded when services for this encounter were prepared.
          </Text>
          {isError ? (
            <div className="billing-accounting__empty">The discount log could not be loaded.</div>
          ) : isFetching && data.length === 0 ? (
            <div className="billing-accounting__empty">
              <Loader size="sm" content="Loading discount log..." />
            </div>
          ) : data.length === 0 ? (
            <div className="billing-accounting__empty">No discount code was applied on this encounter.</div>
          ) : (
            <MyTable data={data} columns={columns} loading={isFetching} height={360} />
          )}
        </div>
      }
    />
  );
};

export default EncounterDiscountLogModal;
