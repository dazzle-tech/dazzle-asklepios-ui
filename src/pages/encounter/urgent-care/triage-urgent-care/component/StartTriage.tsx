import BackButton from "@/components/BackButton/BackButton";
import MyButton from "@/components/MyButton/MyButton";
import Translate from "@/components/Translate";
import MyInput from "@/components/MyInput";
import SectionContainer from "@/components/SectionsoContainer";
import MyLabel from "@/components/MyLabel";
import MyBadgeStatus from "@/components/MyBadgeStatus/MyBadgeStatus";
import BedAssignmentModal from "@/pages/encounter/day-case/DayCaseList/BedAssignmentModal";

import React, { useEffect, useMemo, useState } from "react";
import { Divider, Form, Row, Tooltip, Whisper } from "rsuite";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBedPulse } from "@fortawesome/free-solid-svg-icons";
import { useAppSelector } from "@/hooks";

import EmergencyLevelAssessment from "./EmergencyLevelAssessment";

import VitalSigns from "@/pages/medical-component/vital-signs/VitalSigns";
import BodyMeasurements from "@/pages/encounter/encounter-pre-observations-new/observations/BodyMeasurements";
import Allergies from "@/pages/encounter/encounter-pre-observations-new/AllergiesNurse/Allergies";

import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import { setRefetchEncounter } from "@/reducers/refetchEncounterState";

import {
  useGetEncounterByIdQuery,
  useUpdateEncounterMutation,
} from "@/services/encounters/patientEncounterService";

import {
  useGetLatestEmergencyTriageByEncounterQuery,
  useUpdateCTASEmergencyTriageLevelMutation,
  useUpdateEmergencyTriageLevelAssessmentMutation,
} from "@/services/encounters/er-triage/emergencyTriageService";

import { useGetLatestPatientObservationsComplaintsByEncounterIdQuery } from "@/services/medicalsheetsEncounter/observations/patientObservationsComplaintsService";

import { useEnumOptions } from "@/services/enumsApi";

import type { PatientEncounter } from "@/types/model-types-new";
import GlasgowComaScale from "@/pages/encounter/encounter-component/glasgow-coma-scale";
import CTASEmergencyLevelAssessment from "./CTASEmergencyLevelAssessment";

type StartTriageProps = {
  patient: any;
  encounter: any;
  sourcePage: any;
  fromPage?: string;
  emergencyTriageNew?: any;
};

