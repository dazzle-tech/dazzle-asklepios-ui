import React, { useMemo, useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import Translate from '@/components/Translate';
import { formatDateWithoutSeconds, conjureValueBasedOnKeyFromList } from '@/utils';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

import { useGetDentalProceduresByPatientQuery } from '@/services/dentalProcedureService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetServicesByCategoryQuery } from '@/services/setup/serviceService';
import { useGetCdtByIdsQuery } from '@/services/setup/cdtCodeService';
import { useEnumOptions } from '@/services/enumsApi';
import UserDateCell from '@/components/UserDateCell';

const DentalProcedures = ({ patient, encounter }: any) => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // ─────────── Data ───────────
  const { data: proceduresData, isLoading } =
    useGetDentalProceduresByPatientQuery(
      { patientId: patient?.id, showCancelled: false, page, size },
      { skip: !patient?.id }
    );

  const rows = proceduresData ?? [];

  // ─────────── LOVs ───────────
  const { data: toothSurfData } = useGetLovValuesByCodeQuery('TOOTH_SURF');
  const { data: valueUnitData } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const { data: serviceList } = useGetServicesByCategoryQuery({
    page: 0,
    size: 1000,
    category: 'DENTAL'
  });

  const ToothEnum = useEnumOptions('ToothNumber');

  // ─────────── CDT Mapping ───────────
  const cdtIds = useMemo(() => {
    const ids: number[] = [];
    const seen = new Set<number>();

    rows.forEach((r: any) => {
      if (r.cdtCodeId && !seen.has(r.cdtCodeId)) {
        seen.add(r.cdtCodeId);
        ids.push(r.cdtCodeId);
      }
    });

    return ids;
  }, [rows]);

  const { data: cdtList = [] } = useGetCdtByIdsQuery(cdtIds, {
    skip: cdtIds.length === 0
  });

  const cdtMap = useMemo(
    () => Object.fromEntries((cdtList as any[]).map(c => [c.id, c])),
    [cdtList]
  );

  // ─────────── Columns ───────────
  const columns: ColumnConfig[] = [
    {
      key: 'toothNumber',
      title: <Translate>Tooth Number</Translate>,
      render: row =>
        ToothEnum?.find((t: any) => t.value === row.toothNumber)?.label ||
        row.toothNumber ||
        '-'
    },
    {
      key: 'surface',
      title: <Translate>Surface</Translate>,
      render: row =>
        conjureValueBasedOnKeyFromList(
          toothSurfData?.object ?? [],
          row.surface,
          'lovDisplayVale'
        ) || '-'
    },
    {
      key: 'procedure',
      title: <Translate>Procedure Name</Translate>,
      render: row => {
        const service = (serviceList?.data ?? []).find(
          (s: any) => s.id === row.serviceId
        );
        return service?.name || '-';
      }
    },
    {
      key: 'cdt',
      title: <Translate>CDT Code</Translate>,
      render: row => {
        const cdt = row.cdtCodeId ? cdtMap[row.cdtCodeId] : null;
        return cdt ? `${cdt.code} - ${cdt.description}` : '-';
      }
    },
    {
    key: "created",
    title: <Translate>Created By / At</Translate>,
      render: (rowData: any) => (
        <UserDateCell
          login={rowData?.createdBy}
          date={rowData?.createdDate}
        />
      ),
    },

    // ─────────── Expandable ───────────
    {
      key: 'anesthesia',
      title: <Translate>Anesthesia Used</Translate>,
      expandable: true,
      render: row => row.anesthesiaUsed || '-'
    },
    {
      key: 'dose',
      title: <Translate>Dose / Unit</Translate>,
      expandable: true,
      render: row => {
        const unit =
          conjureValueBasedOnKeyFromList(
            valueUnitData?.object ?? [],
            row.unit,
            'lovDisplayVale'
          ) || '';

        return row.dose ? `${row.dose} ${unit}` : '-';
      }
    },
    {
      key: 'filling',
      title: <Translate>Filling Material</Translate>,
      expandable: true,
      render: row => row.fillingMaterial || '-'
    },
    {
      key: 'notes',
      title: <Translate>Notes</Translate>,
      expandable: true,
      render: row => row.notes || '-'
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      render: row => (
        <MyBadgeStatus
          contant={row.cancelled ? 'Cancelled' : 'Active'}
          color={row.cancelled ? '#D64545' : '#0DAA41'}
        />
      )
    }
  ];

  // ─────────── Render ───────────
  return (
    <MyTable
      data={rows}
      columns={columns}
      loading={isLoading}
      page={page}
      rowsPerPage={size}
      totalCount={rows.length}
      onPageChange={(_, newPage) => setPage(newPage)}
      onRowsPerPageChange={e => {
        setSize(parseInt(e.target.value, 10));
        setPage(0);
      }}
      height={500}
    />
  );
};

export default DentalProcedures;