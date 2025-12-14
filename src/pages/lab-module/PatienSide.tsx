import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { useFetchAttachmentQuery } from '@/services/attachmentService';
import {
  useGetAllergiesQuery,
  useGetObservationSummariesQuery,
  useGetWarningsQuery
} from '@/services/observationService';
import { useGetAllergensQuery } from '@/services/setupService';
import { ApAttachment } from '@/types/model-types';
import { initialListRequest } from '@/types/types';
import { calculateAgeFormat } from '@/utils';
import {
  faExclamationTriangle,
  faHandDots,
  faIdCard,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useRef, useState } from 'react';
import { FaWeight } from 'react-icons/fa';
import { GiMedicalThermometer } from 'react-icons/gi';
import { Avatar, Divider, Panel, Text } from 'rsuite';
import AllergiesModal from '../encounter/encounter-screen/AllergiesModal';
import WarningiesModal from '../encounter/encounter-screen/WarningiesModal';
import './styles.less';

const PatientSide = ({ patient, encounter }) => {
  const [openAllargyModal, setOpenAllargyModal] = useState(false);
  const [openWarningModal, setOpenWarningModal] = useState(false);
  const profileImageFileInputRef = useRef(null);
  const [patientImage, setPatientImage] = useState<ApAttachment>(undefined);

  const { data: patirntObservationlist } = useGetObservationSummariesQuery({
    ...initialListRequest,
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key ?? undefined
      }
    ]
  });

  // New queries for allergies and warnings
  const { data: allergiesResponse, isLoading: allergiesLoading } = useGetAllergiesQuery(
    {
      ...initialListRequest,
      pageSize: 5,
      sortBy: 'createdAt',
      sortType: 'desc',
      filters: [
        { fieldName: 'patient_key', operator: 'match', value: patient?.key },
        { fieldName: 'status_lkey', operator: 'notMatch', value: '3196709905099521' } // Exclude cancelled
      ]
    },
    { skip: !patient?.key }
  );

  const { data: warningsResponse, isLoading: warningsLoading } = useGetWarningsQuery(
    {
      ...initialListRequest,
      pageSize: 5,
      sortBy: 'createdAt',
      sortType: 'desc',
      filters: [
        { fieldName: 'patient_key', operator: 'match', value: patient?.key },
        { fieldName: 'status_lkey', operator: 'notMatch', value: '3196709905099521' } // Exclude cancelled
      ]
    },
    { skip: !patient?.key }
  );

  const { data: allergensListToGetName } = useGetAllergensQuery({ ...initialListRequest });

  const [bodyMeasurements, setBodyMeasurements] = useState<{
    height: number | string | null;
    weight: number | string | null;
    headcircumference: number | string | null;
  }>({
    height: null,
    weight: null,
    headcircumference: null
  });

  const fetchPatientImageResponse = useFetchAttachmentQuery(
    {
      type: 'PATIENT_PROFILE_PICTURE',
      refKey: patient?.key
    },
    { skip: !patient?.key }
  );

  const toNumber = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const fmt = (v: number | null | undefined, digits = 2, fallback = '') =>
    Number.isFinite(v as number) ? (v as number).toFixed(digits) : fallback;

  const textOr = (v: any, fallback = '') => (v == null || v === '' ? fallback : v);

  // Helper function to get allergen name
  const getAllergenName = (allergenKey: string) => {
    if (!allergensListToGetName?.object) return 'Loading...';
    const found = allergensListToGetName.object.find(item => item.key === allergenKey);
    return found?.allergenName || 'Unknown';
  };

  // Helper function to get allergy severity background + text color
  const getAllergySeverityColors = (severity: string) => {
    const lowerSeverity = severity?.toLowerCase()?.trim();

    if (lowerSeverity === 'mild' || lowerSeverity === 'minor' || lowerSeverity?.includes('mild')) {
      return { bg: 'var(--light-green)', text: 'var(--primary-green)' };
    } else if (lowerSeverity === 'moderate' || lowerSeverity?.includes('moderate')) {
      return { bg: 'var(--light-orange)', text: 'var(--primary-orange)' };
    } else {
      // severe, high, critical or default
      return { bg: 'var(--light-red)', text: 'var(--primary-red)' };
    }
  };

  // Get active allergies for the alert banner
  const activeAllergies =
    allergiesResponse?.object?.filter(allergy => allergy.statusLkey === '9766169155908512') || [];

  // Get active warnings for the alert banner
  const activeWarnings =
    warningsResponse?.object?.filter(warning => warning.statusLkey === '9766169155908512') || [];

  useEffect(() => {
    setBodyMeasurements({
      height: patirntObservationlist?.object?.find(item => item.latestheight != null)?.latestheight,
      weight: patirntObservationlist?.object?.find(item => item.latestweight != null)?.latestweight,
      headcircumference: patirntObservationlist?.object?.find(
        item => item.latestheadcircumference != null
      )?.latestheadcircumference
    });
  }, [patirntObservationlist]);

  useEffect(() => {
    if (
      fetchPatientImageResponse.isSuccess &&
      fetchPatientImageResponse.data &&
      fetchPatientImageResponse.data.key
    ) {
      setPatientImage(fetchPatientImageResponse.data);
    } else {
      setPatientImage(undefined);
    }
  }, [fetchPatientImageResponse]);

  const handleImageClick = type => {
    if (patient?.key) profileImageFileInputRef.current?.click();
  };

  const w = toNumber(bodyMeasurements?.weight);
  const h = toNumber(bodyMeasurements?.height);

  const bmi =
    w != null && h != null && h > 0
      ? w / Math.pow(h / 100, 2) 
      : null;

  const bsa = w != null && h != null ? Math.sqrt((w * h) / 3600) : null;

  return (
    <Panel className="patient-panel">
      <div className="div-avatar">
        <Avatar
          circle
          bordered
          onClick={() => handleImageClick('PATIENT_PROFILE_PICTURE')}
          src={
            patientImage && patientImage.fileContent
              ? `data:${patientImage.contentType};base64,${patientImage.fileContent}`
              : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
          }
          alt={patient?.fullName}
        />
        <div>
          <div className="patient-info">
            <Text className="info-label">{textOr(patient?.fullName, 'Patient Name')}</Text>
          </div>
          <div className="info-label"># {textOr(patient?.patientMrn, 'MRN')}</div>
        </div>
      </div>

      <Text style={{ marginTop: '5px' }}>
        <FontAwesomeIcon icon={faIdCard} className="icon-title" />{' '}
        <span className="patient-section-title">Document Information</span>
      </Text>
      <br />

      <div className="info-section">
        <div className="info-column">
          <Text className="info-label">Document No</Text>
          <Text className="info-value">{textOr(patient?.documentNo, '')}</Text>
        </div>

        <div className="info-column">
          <Text className="info-label">Document Type</Text>
          <Text className="info-value">
            {textOr(patient?.documentTypeLvalue?.lovDisplayVale, '')}
          </Text>
        </div>
      </div>
      <Divider className="divider-thin" />

      <Text style={{ marginTop: '5px' }}>
        <FontAwesomeIcon icon={faUser} className="icon-title" />{' '}
        <span className="patient-section-title">Patient Information</span>
      </Text>
      <br />

      <div className="info-section">
        <div className="info-column">
          <Text className="info-label">Age</Text>
          <Text className="info-value">{patient?.dob ? calculateAgeFormat(patient?.dob) : ''}</Text>
        </div>

        <div className="info-column">
          <Text className="info-label">Gender</Text>
          <Text className="info-value">{textOr(patient?.genderLvalue?.lovDisplayVale, '')}</Text>
        </div>
      </div>
      <Divider className="divider-thin" />
      <Text style={{ display: 'flex', marginTop: '5px' }}>
        <FaWeight className="icon-title" style={{ marginTop: '3px' }} />
        <span className="patient-section-title" style={{ marginLeft: '2px' }}>
          Physical Measurements
        </span>
      </Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <br />
        <div className="info-section">
          <div className="info-column">
            <Text className="info-label">Weight</Text>
            <Text className="info-value">
              {fmt(w, 2, '')}
              {w != null ? ' kg' : ''}
            </Text>
          </div>

          <div className="info-column">
            <Text className="info-label">Height</Text>
            <Text className="info-value">
              {fmt(h, 2, '')}
              {h != null ? ' cm' : ''}
            </Text>
          </div>
        </div>
        <div className="info-section">
          <div className="info-column">
            <Text className="info-label">H.C</Text>
            <Text className="info-value">{textOr(bodyMeasurements?.headcircumference, '')}</Text>
          </div>

          <div className="info-column">
            <Text className="info-label">BMI</Text>
            <Text className="info-value">{fmt(bmi, 2, '')}</Text>
          </div>
        </div>
        <div className="info-section">
          <div className="info-column">
            <Text className="info-label">BSA</Text>
            <Text className="info-value">{fmt(bsa, 2, '')}</Text>
          </div>

          <div className="info-column">
            <Text className="info-label">Blood Group</Text>
            <Text className="info-value">
              {textOr(patient?.bloodGroupLvalue?.lovDisplayVale, '')}
            </Text>
          </div>
        </div>
      </div>
      <Divider className="divider-thin" />
      <Text style={{ display: 'flex', marginTop: '5px' }}>
        <GiMedicalThermometer className="icon-title" style={{ marginTop: '4px' }} />
        <span className="patient-section-title" style={{ marginLeft: '2px' }}>
          Diagnosis
        </span>
      </Text>
      <div>
        <br />
        <Text>{textOr(encounter?.diagnosis, '')}</Text>
      </div>
      <Divider className="divider-thin" />
      {/* ==== Allergy & Warning Banners ==== */}
      <div className="my-container">
        {/* Individual Allergies Badges */}
        {activeAllergies.map((allergy, index) => (
          <MyBadgeStatus
            key={`allergy-${allergy.key || index}`}
            backgroundColor={
              getAllergySeverityColors(allergy.severityLvalue?.lovDisplayVale || '').bg
            }
            color={getAllergySeverityColors(allergy.severityLvalue?.lovDisplayVale || '').text}
            contant={
              <>
                <FontAwesomeIcon icon={faHandDots} className="margin-right-size" />
                {getAllergenName(allergy.allergenKey)}
              </>
            }
          />
        ))}

        {/* Individual Warnings Badges */}
        {activeWarnings.map((warning, index) => (
          <MyBadgeStatus
            key={`warning-${warning.key || index}`}
            backgroundColor={
              getAllergySeverityColors(warning.severityLvalue?.lovDisplayVale || '').bg
            }
            color={getAllergySeverityColors(warning.severityLvalue?.lovDisplayVale || '').text}
            contant={
              <>
                <FontAwesomeIcon icon={faExclamationTriangle} className="margin-right-size" />
                {warning.warning}
              </>
            }
          />
        ))}
      </div>
      <WarningiesModal open={openWarningModal} setOpen={setOpenWarningModal} patient={patient} />
      <AllergiesModal open={openAllargyModal} setOpen={setOpenAllargyModal} patient={patient} />
    </Panel>
  );
};

export default PatientSide;
