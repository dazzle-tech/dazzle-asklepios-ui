import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
const ChooseDashboardSections = ({ open, setOpen, displays, setDisplays, setColumns }) => {
  // Handle save when choose sections
  const handleSave = () => {
    setColumns(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(colKey => {
        updated[colKey] = updated[colKey].map(item => ({
          ...item,
          display: displays[item.id]
        }));
      });
      return updated;
    });
    setOpen(false);
  };
  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <div className="choose-sections-dashboard">
            <Form layout="vertical" fluid>
              <MyInput
                fieldType="check"
                fieldName="c1"
                fieldLabel="Body Diagram"
                record={displays}
                setRecord={setDisplays}
                showLabel={false}
              />
              <MyInput
                fieldType="check"
                fieldName="c2"
                fieldLabel="Previuos Visit"
                record={displays}
                showLabel={false}
                setRecord={setDisplays}
              />
              <MyInput
                fieldType="check"
                fieldName="c3"
                fieldLabel="Patient Major Problem"
                record={displays}
                setRecord={setDisplays}
                showLabel={false}
              />
              <MyInput
                fieldType="check"
                fieldName="c4"
                fieldLabel="Patient Chronic Medication"
                record={displays}
                setRecord={setDisplays}
                showLabel={false}
              />
              <MyInput
                fieldType="check"
                fieldName="c5"
                fieldLabel="Patient Observation"
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              />
              <MyInput
                fieldType="check"
                fieldName="c6"
                fieldLabel="Functional Assessment"
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              />
              <MyInput
                fieldType="check"
                fieldName="c7"
                fieldLabel="Active Allergies"
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              />
              <MyInput
                fieldType="check"
                fieldName="c8"
                fieldLabel="Medical Warnings"
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              />
              <MyInput
                fieldType="check"
                fieldName="c9"
                fieldLabel="Pain Assessment"
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              />

              <MyInput
                fieldType="check"
                fieldName="c10"
                fieldLabel="General Assessment"
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              />
              <MyInput
                fieldType="check"
                fieldName="c11"
                fieldLabel="Procedures"
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              />
              <MyInput
                fieldType="check"
                fieldName="c12"
                fieldLabel="Recent Test Results"
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              />
              <MyInput
                fieldType="check"
                fieldName="c13"
                fieldLabel="Last 24-h Medications"
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              />
              <MyInput
                fieldType="check"
                fieldName="c14"
                fieldLabel="Intake Outputs"
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              />
              <MyInput
                fieldType="check"
                fieldName="c15"
                fieldLabel="Chief Complain"
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              />
            </Form>
          </div>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Customize"
      position="right"
      content={conjureFormContent}
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      size="300px"
      steps={[{ title: 'Select Component', icon: <FontAwesomeIcon icon={faChartLine} /> }]}
    />
  );
};
export default ChooseDashboardSections;
