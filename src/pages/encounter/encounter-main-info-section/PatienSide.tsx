import { useState, useEffect, useRef } from 'react';
import {
  faIdCard,
  faUser,
  faFileWaveform,
  faExclamationTriangle,
  faHandDots
} from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import { Panel, Avatar, Text, Divider, Badge, Loader } from 'rsuite';
import { useFetchAttachmentQuery } from '@/services/attachmentService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FaWeight } from 'react-icons/fa';
import { calculateAgeFormat } from '@/utils';
import {
  useGetObservationSummariesQuery,
  useGetAllergiesQuery,
  useGetWarningsQuery
} from '@/services/observationService';
import { useGetAllergensQuery } from '@/services/setupService';
import { initialListRequest } from '@/types/types';
import { ApAttachment } from '@/types/model-types';
import './styles.less';
import { GiMedicalThermometer } from 'react-icons/gi';
import { useDispatch, useSelector } from 'react-redux';
import { resetRefetchPatientSide } from '@/reducers/refetchPatientSide';
import { RootState } from '@/store';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const PatientSide = ({ patient, encounter, refetchList = null }) => {
  const profileImageFileInputRef = useRef(null);
  const [patientImage, setPatientImage] = useState<ApAttachment>(undefined);
  const dispatch = useDispatch();
  console.log('encountr==>', encounter);
  const refetchPatientSide = useSelector(
    (state: RootState) => state.refetchPatientSide.refetchPatientSide
  );

  // Existing queries
  const { data: patirntObservationlist, refetch } = useGetObservationSummariesQuery({
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
      pageSize: 5, // Limit to show only recent ones
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
      pageSize: 5, // Limit to show only recent ones
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

  const [bodyMeasurements, setBodyMeasurements] = useState({
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

  useEffect(() => {
    setBodyMeasurements({
      height: patirntObservationlist?.object?.find(
        item => item.latestheight != null && item.latestheight != 0
      )?.latestheight,
      weight: patirntObservationlist?.object?.find(
        item => item.latestweight != null && item.latestheight != 0
      )?.latestweight,
      headcircumference: patirntObservationlist?.object?.find(
        item => item.latestheadcircumference != null && item.latestheight != 0
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

  useEffect(() => {
    if (refetchList) {
      refetch();
    }
  }, [refetchList]);

  const handleImageClick = type => {
    if (patient.key) profileImageFileInputRef.current.click();
  };

  useEffect(() => {
    console.log('refetchPatientSide ====>', refetchPatientSide);
    if (refetchPatientSide) {
      refetch();
      dispatch(resetRefetchPatientSide());
    }
  }, [refetchPatientSide]);

  // Helper function to get allergen name
  const getAllergenName = (allergenKey: string) => {
    if (!allergensListToGetName?.object) return 'Loading...';
    const found = allergensListToGetName.object.find(item => item.key === allergenKey);
    return found?.allergenName || 'Unknown';
  };

  // Helper function to get status badge color
  const getStatusBadgeColor = (statusLkey: string) => {
    switch (statusLkey) {
      case '9766169155908512': // Active
        return 'red';
      case '9766179572884232': // Resolved
        return 'green';
      default:
        return 'blue';
    }
  };

  // Helper function to get allergy severity color
  const getAllergySeverityColor = (severity: string) => {
    const lowerSeverity = severity?.toLowerCase();
    if (lowerSeverity === 'mild' || lowerSeverity === 'minor' || lowerSeverity === 'milk') {
      return '#28a745'; // Green
    } else if (lowerSeverity === 'moderate') {
      return '#fd7e14'; // Orange
    } else {
      return '#dc3545'; // Red (for severe/high/critical)
    }
  };

  // Get active allergies for the alert banner
  const activeAllergies =
    allergiesResponse?.object?.filter(allergy => allergy.statusLkey === '9766169155908512') || [];

  // Get active warnings for the alert banner
  const activeWarnings =
    warningsResponse?.object?.filter(warning => warning.statusLkey === '9766169155908512') || [];

  // Helper function to get allergy severity background + text color
  const getAllergySeverityColors = (severity: string) => {
    const lowerSeverity = severity?.toLowerCase();

    if (lowerSeverity === 'mild' || lowerSeverity === 'minor' || lowerSeverity === 'milk') {
      return { bg: 'var(--light-green)', text: 'var(--primary-green)' };
    } else if (lowerSeverity === 'moderate') {
      return { bg: 'var(--light-orange)', text: 'var(--primary-orange)' };
    } else {
      return { bg: 'var(--light-red)', text: 'var(--primary-red)' };
    }
  };

  // Get highest severity (for allergies banner)
  const getHighestSeverityColors = () => {
    if (!activeAllergies.length) return { bg: 'var(--light-green)', text: 'var(--primary-green)' };

    const severities = activeAllergies.map(a =>
      (a.severityLvalue?.lovDisplayVale || '').toLowerCase().trim()
    );

    if (
      severities.some(s => s.includes('severe') || s.includes('high') || s.includes('critical'))
    ) {
      return { bg: 'var(--light-red)', text: 'var(--primary-red)' };
    } else if (severities.some(s => s.includes('moderate'))) {
      return { bg: 'var(--light-orange)', text: 'var(--primary-orange)' };
    } else {
      return { bg: 'var(--light-green)', text: 'var(--primary-green)' };
    }
  };

  // Get warning severity colors
  const getWarningSeverityColors = () => {
    if (!activeWarnings.length) return { bg: 'var(--light-green)', text: 'var(--primary-green)' };

    const severities = activeWarnings.map(
      w => w.severityLvalue?.lovDisplayVale?.toLowerCase() || ''
    );

    if (severities.some(s => s === 'severe' || s === 'high' || s === 'critical')) {
      return { bg: 'var(--light-red)', text: 'var(--primary-red)' };
    } else if (severities.some(s => s === 'moderate')) {
      return { bg: 'var(--light-orange)', text: 'var(--primary-orange)' };
    } else {
      return { bg: 'var(--light-green)', text: 'var(--primary-green)' };
    }
  };

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
            <Text className="patient-name">{patient?.fullName ?? 'Patient Name'}</Text>
          </div>
          <div className="info-label"># {patient?.patientMrn ?? 'MRN'}</div>
        </div>
      </div>

      <Text className="main-info-patient-side">
        <FontAwesomeIcon icon={faIdCard} className="icon-color" />{' '}
        <span className="section-title-patient-side">Document Information</span>
      </Text>
      <br />

      <div className="info-section">
        <div className="info-column">
          <Text className="info-label">Document Type</Text>
          <Text className="info-value">{patient?.documentTypeLvalue?.lovDisplayVale}</Text>
        </div>

        <div className="info-column">
          <Text className="info-label">Document No</Text>
          <Text className="info-value"> {patient?.documentNo}</Text>
        </div>
      </div>
      <Divider className="divider-style" />

      <Text className="main-info-patient-side">
        <FontAwesomeIcon icon={faUser} className="icon-color" />{' '}
        <span className="section-title-patient-side">Patient Information</span>
      </Text>
      <br />

      <div className="info-section">
        <div className="info-column">
          <Text className="info-label">Age</Text>
          <Text className="info-value">{patient?.dob ? calculateAgeFormat(patient?.dob) : ''}</Text>
        </div>

        <div className="info-column">
          <Text className="info-label">Sex at Birth</Text>
          <Text className="info-value"> {patient?.genderLvalue?.lovDisplayVale}</Text>
        </div>
      </div>
      <Divider className="divider-style" />

      <Text className="main-info-patient-side">
        <FaWeight className="icon-color" />{' '}
        <span className="section-title-patient-side">Physical Measurements</span>
      </Text>
      <div className="details-sections">
        <br />
        <div className="info-section">
          <div className="info-column">
            <Text className="info-label">Weight</Text>
            <Text className="info-value">{bodyMeasurements?.weight}</Text>
          </div>

          <div className="info-column">
            <Text className="info-label">Height</Text>
            <Text className="info-value"> {bodyMeasurements?.height}</Text>
          </div>
        </div>
        <div className="info-section">
          <div className="info-column">
            <Text className="info-label">H.C</Text>
            <Text className="info-value">{bodyMeasurements?.headcircumference}</Text>
          </div>

          <div className="info-column">
            <Text className="info-label">BMI</Text>
            <Text className="info-value">
              {' '}
              {(bodyMeasurements?.weight / (bodyMeasurements?.height / 100) ** 2).toFixed(2)}
            </Text>
          </div>
        </div>
        <div className="info-section">
          <div className="info-column">
            <Text className="info-label">BSA</Text>
            <Text className="info-value">
              {Math.sqrt((bodyMeasurements?.weight * bodyMeasurements?.height) / 3600).toFixed(2)}
            </Text>
          </div>

          <div className="info-column">
            <Text className="info-label">Blood Group</Text>
            <Text className="info-value">{patient?.bloodGroupLvalue?.lovDisplayVale ?? 'Nan'}</Text>
          </div>
        </div>
      </div>
      <Divider className="divider-style" />

      <Text className="main-info-patient-side">
        <FontAwesomeIcon icon={faFileWaveform} className="icon-color" />{' '}
        <span className="section-title-patient-side">
          {encounter?.resourceTypeLvalue?.valueCode !== 'BRT_INPATIENT'
            ? 'Visit Details'
            : 'Admission Details'}
        </span>
      </Text>
      {encounter?.resourceTypeLvalue?.valueCode !== 'BRT_INPATIENT' && (
        <div className="details-sections">
          <br />

          <div className="info-section">
            <div className="info-column">
              <Text className="info-label">Visit Date</Text>
              <Text className="info-value">{encounter?.plannedStartDate}</Text>
            </div>

            <div className="info-column">
              <Text className="info-label">Visit ID</Text>
              <Text className="info-value"> {encounter?.visitId}</Text>
            </div>
          </div>

          <div className="info-section">
            <div className="info-column">
              <Text className="info-label">Visit Type</Text>
              <Text className="info-value">{encounter?.visitTypeLvalue?.lovDisplayVale}</Text>
            </div>

            <div className="info-column">
              <Text className="info-label">Priority</Text>
              <Text className="info-value">
                {' '}
                {encounter?.encounterPriorityLvalue?.lovDisplayVale}
              </Text>
            </div>
          </div>

          <div className="info-section">
            <div className="info-column">
              <Text className="info-label">Reason</Text>
              <Text className="info-value">{encounter?.reasonLvalue?.lovDisplayVale}</Text>
            </div>

            <div className="info-column">
              <Text className="info-label">Origin</Text>
              <Text className="info-value"> {encounter?.originLvalue?.lovDisplayVale}</Text>
            </div>
          </div>
        </div>
      )}

      {encounter?.resourceTypeLvalue?.valueCode === 'BRT_INPATIENT' && (
        <>
          <div className="details-sections">
            <div className="info-section">
              <div className="info-column">
                <Text className="info-label">Room</Text>
                <Text className="info-value">{encounter?.apRoom?.name}</Text>
              </div>

              <div className="info-column">
                <Text className="info-label">Bed</Text>
                <Text className="info-value">{encounter?.apBed?.name}</Text>
              </div>
            </div>

            <div className="info-section">
              <div className="info-column">
                <Text className="info-label">Ward</Text>
                <Text className="info-value">{encounter?.departmentName}</Text>
              </div>

              <div className="info-column">
                <Text className="info-label">Date of Admission</Text>
                <Text className="info-value">{encounter?.actualStartDate}</Text>
              </div>
            </div>
          </div>

          <Divider className="divider-thin" />

          <Text>
            <GiMedicalThermometer className="icon-title" />
            <span className="patient-section-title">Diagnosis</span>
          </Text>

          <div className="margin-top-8">
            <Text>{encounter?.diagnosis}</Text>
          </div>
        </>
      )}
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
    </Panel>
  );
};

export default PatientSide;
