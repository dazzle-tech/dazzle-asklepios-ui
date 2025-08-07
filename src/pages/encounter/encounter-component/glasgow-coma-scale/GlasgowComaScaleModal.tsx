//declares
import React, { useState, useEffect } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import ScoreCalculation from '@/pages/medical-component/score-calculation';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import './Style.less';

const GlasgowComaScaleModal = ({ open, setOpen, onSave }) => {
  // State to hold selected values for Eye, Verbal, Motor responses and the total Glasgow score
  const [record, setRecord] = useState({
    eyeOpening: '',
    verbalResponse: '',
    motorResponse: '',
    aldreteScore: 0
  });

  // Retrieve LOV lists for Eye Opening, Verbal Response, and Motor Response
  const { data: eyeLovData } = useGetLovValuesByCodeQuery('GCS_EYE');
  const { data: verbalLovData } = useGetLovValuesByCodeQuery('GCS_VERBAL');
  const { data: motorLovData } = useGetLovValuesByCodeQuery('GCS_MOTOR');
  const eyeLov = eyeLovData?.object || [];
  const verbalLov = verbalLovData?.object || [];
  const motorLov = motorLovData?.object || [];

  // Get the numeric score from a list of values (LOV) by matching the ID
  const getScoreById = (lovList, id) => {
    if (!Array.isArray(lovList)) return 0;
    const item = lovList.find(entry => entry.key === id);
    if (!item) return 0;
    return Number(item.score ?? item.valueOrder ?? 0);
  };

  // Return risk level label and color scheme according to score ranges:
  const getRiskLevelInfo = score => {
    if (score >= 13 && score <= 15) {
      return {
        label: 'Mild brain injury',
        backgroundColor: 'var(--light-green)',
        color: 'var(--primary-green)'
      };
    } else if (score >= 9 && score <= 12) {
      return {
        label: 'Moderate brain injury',
        backgroundColor: 'var(--light-orange)',
        color: 'var(--primary-orange)'
      };
    } else if (score <= 8) {
      return {
        label: 'Severe brain injury (coma)',
        backgroundColor: 'var(--light-pink)',
        color: 'var(--primary-pink)'
      };
    } else {
      return {
        label: 'Unknown',
        backgroundColor: 'var(--background-gray)',
        color: 'var(--primary-gray)'
      };
    }
  };

  const riskInfo = getRiskLevelInfo(record.aldreteScore);

  //handle save
  const handleSave = () => {
    onSave({
      totalScore: record.aldreteScore,
      riskLevel: riskInfo.label,
      eyeOpening: record.eyeOpening,
      verbalResponse: record.verbalResponse,
      motorResponse: record.motorResponse
    });
    setOpen(false);
  };

  // Fields configuration: field names, associated LOV codes, and labels
  const fields = [
    { fieldName: 'eyeOpening', lovCode: 'GCS_EYE', label: 'Eye Opening' },
    { fieldName: 'verbalResponse', lovCode: 'GCS_VERBAL', label: 'Verbal Response' },
    { fieldName: 'motorResponse', lovCode: 'GCS_MOTOR', label: 'Motor Response' }
  ];

  const ModalContent = (
    <>
      <div className="input-row">
        <div className="score-calculation-position-handle">
          <ScoreCalculation
            record={record}
            setRecord={setRecord}
            fields={fields}
            name="Glasgow Score"
            disabledAldrete={true}
            width={'26.1vw'}
          />
        </div>
        <div className="badge-box">
          <MyBadgeStatus
            backgroundColor={riskInfo.backgroundColor}
            color={riskInfo.color}
            contant={riskInfo.label}
          />
        </div>
      </div>
    </>
  );
  // Effects
  // Update total score by summing scores from selected Eye, Verbal, and Motor responses
  useEffect(() => {
    if (!eyeLov.length || !verbalLov.length || !motorLov.length) return;

    const totalScore =
      getScoreById(eyeLov, record.eyeOpening) +
      getScoreById(verbalLov, record.verbalResponse) +
      getScoreById(motorLov, record.motorResponse);

    setRecord(prev => ({ ...prev, aldreteScore: totalScore }));
  }, [record.eyeOpening, record.verbalResponse, record.motorResponse, eyeLov, verbalLov, motorLov]);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Glasgow Coma Scale Assessment"
      steps={[{ title: 'Assessment' }]}
      size="30vw"
      position="right"
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      content={ModalContent}
    />
  );
};

export default GlasgowComaScaleModal;
