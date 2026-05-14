import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import Translate from '@/components/Translate';
import { resetRefetchEncounter } from '@/reducers/refetchEncounterState';
import { resetRefetchPatientSide } from '@/reducers/refetchPatientSide';
import { useFetchAttachmentQuery } from '@/services/attachmentService';
import { useGetPatientAllergiesByPatientIdQuery } from '@/services/encounters/patientAllergiesService';
import { useGetPatientWarningsByPatientIdQuery } from '@/services/encounters/patientWarningsService';
import {
  useGetLatestVitalSignsByEncounterIdQuery,
  useLazyGetLatestVitalSignsByEncounterIdQuery
} from '@/services/medicalsheetsEncounter/observations/vitalSignsService';
import {
  useGetLatestBodyMeasurementsByPatientIdQuery
} from '@/services/medicalsheetsEncounter/observations/bodyMeasurementsService';
import {
  useLazyExistsPatientDiagnosisByEncounterIdQuery,
  useLazyGetPrimaryPatientDiagnosisByEncounterIdQuery
} from '@/services/medicalsheetsEncounter/clinicalVisit/patientDiagnosisService';
import { useLazyGetIcdDiagnosesByIdsQuery } from '@/services/setup/icdTreeService';
import {
  useGetPrimaryDocumentByPatientQuery,
  useLazyGetPrimaryDocumentByPatientQuery
} from '@/services/patients/patientDocumentsService';
import {
  useGetLatestPatientObservationsComplaintsByEncounterIdQuery,
  useLazyGetLatestPatientObservationsComplaintsByEncounterIdQuery
} from '@/services/medicalsheetsEncounter/observations/patientObservationsComplaintsService';
import { useGetAllergensQuery } from '@/services/setup/allergensService';
import { useGetAllMedicationCategoriesClassesQuery } from '@/services/setup/medication-categories/MedicationCategoriesClassService';
import { useGetCurrentMedicationsQuery } from '@/services/patients/currentMedicationService';
import { useGetActiveIngredientsQuery } from '@/services/setup/activeIngredients/activeIngredientsService';
import { RootState } from '@/store';
import { ApAttachment } from '@/types/model-types';
import { newPatient } from '@/types/model-types-constructor-new';
import { calculateAgeFormat, formatEnumString } from '@/utils';
import {
  faFileWaveform,
  faHandDots,
  faIdCard,
  faScaleBalanced,
  faStethoscope,
  faUser,
  faTriangleExclamation,
  faPills
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaWeight } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, Divider, Panel, Text, Tooltip, Whisper } from 'rsuite';
import './styles.less';

