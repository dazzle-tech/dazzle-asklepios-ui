import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import VitalSigns from '@/pages/medical-component/vital-signs/VitalSigns';
import { setRefetchPatientSide } from '@/reducers/refetchPatientSide';
import { useSaveEncounterChangesMutation } from '@/services/encounterService';
import {
  useGetObservationSummariesQuery,
  useSaveObservationSummaryMutation,
  useGenerateNurseSummaryReportMutation
} from '@/services/observationService';
import { useGetAgeGroupValueQuery } from '@/services/patientService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { ApEncounter, ApPatient, ApPatientObservationSummary } from '@/types/model-types';
import { newApPatientObservationSummary } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { faChildReaching, faPerson } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Col, Form, Row, Slider } from 'rsuite';
import { useOutletContext } from 'react-router-dom';
import { newVitalSigns } from '@/types/model-types-constructor-new';
import type { VitalSigns as VitalSignsModelObject } from '@/types/model-types-new';
import './styles.less';

import {
  useCreateVitalSignsMutation,
  useGetLatestVitalSignsByEncounterIdQuery
} from '@/services/medicalSheets/observations/vitalSignsService';
import BodyMeasurements from './BodyMeasurements';
import PatientObservationsComplaints from './PatientObservationsComplaints';
import PainAssessment from './PainAssessment';
import AdditionalMeasurements from './AdditionalMeasurements';

export type ObservationsRef = {
  handleSave: () => void;
  handleClear: () => void;
};

type ObservationsProps = {
  patient?: ApPatient;
  encounter?: ApEncounter;
  edit?: boolean;
};

function mergeSetter<T extends Record<string, any>>(
  setState: React.Dispatch<React.SetStateAction<T>>
) {
  return (next: any) => {
    if (typeof next === 'function') {
      setState(previousState => {
        const computed = next(previousState);
        if (computed && typeof computed === 'object') return { ...previousState, ...computed };
        return previousState;
      });
      return;
    }

    if (next && typeof next === 'object') {
      setState(previousState => ({ ...previousState, ...next }));
      return;
    }
  };
}

