//declares
import React, { useState, useEffect } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import { Form, Row } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListCheck } from '@fortawesome/free-solid-svg-icons';
import MyInput from '@/components/MyInput';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import './Style.less';
//dropdownlist values/Score
const selectDataMap = {
  fallHistory: [
    { label: 'Yes', score: 5 },
    { label: 'No', score: 0 }
  ],
  sedatives: [
    { label: 'Yes', score: 3 },
    { label: 'No', score: 0 }
  ],
  elimination: [
    { label: 'Urgency/frequency', score: 2 },
    { label: 'Incontinence', score: 4 },
    { label: 'Both', score: 4 },
    { label: 'None', score: 0 }
  ],
  equipment: [
    { label: '1 piece', score: 1 },
    { label: '2 pieces', score: 2 },
    { label: 'More than 3 pieces', score: 3 },
    { label: 'None', score: 0 }
  ],
  mobility: [
    { label: 'Requires assistance/supervision', score: 2 },
    { label: 'Unsteady gait', score: 2 },
    { label: 'Impaired', score: 4 },
    { label: 'Normal', score: 0 }
  ],
  cognition: [
    { label: 'Altered awareness', score: 1 },
    { label: 'Impaired judgment', score: 2 },
    { label: 'Impulsive', score: 4 },
    { label: 'Oriented', score: 0 }
  ],
  age: [
    { label: '≥ 80 years', score: 4 },
    { label: '70–79 years', score: 3 },
    { label: '60–69 years', score: 2 },
    { label: '50–59 years', score: 1 },
    { label: '< 50 years', score: 0 }
  ]
};

//props for modal
const JohnsHopkinsToolModal = ({ open, setOpen, onSave }) => {
  const [record, setRecord] = useState({
    //first value for each input
    fallHistory: null,
    sedatives: null,
    elimination: null,
    equipment: null,
    mobility: null,
    cognition: null,
    age: null
  });

  //scores declare
  const [totalScore, setTotalScore] = useState(0);
  // handle Data collection
  useEffect(() => {
    let sum = 0;
    Object.values(record).forEach(selected => {
      if (selected && typeof selected === 'object' && 'score' in selected) {
        sum += selected.score;
      }
    });
    setTotalScore(sum);
  }, [record]);

  //save input record / value
  const handleSelectChange = (fieldName, selectedLabel) => {
    const options = selectDataMap[fieldName] || [];
    const selectedObj = options.find(item => item.label === selectedLabel) || null;
    setRecord(prev => ({ ...prev, [fieldName]: selectedObj }));
  };
  // handle save function
  const handleSave = () => {
    onSave({ totalScore, riskLevel: riskInfo.label });
    setOpen(false);
  };
  //Risk values&colors
  const getRiskLevelInfo = score => {
    if (score >= 14) {
      return {
        label: 'High Risk',
        backgroundColor: 'var(--light-pink)',
        color: 'var(--primary-pink)'
      };
    } else if (score >= 6) {
      return {
        label: 'Moderate Risk',
        backgroundColor: 'var(--light-orange)',
        color: 'var(--primary-orange)'
      };
    } else {
      return {
        label: 'Low Risk',
        backgroundColor: 'var(--light-green)',
        color: 'var(--primary-green)'
      };
    }
  };
  //declare risk
  const riskInfo = getRiskLevelInfo(totalScore);

  //Modal Content
  const ModalContent = (
    <Form fluid>
        <div className='jhons-hopkins-tool-input-main-container'>
        <div className='jhons-hopkins-tool-input-coulmns'>
        <MyInput
          width="100%"
          fieldType="select"
          fieldLabel="Fall History (within 6 months)"
          fieldName="fallHistory"
          selectData={selectDataMap.fallHistory}
          selectDataLabel="label"
          selectDataValue="label"
          record={{ fallHistory: record.fallHistory?.label || '' }}
          setRecord={updated => handleSelectChange('fallHistory', updated.fallHistory)}
          searchable={false}
        />
        <MyInput
          width="100%"
          fieldType="select"
          fieldLabel="On sedatives, hypnotics, anticonvulsants, opioids"
          fieldName="sedatives"
          selectData={selectDataMap.sedatives}
          selectDataLabel="label"
          selectDataValue="label"
          record={{ sedatives: record.sedatives?.label || '' }}
          setRecord={updated => handleSelectChange('sedatives', updated.sedatives)}
          searchable={false}
        />
        <MyInput
          width="100%"
          fieldType="select"
          fieldLabel="Elimination (urgency/incontinence)"
          fieldName="elimination"
          selectData={selectDataMap.elimination}
          selectDataLabel="label"
          selectDataValue="label"
          record={{ elimination: record.elimination?.label || '' }}
          setRecord={updated => handleSelectChange('elimination', updated.elimination)}
          searchable={false}
        />
          <MyInput
            width="100%"
            fieldType="select"
            fieldLabel="Patient Care Equipment"
            fieldName="equipment"
            selectData={selectDataMap.equipment}
            selectDataLabel="label"
            selectDataValue="label"
            record={{ equipment: record.equipment?.label || '' }}
            setRecord={updated => handleSelectChange('equipment', updated.equipment)}
          /></div>      
        <div className="jhons-hopkins-tool-input-row">
          <MyInput
            width="8vw"
            fieldType="select"
            fieldLabel="Mobility"
            fieldName="mobility"
            selectData={selectDataMap.mobility}
            selectDataLabel="label"
            selectDataValue="label"
            record={{ mobility: record.mobility?.label || '' }}
            setRecord={updated => handleSelectChange('mobility', updated.mobility)}
            searchable={false}
          />
          <MyInput
            width="8vw"
            fieldType="select"
            fieldLabel="Cognition"
            fieldName="cognition"
            selectData={selectDataMap.cognition}
            selectDataLabel="label"
            selectDataValue="label"
            record={{ cognition: record.cognition?.label || '' }}
            setRecord={updated => handleSelectChange('cognition', updated.cognition)}
            searchable={false}
          />
          <MyInput
            width="8vw"
            fieldType="select"
            fieldLabel="Age"
            fieldName="age"
            selectData={selectDataMap.age}
            selectDataLabel="label"
            selectDataValue="label"
            record={{ age: record.age?.label || '' }}
            setRecord={updated => handleSelectChange('age', updated.age)}
            searchable={false}
          /></div>
          <div className='jhons-hopkins-tool-modal-total-score'>
          <MyInput
            width="100%"
            fieldType="text"
            fieldLabel="Total Score"
            fieldName="totalScore"
            record={{ totalScore: totalScore.toString() }}
            setRecord={''}
            disabled={true}
          /></div>
<div className='jhons-hopkins-tool-modal-my-badge-status'>
              <MyBadgeStatus
                backgroundColor={riskInfo.backgroundColor}
                color={riskInfo.color}
                contant={riskInfo.label}
              /></div>
              
              </div>
{' '}
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Johns Hopkins Fall Risk Assessment"
      steps={[{ title: 'Assessment',icon:<FontAwesomeIcon icon={faListCheck}/>}]}
      size="33vw"
      position="right"
      bodyheight='82vh'
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      content={ModalContent}
    />
  );
};

export default JohnsHopkinsToolModal;
