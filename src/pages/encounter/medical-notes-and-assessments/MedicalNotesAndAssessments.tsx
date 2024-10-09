import React from 'react';
import { FlexboxGrid } from 'rsuite';
import ChiefComplaint from './chief-complaint';
import PhysicalExaminationsAndFindings from './physical-examinations';
import ReviewOfSystems from './review-of-systems';
import Assessments from './assessments';
import VitalSigns from './vital-signs';
import PatientAllergies from './patient-allergies';
import PatientMedications from './patient-medications';
import PatientRecentOrders from './recent-orders';
import PatientDiagnosis from './patient-diagnosis';
import PatientProblems from './patient-problems';
const MedicalNotesAndAssessments = () => {
  return (
    <FlexboxGrid justify="space-between">
      <FlexboxGrid.Item colspan={12}>
        <ChiefComplaint />
      </FlexboxGrid.Item>
      <FlexboxGrid.Item colspan={12}>
        <VitalSigns />
      </FlexboxGrid.Item>
      <FlexboxGrid.Item colspan={12}>
        <ReviewOfSystems />
      </FlexboxGrid.Item>
      <FlexboxGrid.Item colspan={12}>
        <PhysicalExaminationsAndFindings />
      </FlexboxGrid.Item>
      <FlexboxGrid.Item colspan={12}>
        <PatientAllergies />
      </FlexboxGrid.Item>
      <FlexboxGrid.Item colspan={12}>
        <PatientMedications />
      </FlexboxGrid.Item>
      <FlexboxGrid.Item colspan={12}>
        <PatientDiagnosis />
      </FlexboxGrid.Item>
      <FlexboxGrid.Item colspan={12}>
        <PatientProblems />
      </FlexboxGrid.Item>
      <FlexboxGrid.Item colspan={12}>
        <Assessments />
      </FlexboxGrid.Item>
      <FlexboxGrid.Item colspan={12}>
        <PatientRecentOrders />
      </FlexboxGrid.Item>
    </FlexboxGrid>
  );
};

export default MedicalNotesAndAssessments;
