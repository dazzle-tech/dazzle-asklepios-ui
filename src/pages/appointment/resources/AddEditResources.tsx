import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { useGetResourceTypeQuery } from '@/services/appointmentService';
import { GrScheduleNew } from "react-icons/gr";
const AddEditResources = ({
  open,
  setOpen,
  width,
  resources,
  setResources,
  handleSave
}) => {

  const [isPractitioner, setISPractitioner] = useState(false);
  const [isDepartment, setISDepartment] = useState(false);
  const [isMedicalTest, setIsMedicalTest] = useState(false);
  const [isProcedure, setIsProcedure] = useState(false);
  const [isInpatient, setIsInpatient] = useState(false);
  // Fetch resourceType Lov list response
  const { data: resourceTypeLovQueryResponse } = useGetLovValuesByCodeQuery('BOOK_RESOURCE_TYPE');
  // Fetch resourceType list response
  const resourceTypeListResponse = useGetResourceTypeQuery(resources.resourceTypeLkey || '');

  // Effects
  useEffect(() => {
    resourceTypeListResponse.refetch();
    switch (resources.resourceTypeLkey) {
      case '2039534205961578':
        setISPractitioner(true);
        setISDepartment(false);
        setIsMedicalTest(false);
        setIsProcedure(false);
        setIsInpatient(false);
        break;
      case '2039516279378421':
        setISDepartment(true);
        setISPractitioner(false);
        setIsMedicalTest(false);
        setIsProcedure(false);
        setIsInpatient(false);
        break;
      case '2039620472612029':
        setISDepartment(false);
        setISPractitioner(false);
        setIsMedicalTest(true);
        setIsProcedure(false);
        setIsInpatient(false);
        break;
      case '2039548173192779':
        setISDepartment(false);
        setISPractitioner(false);
        setIsMedicalTest(false);
        setIsProcedure(true);
        setIsInpatient(false);
        break;
      case '4217389643435490':
        setISDepartment(false);
        setISPractitioner(false);
        setIsMedicalTest(false);
        setIsProcedure(false);
        setIsInpatient(true);
        break;
    }
  }, [resources.resourceTypeLkey]);

  useEffect(() => {
    resourceTypeListResponse.refetch();
  }, [resources]);

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              fieldName="resourceTypeLkey"
              fieldType="select"
              selectData={resourceTypeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={resources}
              setRecord={setResources}
              menuMaxHeight={200}
              width={520}
              searchable={false}
            />
            <MyInput
              fieldLabel="Resource"
              fieldName="resourceKey"
              fieldType="select"
              selectData={resourceTypeListResponse?.data?.object ?? []}
              selectDataLabel={isPractitioner ? "practitionerFullName" : isDepartment ? "name" : isMedicalTest ? "testName" : isProcedure ? "name" : isInpatient ? "name" : ""}
              selectDataValue="key"
              record={resources}
              setRecord={setResources}
              menuMaxHeight={200}
              width={520}
            />
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={resources?.key ? 'Edit Resources' : 'New Resources'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={resources?.key ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Resource Info', icon: <GrScheduleNew /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditResources;
