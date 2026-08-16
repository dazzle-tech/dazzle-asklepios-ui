import React, { useEffect, useMemo, useState } from "react";
import Translate from "@/components/Translate";
import MyTable from "@/components/MyTable";
import MyButton from "@/components/MyButton/MyButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileArrowDown, faEye } from "@fortawesome/free-solid-svg-icons";

import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import {
  formatDateWithoutSeconds,
  formatEnumString,
  conjureValueBasedOnKeyFromList
} from "@/utils";

import {
  useGetPatientAttachmentsQuery,
  useGetDownloadUrlMutation as useGetPatientDownloadUrlMutation
} from "@/services/patients/attachmentService";

import {
  useGetDownloadUrlMutation as useGetEncounterDownloadUrlMutation,
  useGetEncounterAttachmentsByEncounterIdsQuery
} from "@/services/encounters/attachmentsService";

import { useGetEncountersByPatientQuery } from "@/services/encounters/patientEncounterService";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";

import { initialListRequest } from "@/types/types";
import { PreviewModal } from "@/components/AttachmentModals";
import UserDateCell from "@/components/UserDateCell";

const AttachmentsTable = ({ localPatient }) => {
  const dispatch = useAppDispatch();

  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewFileName, setPreviewFileName] = useState("");
  const [previewFileType, setPreviewFileType] = useState("");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const patientId = Number(localPatient?.id ?? localPatient?.key);

  const hasPatient = Number.isFinite(patientId);


  const [getPatientDownloadUrl] = useGetPatientDownloadUrlMutation();
  const [getEncounterDownloadUrl] = useGetEncounterDownloadUrlMutation();

  const { data: attachmentsLovQueryResponse } =
    useGetLovValuesByCodeQuery("ATTACH_TYPE");

  const attachmentTypesLov = attachmentsLovQueryResponse?.object ?? [];

  // ---------------- PATIENT ENCOUNTERS ----------------

const { data: encountersPaged, isLoading: loadingEncounters } =
  useGetEncountersByPatientQuery(
    {
      patientId,
      page: 0,
      size: 1000,
      sort: "id,desc"
    },
    {
      skip: !hasPatient
    }
  );

const patientEncounters = encountersPaged?.data ?? [];

