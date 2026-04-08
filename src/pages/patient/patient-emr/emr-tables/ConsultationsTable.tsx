import React, { useMemo, useState } from "react";
import MyTable from "@/components/MyTable";
import MyTab from "@/components/MyTab";
import Translate from "@/components/Translate";
import { formatDateWithoutSeconds, formatEnumString } from "@/utils";

import { useFindConsultationByPatientQuery } from "@/services/consultation/consultationService";
import { useFindByPatientQuery } from "@/services/patients/telephonicConsultationService";
import { useGetAllPractitionersQuery } from "@/services/setup/practitioner/PractitionerService";

import { initialListRequest } from "@/types/types";

const ClinicalConsultationsTables = ({ patient, encounter }) => {

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // ───────── NORMAL CONSULTATION ─────────
  const { data: consultationData, isLoading: consultationLoading } =
    useFindConsultationByPatientQuery(
      { patientId: patient?.id, page, size },
      { skip: !patient?.id }
    );

  const consultations = consultationData?.data ?? [];
  const consultationTotal = consultationData?.totalCount ?? 0;

  // ───────── TELEPHONIC ─────────
  const { data: telephonicResponse, isLoading: telephonicLoading } =
    useFindByPatientQuery({ patientId: patient?.id, page, size });

  const telephonicRows = telephonicResponse?.data ?? [];
  const telephonicTotal = telephonicResponse?.totalCount ?? 0;

  // ───────── PRACTITIONERS (FOR TELEPHONIC) ─────────

  const { data: practitionerResponse } = useGetAllPractitionersQuery({
    page: 0,
    size: 9999,
    sort: "id,asc"
  });

  const physicians =
    practitionerResponse?.data?.filter(p => p.jobRole === "PHYSICIAN") ?? [];

  // ───────── COLUMNS NORMAL CONSULTATION ─────────

  const consultationColumns = useMemo(() => [
    {
      key: "consultationNumber",
      title: <Translate>CONSULTATION NUMBER</Translate>,
      flexGrow: 1
    },
    {
      key: "destinationType",
      title: <Translate>DESTINATION</Translate>,
      flexGrow: 1,
      render: row => formatEnumString(String(row.destinationType ?? ""))
    },
    {
      key: "status",
      title: <Translate>STATUS</Translate>,
      flexGrow: 1,
      render: row => formatEnumString(String(row.status ?? ""))
    },
    {
      key: "question",
      title: <Translate>QUESTION</Translate>,
      flexGrow: 3,
      render: row => row.consultationContent ?? "-"
    },
    {
      key: "response",
      title: <Translate>RESPONSE</Translate>,
      flexGrow: 3,
      render: row => row.responseText ?? "-"
    },
    {
      key: "created",
      title: <Translate>CREATED BY / AT</Translate>,
      expandable: true,
      render: row =>
        row.createdDate ? (
          <>
            {row.createdBy}
            <br />
            <span style={{ fontSize: 11, color: "#777" }}>
              {formatDateWithoutSeconds(row.createdDate)}
            </span>
          </>
        ) : "-"
    }
  ], []);


  const teleconsultationColumns = useMemo(() => [
    {
      key: "practitioner",
      title: <Translate>PRACTITIONER</Translate>,
      flexGrow: 2,
      render: row => {
        const practitioner = physicians.find(p => p.id === row.practitionerId);
        return practitioner
          ? practitioner.firstName + " " + practitioner.lastName
          : "-";
      }
    },
    {
      key: "dateTime",
      title: <Translate>DATE TIME</Translate>,
      flexGrow: 2,
      render: row =>
        row.dateTime
          ? formatDateWithoutSeconds(row.dateTime)
          : "-"
    },
    {
      key: "consultantNotes",
      title: <Translate>CONSULTANT NOTES</Translate>,
      flexGrow: 4,
      render: row => row.consultantNotes ?? "-"
    }
  ], [physicians]);


  // ───────── COLUMNS TELEPHONIC ─────────

  const telephonicColumns = useMemo(() => [
    {
      key: "physician",
      title: <Translate>PHYSICIAN</Translate>,
      flexGrow: 2,
      render: row => {
        const physician = physicians.find(p => p.id === row.physician);
        return physician
          ? physician.firstName + " " + physician.lastName
          : "-";
      }
    },
    {
      key: "dateOfCall",
      title: <Translate>DATE OF CALL</Translate>,
      flexGrow: 2,
      render: row =>
        row.dateOfCall
          ? new Date(row.dateOfCall).toLocaleString()
          : "-"
    },
    {
      key: "consultationContent",
      title: <Translate>CONSULTATION CONTENT</Translate>,
      flexGrow: 4
    },
    {
      key: "created",
      title: <Translate>CREATED BY / AT</Translate>,
      expandable: true,
      render: row =>
        row?.createdAt ? (
          <>
            {row?.createdBy}
            <br />
            <span style={{ fontSize: 11, color: "#777" }}>
              {formatDateWithoutSeconds(row.createdAt)}
            </span>
          </>
        ) : "-"
    }
  ], [physicians]);

  // ───────── TABLES ─────────

  const consultationTable = (
    <MyTable
      columns={consultationColumns}
      data={consultations}
      loading={consultationLoading}
      page={page}
      rowsPerPage={size}
      totalCount={consultationTotal}
      onPageChange={(_, p) => setPage(p)}
      onRowsPerPageChange={e => {
        setSize(Number(e.target.value));
        setPage(0);
      }}
    />
  );

  const telephonicTable = (
    <MyTable
      columns={telephonicColumns}
      data={telephonicRows}
      loading={telephonicLoading}
      page={page}
      rowsPerPage={size}
      totalCount={telephonicTotal}
      onPageChange={(_, p) => setPage(p)}
      onRowsPerPageChange={e => {
        setSize(Number(e.target.value));
        setPage(0);
      }}
    />
  );

  const teleconsultationTable = (
    <MyTable
      columns={teleconsultationColumns}
      data={telephonicRows}
      loading={telephonicLoading}
      page={page}
      rowsPerPage={size}
      totalCount={telephonicTotal}
      onPageChange={(_, p) => setPage(p)}
      onRowsPerPageChange={e => {
        setSize(Number(e.target.value));
        setPage(0);
      }}
    />
  );

  // ───────── TABS ─────────

  const tabData = [
    {
      title: "Consultation",
      content: consultationTable
    },
    {
      title: "Telephonic",
      content: telephonicTable
    },
    {
      title: "Teleconsultation",
      content: teleconsultationTable
    }
  ];

  return <MyTab data={tabData} />;
};

export default ClinicalConsultationsTables;