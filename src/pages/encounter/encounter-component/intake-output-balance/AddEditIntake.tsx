import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Col, Form, Row } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquarePollHorizontal } from '@fortawesome/free-solid-svg-icons';
const AddEditIntake = ({
  open,
  setOpen,
  width,
}) => {

  // Fetch intake Type Lov  response
  const { data: intakeTypeLovQueryResponse } = useGetLovValuesByCodeQuery('FLUID_INTAKE_TYPES');
  // Fetch route Lov response
  const { data: routeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <Row>
            <Col md={12}>
            <MyInput
                width="100%"
                fieldName="date"
                fieldType='date'
                record=""
                setRecord=""
              />
              </Col>
               <Col md={12}>
              <MyInput
                width="100%"
                fieldName="time"
                fieldType='time'
                record=""
                setRecord=""
              />
              </Col>
              </Row>
              <br/>
              <Row>
                 <Col md={12}>
              <MyInput
                fieldName="intakeType"
                fieldType="select"
                selectData={intakeTypeLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record=""
                setRecord=""
                width="100%"
              />
              </Col>
               <Col md={12}>
              <MyInput
                width="100%"
                fieldName="otherType"
                record=""
                setRecord=""
              />
              </Col>
              </Row>
              <br/>
              <Row>
                 <Col md={12}>
              <MyInput
                fieldName="route"
                fieldType="select"
                selectData={routeLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record=""
                setRecord=""
                width="100%"
              />
              </Col>
               <Col md={12}>
              <MyInput
                width="100%"
                fieldName="volume"
                rightAddon="ml"
                fieldType='number'
                record=""
                setRecord=""
              />
              </Col>
              </Row>
              <br/>
              <Row>
                 <Col md={12}>
              <MyInput
                width="100%"
                fieldName="rate"
                rightAddon="ml/hr"
                fieldType='number'
                record=""
                setRecord=""
              />
              </Col>
               <Col md={12}>
               <MyInput
                width="100%"
                fieldName=""
                fieldLabel="Created At\By"
                record=""
                setRecord=""
                readonly
              />
              </Col>
              </Row>
              <br/>
               <MyInput
                width="100%"
                fieldName="notes"
                fieldType='textarea'
                record=""
                setRecord=""
              />  
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={ 'Intake'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={'Create'}
      actionButtonFunction=""
      steps={[{ title: 'Intake', icon:<FontAwesomeIcon icon={faSquarePollHorizontal} />}]}
      size={width > 600 ? '36vw' : '25vw'}
    />
  );
};
export default AddEditIntake;
