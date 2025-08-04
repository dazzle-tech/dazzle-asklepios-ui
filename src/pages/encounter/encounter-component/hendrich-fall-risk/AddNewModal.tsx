import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import { faPersonFallingBurst } from '@fortawesome/free-solid-svg-icons';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Col, Form, Radio, RadioGroup, Row, Text } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
const AddNewModal = ({
  open,
  setOpen,
  width,
  hendrichFallRisk,
  setOpenRiskLevelExtraFormModal,
  setHendrichFallRisk
}) => {
  // To save selected value of GUGT radios
  const [GUGT, setGUGT] = useState<string>('');
  // To save and update score
  const [recordOfScore, setRecordOfScore] = useState({ score: 0 });
  // To save and update risk level
  const [recordOfRiskLevel, setRecordOfRiskLevel] = useState({ riskLevel: '' });
  // Fetch boolean Lov list response
  const { data: booleanLovQueryResponse } = useGetLovValuesByCodeQuery('BOOLEAN');
  // Fetch gender Lov list response
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  // Fetch risk levels Lov list response
  const { data: riskLevelsLovQueryResponse } = useGetLovValuesByCodeQuery('LOW_MOD_HIGH');

  // handle Save
  const handleSave = () => {
    // high: 6830244509957984
    // if the risl level is high open the modal
    if (recordOfRiskLevel['riskLevel'] == '6830244509957984') {
      setOpen(false);
      setOpenRiskLevelExtraFormModal(true);
    }
  };

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="confusionOrDisorientationOrImpulsivity"
                  fieldLabel="Confusion / Disorientation / Impulsivity"
                  fieldType="select"
                  selectData={booleanLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={hendrichFallRisk}
                  setRecord={setHendrichFallRisk}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="symptomaticDepression"
                  fieldLabel="Symptomatic Depression"
                  fieldType="select"
                  selectData={booleanLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={hendrichFallRisk}
                  setRecord={setHendrichFallRisk}
                />
              </Col>
            </Row>
            <br />

            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="alteredElimination"
                  fieldLabel="Altered Elimination"
                  fieldType="select"
                  selectData={booleanLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={hendrichFallRisk}
                  setRecord={setHendrichFallRisk}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="dizzinessOrVertigo"
                  fieldLabel="Dizziness / Vertigo"
                  fieldType="select"
                  selectData={booleanLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={hendrichFallRisk}
                  setRecord={setHendrichFallRisk}
                />
              </Col>
            </Row>
            <br />
            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="gender"
                  fieldLabel="Gender"
                  fieldType="select"
                  selectData={genderLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={hendrichFallRisk}
                  setRecord={setHendrichFallRisk}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="antiepilepticMedication"
                  fieldLabel="Antiepileptic Medication"
                  fieldType="select"
                  selectData={booleanLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={hendrichFallRisk}
                  setRecord={setHendrichFallRisk}
                />
              </Col>
            </Row>
            <br />
            <MyInput
              width="100%"
              fieldName="benzodiazepineUse"
              fieldLabel="Benzodiazepine Use"
              fieldType="select"
              selectData={booleanLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={hendrichFallRisk}
              setRecord={setHendrichFallRisk}
            />
            <Text>Get-Up-and-Go Test (GUGT)</Text>
            <RadioGroup value={GUGT} onChange={value => setGUGT(value)}>
                <Radio value="RiseInSingleMovement ">Rise in single movement</Radio>
                <Radio value="PushesUpIn1Attempt">Pushes up in 1 attempt</Radio>
                <Radio value="MultipleAttemptsOrUnable">Multiple attempts or unable</Radio>
            </RadioGroup>
            <br />
            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="score"
                  fieldType="number"
                  fieldLabel="Total Score"
                  record={recordOfScore}
                  setRecord={setRecordOfScore}
                  disabled
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="riskLevel"
                  fieldLabel="Risk Level"
                  fieldType="select"
                  selectData={riskLevelsLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={recordOfRiskLevel}
                  setRecord={setRecordOfRiskLevel}
                  disabled
                />
              </Col>
            </Row>
          </Form>
        );
    }
  };

  // Effects
  useEffect(() => {
    // no: 1476240934233400
    // yes: 1476229927081534
    // increment score by 4 for yes and 0 for no
    const confusionOrDisorientationOrImpulsivity =
      hendrichFallRisk?.confusionOrDisorientationOrImpulsivity == '1476229927081534' ? 4 : 0;
    // increment score by 2 for yes and 0 for no
    const symptomaticDepression =
      hendrichFallRisk?.symptomaticDepression == '1476229927081534' ? 2 : 0;
    // increment score by 1 for yes and 0 for no
    const alteredElimination = hendrichFallRisk?.alteredElimination == '1476229927081534' ? 1 : 0;
    // increment score by 1 for yes and 0 for no
    const dizzinessOrVertigo =
      hendrichFallRisk?.dizzinessOrVertigo == '1476229927081534' ? 1 : 0;

    // increment score by 1 for male and 0 for female
    const gender = hendrichFallRisk?.gender == '1' ? 1 : 0;
    // increment score by 2 for yes and 0 for no
    const antiepilepticMedication =
      hendrichFallRisk?.antiepilepticMedication == '1476229927081534' ? 2 : 0;
    // increment score by 1 for yes and 0 for no
    const benzodiazepineUse = hendrichFallRisk?.benzodiazepineUse == '1476229927081534' ? 1 : 0;
    // increment score by 1 for PushesUpIn1Attempt and 3 for MultipleAttemptsOrUnable and 0 for others
    const valueOfGUGT =
      GUGT == 'PushesUpIn1Attempt' ? 1 : GUGT == 'MultipleAttemptsOrUnable' ? 3 : 0;

    // calculate score
    const score =
      confusionOrDisorientationOrImpulsivity +
      symptomaticDepression +
      alteredElimination +
      dizzinessOrVertigo +
      gender +
      antiepilepticMedication +
      benzodiazepineUse +
      valueOfGUGT;
    setRecordOfScore({ score: score });
  }, [hendrichFallRisk, GUGT]);

  useEffect(() => {
    // low: 6830230146334591
    // high: 6830244509957984
    // update riskLevel according to score value
    if (recordOfScore['score'] < 5) {
      setRecordOfRiskLevel({ riskLevel: '6830230146334591' });
    } else {
      setRecordOfRiskLevel({ riskLevel: '6830244509957984' });
    }
  }, [recordOfScore]);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="New Assessment"
      position="right"
      content={conjureFormContent}
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      steps={[{ title: 'Assessment', icon: <FontAwesomeIcon icon={faPersonFallingBurst} /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddNewModal;