const StartTriage = ({
  patient,
  encounter,
  sourcePage,
  fromPage,
  emergencyTriageNew,
}: StartTriageProps) => {
  const navigate = useNavigate();
  const [updateLevelAssessment] =
    useUpdateEmergencyTriageLevelAssessmentMutation();
  const [updateCTASLevel] = useUpdateCTASEmergencyTriageLevelMutation();
  const [updateEncounter] = useUpdateEncounterMutation();
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector((state) => state.auth);
  const isReceptionist =
    String(authSlice.user?.jobRole ?? "").toUpperCase() === "RECEPTIONIST";

  const encounterId = encounter?.id ?? encounter?.encounterId ?? encounter?.key;

  const [triage, setTriage] = useState<any>({});
  const [localEncounter, setLocalEncounter] = useState<any>(encounter ?? {});
  const [openBedAssignmentModal, setOpenBedAssignmentModal] = useState(false);

  const { data: encounterFromServer, refetch: refetchEncounter } =
    useGetEncounterByIdQuery(
      { id: encounterId },
      {
        skip: !encounterId,
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
      }
    );

  const {
    data: latestTriageFromServer,
    refetch: refetchLatestTriage,
  } = useGetLatestEmergencyTriageByEncounterQuery(encounterId, {
    skip: !encounterId,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  const { data: nurseComplaints } = useGetLatestPatientObservationsComplaintsByEncounterIdQuery(
    { encounterId },
    { skip: !encounterId }
  );

  useEffect(() => {
    if (latestTriageFromServer) {
      setTriage(latestTriageFromServer);
      return;
    }

    if (emergencyTriageNew) {
      setTriage(emergencyTriageNew);
    }
  }, [latestTriageFromServer, emergencyTriageNew]);

  useEffect(() => {
    if (encounter) setLocalEncounter(encounter);
  }, [encounter]);

  useEffect(() => {
    if (encounterFromServer) {
      setLocalEncounter({
        ...encounterFromServer,
        chiefComplaint:
          encounterFromServer.chiefComplaint || nurseComplaints?.reasonOfVisit || "",
      });
    }
  }, [encounterFromServer, nurseComplaints]);

  const toEncounterPayload = (encounterData: any): PatientEncounter => ({
    id: Number(encounterData?.id),
    patientId: Number(encounterData?.patientId ?? encounterData?.patient?.id),
    encounterNumber: encounterData?.encounterNumber ?? null,
    facilityId: Number(encounterData?.facilityId),
    departmentId: Number(encounterData?.departmentId),
    practitionerId: encounterData?.practitionerId ?? null,
    paymentDate: encounterData?.paymentDate,
    amount: encounterData?.amount,
    encounterType: encounterData?.encounterType,
    encounterReason: encounterData?.encounterReason,
    followUpEncounterId:
      encounterData?.followUpEncounterId ?? encounterData?.followUpEncounter?.id ?? null,
    priorityLevel: encounterData?.priorityLevel,
    originType: encounterData?.originType ?? null,
    originName: encounterData?.originName ?? null,
    notes: encounterData?.notes ?? null,
    departmentDailySequenceNumber: encounterData?.departmentDailySequenceNumber ?? null,
    encounterDate: encounterData?.encounterDate ?? null,
    status: encounterData?.status,
    chiefComplaint: encounterData?.chiefComplaint ?? null,
    hasPrescription: Boolean(encounterData?.hasPrescription),
    hasOrder: Boolean(encounterData?.hasOrder),
    isObserved: Boolean(encounterData?.isObserved),
  });

  const saveChiefComplaint = async () => {
    try {
      const idToUpdate = localEncounter?.id ?? encounterId;

      if (!idToUpdate) {
        dispatch(notify({ msg: "No encounter id to update", sev: "error" }));
        return;
      }

      const payload = toEncounterPayload(localEncounter);

      if (!payload.patientId || !payload.facilityId || !payload.departmentId) {
        dispatch(
          notify({
            msg: "Missing required fields: patientId / facilityId / departmentId",
            sev: "error",
          })
        );
        return;
      }

      if (payload.encounterReason === "FOLLOW_UP" && !payload.followUpEncounterId) {
        dispatch(
          notify({
            msg: "Follow-up encounter is required when reason is FOLLOW_UP",
            sev: "error",
          })
        );
        return;
      }

      const updatedEncounter = await updateEncounter({
        id: idToUpdate,
        body: payload,
      }).unwrap();

      setLocalEncounter(updatedEncounter);
      dispatch(notify({ msg: "Saved Successfully", sev: "success" }));
    } catch (error) {
      console.error("Error saving chief complaint", error);
      dispatch(notify({ msg: "Save Failed", sev: "error" }));
    }
  };

  const emergencyLevelEnumOptions = useEnumOptions("EmergencyLevel");
  const encounterPriorityEnumOptions = useEnumOptions("EncounterPriority");

  const emergencyLevelColorMap = useMemo(() => {
    const byValue: Record<string, string> = {
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
    localEncounter?.priorityLevel ??
    localEncounter?.encounterPriority ??
    localEncounter?.encounterPriorityLkey ??
    encounter?.priorityLevel ??
    encounter?.encounterPriority ??
    encounter?.encounterPriorityLkey ??
    null;

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
    const triageId =
      triage?.id ??
      latestTriageFromServer?.id ??
      emergencyTriageNew?.id;

    if (!triageId) {
      dispatch(
        notify({
          msg: "Emergency triage record not found (missing id)",
          sev: "error",
        })
      );
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
      await refetchLatestTriage();

      dispatch(notify({ msg: "Emergency assessment saved", sev: "success" }));
    } catch (error) {
      console.error("Error saving emergency assessment", error);
      dispatch(notify({ msg: "Failed to save emergency assessment", sev: "error" }));
    }
  };

  const handleSaveCTASLevelNew = async () => {
    const triageId =
      triage?.id ??
      latestTriageFromServer?.id ??
      emergencyTriageNew?.id;

    if (!triageId) {
      dispatch(
        notify({
          msg: "Emergency triage record not found (missing id)",
          sev: "error",
        })
      );
      return;
    }

    try {
      const updated = await updateCTASLevel({
        id: Number(triageId),
        emergencyLevel: triage.emergencyLevel
      }).unwrap();

      setTriage((prev: any) => ({ ...prev, ...updated }));
      await refetchLatestTriage();

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
  const safeEncounterId = toNumberOrNaN(encounter?.id ?? encounter?.encounterId ?? encounter?.key);

  const encounterStatus = String(
    localEncounter?.status ??
    encounterFromServer?.status ??
    encounter?.status ??
    encounter?.encounterStatus ??
    ""
  ).toUpperCase();
  const isTriageStarted = encounterStatus === "TRIAGE_STARTED";
  const filledEmergencyLevel = triage?.emergencyLevel ?? null;
  const savedEmergencyLevel = latestTriageFromServer?.emergencyLevel ?? null;
  const hasEmergencyLevel = Boolean(savedEmergencyLevel || filledEmergencyLevel);
  const canAssignBed =
    !isReceptionist &&
    (Boolean(savedEmergencyLevel) || (isTriageStarted && Boolean(filledEmergencyLevel)));
  const isAssignBedDisabled = !canAssignBed;

  const selectedDepartment = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("selectedDepartment") || "null");
    } catch {
      return null;
    }
  }, []);

  const departmentId =
    localEncounter?.departmentId ??
    encounter?.departmentId ??
    selectedDepartment?.departmentId ??
    selectedDepartment?.id ??
    null;

  const assignBedTooltip = !isTriageStarted && !savedEmergencyLevel ? (
    <Tooltip>Assign Bed is only available when triage is started</Tooltip>
  ) : !hasEmergencyLevel ? (
    <Tooltip>Please set Emergency Level first</Tooltip>
  ) : (
    <Tooltip>Assign Bed</Tooltip>
  );

const handleGoBackToTriageList = () => {
  dispatch(setRefetchEncounter(true));

  if (fromPage === "PatientsLists") {
    navigate("/patients-list");
    return;
  }

  navigate("/urgent-care-triage");
};

  const handleBedAssignmentRefetch = async () => {
    await refetchEncounter();
    dispatch(setRefetchEncounter(true));
  };
  console.log("latestTriageFromServer:", latestTriageFromServer);
  console.log("emergencyTriageNew:", emergencyTriageNew);
  console.log("triage:", triage);

  return (
    <div>
      <div className="bt-field-div">
        {sourcePage === "UrgentCare" && (
          <>
            <BackButton onClick={handleGoBackToTriageList} />
            <Whisper trigger="hover" placement="top" speaker={assignBedTooltip}>
              <div>
                <MyButton
                  size="small"
                  backgroundColor="black"
                  disabled={isAssignBedDisabled}
                  onClick={() => setOpenBedAssignmentModal(true)}
                >
                  <FontAwesomeIcon icon={faBedPulse} />
                </MyButton>
              </div>
            </Whisper>
          </>
        )}

        <div className="bt-right">
          <Form fluid className="patient-priority-er-level-handle-position">
            <MyLabel label="Emergency Level" />
            {triage?.emergencyLevel && (
              <MyBadgeStatus
                color={emergencyLevelColorMap.get(String(triage?.emergencyLevel)) ?? "#98A2B4"}
                contant={selectedEmergencyLevel?.label ?? triage?.emergencyLevel}
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
        {/* Please don't remove this condition, as it will depend on the configuration later. */}
        {true == true ? (
          <CTASEmergencyLevelAssessment
            triage={triage}
            setTriage={setTriage}
            onSave={handleSaveCTASLevelNew}
          />
        ) :
          (<EmergencyLevelAssessment
            triage={triage}
            setTriage={setTriage}
            onSave={handleSaveLevelAssessmentNew}
          />)}
      </Row>

      <Row gutter={30}>
        {!Number.isNaN(patientId) && !Number.isNaN(safeEncounterId) && (
          <SectionContainer
            title={<Translate>Vital Signs</Translate>}
            content={
              <Form fluid>
                <VitalSigns
                  patientId={patientId}
                  encounterId={safeEncounterId}
                  isTriage
                  title="Vital Signs"
                />
              </Form>
            }
          />
        )}
      </Row>
      <Row gutter={30}>
        {!Number.isNaN(patientId) && !Number.isNaN(safeEncounterId) && (
          <SectionContainer
            title={<Translate>Body Measurements</Translate>}
            content={
              <Form fluid>
                <BodyMeasurements
                  patient={patient}
                  patientId={patientId}
                  encounterId={safeEncounterId}
                  encounter={encounter}
                  disabled={false}
                  width="100%"
                />
              </Form>
            }
          />
        )}
      </Row>
      <Row gutter={30}>
        {!Number.isNaN(patientId) && (
          <SectionContainer
            title={<Translate>Allergies</Translate>}
            content={<Allergies patient={patient} encounter={encounter} showTableActions={false} showTableButtons={false} />}
          />
        )}
      </Row>
      <Row gutter={30}>
        {!Number.isNaN(patientId) && !Number.isNaN(safeEncounterId) && (
          <SectionContainer
            title={<Translate>Glasgow Coma Scale Assessment</Translate>}
            content={
              <GlasgowComaScale
                patient={patient}
                encounter={encounter}
              />
            }
          />
        )}
      </Row>
      <Row gutter={30}>
        <SectionContainer
          title={<Translate>Chief Complaint</Translate>}
          content={
            <Form fluid>
              <MyInput
                required
                width="100%"
                height={95}
                showLabel={false}
                fieldType="textarea"
                fieldName="chiefComplaint"
                record={localEncounter}
                setRecord={setLocalEncounter}
              />
            </Form>
          }
          action={
            <MyButton
              size="small"
              onClick={saveChiefComplaint}
              disabled={!localEncounter?.chiefComplaint}
            >
              Save
            </MyButton>
          }
        />
      </Row>

      <BedAssignmentModal
        refetchEncounter={handleBedAssignmentRefetch}
        open={openBedAssignmentModal}
        setOpen={setOpenBedAssignmentModal}
        encounter={localEncounter}
        departmentId={departmentId != null ? String(departmentId) : undefined}
      />
    </div>
  );
};

export default StartTriage;