import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { Col, Form, Row, Text } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDroplet } from '@fortawesome/free-solid-svg-icons';
import './styles.less';
import SectionContainer from '@/components/SectionsoContainer';
import BloodCardQuestions from './BloodCardQuestions';
import OrderDetails from './OrderDetails';
import PatientInformation from './PatientInformation';
import NotesAndHistory from './NotesAndHistory';
import Translate from '@/components/Translate';
const AddEditBloodOrder = ({ open, setOpen, bloodorder, setBloodOrder }) => {
  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Row gutter={15} className="d container-of-blood-card-questions">
            <Form>
              <Col md={12}>
                <Row>
                  <SectionContainer
                    title={<Text><Translate>Patient Information</Translate></Text>}
                    content={
                      <PatientInformation bloodorder={bloodorder} setBloodOrder={setBloodOrder} />
                    }
                  />
                </Row>
                <Row>
                  <SectionContainer
                    title={<Text><Translate>Notes & History</Translate></Text>}
                    content={
                      <NotesAndHistory bloodorder={bloodorder} setBloodOrder={setBloodOrder} />
                    }
                  />
                </Row>
              </Col>
              <Col md={12}>
                <Row>
                  <SectionContainer
                    title={<Text><Translate>Order Details</Translate></Text>}
                    content={<OrderDetails bloodorder={bloodorder} setBloodOrder={setBloodOrder} />}
                  />
                </Row>
                <Row>
                  <SectionContainer
                    title={<Text><Translate>Blood Card Questions</Translate></Text>}
                    content={
                      <BloodCardQuestions bloodorder={bloodorder} setBloodOrder={setBloodOrder} />
                    }
                  />
                </Row>
              </Col>
            </Form>
          </Row>
        );
    }
  };

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={bloodorder?.key ? 'Edit Blood Order' : 'New Blood Order'}
      position="left"
      content={<div dir={dir}>{conjureFormContent()}</div>}
      actionButtonLabel={bloodorder?.key ? 'Save' : 'Create'}
      actionButtonFunction=""
      steps={[{ title: 'Blood Order Info', icon: <FontAwesomeIcon icon={faDroplet} /> }]}
      size="80vw"
    />
  );
};
export default AddEditBloodOrder;
