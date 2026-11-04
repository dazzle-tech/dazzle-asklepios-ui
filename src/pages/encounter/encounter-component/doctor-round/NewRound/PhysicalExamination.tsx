import React from 'react';
import { Row } from 'rsuite';
import ReviewOfSystems from '@/pages/encounter/medical-notes-and-assessments/review-of-systems';

const PhysicalExamination = ({ patient, encounter, edit }) => {

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (<div dir={dir}>
    <Row gutter={18}>
      <ReviewOfSystems noTitle patient={patient} encounter={encounter} edit={edit} />
    </Row></div>
  );
};
export default PhysicalExamination;
