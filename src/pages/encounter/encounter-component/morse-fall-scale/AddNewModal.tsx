import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import { faPersonFallingBurst } from '@fortawesome/free-solid-svg-icons';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Col, Form, Radio, RadioGroup, Row, Text } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import Translate from '@/components/Translate';
const AddNewModal = ({
  open,
  setOpen,
  width,
  morseFallScale,
  setOpenModerateHighModal,
  setMorseFallScale
}) => {
  // To save selected value of walking Aid radios
  const [walkingAid, setWalkingAid] = useState<string>('');
  // To save selected value of gait transfer radios
  const [gaitTransfer, setGaitTransfer] = useState<string>('');
  // To save selected value of mental status radios
  const [mentalStatus, setMentalStatus] = useState<string>('');
  // To save and update score
  const [recordOfScore, setRecordOfScore] = useState({ score: 0 });
  // To save and update risk level
  const [recordOfRiskLevel, setRecordOfRiskLevel] = useState({ riskLevel: '' });
  // Fetch  boolean Lov list response
  const { data: booleanLovQueryResponse } = useGetLovValuesByCodeQuery('BOOLEAN');
  // Fetch  risk levels Lov list response
  const { data: riskLevelsLovQueryResponse } = useGetLovValuesByCodeQuery('LOW_MOD_HIGH');

  useEffect(() => {
    // no: 1476240934233400
    // yes: 1476229927081534
    // increment score by 20 for yes and 0 for no
    const historyOfFailing = morseFallScale?.history == '1476229927081534' ? 25 : 0;
    // increment score by 15 for yes and 0 for no
    const secondaryDiagnosis = morseFallScale?.secondaryDiagnosis == '1476229927081534' ? 15 : 0;
    // increment score by 20 for yes and 0 for no
    const iv = morseFallScale?.iv == '1476229927081534' ? 20 : 0;
    // increment score by 30 for Furniture and 15 for (Walker,Cane,Crutches) and 0 for others
    const valueOfWalkingAid =
      walkingAid == 'Furniture'
        ? 30
        : walkingAid == 'Walker' || walkingAid == 'Cane' || walkingAid == 'Crutches'
        ? 15
        : 0;
    // increment score by 20 for Impaired and 10 for Weak and 0 for others
    const valueOfGaitTransfer = gaitTransfer == 'Impaired' ? 20 : gaitTransfer == 'Weak' ? 10 : 0;
    // increment score by 15 for Forgets Limitations  and 0 for others
    const valueOfMentalStatus = mentalStatus == 'Forgets Limitations' ? 15 : 0;

    // calculate score
    const score =
      historyOfFailing +
      secondaryDiagnosis +
      iv +
      valueOfWalkingAid +
      valueOfGaitTransfer +
      valueOfMentalStatus;
    setRecordOfScore({ score: score });
  }, [morseFallScale, walkingAid, gaitTransfer, mentalStatus]);

  const handleSave = () => {
    if (
      recordOfRiskLevel['riskLevel'] == '6830239174637434' ||
      recordOfRiskLevel['riskLevel'] == '6830244509957984'
    ) {
      setOpen(false);
      setOpenModerateHighModal(true);
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
                  fieldName="history"
                  fieldLabel="History of falling Within last 3 months"
                  fieldType="select"
                  selectData={booleanLovQueryResponse?.object ?? []}
                   selectDataLabel="lovDisplayVale"
 disableByField='isValid'

                  selectDataValue="key"
                  record={morseFallScale}
                  setRecord={setMorseFallScale}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="secondaryDiagnosis"
                  fieldLabel="Secondary diagnosis"
                  fieldType="select"
                  selectData={booleanLovQueryResponse?.object ?? []}
                   selectDataLabel="lovDisplayVale"
 disableByField='isValid'

                  selectDataValue="key"
                  record={morseFallScale}
                  setRecord={setMorseFallScale}
                />
              </Col>
            </Row>
            <br />
            <MyInput
              width="100%"
              fieldName="iv"
              fieldLabel="IV/Heparin lock"
              fieldType="select"
              selectData={booleanLovQueryResponse?.object ?? []}
               selectDataLabel="lovDisplayVale"
 disableByField='isValid'

              selectDataValue="key"
              record={morseFallScale}
              setRecord={setMorseFallScale}
            />
            <Text><Translate>Patient`s walking aid</Translate></Text>
            <RadioGroup value={walkingAid} onChange={value => setWalkingAid(value)}>
              <Row gutter={10}>
                <Radio value="None"><Translate>None</Translate></Radio>
                <Radio value="Crutches"><Translate>Crutches</Translate></Radio>
                <Radio value="Cane"><Translate>Cane</Translate></Radio>
                <Radio value="Walker"><Translate>Walker</Translate></Radio>
                <Radio value="Furniture"><Translate>Furniture</Translate></Radio>
              </Row>
            </RadioGroup>
            <br />
            <Text><Translate>Gait/Transfer</Translate></Text>
            <RadioGroup value={gaitTransfer} onChange={value => setGaitTransfer(value)}>
              <Row gutter={10}>
                <Radio value="Normal"><Translate>Normal</Translate></Radio>
                <Radio value="Weak"><Translate>Weak</Translate></Radio>
                <Radio value="Impaired"><Translate>Impaired</Translate></Radio>
              </Row>
            </RadioGroup>
            <br />
            <Text><Translate>Mental status</Translate></Text>
            <RadioGroup value={mentalStatus} onChange={value => setMentalStatus(value)}>
              <Row gutter={10}>
                <Radio value="Oriented"><Translate>Oriented</Translate></Radio>
                <Radio value="Forgets Limitations"><Translate>Forgets Limitations</Translate></Radio>
              </Row>
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
    <div style={{ marginTop: '1.5vw' }}>
      <MyBadgeStatus
        contant={
          recordOfRiskLevel.riskLevel === '6830244509957984'
            ? 'High'
            : recordOfRiskLevel.riskLevel === '6830239174637434'
            ? 'Moderate'
            : 'Low'
        }
        backgroundColor={
          recordOfRiskLevel.riskLevel === '6830244509957984'
            ? 'var(--light-pink)'
            : recordOfRiskLevel.riskLevel === '6830239174637434'
            ? 'var(--light-orange)'
            : 'var(--light-green)'
        }
        color={
          recordOfRiskLevel.riskLevel === '6830244509957984'
            ? 'var(--primary-pink)'
            : recordOfRiskLevel.riskLevel === '6830239174637434'
            ? 'var(--primary-orange)'
            : 'var(--primary-green)'
        }
      />
    </div>
  </Col>
</Row>
          </Form>
        );
    }
  };

  // Effects
  useEffect(() => {
    // low: 6830230146334591
    // high: 6830244509957984
    // mod: 6830239174637434
    // update riskLevel according to score value
    if (recordOfScore['score'] >= 0 && recordOfScore['score'] <= 24) {
      setRecordOfRiskLevel({ riskLevel: '6830230146334591' });
    } else if (recordOfScore['score'] >= 25 && recordOfScore['score'] <= 44) {
      setRecordOfRiskLevel({ riskLevel: '6830239174637434' });
    } else {
      setRecordOfRiskLevel({ riskLevel: '6830244509957984' });
    }
  }, [recordOfScore]);

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="New Assessment"
      position="right"
      content={<div dir={dir}>{conjureFormContent()}</div>}
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      steps={[{ title: 'Assessment', icon: <FontAwesomeIcon icon={faPersonFallingBurst} /> }]}
      size={width > 600 ? '36vw' : '25vw'}
    />
  );
};
export default AddNewModal;
