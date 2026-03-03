import React from "react";
import SectionContainer from "@/components/SectionsoContainer";
import MyInput from "@/components/MyInput";
import MyTagInput from "@/components/MyTagInput/MyTagInput";
import MultiSelectAppender from "@/pages/medical-component/multi-select-appender/MultiSelectAppender";
import { Form, Text } from "rsuite";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";

const PrescriptionPreview = ({ orderMedication }) => {
  const record = orderMedication ?? {};
  const noop = () => {};

  
  // FETCH ALL LOV HERE (same as DetailsModal)
  const { data: DurationTypeLovQueryResponse } = useGetLovValuesByCodeQuery("MED_DURATION");
  const { data: indicationLovQueryResponse } = useGetLovValuesByCodeQuery("MED_INDICATION_USE");
  const { data: refillunitQueryResponse } = useGetLovValuesByCodeQuery("REFILL_INTERVAL");
  const { data: administrationInstructionsLovQueryResponse } =
    useGetLovValuesByCodeQuery("PRESC_INSTRUCTIONS");

  const getLov = (lovRes, key) => {
    const item = lovRes?.object?.find((x) => x.key === key);
    return item?.lovDisplayVale ?? "";
  };

  return (
<div className="prescription-preview-container">

  <SectionContainer
    title={<Text className="font-style">Prescription Details</Text>}
    content={
      <Form fluid>

        <div className="prescription-medication-form-row">

          <div className="prescription-full-block">
            <div className="prescription-inputs-inline">

              <MyInput disabled width={120} fieldType="number"
                fieldLabel="Duration" fieldName="duration"
                record={record} setRecord={noop}
              />

              <MyInput disabled width={142} fieldType="text"
                fieldLabel="Duration Type"
                record={{
                  durationTypeText: getLov(DurationTypeLovQueryResponse, record.durationTypeLkey)
                }}
                fieldName="durationTypeText" setRecord={noop}
              />

              <MyInput disabled width={120} fieldType="checkbox"
                fieldLabel="Chronic Medication"
                fieldName="chronicMedication"
                record={record} setRecord={noop}
              />

            </div>
          </div>

          {/* BLOCK 2 */}
          <div className="prescription-full-block">
            <div className="prescription-inputs-inline">

              <MyInput disabled width={120} fieldType="number"
                fieldLabel="Maximum Dose" fieldName="maximumDose"
                record={record} setRecord={noop}
              />

              <MyInput disabled width={140} fieldType="date"
                fieldLabel="Valid Until" fieldName="validUtil"
                record={record} setRecord={noop}
              />

              <MyInput disabled width={160} fieldType="checkbox"
                fieldLabel="Brand Substitute Allowed"
                fieldName="genericSubstitute"
                record={record} setRecord={noop}
              />

            </div>
          </div>

        </div>
      </Form>
    }
  />

  <SectionContainer
    title={<Text className="font-style">Indication Details</Text>}
    content={
      <Form fluid>
        <div className="prescription-indication-blocks">

          {/* BLOCK 1 */}
          <div className="prescription-full-block">
            <div className="prescription-inputs-inline">

              <MyInput disabled fieldType="textarea" height={60}
                fieldLabel="ICD-10" fieldName="indicationIcd"
                record={record} setRecord={noop}
              />

              <MyInput disabled fieldType="textarea" height={60}
                fieldLabel="SNOMED-CT"
                record={{ snomedText: record.snomed || "" }}
                fieldName="snomedText" setRecord={noop}
              />

              <MyInput disabled width="100%" fieldType="text"
                fieldLabel="Indication Use"
                record={{
                  indicationUseText: getLov(
                    indicationLovQueryResponse,
                    record.indicationUseLkey
                  )
                }}
                fieldName="indicationUseText" setRecord={noop}
              />

            </div>
          </div>

          {/* Administration */}
          <div className="prescription-full-block">
            <MultiSelectAppender
              disabled
              label="Administration Instructions"
              options={administrationInstructionsLovQueryResponse?.object ?? []}
              optionLabel="lovDisplayVale"
              optionValue="key"
              object={record.administrationInstructions}
              setObject={() => {}}
            />
          </div>

        </div>
      </Form>
    }
  />

  {/* ---------------- Refills ---------------- */}
  <SectionContainer
    title={<Text className="font-style">Refills and Parameters to Monitor</Text>}
    content={
      <Form fluid>

        <MyTagInput disabled tags={record.parametersToMonitor?.split(",") ?? []} />

        <div className="prescription-refills-blocks">

          <MyInput disabled width={140} fieldType="number"
            fieldLabel="Number of Refills"
            fieldName="numberOfRefills" record={record} setRecord={noop}
          />

          <MyInput disabled width={180} fieldType="number"
            fieldLabel="Refill Interval Value"
            fieldName="refillIntervalValue"
             record={record}
              setRecord={noop}
          />

          <MyInput disabled width={180} fieldType="text"
            fieldLabel="Refill Interval Unit"
            record={{
              refillIntervalUnitText: getLov(
                refillunitQueryResponse,
                record.refillIntervalUnitLkey
              )
            }}
            fieldName="refillIntervalUnitText" setRecord={noop}
          />

        </div>

      </Form>
    }
  />

  {/* ---------------- Notes ---------------- */}
  <SectionContainer
    title={<Text className="font-style">Notes</Text>}
    content={
      <Form fluid>

        <div className="prescription-full-block">
          <div className="prescription-inputs-inline">

            <MyInput disabled width="100%" fieldType="textarea" height={60}
              fieldLabel="Manual Indication"
              record={{ manualIndication: record.indicationManually || "" }}
              fieldName="manualIndication" setRecord={noop}
            />

            <MyInput disabled width="100%" fieldType="textarea" height={60}
              fieldLabel="Notes"
              record={{ notesPreview: record.notes || "" }}
              fieldName="notesPreview" setRecord={noop}
            />

          </div>
        </div>

      </Form>
    }
  />

</div>

  );
};

export default PrescriptionPreview;
