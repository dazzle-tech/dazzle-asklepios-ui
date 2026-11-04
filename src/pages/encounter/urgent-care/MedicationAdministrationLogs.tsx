// MedicationAdministrationLogs.tsx

import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import { formatDateWithoutSeconds } from '@/utils';

type Props = {
  order: any;
};

const Row = ({
  label,
  by,
  date
}: {
  label: string;
  by?: string;
  date?: string;
}) => {
  if (!by && !date) {
    return null;
  }

  return (
    <div
      style={{
        borderBottom: '1px solid #eee',
        padding: '10px 0'
      }}
    >
      <div>
        <strong>{label}</strong>
      </div>

      <div>User: {by || '-'}</div>

      <div>
        Date:
        {' '}
        {date
          ? formatDateWithoutSeconds(date)
          : '-'}
      </div>
    </div>
  );
};

const MedicationAdministrationLogs = ({
  order
}: Props) => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <MyButton
        appearance="subtle"
        size="xs"
        onClick={() => setOpen(true)}
      >
        Logs
      </MyButton>

      <MyModal
        title="Medication Order Logs"
        open={open}
        setOpen={setOpen}
        hideActionBtn
        content={
          <div>

            <Row
              label="Submitted"
              by={order.submittedBy}
              date={order.submittedDate}
            />

            <Row
              label="Administered"
              by={order.administeredBy}
              date={order.administeredDate}
            />

            {order.actualAdministerTime && (
              <div
                style={{
                  borderBottom: '1px solid #eee',
                  padding: '10px 0'
                }}
              >
                <strong>
                  Actual Administer Time
                </strong>

                <div>
                  {formatDateWithoutSeconds(
                    order.actualAdministerTime
                  )}
                </div>
              </div>
            )}

            <Row
              label="Double Checked"
              by={order.doubleCheckedBy}
              date={order.doubleCheckedDate}
            />

            <Row
              label="Discarded"
              by={order.discardedBy}
              date={order.discardedDate}
            />

            {order.discardReason && (
              <div
                style={{
                  borderBottom: '1px solid #eee',
                  padding: '10px 0'
                }}
              >
                <strong>Discard Reason</strong>

                <div>{order.discardReason}</div>
              </div>
            )}

            <Row
              label="Cancelled"
              by={order.cancelledBy}
              date={order.cancelledDate}
            />

            {order.cancellationReason && (
              <div
                style={{
                  padding: '10px 0'
                }}
              >
                <strong>
                  Cancellation Reason
                </strong>

                <div>
                  {order.cancellationReason}
                </div>
              </div>
            )}
          </div>
        }
      />
    </>
  );
};

export default MedicationAdministrationLogs;