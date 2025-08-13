import React, { useEffect, useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListOl } from '@fortawesome/free-solid-svg-icons';
import './style.less';

const PaduaPredictionScoreModal = ({ open, setOpen, onSave }) => {
  const [record, setRecord] = useState({
    activeCancer: false,
    previousVTE: false,
    reducedMobility: false,
    knownThrombophilicCondition: false,
    recentTraumaOrSurgery: false,
    elderlyAge: false,
    heartOrRespiratoryFailure: false,
    acuteMIOrStroke: false,
    acuteInfectionOrRheumatologic: false,
    obesity: false,
    ongoingHormonalTreatment: false,
    paduaScore: 0
  });

  const { data: paduaLovData } = useGetLovValuesByCodeQuery('PADUA_SCORE');
  const paduaLov = paduaLovData?.object || [];

  // Map field names to LOV display values (correct spelling)
  const fieldToLovDisplayMap = {
    activeCancer: 'Active cancer',
    previousVTE: 'Previous VTE',
    reducedMobility: 'Reduced mobility more than days',
    knownThrombophilicCondition: 'Thrombophilic condition',
    recentTraumaOrSurgery: 'Recent trauma or surgery (less than month)',
    elderlyAge: 'Age more than 70 years',
    heartOrRespiratoryFailure: 'Heart and/or respiratory failure',
    acuteMIOrStroke: 'Acute MI or ischemic stroke',
    acuteInfectionOrRheumatologic: 'Acute infection or rheumatologic disorder',
    obesity: 'Obesity (BMI more than 30)',
    ongoingHormonalTreatment: 'Hormonal treatment'
  };

  // Build a map of fieldName => valueCode from paduaLov
  const valueCodeMap = {};
  for (const [fieldName, lovDisplay] of Object.entries(fieldToLovDisplayMap)) {
    const lovItem = paduaLov.find(i => i.lovDisplayVale === lovDisplay);
    if (lovItem) {
      valueCodeMap[fieldName] = lovItem.valueCode;
    }
  }

  // Get score by valueCode from paduaLov
  const getScoreByValueCode = (list, valueCode) => {
    if (!Array.isArray(list)) return 0;
    const item = list.find(i => i.valueCode === valueCode);
    return Number(item?.score ?? 0);
  };

  const fields = Object.keys(fieldToLovDisplayMap);

  // Calculate total score whenever checkboxes or LOV data changes
  useEffect(() => {
    if (!paduaLov.length) return;

    const totalScore = fields.reduce((sum, field) => {
      if (record[field]) {
        const valueCode = valueCodeMap[field];
        const score = getScoreByValueCode(paduaLov, valueCode);
        return sum + score;
      }
      return sum;
    }, 0);

    setRecord(prev =>
      prev.paduaScore === totalScore ? prev : { ...prev, paduaScore: totalScore }
    );
  }, [...fields.map(f => record[f]), paduaLov]);

  //Handle the Risk Info
  const getRiskInfo = score => {
    if (score >= 4) {
      return {
        label: 'High Risk',
        backgroundColor: 'var(--light-orange)',
        color: 'var(--primary-orange)'
      };
    }
    return {
      label: 'Low Risk',
      backgroundColor: 'var(--light-green)',
      color: 'var(--primary-green)'
    };
  };

  const riskInfo = getRiskInfo(record.paduaScore);

  const handleSave = () => {
    onSave({
      totalScore: record.paduaScore,
      riskLevel: riskInfo.label,
      ...record
    });
    setOpen(false);
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Padua Prediction Score"
      steps={[{ title: 'Assessment',icon:<FontAwesomeIcon icon={faListOl} /> }]}
      size="37vw"
      position="right"
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      content={
        <Form fluid>
          <div className="padua-score-modal-content">
            <div className="checkbox-grid">
  {fields.map(field => (
    <div className="checkbox-item" key={field}>
      <MyInput
        width="100%"
        fieldType="check"
        fieldName={field}
        record={record}
        setRecord={setRecord}
        label={fieldToLovDisplayMap[field]}
        showLabel={false}
      />
    </div>
  ))}
</div>


            <div>
              <MyInput
                width="100%"
                fieldType="number"
                fieldLabel="Total Score"
                fieldName="paduaScore"
                record={record}
                setRecord={setRecord}
                readOnly
              />
            </div>

            <div>
              <MyBadgeStatus
                backgroundColor={riskInfo.backgroundColor}
                color={riskInfo.color}
                contant={riskInfo.label}
              />
            </div>
          </div>
        </Form>
      }
    />
  );
};

export default PaduaPredictionScoreModal;
