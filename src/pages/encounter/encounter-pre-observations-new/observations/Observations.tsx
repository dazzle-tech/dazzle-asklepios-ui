import VitalSigns from '@/pages/medical-component/vital-signs/VitalSigns';
import clsx from 'clsx';
import React, { forwardRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Col, Form, Row } from 'rsuite';
import './styles.less';
import BodyMeasurements from './BodyMeasurements';
import PatientObservationsComplaints from './PatientObservationsComplaints';
import PainAssessment from './PainAssessment';
import AdditionalMeasurements from './AdditionalMeasurements';
import { Patient, PatientEncounter } from '@/types/model-types-new';
import { setDivContent, setPageCode } from '@/reducers/divSlice';

import { useAppDispatch } from '@/hooks';
export type ObservationsRef = {};

type ObservationsProps = {
  patient?: Patient;
  encounter?: PatientEncounter;
  edit?: boolean;
};

const Observations = forwardRef<ObservationsRef, ObservationsProps>((props, ref) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const state = location.state || {};
  const patient = props.patient || (state.patient as Patient);
  const encounter = props.encounter || (state.encounter as PatientEncounter);
  const edit = props.edit ?? state.edit;
  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
  const [readOnly] = useState(false);

  const [localPatient] = useState<Patient>({ ...patient });
  const [localEncounter, setLocalEncounter] = useState<PatientEncounter>({ ...(encounter as any) });
console.log(localPatient);
  useEffect(() => {
    if (localEncounter?.status === 'CLOSED') {
      setIsEncounterStatusClosed(true);
    } else {
      setIsEncounterStatusClosed(false);
    }
  }, [localEncounter?.status]);


  useEffect(() => {
  dispatch(setPageCode('observations'));
  dispatch(setDivContent('Observations'));

  return () => {
    dispatch(setPageCode(''));
    dispatch(setDivContent(''));
  };
}, [dispatch]);

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
                  patientId={Number((localPatient as any)?.id ?? localPatient?.id)}
                  encounterId={Number((localEncounter as any)?.id)}
                  encounter={localEncounter}
                  setEncounter={setLocalEncounter} 
                />
              </Col>
            </Row>
            <Row>
              <Col md={24}>
                <VitalSigns
                  width="28vw"
                  disabled={false}
                  patientId={Number(localPatient.id)}
                  encounterId={Number(localEncounter.id)}
                  encounter={localEncounter}
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
                  patient={localPatient}
                  patientId={Number(localPatient?.id)}
                  encounterId={Number(localEncounter?.id)}
                  encounter={localEncounter}
                />
              </Col>
            </Row>
            <Row>
              <Col md={24}>
                <PainAssessment
                  width="100%"
                  disabled={isEncounterStatusClosed || readOnly}
                  patientId={Number((localPatient as any)?.id ?? localPatient?.id)}
                  encounterId={Number((localEncounter as any)?.id)}
                  encounter={localEncounter}
                />
              </Col>
            </Row>
            <Row>
              <Col md={24}>
                <AdditionalMeasurements
                  width="100%"
                  disabled={isEncounterStatusClosed || readOnly}
                  patient={localPatient as any}
                  encounterId={Number((localEncounter as any)?.id)}
                  encounter={localEncounter}
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
