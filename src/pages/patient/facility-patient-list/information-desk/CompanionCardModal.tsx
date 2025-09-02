import React from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './style.less';

const CompanionCardModal = ({ record = {} }) => {
  return (
    <Form fluid>
      <div className="main-modal-content-color-background">
        <div className="header-section">
          <div className="profile-pic-container">

<div className="profile-pic-wrapper">
  <img
    src={record.picture || 'https://as1.ftcdn.net/jpg/05/60/26/08/1000_F_560260880_O1V3Qm2cNO5HWjN66mBh2NrlPHNHOUxW.jpg'}
    alt="Profile"
    className="profile-pic"
  />
  <div className="overlay">
    Upload Picture
  </div>
</div>

          </div>
          <h3 className="companion-name">{record.companionname || 'No Companions'}</h3>
          <p className="relation">{record.relationwithpatient || '-'}</p>
        </div>

        <div className="details-section">
          <div className="detail-item">
            <span className="label">Patient Name:</span>
            <span className="value">{record.patientname || '-'}</span>
          </div>
          <div className="detail-item">
            <span className="label">Ward:</span>
            <span className="value">{record.ward || '-'}</span>
          </div>
          <div className="detail-item">
            <span className="label">Admission Date:</span>
            <span className="value">{record.admissiondate || '-'}</span>
          </div>
        </div>
      </div>
    </Form>
  );
};

export default CompanionCardModal;
