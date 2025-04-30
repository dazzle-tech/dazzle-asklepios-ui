import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { faLaptop } from '@fortawesome/free-solid-svg-icons';
import { useSaveMedicalSheetMutation } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { useDispatch } from 'react-redux';
import { notify } from '@/utils/uiReducerActions';
import { Col, Row, Panel } from 'rsuite';
import { faSheetPlastic } from '@fortawesome/free-solid-svg-icons';

const ChooseDepartment = ({
  open,
  setOpen,
  //   width,
  showScreen,
  setShowScreen,
  department
  //   refetch,
}) => {
  const dispatch = useDispatch();
  const [saveMedicalSheet] = useSaveMedicalSheetMutation();

  const handleSave = () => {
    try {
      saveMedicalSheet({ ...showScreen, departmentKey: department.key }).unwrap();
      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
      setOpen(false);
    } catch (error) {
      dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
    }
  };
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'center',
                alignContent: 'center',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  width: 300,
                  height: 300,
                  backgroundColor: 'var(--background-gray)',
                  borderRadius: '10px',
                  overflow: 'auto',
                  padding: '10px'
                }}
              >
                <h6>Default Sheets</h6>
                <Form>
                  <MyInput
                    fieldType="check"
                    fieldName={''}
                    fieldLabel={'Select All'}
                    showLabel={false}
                    record={''}
                    setRecord={() => ''}
                  />
                </Form>
                <div style={{ marginLeft: '20px' }}>
                  <Form>
                    <MyInput
                      fieldType="check"
                      fieldName={'patientDashboard'}
                      showLabel={false}
                      record={showScreen}
                      setRecord={setShowScreen}
                    />
                  </Form>
                  <Form>
                    <MyInput
                      fieldType="check"
                      fieldName={'clinicalVisit'}
                      showLabel={false}
                      record={showScreen}
                      setRecord={setShowScreen}
                    />
                  </Form>
                  <Form>
                    <MyInput
                      fieldType="check"
                      fieldName={'observation'}
                      showLabel={false}
                      record={showScreen}
                      setRecord={setShowScreen}
                    />
                  </Form>
                  <Form>
                    <MyInput
                      fieldType="check"
                      fieldName={'diagnosticsOrder'}
                      showLabel={false}
                      record={showScreen}
                      setRecord={setShowScreen}
                    />
                  </Form>
                  <Form>
                    <MyInput
                      fieldType="check"
                      fieldName={'prescription'}
                      showLabel={false}
                      record={showScreen}
                      setRecord={setShowScreen}
                    />
                  </Form>
                  <Form>
                    <MyInput
                      fieldType="check"
                      fieldName={'drugOrder'}
                      showLabel={false}
                      record={showScreen}
                      setRecord={setShowScreen}
                    />
                  </Form>
                  <Form>
                    <MyInput
                      fieldType="check"
                      fieldName={'consultation'}
                      showLabel={false}
                      record={showScreen}
                      setRecord={setShowScreen}
                    />
                  </Form>
                  <Form>
                    <MyInput
                      fieldType="check"
                      fieldName={'procedures'}
                      showLabel={false}
                      record={showScreen}
                      setRecord={setShowScreen}
                    />
                  </Form>
                  <Form>
                    <MyInput
                      fieldType="check"
                      fieldName={'patientHistory'}
                      showLabel={false}
                      record={showScreen}
                      setRecord={setShowScreen}
                    />
                  </Form>
                  <Form>
                    <MyInput
                      fieldType="check"
                      fieldName={'allergies'}
                      showLabel={false}
                      record={showScreen}
                      setRecord={setShowScreen}
                    />
                  </Form>
                  <Form>
                    <MyInput
                      fieldType="check"
                      fieldName={'medicalWarnings'}
                      showLabel={false}
                      record={showScreen}
                      setRecord={setShowScreen}
                    />
                  </Form>
                  <Form>
                    <MyInput
                      fieldType="check"
                      fieldName={'medicationsRecord'}
                      showLabel={false}
                      record={showScreen}
                      setRecord={setShowScreen}
                    />
                  </Form>
                  <Form>
                    <MyInput
                      fieldType="check"
                      fieldName={'vaccineReccord'}
                      showLabel={false}
                      record={showScreen}
                      setRecord={setShowScreen}
                    />
                  </Form>
                  <Form>
                    <MyInput
                      fieldType="check"
                      fieldName={'diagnosticsResult'}
                      showLabel={false}
                      record={showScreen}
                      setRecord={setShowScreen}
                    />
                  </Form>
                </div>
              </div>
              <div
                style={{
                  width: 300,
                  height: 300,
                  backgroundColor: 'var(--background-gray)',
                  borderRadius: '10px',
                  overflow: 'auto',
                  padding: '10px'
                }}
              >
                <h6>Specialty Sheets</h6>
                <Form>
                  <MyInput
                    fieldType="check"
                    fieldName={''}
                    fieldLabel={'Select All'}
                    showLabel={false}
                    record={''}
                    setRecord={() => ''}
                  />
                </Form>
                <div style={{ marginLeft: '20px' }}>
                  <Form>
                    <MyInput
                      fieldType="check"
                      fieldName={'psychologicalExam'}
                      showLabel={false}
                      record={showScreen}
                      setRecord={setShowScreen}
                    />
                  </Form>
                  <Form>
                    <MyInput
                      fieldType="check"
                      fieldName={'audiometryPuretone'}
                      showLabel={false}
                      record={showScreen}
                      setRecord={setShowScreen}
                    />
                  </Form>
                  <Form>
                    <MyInput
                      fieldType="check"
                      fieldName={'optometricExam'}
                      showLabel={false}
                      record={showScreen}
                      setRecord={setShowScreen}
                    />
                  </Form>
                  <Form>
                    <MyInput
                      fieldType="check"
                      fieldName={'dentalCare'}
                      showLabel={false}
                      record={showScreen}
                      setRecord={setShowScreen}
                    />
                  </Form>
                  <Form>
                    <MyInput
                      fieldType="check"
                      fieldName={'cardiology'}
                      showLabel={false}
                      record={showScreen}
                      setRecord={setShowScreen}
                    />
                  </Form>
                  <Form>
                    <MyInput
                      fieldType="check"
                      fieldName={'vaccination'}
                      showLabel={false}
                      record={showScreen}
                      setRecord={setShowScreen}
                    />
                  </Form>
                </div>
              </div>
            </div>
          </Form>
        );
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={'Medical Sheets'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={department?.key ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      size="600px"
      steps={[{ title: 'Medical Sheets', icon: faSheetPlastic }]}
    />
  );
};
export default ChooseDepartment;
