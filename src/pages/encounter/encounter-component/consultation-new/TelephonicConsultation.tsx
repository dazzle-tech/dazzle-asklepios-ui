import React, { useEffect, useRef, useState, useCallback } from "react";
import MyButton from "@/components/MyButton/MyButton";
import MyTable from "@/components/MyTable";
import { MdModeEdit, MdAttachFile } from "react-icons/md";
import { Checkbox } from "rsuite";
import {
  useGetTelephonicConsultationOrdersListQuery,
} from "@/services/encounterService";
import { initialListRequest } from "@/types/types";
import DetailsTele from "./DetailsTele";
import MyModal from "@/components/MyModal/MyModal";
import EncounterAttachment from "@/pages/patient/patient-profile/tabs/Attachment-new/EncounterAttachment";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPrint, faPlus } from "@fortawesome/free-solid-svg-icons";
import BlockIcon from "@rsuite/icons/Block";
import CheckIcon from "@rsuite/icons/Check";
import { newApTelephonicConsultation } from "@/types/model-types-constructor";
import { useLocation } from "react-router-dom";
import CancellationModal from "@/components/CancellationModal";
import { useSaveTelephonicConsultationOrderMutation } from "@/services/encounterService";
import { notify } from "@/utils/uiReducerActions";
import { useAppDispatch } from "@/hooks";
import { useGetAllPractitionersQuery } from "@/services/setup/practitioner/PractitionerService";
import { formatDateWithoutSeconds } from "@/utils";
import './styles.less';
const TelephonicConsultation = (props) => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const edit = props.edit ?? location.state?.edit ?? false;
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const dispatch = useAppDispatch();
  const [saveTeleOrder] = useSaveTelephonicConsultationOrderMutation();

  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [showCanceled, setShowCanceled] = useState(false);

  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [openModal, setOpenModal] = useState(false);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);

  const [consultationOrder, setConsultationOrder] = useState({
    ...newApTelephonicConsultation,
  });

  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
    pageSize: 20,
    filters: [
      { fieldName: "deleted_at", operator: "isNull", value: undefined },
      { fieldName: "patient_key", operator: "match", value: patient?.key },
      { fieldName: "encounter_key", operator: "match", value: encounter?.key }
    ]
  });

  const { data, isLoading } = useGetTelephonicConsultationOrdersListQuery(listRequest);
  const { data: practitionerListResponse } = useGetAllPractitionersQuery({
    page: 0,
    size: 9999,
    sort: "id,asc",
  });

  const physicians =
    practitionerListResponse?.data?.filter(
      (p) => p.jobRole === "PHYSICIAN"
    ) ?? [];

  const totalCount = data?.extraNumeric ?? 0;
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;

  const isFormField = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest(`
        input, textarea, select, button,
        .rs-input, .rs-picker, .rs-checkbox, .rs-btn,
        .rs-picker-toggle, .rs-calendar, .rs-dropdown
      `) !== null
    );
  };

  const isInsideModalOrPopup = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return node.closest(".rs-modal, .rs-picker-popup, .my-modal") !== null;
  };

  const isDataRow = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest(".rs-table-row") &&
      !node.closest(".rs-table-row-header")
    );
  };

  const handleClearSelection = useCallback(() => {
    setSelectedRow(null);
    setSelectedRows([]);
  }, []);

  useEffect(() => {
    const handlePointer = (e: PointerEvent) => {
      const target = e.target;

      if (isFormField(target) || isInsideModalOrPopup(target)) return;

      const insideTable = tableContainerRef.current?.contains(target as Node);
      const rowClick = isDataRow(target);

      if (!insideTable) return handleClearSelection();
      if (insideTable && !rowClick) return handleClearSelection();
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClearSelection();
    };

    document.addEventListener("pointerdown", handlePointer, true);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("pointerdown", handlePointer, true);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [handleClearSelection]);

  const handleOpenAttachments = (row) => {
    setConsultationOrder(row);
    setAttachmentsModalOpen(true);
  };

  const isSelected = (r) =>
    selectedRow?.key === r?.key ? "selected-row" : "";


  const handleCheckboxChange = (rowData: any) => {
    setSelectedRows(prev => {
      if (prev.includes(rowData)) {
        return prev.filter(item => item !== rowData);
      }
      return [...prev, rowData];
    });
  };

  const columns = [
    {
      key: 'select',
      title: '#',
      flexGrow: 1,
      render: (rowData: any) => (
        <Checkbox
          checked={selectedRows.includes(rowData)}
          onChange={() => handleCheckboxChange(rowData)}
          disabled={rowData.isValid === false}
        />
      )
    },

    {
      key: "physician",
      title: "Physician",
      flexGrow: 2,
      render: (row) => {
        const physician = physicians.find(item => item?.id === row?.physician);
        return <p>{physician?.firstName + " " + physician.lastName}</p>
      }
    },
    {
      key: "dateOfCall",
      title: "Date Of Call",
      flexGrow: 2,
      render: (row) => row.dateOfCall ? new Date(row.dateOfCall).toLocaleString() : ""
    },
    {
      key: "consultationContent",
      title: "Consultation Content",
      flexGrow: 4,
      render: (row) => (
        <div className="consultation-content-container" >
          {row.consultationContent}
        </div>
      )
    },
    {
      key: "attachments",
      title: "Attachments",
      flexGrow: 1,
      render: (row) => (
        <MdAttachFile
          size={20}
          fill={row?.key ? "var(--primary-gray)" : "#ccc"}
          onClick={() => row?.key && handleOpenAttachments(row)}
          style={{
            cursor: row?.key ? "pointer" : "not-allowed",
          }}
        />
      )
    },
    {
      key: "edit",
      title: "",
      flexGrow: 1,
      render: (row) => (
        <MdModeEdit
          size={22}
          fill="var(--primary-gray)"
          style={{ cursor: "pointer" }}
          onClick={() => {
            setSelectedRow(row);
            setConsultationOrder(row);
            setOpenModal(true);
          }}
        />
      )
    },
    {
      key: 'createdAt',
      title: 'CREATED BY/AT',
      expandable: true,
      render: (row) =>
        row?.createdAt ? (
          <>
            {row?.createdBy}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'deletedAt',
      title: 'CANCELLED BY/AT',
      expandable: true,
      render: (row) =>
        row?.deletedAt ? (
          <>
            {row?.deletedBy}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row?.deletedAt)}</span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'cancellationReason',
      title: 'Cancellation Reason',
      expandable: true,
    },
  ];

  const handleCancel = async () => {
    try {
      await Promise.all(
        selectedRows.map(item =>
          saveTeleOrder({
            ...item,
            isValid: false,
            deletedAt: Date.now(),
            deletedBy: user?.firstName + " " + user?.lastName,
            cancellationReason: consultationOrder?.cancellationReason,
          }).unwrap()
        )
      );


      dispatch(notify("All consultations cancelled"));
      setSelectedRows([]);
      setOpenCancelModal(false);

      setListRequest(prev => ({ ...prev, timestamp: Date.now() }));
    } catch {
      dispatch(notify("Cancel failed"));
    }
  };




  const handlePageChange = (_: any, newPage: number) => {
    setListRequest({
      ...listRequest,
      pageNumber: newPage + 1,
    });
  };

  const handleRowsPerPageChange = (e) => {
    setListRequest({
      ...listRequest,
      pageSize: Number(e.target.value),
      pageNumber: 1,
    });
  };

  const tableButtons = (
    <div className="bt-div-2">

      <div className="bt-left-2">
        <MyButton
          prefixIcon={() => <BlockIcon />}
          onClick={() => setOpenCancelModal(true)}
          disabled={selectedRows.length === 0}
        >
          Cancel
        </MyButton>

        <Checkbox
          checked={showCanceled}
          onChange={() => setShowCanceled(prev => !prev)}
        >
          Show Cancelled
        </Checkbox>



      </div>

      <div className={clsx("bt-right-2", { "disabled-panel": edit })}>
        <MyButton
          prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
          onClick={() => {
            setSelectedRow(null);
            setConsultationOrder({
              ...newApTelephonicConsultation,
              patientKey: patient?.key,
              encounterKey: encounter?.key,
              createdBy: "Admin",
            });
            setOpenModal(true);
          }}
        >
          Add Consultation
        </MyButton>

      </div>
    </div>
  );


  useEffect(() => {
    setListRequest(prev => ({
      ...prev,
      filters: [
        {
          fieldName: "is_valid",
          operator: "equal",
          value: !showCanceled
        },
        {
          fieldName: "patient_key",
          operator: "match",
          value: patient?.key
        }
      ]
    }));
  }, [showCanceled, patient?.key, encounter?.key]);


  return (
    <div>
      <div ref={tableContainerRef}>
        <MyTable
          height={450}
          loading={isLoading}
          data={data?.object || []}
          columns={columns}
          rowClassName={isSelected}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onRowClick={(row) => setSelectedRow(row)}
          tableButtons={tableButtons}
        />
      </div>
      <DetailsTele
        patient={patient}
        encounter={encounter}
        consultationOrders={consultationOrder}
        setConsultationOrder={setConsultationOrder}
        open={openModal}
        setOpen={(v) => {
          setOpenModal(v);
          setListRequest({ ...listRequest, timestamp: Date.now() });
        }}
        editing={false}
        edit={false}
        refetchCon={() =>
          setListRequest({ ...listRequest, timestamp: Date.now() })
        }
      />

      <MyModal
        open={attachmentsModalOpen}
        setOpen={setAttachmentsModalOpen}
        title="Attachments - Telephonic Consultation"
        size="lg"
        hideActionBtn={true}
        content={
          <EncounterAttachment
            localEncounter={encounter}
            source="TELEPHONIC_CONSULTATION_ORDER_ATTACHMENT"
            sourceId={consultationOrder?.key ? Number(consultationOrder.key) : undefined}
            refetchAttachmentList={false}
            setRefetchAttachmentList={() => { }}
          />
        }
      />

      <CancellationModal
        title="Cancel Telephonic Consultation"
        fieldLabel="Cancellation Reason"
        open={openCancelModal}
        setOpen={setOpenCancelModal}
        object={consultationOrder}
        setObject={setConsultationOrder}
        handleCancle={handleCancel}
        fieldName="cancellationReason"
        required={true}
      />


    </div>
  );
};

export default TelephonicConsultation;
