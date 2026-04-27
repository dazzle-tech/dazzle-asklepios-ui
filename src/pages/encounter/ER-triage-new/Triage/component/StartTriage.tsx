import BackButton from "@/components/BackButton/BackButton";
import MyButton from "@/components/MyButton/MyButton";
import Translate from "@/components/Translate";
import { faCheckDouble, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useMemo, useState } from "react";
import { Col, Divider, Form, Row } from "rsuite";
import GeneralAssessmentTriage from "./GeneralAssessmentTriage";
import ChiefComplainTriage from "./ChiefComplainTriage";
import EmergencyLevelAssessment from "./EmergencyLevelAssessment";
import EyeAssessmentHPI from "./EyeAssessmentHPI";
import {
  useCompleteEncounterMutation,
} from "@/services/encounters/patientEncounterService";
import {
  useUpdateEmergencyTriageLevelAssessmentMutation,
} from "@/services/encounters/er-triage/emergencyTriageService";
import { useEnumOptions } from "@/services/enumsApi";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/hooks";
import MyLabel from "@/components/MyLabel";
import MyBadgeStatus from "@/components/MyBadgeStatus/MyBadgeStatus";
import VitalSigns from "@/pages/medical-component/vital-signs/VitalSigns";
import { notify } from "@/utils/uiReducerActions";
import SendToModal from "./SendToModal";

type StartTriageProps = {
  patient: any;
  encounter: any;
  sourcePage: any;
  emergencyTriageNew?: any;
};

