import React, { useEffect, useState } from 'react';
import { Row, Form, Col, Text } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import { useLocation } from 'react-router-dom';
import SectionContainer from '@/components/SectionsoContainer';
import WoundIdentification from './WoundIdentification';
import WoundAssessment from './WoundAssessment';
import Interventions from './Interventions';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less';
const WoundCare = ({object, setObject}) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const propsData = location.state;
  
 
  return (
    <>
      <Row gutter={15} className="d">
        <Form fluid>
          <Col md={12}>
            <Row>
              <SectionContainer
                title={<Text>Wound Identification</Text>}
                content={<WoundIdentification object={object} setObject={setObject} />}
              />
            </Row>
            <Row>
              <SectionContainer
                title={<Text>Interventions</Text>}
                content={<Interventions object={object} setObject={setObject} />}
              />
            </Row>
          </Col>
          <Col md={12}>
            <Row>
              <SectionContainer
                title={<Text>Wound Assessment</Text>}
                content={<WoundAssessment object={object} setObject={setObject} />}
              />
            </Row>
          </Col>
        </Form>
      </Row>
      {!object?.key && (
      <div className="container-of-add-new-button" onClick={() => setObject({})}>
        <MyButton
         color="var(--deep-blue)" width="109px">
          Complete
        </MyButton>
      </div>
      )}
    </>
  );
};

export default WoundCare;
