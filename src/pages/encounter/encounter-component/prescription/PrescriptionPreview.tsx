import React from 'react';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { Form } from 'rsuite';
import {  useGetLovValuesByCodeQuery } from '@/services/setupService';

const PrescriptionPreview = ({
  orderMedication,
  indicationLovQueryResponse = { object: [] },
  refillunitQueryResponse = { object: [] },

}) => {
  const noop = () => {};
  const record = orderMedication || {};

  const getSelectText = (selectData = [], key) => {
    const item = selectData.find(obj => obj.key === key);
    return item ? item.lovDisplayVale : '';
  };

  const toStringValue = value => (value !== null && value !== undefined ? String(value) : '');

  const getIndicationUseText = (key) => {
    const item = indicationLovQueryResponse.object.find(obj => obj.key === key);
    return item ? item.lovDisplayVale : '';
  };
    const { data: DurationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_DURATION');
 console.log("orderMedication===>",orderMedication);
  return (
    <div>
      {/* Prescription Details */}
      <SectionContainer
        title="Prescription Details"
        content={
          <Form fluid>
            <div className="medication-form-flex">
              <MyInput
                disabled
                width={120}
                fieldType="number"
                fieldLabel="Duration"
                fieldName="duration"
                record={record}
                setRecord={noop}
              />
 <MyInput
                            disabled
                            width={142}
                            fieldType="select"
                            fieldLabel="Duration Type"
                            selectData={DurationTypeLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName={'durationTypeLkey'}
                            record={orderMedication}
                            searchable={false}
                          />
              <MyInput
                disabled
                width={120}
                fieldLabel="Chronic Medication"
                fieldType="checkbox"
                fieldName="chronicMedication"
                record={record}
                setRecord={noop}
              />
              <MyInput
                disabled
                width={120}
                fieldType="number"
                fieldLabel="Maximum Dose"
                fieldName="maximumDose"
                record={record}
                setRecord={noop}
              />
              <MyInput
                disabled
                width={140}
                fieldType="date"
                fieldLabel="Valid Until"
                fieldName="validUtil"
                record={record}
                setRecord={noop}
              />
              <MyInput
                disabled
                width={140}
                fieldLabel="Brand Substitute Allowed"
                fieldType="checkbox"
                fieldName="genericSubstitute"
                record={record}
                setRecord={noop}
              />
            </div>
          </Form>
        }
      />

      {/* Pharmacy Use Only */}
      <SectionContainer
        title="Pharmacy Use Only"
        content={
          <Form fluid>
            <div className="medication-form-flex">
              <MyInput
                disabled
                width={180}
                fieldType="datetime"
                fieldLabel="Start Time"
                fieldName="startDateTime"
                record={record}
                setRecord={noop}
              />
              <MyInput
                disabled
                width={180}
                fieldType="datetime"
                fieldLabel="End Time"
                fieldName="endDateTime"
                record={record}
                setRecord={noop}
              />
              <MyInput
                disabled
                width={120}
                fieldType="text"
                fieldLabel="Therapy Type"
                fieldName="therapyType"
                record={{
                  therapyType: toStringValue(record.therapyType),
                }}
                setRecord={noop}
              />
              <MyInput
                disabled
                width={120}
                fieldType="note"
                fieldLabel="Reason for Prescription"
                fieldName="reasonForPrescription"
                record={record}
                setRecord={noop}
              />
              <MyInput
                disabled
                width={120}
                fieldType="text"
                fieldLabel="Approval Number"
                fieldName="approvalNumber"
                record={record}
                setRecord={noop}
              />
            </div>
          </Form>
        }
      />

      {/* Indication Details */}
      <SectionContainer
        title="Indication Details"
        content={
          <Form fluid>
            <div className="medication-form-flex">
              <MyInput
                disabled
                fieldType="textarea"
                fieldLabel="ICD-10"
                fieldName="indicationIcd"
                record={record}
                setRecord={noop}
                height={60}
              />
              <MyInput
                disabled
                fieldType="textarea"
                fieldLabel="SNOMED-CT"
                fieldName="snomed"
                record={record}
                setRecord={noop}
                height={60}
              />
<MyInput
  disabled
  width="100%"
  fieldType="text"
  fieldLabel="Indication Use"
  fieldName="indicationUseLkey"
  record={{ indicationUseLkey: getIndicationUseText(record.indicationUseLkey) }}
  setRecord={noop}
/>

              <MyInput
                disabled
                width="100%"
                fieldType="textarea"
                fieldLabel="Manual Indication"
                fieldName="indicationManually"
                record={record}
                setRecord={noop}
                height={60}
              />
              <MyInput
                disabled
                width="100%"
                fieldType="textarea"
                fieldLabel="Notes"
                fieldName="notes"
                record={record}
                setRecord={noop}
                height={60}
              />
            </div>
          </Form>
        }
      />

      {/* Refills and Parameters to monitor */}
      <SectionContainer
        title="Refills and Parameters to monitor"
        content={
          <Form fluid>
            <div className="medication-form-flex">
              <MyInput
                disabled
                width="100%"
                fieldType="number"
                fieldLabel="Number of Refills"
                fieldName="numberOfRefills"
                record={record}
                setRecord={noop}
              />
<MyInput
  disabled
  width="100%"
  fieldType="text"
  fieldLabel="Refill Interval Unit"
  fieldName="refillIntervalUnitLkey"
  record={{ refillIntervalUnitLkey: getSelectText(refillunitQueryResponse.object, record.refillIntervalUnitLkey) }}
  setRecord={noop}
/>
                        <MyInput
                          disabled
                          width={180}
                          fieldType="select"
                          fieldLabel="Refill Interval Value"
                          selectData={refillunitQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          fieldName="refillIntervalLkey"
                          record={{ refillIntervalUnitLkey: getSelectText(refillunitQueryResponse.object, record.refillIntervalUnitLkey) }}
                          setRecord={noop}
                        />
            </div>
          </Form>
        }
      />
    </div>
  );
};

export default PrescriptionPreview;