const StartTriage = ({ patient, encounter, sourcePage, emergencyTriageNew }: StartTriageProps) => {
  const navigate = useNavigate();
  const [completeEncounter, completeEncounterMutation] = useCompleteEncounterMutation();
  const [updateLevelAssessment] = useUpdateEmergencyTriageLevelAssessmentMutation();
  const dispatch = useAppDispatch();

  const [triage, setTriage] = useState<any>(emergencyTriageNew ?? {});
  const [openSendToModal, setOpenSendToModal] = useState(false);

  useEffect(() => {
    if (emergencyTriageNew) setTriage(emergencyTriageNew);
  }, [emergencyTriageNew]);

  const emergencyLevelEnumOptions = useEnumOptions("EmergencyLevel");
  const encounterPriorityEnumOptions = useEnumOptions("EncounterPriority");
  const emergencyLevelColorMap = useMemo(() => {
    const byValue: Record<string, string> = {
      // ER triage common levels
      RESUSCITATION: "#7f1d1d",
      EMERGENT: "#dc2626",
      URGENT: "#f97316",
      LESS_URGENT: "#eab308",
      NON_URGENT: "#16a34a",
    };

    const palette = ["#dc2626", "#f97316", "#eab308", "#16a34a", "#0ea5e9", "#7c3aed"];
    const m = new Map<string, string>();
    emergencyLevelEnumOptions.forEach((opt, idx) => {
      if (opt?.value == null) return;
      const key = String(opt.value);
      const mapped = byValue[String(opt.value).toUpperCase()];
      m.set(key, mapped ?? palette[idx % palette.length]);
    });
    return m;
  }, [emergencyLevelEnumOptions]);
  const selectedEmergencyLevel = emergencyLevelEnumOptions.find(
    (item: any) => item.value === triage?.emergencyLevel
  );

  const encounterPriorityValue =
    encounter?.priorityLevel ?? encounter?.encounterPriority ?? encounter?.encounterPriorityLkey ?? null;
  const selectedEncounterPriority = encounterPriorityEnumOptions.find(
    (item: any) => String(item?.value) === String(encounterPriorityValue ?? "")
  );
  const encounterPriorityLabel =
    selectedEncounterPriority?.label ??
    (encounterPriorityValue != null ? String(encounterPriorityValue) : "");
  const encounterPriorityIsUrgent = useMemo(() => {
    const v = String(
      selectedEncounterPriority?.label ??
        selectedEncounterPriority?.value ??
        encounterPriorityValue ??
        ""
    ).toUpperCase();
    return (
      v.includes("URGENT") ||
      v.includes("CRITICAL") ||
      v.includes("STAT") ||
      v.includes("EMERG")
    );
  }, [selectedEncounterPriority, encounterPriorityValue]);
  const encounterPriorityColor = encounterPriorityIsUrgent ? "#dc2626" : "#16a34a";

  const handleSaveLevelAssessmentNew = async () => {
    const triageId = emergencyTriageNew?.id;
    if (!triageId) {
      dispatch(notify({ msg: "Emergency triage record not found (missing id)", sev: "error" }));
      return;
    }

    try {
      const updated = await updateLevelAssessment({
        id: Number(triageId),
        lifeSaving: triage?.lifeSaving ?? null,
        unresponsive: triage?.unresponsive ?? null,
        highRisk: triage?.highRisk ?? null,
        avpuScale: triage?.avpuScale ?? null,
        painScore: triage?.painScore ?? null,
        labsRequired: triage?.labsRequired ?? null,
        imagingRequired: triage?.imagingRequired ?? null,
        ivFluidsRequired: triage?.ivFluidsRequired ?? null,
        medicationRequired: triage?.medicationRequired ?? null,
        ecgRequired: triage?.ecgRequired ?? null,
        consultationRequired: triage?.consultationRequired ?? null,
      }).unwrap();

      setTriage((prev: any) => ({ ...prev, ...updated }));

      dispatch(notify({ msg: "Emergency assessment saved", sev: "success" }));
    } catch (error) {
      console.error("Error saving emergency assessment", error);
      dispatch(notify({ msg: "Failed to save emergency assessment", sev: "error" }));
    }
  };

  const toNumberOrNaN = (v: any) => {
    const n = typeof v === "string" ? Number(v) : v;
    return typeof n === "number" && !Number.isNaN(n) ? n : Number.NaN;
  };
  const patientId = toNumberOrNaN(patient?.id ?? patient?.patientId ?? patient?.key);
  const encounterId = toNumberOrNaN(encounter?.id ?? encounter?.encounterId ?? encounter?.key);

  // (moved) emergency level assessment logic is now inside <EmergencyLevelAssessment />

  const handleCompleteEncounter = async () => {
    try {
      const id = encounter?.id ?? encounter?.key ?? null;
      if (!id) throw new Error("Missing encounter id");
      await completeEncounter({ id }).unwrap();
      dispatch(notify({ msg: "Completed Successfully", sev: "success" }));
      // After completing the visit, return to ER Triage list
      navigate("/ER-triage");
    } catch (error) {
      console.error("Encounter completion error:", error);
      dispatch(
        notify({
          msg: "An error occurred while completing the encounter",
          sev: "error",
        })
      );
    }
  };


  return (
    <div>
      <div className="bt-field-div">
        {sourcePage === "Emergency" && (
          <>
            <BackButton
              onClick={() => {
                navigate("/ER-triage");
              }}
            />
            <MyButton
              prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
              onClick={handleCompleteEncounter}
              appearance="ghost"
            >
              <Translate> Complete Visit </Translate>
            </MyButton>
            <MyButton
              prefixIcon={() => <FontAwesomeIcon icon={faPaperPlane} />}
              onClick={() => {
                setOpenSendToModal(true);
              }}
              disabled={!triage?.emergencyLevel}
            >
              <Translate> Send to </Translate>
            </MyButton>
          </>
        )}
        <div className="bt-right">
          <Form fluid className="patient-priority-er-level-handle-position">
            <MyLabel label="Emergency Level" />
            {triage?.emergencyLevel && (
              <MyBadgeStatus
                color={emergencyLevelColorMap.get(String(triage?.emergencyLevel)) ?? "#98A2B4"}
                contant={
                  selectedEmergencyLevel?.label ??
                  triage?.emergencyLevel
                }
              />
            )}

            <MyLabel label="Priority" />
            {encounterPriorityLabel && (
              <MyBadgeStatus
                color={encounterPriorityColor}
                contant={encounterPriorityLabel}
              />
            )}
          </Form>
        </div>
      </div>

      <Row gutter={30}>
        <Divider />
      </Row>

      <Row gutter={30}>
        <EmergencyLevelAssessment
          triage={triage}
          setTriage={setTriage}
          onSave={handleSaveLevelAssessmentNew}
        />
      </Row>

      <Row gutter={30}>
        {!Number.isNaN(patientId) && !Number.isNaN(encounterId) && (
          <VitalSigns
            patientId={patientId}
            encounterId={encounterId}
            isTriage
            title="Vital Signs"
          />
        )}
      </Row>

      <Row gutter={30}>
        <GeneralAssessmentTriage patient={patient} encounter={encounter} />
      </Row>

      <Row gutter={30}>
          <ChiefComplainTriage patient={patient} encounter={encounter} />
      </Row>
      <Row gutter={30}>
        <EyeAssessmentHPI
          triageId={triage?.id ?? emergencyTriageNew?.id}
          triage={triage}
          setTriage={setTriage}
          patient={patient}
          encounter={encounter}
        />
      </Row>


     
      <SendToModal
        open={openSendToModal}
        setOpen={setOpenSendToModal}
        encounter={encounter}
        triage={triage}
      />
    </div>
  );
};

export default StartTriage;
