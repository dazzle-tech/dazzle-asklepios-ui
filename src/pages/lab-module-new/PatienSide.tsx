import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { useFetchAttachmentQuery } from '@/services/attachmentService';
import {
  useGetObservationSummariesQuery,
} from '@/services/observationService';
import { useGetAllergensQuery } from '@/services/setup/allergensService';
import { ApAttachment } from '@/types/model-types';
import { initialListRequest } from '@/types/types';
import { calculateAgeFormat, formatEnumString } from '@/utils';
import {
  faHandDots,
  faIdCard,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useRef, useState } from 'react';
import { FaWeight } from 'react-icons/fa';
import { Avatar, Divider, Panel, Text, Tooltip, Whisper } from 'rsuite';
import AllergiesModal from '../encounter/encounter-screen/AllergiesModal';
import WarningiesModal from '../encounter/encounter-screen/WarningiesModal';
import './styles.less';
import { useGetPatientAllergiesByPatientIdQuery } from '@/services/encounters/patientAllergiesService';
import { useGetPatientWarningsByPatientIdQuery } from '@/services/encounters/patientWarningsService';
import Translate from '@/components/Translate';
import { useGetAllMedicationCategoriesClassesQuery } from '@/services/setup/medication-categories/MedicationCategoriesClassService';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
//add new patient edits

const PatientSide = ({ patient, encounter }) => {
  console.log("PATIENT SIDE", patient);
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
        value: patient?.id ?? undefined
      }
    ]
  });

  // New queries for allergies and warnings
   const { data: allergiesListResponse } = useGetPatientAllergiesByPatientIdQuery(
      {
        patientId: patient?.id,
        showCancelled: false
      },
      {
        skip: !patient?.id
      }
    );

  const {
      data: warningsListResponse,
      refetch: refetchWarnings
    } = useGetPatientWarningsByPatientIdQuery(
      {
        patientId: patient?.id,
        showCancelled: false
      },
      {
        skip: !patient?.id
      }
    );

    const { data: allergensListResponse } = useGetAllergensQuery({});
      const { data: medicationClassesListResponse } = useGetAllMedicationCategoriesClassesQuery({});


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
      refKey: patient?.id
    },
    { skip: !patient?.id }
  );

  const toNumber = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const fmt = (v: number | null | undefined, digits = 2, fallback = '') =>
    Number.isFinite(v as number) ? (v as number).toFixed(digits) : fallback;

  const textOr = (v: any, fallback = '') => (v == null || v === '' ? fallback : v);

  // Helper function to get allergen name
  const getAllergenName = (allergenId: number, medicationClassId: number) => {
    if (allergenId && allergensListResponse?.data) {
      const allergen = allergensListResponse.data.find((item: any) => item.id === allergenId);
      return <p>{allergen?.name ?? '-'}</p>;
    } else if (medicationClassId && medicationClassesListResponse) {
      const medicationClass = medicationClassesListResponse.find(
        (item: any) => item.id === medicationClassId
      );
      return <p>{medicationClass?.name ?? '-'}</p>;
    }

    return <p>-</p>;
  };

  // Helper function to get allergy severity background + text color
  const getAllergySeverityColors = (severity: string) => {
    if (severity === 'MILD_MINOR') {
      return { bg: 'var(--light-green)', text: 'var(--primary-green)' };
    } else if (severity === 'MODERATE') {
      return { bg: 'var(--light-orange)', text: 'var(--primary-orange)' };
    } else {
      return { bg: 'var(--light-red)', text: 'var(--primary-red)' };
    }
  };

  const activeAllergies =
    allergiesListResponse?.data?.filter(allergy => allergy.status === 'ACTIVE') || [];
  const activeWarnings =
    warningsListResponse?.data?.filter(warning => warning.status === 'ACTIVE') || [];

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
            <Text className="info-label-full-name">{textOr(`${patient?.firstName ?? ''} ${patient?.lastName ?? ''}`, 'Patient Name')}</Text>
          </div>
          <div className="info-label"># {textOr(patient?.medicalRecordNumber, 'MRN')}</div>
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
          <Text className="info-value">{patient?.dateOfBirth ? calculateAgeFormat(patient?.dateOfBirth) : ''}</Text>
        </div>

        <div className="info-column">
          <Text className="info-label">Gender</Text>
          <Text className="info-value">{textOr(formatEnumString(patient?.sexAtBirth), '')}</Text>
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
      {/* ==== Allergy & Warning Banners ==== */}
      <div className="container-of-allergies-and-warnings">
        {activeAllergies.map((allergy, index) => (
          <Whisper
            key={`allergy-whisper-${allergy.id || index}`}
            placement="top"
            speaker={
              <Tooltip>
                <Translate>Allergy</Translate>
              </Tooltip>
            }
          >
            <span>
              <MyBadgeStatus
                key={`allergy-${allergy.id || index}`}
                backgroundColor={getAllergySeverityColors(allergy.severity || '').bg}
                color={getAllergySeverityColors(allergy.severity || '').text}
                contant={
                  <div className="diagnosis-badge-content">
                    <FontAwesomeIcon icon={faHandDots} className="diagnosis-badge-icon" />
                    {getAllergenName(allergy?.allergenId, allergy?.medicationClassId)}
                  </div>
                }
              />
            </span>
          </Whisper>
        ))}

        {activeWarnings.map((warning, index) => (
          <Whisper
            key={`warning-whisper-${warning.id || index}`}
            placement="top"
            speaker={
              <Tooltip>
                <Translate>Warning</Translate>
              </Tooltip>
            }
          >
            <span>
              <MyBadgeStatus
                key={`warning-${warning.id || index}`}
                backgroundColor={getAllergySeverityColors(warning.severity || '').bg}
                color={getAllergySeverityColors(warning.severity || '').text}
                contant={
                  <div className="diagnosis-badge-content">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="diagnosis-badge-icon" />
                    {warning.warning}
                  </div>
                }
              />
            </span>
          </Whisper>
        ))}
      </div>
      <WarningiesModal open={openWarningModal} setOpen={setOpenWarningModal} patient={patient} />
      <AllergiesModal open={openAllargyModal} setOpen={setOpenAllargyModal} patient={patient} />
    </Panel>
  );
};

export default PatientSide;