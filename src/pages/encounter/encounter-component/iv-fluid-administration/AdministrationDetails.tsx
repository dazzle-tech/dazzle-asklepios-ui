import React from 'react';
import { Form, RadioGroup, Radio } from 'rsuite';
import MyInput from '@/components/MyInput';
import Section from '@/components/Section';
import Toggle from './Toggle';

const AdministrationDetails = ({ fluidOrder, setFluidOrder }) => {
  return (
    <Section
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
              <Toggle />
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
