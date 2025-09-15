import React from 'react';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import { Form, TagPicker } from 'rsuite';
import { TagInput } from 'rsuite';
import './styles.less';

const SafetyMonitoringSection = ({
  formData,
  setFormData,
  canEdit,
  isReadonly,
  holdCriteriaData,
  linkedParameterData,
  timeUnitsData
}) => {
  return (
    <div className=" margin-section">
      <SectionContainer
        title={<h6>Safety & Monitoring</h6>}
        content={
          <div className="safety-monitoring-grid">
            {/* Max Dose / 24h */}
            <Form className="input-card">
              <MyInput
                fieldName="maxDose24h"
                fieldType="number"
                record={formData}
                setRecord={canEdit ? setFormData : undefined}
                fieldLabel="Max Dose / 24h"
                width={200}
                disabled={isReadonly}
              />
            </Form>
            {/* Hold Criteria */}
            <Form className="input-card flex-col">
              <MyLabel label="Hold Criteria" />
              <TagInput
                value={formData.holdCriteria}
                onChange={values => setFormData({ ...formData, holdCriteria: values })}
                creatable
                cleanable={false}
                disabled={isReadonly}
              />
            </Form>
            {/* Linked Parameter */}
            <Form className="input-card flex-col">
              <MyLabel label="Linked Parameter" />
              <TagInput
                value={formData.linkedParameter}
                onChange={values => setFormData({ ...formData, linkedParameter: values })}
                className="width-100"
                disabled={isReadonly}
                creatable
              />
            </Form>
            {/* Monitoring Frequency + Unit */}
            <Form className="input-card monitoring-row">
              <MyInput
                fieldName="monitoringFrequency"
                fieldType="number"
                record={formData}
                setRecord={canEdit ? setFormData : undefined}
                fieldLabel="Frequency"
                width={120}
                placeholder="Number"
                disabled={isReadonly}
              />
              <div className="margin-top-24">
                <MyInput
                  fieldName="monitoringUnit"
                  fieldType="select"
                  record={formData}
                  setRecord={canEdit ? setFormData : undefined}
                  fieldLabel="Unit"
                  selectData={timeUnitsData}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  width={140}
                  showLabel={false}
                  disabled={isReadonly}
                  searchable={false}
                />
              </div>
            </Form>
            {/* Special Instructions */}
            <Form className="input-card">
              <MyInput
                fieldName="specialInstructions"
                fieldType="textarea"
                record={formData}
                setRecord={canEdit ? setFormData : undefined}
                fieldLabel="Special Instructions"
                width="250"
                height={100}
                disabled={isReadonly}
              />
            </Form>
          </div>
        }
      />
    </div>
  );
};

export default SafetyMonitoringSection;
