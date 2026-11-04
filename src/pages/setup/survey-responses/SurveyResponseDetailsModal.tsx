import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import type { SurveyResponse } from '@/services/survey/surveyService';
import { formatDateWithoutSeconds } from '@/utils';
// Same popup as the patient satisfaction survey responses
import '../patient-satisfaction-survey-responses/styles.less';

type SurveyResponseAnswerRow = SurveyResponse['answers'][number];

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  response: SurveyResponse | null;
};

// The survey language is not stored, so section and question show in both languages
const BothLanguages = ({ en, ar }: { en: string | null; ar: string | null }) => (
  <div>
    <div>{en ?? '-'}</div>
    <div dir="rtl" style={{ color: 'var(--primary-gray)' }}>
      {ar}
    </div>
  </div>
);

const SurveyResponseDetailsModal: React.FC<Props> = ({ open, setOpen, response }) => {
  if (!response) {
    return null;
  }

  const answerColumns = [
    {
      key: 'section',
      title: <Translate>Section</Translate>,
      flexGrow: 2,
      render: (row: SurveyResponseAnswerRow) => <BothLanguages en={row.sectionNameEn} ar={row.sectionNameAr} />
    },
    {
      key: 'question',
      title: <Translate>Question</Translate>,
      flexGrow: 4,
      render: (row: SurveyResponseAnswerRow) => <BothLanguages en={row.questionEn} ar={row.questionAr} />
    },
    {
      key: 'answer',
      title: <Translate>Answer</Translate>,
      flexGrow: 3,
      // e.g. "4 / 5" for SCALE, the text for TEXT
      render: (row: SurveyResponseAnswerRow) =>
        row.answerType === 'TEXT'
          ? row.textValue ?? '-'
          : row.score != null
            ? `${row.score} / ${row.maxValue ?? '-'}`
            : '-'
    }
  ];

  const summary: [string, React.ReactNode][] = [
    ['Patient Name', response.patientName || <Translate>Anonymous</Translate>],
    ['MRN', response.medicalRecordNumber || '-'],
    ['Overall Score', response.overallScore ?? '-'],
    ['Overall Percentage', response.overallPercentage != null ? `${response.overallPercentage}%` : '-'],
    ['Started At', formatDateWithoutSeconds(response.startedAt ?? '')],
    ['Completed At', formatDateWithoutSeconds(response.completedAt ?? '')],
    ['Created Date', formatDateWithoutSeconds(response.createdDate ?? '')]
  ];

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
            {summary.map(([label, value]) => (
              <div key={label}>
                <strong>
                  <Translate>{label}</Translate>:
                </strong>{' '}
                {value}
              </div>
            ))}
          </div>

          <MyTable data={response.answers} columns={answerColumns} height={360} />
        </div>
      }
    />
  );
};

export default SurveyResponseDetailsModal;
