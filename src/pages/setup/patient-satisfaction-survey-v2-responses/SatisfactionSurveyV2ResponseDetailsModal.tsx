import React, { useMemo } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { SATISFACTION_SURVEY_V2_QUESTIONS } from '@/pages/patient-satisfaction-survey-v2/surveyQuestions';
import type { PatientSatisfactionSurveyV2ResponseVM } from '@/services/patient-satisfaction-survey-v2/patientSatisfactionSurveyV2Service';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
// Same popup as the patient satisfaction survey responses, reading the satisfaction survey v2 answers
import '../patient-satisfaction-survey-responses/styles.less';

type SatisfactionSurveyV2ResponseDetailsModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  response: PatientSatisfactionSurveyV2ResponseVM | null;
};

const SatisfactionSurveyV2ResponseDetailsModal: React.FC<SatisfactionSurveyV2ResponseDetailsModalProps> = ({
  open,
  setOpen,
  response
}) => {
  const questionLabelByCode = useMemo(
    () =>
      new Map(
        SATISFACTION_SURVEY_V2_QUESTIONS.map(question => [
          question.code,
          { textEn: question.textEn, textAr: question.textAr }
        ])
      ),
    []
  );

  const answerRows = useMemo(
    () =>
      (response?.answers ?? []).map(answer => {
        const question = questionLabelByCode.get(answer.questionCode);

        return {
          ...answer,
          answer: answer.answerText ?? (answer.score != null ? String(answer.score) : ''),
          question
        };
      }),
    [response?.answers, questionLabelByCode]
  );

  const answerColumns = [
    {
      key: 'question',
      title: <Translate>Question</Translate>,
      flexGrow: 4,
      // The survey language is not stored, so the question shows in both languages
      render: (row: (typeof answerRows)[number]) =>
        row.question ? (
          <div>
            <div>{row.question.textEn}</div>
            <div dir="rtl" style={{ color: 'var(--primary-gray)' }}>
              {row.question.textAr}
            </div>
          </div>
        ) : (
          row.questionCode
        )
    },
    {
      key: 'answer',
      title: <Translate>Answer</Translate>,
      flexGrow: 4
    }
  ];

  if (!response) {
    return null;
  }

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={<Translate>Survey Response Details</Translate>}
      size="70vw"
      bodyheight="65vh"
      hideActionBtn
      cancelButtonLabel="Close"
      handleCancelFunction={() => setOpen(false)}
      content={
        <div className="survey-response-details-modal">
          <div className="survey-response-details-summary">
            <div>
              <strong>
                <Translate>Patient Name</Translate>:
              </strong>{' '}
              {response.patientName || '-'}
            </div>

            <div>
              <strong>
                <Translate>Status</Translate>:
              </strong>{' '}
              {formatEnumString(response.status)}
            </div>

            <div>
              <strong>
                <Translate>Overall Score</Translate>:
              </strong>{' '}
              {response.overallScore ?? '-'}
            </div>

            <div>
              <strong>
                <Translate>Overall Percentage</Translate>:
              </strong>{' '}
              {response.overallPercentage != null ? `${response.overallPercentage}%` : '-'}
            </div>

            <div>
              <strong>
                <Translate>Started At</Translate>:
              </strong>{' '}
              {formatDateWithoutSeconds(response.startedAt ?? '')}
            </div>

            <div>
              <strong>
                <Translate>Completed At</Translate>:
              </strong>{' '}
              {formatDateWithoutSeconds(response.completedAt ?? '')}
            </div>

            <div>
              <strong>
                <Translate>Created Date</Translate>:
              </strong>{' '}
              {formatDateWithoutSeconds(response.createdDate ?? '')}
            </div>
          </div>

          <MyTable data={answerRows} columns={answerColumns} height={360} />
        </div>
      }
    />
  );
};

export default SatisfactionSurveyV2ResponseDetailsModal;
