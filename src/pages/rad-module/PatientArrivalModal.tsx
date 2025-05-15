import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import { newApDiagnosticOrderTests } from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import { faHospitalUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { Col, Form, Row } from 'rsuite';
const PatientArrivalModal = ({ open, setOpen, saveTest, test, setTest, fetchTest }) => {
  const dispatch = useAppDispatch();
  return (
    <>
      {' '}
      <MyModal
        open={open}
        setOpen={setOpen}
        actionButtonFunction={async () => {
          const Response = await saveTest({
            ...test,
            patientArrivedAt: test.patientArrivedAt
              ? new Date(test.patientArrivedAt).getTime()
              : null,
            processingStatusLkey: '6816324725527414'
          }).unwrap();
          dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));

          setOpen(false);
          setTest({ ...newApDiagnosticOrderTests });
          await fetchTest();
          //orderFetch();
          setTest({ ...Response });
        }}
        title="Patient Arrived"
        steps={[{ title: 'Arrived', icon: <FontAwesomeIcon icon={faHospitalUser} /> }]}
        size="450px"
        bodyheight="60vh"
        content={
          <Col md={24}>
            <Row>
              <Col md={24}>
                <Form fluid>
                  <MyInput
                    width="100%"
                    fieldLabel="Patient Arrival Note"
                    fieldName={'patientArrivedNoteRad'}
                    fieldType="textarea"
                    record={test}
                    setRecord={setTest}
                  />
                </Form>
              </Col>
            </Row>
            <Row>
              <Col md={24}>
                <Form fluid>
                  <MyInput
                    width="100%"
                    fieldName="patientArrivedAt"
                    fieldType="datetime"
                    record={test}
                    setRecord={setTest}
                  />
                </Form>
              </Col>
            </Row>
          </Col>
        }
      ></MyModal>
    </>
  );
};
export default PatientArrivalModal;