const Observations = forwardRef<ObservationsRef, ObservationsProps>((props, ref) => {
  const location = useLocation();
  const state = location.state || {};
  const patient = props.patient || (state.patient as ApPatient);
  const encounter = props.encounter || (state.encounter as ApEncounter);
  const edit = props.edit ?? state.edit;

  const dispatch = useAppDispatch();

  const [localPatient] = useState<ApPatient>({ ...patient });
  const [localEncounter, setLocalEncounter] = useState<ApEncounter>({ ...(encounter as any) });

  const { data: painDegreesLovQueryResponse } = useGetLovValuesByCodeQuery('PAIN_DEGREE');
  const { data: encounterPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');

  const [bodyMassIndex, setBodyMassIndex] = useState('');
  const [bodySurfaceArea, setBodySurfaceArea] = useState('');

  const [vitalSigns, setVitalSigns] = useState<VitalSignsModelObject>({
    ...newVitalSigns,
    patientId: ((patient as any)?.id ?? 0) as any,
    encounterId: ((encounter as any)?.key ?? 0) as any
  });

  type NurseOutletContext = {
    observationsRef?: React.MutableRefObject<ObservationsRef | null>;
  };

  const { observationsRef } = useOutletContext<NurseOutletContext>();

  const [saveObservationSummary, saveObservationsMutation] = useSaveObservationSummaryMutation();
  const [saveEncounter] = useSaveEncounterChangesMutation();

  useGenerateNurseSummaryReportMutation();

  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
  const [readOnly] = useState(false);
  const [painLevel, setPainLevel] = useState({ latestpainlevel: 0 });

  const getTrackColor = (value: number): string => {
    if (value === 0) return 'transparent';
    if (value >= 1 && value <= 3) return '#28a745';
    if (value >= 4 && value <= 7) return 'orange';
    return 'red';
  };

  const [patientLastVisitObservationsListRequest] = useState<ListRequest>({
    ...initialListRequest,
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: localPatient?.key
      }
    ]
  });

  const { data: getObservationSummaries } = useGetObservationSummariesQuery({
    ...patientLastVisitObservationsListRequest
  });

  const lastObservationSummary =
    getObservationSummaries?.object?.length > 0 ? getObservationSummaries.object[0] : null;

  const lastencounterop =
    getObservationSummaries?.object?.length > 0
      ? getObservationSummaries.object.findLast(
        (item: ApPatientObservationSummary) => item.visitKey === encounter?.key
      )
      : null;

  const [patientObservationSummary, setPatientObservationSummary] =
    useState<ApPatientObservationSummary>({
      ...newApPatientObservationSummary,
      latesttemperature: null,
      latestbpSystolic: null,
      latestbpDiastolic: null,
      latestheartrate: null,
      latestrespiratoryrate: null,
      latestoxygensaturation: null,
      latestglucoselevel: null,
      latestweight: null,
      latestheight: null,
      latestheadcircumference: null,
      latestpainlevelLkey: null,
      measurementLkey: null,
      notes: ''
    });

  const { data: patientAgeGroupResponse } = useGetAgeGroupValueQuery(
    {
      dob: patient?.dob ? new Date(patient.dob).toISOString() : null
    },
    { skip: !patient?.dob }
  );

  const setPatientObservationSummarySafe = useMemo(
    () => mergeSetter(setPatientObservationSummary),
    []
  );

  useEffect(() => {
    if (lastencounterop) {
      setPatientObservationSummary({
        ...lastencounterop
      });
    }
  }, [lastencounterop]);

  useEffect(() => {
    if (saveObservationsMutation && saveObservationsMutation.status === 'fulfilled') {
      setPatientObservationSummary(saveObservationsMutation.data as ApPatientObservationSummary);
    }
  }, [saveObservationsMutation]);

  useEffect(() => {
    if (localEncounter?.encounterStatusLkey === '91109811181900') {
      setIsEncounterStatusClosed(true);
    } else {
      setIsEncounterStatusClosed(false);
    }
  }, [localEncounter?.encounterStatusLkey]);

  useEffect(() => {
    const { latestweight, latestheight } = patientObservationSummary;
    if (latestweight && latestheight) {
      const calculatedBodyMassIndex = (latestweight / (latestheight / 100) ** 2).toFixed(2);
      const calculatedBodySurfaceArea = Math.sqrt((latestweight * latestheight) / 3600).toFixed(2);
      setBodyMassIndex(calculatedBodyMassIndex);
      setBodySurfaceArea(calculatedBodySurfaceArea);
    } else {
      setBodyMassIndex('');
      setBodySurfaceArea('');
    }
  }, [patientObservationSummary.latestweight, patientObservationSummary.latestheight]);

  useEffect(() => {
    if (patientObservationSummary?.latestpainlevel != null) {
      setPainLevel({
        latestpainlevel: patientObservationSummary.latestpainlevel as number
      });
    }
  }, [patientObservationSummary.latestpainlevel]);

  useEffect(() => {
    if (patientObservationSummary?.latestpainlevel != null) {
      setPainLevel({
        latestpainlevel: patientObservationSummary.latestpainlevel as number
      });
    }
  }, [patientObservationSummary]);

  const { data: latestVitalSignsByEncounterId } = useGetLatestVitalSignsByEncounterIdQuery(
    { encounterId: (localEncounter as any)?.key as any },
    { skip: !(localEncounter as any)?.key }
  );

  useEffect(() => {
    if (!latestVitalSignsByEncounterId) return;

    setVitalSigns(previousVitalSigns => ({
      ...previousVitalSigns,
      ...latestVitalSignsByEncounterId,
      patientId: previousVitalSigns.patientId ?? ((localPatient as any)?.id ?? 0),
      encounterId: previousVitalSigns.encounterId ?? ((localEncounter as any)?.key ?? 0)
    }));
  }, [latestVitalSignsByEncounterId, localPatient, localEncounter]);

  const [createVitalSigns] = useCreateVitalSignsMutation();

  const handleSave = async () => {
    try {
      await saveObservationSummary({
        ...patientObservationSummary,
        visitKey: localEncounter.key,
        patientKey: localPatient.key,
        createdBy: 'Administrator',
        lastDate: new Date() as any,
        latestbmi: bodyMassIndex as any,
        age: lastObservationSummary?.age,

        latestbpSystolic: vitalSigns.bloodPressureSystolic as any,
        latestbpDiastolic: vitalSigns.bloodPressureDiastolic as any,
        latestheartrate: vitalSigns.heartRate as any,
        latestoxygensaturation: vitalSigns.oxygenSaturation as any,
        latesttemperature: vitalSigns.temperature as any,
        latestrespiratoryrate: vitalSigns.respiratoryRate as any,

        prevRecordKey: lastObservationSummary?.key || null,
        plastDate: lastObservationSummary?.lastDate || null,
        platesttemperature: lastObservationSummary?.latesttemperature || null,
        platestbpSystolic: lastObservationSummary?.latestbpSystolic || null,
        platestbpDiastolic: lastObservationSummary?.latestbpDiastolic || null,
        platestheartrate: lastObservationSummary?.latestheartrate || null,
        platestrespiratoryrate: lastObservationSummary?.latestrespiratoryrate || null,
        platestoxygensaturation: lastObservationSummary?.latestoxygensaturation || null,
        platestweight:
          lastObservationSummary?.latestweight || lastObservationSummary?.platestweight,
        platestheight:
          lastObservationSummary?.latestheight || lastObservationSummary?.platestheight,
        platestheadcircumference:
          lastObservationSummary?.latestheadcircumference ||
          lastObservationSummary?.platestheadcircumference,
        platestnotes: lastObservationSummary?.latestnotes || '',
        platestpaindescription: lastObservationSummary?.latestpaindescription || '',
        platestpainlevelLkey: lastObservationSummary?.latestpainlevelLkey || '',
        platestbmi: lastObservationSummary?.latestbmi,
        page: lastObservationSummary?.age,
        latestpainlevel: painLevel.latestpainlevel as any,
        priorityLkey: patientObservationSummary.priorityLkey,

        notes: vitalSigns.notes as any,
        measurementLkey: (vitalSigns as any).measurementLkey ?? vitalSigns.measurementSite ?? null
      }).unwrap();

      await createVitalSigns({
        ...vitalSigns,
        patientId: (vitalSigns.patientId ?? ((localPatient as any)?.id ?? 0)) as any,
        encounterId: (vitalSigns.encounterId ?? ((localEncounter as any)?.key ?? 0)) as any
      }).unwrap();

      if (encounter.chiefComplaint !== localEncounter.chiefComplaint) {
        await saveEncounter(localEncounter).unwrap();
      }

      dispatch(setRefetchPatientSide(true));
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
    } catch (error) {
      console.error('Error while saving observation summary:', error);
      dispatch(notify({ msg: 'Error occurred while saving', sev: 'error' }));
    }
  };

  const handleClear = () => {
    setPatientObservationSummary({
      ...newApPatientObservationSummary,
      latestpainlevelLkey: null
    } as any);

    setPainLevel({ latestpainlevel: 0 });
    setBodyMassIndex('');
    setBodySurfaceArea('');

    setVitalSigns({
      ...newVitalSigns,
      patientId: ((localPatient as any)?.id ?? 0) as any,
      encounterId: ((localEncounter as any)?.key ?? 0) as any
    });
  };

  useEffect(() => {
    if (!observationsRef) return;

    observationsRef.current = {
      handleSave,
      handleClear
    };

    return () => {
      observationsRef.current = null;
    };
  }, [observationsRef]);

  return (
    <div ref={ref as any} className={clsx('basuc-div', { 'disabled-panel': edit })}>
      <Form fluid>
        <Row>
          <Col md={12}>
            <Row>
              <Col md={24}>
                <PatientObservationsComplaints
                  width="100%"
                  disabled={isEncounterStatusClosed || readOnly}
                  patientId={Number((localPatient as any)?.id ?? localPatient?.key ?? 0)}
                  encounterId={Number((localEncounter as any)?.key ?? 0)}
                />
              </Col>
            </Row>
            <Row>
              <Col md={24}>
                <VitalSigns
                  width="28vw"
                  disabled={false}
                  patientId={Number(localPatient.key)}
                  encounterId={Number(localEncounter.key)}
                />
              </Col>
            </Row>
          </Col>
          <Col md={12}>
            <Row>
              <Col md={24}>
                <BodyMeasurements
                  width="100%"
                  disabled={isEncounterStatusClosed || readOnly}
                  patientId={Number((localPatient as any)?.id ?? localPatient?.key ?? 0)}
                  encounterId={Number((localEncounter as any)?.key ?? 0)}
                />
              </Col>
            </Row>
            <Row>
              <Col md={24}>
                <PainAssessment
                  width="100%"
                  disabled={isEncounterStatusClosed || readOnly}
                  patientId={Number((localPatient as any)?.id ?? localPatient?.key ?? 0)}
                  encounterId={Number((localEncounter as any)?.key ?? 0)}
                />
              </Col>
            </Row>
            <Row>
              <Col md={24}>
                <AdditionalMeasurements
                  width="100%"
                  disabled={isEncounterStatusClosed || readOnly}
                  patient={localPatient as any}
                  encounterId={Number((localEncounter as any)?.key ?? 0)}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Form>
    </div>
  );
});

export default Observations;
