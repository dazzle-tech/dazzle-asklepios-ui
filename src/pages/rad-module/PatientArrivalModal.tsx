import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import { newApDiagnosticOrderTests } from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import { faHospitalUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { Col, Form, Row } from 'rsuite';
const PatientArrivalModal = ({ open, setOpen, saveTest, test, setTest, fetchTest,fetchAllTests }) => {
  const dispatch = useAppDispatch();
      const [width, setWidth] = useState("30vw");
   
      
useEffect(() => {
  const handleResize = () => {
    const w = window.innerWidth;
 
      if (w <= 600) {
      setWidth("40vw");
   
    }
      if (w <= 600) {
      setWidth("45vw");
    
    }
    
  };

  handleResize(); 
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
  return (
    <>
     
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
          await fetchAllTests();
          //orderFetch();
          setTest({ ...Response });
        }}
        title="Patient Arrived"
        steps={[{ title: 'Arrived', icon: <FontAwesomeIcon icon={faHospitalUser} /> }]}
        size={width}
        bodyheight="60vh"
        content={
           <Form fluid>
          <Col md={24}>
            <Row>
              <Col md={24}>
               
                  <MyInput
                    width="100%"
                    fieldLabel="Patient Arrival Note"
                    fieldName={'patientArrivedNoteRad'}
                    fieldType="textarea"
                    record={test}
                    setRecord={setTest}
                  />
                
              </Col>
            </Row>
            <Row>
              <Col md={24}>
              
                  <MyInput
                    width="100%"
                    fieldName="patientArrivedAt"
                    fieldType="datetime"
                    record={test}
                    setRecord={setTest}
                  />
               
              </Col>
            </Row>
          </Col>
          </Form>
        }
      ></MyModal>
    </>
  );
};
export default PatientArrivalModal;
