import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import {
  usePatientArrivedRadiologyMutation
} from '@/services/diagnosic-order/diagnosticOrderTestService';
import { notify } from '@/utils/uiReducerActions';
import { faHospitalUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { Col, Form, Row } from 'rsuite';
//add new patient edits
const PatientArrivalModal = ({
  open,
  setOpen,
  test,
  setTest,
  fetchTest,
  fetchAllTests
}) => {
  const dispatch = useAppDispatch();
  const [width, setWidth] = useState('30vw');
  const [patientArrived, { isLoading }] =
    usePatientArrivedRadiologyMutation();

  useEffect(() => {
    if (open && !test?.patientArrivedDate) {
      setTest(prev => ({
        ...prev,
        patientArrivedDate: new Date()
      }));
    }
  }, [open]);
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setWidth(w <= 600 ? '90vw' : '30vw');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      // loading={isLoading}
      title="Patient Arrived"
      size={width}
      bodyheight="60vh"
      steps={[
        { title: 'Arrived', icon: <FontAwesomeIcon icon={faHospitalUser} /> }
      ]}
      actionButtonFunction={async () => {
        if (!test?.id) {
          dispatch(notify({ msg: 'Select a test first', sev: 'warning' }));
          return;
        }

        if (!test?.patientArrivedDate) {
          dispatch(
            notify({
              msg: 'Arrival date & time is required',
              sev: 'warning'
            })
          );
          return;
        }

        try {
          console.log("inpatienrt arrival test", test)
          const response = await patientArrived({
            id: test.id,
            body: {
              patientArrivedDate: new Date(
                test.patientArrivedDate
              ).toISOString(),
              patientArrivedNoteRad: test.patientArrivedNoteRad
            }
          }).unwrap();
          dispatch(
            notify({ msg: 'Patient arrived saved', sev: 'success' })
          );

          setTest(prev => ({
            ...prev,
            ...response
          }));

          setOpen(false);
        } catch (e: any) {
          dispatch(
            notify({
              msg:
                e?.data?.message ||
                e?.data?.detail ||
                'Patient arrival failed',
              sev: 'error'
            })
          );
          return;
        }
        try {
          await fetchTest();
          await fetchAllTests();
        } catch (e) {
          console.warn('Refetch after patientArrived failed', e);
        }
      }}
      content={
        <Form fluid>
          <Col md={24}>
            <Row>
              <Col md={24}>
                <MyInput
                  width="100%"
                  fieldLabel="Patient Arrival Note"
                  fieldName="patientArrivedNoteRad"
                  fieldType="textarea"
                  record={test}
                  setRecord={setTest}
                />
              </Col>
            </Row>

            <Row>
              <Col md={24}>
                <MyInput
                  required
                  width="100%"
                  fieldLabel="Arrival Date & Time"
                  fieldName="patientArrivedDate"
                  fieldType="datetime"
                  record={test}
                  setRecord={setTest}
                />
              </Col>
            </Row>
          </Col>
        </Form>
      }
    />
  );
};

export default PatientArrivalModal;
