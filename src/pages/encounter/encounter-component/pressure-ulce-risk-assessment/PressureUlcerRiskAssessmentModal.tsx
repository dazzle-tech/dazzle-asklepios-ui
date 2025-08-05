//Declare
import React, { useState, useEffect } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import ScoreCalculation from '@/pages/medical-component/score-calculation';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import './Style.less';

const PressureUlcerRiskAssessmentModal = ({ open, setOpen, onSave }) => {
  // Define fields with their LOV codes and labels

  // Fetch LOV data for each field
  const { data: sensoryLovData } = useGetLovValuesByCodeQuery('BRADEN_SENSORY');
  const { data: moistureLovData } = useGetLovValuesByCodeQuery('BRADEN_MOIST');
  const { data: activityLovData } = useGetLovValuesByCodeQuery('BRADEN_ACTIVITY');
  const { data: mobilityLovData } = useGetLovValuesByCodeQuery('BRADEN_MOBILITY');
  const { data: nutritionLovData } = useGetLovValuesByCodeQuery('BRADEN_NUTRI');
  const { data: frictionShearLovData } = useGetLovValuesByCodeQuery('BRADEN_FRIC_SHEAR');
  // Map LOV codes to their data arrays for easy access
  // Extract the object arrays or default to empty arrays
  const sensoryLov = sensoryLovData.object || [];
  const moistureLov = moistureLovData.object || [];
  const activityLov = activityLovData.object || [];
  const mobilityLov = mobilityLovData.object || [];
  const nutritionLov = nutritionLovData.object || [];
  const frictionShearLov = frictionShearLovData.object || [];
  const fields = React.useMemo(
    () => [
      { fieldName: 'sensoryPerception', lovCode: 'BRADEN_SENSORY', label: 'Sensory Perception' },
      { fieldName: 'moisture', lovCode: 'BRADEN_MOIST', label: 'Moisture' },
      { fieldName: 'activity', lovCode: 'BRADEN_ACTIVITY', label: 'Activity' },
      { fieldName: 'mobility', lovCode: 'BRADEN_MOBILITY', label: 'Mobility' },
      { fieldName: 'nutrition', lovCode: 'BRADEN_NUTRI', label: 'Nutrition' },
      { fieldName: 'frictionShear', lovCode: 'BRADEN_FRIC_SHEAR', label: 'Friction & Shear' }
    ],
    []
  );
  // Initialize the record state with empty values and totalScore = 0
  const initialRecord = {
    ...fields.reduce((acc, f) => ({ ...acc, [f.fieldName]: '' }), {}),
    totalScore: 0
  };
  initialRecord.totalScore = 0;
  const [record, setRecord] = useState(initialRecord);
  const lovMap = React.useMemo(
    () => ({
      BRADEN_SENSORY: sensoryLov,
      BRADEN_MOIST: moistureLov,
      BRADEN_ACTIVITY: activityLov,
      BRADEN_MOBILITY: mobilityLov,
      BRADEN_NUTRI: nutritionLov,
      BRADEN_FRIC_SHEAR: frictionShearLov
    }),
    [sensoryLov, moistureLov, activityLov, mobilityLov, nutritionLov, frictionShearLov]
  );

  // Helper function to get score value from LOV list by key
  const getScoreById = (lovList, id) => {
    if (!Array.isArray(lovList)) return 0;
    const item = lovList.find(entry => entry.key === id);
    return Number(item?.score ?? item?.valueOrder ?? 0);
  };

  // Determine risk level info based on total score ranges
  const getRiskLevelInfo = score => {
    if (score >= 19 && score <= 23) {
      return {
        label: 'No Risk',
        backgroundColor: 'var(--light-green)',
        color: 'var(--primary-green)'
      };
    } else if (score >= 15 && score <= 18) {
      return {
        label: 'Mild Risk',
        backgroundColor: 'var(--light-purple)',
        color: 'var(--primary-purple)'
      };
    } else if (score >= 13 && score <= 14) {
      return {
        label: 'Moderate Risk',
        backgroundColor: 'var(--light-orange)',
        color: 'var(--primary-orange)'
      };
    } else if (score >= 10 && score <= 12) {
      return {
        label: 'High Risk',
        backgroundColor: 'var(--light-pink)',
        color: 'var(--primary-pink)'
      };
    } else {
      return {
        label: 'Very High Risk',
        backgroundColor: 'var(--light-red)',
        color: 'var(--primary-red)'
      };
    }
  };

  // Get current risk info based on the totalScore
  const riskInfo = getRiskLevelInfo(record.totalScore);

  // Handler to save data and close modal
  const handleSave = () => {
    onSave({
      ...record,
      riskLevel: riskInfo.label
    });
    setOpen(false);
  };

  // Modal content JSX including the ScoreCalculation component and risk badge
  const ModalContent = (
    <div className="input-row">
      <div className="score-calculation-position-handle">
        <ScoreCalculation
          record={record}
          setRecord={setRecord}
          fields={fields}
          name="Braden Score"
          disabledAldrete={true}
          totalposition="center"
          width={'14.42vw'}
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
  );

  // Effects
  // Calculate total score when any relevant value or LOV list changes
  useEffect(() => {
    const total = fields.reduce((sum, field) => {
      return sum + getScoreById(lovMap[field.lovCode], record[field.fieldName]);
    }, 0);

    setRecord(prev => ({ ...prev, totalScore: total }));
  }, [fields, lovMap, record]);
  // Render the modal with title, size, position and action button
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Pressure Ulcer Risk Assessment"
      steps={[{ title: 'Assessment' }]}
      size="35vw"
      position="right"
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      content={ModalContent}
    />
  );
};

export default PressureUlcerRiskAssessmentModal;
