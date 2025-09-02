import React, { useState } from 'react';
import { Form, RadioGroup, Radio } from 'rsuite';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';

const AdministrationDetails = ({ fluidOrder, setFluidOrder }) => {
  const [formRecord, setFormRecord] = useState({ anyReaction: false, reaction: '' });
  const [showTagField, setShowTagField] = useState(false);
  return (
    <SectionContainer
      title={<p className="font-small">Administration Details</p>}
      content={
        <div className="main-content-section-1 margin-3">
          <Form fluid className="administration-details form-flex-wrap">
            <MyInput
              width="100%"
              fieldName="preparationTime"
              fieldType="datetime"
              record={fluidOrder}
              setRecord={setFluidOrder}
            />
            <MyInput
              width="100%"
              fieldName="actualStartTime"
              fieldType="datetime"
              record={fluidOrder}
              setRecord={setFluidOrder}
            />
            <Form.Group>
              <Form.ControlLabel>Fluid Appearance</Form.ControlLabel>
              <RadioGroup
                inline
                name="fluidAppearance"
                value={fluidOrder.fluidAppearance}
                onChange={val => setFluidOrder({ ...fluidOrder, fluidAppearance: val })}
              >
                <Radio value="Clear">Clear</Radio>
                <Radio value="Cloudy">Cloudy</Radio>
                <Radio value="Leaking">Leaking</Radio>
              </RadioGroup>
            </Form.Group>
            <div className="full-width flexing">
              <MyInput
                fieldType="checkbox"
                fieldName="rateConfirmed"
                fieldLabel="Rate Confirmed"
                width={100}
                record={fluidOrder}
                setRecord={setFluidOrder}
              />
              <Form fluid>
                <div className="flexing">
                  {/* Checkbox */}
                  <MyInput
                    fieldType="checkbox"
                    fieldName="anyReaction"
                    fieldLabel="Any Reaction"
                    width={100}
                    record={formRecord}
                    setRecord={val => {
                      setFormRecord(val);
                      setShowTagField(val.anyReaction === true);
                    }}
                  />

                  {/* Tag field */}
                  {showTagField && (
                    <div className="margin-but">
                      <MyInput
                        fieldType="text"
                        fieldName="reaction"
                        fieldLabel="Reactions"
                        placeholder="Enter tag"
                        record={formRecord}
                        setRecord={setFormRecord}
                        width={200}
                      />
                    </div>
                  )}
                </div>
              </Form>
            </div>
            <div className="full-width">
              <MyInput
                fieldType="textarea"
                fieldName="monitoringNotes"
                placeholder="Monitoring Notes"
                record={fluidOrder}
                setRecord={setFluidOrder}
                height={35}
              />
            </div>
          </Form>
        </div>
      }
    />
  );
};

export default AdministrationDetails;
