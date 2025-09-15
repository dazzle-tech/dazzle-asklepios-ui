import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import { faPersonFallingBurst } from '@fortawesome/free-solid-svg-icons';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Col, Form, Row } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
const AddNewModal = ({
  open,
  setOpen,
  width,
  stratifyScale,
  setOpenRiskLevelExtraFormModal,
  setStratifyScale
}) => {
  // To save and update score
  const [recordOfScore, setRecordOfScore] = useState({ score: 0 });
  // To save and update risk level
  const [recordOfRiskLevel, setRecordOfRiskLevel] = useState({ riskLevel: '' });
  // Fetch  boolean Lov list response
  const { data: booleanLovQueryResponse } = useGetLovValuesByCodeQuery('BOOLEAN');
  // Fetch  risk levels Lov list response
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
                  fieldName="history"
                  fieldLabel="History of falls"
                  fieldType="select"
                  selectData={booleanLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={stratifyScale}
                  setRecord={setStratifyScale}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="agitatedConfusion"
                  fieldLabel="Agitated confusion"
                  fieldType="select"
                  selectData={booleanLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={stratifyScale}
                  setRecord={setStratifyScale}
                />
              </Col>
            </Row>
            <br />
            <MyInput
              width="100%"
              fieldName="urinaryFrequencyOrUrgencyOrIncontinence"
              fieldLabel="Urinary frequency, urgency or incontinence"
              fieldType="select"
              selectData={booleanLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={stratifyScale}
              setRecord={setStratifyScale}
            />
            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="visualImpairment"
                  fieldLabel="Visual impairment"
                  fieldType="select"
                  selectData={booleanLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={stratifyScale}
                  setRecord={setStratifyScale}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="transferAndMobilityProblems"
                  fieldLabel="Transfer and mobility problems"
                  fieldType="select"
                  selectData={booleanLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={stratifyScale}
                  setRecord={setStratifyScale}
                />
              </Col>
            </Row>
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
        contant={recordOfRiskLevel.riskLevel === '6830244509957984' ? 'High' : 'Low'}
        backgroundColor={recordOfRiskLevel.riskLevel === '6830244509957984' ? 'var(--light-pink)' : 'var(--light-green)'}
        color={recordOfRiskLevel.riskLevel === '6830244509957984' ? 'var(--primary-pink)' : 'var(--primary-green)'}
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
    // no: 1476240934233400
    // yes: 1476229927081534
    // increment score by 1 for yes and 0 for no
    const historyOfFalls = stratifyScale?.history == '1476229927081534' ? 1 : 0;
    // increment score by 1 for yes and 0 for no
    const agitatedConfusion = stratifyScale?.agitatedConfusion == '1476229927081534' ? 1 : 0;
    // increment score by 1 for yes and 0 for no
    const visualImpairment = stratifyScale?.visualImpairment == '1476229927081534' ? 1 : 0;
     // increment score by 1 for yes and 0 for no
    const urinaryFrequencyOrUrgencyOrIncontinence =
      stratifyScale?.urinaryFrequencyOrUrgencyOrIncontinence == '1476229927081534' ? 1 : 0;
    // increment score by 1 for yes and 0 for no
    const transferAndMobilityProblems =
      stratifyScale?.transferAndMobilityProblems == '1476229927081534' ? 1 : 0;

    // calculate score
    const score =
      historyOfFalls +
      agitatedConfusion +
      visualImpairment +
      urinaryFrequencyOrUrgencyOrIncontinence +
      transferAndMobilityProblems;
    setRecordOfScore({ score: score });
  }, [stratifyScale]);

  useEffect(() => {
    // low: 6830230146334591
    // high: 6830244509957984
    // update riskLevel according to score value
    if (recordOfScore['score'] == 0 || recordOfScore['score'] == 1) {
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
      size={width > 600 ? '36vw' : '25vw'}
    />
  );
};
export default AddNewModal;
