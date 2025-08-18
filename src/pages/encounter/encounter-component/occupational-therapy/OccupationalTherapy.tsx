import React, { useState, useEffect } from 'react';
import { Form, Slider, Divider } from 'rsuite';
import NursingReportAssesments from './components/NursingReportAssesments';
import OccupationalPlans from './components/OccupationalPlans';
import Referrals from './components/Referrals';
import './styles.less';

const OccupationalTherapy = () => {
  // State initialization

  const [width, setWidth] = useState(window.innerWidth); // window width

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="physiotherapy-container">
      {/* Referrals section */}
      <Referrals />
      <Divider />
      {/* Nursing Reports Summary section */}
      <NursingReportAssesments />
      <Divider />
      {/* Occupational Therapy Plans section */}
      <OccupationalPlans />
    </div>
  );
};

export default OccupationalTherapy;
