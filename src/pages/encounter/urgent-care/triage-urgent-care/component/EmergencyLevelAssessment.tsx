import React, { useEffect, useState } from "react";
import "../../styles.less";
import { Form } from "rsuite";
import MyInput from "@/components/MyInput";
import MyButton from "@/components/MyButton/MyButton";
import SectionContainer from "@/components/SectionsoContainer";
import { useEnumOptions } from "@/services/enumsApi";
import Translate from "@/components/Translate";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";

type EmergencyLevelAssessmentProps = {
  triage: any;
  setTriage: (next: any) => void;
  onSave: () => void;
  readOnly?: boolean;
};

const EmergencyLevelAssessment = ({
  triage,
  setTriage,
  onSave,
  readOnly = false,
}: EmergencyLevelAssessmentProps) => {
  const dispatch = useAppDispatch();
  const [showServices, setShowServices] = useState(false);

  const yesNoQuestionEnumOptions = useEnumOptions("YesNoQuestion");
  const avpuScaleEnumOptions = useEnumOptions("AVPUScale");
  const painLevelEnumOptions = useEnumOptions("PainLevel");

  const isYes = (v: any) =>
    String(v ?? "").toUpperCase() === "YES";

  const isNo = (v: any) => {
    const value = String(v ?? "").toUpperCase();
    return value === "NO" || value === "NOT_YET_DETERMINED";
  };

  const isBlank = (v: any) => v == null || String(v).trim() === "";
  const handleSave = () => {
    if (readOnly) return;
    if (isBlank(triage?.lifeSaving)) {
      dispatch(
        notify({
          msg: "Please fill required field: Life-saving Interventions Required?",
          sev: "error",
        })
      );
      return;
    }
    onSave();
  };

  useEffect(() => {
    const criticalPainKeys = ["LEVEL_7", "LEVEL_8", "LEVEL_9", "LEVEL_10"];

    const computeEmergencyLevel = (): string | null => {
      // If life-saving is YES, this is immediately RESUSCITATION (no need to wait for other answers)
      if (isYes(triage?.lifeSaving)) return "RESUSCITATION";

      // Only if life-saving is explicitly NO and unresponsive is YES => RESUSCITATION
      if (isNo(triage?.lifeSaving) && isYes(triage?.unresponsive)) return "RESUSCITATION";

      // For non-critical paths, wait until prerequisites are answered before deriving a level
      const prerequisitesAnswered =
        !isBlank(triage?.lifeSaving) &&
        !isBlank(triage?.unresponsive) &&
        !isBlank(triage?.highRisk) &&
        !isBlank(triage?.avpuScale) &&
        !isBlank(triage?.painScore);

      if (!prerequisitesAnswered) return null;

      if (
        isYes(triage?.highRisk) ||
        String(triage?.avpuScale) === "UNRESPONSIVE" ||
        (triage?.painScore && criticalPainKeys.includes(String(triage.painScore)))
      ) {
        return "EMERGENT";
      }

      const services = [
        triage?.labsRequired,
        triage?.imagingRequired,
        triage?.ivFluidsRequired,
        triage?.medicationRequired,
        triage?.ecgRequired,
        triage?.consultationRequired,
      ];
      const count = services.filter(v => isYes(v)).length;

      if (count >= 2) return "URGENT";
      if (count === 1) return "LESS_URGENT";
      return "NON_URGENT";
    };

    const prerequisitesAnswered =
      !isBlank(triage?.lifeSaving) &&
      !isBlank(triage?.unresponsive) &&
      !isBlank(triage?.highRisk) &&
      !isBlank(triage?.avpuScale) &&
      !isBlank(triage?.painScore);

    const critical = isYes(triage?.lifeSaving) || isYes(triage?.unresponsive);
    const serious =
      isYes(triage?.highRisk) ||
      String(triage?.avpuScale) === "UNRESPONSIVE" ||
      (triage?.painScore && criticalPainKeys.includes(String(triage.painScore)));

    setShowServices(Boolean(prerequisitesAnswered && !critical && !serious));


    const nextLevel = computeEmergencyLevel();
    if (!readOnly && nextLevel && String(triage?.emergencyLevel ?? "") !== String(nextLevel)) {
      setTriage((prev: any) => ({ ...prev, emergencyLevel: nextLevel }));
    }
  }, [
    triage?.lifeSaving,
    triage?.unresponsive,
    triage?.highRisk,
    triage?.avpuScale,
    triage?.painScore,
    triage?.labsRequired,
    triage?.imagingRequired,
    triage?.ivFluidsRequired,
    triage?.medicationRequired,
    triage?.ecgRequired,
    triage?.consultationRequired,
    triage?.emergencyLevel,
    setTriage,
    readOnly,
  ]);

  return (
    <SectionContainer
      title="Emergency Level Assessment"
      content={
        <Form fluid layout="inline" className="form-inline-wrap">
          <MyInput
            column
            width={200}
            fieldLabel="Life-saving Interventions Required?"
            fieldType="select"
            fieldName="lifeSaving"
            selectData={yesNoQuestionEnumOptions}
            selectDataLabel="label"
            selectDataValue="value"
            record={triage}
            setRecord={setTriage}
            searchable={false}
            required
            disabled={readOnly}
          />

          {isNo(triage?.lifeSaving) && (
            <MyInput
              column
              width={200}
              fieldLabel="Is the patient unresponsive or acutely mentally altered?"
              fieldType="select"
              fieldName="unresponsive"
              selectData={yesNoQuestionEnumOptions}
              selectDataLabel="label"
              selectDataValue="value"
              record={triage}
              setRecord={setTriage}
              searchable={false}
              disabled={readOnly}
            />
          )}

          {isNo(triage?.lifeSaving) && isNo(triage?.unresponsive) && (
            <>
              <MyInput
                column
                width={200}
                fieldLabel="High-risk situation?"
                fieldType="select"
                fieldName="highRisk"
                selectData={yesNoQuestionEnumOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={triage}
                setRecord={setTriage}
                searchable={false}
                disabled={readOnly}
              />

              <MyInput
                column
                width={200}
                fieldLabel="CTAS Scale"
                fieldType="select"
                fieldName="avpuScale"
                selectData={avpuScaleEnumOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={triage}
                setRecord={setTriage}
                searchable={false}
                disabled={readOnly}
              />

              <MyInput
                column
                width={200}
                fieldLabel="Pain Score"
                fieldType="select"
                fieldName="painScore"
                selectData={painLevelEnumOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={triage}
                setRecord={setTriage}
                searchable={false}
                disabled={readOnly}
              />
            </>
          )}

          {isNo(triage?.lifeSaving) && isNo(triage?.unresponsive) && showServices && (
            <>
              <MyInput
                column
                width={200}
                fieldLabel="Labs Required"
                fieldType="select"
                fieldName="labsRequired"
                selectData={yesNoQuestionEnumOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={triage}
                setRecord={setTriage}
                searchable={false}
                disabled={readOnly}
              />
              <MyInput
                column
                width={200}
                fieldLabel="Imaging Required"
                fieldType="select"
                fieldName="imagingRequired"
                selectData={yesNoQuestionEnumOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={triage}
                setRecord={setTriage}
                searchable={false}
                disabled={readOnly}
              />
              <MyInput
                column
                width={200}
                fieldLabel="IV Fluids Required"
                fieldType="select"
                fieldName="ivFluidsRequired"
                selectData={yesNoQuestionEnumOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={triage}
                setRecord={setTriage}
                searchable={false}
                disabled={readOnly}
              />
              <MyInput
                column
                width={200}
                fieldLabel="Medication Required"
                fieldType="select"
                fieldName="medicationRequired"
                selectData={yesNoQuestionEnumOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={triage}
                setRecord={setTriage}
                searchable={false}
                disabled={readOnly}
              />
              <MyInput
                column
                width={200}
                fieldLabel="ECG Required"
                fieldType="select"
                fieldName="ecgRequired"
                selectData={yesNoQuestionEnumOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={triage}
                setRecord={setTriage}
                searchable={false}
                disabled={readOnly}
              />
              <MyInput
                column
                width={200}
                fieldLabel="Consultation Required"
                fieldType="select"
                fieldName="consultationRequired"
                selectData={yesNoQuestionEnumOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={triage}
                setRecord={setTriage}
                searchable={false}
                disabled={readOnly}
              />
            </>
          )}

          {!readOnly && (
            <MyButton onClick={handleSave} appearance="primary">
              <Translate> Save </Translate>
            </MyButton>
          )}
        </Form>
      }
    />
  );
};

export default EmergencyLevelAssessment;


