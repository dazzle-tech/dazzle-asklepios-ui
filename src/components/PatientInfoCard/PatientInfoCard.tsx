import React from 'react';
import { Avatar, Button, Panel, Text } from 'rsuite';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6';
import MemberIcon from '@rsuite/icons/Member';
import './styles.less';
import { useSelector } from 'react-redux';
import Translate from '../Translate';

interface PatientInfoCard {
  patient: any;
}

const PatientInfoCard = ({ patient}: PatientInfoCard) => {
  const mode = useSelector((state: any) => state.ui.mode);
  return(
  <Panel bordered className={`patient-info-card-container ${mode === 'light' ? 'light' : 'dark'}`}>
  {/* Header (MRN) */}
  <div className="mrn">
    <MemberIcon style={{ marginRight: 10 , marginLeft: 20, marginBottom : 20 , marginTop: 20 }} />
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
    <div className='div-data'><Translate>Patient Name</Translate></div>
    <div className="patient-info"><Translate>{(patient?.firstName || '') + "  " + (patient?.lastName || '')}</Translate></div>
     </div>
      <div>
        <div className="div-data"><Translate>Gender & Age</Translate></div>
        <div className="patient-info"><Translate>{ (patient?.genderLvalue?.lovDisplayValue || '') + (patient?.dob ? calculateAgeFormat(patient.dob) + '' : '')}</Translate></div>
      </div>
      <div>
        <div className="div-data"><Translate>Date of Register</Translate></div>
        <div className="patient-info"><Translate>{(patient?.strength || '') + (patient?.unitLvalue?.lovDisplayVale || '')}</Translate></div>
      </div>
      <div>
        <div className="div-data"><Translate>Document Type</Translate></div>
        <div className="patient-info"><Translate>{ (patient?.documentTypeLvalue?.lovDisplayVale || '')}</Translate></div>
      </div>
      <div>
        <div className="div-data"><Translate>Document Country</Translate></div>
        <div className="patient-info"><Translate>{ patient?.documentCountryLvalue?.lovDisplayVale || " "}</Translate></div>
      </div>
      <div>
        <div className="div-data"><Translate>Document Number</Translate></div>
        <div className="patient-info"> <Translate>{ (patient?.documentNo || '')}</Translate></div>
      </div>
    </div>
  </div>
</Panel>
  );
 
};

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