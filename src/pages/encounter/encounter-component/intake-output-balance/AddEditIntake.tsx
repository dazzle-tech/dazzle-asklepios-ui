import React, { useState } from 'react';
import { Col, Form, Row } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquarePollHorizontal } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

const emptyIntakeForm = {
  date: null,
  time: null,
  intakeType: null,
  otherType: '',
  route: null,
  volume: null,
  rate: null,
  notes: ''
};

const AddEditIntake = ({ open, setOpen, width }) => {
  const [formData, setFormData] = useState<any>(emptyIntakeForm);

  const { data: intakeTypeLovQueryResponse } = useGetLovValuesByCodeQuery('FLUID_INTAKE_TYPES');
  const { data: routeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');

  const handleSave = () => {
    // TODO: wire up save mutation
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const content = (
    <Form fluid>
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldLabel="Date"
            fieldName="date"
            fieldType="date"
            record={formData}
            setRecord={setFormData}
          />
        </Col>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldLabel="Time"
            fieldName="time"
            fieldType="time"
            record={formData}
            setRecord={setFormData}
          />
        </Col>
      </Row>
      <br />
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldLabel="Intake Type"
            fieldName="intakeType"
            fieldType="select"
            selectData={intakeTypeLovQueryResponse?.object ?? []}
             selectDataLabel="lovDisplayVale"
 disableByField='isValid'

            selectDataValue="key"
            record={formData}
            setRecord={setFormData}
          />
        </Col>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldLabel="Other Type"
            fieldName="otherType"
            record={formData}
            setRecord={setFormData}
          />
        </Col>
      </Row>
      <br />
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldLabel="Route"
            fieldName="route"
            fieldType="select"
            selectData={routeLovQueryResponse?.object ?? []}
             selectDataLabel="lovDisplayVale"
 disableByField='isValid'

            selectDataValue="key"
            record={formData}
            setRecord={setFormData}
          />
        </Col>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldLabel="Volume"
            fieldName="volume"
            fieldType="number"
            rightAddon="ml"
            record={formData}
            setRecord={setFormData}
          />
        </Col>
      </Row>
      <br />
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldLabel="Rate"
            fieldName="rate"
            fieldType="number"
            rightAddon="ml/hr"
            record={formData}
            setRecord={setFormData}
          />
        </Col>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldLabel="Created At / By"
            fieldName="createdAtBy"
            record={formData}
            setRecord={setFormData}
            disabled
          />
        </Col>
      </Row>
      <br />
      <MyInput
        width="100%"
        fieldLabel="Notes"
        fieldName="notes"
        fieldType="textarea"
        record={formData}
        setRecord={setFormData}
      />
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={value => {
        if (!value) setFormData(emptyIntakeForm);
        setOpen(value);
      }}
      title="Intake"
      position="right"
      content={<div dir={dir}>{content}</div>}
      actionButtonLabel="Create"
      actionButtonFunction={handleSave}
      steps={[{ title: 'Intake', icon: <FontAwesomeIcon icon={faSquarePollHorizontal} /> }]}
      size={width > 600 ? '36vw' : '25vw'}
    />
  );
};

export default AddEditIntake;
