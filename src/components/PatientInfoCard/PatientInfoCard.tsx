import React from 'react';
import { Avatar, Button, Panel, Text } from 'rsuite';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6';
import MemberIcon from '@rsuite/icons/Member';
import './styles.less';

interface PatientInfoCard {
  patient: any;
}

const PatientInfoCard = ({ patient}: PatientInfoCard) => (

  <Panel bordered>
  {/* Header (MRN) */}
  <div className="mrn">
    <MemberIcon style={{ marginRight: 6 }} />
    MRN
  </div>

  {/* Patient Info Grid */}
  <div style={{ display: 'flex', gap: 20 }}>

    <div style={{ textAlign: 'center' }}>
      <Avatar
        circle
        src={
          patient?.attachmentProfilePicture?.fileContent
            ? `data:${patient?.attachmentProfilePicture?.contentType};base64,${patient?.attachmentProfilePicture?.fileContent}`
            : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
        }
        size="md"
      />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr  1fr 1fr', rowGap: 20, columnGap: 25 }}>
    <div>
    <div className="div-data">Patient Name</div>
    <div className="patient-info">{(patient?.firstName || '') + "  "+ (patient?.lastName || '')}</div>
     </div>
      <div>
        <div className="div-data"> Sex & Age</div>
        <div className="patient-info">  { (patient?.genderLvalue?.lovDisplayValue || '') + (patient?.dob ? calculateAgeFormat(patient.dob) + '' : '')}</div>
      </div>
      <div>
        <div className="div-data">Date of Register</div>
        <div className="patient-info">{(patient?.strength || '') + (patient?.unitLvalue?.lovDisplayVale || '')}</div>
      </div>
      <div>
        <div className="div-data">Document Type</div>
        <div className="patient-info">{ (patient?.documentTypeLvalue?.lovDisplayVale || '')}</div>
      </div>
      <div>
        <div className="div-data">Document Country</div>
        <div className="patient-info">{ patient?.documentCountryLvalue?.lovDisplayVale || " "}</div>
      </div>
      <div>
        <div className="div-data">Document Number</div>
        <div className="patient-info"> {(patient?.documentNo || '')}</div>
      </div>
    </div>
  </div>
</Panel>
 
);

export default PatientInfoCard;
export const calculateAgeFormat = dateOfBirth => {
  const today = new Date();
  const dob = new Date(dateOfBirth);

  if (isNaN(dob.getTime())) {
      return '';
  }

  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();

  let days = today.getDate() - dob.getDate();
  if (months < 0 || (months === 0 && days < 0)) {
      years--;
      months += 12;
  }
  if (days < 0) {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 0);
      days += lastMonth.getDate();
      months--;
  }
  const totalDays = (years * 365) + (months * 30) + days;

  let ageString = '';

  if (years > 0) {
      ageString += `${years}y `;
  }

  if (months > 0) {
      ageString += `${months}m `;
  }

  if (days > 0) {
      ageString += `${days}d`;
  }

  return ageString.trim();
}