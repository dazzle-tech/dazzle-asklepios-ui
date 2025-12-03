import React, { useState } from "react";
import Diagnosis from "../../../medical-component/diagnosis/DiagnosisAndFindings";
import MyInput from "@/components/MyInput";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import AdvancedModal from "@/components/AdvancedModal";
import MyButton from "@/components/MyButton/MyButton";
import { Form } from "rsuite";

import {
  useSaveTelephonicConsultationOrderMutation,
} from "@/services/encounterService";

import { newApTelephonicConsultation } from "@/types/model-types-constructor";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBroom, faPaperclip } from "@fortawesome/free-solid-svg-icons";

import clsx from "clsx";
import { AttachmentUploadModal } from "@/components/AttachmentModals";
import { useGetAllPractitionersQuery } from "@/services/setup/practitioner/PractitionerService";

const DetailsTele = ({
  patient,
  encounter,
  consultationOrders,
  setConsultationOrder,
  open,
  setOpen,
  refetchCon,
  editing,
  edit, // when the whole module is locked from parent
}) => {
  const dispatch = useAppDispatch();

  const [saveTeleConsultation] =
    useSaveTelephonicConsultationOrderMutation();

  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  // ===========================================================
  // PRACTITIONERS -> ONLY PHYSICIANS
  // ===========================================================
  const { data: practitionerListResponse } = useGetAllPractitionersQuery({
    page: 0,
    size: 9999,
    sort: "id,asc",
  });

  const physicians =
    practitionerListResponse?.data?.filter(
      (p) => p.jobRole === "PHYSICIAN"
    ) ?? [];

  const physicianList =
    physicians?.map((p) => ({
      key: p.id,
      value: p.id,
      label: `${p.firstName} ${p.lastName}`,
    })) ?? [];

  // ===========================================================
  // CLEAR FORM
  // ===========================================================

const handleClear = () => {
  setConsultationOrder({
    ...newApTelephonicConsultation,
    patientKey: patient?.key,
    encounterKey: encounter?.key,
    createdBy: "Admin",
    isValid: true,
  });
};




  // ===========================================================
  // SAVE
  // ===========================================================
  const handleSave = async () => {
    try {
const payload = {
  ...consultationOrders,

  patientKey:
    patient?.key ||
    patient?.id ||
    consultationOrders.patientKey,

  encounterKey:
    encounter?.key ||
    encounter?.id ||
    consultationOrders.encounterKey,

  createdBy: consultationOrders.createdBy || "Admin",
  isValid: true,

  physician: Number(consultationOrders.physician) || null,

  dateOfCall: consultationOrders.dateOfCall
    ? new Date(consultationOrders.dateOfCall).getTime()
    : null,

  consultationContent: consultationOrders.consultationContent ?? "",
  approvalNumber: consultationOrders.approvalNumber ?? "",
  notes: consultationOrders.notes ?? "",
  extraDocumentation: consultationOrders.extraDocumentation ?? "",
};


      console.log("FINAL TELEPHONIC PAYLOAD => ", payload);

      await saveTeleConsultation(payload).unwrap();

      dispatch(notify({ msg: "Saved Successfully", sev: "success" }));

      await refetchCon();
      handleClear();
      setOpen(false);
    } catch (error) {
      console.error("SAVE ERROR => ", error);
      dispatch(notify("Save Failed"));
    }
  };


  // ===========================================================
  // ATTACHMENTS
  // ===========================================================
  const handleOpenAttachmentModal = () => {
    if (!consultationOrders?.key) return;
    setShowAttachmentModal(true);
  };

  return (
    <>
      <AdvancedModal
        open={open}
        setOpen={setOpen}
        size="50vw"
        leftWidth="40%"
        rightWidth="60%"
        actionButtonFunction={handleSave}
        isDisabledActionBtn={edit}
        footerButtons={
          <MyButton
            disabled={edit}
            prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
            // onClick={handleClear}
          >
            Clear
          </MyButton>
        }
        rightTitle="Telephonic Consultation"
        rightContent={
          <Form
            fluid
            className={clsx("", {
              "disabled-panel": edit,
            })}
          >
            <div className="main-details-consultion-page-container">

              {/* ============================= */}
              {/*     TOP ROW FIELDS            */}
              {/* ============================= */}
              <div className="consultion-details-modal-handle-position">

                <MyInput
                  width="12vw"
                  fieldLabel="Physician"
                  fieldName="physician"
                  fieldType="select"
                  selectData={physicianList}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={consultationOrders}
                  setRecord={setConsultationOrder}
                  disabled={editing}
                />

                <MyInput
                  width="12vw"
                  fieldName="dateOfCall"
                  fieldLabel="Date Of Call"
                  fieldType="datetime"
                  record={consultationOrders}
                  setRecord={setConsultationOrder}
                  disabled={editing}
                />

                <MyInput
                  width="24vw"
                  fieldName="consultationContent"
                  fieldLabel="Consultation Content"
                  fieldType="textarea"
                  rows={6}
                  record={consultationOrders}
                  setRecord={setConsultationOrder}
                  disabled={editing}
                />

                <MyInput
                  width="12vw"
                  fieldName="approvalNumber"
                  fieldType="text"
                  fieldLabel="Approval Number"
                  record={consultationOrders}
                  setRecord={setConsultationOrder}
                  disabled={editing}
                />

                <div className="attachment-button-consultation-position">
                  <MyButton
                    className="my-button-for-attachment-modal"
                    onClick={handleOpenAttachmentModal}
                    disabled={!consultationOrders?.key}
                  >
                    <FontAwesomeIcon icon={faPaperclip} />
                    Attachments
                  </MyButton>
                </div>
              </div>

              {/* ============================= */}
              {/*     TEXTAREA COLUMN          */}
              {/* ============================= */}
              <div className="text-area-positions-detail-consultion">
                <MyInput
                  width="12vw"
                  fieldName="notes"
                  rows={6}
                  fieldType="textarea"
                  record={consultationOrders}
                  setRecord={setConsultationOrder}
                  disabled={editing}
                />

                <MyInput
                  width="12vw"
                  fieldName="extraDocumentation"
                  fieldLabel="Extra Documentation"
                  rows={6}
                  fieldType="textarea"
                  record={consultationOrders}
                  setRecord={setConsultationOrder}
                  disabled={editing}
                />
              </div>

            </div>
          </Form>
        }
        leftContent={
          <Diagnosis patient={patient} encounter={encounter} />
        }
      ></AdvancedModal>

      {/* ========================= */}
      {/* ATTACHMENT MODAL */}
      {/* ========================= */}
      <AttachmentUploadModal
        isOpen={showAttachmentModal}
        setIsOpen={setShowAttachmentModal}
        encounterId={encounter?.id || encounter?.key}
        refetchData={() => {}}
        source="TELEPHONIC_CONSULTATION_ORDER_ATTACHMENT"
        sourceId={consultationOrders?.key ? Number(consultationOrders.key) : 0}
      />
    </>
  );
};

export default DetailsTele;
