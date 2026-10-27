import React, { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Form, Panel, Tooltip, Whisper } from 'rsuite';
import Logo from '@/images/Logo_BLUE_New1.svg';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import MyStepper from '@/components/MyStepper';
import SectionContainer from '@/components/SectionsoContainer';
import { useBranding } from '@/hooks/useBranding';
import {
  PatientSatisfactionSurveyV2Answer,
  useSubmitPatientSatisfactionSurveyV2Mutation
} from '@/services/patient-satisfaction-survey-v2/patientSatisfactionSurveyV2Service';
import {
  SATISFACTION_SURVEY_V2_QUESTIONS,
  SATISFACTION_SURVEY_V2_SECTIONS,
  SatisfactionSurveyV2Language,
  SatisfactionSurveyV2Question,
  SatisfactionSurveyV2Section
} from './surveyQuestions';
import { formatSurveyDate } from '../patient-satisfaction-survey/surveyUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines, faListOl } from '@fortawesome/free-solid-svg-icons';
// Same look as the patient satisfaction survey
import '../patient-satisfaction-survey/styles.less';
import './styles.less';

type SurveyPhase = 'landing' | 'survey' | 'thankyou';

const PRIMARY = 'var(--primary-blue)';

type SurveyIdentityMode = 'named' | 'anonymous';

type SurveyLayout = 'single' | 'steps';

// The first page (name and instructions) is the same as in the patient satisfaction survey
const COPY = {
  en: {
    surveyTitle: 'Patient Satisfaction Survey',
    instructionsTitle: 'SURVEY INSTRUCTIONS:',
    proceed: 'Proceed to Survey',
    identityPrompt: 'How would you like to continue?',
    continueWithName: (name: string) => (name ? `Continue as ${name}` : 'Continue as'),
    continueAnonymous: 'Continue anonymously',
    anonymousPatientName: 'Anonymous',
    selectIdentity: 'Please choose how you would like to continue.',
    patientNameLabel: 'Your name',
    enterPatientName: 'Please enter your name or continue anonymously.',
    instructionBody: (facility: string, department: string | null, visitDate: string) =>
      department
        ? `Please rate the services you received on your most recent visit to ${facility}. Select the response that best describes your experience. If a question does not apply to you, please skip to the next question. When you finish, please click on "Submit". Your identity will remain confidential if you want. This survey is to evaluate your visit to ${department} on ${visitDate}. All answers should relate to this visit only.`
        : `Please rate the services you received on your most recent visit to ${facility}. Select the response that best describes your experience. If a question does not apply to you, please skip to the next question. When you finish, please click on "Submit". Your identity will remain confidential if you want. This survey evaluates your visit on ${visitDate}. All answers should relate to this visit only.`,
    layoutSingleHint: 'One page: show all the questions together',
    layoutStepsHint: 'Step by step: show one section at a time',
    previous: 'Previous',
    next: 'Next',
    submit: 'Submit',
    clearSelection: 'Clear Selection',
    requiredAnswer: 'Please answer all required questions to continue.',
    maxCharacters: (count: number) => `Max number of characters: ${count}`,
    submitFailed: 'Unable to submit the survey. Please try again.',
    thankYouTitle: 'Thank You',
    thankYouMessage:
      'Your feedback has been submitted successfully. Your responses will help us improve the quality of care.'
  },
  ar: {
    surveyTitle: 'استبيان رضا المرضى',
    instructionsTitle: 'تعليمات الاستبيان:',
    proceed: 'ابدأ الاستبيان',
    identityPrompt: 'كيف تريد المتابعة؟',
    continueWithName: (name: string) => (name ? `المتابعة باسم ${name}` : 'المتابعة باسم'),
    continueAnonymous: 'المتابعة بشكل مجهول',
    anonymousPatientName: 'مجهول',
    selectIdentity: 'يرجى اختيار طريقة المتابعة.',
    patientNameLabel: 'اسمك',
    enterPatientName: 'يرجى إدخال اسمك أو المتابعة بشكل مجهول.',
    instructionBody: (facility: string, department: string | null, visitDate: string) =>
      department
        ? `يرجى تقييم الخدمات التي تلقيتها في زيارتك الأخيرة إلى ${facility}. اختر الإجابة التي تصف تجربتك بأفضل شكل. إذا كان السؤال لا ينطبق عليك، يرجى الانتقال إلى السؤال التالي. عند الانتهاء، يرجى النقر على "إرسال". ستبقى هويتك سرية اذا اردت. هذا الاستبيان لتقييم زيارتك إلى ${department} بتاريخ ${visitDate}. يجب أن تتعلق جميع الإجابات بهذه الزيارة فقط.`
        : `يرجى تقييم الخدمات التي تلقيتها في زيارتك الأخيرة إلى ${facility}. اختر الإجابة التي تصف تجربتك بأفضل شكل. إذا كان السؤال لا ينطبق عليك، يرجى الانتقال إلى السؤال التالي. عند الانتهاء، يرجى النقر على "إرسال". ستبقى هويتك سرية اذا اردت. هذا الاستبيان لتقييم زيارتك بتاريخ ${visitDate}. يجب أن تتعلق جميع الإجابات بهذه الزيارة فقط.`,
    layoutSingleHint: 'صفحة واحدة: عرض جميع الأسئلة معاً',
    layoutStepsHint: 'خطوة بخطوة: عرض قسم واحد في كل مرة',
    previous: 'السابق',
    next: 'التالي',
    submit: 'إرسال',
    clearSelection: 'مسح الاختيار',
    requiredAnswer: 'يرجى الإجابة على جميع الأسئلة المطلوبة للمتابعة.',
    maxCharacters: (count: number) => `الحد الأقصى لعدد الأحرف: ${count}`,
    submitFailed: 'تعذر إرسال الاستبيان. يرجى المحاولة مرة أخرى.',
    thankYouTitle: 'شكراً لك',
    thankYouMessage: 'تم إرسال ملاحظاتك بنجاح. ستساعدنا إجاباتك في تحسين جودة الرعاية.'
  }
};

