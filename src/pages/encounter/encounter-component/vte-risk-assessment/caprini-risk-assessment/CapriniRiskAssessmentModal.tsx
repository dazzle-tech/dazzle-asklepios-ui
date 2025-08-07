import React, { useEffect, useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import './style.less';

const CapriniRiskAssessmentModal = ({ open, setOpen, onSave }) => {
  // State to store selected risk factors and total score
  const [record, setRecord] = useState({
    onePoint: [],
    twoPoints: [],
    threePoints: [],
    fivePoints: [],
    totalScore: 0
  });

  // Load LOVs for risk factors and recommended actions
  const { data: lov1 } = useGetLovValuesByCodeQuery('CAPRINI_1POINT');
  const { data: lov2 } = useGetLovValuesByCodeQuery('CAPRINI_2POINTS');
  const { data: lov3 } = useGetLovValuesByCodeQuery('CAPRINI_3POINTS');
  const { data: lov5 } = useGetLovValuesByCodeQuery('CAPRINI_5POINTS');
  const { data: actionLov } = useGetLovValuesByCodeQuery('CAPRINI_RECOMMENDED_ACTIONS');

  // Extract LOV arrays from API data
  const onePointLOV = lov1?.object || [];
  const twoPointsLOV = lov2?.object || [];
  const threePointsLOV = lov3?.object || [];
  const fivePointsLOV = lov5?.object || [];

  // Calculate total score based on selected values
  const getTotalScore = () => {
    const getSum = (selected, lovList) => {
      return selected.reduce((sum, val) => {
        const item = lovList.find(i => i.valueCode === val);
        return sum + (Number(item?.score) || 0);
      }, 0);
    };

    return (
      getSum(record.onePoint, onePointLOV) +
      getSum(record.twoPoints, twoPointsLOV) +
      getSum(record.threePoints, threePointsLOV) +
      getSum(record.fivePoints, fivePointsLOV)
    );
  };

  // Recalculate total score whenever selections change
  useEffect(() => {
    const total = getTotalScore();
    setRecord(prev => ({ ...prev, totalScore: total }));
  }, [record.onePoint, record.twoPoints, record.threePoints, record.fivePoints]);

  // Determine risk level and styles based on total score
  const getRiskLevel = (score) => {
    if (score >= 5) {
      return {
        label: 'High Risk',
        color: 'var(--primary-pink)',
        backgroundColor: 'var(--light-pink)'
      };
    }
    if (score >= 3) {
      return {
        label: 'Moderate Risk',
        color: 'var(--primary-orange)',
        backgroundColor: 'var(--light-orange)'
      };
    }
    if (score >= 1) {
      return {
        label: 'Low Risk',
        color: 'var(--primary-yellow)',
        backgroundColor: 'var(--light-yellow)'
      };
    }
    return {
      label: 'Very Low Risk',
      color: 'var(--primary-green)',
      backgroundColor: 'var(--light-green)'
    };
  };

  // Map risk levels to corresponding recommended action keys
  const recommendedActionKeys = {
    'Very Low Risk': 'VTE_CAPRINI_ACTIONS_1',
    'Low Risk': 'VTE_CAPRINI_ACTIONS_2',
    'Moderate Risk': 'VTE_CAPRINI_ACTIONS_3',
    'High Risk': 'VTE_CAPRINI_ACTIONS_4'
  };

  // Get current risk info
  const riskInfo = getRiskLevel(record.totalScore);

  // Get recommended action key for current risk level
  const recommendedActionKey = recommendedActionKeys[riskInfo.label];

  // Find recommended action label from LOV
  const recommendedAction = actionLov?.object?.find(
    item => item.valueCode === recommendedActionKey
  )?.lovDisplayVale;

  // Save selected data and close modal
  const handleSave = () => {
    onSave({
      totalScore: record.totalScore,
      riskLevel: riskInfo.label,
      recommendedAction,
      ...record
    });
    setOpen(false);
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Caprini Risk Assessment"
      steps={[{ title: 'Assessment' }]}
      size="37vw"
      position="right"
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      content={
        <Form fluid>
          <div className="padua-score-modal-content">

            {/* 1 Point Risk Factors */}
            <MyInput
              width="100%"
              fieldType="checkPicker"
              fieldName="onePoint"
              record={record}
              setRecord={setRecord}
              label="1 Point Risk Factors"
              selectData={onePointLOV}
              selectDataLabel="lovDisplayVale"
              selectDataValue="valueCode"
              searchable
            />

            {/* 2 Point Risk Factors */}
            <MyInput
              width="100%"
              fieldType="checkPicker"
              fieldName="twoPoints"
              record={record}
              setRecord={setRecord}
              label="2 Point Risk Factors"
              selectData={twoPointsLOV}
              selectDataLabel="lovDisplayVale"
              selectDataValue="valueCode"
              searchable
            />

            {/* 3 Point Risk Factors */}
            <MyInput
              width="100%"
              fieldType="checkPicker"
              fieldName="threePoints"
              record={record}
              setRecord={setRecord}
              label="3 Point Risk Factors"
              selectData={threePointsLOV}
              selectDataLabel="lovDisplayVale"
              selectDataValue="valueCode"
              searchable
            />

            {/* 5 Point Risk Factors */}
            <MyInput
              width="100%"
              fieldType="checkPicker"
              fieldName="fivePoints"
              record={record}
              setRecord={setRecord}
              fieldLabel="5 Point Risk Factors"
              selectData={fivePointsLOV}
              selectDataLabel="lovDisplayVale"
              selectDataValue="valueCode"
              searchable
            />

            {/* Total Score - Read Only */}
            <MyInput
              width="100%"
              fieldType="number"
              fieldLabel="Total Score"
              fieldName="totalScore"
              record={record}
              setRecord={setRecord}
              readOnly
            />

            {/* Show Risk Level Badge */}
            <MyBadgeStatus
              backgroundColor={riskInfo.backgroundColor}
              color={riskInfo.color}
              contant={riskInfo.label}
            />

            {/* Show Recommended Action Badge if exists */}
            {recommendedAction && (
              <MyBadgeStatus
                backgroundColor="#e0f7ff"
                color="#007bff"
                contant={recommendedAction}
              />
            )}
          </div>
        </Form>
      }
    />
  );
};

export default CapriniRiskAssessmentModal;