const PatientSide = ({
  patient,
  encounter,
  refetchList = null,
  setPatient,
  balance = undefined,
  showDocumentInfo = true,
  showPatientInfo = true,
  showMeasurements = true,
  showConditions = true,
  showDiagnosis = true,
  showVisitDetails = true,
  showAllergiesWarnings = true,
  showBalance = true,
  showCurrentMeds = true,
  showCloseButton = true,
  onClose = null
}) => {
  const profileImageFileInputRef = useRef(null);
  const [patientImage, setPatientImage] = useState<ApAttachment>(undefined);
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState<any>(null);
  const [primaryDiagnosisError, setPrimaryDiagnosisError] = useState<any>(null);
  const dispatch = useDispatch();

  const refetchPatientSide = useSelector(
    (state: RootState) => state.refetchPatientSide.refetchPatientSide
  );
  const refetchEncounter = useSelector((state: any) => state?.refetch?.refetchEncounter);

  const toNumber = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const fmt = (v: number | null | undefined, digits = 2, fallback = '') =>
    Number.isFinite(v as number) ? (v as number).toFixed(digits) : fallback;

  const textOr = (v: any, fallback = '') => (v == null || v === '' ? fallback : v);

  const { data: allergensListResponse } = useGetAllergensQuery({});
  const { data: medicationClassesListResponse } = useGetAllMedicationCategoriesClassesQuery({});

  const { data: warningsListResponse, refetch: refetchWarnings } =
    useGetPatientWarningsByPatientIdQuery(
      {
        patientId: patient?.id,
        showCancelled: false
      },
      {
        skip: !patient?.id
      }
    );

  const { data: allergiesListResponse, refetch: refetchAllergies } =
    useGetPatientAllergiesByPatientIdQuery(
      {
        patientId: patient?.id,
        showCancelled: false
      },
      {
        skip: !patient?.id
      }
    );

  const { data: primaryDocument, refetch: refetchPrimaryDocument } =
    useGetPrimaryDocumentByPatientQuery(patient?.id, {
      skip: !patient?.id
    });

  const [triggerGetPrimaryDocument] = useLazyGetPrimaryDocumentByPatientQuery();

  const { data: latestVitalSigns, refetch: refetchLatestVitalSigns } =
    useGetLatestVitalSignsByEncounterIdQuery(
      { encounterId: encounter?.id },
      {
        skip: !encounter?.id
      }
    );

  const [triggerGetLatestVitalSigns] = useLazyGetLatestVitalSignsByEncounterIdQuery();
  const {
    data: latestBodyMeasurements,
    refetch: refetchLatestBodyMeasurements
  } = useGetLatestBodyMeasurementsByPatientIdQuery(
    { patientId: patient?.id },
    { skip: !patient?.id }
  );
  const [triggerExistsPrimaryDiagnosis] = useLazyExistsPatientDiagnosisByEncounterIdQuery();
  const [triggerGetPrimaryDiagnosis] = useLazyGetPrimaryPatientDiagnosisByEncounterIdQuery();
  const {
    data: latestPatientObservationsComplaints,
    refetch: refetchLatestPatientObservationsComplaints
  } = useGetLatestPatientObservationsComplaintsByEncounterIdQuery(
    { encounterId: encounter?.id },
    {
      skip: !encounter?.id
    }
  );

  // ── Current Medications ──────────────────────────────────────────────────
  const { data: currentMedicationsResponse } = useGetCurrentMedicationsQuery(
    { patientId: patient?.id, page: 0, size: 100 },
    { skip: !patient?.id }
  );

  const { data: activeIngredientsResponse } = useGetActiveIngredientsQuery(
    { page: 0, size: 1000 },
    { skip: !patient?.id }
  );

  const activeIngredientMap = useMemo(() => {
    const map = new Map<string, string>();
    activeIngredientsResponse?.data?.forEach((item: any) => {
      map.set(String(item.id), item.name);
    });
    return map;
  }, [activeIngredientsResponse]);

  const currentMeds = useMemo(
    () => currentMedicationsResponse?.data ?? [],
    [currentMedicationsResponse]
  );

  const getMedColor = () => ({
    bg: 'var(--light-blue, #dbeafe)',
    text: 'var(--primary-blue, #1d4ed8)'
  });
  // ─────────────────────────────────────────────────────────────────────────

  const patientConditionItems =
    latestPatientObservationsComplaints?.patientConditions
      ?.split(',')
      .map(item => item.trim())
      .filter(Boolean) || [];

  const getPatientConditionColors = () => {
    return {
      bg: 'var(--light-purple, #f3e8ff)',
      text: 'var(--primary-purple, #7e22ce)'
    };
  };

  const [triggerGetLatestPatientObservationsComplaints] =
    useLazyGetLatestPatientObservationsComplaintsByEncounterIdQuery();

  const fetchPatientImageResponse = useFetchAttachmentQuery(
    {
      type: 'PATIENT_PROFILE_PICTURE',
      refKey: patient?.id
    },
    { skip: !patient?.id }
  );

  const encounterIdNumber: number | null = encounter?.id ? Number(encounter.id) : null;

  const [fetchIcdByIds] = useLazyGetIcdDiagnosesByIdsQuery();
  const [icdMap, setIcdMap] = useState<Record<number, any>>({});

  const diagnosisIds = useMemo(() => {
    const id = Number(primaryDiagnosis?.diagnosisId);
    return Number.isFinite(id) && id > 0 ? [id] : [];
  }, [primaryDiagnosis]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!diagnosisIds.length) return;

      const missing = diagnosisIds.filter(id => !icdMap[id]);
      if (!missing.length) return;

      try {
        const resp = await fetchIcdByIds({ ids: missing, timestamp: Date.now() }).unwrap();
        if (cancelled) return;

        setIcdMap(prev => {
          const next = { ...prev };
          for (const dto of resp ?? []) {
            const id = Number((dto as any)?.id);
            if (Number.isFinite(id) && id > 0) next[id] = dto;
          }
          return next;
        });
      } catch {
        //
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [diagnosisIds, fetchIcdByIds, icdMap]);

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

  const loadPrimaryDiagnosis = async (encounterId: number | null) => {
    if (!encounterId) {
      setPrimaryDiagnosis(null);
      setPrimaryDiagnosisError(null);
      return;
    }

    try {
      const exists = await triggerExistsPrimaryDiagnosis({ encounterId }).unwrap();
      if (!exists) {
        setPrimaryDiagnosis(null);
        setPrimaryDiagnosisError(null);
        return;
      }

      const resp = await triggerGetPrimaryDiagnosis({
        encounterId,
        timestamp: Date.now()
      }).unwrap();

      setPrimaryDiagnosis(resp ?? null);
      setPrimaryDiagnosisError(null);
    } catch (error: any) {
      if (error?.status === 404) {
        setPrimaryDiagnosis(null);
        setPrimaryDiagnosisError(error);
        return;
      }

      setPrimaryDiagnosis(null);
      setPrimaryDiagnosisError(error);
    }
  };

  useEffect(() => {
    loadPrimaryDiagnosis(encounterIdNumber);
  }, [encounterIdNumber]);

  useEffect(() => {
    if (refetchList) {
      if (patient?.id) {
        triggerGetPrimaryDocument(patient?.id);
        refetchLatestBodyMeasurements();
      }

      if (encounter?.id) {
        triggerGetLatestVitalSigns({ encounterId: encounter?.id });
        triggerGetLatestPatientObservationsComplaints({ encounterId: encounter?.id });
        loadPrimaryDiagnosis(Number(encounter.id));
      }
    }
  }, [
    refetchList,
    triggerGetPrimaryDocument,
    triggerGetLatestVitalSigns,
    triggerGetLatestPatientObservationsComplaints,
    patient?.id,
    encounter?.id
  ]);

  useEffect(() => {
    if (refetchPatientSide) {
      if (patient?.id) {
        refetchPrimaryDocument();
      }

      if (encounter?.id) {
        refetchLatestVitalSigns();
        refetchLatestPatientObservationsComplaints();
        loadPrimaryDiagnosis(Number(encounter.id));
      }
      if (patient?.id) {
        refetchLatestBodyMeasurements();
      }

      dispatch(resetRefetchPatientSide());
    }
  }, [
    refetchPatientSide,
    refetchPrimaryDocument,
    refetchLatestVitalSigns,
    refetchLatestPatientObservationsComplaints,
    patient?.id,
    encounter?.id,
    dispatch
  ]);

  useEffect(() => {
    if (!refetchEncounter) return;

    const doRefetch = async () => {
      try {
        await Promise.all([
          refetchWarnings(),
          refetchAllergies(),
          patient?.id ? refetchPrimaryDocument() : Promise.resolve(),
          encounter?.id ? refetchLatestVitalSigns() : Promise.resolve(),
          patient?.id ? refetchLatestBodyMeasurements() : Promise.resolve(),
          encounter?.id ? loadPrimaryDiagnosis(Number(encounter.id)) : Promise.resolve(),
          encounter?.id ? refetchLatestPatientObservationsComplaints() : Promise.resolve()
        ]);
      } catch (e) {
        console.error('Error while refetching side data:', e);
      } finally {
        dispatch(resetRefetchEncounter());
      }
    };

    doRefetch();
  }, [
    refetchEncounter,
    refetchWarnings,
    refetchAllergies,
    refetchPrimaryDocument,
    refetchLatestVitalSigns,
    refetchLatestPatientObservationsComplaints,
    patient?.id,
    encounter?.id,
    dispatch
  ]);

  const handleImageClick = () => {
    if (patient?.key) profileImageFileInputRef.current?.click();
  };

  const getAllergenName = (allergenId: number, medicationClassId: number) => {
    if (allergenId && allergensListResponse?.data) {
      const allergen = allergensListResponse.data.find((item: any) => item.id === allergenId);
      return <p>{allergen?.name ?? '-'}</p>;
    }

    if (medicationClassId && medicationClassesListResponse) {
      const medicationClass = medicationClassesListResponse.find(
        (item: any) => item.id === medicationClassId
      );
      return <p>{medicationClass?.name ?? '-'}</p>;
    }

    return <p>-</p>;
  };

  const activeAllergies =
    allergiesListResponse?.data?.filter(allergy => allergy.status === 'ACTIVE') || [];
  const activeWarnings =
    warningsListResponse?.data?.filter(warning => warning.status === 'ACTIVE') || [];

  const getAllergySeverityColors = (severity: string) => {
    if (severity === 'MILD_MINOR') {
      return { bg: 'var(--light-green)', text: 'var(--primary-green)' };
    }
    if (severity === 'MODERATE') {
      return { bg: 'var(--light-orange)', text: 'var(--primary-orange)' };
    }
    return { bg: 'var(--light-red)', text: 'var(--primary-red)' };
  };

  const getDiagnosisColors = (row: any) => {
    if (row?.major) {
      return { bg: 'var(--light-red)', text: 'var(--primary-red)' };
    }
    if (row?.suspected) {
      return { bg: 'var(--light-orange)', text: 'var(--primary-orange)' };
    }
    return { bg: 'var(--light-blue)', text: 'var(--primary-blue)' };
  };

  const renderDiagnosisText = (row: any) => {
    const id = Number(row?.diagnosisId);
    const icd = id ? icdMap[id] : null;

    const code = icd?.icdCode ?? '';
    const desc = icd?.icdShortDescription || icd?.icdFullDescription || '';
    const type = row?.type ? formatEnumString(row.type) : '';
    const flags = [row?.major ? 'Major' : null, row?.suspected ? 'Suspected' : null]
      .filter(Boolean)
      .join(' • ');

    return (
      <div className="diagnosis-badge-text">
        <span>{code ? `${code} - ${desc}` : desc || 'Diagnosis'}</span>
        {(type || flags) && <small>{[type, flags].filter(Boolean).join(' • ')}</small>}
      </div>
    );
  };

  const temperature = toNumber(latestVitalSigns?.temperature);
  const pulseRate = toNumber(latestVitalSigns?.heartRate);
  const respiratoryRate = toNumber(latestVitalSigns?.respiratoryRate);
  const oxygenSaturation = toNumber(latestVitalSigns?.oxygenSaturation);
  const bloodPressureSystolic = toNumber(latestVitalSigns?.bloodPressureSystolic);
  const bloodPressureDiastolic = toNumber(latestVitalSigns?.bloodPressureDiastolic);

  const weight = toNumber(latestBodyMeasurements?.weight);
  const height = toNumber(latestBodyMeasurements?.height);
  const headCircumference = toNumber(latestBodyMeasurements?.headCircumference);

  const BLOOD_GROUP_LABELS: Record<string, string> = {
    A_POSITIVE: 'A+',
    A_NEGATIVE: 'A-',
    B_POSITIVE: 'B+',
    B_NEGATIVE: 'B-',
    AB_POSITIVE: 'AB+',
    AB_NEGATIVE: 'AB-',
    O_POSITIVE: 'O+',
    O_NEGATIVE: 'O-',
    UNKNOWN: 'Unknown'
  };
  const bloodGroupRaw = (latestPatientObservationsComplaints as any)?.bloodGroup ?? '';
  const bloodGroupLabel = bloodGroupRaw
    ? BLOOD_GROUP_LABELS[String(bloodGroupRaw)] ?? String(bloodGroupRaw)
    : '';

  const bmi =
    weight != null && height != null && height > 0 ? weight / Math.pow(height / 100, 2) : null;
  const bsa =
    weight != null && height != null && height > 0 ? Math.sqrt((weight * height) / 3600) : null;

  const documentTypeText = primaryDocument?.type
    ? formatEnumString(primaryDocument.type)
    : textOr(patient?.documentTypeLvalue?.lovDisplayVale, '');

  const documentNumberText = textOr(primaryDocument?.number, textOr(patient?.documentNo, ''));
  const primaryDiagnosisNotFound = primaryDiagnosisError?.status === 404;

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <Panel className="patient-panel" dir={dir}>
      {showCloseButton && setPatient && (
        <div className="patient-panel-close-btn">
          <IoMdClose
            size={22}
            className="icons-style"
            onClick={() => {
              if (typeof onClose === 'function') {
                onClose();
              } else {
                setPatient({ ...newPatient });
              }
            }}
          />
        </div>
      )}
      <div className="div-avatar">
        <Avatar
          circle
          bordered
          onClick={() => handleImageClick()}
          src={
            patientImage && patientImage.fileContent
              ? `data:${patientImage.contentType};base64,${patientImage.fileContent}`
              : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
          }
          alt={patient?.fullName}
        />

        <div>
          <div className="patient-info">
            <Text className="patient-name">
              {textOr(
                patient?.fullName
                  ? patient?.fullName
                  : `${patient?.firstName ?? ''} ${patient?.secondName ?? ''} ${
                      patient?.thirdName ?? ''
                    } ${patient?.lastName ?? ''}`.trim(),
                <Translate>Patient Name</Translate>
              )}
            </Text>
          </div>

          <div className="info-label"># {textOr(patient?.medicalRecordNumber, 'MRN')}</div>

          <div className="patient-extra-info">
            <span className="info-label">
              DOB:{' '}
              {textOr(
                patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '-'
              )}
            </span>
          </div>

          <div className="patient-extra-info">
            <span className="info-label">
              Gender:{' '}
              {textOr(patient?.sexAtBirth ? formatEnumString(patient?.sexAtBirth) : '-', '')}
            </span>
          </div>
        </div>
      </div>

      {showDocumentInfo && (
        <>
          <Text className="main-info-patient-side">
            <FontAwesomeIcon icon={faIdCard} className="icon-color" />{' '}
            <span className="section-title-patient-side">
              <Translate>Document Information</Translate>
            </span>
          </Text>
          <br />

          <div className="info-section">
            <div className="info-column">
              <Text className="info-label">
                <Translate>Document Type</Translate>
              </Text>
              <Text className="info-value">
                <Translate>{documentTypeText}</Translate>
              </Text>
            </div>

            <div className="info-column">
              <Text className="info-label">
                <Translate>Document No</Translate>
              </Text>
              <Text className="info-value">
                <Translate>{documentNumberText}</Translate>
              </Text>
            </div>
          </div>

          <Divider className="divider-style" />
        </>
      )}

      {showPatientInfo && (
        <>
          <Text className="main-info-patient-side">
            <FontAwesomeIcon icon={faUser} className="icon-color" />{' '}
            <span className="section-title-patient-side">
              <Translate>Patient Information</Translate>
            </span>
          </Text>
          <br />

          <div className="info-section">
            <div className="info-column">
              <Text className="info-label">
                <Translate>Age</Translate>
              </Text>
              <Text className="info-value">
                <Translate>
                  {patient?.dateOfBirth ? calculateAgeFormat(patient?.dateOfBirth) : ''}
                </Translate>
              </Text>
            </div>

            <div className="info-column">
              <Text className="info-label">
                <Translate>Gender</Translate>
              </Text>
              <Text className="info-value">
                <Translate>{textOr(formatEnumString(patient?.sexAtBirth), '')}</Translate>
              </Text>
            </div>
          </div>

          <div className="info-section">
            <div className="info-column">
              <Text className="info-label">
                <Translate>Blood Group</Translate>
              </Text>
              <Text className="info-value">{textOr(bloodGroupLabel, '')}</Text>
            </div>
          </div>

          <Divider className="divider-style" />
        </>
      )}

      {showMeasurements && (
        <>
          <Text className="main-info-patient-side">
            <FaWeight className="icon-color" />{' '}
            <span className="section-title-patient-side">
              <Translate>Measurements</Translate>
            </span>
          </Text>

          <div className="details-sections">
            <br />

            <div className="info-section">
              <div className="info-column">
                <Text className="info-label">
                  <Translate>Weight</Translate>
                </Text>
                <Text className="info-value">
                  {fmt(weight, 2, '')}
                  {weight != null ? ' kg' : ''}
                </Text>
              </div>

              <div className="info-column">
                <Text className="info-label">
                  <Translate>Height</Translate>
                </Text>
                <Text className="info-value">
                  {fmt(height, 2, '')}
                  {height != null ? ' cm' : ''}
                </Text>
              </div>
            </div>

            <div className="info-section">
              <div className="info-column">
                <Text className="info-label">
                  <Translate>H.C</Translate>
                </Text>
                <Text className="info-value">
                  {fmt(headCircumference, 2, '')}
                  {headCircumference != null ? ' cm' : ''}
                </Text>
              </div>
            </div>

            <div className="info-section">
              <div className="info-column">
                <Text className="info-label">
                  <Translate>BMI</Translate>
                </Text>
                <Text className="info-value">{fmt(bmi, 2, '')}</Text>
              </div>
              <div className="info-column">
                <Text className="info-label">
                  <Translate>BSA</Translate>
                </Text>
                <Text className="info-value">{fmt(bsa, 2, '')}</Text>
              </div>
            </div>

            <div className="info-section">
              <div className="info-column">
                <Text className="info-label">
                  <Translate>Temperature</Translate>
                </Text>
                <Text className="info-value">
                  {fmt(temperature, 1, '')}
                  {temperature != null ? ' °C' : ''}
                </Text>
              </div>

              <div className="info-column">
                <Text className="info-label">
                  <Translate>Pulse Rate</Translate>
                </Text>
                <Text className="info-value">
                  {fmt(pulseRate, 0, '')}
                  {pulseRate != null ? ' bpm' : ''}
                </Text>
              </div>
            </div>

            <div className="info-section">
              <div className="info-column">
                <Text className="info-label">
                  <Translate>Respiratory Rate</Translate>
                </Text>
                <Text className="info-value">
                  {fmt(respiratoryRate, 0, '')}
                  {respiratoryRate != null ? ' /min' : ''}
                </Text>
              </div>

              <div className="info-column">
                <Text className="info-label">
                  <Translate>Oxygen Saturation</Translate>
                </Text>
                <Text className="info-value">
                  {fmt(oxygenSaturation, 0, '')}
                  {oxygenSaturation != null ? ' %' : ''}
                </Text>
              </div>
            </div>

            <div className="info-section">
              <div className="info-column">
                <Text className="info-label">
                  <Translate>Blood Pressure</Translate>
                </Text>
                <Text className="info-value">
                  {bloodPressureSystolic != null && bloodPressureDiastolic != null
                    ? `${fmt(bloodPressureSystolic, 0, '')}/${fmt(
                        bloodPressureDiastolic,
                        0,
                        ''
                      )} mmHg`
                    : ''}
                </Text>
              </div>

              <div className="info-column" />
            </div>
          </div>

          <Divider className="divider-style" />
        </>
      )}

      {showDiagnosis && (
        <>
          <Text className="main-info-patient-side">
            <FontAwesomeIcon icon={faStethoscope} className="icon-color" />{' '}
            <span className="section-title-patient-side">
              <Translate>Diagnosis</Translate>
            </span>
          </Text>
          <br />

          <div className="my-container">
            {primaryDiagnosis && (
              <Whisper
                key={`diagnosis-whisper-${primaryDiagnosis.id}`}
                placement="top"
                speaker={
                  <Tooltip>
                    <Translate>Primary Diagnosis</Translate>
                  </Tooltip>
                }
              >
                <span>
                  <MyBadgeStatus
                    key={`diagnosis-${primaryDiagnosis.id}`}
                    backgroundColor={getDiagnosisColors(primaryDiagnosis).bg}
                    color={getDiagnosisColors(primaryDiagnosis).text}
                    contant={
                      <div className="diagnosis-badge-content">
                        <FontAwesomeIcon icon={faStethoscope} className="diagnosis-badge-icon" />
                        <Translate>{renderDiagnosisText(primaryDiagnosis)}</Translate>
                      </div>
                    }
                  />
                </span>
              </Whisper>
            )}

            {!primaryDiagnosis && primaryDiagnosisNotFound && (
              <Text className="info-value">
                <Translate>No primary diagnosis for this encounter.</Translate>
              </Text>
            )}
          </div>

          <Divider className="divider-style" />
        </>
      )}

      {showVisitDetails && (
        <>
          <Text className="main-info-patient-side">
            <FontAwesomeIcon icon={faFileWaveform} className="icon-color" />{' '}
            <span className="section-title-patient-side">
              {encounter?.encounterType !== 'INPATIENT' ? (
                <Translate>Visit Details</Translate>
              ) : (
                <Translate>Admission Details</Translate>
              )}
            </span>
          </Text>

          {encounter?.encounterType !== 'INPATIENT' && (
            <div className="details-sections">
              <br />

              <div className="info-section">
                <div className="info-column">
                  <Text className="info-label">
                    <Translate>Visit Date</Translate>
                  </Text>
                  <Text className="info-value">
                    <Translate>{textOr(encounter?.encounterDate, '')}</Translate>
                  </Text>
                </div>

                <div className="info-column">
                  <Text className="info-label">
                    <Translate>Visit ID</Translate>
                  </Text>
                  <Text className="info-value">
                    <Translate>{textOr(encounter?.encounterNumber, '')}</Translate>
                  </Text>
                </div>
              </div>

              <div className="info-section">
                <div className="info-column">
                  <Text className="info-label">
                    <Translate>Priority</Translate>
                  </Text>
                  <Text className="info-value">
                    <Translate>{textOr(formatEnumString(encounter?.priority), '')}</Translate>
                  </Text>
                </div>
              </div>

              <div className="info-section">
                <div className="info-column">
                  <Text className="info-label">
                    <Translate>Reason</Translate>
                  </Text>
                  <Text className="info-value">
                    <Translate>
                      {textOr(formatEnumString(encounter?.encounterReason), '')}
                    </Translate>
                  </Text>
                </div>

                <div className="info-column">
                  <Text className="info-label">
                    <Translate>Origin</Translate>
                  </Text>
                  <Text className="info-value">
                    <Translate>{textOr(encounter?.originName, '')}</Translate>
                  </Text>
                </div>
              </div>
            </div>
          )}

          {encounter?.encounterType === 'INPATIENT' && (
            <div className="details-sections">
              <div className="info-section">
                <div className="info-column">
                  <Text className="info-label">
                    <Translate>Room</Translate>
                  </Text>
                  <Text className="info-value">
                    <Translate>{textOr(encounter?.apRoom?.name, '')}</Translate>
                  </Text>
                </div>

                <div className="info-column">
                  <Text className="info-label">
                    <Translate>Bed</Translate>
                  </Text>
                  <Text className="info-value">
                    <Translate>{textOr(encounter?.apBed?.name, '')}</Translate>
                  </Text>
                </div>
              </div>

              <div className="info-section">
                <div className="info-column">
                  <Text className="info-label">
                    <Translate>Ward</Translate>
                  </Text>
                  <Text className="info-value">
                    <Translate>{textOr(encounter?.departmentName, '')}</Translate>
                  </Text>
                </div>

                <div className="info-column">
                  <Text className="info-label">
                    <Translate>Date of Admission</Translate>
                  </Text>
                  <Text className="info-value">
                    <Translate>{textOr(encounter?.actualStartDate, '')}</Translate>
                  </Text>
                </div>
              </div>
            </div>
          )}

          <Divider className="divider-style" />
        </>
      )}

      {showAllergiesWarnings && (
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
                      <Translate>
                        {getAllergenName(allergy?.allergenId, allergy?.medicationClassId)}
                      </Translate>
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
                      <FontAwesomeIcon
                        icon={faTriangleExclamation}
                        className="diagnosis-badge-icon"
                      />
                      <Translate>{warning.warning}</Translate>
                    </div>
                  }
                />
              </span>
            </Whisper>
          ))}
        </div>
      )}

      {showConditions && (
        <>
          <Text className="main-info-patient-side">
            <FontAwesomeIcon icon={faStethoscope} className="icon-color" />{' '}
            <span className="section-title-patient-side">
              <Translate>Condition</Translate>
            </span>
          </Text>
          <br />

          <div className="container-of-allergies-and-warnings">
            {patientConditionItems.length > 0 ? (
              patientConditionItems.map((condition, index) => (
                <Whisper
                  key={`patient-condition-whisper-${index}`}
                  placement="top"
                  speaker={
                    <Tooltip>
                      <Translate>Patient Condition</Translate>
                    </Tooltip>
                  }
                >
                  <span>
                    <MyBadgeStatus
                      key={`patient-condition-${index}`}
                      backgroundColor={getPatientConditionColors().bg}
                      color={getPatientConditionColors().text}
                      contant={
                        <div className="diagnosis-badge-content">
                          <FontAwesomeIcon icon={faStethoscope} className="diagnosis-badge-icon" />
                          <p>
                            <Translate>{formatEnumString(condition)}</Translate>
                          </p>
                        </div>
                      }
                    />
                  </span>
                </Whisper>
              ))
            ) : (
              <Text className="info-value">
                <Translate>No conditions found.</Translate>
              </Text>
            )}
          </div>

          <Divider className="divider-style" />
        </>
      )}

      {/* ── Current Meds Section ─────────────────────────────────────────── */}
      {showCurrentMeds && (
        <>
          <Text className="main-info-patient-side">
            <FontAwesomeIcon icon={faPills} className="icon-color" />{' '}
            <span className="section-title-patient-side">
              <Translate>Current Meds</Translate>
            </span>
          </Text>
          <br />

          <div className="container-of-allergies-and-warnings">
            {currentMeds.length > 0 ? (
              currentMeds.map((med: any, index: number) => {
                const medName =
                  activeIngredientMap.get(String(med.activeIngredientId)) ?? 'Unknown';
                return (
                  <Whisper
                    key={`med-whisper-${med.id ?? index}`}
                    placement="top"
                    speaker={
                      <Tooltip>
                        {med.instructions ? (
                          <Translate>{med.instructions}</Translate>
                        ) : (
                          <Translate>Current Medication</Translate>
                        )}
                      </Tooltip>
                    }
                  >
                    <span>
                      <MyBadgeStatus
                        key={`med-${med.id ?? index}`}
                        backgroundColor={getMedColor().bg}
                        color={getMedColor().text}
                        contant={
                          <div className="diagnosis-badge-content">
                            <FontAwesomeIcon icon={faPills} className="diagnosis-badge-icon" />
                            <p>
                              <Translate>{medName}</Translate>
                            </p>
                          </div>
                        }
                      />
                    </span>
                  </Whisper>
                );
              })
            ) : (
              <Text className="info-value">
                <Translate>No current medications.</Translate>
              </Text>
            )}
          </div>

          <Divider className="divider-style" />
        </>
      )}
      {/* ─────────────────────────────────────────────────────────────────── */}

      {showBalance && balance && (
        <div>
          <Text className="main-info-patient-side">
            <FontAwesomeIcon icon={faScaleBalanced} className="icon-color" />{' '}
            <span className="section-title-patient-side">
              <Translate>Balance</Translate>
            </span>
          </Text>
          <br />

          <div className="info-section">
            <div className="info-column">
              <Text className="info-label">
                <Translate>Free Balance</Translate>
              </Text>
              <Text className="info-value">
                <Translate>{balance?.freeBalance}</Translate>
              </Text>
            </div>

            <div className="info-column">
              <Text className="info-label">
                <Translate>Outstanding</Translate>
              </Text>
              <Text className="info-value">
                <Translate>{balance?.outstanding}</Translate>
              </Text>
            </div>
          </div>

          <Divider className="divider-style" />
        </div>
      )}
    </Panel>
  );
};

export default PatientSide;
