import React from 'react';
import { Row } from 'rsuite';
import ReviewOfSystems from '@/pages/encounter/medical-notes-and-assessments/review-of-systems';

const PhysicalExamination = ({ patient, encounter, edit }) => {
  return (
    <Row gutter={18}>
      <ReviewOfSystems noTitle patient={patient} encounter={encounter} edit={edit} />
    </Row>
  );
};
export default PhysicalExamination;
