import React, { useMemo } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { getAllSurveyQuestions } from '@/pages/patient-satisfaction-survey/surveyConfig';
import type { PatientSatisfactionSurveyResponseVM } from '@/pages/patient-satisfaction-survey/types';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import './styles.less';

type SurveyResponseDetailsModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  response: PatientSatisfactionSurveyResponseVM | null;
};

const SurveyResponseDetailsModal: React.FC<SurveyResponseDetailsModalProps> = ({
  open,
  setOpen,
  response
}) => {
  const questionLabelByCode = useMemo(() => {
    const map = new Map<string, string>();

    getAllSurveyQuestions().forEach(question => {
      map.set(question.code, question.textEn);
    });

    return map;
  }, []);

  const answerRows = useMemo(
    () =>
      (response?.answers ?? []).map(answer => ({
        ...answer,
        questionLabel: questionLabelByCode.get(answer.questionCode) ?? answer.questionCode
      })),
    [response?.answers, questionLabelByCode]
  );

  const answerColumns = [
    {
      key: 'questionLabel',
      title: <Translate>Question</Translate>,
      flexGrow: 4
    },
    {
      key: 'answer',
      title: <Translate>Answer</Translate>,
      flexGrow: 4
    },
    {
      key: 'score',
      title: <Translate>Score</Translate>,
      width: 100,
      align: 'center' as const,
      render: (row: { score?: number | null }) =>
        row.score === null || row.score === undefined ? '-' : row.score
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
              {response.overallPercentage ?? '-'}
            </div>
            <div>
              <strong>
                <Translate>Started At</Translate>:
              </strong>{' '}
              {formatDateWithoutSeconds(response.startedAt)}
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
              {formatDateWithoutSeconds(response.createdDate)}
            </div>
          </div>

          <MyTable data={answerRows} columns={answerColumns} height={360} />
        </div>
      }
    />
  );
};

export default SurveyResponseDetailsModal;
