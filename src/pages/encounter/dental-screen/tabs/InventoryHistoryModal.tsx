import React from 'react';
import { FaClockRotateLeft } from 'react-icons/fa6';

import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { toothDisplayLabel } from '@/utils/toothNumber';
import { useGetChartInventoryHistoryQuery } from '@/services/dental/dentalChartService';
import { formatDate } from './TreatmentPlan/treatmentPlanShared';

type InventoryHistoryModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  chartId?: number | null;
  numberingSystem?: string | null;
  numberingLabels?: Record<string, string> | null;
  width: number;
};

const ACTION_LABELS: Record<string, string> = {
  ADD: 'Added',
  REMOVE: 'Removed',
  REPLACE_OUT: 'Replaced',
  REPLACE_IN: 'Added as replacement',
  CHART_TYPE: 'Chart type'
};

/** Compact, read-only audit of this chart's inventory edits. */
const InventoryHistoryModal: React.FC<InventoryHistoryModalProps> = ({
  open,
  setOpen,
  chartId,
  numberingSystem,
  numberingLabels,
  width
}) => {
  const { data = [], isFetching } = useGetChartInventoryHistoryQuery(chartId as number, {
    skip: !open || chartId == null
  });

  const label = (toothNumber?: string | null) =>
    toothNumber && toothNumber !== 'CHART'
      ? toothDisplayLabel(toothNumber, numberingSystem || 'UNIVERSAL', numberingLabels ?? null)
      : '—';

  const columns = [
    {
      key: 'changedAt',
      title: <Translate>Date</Translate>,
      width: 150,
      render: (row: any) => formatDate(row.changedAt, true)
    },
    { key: 'changedBy', title: <Translate>User</Translate>, width: 110 },
    {
      key: 'action',
      title: <Translate>Action</Translate>,
      width: 150,
      render: (row: any) => ACTION_LABELS[row.action] ?? row.action
    },
    {
      key: 'toothNumber',
      title: <Translate>Tooth</Translate>,
      width: 80,
      render: (row: any) =>
        row.relatedToothNumber
          ? `${label(row.toothNumber)} / ${label(row.relatedToothNumber)}`
          : label(row.toothNumber)
    },
    {
      key: 'statusAfter',
      title: <Translate>Before → After</Translate>,
      width: 170,
      render: (row: any) => `${row.statusBefore ?? '—'} → ${row.statusAfter}`
    },
    { key: 'reason', title: <Translate>Reason</Translate>, width: 240 }
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Teeth Change History"
      position="right"
      content={() => (
        <MyTable
          height={420}
          data={data}
          columns={columns}
          loading={isFetching}
          dontTranslateData
        />
      )}
      hideActionBtn
      steps={[{ title: 'History', icon: <FaClockRotateLeft /> }]}
      size={width > 900 ? '64vw' : width > 600 ? '80vw' : '94vw'}
    />
  );
};

export default InventoryHistoryModal;
