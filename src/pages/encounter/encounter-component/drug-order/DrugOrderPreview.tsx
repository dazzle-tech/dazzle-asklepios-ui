import React from 'react';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import { formatDateWithoutSeconds } from '@/utils';
import { Text } from 'rsuite';
import { Form } from 'rsuite';
import './styles.less';

interface DrugOrderPreviewProps {
  orderMedication: any;
  fluidOrder: any;
  genericMedicationListResponse?: any;
  orderTypeLovQueryResponse?: any;
  unitLovQueryResponse?: any;
  unitsLovQueryResponse?: any;
  DurationTypeLovQueryResponse?: any;
  filteredList?: any[];
  indicationLovQueryResponse?: any;
  administrationInstructionsLovQueryResponse?: any;
  routeLovQueryResponse?: any;
  frequencyLovQueryResponse?: any;
  infusionDeviceLovQueryResponse?: any;
}

const noop = () => {};

const DrugOrderPreview: React.FC<DrugOrderPreviewProps> = ({
  orderMedication,
  fluidOrder,
  orderTypeLovQueryResponse = { object: [] },
  unitLovQueryResponse = { object: [] },
  unitsLovQueryResponse = { object: [] },
  DurationTypeLovQueryResponse = { object: [] },
  filteredList = [],
  indicationLovQueryResponse = { object: [] },
  genericMedicationListResponse = { object: [] },
  administrationInstructionsLovQueryResponse = { object: [] },
  routeLovQueryResponse = { object: [] },
  frequencyLovQueryResponse = { object: [] },
  infusionDeviceLovQueryResponse = { object: [] }
}) => {
  if (!orderMedication) return null;

  const medicationName =
    genericMedicationListResponse?.object?.find(
      item => item.key === orderMedication.genericMedicationsKey
    )?.genericName || '-';

  return (
    <>
      {/* Medication Preview */}
      <SectionContainer
        title={<h5>Medication Preview</h5>}
        content={<Form fluid>
<div className="medication-form-flex">
            <MyInput
              width={220}
              disabled
              fieldLabel="Medication Name"
              fieldType="text"
              fieldName="genericMedicationsKey"
              record={{ genericMedicationsKey: medicationName }}
              setRecord={noop}
            />
            <MyInput
              width={120}
              disabled
              fieldLabel="Dose"
              fieldType="text"
              fieldName="dose"
              record={orderMedication}
              setRecord={noop}
            />
            <MyInput
              width={150}
              disabled
              fieldLabel="Frequency"
              fieldType="text"
              fieldName="frequency"
              record={orderMedication}
              setRecord={noop}
            />
            <MyInput
              width={180}
              disabled
              fieldLabel="Route"
              fieldType="text"
              fieldName="roaLkey"
              record={{
                roaLkey: orderMedication?.roaLvalue?.lovDisplayVale || '-'
              }}
              setRecord={noop}
            />
            <MyInput
              fieldType="datetime"
              disabled
              width={220}
              fieldName="startDateTime"
              fieldLabel="Start Time"
              record={{
                startDateTime:
                  formatDateWithoutSeconds(orderMedication.startDateTime) || '-'
              }}
              setRecord={noop}
            />
            <MyInput
              fieldType="datetime"
              disabled
              width={220}
              fieldName="endDateTime"
              fieldLabel="End Time"
              record={{
                endDateTime:
                  formatDateWithoutSeconds(orderMedication.endDateTime) || '-'
              }}
              setRecord={noop}
            />
          </div></Form>
        }
      />

      {/* Medication Details */}
      <SectionContainer
        title={<Text className="font-style">Medication Details</Text>}
        content={<Form fluid>
<div className="medication-form-flex">
  <MyInput
    width={100}
    fieldType="select"
    fieldLabel="Medication Order Type"
    fieldName="drugOrderTypeLkey"
    record={orderMedication}
    setRecord={noop}
    selectData={orderTypeLovQueryResponse?.object ?? []}
    selectDataLabel="lovDisplayVale"
    selectDataValue="key"
    disabled
  />
  <MyInput
    width={100}
    fieldType="select"
    fieldLabel="ROA"
    fieldName="roaLkey"
    record={orderMedication}
    setRecord={noop}
    selectData={filteredList ?? []}
    selectDataLabel="lovDisplayVale"
    selectDataValue="key"
    disabled
  />
  <MyInput
    width={95}
    fieldType="number"
    fieldLabel="Dose"
    fieldName="dose"
    record={orderMedication}
    setRecord={noop}
    disabled
  />
  <MyInput
    width={95}
    fieldType="select"
    fieldLabel="Unit"
    fieldName="doseUnitLkey"
    record={orderMedication}
    setRecord={noop}
    selectData={unitLovQueryResponse?.object ?? []}
    selectDataLabel="lovDisplayVale"
    selectDataValue="key"
    disabled
  />
  <MyInput
    width={95}
    fieldType="number"
    fieldLabel="Frequency"
    fieldName="frequency"
    record={orderMedication}
    setRecord={noop}
    disabled
  />
  <MyInput
    width={95}
    fieldType="select"
    fieldLabel="Frequency Unit"
    fieldName="frequencyUnitLkey"
    record={orderMedication}
    setRecord={noop}
    selectData={unitsLovQueryResponse?.object ?? []}
    selectDataLabel="lovDisplayVale"
    selectDataValue="key"
    disabled
  />
  <MyInput
    width={100}
    fieldType="number"
    fieldLabel="Duration"
    fieldName="duration"
    record={orderMedication}
    setRecord={noop}
    disabled
  />
  <MyInput
    width={100}
    fieldType="select"
    fieldLabel="Duration type"
    fieldName="durationTypeLkey"
    record={orderMedication}
    setRecord={noop}
    selectData={DurationTypeLovQueryResponse?.object ?? []}
    selectDataLabel="lovDisplayVale"
    selectDataValue="key"
    disabled
  />
  <MyInput
    width={100}
    fieldType="checkbox"
    fieldLabel="Chronic"
    fieldName="chronicMedication"
    record={orderMedication}
    setRecord={noop}
    disabled
  />
  <MyInput
    width={266}
    fieldType="textarea"
    fieldLabel="Instructions"
    fieldName="instructions"
    record={fluidOrder}
    setRecord={noop}
    disabled
    height={35}
  />
</div>

        </Form>}
      />

      {/* Start/End & Home/Substitute */}
      <SectionContainer
        title={<Text className="font-style">Schedule</Text>}
        content={<Form fluid>
<div className="medication-form-flex">
  <MyInput
    fieldType="datetime"
    fieldLabel="Start Time"
    fieldName="startDateTime"
    record={orderMedication}
    setRecord={noop}
    width={220}
    disabled
  />
  <MyInput
    fieldType="datetime"
    fieldLabel="End Time"
    fieldName="endDateTime"
    record={orderMedication}
    setRecord={noop}
    width={220}
    disabled
  />
  <MyInput
    width={120}
    fieldLabel="Home Med"
    fieldType="checkbox"
    fieldName="homeMed"
    record={orderMedication}
    setRecord={noop}
    disabled
  />
  <MyInput
    width={120}
    fieldLabel="Substitute Allowed"
    fieldType="checkbox"
    fieldName="substituteAllowed"
    record={orderMedication}
    setRecord={noop}
    disabled
  />
</div>

        </Form>}
      />

      {/* Indications */}
      <SectionContainer
        title={<Text className="font-style">Indication</Text>}
        content={<Form fluid>
<div className="medication-form-flex">
  <MyInput
    width="100%"
    fieldType="select"
    fieldLabel="Indication Use"
    fieldName="indicationUseLkey"
    record={orderMedication}
    setRecord={noop}
    selectData={indicationLovQueryResponse?.object ?? []}
    selectDataLabel="lovDisplayVale"
    selectDataValue="key"
    disabled
  />
  <MyInput
    width="100%"
    fieldType="select"
    fieldLabel="Administration Instructions"
    fieldName="inst"
    record={fluidOrder}
    setRecord={noop}
    selectData={administrationInstructionsLovQueryResponse?.object ?? []}
    selectDataLabel="lovDisplayVale"
    selectDataValue="key"
    disabled
  />
  <MyInput
    width="100%"
    fieldType="textarea"
    fieldLabel="Indication Description"
    fieldName="indicationDescription"
    record={orderMedication}
    setRecord={noop}
    disabled
    height={60}
  />
</div>

       </Form>}
      />

      {/* Notes */}
      <SectionContainer
        title={<Text className="font-style">Notes</Text>}
        content={<Form fluid>

<div className="medication-form-flex">
  <MyInput
    width="100%"
    fieldType="textarea"
    fieldLabel="Notes"
    fieldName="notes"
    record={orderMedication}
    setRecord={noop}
    disabled
    height={60}
  />
  <MyInput
    width="100%"
    fieldType="textarea"
    fieldLabel="Extra Documentation"
    fieldName="extraDocumentation"
    record={orderMedication}
    setRecord={noop}
    disabled
    height={60}
  />
</div>

        </Form>}
      />

      {/* Diluent */}
      <SectionContainer
        title={<Text className="font-style">Diluent</Text>}
        content={<Form fluid>
<div className="medication-form-flex">
  <MyInput
    width={100}
    fieldLabel="Diluent"
    fieldType="checkbox"
    fieldName="diluent"
    record={orderMedication}
    setRecord={noop}
    disabled
  />
  <MyInput
    width="100%"
    fieldType="select"
    fieldLabel="Fluid Type"
    fieldName="fluidType"
    record={fluidOrder}
    setRecord={noop}
    selectData={[]}
    disabled
  />
  <MyInput
    width="100%"
    fieldType="number"
    fieldLabel="Volume"
    fieldName="volume"
    record={fluidOrder}
    setRecord={noop}
    disabled
  />
  <MyInput
    width="100%"
    fieldType="select"
    fieldLabel="Infusion Device"
    fieldName="infusionDevice"
    record={fluidOrder}
    setRecord={noop}
    selectData={infusionDeviceLovQueryResponse?.object ?? []}
    disabled
  />
  <MyInput
    width="100%"
    fieldType="number"
    fieldLabel="Infusion Rate"
    fieldName="infusionRate"
    record={fluidOrder}
    setRecord={noop}
    disabled
  />
</div>

        </Form>}
      />
    </>
  );
};

export default DrugOrderPreview;
