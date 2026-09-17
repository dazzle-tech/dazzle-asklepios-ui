import React from 'react';
import '../style.less';
import { useLocation } from 'react-router-dom';
import FlaccComponent from '@/components/PatientFlaccComponent';

const Flacc = ({ ...props }) => {
  const location = useLocation();

  const patient = props.patient ?? location.state?.patient ?? {};
  const encounter = props.encounter ?? location.state?.encounter ?? {};

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <FlaccComponent patient={patient} encounter={encounter} />
    </div>
  );
};

export default Flacc;

