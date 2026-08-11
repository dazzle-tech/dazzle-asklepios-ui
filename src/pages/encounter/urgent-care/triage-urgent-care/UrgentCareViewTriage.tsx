import React, { useEffect, useMemo, useState } from 'react';
import PatientSide from '../../encounter-main-info-section/PatienSide';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles.less';
import BackButton from '@/components/BackButton/BackButton';
import { useAppDispatch } from '@/hooks';
import { Row, Form, Divider } from 'rsuite';
import { useGetLatestEmergencyTriageByEncounterQuery } from '@/services/encounters/er-triage/emergencyTriageService';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyLabel from '@/components/MyLabel';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { useEnumOptions } from '@/services/enumsApi';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
import Allergies from "@/pages/encounter/encounter-pre-observations-new/AllergiesNurse/Allergies";

import EmergencyLevelAssessment from './component/EmergencyLevelAssessment';
import VitalSigns from '@/pages/medical-component/vital-signs/VitalSigns';
import type { ApEncounter } from '@/types/model-types';
import GlasgowComaScale from "@/pages/encounter/encounter-component/glasgow-coma-scale";
import BodyMeasurements from "@/pages/encounter/encounter-pre-observations-new/observations/BodyMeasurements";


  type Props = {
    patient?: any;
    encounter?: any;
  };

  const UrgentCareViewTriage: React.FC<Props> = ({
    patient: patientProp,
    encounter: encounterProp
  }) => {
    const location = useLocation();

    const propsData: any =
      patientProp && encounterProp
        ? {
            patient: patientProp,
            encounter: encounterProp
          }
        : location.state ?? {};
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const isModalMode = !!(patientProp && encounterProp);
  const patient = propsData?.patient ?? {};
  const [encounter, setEncounter] = useState<ApEncounter>({ ...(propsData?.encounter ?? {}) });
  const [triage, setTriage] = useState<any>({});
  const [refetchPatientObservations] = useState(false);

  const emergencyLevelEnumOptions = useEnumOptions('EmergencyLevel');
  const encounterPriorityEnumOptions = useEnumOptions('EncounterPriority');

  const emergencyLevelColorMap = useMemo(() => {
    const byValue: Record<string, string> = {
      RESUSCITATION: '#7f1d1d',
      EMERGENT: '#dc2626',
      URGENT: '#f97316',
      LESS_URGENT: '#eab308',
      NON_URGENT: '#16a34a',
    };

    const palette = ['#dc2626', '#f97316', '#eab308', '#16a34a', '#0ea5e9', '#7c3aed'];
    const m = new Map<string, string>();

    emergencyLevelEnumOptions.forEach((opt, idx) => {
      if (opt?.value == null) return;
      const key = String(opt.value);
      const mapped = byValue[String(opt.value).toUpperCase()];
      m.set(key, mapped ?? palette[idx % palette.length]);
    });

    return m;
  }, [emergencyLevelEnumOptions]);

  const selectedEmergencyLevel = emergencyLevelEnumOptions.find(
    (item: any) => item.value === triage?.emergencyLevel
  );

  const encounterPriorityValue =
    (encounter as any)?.priorityLevel ??
    (encounter as any)?.encounterPriority ??
    (encounter as any)?.encounterPriorityLkey ??
    null;

  const selectedEncounterPriority = encounterPriorityEnumOptions.find(
    (item: any) => String(item?.value) === String(encounterPriorityValue ?? '')
  );

  const encounterPriorityLabel =
    selectedEncounterPriority?.label ??
    (encounterPriorityValue != null ? String(encounterPriorityValue) : '');

  const encounterPriorityIsUrgent = useMemo(() => {
    const v = String(
      selectedEncounterPriority?.label ??
        selectedEncounterPriority?.value ??
        encounterPriorityValue ??
        ''
    ).toUpperCase();

    return (
      v.includes('URGENT') ||
      v.includes('CRITICAL') ||
      v.includes('STAT') ||
      v.includes('EMERG')
    );
  }, [selectedEncounterPriority, encounterPriorityValue]);

  const encounterPriorityColor = encounterPriorityIsUrgent ? '#dc2626' : '#16a34a';

  const toNumberOrNaN = (v: unknown) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() !== '') return Number(v);
    return Number.NaN;
  };

  const encounterId = toNumberOrNaN(propsData?.encounter?.id ?? propsData?.encounter?.key);
  const patientId = toNumberOrNaN(patient?.id ?? patient?.patientId ?? patient?.key);

  const { data: emergencyTriageNew } = useGetLatestEmergencyTriageByEncounterQuery(
    encounterId as any,
    {
      skip: !encounterId || Number.isNaN(encounterId),
    }
  );

  const divContent = 'Urgent Care View Triage';

  useEffect(() => {
    if (propsData?.encounter) {
      setEncounter({ ...propsData.encounter });
    }
  }, [propsData?.encounter]);

  useEffect(() => {
    if (emergencyTriageNew?.id) {
      setTriage((prev: any) => ({ ...prev, ...emergencyTriageNew }));
    }
  }, [emergencyTriageNew]);

  useEffect(() => {
    dispatch(setPageCode('Urgent_Care_View_Triage'));
    dispatch(setDivContent(divContent));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [dispatch]);

const handleGoBack = () => {
  if (isModalMode) return;

  if (propsData?.from === 'UrgentCare') {
    navigate('/urgent-care-triage');
  } else {
    navigate(-1);
  }
};

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div className="er-main-container" dir={dir}>
      <div className="left-box">
        <div className="bt-field-div">

          {!isModalMode && (
            <BackButton onClick={handleGoBack} />
          )} 
         <div className="bt-right">
            <Form fluid className="patient-priority-er-level-handle-position">
              <MyLabel label="Emergency Level" />
              {triage?.emergencyLevel && (
                <MyBadgeStatus
                  color={emergencyLevelColorMap.get(String(triage?.emergencyLevel)) ?? '#98A2B4'}
                  contant={selectedEmergencyLevel?.label ?? triage?.emergencyLevel}
                />
              )}

              <MyLabel label="Priority" />
              {encounterPriorityLabel && (
                <MyBadgeStatus
                  color={encounterPriorityColor}
                  contant={encounterPriorityLabel}
                />
              )}
            </Form>
          </div>
        </div>

        <Row gutter={30}>
          <Divider />
        </Row>

        <Row gutter={30}>
          <EmergencyLevelAssessment
            triage={triage}
            setTriage={setTriage}
            onSave={() => {}}
            readOnly
          />
        </Row>

        <Row gutter={30}>
          {!Number.isNaN(patientId) && !Number.isNaN(encounterId) && (
            <VitalSigns
              patientId={patientId}
              encounterId={encounterId}
              isTriage
              disabled
              title="Vital Signs"
            />
          )}
        </Row>

        <Row gutter={30}>
                {!Number.isNaN(patientId) && !Number.isNaN(encounterId) && (
                  <SectionContainer
                    title={<Translate>Body Measurements</Translate>}
                    content={
                      <Form fluid>
                        <BodyMeasurements
                          patient={patient}
                          patientId={patientId}
                          encounterId={encounterId}
                          encounter={encounter}
                          disabled
                          width="100%"
                        />
                      </Form>
                    }
                  />
                )}
              </Row>

      <Row gutter={30}>
        {!Number.isNaN(patientId) && !Number.isNaN(encounterId) && (
          <SectionContainer
            title={<Translate>Glasgow Coma Scale Assessment</Translate>}
            content={
              <GlasgowComaScale
                patient={patient}
                encounter={encounter}
                viewMode="View"
              />
            }
          />
        )}
      </Row>

      <Row gutter={30}>
              {!Number.isNaN(patientId) && (
                <SectionContainer
                  title={<Translate>Allergies</Translate>}
                  content={<Allergies patient={patient} encounter={encounter} showTableActions={false} showTableButtons={false} readonly/>}
                />
              )}
            </Row>

        <Row gutter={30}>
          <SectionContainer
            title={<Translate>Chief Complaint</Translate>}
            content={
              <Form fluid>
                <MyInput
                  width="100%"
                  height="95px"
                  showLabel={false}
                  fieldType="textarea"
                  fieldName="chiefComplaint"
                  record={encounter}
                  setRecord={setEncounter}
                  disabled
                />
              </Form>
            }
          />
        </Row>
      </div>

      <div className="right-box">
        <PatientSide
          patient={patient}
          encounter={encounter}
          refetchList={refetchPatientObservations}
        />
      </div>
    </div>
  );
};

export default UrgentCareViewTriage;