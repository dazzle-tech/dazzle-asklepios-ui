import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Col, Form, Row } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquarePollHorizontal } from '@fortawesome/free-solid-svg-icons';
const AddEditOutput = ({
  open,
  setOpen,
  width,
}) => {

  // Fetch output Type Lov list response
  const { data: outputTypeLovQueryResponse } = useGetLovValuesByCodeQuery('FLUID_OUTPUT_TYPES');

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
                fieldName="outputType"
                fieldType="select"
                selectData={outputTypeLovQueryResponse?.object ?? []}
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
                width="100%"
                fieldName="volume"
                rightAddon="ml"
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

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Output"
      position="right"
      content={<div dir={dir}>{conjureFormContent()}</div>}
      actionButtonLabel='Create'
      actionButtonFunction=""
      steps={[{ title: 'Output', icon:<FontAwesomeIcon icon={faSquarePollHorizontal} />}]}
      size={width > 600 ? '36vw' : '25vw'}
    /></div>
  );
};
export default AddEditOutput;
