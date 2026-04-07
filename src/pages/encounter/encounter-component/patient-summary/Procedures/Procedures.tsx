
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import React, { useMemo, useRef, useState } from 'react';
import { Loader } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { useLocation } from 'react-router-dom';
import { useGetProceduresQuery as useGetAllProceduresQuery } from '@/services/setup/procedure/procedureService';
import { useLazyGetProcedureByIdQuery } from '@/services/setup/procedure/procedureService';
import { useLazyGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { cond } from 'lodash';
import { useGetProceduresByIdsQuery } from '@/services/setup/procedure/procedureService';
import { useGetIcdDiagnosesByIdsQuery } from '@/services/setup/icdTreeService';
import Section from '@/components/Section';
import FullViewTable from './FullViewTable';
import { useFindProcduresByPatientQuery } from '@/services/patients/patientProcedureService';

const TableLoader = () => (
  <div className="table-loader">
    <Loader size="xs" />
    <span className="table-loader-text">Loading...</span>
  </div>
);

const Procedures = ({ patient }) => {
  const location = useLocation();
  const [open, setOpen] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data: CategoryLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');
  const [getProcedureById] = useLazyGetProcedureByIdQuery();
  const [getDepartmentsByFacility] = useLazyGetActiveDepartmentByFacilityListQuery();

  const {
    data: proceduresData,
    refetch: proRefetch,
    isLoading: procedureLoding
  } = useFindProcduresByPatientQuery(
    {
      patientId: patient?.id || patient?.key,
      page,
      size: pageSize,
      includeCancelled: false
    },
    { skip: !patient?.id && !patient?.key }
  );

  const procedures = proceduresData?.data ?? [];
  const totalCount = proceduresData?.totalCount ?? 0;
  const procedureIds = useMemo(() => {
    const ids = procedures.map(p => Number(p.procedureId)).filter(id => !isNaN(id));

    return Array.from(new Set(ids));
  }, [procedures]);

  const indicationIds = useMemo(() => {
    const ids: Array<number | string> = [];
    procedures.forEach(p => {
      if (!p.indicationId) return;

      if (Array.isArray(p.indicationId)) {
        ids.push(...p.indicationId);
      } else {
        ids.push(p.indicationId);
      }
    });

    return Array.from(new Set(ids));
  }, [procedures]);

  const { data: proceduresByIds } = useGetProceduresByIdsQuery(procedureIds, {
    skip: !procedureIds.length
  });
  const { data: icdDiagnoses } = useGetIcdDiagnosesByIdsQuery(
    { ids: indicationIds },
    { skip: !indicationIds.length }
  );

  const proceduresMap = useMemo(() => {
    const map = new Map<number, any>();
    (proceduresByIds ?? []).forEach(p => {
      map.set(p.id, p);
    });
    return map;
  }, [proceduresByIds]);

  const icdMap = useMemo(() => {
    const map = new Map<number | string, any>();

    (icdDiagnoses ?? []).forEach(d => {
      map.set(d.id ?? d.icdDiagnosisUid, d);
    });

    return map;
  }, [icdDiagnoses]);

  const tableColumns = useMemo(
    () => [
      {
        key: 'procedureName',
        title: <Translate>Procedure Name</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          if (!proceduresByIds && procedureIds.length > 0) {
            return <TableLoader />;
          }

          const proc = proceduresMap.get(Number(rowData.procedureId));
          return proc?.name ?? '';
        }
      },
      {
        key: 'scheduledDateTime',
        dataKey: 'scheduledDateTime',
        title: <Translate>SCHEDULED DATE TIME</Translate>,
        flexGrow: 1,
        render: (rowData: any) =>
          rowData?.scheduledDateTime ? formatDateWithoutSeconds(rowData.scheduledDateTime) : ' '
      },
      {
        key: 'categoryType',
        dataKey: 'categoryType',
        title: <Translate>CATEGORY</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          if (!proceduresByIds && procedureIds.length > 0) {
            return <TableLoader />;
          }

          const proc = proceduresMap.get(Number(rowData.procedureId));

          const category = CategoryLovQueryResponse?.object?.find(
            (item: any) => item.key === proc?.categoryType
          );

          return category?.lovDisplayVale || '';
        }
      },

    ],
    [
      CategoryLovQueryResponse,
      proceduresMap,
      dispatch,
      getProcedureById,
      icdMap,
      proceduresByIds,
      icdDiagnoses,
      procedureIds,
      indicationIds
    ]
  );

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Section
      title={<Translate>Procedures</Translate>}
      isContainOnlyTable
      content={
        <MyTable
          columns={tableColumns}
          data={procedures}
          loading={procedureLoding}
          page={page}
          rowsPerPage={pageSize}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}

        />
      }
      rightLink="Full view"
      setOpen={setOpen}
      openedContent={
        <FullViewTable open={open} setOpen={setOpen} procedures={proceduresData?.data || []}  proceduresByIds={proceduresByIds} procedureIds={procedureIds} proceduresMap={proceduresMap} icdMap={icdMap} icdDiagnoses={icdDiagnoses} indicationIds={indicationIds} TableLoader={TableLoader}/>
      }
    />
  );
};

export default Procedures;
