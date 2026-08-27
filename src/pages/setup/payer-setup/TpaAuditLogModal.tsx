import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { TpaDefinition } from '@/types/model-types-new';

type TpaAuditLogModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  tpa: TpaDefinition | null;
};

const formatDateTime = (value?: Date | string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

const TpaAuditLogModal: React.FC<TpaAuditLogModalProps> = ({ open, setOpen, tpa }) => {
  const rows = tpa
    ? [
        {
          id: 1,
          transactionType: 'CREATE',
          details: `TPA ${tpa.tpaCode} created`,
          performedBy: tpa.createdBy || '-',
          performedAt: formatDateTime(tpa.createdDate)
        },
        {
          id: 2,
          transactionType: 'UPDATE',
          details: `Last update for ${tpa.name}`,
          performedBy: tpa.lastModifiedBy || tpa.createdBy || '-',
          performedAt: formatDateTime(tpa.lastModifiedDate || tpa.createdDate)
        }
      ]
    : [];

  const columns = [
    {
      key: 'transactionType',
      title: <Translate>Transaction Type</Translate>,
      flexGrow: 2
    },
    {
      key: 'details',
      title: <Translate>Details</Translate>,
      flexGrow: 4
    },
    {
      key: 'performedBy',
      title: <Translate>User</Translate>,
      flexGrow: 2
    },
    {
      key: 'performedAt',
      title: <Translate>Date</Translate>,
      flexGrow: 2
    }
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={tpa ? `TPA Log - ${tpa.name}` : 'TPA Log'}
      size="62vw"
      bodyheight="48vh"
      hideCancel
      hideActionBtn
      modalColor="var(--primary-blue)"
      steps={[]}
      content={<MyTable data={rows} columns={columns} height={280} />}
    />
  );
};

export default TpaAuditLogModal;
