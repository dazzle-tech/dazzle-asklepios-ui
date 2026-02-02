import VitalSigns from '@/pages/medical-component/vital-signs/VitalSigns';
import { ApEncounter, ApPatient } from '@/types/model-types';
import clsx from 'clsx';
import React, { forwardRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Col, Form, Row, Slider } from 'rsuite';
import './styles.less';
import BodyMeasurements from './BodyMeasurements';
import PatientObservationsComplaints from './PatientObservationsComplaints';
import PainAssessment from './PainAssessment';
import AdditionalMeasurements from './AdditionalMeasurements';

export type ObservationsRef = {
};

type ObservationsProps = {
  patient?: ApPatient;
  encounter?: ApEncounter;
  edit?: boolean;
};


const Observations = forwardRef<ObservationsRef, ObservationsProps>((props, ref) => {
  const location = useLocation();
  const state = location.state || {};
  const patient = props.patient || (state.patient as ApPatient);
  const encounter = props.encounter || (state.encounter as ApEncounter);
  const edit = props.edit ?? state.edit;
  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
  const [readOnly] = useState(false);

  const [localPatient] = useState<ApPatient>({ ...patient });
  const [localEncounter, setLocalEncounter] = useState<ApEncounter>({ ...(encounter as any) });

  useEffect(() => {
    if (localEncounter?.encounterStatusLkey === '91109811181900') {
      setIsEncounterStatusClosed(true);
    } else {
      setIsEncounterStatusClosed(false);
    }
  }, [localEncounter?.encounterStatusLkey]);

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
