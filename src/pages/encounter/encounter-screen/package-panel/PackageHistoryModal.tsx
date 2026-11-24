import React from 'react';
import { FaClockRotateLeft } from 'react-icons/fa6';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import UserDateCell from '@/components/UserDateCell/UserDateCell';
import { formatEnumString } from '@/utils';
import { PackageUsageRow, useGetPatientPackageHistoryQuery } from '@/services/patient/patientPackageService';

interface Props {
  patientPackageId: number | null;
  onClose: () => void;
}

/** Where an order came from, from its usage's order_source. */
const SOURCE_LABELS: Record<string, string> = {
  LABORATORY: 'Laboratory order',
  RADIOLOGY: 'Radiology order',
  PATHOLOGY: 'Pathology order',
  PROCEDURE: 'Procedure order',
  PACKAGE: 'Package panel',
  SERVICE: 'Services / UCC / Vaccination'
};

/**
 * History of one package in the visit: when it was given and by whom, then every order counted against it
 * (which line, which item, from which screen, who and when) and, when the order was cancelled, who gave it back.
 */
const PackageHistoryModal: React.FC<Props> = ({ patientPackageId, onClose }) => {
  const { data, isFetching } = useGetPatientPackageHistoryQuery(patientPackageId as number, {
    skip: patientPackageId == null,
    refetchOnMountOrArgChange: true
  });

  const rows = data?.usages ?? [];
  const counted = rows.filter(r => r.status === 'COUNTED').length;
  const returned = rows.length - counted;

  const columns = [
    {
      key: 'status',
      title: 'Status',
      width: 110,
      render: (row: PackageUsageRow) => (
        <span className={`pkgh-status pkgh-status--${row.status.toLowerCase()}`}>
          {row.status === 'COUNTED' ? 'Counted' : 'Returned'}
        </span>
      )
    },
    {
      key: 'item',
      title: 'Item',
      width: 260,
      exportValue: (row: PackageUsageRow) => row.orderedItemName ?? row.lineName ?? '',
      render: (row: PackageUsageRow) => (
        <div className="pkgh-item">
          <span className="pkgh-item-name">{row.orderedItemName ?? row.lineName}</span>
          <span className="pkgh-muted">
            {row.orderedItemCode ? `${row.orderedItemCode} · ` : ''}
            {row.fromCategory ? row.lineName : formatEnumString(row.itemType ?? '')}
          </span>
        </div>
      )
    },
    { key: 'quantity', title: 'Qty', dataKey: 'quantity', width: 60 },
    {
      key: 'source',
      title: 'From',
      width: 190,
      exportValue: (row: PackageUsageRow) => SOURCE_LABELS[row.orderSource ?? ''] ?? row.orderSource ?? '',
      render: (row: PackageUsageRow) => SOURCE_LABELS[row.orderSource ?? ''] ?? row.orderSource ?? '-'
    },
    {
      key: 'counted',
      title: 'Counted By / At',
      width: 170,
      exportValue: (row: PackageUsageRow) => `${row.countedBy ?? ''} ${row.countedDate ?? ''}`,
      render: (row: PackageUsageRow) => <UserDateCell login={row.countedBy} date={row.countedDate} />
    },
    {
      key: 'returned',
      title: 'Returned By / At',
      width: 170,
      exportValue: (row: PackageUsageRow) => (row.returnedBy ? `${row.returnedBy} ${row.returnedDate ?? ''}` : ''),
      render: (row: PackageUsageRow) =>
        row.status === 'RETURNED' ? <UserDateCell login={row.returnedBy} date={row.returnedDate} /> : <span className="pkgh-muted">-</span>
    }
  ];

  return (
    <MyModal
      open={patientPackageId != null}
      setOpen={open => !open && onClose()}
      title={data ? `${data.packageName ?? ''} · History` : 'Package History'}
      steps={[{ title: 'History', icon: <FaClockRotateLeft /> }]}
      size="70vw"
      position="right"
      hideActionBtn
      content={
        <div className="pkgh">
          {data && (
            <div className="pkgh-summary">
              <div>
                <span className="pkgh-label">
                  <Translate>Given to the visit</Translate>
                </span>
                <UserDateCell login={data.givenBy} date={data.givenDate} />
              </div>
              <div>
                <span className="pkgh-label">
                  <Translate>Status</Translate>
                </span>
                {formatEnumString(data.status ?? '')}
                {data.cancelReason ? ` (${data.cancelReason})` : ''}
              </div>
              <div>
                <span className="pkgh-label">
                  <Translate>Orders</Translate>
                </span>
                {counted} <Translate>counted</Translate> · {returned} <Translate>returned</Translate>
              </div>
            </div>
          )}
          <MyTable
            data={rows}
            columns={columns}
            height={420}
            loading={isFetching}
            dontTranslateData
            rowClassName={(row: PackageUsageRow) => (row.status === 'RETURNED' ? 'pkgh-row-returned' : '')}
            enableExport
            exportFileName="package-history"
          />
        </div>
      }
    />
  );
};

export default PackageHistoryModal;
