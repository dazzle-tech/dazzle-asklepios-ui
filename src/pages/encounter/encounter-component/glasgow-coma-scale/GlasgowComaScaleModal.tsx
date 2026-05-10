import React, { useMemo } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faG } from '@fortawesome/free-solid-svg-icons';
import { useEnumOptions } from '@/services/enumsApi';
import './Style.less';

const getGcsScore = (
  type: 'eye' | 'verbal' | 'motor',
  value?: string | null
): number => {
  if (!value) return 0;

  const scores: Record<'eye' | 'verbal' | 'motor', Record<string, number>> = {
    eye: {
      SPONTANEOUS: 4,
      TO_SPEECH: 3,
      TO_PAIN: 2,
      NO_RESPONSE: 1,
      EYES_CLOSED_DUE_TO_SWELLING: 0
    },
    verbal: {
      ORIENTED: 5,
      CONFUSED_CONVERSATION: 4,
      INAPPROPRIATE_WORDS: 3,
      INCOMPREHENSIBLE_SOUNDS: 2,
      NO_RESPONSE: 1,
      INTUBATED_TRACHEOSTOMY: 0
    },
    motor: {
      OBEYS_COMMANDS: 6,
      LOCALIZES_PAIN: 5,
      WITHDRAWS_FROM_PAIN: 4,
      FLEXION_TO_PAIN: 3,
      EXTENSION_TO_PAIN: 2,
      NO_RESPONSE: 1
    }
  };

  return scores[type][value] ?? 0;
};

const getGcsInterpretation = (totalScore: number) => {
  if (totalScore >= 13 && totalScore <= 15) {
    return 'MILD_TRAUMATIC_BRAIN_INJURY';
  }

  if (totalScore >= 9 && totalScore <= 12) {
    return 'MODERATE_TRAUMATIC_BRAIN_INJURY';
  }

  if (totalScore >= 3 && totalScore <= 8) {
    return 'SEVERE_TRAUMATIC_BRAIN_INJURY_COMA';
  }

  return undefined;
};

const getRiskBadgeColors = (scoreInterpretation?: string | null) => {
  if (scoreInterpretation === 'MILD_TRAUMATIC_BRAIN_INJURY') {
    return {
      backgroundColor: 'var(--light-green)',
      color: 'var(--primary-green)'
    };
  }

  if (scoreInterpretation === 'MODERATE_TRAUMATIC_BRAIN_INJURY') {
    return {
      backgroundColor: 'var(--light-orange)',
      color: 'var(--primary-orange)'
    };
  }

  if (scoreInterpretation === 'SEVERE_TRAUMATIC_BRAIN_INJURY_COMA') {
    return {
      backgroundColor: 'var(--light-pink)',
      color: 'var(--primary-pink)'
    };
  }

  return {
    backgroundColor: 'var(--background-gray)',
    color: 'var(--primary-gray)'
  };
};

const GlasgowComaScaleModal = ({
  open,
  setOpen,
  width,
  gcsAssessment,
  setGcsAssessment,
  handleSave
}) => {
  const eyeOpeningOptions = useEnumOptions('GCSEye');
  const verbalResponseOptions = useEnumOptions('GCSVerbal');
  const motorResponseOptions = useEnumOptions('GCSMotor');

  const eyeOpeningScore = useMemo(
    () => getGcsScore('eye', gcsAssessment?.eyeOpening),
    [gcsAssessment?.eyeOpening]
  );

  const verbalResponseScore = useMemo(
    () => getGcsScore('verbal', gcsAssessment?.verbalResponse),
    [gcsAssessment?.verbalResponse]
  );

  const motorResponseScore = useMemo(
    () => getGcsScore('motor', gcsAssessment?.motorResponse),
    [gcsAssessment?.motorResponse]
  );

  const totalScore = useMemo(
    () => eyeOpeningScore + verbalResponseScore + motorResponseScore,
    [eyeOpeningScore, verbalResponseScore, motorResponseScore]
  );

  const scoreInterpretation = useMemo(
    () => getGcsInterpretation(totalScore),
    [totalScore]
  );

  const badgeColors = getRiskBadgeColors(scoreInterpretation);

  const hasAllValues =
    gcsAssessment?.eyeOpening &&
    gcsAssessment?.verbalResponse &&
    gcsAssessment?.motorResponse;

  const conjureFormContent = () => (
    <Form fluid>
      <MyInput
        width="100%"
        fieldName="eyeOpening"
        fieldLabel="Eye Opening"
        fieldType="select"
        selectData={eyeOpeningOptions ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={gcsAssessment}
        setRecord={setGcsAssessment}
        required
      />

      <MyInput
        width="100%"
        fieldName="verbalResponse"
        fieldLabel="Verbal Response"
        fieldType="select"
        selectData={verbalResponseOptions ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={gcsAssessment}
        setRecord={setGcsAssessment}
        required
      />

      <MyInput
        width="100%"
        fieldName="motorResponse"
        fieldLabel="Motor Response"
        fieldType="select"
        selectData={motorResponseOptions ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={gcsAssessment}
        setRecord={setGcsAssessment}
        required
      />

      <div className="gcs-score-preview">
        <div className="gcs-score-preview-header">
          <span>Score Summary</span>
        </div>

        <div className="gcs-score-grid">
          <div className="gcs-score-card">
            <span className="gcs-score-label">Eye Score</span>
            <strong className="gcs-score-value">{eyeOpeningScore}</strong>
          </div>

          <div className="gcs-score-card">
            <span className="gcs-score-label">Verbal Score</span>
            <strong className="gcs-score-value">{verbalResponseScore}</strong>
          </div>

          <div className="gcs-score-card">
            <span className="gcs-score-label">Motor Score</span>
            <strong className="gcs-score-value">{motorResponseScore}</strong>
          </div>

          <div className="gcs-score-card gcs-total-card">
            <span className="gcs-score-label">Total Score</span>
            <strong className="gcs-score-value">{totalScore}</strong>
          </div>
        </div>

        <div className="gcs-badge-row">
          <MyBadgeStatus
            backgroundColor={badgeColors.backgroundColor}
            color={badgeColors.color}
            contant={
              hasAllValues
                ? formatEnumString(scoreInterpretation)
                : 'Select all values'
            }
          />
        </div>
      </div>
    </Form>
  );

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        gcsAssessment?.id
          ? 'Edit Glasgow Coma Scale Assessment'
          : 'New Glasgow Coma Scale Assessment'
      }
      position="right"
      content={<div dir={dir}>{conjureFormContent()}</div>}
      actionButtonLabel={gcsAssessment?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Assessment Info', icon: <FontAwesomeIcon icon={faG} /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};

export default GlasgowComaScaleModal;