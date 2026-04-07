import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import {
  useAddUserDashboardComponentsMutation,
  useDeleteUserDashboardComponentsMutation
} from '@/services/encounterService';
import Translate from '@/components/Translate';
const ChooseDashboardSections = ({
  open,
  setOpen,
  displays,
  setDisplays,
  setColumns,
  arrOfComponentKeys,
  userId
}) => {
  const [saveComponent] = useAddUserDashboardComponentsMutation();
  const [deleteComponent] = useDeleteUserDashboardComponentsMutation();
  const [selectedAll, setSelectedAll] = useState({all: false});
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

    Object.entries(displays).forEach(([key, value]) => {
      if (!arrOfComponentKeys.includes(key) && value) {
        saveComponent({ user_id: userId, component_key: key })
          .unwrap()
          .then(() => {})
          .catch(() => {});
      }
      if (arrOfComponentKeys.includes(key) && !value) {
        deleteComponent({ user_id: userId, component_key: key })
          .unwrap()
          .then(() => {})
          .catch(() => {});
      }
    });
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
                fieldName="all"
                fieldLabel={<Translate>Select All</Translate>}
                record={selectedAll}
                setRecord={setSelectedAll}
                showLabel={false}
              />
              <MyInput
                fieldType="check"
                fieldName="c1"
                fieldLabel={<Translate>Body Diagram</Translate>}
                record={displays}
                setRecord={setDisplays}
                showLabel={false}
              />
              <MyInput
                fieldType="check"
                fieldName="c2"
                fieldLabel={<Translate>Previous Visit</Translate>}
                record={displays}
                showLabel={false}
                setRecord={setDisplays}
              />
              <MyInput
                fieldType="check"
                fieldName="c3"
                fieldLabel={<Translate>Chronic Diseases</Translate>}
                record={displays}
                setRecord={setDisplays}
                showLabel={false}
              />
              <MyInput
                fieldType="check"
                fieldName="c4"
                fieldLabel={<Translate>Patient Chronic Medication</Translate>}
                record={displays}
                setRecord={setDisplays}
                showLabel={false}
              />
              <MyInput
                fieldType="check"
                fieldName="c5"
                fieldLabel={<Translate>Patient Observation</Translate>}
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              />
              {/* <MyInput
                fieldType="check"
                fieldName="c6"
                fieldLabel={<Translate>Functional Assessment</Translate>}
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              /> */}
              <MyInput
                fieldType="check"
                fieldName="c7"
                fieldLabel={<Translate>Active Allergies</Translate>}
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              />
              <MyInput
                fieldType="check"
                fieldName="c8"
                fieldLabel={<Translate>Medical Warnings</Translate>}
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              />
              {/* <MyInput
                fieldType="check"
                fieldName="c9"
                fieldLabel={<Translate>Pain Assessment</Translate>}
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              /> */}

              {/* <MyInput
                fieldType="check"
                fieldName="c10"
                fieldLabel={<Translate>General Assessment</Translate>}
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              /> */}
              <MyInput
                fieldType="check"
                fieldName="c11"
                fieldLabel={<Translate>Procedures</Translate>}
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              />
              <MyInput
                fieldType="check"
                fieldName="c12"
                fieldLabel={<Translate>Recent Test Results</Translate>}
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              />
              {/* <MyInput
                fieldType="check"
                fieldName="c13"
                fieldLabel={<Translate>Last 24-h Medications</Translate>}
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              />
              <MyInput
                fieldType="check"
                fieldName="c14"
                fieldLabel={<Translate>Intake Outputs</Translate>}
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              />
              <MyInput
                fieldType="check"
                fieldName="c15"
                fieldLabel={<Translate>Chief Complain</Translate>}
                showLabel={false}
                record={displays}
                setRecord={setDisplays}
              /> */}
            </Form>
          </div>
        );
    }
  };
  useEffect(() => {
    if(selectedAll['all'])
     setDisplays({...displays, c1: true, c2: true, c3: true, c4: true, c5: true, c7: true, c8: true, c11: true, c12: true});
    else
     setDisplays({...displays, c1: false, c2: false, c3: false, c4: false, c5: false, c7: false, c8: false, c11: false, c12: false});

  },[selectedAll]);
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
