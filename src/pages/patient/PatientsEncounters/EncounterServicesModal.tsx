import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox, Loader } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import {
  useGetEncounterExecutedServicesQuery,
  type EncounterExecutedServiceLine,
  type EncounterListVM,
} from '@/services/encounters/patientEncounterService';
import { formatBillingItemType } from '@/pages/patient/patient-profile/PatientQuickAppoinment/paymentPreviewUtils';

type EncounterServicesModalProps = {
  open: boolean;
  encounter: EncounterListVM | null;
  onClose: () => void;
};

const formatAmount = (value?: number | null, currency?: string | null) => {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }

  const amount = Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return currency ? `${amount} ${currency}` : amount;
};

const EncounterServicesModal = ({
  open,
  encounter,
  onClose,
}: EncounterServicesModalProps) => {
  const [showCancelled, setShowCancelled] = useState(false);

  useEffect(() => {
    setShowCancelled(false);
  }, [encounter?.id]);

  const { data, isFetching, isError } = useGetEncounterExecutedServicesQuery(
    encounter?.id ?? 0,
    { skip: !open || !encounter?.id }
  );

  const lines = data?.lines ?? [];
  const visibleLines = useMemo(
    () => (showCancelled ? lines : lines.filter(line => !line.cancelled)),
    [lines, showCancelled]
  );
  const encounterNumber = data?.encounterNumber || encounter?.encounterNumber || '—';
  const patientName = data?.patientName || encounter?.patientFullName || '—';

  const columns = useMemo(
    () => [
      {
        key: 'type',
        title: 'Type',
        width: 120,
        render: (row: EncounterExecutedServiceLine) =>
          formatBillingItemType(row.type) || '—',
      },
      {
        key: 'code',
        title: 'Code',
        width: 140,
        render: (row: EncounterExecutedServiceLine) => row.code || '—',
      },
      {
        key: 'item',
        title: 'Item',
        width: 280,
        render: (row: EncounterExecutedServiceLine) => (
          <span
            className={
              row.cancelled
                ? 'encounter-services-item encounter-services-item--cancelled'
                : 'encounter-services-item'
            }
            title={row.item || undefined}
          >
            {row.item || '—'}
          </span>
        ),
      },
      {
        key: 'grossAmount',
        title: 'Gross amount',
        width: 150,
        align: 'right' as const,
        render: (row: EncounterExecutedServiceLine) =>
          formatAmount(row.grossAmount, row.currency),
      },
      {
        key: 'patientShareAmount',
        title: 'Co-payment',
        width: 150,
        align: 'right' as const,
        render: (row: EncounterExecutedServiceLine) =>
          formatAmount(row.patientShareAmount, row.currency),
      },
      {
        key: 'patientPaidAmount',
        title: 'Patient paid',
        width: 150,
        align: 'right' as const,
        render: (row: EncounterExecutedServiceLine) =>
          formatAmount(row.patientPaidAmount, row.currency),
      },
    ],
    []
  );

  return (
    <MyModal
      open={open}
      setOpen={nextOpen => {
        if (!nextOpen) onClose();
      }}
      title="Services & products"
      size="78vw"
      bodyheight="64vh"
      hideActionBtn
      cancelButtonLabel="Close"
      customClassName="encounter-services-modal"
      content={
        <div className="encounter-services-sheet">
          <div className="encounter-services-meta">
            <div className="encounter-services-identity">
              <strong>{encounterNumber}</strong>
              <span>{patientName}</span>
            </div>
            <Checkbox
              checked={showCancelled}
              onChange={(_, checked) => setShowCancelled(checked)}
            >
              Show cancelled
            </Checkbox>
          </div>

          {isFetching ? (
            <div className="encounter-services-state">
              <Loader size="sm" content="Loading services..." />
            </div>
          ) : isError ? (
            <div className="encounter-services-state">
              Unable to load services for this encounter.
            </div>
          ) : visibleLines.length === 0 ? (
            <div className="encounter-services-state">
              No services found for this encounter.
            </div>
          ) : (
            <MyTable height={420} data={visibleLines} columns={columns} />
          )}
        </div>
      }
    />
  );
};

export default EncounterServicesModal;
