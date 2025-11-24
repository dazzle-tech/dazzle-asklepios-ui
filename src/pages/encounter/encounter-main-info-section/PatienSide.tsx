import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { resetRefetchPatientSide } from '@/reducers/refetchPatientSide';
import { useFetchAttachmentQuery } from '@/services/attachmentService';
import {
  useGetAllergiesQuery,
  useGetObservationSummariesQuery,
  useGetWarningsQuery
} from '@/services/observationService';
import { useGetAllergensQuery } from '@/services/setupService';
import { RootState } from '@/store';
import { ApAttachment } from '@/types/model-types';
import { initialListRequest } from '@/types/types';
import { calculateAgeFormat } from '@/utils';
import {
  faExclamationTriangle,
  faFileWaveform,
  faHandDots,
  faIdCard,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useRef, useState } from 'react';
import { FaWeight } from 'react-icons/fa';
import { GiMedicalThermometer } from 'react-icons/gi';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, Divider, Panel, Text } from 'rsuite';
import './styles.less';

const PatientSide = ({ patient, encounter, refetchList = null }) => {
  const profileImageFileInputRef = useRef(null);
  const [patientImage, setPatientImage] = useState<ApAttachment>(undefined);
  const dispatch = useDispatch();
  const refetchPatientSide = useSelector(
    (state: RootState) => state.refetchPatientSide.refetchPatientSide
  );

  // ===== Helpers to avoid NaN / bad output =====
  const toNumber = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const fmt = (v: number | null | undefined, digits = 2, fallback = '') =>
    Number.isFinite(v as number) ? (v as number).toFixed(digits) : fallback;
  const textOr = (v: any, fallback = '') => (v == null || v === '' ? fallback : v);

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
  const { data: allergiesResponse } = useGetAllergiesQuery(
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

  const { data: warningsResponse } = useGetWarningsQuery(
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

  useEffect(() => {
    setBodyMeasurements({
      height: patirntObservationlist?.object?.find(
        item => item.latestheight != null && item.latestheight != 0
      )?.latestheight,
      weight: patirntObservationlist?.object?.find(
        item => item.latestweight != null && item.latestweight != 0
      )?.latestweight,
      headcircumference: patirntObservationlist?.object?.find(
        item => item.latestheadcircumference != null && item.latestheadcircumference != 0
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
  }, [refetchList, refetch]);

  const handleImageClick = type => {
    if (patient?.key) profileImageFileInputRef.current?.click();
  };

  useEffect(() => {
    if (refetchPatientSide) {
      refetch();
      dispatch(resetRefetchPatientSide());
    }
  }, [refetchPatientSide, refetch, dispatch]);

  // Helper function to get allergen name
  const getAllergenName = (allergenKey: string) => {
    if (!allergensListToGetName?.object) return 'Loading...';
    const found = allergensListToGetName.object.find(item => item.key === allergenKey);
    return found?.allergenName || 'Unknown';
  };

  // Get active allergies & warnings
  const activeAllergies =
    allergiesResponse?.object?.filter(allergy => allergy.statusLkey === '9766169155908512') || [];
  const activeWarnings =
    warningsResponse?.object?.filter(warning => warning.statusLkey === '9766169155908512') || [];

  // Helper function to get allergy severity background + text color
  const getAllergySeverityColors = (severity: string) => {
    const lowerSeverity = severity?.toLowerCase()?.trim();

    if (
      lowerSeverity === 'mild' ||
      lowerSeverity === 'minor' ||
      lowerSeverity?.includes('mild') ||
      lowerSeverity?.includes('minor')
    ) {
      return { bg: 'var(--light-green)', text: 'var(--primary-green)' };
    } else if (lowerSeverity === 'moderate') {
      return { bg: 'var(--light-orange)', text: 'var(--primary-orange)' };
    } else {
      return { bg: 'var(--light-red)', text: 'var(--primary-red)' };
    }
  };

  // ===== Safe calculations for BMI / BSA =====
  const w = toNumber(bodyMeasurements?.weight);
  const h = toNumber(bodyMeasurements?.height); // h is in cm

  const bmi = w != null && h != null && h > 0 ? w / Math.pow(h / 100, 2) : null;
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
            <Text className="patient-name">{textOr(patient?.fullName, 'Patient Name')}</Text>
          </div>
          <div className="info-label"># {textOr(patient?.patientMrn, 'MRN')}</div>
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
          <Text className="info-value">
            {textOr(patient?.documentTypeLvalue?.lovDisplayVale, '')}
          </Text>
        </div>

        <div className="info-column">
          <Text className="info-label">Document No</Text>
          <Text className="info-value"> {textOr(patient?.documentNo, '')}</Text>
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
          <Text className="info-label">Gender</Text>
          <Text className="info-value"> {textOr(patient?.genderLvalue?.lovDisplayVale, '')}</Text>
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
              <Text className="info-value">{textOr(encounter?.plannedStartDate, '')}</Text>
            </div>

            <div className="info-column">
              <Text className="info-label">Visit ID</Text>
              <Text className="info-value"> {textOr(encounter?.visitId, '')}</Text>
            </div>
          </div>

          <div className="info-section">
            <div className="info-column">
              <Text className="info-label">Visit Type</Text>
              <Text className="info-value">
                {textOr(encounter?.visitTypeLvalue?.lovDisplayVale, '')}
              </Text>
            </div>

            <div className="info-column">
              <Text className="info-label">Priority</Text>
              <Text className="info-value">
                {textOr(encounter?.encounterPriorityLvalue?.lovDisplayVale, '')}
              </Text>
            </div>
          </div>

          <div className="info-section">
            <div className="info-column">
              <Text className="info-label">Reason</Text>
              <Text className="info-value">
                {textOr(encounter?.reasonLvalue?.lovDisplayVale, '')}
              </Text>
            </div>

            <div className="info-column">
              <Text className="info-label">Origin</Text>
              <Text className="info-value">
                {' '}
                {textOr(encounter?.originLvalue?.lovDisplayVale, '')}
              </Text>
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
                <Text className="info-value">{textOr(encounter?.apRoom?.name, '')}</Text>
              </div>

              <div className="info-column">
                <Text className="info-label">Bed</Text>
                <Text className="info-value">{textOr(encounter?.apBed?.name, '')}</Text>
              </div>
            </div>

            <div className="info-section">
              <div className="info-column">
                <Text className="info-label">Ward</Text>
                <Text className="info-value">{textOr(encounter?.departmentName, '')}</Text>
              </div>

              <div className="info-column">
                <Text className="info-label">Date of Admission</Text>
                <Text className="info-value">{textOr(encounter?.actualStartDate, '')}</Text>
              </div>
            </div>
          </div>

          <Divider className="divider-thin" />

          <Text>
            <GiMedicalThermometer className="icon-title" />
            <span className="patient-section-title">Diagnosis</span>
          </Text>

          <div className="margin-top-8">
            <Text>{textOr(encounter?.diagnosis, '')}</Text>
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
