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
  useGetLatestBodyMeasurementsByEncounterIdQuery,
  useLazyGetLatestBodyMeasurementsByEncounterIdQuery
} from '@/services/medicalsheetsEncounter/observations/bodyMeasurementsService';
import { useGetPatientDiagnosesByPatientIdQuery } from '@/services/medicalsheetsEncounter/clinicalVisit/patientDiagnosisService';
import { useLazyGetIcdDiagnosesByIdsQuery } from '@/services/setup/icdTreeService';
import {
  useGetPrimaryDocumentByPatientQuery,
  useLazyGetPrimaryDocumentByPatientQuery
} from '@/services/patients/patientDocumentsService';
import { useGetAllergensQuery } from '@/services/setup/allergensService';
import { useGetAllMedicationCategoriesClassesQuery } from '@/services/setup/medication-categories/MedicationCategoriesClassService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
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
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaWeight } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, Button, Divider, Panel, Text, Tooltip, Whisper } from 'rsuite';
import './styles.less';

const PatientSide = ({ patient, encounter, refetchList = null, ...props }) => {
  const profileImageFileInputRef = useRef(null);
  const [patientImage, setPatientImage] = useState<ApAttachment>(undefined);
  const dispatch = useDispatch();

  const refetchPatientSide = useSelector(
    (state: RootState) => state.refetchPatientSide.refetchPatientSide
  );
  const refetchEncounter = useSelector((state: any) => state?.refetch?.refetchEncounter);
  const { data: patOriginLovQueryResponse } = useGetLovValuesByCodeQuery('PAT_ORIGIN');

  const toNumber = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const fmt = (v: number | null | undefined, digits = 2, fallback = '') =>
    Number.isFinite(v as number) ? (v as number).toFixed(digits) : fallback;

  const textOr = (v: any, fallback = '') => (v == null || v === '' ? fallback : v);

  const { data: allergensListResponse } = useGetAllergensQuery({});
  const { data: medicationClassesListResponse } = useGetAllMedicationCategoriesClassesQuery({});

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

  const {
    data: primaryDocument,
    refetch: refetchPrimaryDocument
  } = useGetPrimaryDocumentByPatientQuery(patient?.id, {
    skip: !patient?.id
  });

  const [triggerGetPrimaryDocument] = useLazyGetPrimaryDocumentByPatientQuery();

  const {
    data: latestVitalSigns,
    refetch: refetchLatestVitalSigns
  } = useGetLatestVitalSignsByEncounterIdQuery(
    { encounterId: encounter?.id },
    {
      skip: !encounter?.id
    }
  );

  const [triggerGetLatestVitalSigns] = useLazyGetLatestVitalSignsByEncounterIdQuery();

  const {
    data: latestBodyMeasurements,
    refetch: refetchLatestBodyMeasurements
  } = useGetLatestBodyMeasurementsByEncounterIdQuery(
    { encounterId: encounter?.id },
    {
      skip: !encounter?.id
    }
  );

  const [triggerGetLatestBodyMeasurements] = useLazyGetLatestBodyMeasurementsByEncounterIdQuery();

  const fetchPatientImageResponse = useFetchAttachmentQuery(
    {
      type: 'PATIENT_PROFILE_PICTURE',
      refKey: patient?.id
    },
    { skip: !patient?.id }
  );

  const patientIdNumber: number | null = patient?.id ? Number(patient.id) : null;

  const [diagnosisPagination, setDiagnosisPagination] = useState({
    page: 0,
    size: 5,
    sort: 'createdDate,desc'
  });

  const [diagnosisItems, setDiagnosisItems] = useState<any[]>([]);
  const [hasMoreDiagnoses, setHasMoreDiagnoses] = useState(false);

  const {
    data: patientDiagnosesResp,
    isFetching: isFetchingDiagnoses,
    refetch: refetchDiagnoses
  } = useGetPatientDiagnosesByPatientIdQuery(
    {
      patientId: patientIdNumber as any,
      page: diagnosisPagination.page,
      size: diagnosisPagination.size,
      sort: diagnosisPagination.sort
    } as any,
    { skip: !patientIdNumber }
  );

  const currentDiagnosisPage = useMemo(
    () => (Array.isArray(patientDiagnosesResp) ? patientDiagnosesResp : []),
    [patientDiagnosesResp]
  );

  useEffect(() => {
    if (!patientIdNumber) {
      setDiagnosisItems([]);
      setHasMoreDiagnoses(false);
      return;
    }

    if (diagnosisPagination.page === 0) {
      setDiagnosisItems(currentDiagnosisPage);
    } else if (currentDiagnosisPage.length > 0) {
      setDiagnosisItems(prev => {
        const merged = [...prev, ...currentDiagnosisPage];
        const unique = merged.filter(
          (item, index, arr) => index === arr.findIndex(x => x?.id === item?.id)
        );
        return unique;
      });
    }

    setHasMoreDiagnoses(currentDiagnosisPage.length === diagnosisPagination.size);
  }, [currentDiagnosisPage, diagnosisPagination.page, diagnosisPagination.size, patientIdNumber]);

  const [fetchIcdByIds] = useLazyGetIcdDiagnosesByIdsQuery();
  const [icdMap, setIcdMap] = useState<Record<number, any>>({});

  const diagnosisIds = useMemo(() => {
    const ids = (diagnosisItems ?? [])
      .map((r: any) => Number(r?.diagnosisId))
      .filter((v: any) => Number.isFinite(v) && v > 0);
    return Array.from(new Set(ids));
  }, [diagnosisItems]);

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

  useEffect(() => {
    if (refetchList) {
      if (patient?.id) {
        triggerGetPrimaryDocument(patient?.id);
        setDiagnosisPagination(prev => ({ ...prev, page: 0 }));
      }

      if (encounter?.id) {
        triggerGetLatestVitalSigns({ encounterId: encounter?.id });
        triggerGetLatestBodyMeasurements({ encounterId: encounter?.id });
      }

      if (patientIdNumber) {
        refetchDiagnoses();
      }
    }
  }, [
    refetchList,
    triggerGetPrimaryDocument,
    triggerGetLatestVitalSigns,
    triggerGetLatestBodyMeasurements,
    refetchDiagnoses,
    patient?.id,
    patientIdNumber,
    encounter?.id
  ]);

  const handleImageClick = () => {
    if (patient?.key) profileImageFileInputRef.current?.click();
  };

  useEffect(() => {
    if (refetchPatientSide) {
      if (patient?.id) {
        refetchPrimaryDocument();
        setDiagnosisPagination(prev => ({ ...prev, page: 0 }));
      }

      if (encounter?.id) {
        refetchLatestVitalSigns();
        refetchLatestBodyMeasurements();
      }

      if (patientIdNumber) {
        refetchDiagnoses();
      }

      dispatch(resetRefetchPatientSide());
    }
  }, [
    refetchPatientSide,
    refetchPrimaryDocument,
    refetchLatestVitalSigns,
    refetchLatestBodyMeasurements,
    refetchDiagnoses,
    patient?.id,
    patientIdNumber,
    encounter?.id,
    dispatch
  ]);

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

  useEffect(() => {
    if (!refetchEncounter) return;

    const doRefetch = async () => {
      try {
        await Promise.all([
          refetchWarnings(),
          patient?.id ? refetchPrimaryDocument() : Promise.resolve(),
          encounter?.id ? refetchLatestVitalSigns() : Promise.resolve(),
          encounter?.id ? refetchLatestBodyMeasurements() : Promise.resolve(),
          patientIdNumber ? refetchDiagnoses() : Promise.resolve()
        ]);
        setDiagnosisPagination(prev => ({ ...prev, page: 0 }));
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
    refetchPrimaryDocument,
    refetchLatestVitalSigns,
    refetchLatestBodyMeasurements,
    refetchDiagnoses,
    patient?.id,
    patientIdNumber,
    encounter?.id,
    dispatch
  ]);

  const { data: allergiesListResponse } = useGetPatientAllergiesByPatientIdQuery(
    {
      patientId: patient?.id,
      showCancelled: false
    },
    {
      skip: !patient?.id
    }
  );

  const activeAllergies =
    allergiesListResponse?.data?.filter(allergy => allergy.status === 'ACTIVE') || [];
  const activeWarnings =
    warningsListResponse?.data?.filter(warning => warning.status === 'ACTIVE') || [];

  const getAllergySeverityColors = (severity: string) => {
    if (severity === 'MILD_MINOR') {
      return { bg: 'var(--light-green)', text: 'var(--primary-green)' };
    } else if (severity === 'MODERATE') {
      return { bg: 'var(--light-orange)', text: 'var(--primary-orange)' };
    } else {
      return { bg: 'var(--light-red)', text: 'var(--primary-red)' };
    }
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
    const flags = [
      row?.major ? 'Major' : null,
      row?.suspected ? 'Suspected' : null
    ].filter(Boolean).join(' • ');

    return (
      <div className="diagnosis-badge-text">
        <span>{code ? `${code} - ${desc}` : desc || 'Diagnosis'}</span>
        {(type || flags) && (
          <small>{[type, flags].filter(Boolean).join(' • ')}</small>
        )}
      </div>
    );
  };

  const loadMoreDiagnoses = () => {
    if (isFetchingDiagnoses || !hasMoreDiagnoses) return;
    setDiagnosisPagination(prev => ({ ...prev, page: prev.page + 1 }));
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

  const bmi =
    weight != null && height != null && height > 0 ? weight / Math.pow(height / 100, 2) : null;
  const bsa =
    weight != null && height != null && height > 0 ? Math.sqrt((weight * height) / 3600) : null;

  const documentTypeText = primaryDocument?.type
    ? formatEnumString(primaryDocument.type)
    : textOr(patient?.documentTypeLvalue?.lovDisplayVale, '');

  const documentNumberText = textOr(primaryDocument?.number, textOr(patient?.documentNo, ''));

  return (
    <Panel className="patient-panel">
      {props?.setPatient && (
        <div className="patient-panel-close-btn">
          <IoMdClose
            size={22}
            className="icons-style"
            onClick={() => props?.setPatient({ ...newPatient })}
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
              {textOr(patient?.firstName + ' ' + patient?.lastName, 'Patient Name')}
            </Text>
          </div>
          <div className="info-label"># {textOr(patient?.medicalRecordNumber, 'MRN')}</div>
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
          <Text className="info-value">{documentTypeText}</Text>
        </div>

        <div className="info-column">
          <Text className="info-label">Document No</Text>
          <Text className="info-value">{documentNumberText}</Text>
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
          <Text className="info-value">
            {patient?.dateOfBirth ? calculateAgeFormat(patient?.dateOfBirth) : ''}
          </Text>
        </div>

        <div className="info-column">
          <Text className="info-label">Gender</Text>
          <Text className="info-value">{textOr(formatEnumString(patient?.sexAtBirth), '')}</Text>
        </div>
      </div>

      <Divider className="divider-style" />

      <Text className="main-info-patient-side">
        <FaWeight className="icon-color" />{' '}
        <span className="section-title-patient-side">Measurements</span>
      </Text>

      <div className="details-sections">
        <br />

        <div className="info-section">
          <div className="info-column">
            <Text className="info-label">Weight</Text>
            <Text className="info-value">
              {fmt(weight, 2, '')}
              {weight != null ? ' kg' : ''}
            </Text>
          </div>

          <div className="info-column">
            <Text className="info-label">Height</Text>
            <Text className="info-value">
              {fmt(height, 2, '')}
              {height != null ? ' cm' : ''}
            </Text>
          </div>
        </div>

        <div className="info-section">
          <div className="info-column">
            <Text className="info-label">H.C</Text>
            <Text className="info-value">
              {fmt(headCircumference, 2, '')}
              {headCircumference != null ? ' cm' : ''}
            </Text>
          </div>
        </div>

        <div className="info-section">
          <div className="info-column">
            <Text className="info-label">BMI</Text>
            <Text className="info-value">{fmt(bmi, 2, '')}</Text>
          </div>
          <div className="info-column">
            <Text className="info-label">BSA</Text>
            <Text className="info-value">{fmt(bsa, 2, '')}</Text>
          </div>
        </div>

        <div className="info-section">
          <div className="info-column">
            <Text className="info-label">Temperature</Text>
            <Text className="info-value">
              {fmt(temperature, 1, '')}
              {temperature != null ? ' °C' : ''}
            </Text>
          </div>

          <div className="info-column">
            <Text className="info-label">Pulse Rate</Text>
            <Text className="info-value">
              {fmt(pulseRate, 0, '')}
              {pulseRate != null ? ' bpm' : ''}
            </Text>
          </div>
        </div>

        <div className="info-section">
          <div className="info-column">
            <Text className="info-label">Respiratory Rate</Text>
            <Text className="info-value">
              {fmt(respiratoryRate, 0, '')}
              {respiratoryRate != null ? ' /min' : ''}
            </Text>
          </div>

          <div className="info-column">
            <Text className="info-label">Oxygen Saturation</Text>
            <Text className="info-value">
              {fmt(oxygenSaturation, 0, '')}
              {oxygenSaturation != null ? ' %' : ''}
            </Text>
          </div>
        </div>

        <div className="info-section">
          <div className="info-column">
            <Text className="info-label">Blood Pressure</Text>
            <Text className="info-value">
              {bloodPressureSystolic != null && bloodPressureDiastolic != null
                ? `${fmt(bloodPressureSystolic, 0, '')}/${fmt(bloodPressureDiastolic, 0, '')} mmHg`
                : ''}
            </Text>
          </div>

          <div className="info-column" />
        </div>
      </div>

      <Divider className="divider-style" />

      <Text className="main-info-patient-side">
        <FontAwesomeIcon icon={faStethoscope} className="icon-color" />{' '}
        <span className="section-title-patient-side">Diagnosis</span>
      </Text>
      <br />

      <div className="my-container">
        {diagnosisItems.map((diagnosis, index) => {
          const colors = getDiagnosisColors(diagnosis);

          return (
            <Whisper
              key={`diagnosis-whisper-${diagnosis.id || index}`}
              placement="top"
              speaker={
                <Tooltip>
                  <Translate>Diagnosis</Translate>
                </Tooltip>
              }
            >
              <span>
                <MyBadgeStatus
                  key={`diagnosis-${diagnosis.id || index}`}
                  backgroundColor={colors.bg}
                  color={colors.text}
                  contant={
                    <div className="diagnosis-badge-content">
                      <FontAwesomeIcon icon={faStethoscope} className="diagnosis-badge-icon" />
                      {renderDiagnosisText(diagnosis)}
                    </div>
                  }
                />
              </span>
            </Whisper>
          );
        })}
      </div>

      {hasMoreDiagnoses && (
        <div className="load-more-wrapper">
          <button
            className="load-more-btn"
            onClick={loadMoreDiagnoses}
            disabled={isFetchingDiagnoses}
          >
            {isFetchingDiagnoses ? (
              <span className="load-more-spinner" />
            ) : (
              <span className="load-more-chevrons">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            )}
          </button>
        </div>
      )}

      <Divider className="divider-style" />

      {!props?.hideVisitDetails && (
        <Text className="main-info-patient-side">
          <FontAwesomeIcon icon={faFileWaveform} className="icon-color" />{' '}
          <span className="section-title-patient-side">
            {encounter?.encounterType !== 'INPATIENT' ? 'Visit Details' : 'Admission Details'}
          </span>
        </Text>
      )}

      {encounter?.encounterType !== 'INPATIENT' && !props?.hideVisitDetails && (
        <div className="details-sections">
          <br />

          <div className="info-section">
            <div className="info-column">
              <Text className="info-label">Visit Date</Text>
              <Text className="info-value">{textOr(encounter?.encounterDate, '')}</Text>
            </div>

            <div className="info-column">
              <Text className="info-label">Visit ID</Text>
              <Text className="info-value">{textOr(encounter?.encounterNumber, '')}</Text>
            </div>
          </div>

          <div className="info-section">
            <div className="info-column">
              <Text className="info-label">Priority</Text>
              <Text className="info-value">{textOr(formatEnumString(encounter?.priority), '')}</Text>
            </div>
          </div>

          <div className="info-section">
            <div className="info-column">
              <Text className="info-label">Reason</Text>
              <Text className="info-value">
                {textOr(formatEnumString(encounter?.encounterReason), '')}
              </Text>
            </div>

            <div className="info-column">
              <Text className="info-label">Origin</Text>
              <Text className="info-value">{textOr(encounter?.originName, '')}</Text>
            </div>
          </div>
        </div>
      )}

      {encounter?.encounterType === 'INPATIENT' && (
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
        </>
      )}

      <div className="my-container">
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
                    <FontAwesomeIcon icon={faHandDots} className="diagnosis-badge-icon" />
                    {warning.warning}
                  </div>
                }
              />
            </span>
          </Whisper>
        ))}
      </div>

      {props?.balance && (
        <div>
          <Text className="main-info-patient-side">
            <FontAwesomeIcon icon={faScaleBalanced} className="icon-color" />{' '}
            <span className="section-title-patient-side">Balance</span>
          </Text>
          <br />

          <div className="info-section">
            <div className="info-column">
              <Text className="info-label">Free Balance</Text>
              <Text className="info-value">{props?.balance?.freeBalance}</Text>
            </div>

            <div className="info-column">
              <Text className="info-label">Outstanding</Text>
              <Text className="info-value">{props?.balance?.outstanding}</Text>
            </div>
          </div>

          <Divider className="divider-style" />
        </div>
      )}
    </Panel>
  );
};

export default PatientSide;
