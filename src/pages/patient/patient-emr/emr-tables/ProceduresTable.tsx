import React, { useMemo, useState } from "react";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { formatDateWithoutSeconds, formatEnumString } from "@/utils";

import { useFindProcduresByPatientQuery } from "@/services/patients/patientProcedureService";
import { useGetProceduresByIdsQuery } from "@/services/setup/procedure/procedureService";
import { useGetIcdDiagnosesByIdsQuery } from "@/services/setup/icdTreeService";

import { useNavigate } from "react-router-dom";

const ProceduresTable = ({ patient}) => {
 console.log("ProceduresTable ==> ", { patient});
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const { data, isLoading } = useFindProcduresByPatientQuery(
    {
      patientId: patient?.id,
      page,
      size,
      includeCancelled: true
    },
    { skip: !patient?.id }
  );

  const procedures = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;

  // -------- PROCEDURE IDS --------

  const procedureIds = useMemo(() => {
    const ids = procedures.map(p => Number(p.procedureId)).filter(id => !isNaN(id));
    return Array.from(new Set(ids));
  }, [procedures]);

  const indicationIds = useMemo(() => {
    const ids: any[] = [];

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

  // -------- LOOKUPS --------

  const { data: proceduresByIds } = useGetProceduresByIdsQuery(procedureIds, {
    skip: !procedureIds.length
  });

  const { data: icdDiagnoses } = useGetIcdDiagnosesByIdsQuery(
    { ids: indicationIds },
    { skip: !indicationIds.length }
  );

  const proceduresMap = useMemo(() => {
    const map = new Map();
    (proceduresByIds ?? []).forEach(p => map.set(p.id, p));
    return map;
  }, [proceduresByIds]);

  const icdMap = useMemo(() => {
    const map = new Map();
    (icdDiagnoses ?? []).forEach(d => map.set(d.id ?? d.icdDiagnosisUid, d));
    return map;
  }, [icdDiagnoses]);

  // -------- OPEN VISIT --------

  const openVisit = (visitId: number) => {

    navigate("/encounter", {
      state: {
        patient,
        encounter: { id: visitId },
        edit: false,   // read only
        readOnly: true
      }
    });

  };

  // -------- COLUMNS --------

  const columns = useMemo(() => [
    {
      key: "visitId",
      title: <Translate>VISIT ID</Translate>,
      flexGrow: 1,
      render: row => (

        <span
          style={{
            color: "#0d6efd",
            cursor: "pointer",
            textDecoration: "underline"
          }}
          onClick={() => openVisit(row.encounterId)}
        >
          {row.encounterId ?? "-"}
        </span>

      )
    },
    {
      key: "procedureId",
      title: <Translate>PROCEDURE ID</Translate>,
      flexGrow: 1
    },
    {
      key: "procedureName",
      title: <Translate>PROCEDURE NAME</Translate>,
      flexGrow: 2,
      render: row => {
        const proc = proceduresMap.get(Number(row.procedureId));
        return proc?.name ?? "-";
      }
    },
    {
      key: "scheduledDateTime",
      title: <Translate>SCHEDULED DATE</Translate>,
      flexGrow: 1,
      render: row =>
        row?.scheduledDateTime
          ? formatDateWithoutSeconds(row.scheduledDateTime)
          : "-"
    },
    {
      key: "priority",
      title: <Translate>PRIORITY</Translate>,
      flexGrow: 1,
      render: row => formatEnumString(row?.priority)
    },
    {
      key: "procedureLevel",
      title: <Translate>LEVEL</Translate>,
      flexGrow: 1,
      render: row => formatEnumString(row?.procedureLevel)
    },
    {
      key: "indication",
      title: <Translate>INDICATIONS</Translate>,
      flexGrow: 2,
      render: row => {

        if (!row?.indicationId) return "-";

        const ids = Array.isArray(row.indicationId)
          ? row.indicationId
          : [row.indicationId];

        const names = ids
          .map(id => {
            const diag = icdMap.get(Number(id));
            return diag?.icdShortDescription || diag?.icdCode;
          })
          .filter(Boolean);

        return names.join(", ");
      }
    },
    {
      key: "created",
      title: <Translate>CREATED BY / AT</Translate>,
      expandable: true,
      render: row => (
        <>
          {row?.createdBy ?? ""}
          <br />
          <span style={{ fontSize: 11, color: "#777" }}>
            {row?.createdDate
              ? formatDateWithoutSeconds(row.createdDate)
              : ""}
          </span>
        </>
      )
    }
  ], [proceduresMap, icdMap]);

  return (
    <MyTable
      columns={columns}
      data={procedures}
      loading={isLoading}
      page={page}
      rowsPerPage={size}
      totalCount={totalCount}
      onPageChange={(_, p) => setPage(p)}
      onRowsPerPageChange={(e) => {
        setSize(Number(e.target.value));
        setPage(0);
      }}
      height={400}
    />
  );
};

export default ProceduresTable;