const encounterIds = patientEncounters
  .map(enc => Number(enc.id))
  .filter(id => Number.isFinite(id) && id > 0);



  // ---------------- PATIENT ATTACHMENTS ----------------

  const {
    data: patientAttachmentsResponse,
    refetch: patientAttachmentsRefetch,
    isLoading: loadingPatientAttachments
  } = useGetPatientAttachmentsQuery(
    { patientId },
    {
      skip: !hasPatient,
      refetchOnMountOrArgChange: true
    }
  );

  const patientAttachments = patientAttachmentsResponse?.data ?? [];

  // ---------------- ENCOUNTER ATTACHMENTS ----------------

  const {
    data: encounterAttachmentsResponse,
    refetch: encounterAttachmentsRefetch,
    isLoading: loadingEncounterAttachments
  } = useGetEncounterAttachmentsByEncounterIdsQuery(
    { encounterIds },
    {
      skip: encounterIds.length === 0,
      refetchOnMountOrArgChange: true
    }
  );


  const encounterAttachments = encounterAttachmentsResponse ?? [];
  // ---------------- MERGE DATA ----------------

  const combinedAttachments = useMemo(() => [
    ...patientAttachments.map(att => ({
      ...att,
      attachmentType: "patient"
    })),
    ...encounterAttachments.map(att => ({
      ...att,
      attachmentType: "encounter"
    }))
  ], [patientAttachments, encounterAttachments]);


  const totalCount = combinedAttachments.length;

  const loading =
    loadingPatientAttachments ||
    loadingEncounterAttachments ||
    loadingEncounters;

  // ---------------- REFETCH WHEN PATIENT CHANGES ----------------

  useEffect(() => {
    if (!hasPatient) return;

    patientAttachmentsRefetch();

    if (encounterIds.length) {
      encounterAttachmentsRefetch();
    }

    setPage(0);
    setSelectedAttachment(null);
  }, [patientId]);

  const isSelected = row =>
    row && selectedAttachment && row.id === selectedAttachment.id
      ? "selected-row"
      : "";

  // ---------------- PREVIEW ----------------

  const handlePreview = async attachment => {
    try {
      const ticket =
        attachment.attachmentType === "patient"
          ? await getPatientDownloadUrl(attachment.id).unwrap()
          : await getEncounterDownloadUrl(attachment.id).unwrap();

      setPreviewUrl(ticket.url);
      setPreviewFileName(attachment.filename);
      setPreviewFileType(attachment.mimeType);
      setPreviewModalOpen(true);
    } catch {
      dispatch(notify({ msg: "Preview failed", sev: "error" }));
    }
  };

  const handleClosePreview = () => {
    setPreviewModalOpen(false);
    setPreviewUrl("");
    setPreviewFileName("");
    setPreviewFileType("");
  };

  // ---------------- DOWNLOAD ----------------

  const handleDownload = async attachment => {
    try {
      const ticket =
        attachment.attachmentType === "patient"
          ? await getPatientDownloadUrl(attachment.id).unwrap()
          : await getEncounterDownloadUrl(attachment.id).unwrap();

      const link = document.createElement("a");
      link.href = ticket.url;
      link.download = attachment.filename;
      link.target = "_blank";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      dispatch(notify({ msg: "Download started", sev: "success" }));
    } catch {
      dispatch(notify({ msg: "Download failed", sev: "error" }));
    }
  };

  // ---------------- COLUMNS ----------------

  const columns = [
    {
      key: "category",
      title: <Translate>Category</Translate>,
      flexGrow: 2,
      render: row => (
        <span
          style={{
            padding: "4px 8px",
            borderRadius: "4px",
            backgroundColor:
              row.attachmentType === "patient" ? "#e3f2fd" : "#fff3e0",
            color: row.attachmentType === "patient" ? "#1976d2" : "#f57c00",
            fontWeight: 500,
            fontSize: "12px"
          }}
        >
          {row.attachmentType === "patient" ? "Patient" : "Encounter"}
        </span>
      )
    },

    {
      key: "filename",
      title: <Translate>Attachment Name</Translate>,
      dataKey: "filename",
      flexGrow: 4
    },

    {
      key: "mimeType",
      title: <Translate>File Type</Translate>,
      dataKey: "mimeType",
      flexGrow: 2
    },

    {
      key: "type",
      title: <Translate>Type</Translate>,
      flexGrow: 3,
      render: row =>
        row.type
          ? conjureValueBasedOnKeyFromList(
            attachmentTypesLov,
            row.type,
            "lovDisplayVale"
          )
          : "-"
    },

    {
      key: "source",
      title: <Translate>Source</Translate>,
      flexGrow: 2,
      render: row => formatEnumString(row.source)
    },

    {
      key: "visit",
      title: <Translate>Visit</Translate>,
      flexGrow: 2,
      render: row => {
        if (row.attachmentType === "encounter" && row.encounterId) {
          const encounter = patientEncounters.find(
            enc => Number(enc.id || enc.key) === Number(row.encounterId)
          );

          return encounter?.visitId ?? row.encounterId;
        }

        return "-";
      }
    },

    {
      key: "preview",
      title: <Translate>Preview</Translate>,
      flexGrow: 2,
      render: row => (
        <MyButton
          appearance="link"
          prefixIcon={() => <FontAwesomeIcon icon={faEye} />}
          onClick={() => handlePreview(row)}
        >
          Preview
        </MyButton>
      )
    },

    {
      key: "download",
      title: <Translate>Download</Translate>,
      flexGrow: 2,
      render: row => (
        <MyButton
          appearance="link"
          prefixIcon={() => <FontAwesomeIcon icon={faFileArrowDown} />}
          onClick={() => handleDownload(row)}
        >
          Download
        </MyButton>
      )
    },

    {
      key: "created",
      title: <Translate>Created By / At</Translate>,
      flexGrow: 3,
      render: row =>
        row?.createdBy || row?.createdDate ? (
          <UserDateCell
            login={row.createdBy}
            date={row.createdDate}
          />
        ) : (
          "-"
        )
    }
  ];

  // ---------------- RENDER ----------------

  return (
    <div className="tab-main-container">
      <MyTable
        height={350}
        loading={loading}
        data={combinedAttachments}
        columns={columns}
        onRowClick={row => setSelectedAttachment(row)}
        rowClassName={isSelected}
        page={page}
        rowsPerPage={pageSize}
        totalCount={totalCount}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={e => {
          setPageSize(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />

      <PreviewModal
        open={previewModalOpen}
        onClose={handleClosePreview}
        previewUrl={previewUrl}
        previewFileName={previewFileName}
        previewFileType={previewFileType}
      />
    </div>
  );
};

export default AttachmentsTable;