// Same as the satisfaction survey: a question must be answered unless it is optional
const isRequired = (question: SatisfactionSurveyV2Question) => !question.optional;

// Same default as the satisfaction survey
const DEFAULT_TEXT_MAX_LENGTH = 1500;

const RATING_VALUES = [1, 2, 3, 4, 5];

const PatientSatisfactionSurveyV2Page = () => {
  const [submitSurvey, { isLoading: isSubmitting }] = useSubmitPatientSatisfactionSurveyV2Mutation();
  const branding = useBranding();

  const [language, setLanguage] = useState<SatisfactionSurveyV2Language>('en');
  const copy = COPY[language];
  const isRtl = language === 'ar';

  const [phase, setPhase] = useState<SurveyPhase>('landing');
  // Same link parameters as the satisfaction survey
  const [searchParams] = useSearchParams();
  const patientNameFromUrl = searchParams.get('patientName')?.trim() ?? '';
  const anonymousFromUrl = ['true', '1', 'yes'].includes(
    (searchParams.get('anonymous') ?? '').toLowerCase()
  );
  const departmentFromUrl = searchParams.get('department')?.trim() ?? '';
  const facility = searchParams.get('facility') ?? 'One Health';
  const visitDate = formatSurveyDate(searchParams.get('visitDate') ?? new Date().toISOString());

  const [identityMode, setIdentityMode] = useState<SurveyIdentityMode | null>(
    anonymousFromUrl ? 'anonymous' : null
  );
  const [landingRecord, setLandingRecord] = useState({ patientName: patientNameFromUrl });
  const [landingError, setLandingError] = useState('');

  const enteredPatientName = landingRecord.patientName?.trim() ?? '';
  const effectivePatientName = patientNameFromUrl || enteredPatientName;

  const landingDisplayName = useMemo(() => {
    if (identityMode === 'anonymous') return copy.anonymousPatientName;
    if (identityMode === 'named' && effectivePatientName) return effectivePatientName;
    return effectivePatientName || copy.patientNameLabel;
  }, [identityMode, effectivePatientName, copy.anonymousPatientName, copy.patientNameLabel]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  // Marks the unanswered required questions after a Submit attempt
  const [showMissing, setShowMissing] = useState(false);
  const startedAtRef = useRef<string | null>(null);

  const [layout, setLayout] = useState<SurveyLayout>('single');
  const [sectionIndex, setSectionIndex] = useState(0);
  const isFirstSection = sectionIndex === 0;
  const isLastSection = sectionIndex === SATISFACTION_SURVEY_V2_SECTIONS.length - 1;

  const stepperList = useMemo(
    () =>
      SATISFACTION_SURVEY_V2_SECTIONS.map(section => ({
        key: section.id,
        value: <span>{isRtl ? section.titleAr : section.titleEn}</span>,
        description: '',
        isError: false
      })),
    [isRtl]
  );

  // Questions are numbered across the whole survey, not per section
  const questionNumbers = useMemo(
    () => new Map(SATISFACTION_SURVEY_V2_QUESTIONS.map((question, index) => [question.code, index + 1])),
    []
  );

  const questionText = (question: SatisfactionSurveyV2Question) =>
    isRtl ? question.textAr : question.textEn;

  const isMissing = (question: SatisfactionSurveyV2Question) =>
    isRequired(question) && scores[question.code] == null;

  const handleSelectNamedIdentity = () => {
    if (!effectivePatientName) {
      setLandingError(copy.enterPatientName);
      return;
    }
    setIdentityMode('named');
    setLandingError('');
  };

  const handleSelectAnonymousIdentity = () => {
    setIdentityMode('anonymous');
    setLandingError('');
  };

  const handleProceed = () => {
    if (!identityMode) {
      setLandingError(copy.selectIdentity);
      return;
    }
    if (identityMode === 'named' && !effectivePatientName) {
      setLandingError(copy.enterPatientName);
      return;
    }
    setLandingError('');
    startedAtRef.current = new Date().toISOString();
    setPhase('survey');
  };

  const scrollToQuestion = (code: string) =>
    // After a step change the question renders on the next frame
    requestAnimationFrame(() =>
      document
        .getElementById(`survey-v2-question-${code}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    );

  const changeLayout = (next: SurveyLayout) => {
    setLayout(next);
    setSectionIndex(0);
    setError('');
  };

  const handleNext = () => {
    const missing = SATISFACTION_SURVEY_V2_SECTIONS[sectionIndex].questions.find(isMissing);
    if (missing) {
      setShowMissing(true);
      setError(copy.requiredAnswer);
      scrollToQuestion(missing.code);
      return;
    }
    setError('');
    setSectionIndex(index => index + 1);
  };

  const handlePrevious = () => {
    if (isFirstSection) return;
    setError('');
    setSectionIndex(index => index - 1);
  };

  const handleSubmit = async () => {
    const firstMissing = SATISFACTION_SURVEY_V2_QUESTIONS.find(isMissing);
    if (firstMissing) {
      setShowMissing(true);
      setError(copy.requiredAnswer);
      if (layout === 'steps') {
        setSectionIndex(
          SATISFACTION_SURVEY_V2_SECTIONS.findIndex(section =>
            section.questions.some(question => question.code === firstMissing.code)
          )
        );
      }
      scrollToQuestion(firstMissing.code);
      return;
    }

    const answers = SATISFACTION_SURVEY_V2_QUESTIONS.flatMap(
      (question): PatientSatisfactionSurveyV2Answer[] => {
        if (question.type === 'text') {
          const text = texts[question.code]?.trim();
          return text ? [{ questionCode: question.code, answerText: text }] : [];
        }
        const score = scores[question.code];
        return score != null ? [{ questionCode: question.code, score }] : [];
      }
    );

    try {
      await submitSurvey({
        // Anonymous answers are saved without a name
        patientName: identityMode === 'named' ? effectivePatientName : null,
        startedAt: startedAtRef.current,
        answers
      }).unwrap();
      setPhase('thankyou');
      setError('');
    } catch {
      setError(copy.submitFailed);
    }
  };

  const setScore = (questionCode: string, next: number | null) => {
    setScores(prev => {
      const updated = { ...prev };
      if (next == null) {
        delete updated[questionCode];
      } else {
        updated[questionCode] = next;
      }
      return updated;
    });
    setError('');
  };

  // 1 to 5 as small round buttons side by side; in Arabic the page direction puts 1 on the right
  const renderRating = (question: SatisfactionSurveyV2Question) => (
    <>
      <div className="patient-satisfaction-survey-v2-scale" role="radiogroup">
        {RATING_VALUES.map(value => {
          const selected = scores[question.code] === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={selected ? 'is-selected' : ''}
              onClick={() => setScore(question.code, value)}
            >
              {value}
            </button>
          );
        })}
      </div>

      {scores[question.code] != null && (
        <div className="patient-satisfaction-survey-clear-selection">
          <MyButton appearance="subtle" onClick={() => setScore(question.code, null)}>
            <span>{copy.clearSelection}</span>
          </MyButton>
        </div>
      )}
    </>
  );

  const renderText = (question: SatisfactionSurveyV2Question) => (
    <Form fluid>
      <MyInput
        fieldType="textarea"
        fieldName={question.code}
        showLabel={false}
        record={{ [question.code]: texts[question.code] ?? '' }}
        setRecord={nextRecord =>
          setTexts(prev => ({
            ...prev,
            [question.code]: String(nextRecord[question.code] ?? '').slice(0, question.maxLength ?? DEFAULT_TEXT_MAX_LENGTH)
          }))
        }
        width="100%"
        rows={8}
        height={220}
      />
      <div className="patient-satisfaction-survey-textarea-hint">
        {copy.maxCharacters(question.maxLength ?? DEFAULT_TEXT_MAX_LENGTH)}
      </div>
    </Form>
  );

  const renderSection = (section: SatisfactionSurveyV2Section) => (
    <div key={section.id} className="patient-satisfaction-survey-v2-section">
      <SectionContainer
        title={<span>{isRtl ? section.titleAr : section.titleEn}</span>}
        content={
          <Panel bordered className="patient-satisfaction-survey-card">
            <div className="patient-satisfaction-survey-questions">
              {section.questions.map(question => (
                <div
                  key={question.code}
                  id={`survey-v2-question-${question.code}`}
                  className="patient-satisfaction-survey-question-block"
                >
                  <div className="patient-satisfaction-survey-question-label">
                    <MyLabel
                      label={
                        <span>
                          {questionNumbers.get(question.code)}. {questionText(question)}
                        </span>
                      }
                      size="large"
                      required={isRequired(question)}
                    />
                  </div>
                  {question.type === 'text' ? renderText(question) : renderRating(question)}
                  {showMissing && isMissing(question) && (
                    <div className="patient-satisfaction-survey-error">{copy.requiredAnswer}</div>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        }
      />
    </div>
  );

  return (
    <div
      className={`patient-satisfaction-survey-page ${isRtl ? 'rtl' : 'ltr'}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <Panel className="patient-satisfaction-survey-header-panel" bordered>
        <div className="patient-satisfaction-survey-header">
          <div className="patient-satisfaction-survey-logo-wrap">
            <img
              src={branding.logo || Logo}
              alt="Logo"
              className="patient-satisfaction-survey-logo"
            />
          </div>

          <div className="patient-satisfaction-survey-v2-header-actions">
            <div className="patient-satisfaction-survey-lang-toggle">
              <MyButton
                appearance={isRtl ? 'primary' : 'subtle'}
                size="xs"
                backgroundColor={isRtl ? PRIMARY : undefined}
                onClick={() => setLanguage('ar')}
              >
                <span>ع</span>
              </MyButton>
              <MyButton
                appearance={!isRtl ? 'primary' : 'subtle'}
                size="xs"
                backgroundColor={!isRtl ? PRIMARY : undefined}
                onClick={() => setLanguage('en')}
              >
                <span>EN</span>
              </MyButton>
            </div>

            {/* Questions on one page or one section at a time; the patient picks, one page by default */}
            <div className="patient-satisfaction-survey-v2-layout-toggle" role="group">
              <Whisper
                placement="bottom"
                trigger="hover"
                speaker={<Tooltip>{copy.layoutSingleHint}</Tooltip>}
              >
                <button
                  type="button"
                  className={layout === 'single' ? 'is-active' : ''}
                  aria-label={copy.layoutSingleHint}
                  aria-pressed={layout === 'single'}
                  onClick={() => changeLayout('single')}
                >
                  <FontAwesomeIcon icon={faFileLines} />
                </button>
              </Whisper>
              <Whisper
                placement="bottom"
                trigger="hover"
                speaker={<Tooltip>{copy.layoutStepsHint}</Tooltip>}
              >
                <button
                  type="button"
                  className={layout === 'steps' ? 'is-active' : ''}
                  aria-label={copy.layoutStepsHint}
                  aria-pressed={layout === 'steps'}
                  onClick={() => changeLayout('steps')}
                >
                  <FontAwesomeIcon icon={faListOl} />
                </button>
              </Whisper>
            </div>
          </div>
        </div>
      </Panel>

      <main className="patient-satisfaction-survey-body">
        <h1 className="patient-satisfaction-survey-title">{copy.surveyTitle}</h1>

        {phase === 'landing' && (
          <SectionContainer
            title={<span>{landingDisplayName}</span>}
            content={
              <Panel
                bordered
                className="patient-satisfaction-survey-card patient-satisfaction-survey-landing-card"
              >
                {departmentFromUrl && (
                  <div className="patient-satisfaction-survey-department">{departmentFromUrl}</div>
                )}

                <div className="patient-satisfaction-survey-identity-section">
                  {!patientNameFromUrl && (
                    <div className="patient-satisfaction-survey-name-input">
                      <Form fluid>
                        <MyInput
                          fieldType="text"
                          fieldName="patientName"
                          showLabel
                          fieldLabel={copy.patientNameLabel}
                          record={landingRecord}
                          setRecord={nextRecord => {
                            setLandingRecord(nextRecord);
                            if (identityMode === 'named') {
                              setIdentityMode(null);
                            }
                            setLandingError('');
                          }}
                          width="100%"
                          disabled={identityMode === 'anonymous'}
                        />
                      </Form>
                    </div>
                  )}

                  <div className="patient-satisfaction-survey-identity-prompt">
                    {copy.identityPrompt}
                  </div>
                  <div className="patient-satisfaction-survey-options">
                    <MyButton
                      appearance="ghost"
                      size="md"
                      width="100%"
                      radius={14}
                      className={`patient-satisfaction-survey-option-btn ${
                        identityMode === 'named' ? 'is-selected' : 'is-unselected'
                      }`}
                      onClick={handleSelectNamedIdentity}
                    >
                      <span>{copy.continueWithName(patientNameFromUrl || enteredPatientName)}</span>
                    </MyButton>
                    <MyButton
                      appearance="ghost"
                      size="md"
                      width="100%"
                      radius={14}
                      className={`patient-satisfaction-survey-option-btn ${
                        identityMode === 'anonymous' ? 'is-selected' : 'is-unselected'
                      }`}
                      onClick={handleSelectAnonymousIdentity}
                    >
                      <span>{copy.continueAnonymous}</span>
                    </MyButton>
                  </div>
                </div>

                <div className="patient-satisfaction-survey-instructions">
                  <strong>{copy.instructionsTitle}</strong>
                  <span>
                    {copy.instructionBody(facility, departmentFromUrl || null, visitDate)}
                  </span>
                </div>

                {landingError && (
                  <div className="patient-satisfaction-survey-error">{landingError}</div>
                )}
              </Panel>
            }
            button={
              <div className="patient-satisfaction-survey-center-action">
                <MyButton
                  appearance="ghost"
                  color={PRIMARY}
                  radius={999}
                  width={220}
                  onClick={handleProceed}
                >
                  <span>{copy.proceed}</span>
                </MyButton>
              </div>
            }
          />
        )}

        {phase === 'survey' && (
          <>
            {layout === 'single' ? (
              <>
                {SATISFACTION_SURVEY_V2_SECTIONS.map(renderSection)}

                {error && <div className="patient-satisfaction-survey-error">{error}</div>}

                <div className="patient-satisfaction-survey-center-action">
                  <MyButton
                    appearance="ghost"
                    color={PRIMARY}
                    radius={999}
                    width={220}
                    loading={isSubmitting}
                    onClick={handleSubmit}
                  >
                    <span>{copy.submit}</span>
                  </MyButton>
                </div>
              </>
            ) : (
              <>
                <Panel bordered className="patient-satisfaction-survey-stepper-card">
                  <MyStepper
                    activeStep={sectionIndex}
                    stepsList={stepperList}
                    modalColor={PRIMARY}
                  />
                </Panel>

                {renderSection(SATISFACTION_SURVEY_V2_SECTIONS[sectionIndex])}

                {error && <div className="patient-satisfaction-survey-error">{error}</div>}

                <div className="patient-satisfaction-survey-nav">
                  <MyButton
                    appearance="ghost"
                    color="#111827"
                    radius={999}
                    width={130}
                    disabled={isFirstSection || isSubmitting}
                    onClick={handlePrevious}
                  >
                    <span>{copy.previous}</span>
                  </MyButton>
                  <MyButton
                    appearance="ghost"
                    color={PRIMARY}
                    radius={999}
                    width={130}
                    loading={isSubmitting}
                    onClick={isLastSection ? handleSubmit : handleNext}
                  >
                    <span>{isLastSection ? copy.submit : copy.next}</span>
                  </MyButton>
                </div>
              </>
            )}
          </>
        )}

        {phase === 'thankyou' && (
          <SectionContainer
            title={<span>{copy.thankYouTitle}</span>}
            content={
              <Panel
                bordered
                className="patient-satisfaction-survey-card patient-satisfaction-survey-thankyou"
              >
                <p>{copy.thankYouMessage}</p>
              </Panel>
            }
          />
        )}
      </main>
    </div>
  );
};

export default PatientSatisfactionSurveyV2Page;
