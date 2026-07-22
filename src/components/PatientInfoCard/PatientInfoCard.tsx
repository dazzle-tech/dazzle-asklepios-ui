import React, { useState, useEffect } from 'react';
import { Avatar, Panel } from 'rsuite';
import MemberIcon from '@rsuite/icons/Member';
import './styles.less';
import { useSelector } from 'react-redux';
import Translate from '../Translate';
import { useGetPrimaryDocumentByPatientQuery } from '@/services/patients/patientDocumentsService';
import { useGetCountriesBulkMutation } from '@/services/setup/country/countryService';
import { conjureValueBasedOnIDFromList, conjureValueBasedOnKeyFromList, formatEnumString } from '@/utils';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

interface PatientInfoCard {
  patient: any;
}

const PatientInfoCard = ({ patient}: PatientInfoCard) => {
  const mode = useSelector((state: any) => state.ui.mode);
  const [getCountriesBulk] = useGetCountriesBulkMutation();
  const [countriesMap, setCountriesMap] = useState<Record<number, any>>({});
    const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');
  const patientName =
    patient?.fullName?.trim() ||
    [patient?.firstName, patient?.secondName, patient?.thirdName, patient?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

  const dobValue =
    patient?.dateOfBirth ||
    patient?.dob ||
    (patient?.dateOfBirth && typeof patient.dateOfBirth !== 'string' ? patient.dateOfBirth : undefined);

  const genderText =
    patient?.gender ||
    patient?.genderLvalue?.lovDisplayVale ||
    '';

  const genderAge = [genderText, dobValue ? calculateAgeFormat(dobValue) : '']
    .filter(Boolean)
    .join(' - ');

  const registrationDate =
    patient?.createdDate ||
    patient?.createdAt 
      ? new Date(patient?.createdDate ).toLocaleDateString('en-GB')
      : '';

  const patientId = patient?.id ?? patient?.key;
  const { data: primaryDocument } = useGetPrimaryDocumentByPatientQuery(patientId, {
    skip: !patientId,
  });

  // Load country bulk data when primaryDocument has countryId
  useEffect(() => {
    const loadCountry = async () => {
      if (!primaryDocument?.countryId) {
        setCountriesMap({});
        return;
      }

      try {
        const countries = await getCountriesBulk([primaryDocument.countryId] as number[]).unwrap();
        const map = Object.fromEntries(countries.map((c: any) => [c.id, c]));
        setCountriesMap(map);
      } catch (e) {
        console.error('Country bulk load failed', e);
      }
    };

    loadCountry();
  }, [primaryDocument?.countryId, getCountriesBulk]);

  const documentType =
    primaryDocument?.type
      ? formatEnumString(primaryDocument.type)
      : patient?.documentTypeLvalue?.lovDisplayVale || '';

  const documentCountry =
    primaryDocument?.countryId && countriesMap[primaryDocument.countryId]
      ? conjureValueBasedOnKeyFromList(
          countryLovQueryResponse?.object ?? [],
          countriesMap[primaryDocument.countryId].name,
          'lovDisplayVale'
        )
      : '';

  const documentNumber =
    primaryDocument?.number ||
    patient?.documentNo ||
    patient?.documentNumber ||
    '';

  const phoneNumber =
    patient?.mobileNumber ||
    patient?.primaryMobileNumber ||
    patient?.phoneNumber ||
    patient?.primaryPhone ||
    '';

  return (
    <Panel bordered className={`patient-info-card-container ${mode === 'light' ? 'light' : 'dark'}`}>
      {/* Header (MRN) */}
      <div className="mrn">
        <MemberIcon style={{ marginRight: 10, marginLeft: 20, marginBottom: 20, marginTop: 20 }} />
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>MRN</div>
          <div>{patient?.medicalRecordNumber || patient?.patientMrn || '-'}</div>
        </div>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', rowGap: 20, columnGap: 25 }}>
          <div>
            <div className="div-data"><Translate>Patient Name</Translate></div>
            <div className="patient-info"><Translate>{patientName || '-'}</Translate></div>
          </div>
          <div>
            <div className="div-data"><Translate>Gender & Age</Translate></div>
            <div className="patient-info"><Translate>{genderAge || '-'}</Translate></div>
          </div>
          <div>
            <div className="div-data"><Translate>Date of Register</Translate></div>
            <div className="patient-info"><Translate>{registrationDate || '-'}</Translate></div>
          </div>
          <div>
            <div className="div-data"><Translate>Document Type</Translate></div>
            <div className="patient-info"><Translate>{documentType || '-'}</Translate></div>
          </div>
          <div>
            <div className="div-data"><Translate>Document Country</Translate></div>
            <div className="patient-info"><Translate>{documentCountry || '-'}</Translate></div>
          </div>
          <div>
            <div className="div-data"><Translate>Document Number</Translate></div>
            <div className="patient-info"><Translate>{documentNumber || '-'}</Translate></div>
          </div>
          <div>
            <div className="div-data"><Translate>Phone</Translate></div>
            <div className="patient-info"><Translate>{phoneNumber || '-'}</Translate></div>
          </div>
          <div>
            <div className="div-data"><Translate>Email</Translate></div>
            <div className="patient-info"><Translate>{patient?.email || '-'}</Translate></div>
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