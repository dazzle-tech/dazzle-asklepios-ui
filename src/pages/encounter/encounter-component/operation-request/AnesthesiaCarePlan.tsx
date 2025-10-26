import MyInput from '@/components/MyInput';
import {
  useSaveOperationCarePlanMutation,
  useSaveOperationRequestsMutation
} from '@/services/operationService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { newApOperationAnesthesiaCarePlan } from '@/types/model-types-constructor';
import React, { useEffect, useState } from 'react';
import { Col, Divider, Form, Row, Text } from 'rsuite';
import ReviewOfSystems from '../../medical-notes-and-assessments/review-of-systems';
import ActiveAllergies from '../patient-summary/ActiveAllergies';
import MedicalWarnings from '../patient-summary/MedicalWarnings';
import PatientChronicMedication from '../patient-summary/PatientChronicMedication';
import PatientMajorProblem from '../patient-summary/PatientMajorProblem';
import MyButton from '@/components/MyButton/MyButton';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import MyModal from '@/components/MyModal/MyModal';
import DrugOrder from '../drug-order';
import DiagnosticsResult from '../diagnostics-result/DiagnosticsResult';

const AnesthesiaCarePlan = ({ operation, patient, encounter, user }) => {
  const dispatch = useAppDispatch();
  const [carePlan, setCarePlan] = useState({ ...newApOperationAnesthesiaCarePlan });
  const [operationRe, setOperationRe] = useState({ ...operation?.object });
  const [openDrugOrder, setOpenDrugOrder] = useState(false);
  const [openDiagnostic, setOpenDiagnostic] = useState(false);

  // save mutations
  const [save, saveMutation] = useSaveOperationCarePlanMutation();
  const [saveOperation] = useSaveOperationRequestsMutation();

  // Lov's
  const { data: anesthTypesLov } = useGetLovValuesByCodeQuery('ANESTH_TYPES');
  const { data: sidesLov } = useGetLovValuesByCodeQuery('SIDES');
  const { data: mallampatiLov } = useGetLovValuesByCodeQuery('MALLAMPATI');
  const { data: airwaygrandsLov } = useGetLovValuesByCodeQuery('AIRWAY_GRADES');
  const { data: airwayapprochLov } = useGetLovValuesByCodeQuery('AIRWAY_APPROACH');

  useEffect(() => {
    if (operation?.object) {
      setOperationRe({ ...operation.object });
    }
  }, [operation?.object]);

  const handelSave = async () => {
    try {
      await save({
        ...carePlan,
        createdBy: user.key,
        patientKey: patient.key,
        encounterKey: encounter.key,
        operationKey: operation?.key
      }).unwrap();

      if (operation?.plannedAnesthesiaTypeLkey !== operationRe?.plannedAnesthesiaTypeLkey) {
        await saveOperation({ ...operationRe }).unwrap();
      }

      dispatch(notify({ msg: ' Saved successfully', sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: 'Saved failed', sev: 'error' }));
    }
  };


  const clickAddMedicationInsideDrugOrder = () => {
    const MAX_ATTEMPTS = 30;
    const INTERVAL_MS = 50;

    const tryClick = (attempt = 0) => {
      const modals = Array.from(document.querySelectorAll('.rs-modal'));
      const container = (modals[modals.length - 1] || document) as HTMLElement;

      const candidates = Array.from(container.querySelectorAll('button, .rs-btn')) as HTMLElement[];

      const target = candidates.find(el => {
        const txt = (el.textContent || '').trim().toLowerCase();
        return txt === 'add medication';
      });

      if (target) {
        target.click();
        return;
      }

      if (attempt < MAX_ATTEMPTS) {
        setTimeout(() => tryClick(attempt + 1), INTERVAL_MS);
      }
      // لو ما لقاها، ما منعمل شي (المودال يضل مفتوح).
    };

    tryClick();
  };

  return (
    <Form fluid>
      <Row gutter={15}>
        <Row>
          <Col md={24}>
            <div className="container-form">
              <div className="title-div">
                <Text>Summery</Text>
              </div>
              <Divider />
              <MyInput
                fieldType="select"
                selectData={anesthTypesLov?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                width="100%"
                fieldName="plannedAnesthesiaTypeLkey"
                record={operationRe}
                setRecord={setOperationRe}
              />
              <Row>
                <Col md={12}>
                  <ActiveAllergies patient={patient} />
                </Col>
                <Col md={12}>
                  <MedicalWarnings patient={patient} />
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <PatientChronicMedication patient={patient} />
                </Col>
                <Col md={12}>
                  <PatientMajorProblem patient={patient} />
                </Col>
              </Row>
            </div>
          </Col>
        </Row>

        <Row>
          <Col md={24}>
            <div className="container-form">
              <div className="title-div">
                <Text>Summery</Text>
              </div>
              <Divider />
              <Row>
                <Col md={6}>
                  <MyInput
                    width="100%"
                    fieldType="checkbox"
                    fieldName="anesthesiaConsentSigned"
                    record={carePlan}
                    setRecord={setCarePlan}
                  />
                </Col>
                <Col md={6}>
                  <MyInput
                    width="100%"
                    fieldType="checkbox"
                    fieldName="understandsRisks"
                    record={carePlan}
                    setRecord={setCarePlan}
                  />
                </Col>
                <Col md={5}>
                  <MyInput
                    width="100%"
                    fieldType="checkbox"
                    fieldName="previousAnesthesia"
                    record={carePlan}
                    setRecord={setCarePlan}
                  />
                </Col>
                {carePlan?.previousAnesthesia && (
                  <Col md={7}>
                    <MyInput
                      width="100%"
                      fieldType="textarea"
                      fieldName="anesthesiaHistory"
                      record={carePlan}
                      setRecord={setCarePlan}
                    />
                  </Col>
                )}
              </Row>
            </div>
          </Col>
        </Row>

        <Row>
          <Col md={24}>
            {' '}
            <div className="container-form">
              <div className="title-div">
                <Text>Airway Assessment</Text>
              </div>
              <Divider />
              <Row>
                <Col md={8}>
                  <MyInput
                    fieldType="select"
                    selectData={sidesLov?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    width="100%"
                    fieldName="nasalPatencyLkey"
                    record={operationRe}
                    setRecord={setOperationRe}
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    fieldType="select"
                    selectData={mallampatiLov?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    width="100%"
                    fieldName="mallampatiClassificationLkey"
                    record={operationRe}
                    setRecord={setOperationRe}
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    fieldType="select"
                    selectData={airwaygrandsLov?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    width="100%"
                    fieldName="airwayGradesLkey"
                    record={operationRe}
                    setRecord={setOperationRe}
                  />
                </Col>
              </Row>
              <Row>
                <Col md={8}>
                  <MyInput
                    fieldType="select"
                    selectData={airwayapprochLov?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    width="100%"
                    fieldName="plannedAirwayApproachLkey"
                    record={operationRe}
                    setRecord={setOperationRe}
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    width="100%"
                    fieldType="number"
                    rightAddon="Cm"
                    fieldName="thyromentalDistance"
                    record={operationRe}
                    setRecord={setOperationRe}
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    width="100%"
                    fieldType="number"
                    rightAddon="Cm"
                    fieldName="mouthOpening"
                    record={operationRe}
                    setRecord={setOperationRe}
                  />
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <MyInput
                    width="100%"
                    fieldType="textarea"
                    fieldName="neckMobility"
                    record={carePlan}
                    setRecord={setCarePlan}
                  />
                </Col>
                <Col md={12}>
                  <MyInput
                    width="100%"
                    fieldType="textarea"
                    fieldName="facialOrNeckAbnormalities"
                    record={carePlan}
                    setRecord={setCarePlan}
                  />
                </Col>
              </Row>
              <Row>
                <Col md={8}>
                  <MyInput
                    width="100%"
                    fieldType="checkbox"
                    fieldName="beardOrFacialHair"
                    record={carePlan}
                    setRecord={setCarePlan}
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    width="100%"
                    fieldType="checkbox"
                    fieldName="anticipatedDifficultAirway"
                    record={carePlan}
                    setRecord={setCarePlan}
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    width="100%"
                    fieldType="checkbox"
                    fieldName="previousDifficultIntubation"
                    record={carePlan}
                    setRecord={setCarePlan}
                  />
                </Col>
              </Row>
              {carePlan?.previousDifficultIntubation && (
                <Row>
                  <Col md={24}>
                    <MyInput
                      width="100%"
                      fieldType="textarea"
                      fieldName="difficultIntubationNotes"
                      record={carePlan}
                      setRecord={setCarePlan}
                    />
                  </Col>
                </Row>
              )}
            </div>
          </Col>
        </Row>

        <Row>
          <Col md={24}>
            <div className="container-form">
              <ReviewOfSystems patient={patient} encounter={encounter} edit={false} />
            </div>
          </Col>
        </Row>
      </Row>

      <div className="bt-div">
        <div className="bt-right">
          <MyButton onClick={handelSave}>Save</MyButton>

          <MyButton
            onClick={() => {
              setOpenDrugOrder(true);
              setTimeout(() => {
                try {
                  clickAddMedicationInsideDrugOrder();
                } catch {
                }
              }, 0);
            }}
          >
            Pre-medication
          </MyButton>

          <MyButton onClick={() => setOpenDiagnostic(true)}>Tests Results</MyButton>
        </div>
      </div>

      <MyModal
        open={openDrugOrder}
        setOpen={setOpenDrugOrder}
        title="Pre Medication"
        size="80vw"
        bodyheight="78vh"
        content={<DrugOrder patient={patient} encounter={encounter} edit={false} />}
      />

      <MyModal
        open={openDiagnostic}
        setOpen={setOpenDiagnostic}
        title="Test Result"
        content={<DiagnosticsResult />}
      />
    </Form>
  );
};

export default AnesthesiaCarePlan;
