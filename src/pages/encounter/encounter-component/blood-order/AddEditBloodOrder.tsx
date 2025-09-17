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
                    title={<Text>Patient Information</Text>}
                    content={
                      <PatientInformation bloodorder={bloodorder} setBloodOrder={setBloodOrder} />
                    }
                  />
                </Row>
                <Row>
                  <SectionContainer
                    title={<Text>Notes & History</Text>}
                    content={
                      <NotesAndHistory bloodorder={bloodorder} setBloodOrder={setBloodOrder} />
                    }
                  />
                </Row>
              </Col>
              <Col md={12}>
                <Row>
                  <SectionContainer
                    title={<Text>Order Details</Text>}
                    content={<OrderDetails bloodorder={bloodorder} setBloodOrder={setBloodOrder} />}
                  />
                </Row>
                <Row>
                  <SectionContainer
                    title={<Text>Blood Card Questions</Text>}
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
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={bloodorder?.key ? 'Edit Blood Order' : 'New Blood Order'}
      position="left"
      content={conjureFormContent}
      actionButtonLabel={bloodorder?.key ? 'Save' : 'Create'}
      actionButtonFunction=""
      steps={[{ title: 'Blood Order Info', icon: <FontAwesomeIcon icon={faDroplet} /> }]}
      size="80vw"
    />
  );
};
export default AddEditBloodOrder;
