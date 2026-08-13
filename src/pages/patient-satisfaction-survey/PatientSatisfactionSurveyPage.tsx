import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Checkbox, Form, Panel } from 'rsuite';
import Logo from '@/images/Logo_BLUE_New1.svg';
import MyButton from '@/components/MyButton/MyButton';
import { useBranding } from '@/hooks/useBranding';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import MyStepper from '@/components/MyStepper';
import SectionContainer from '@/components/SectionsoContainer';
import { useSubmitPatientSatisfactionSurveyMutation } from '@/services/patient-satisfaction/patientSatisfactionSurveyService';
import { SURVEY_SECTIONS } from './surveyConfig';
import type { SurveyAnswerValue, SurveyLanguage, SurveyQuestion } from './types';
import { clearDependentAnswers, getVisibleQuestions } from './surveyNavigation';
import { buildSubmitAnswers, formatSurveyDate } from './surveyUtils';
import './styles.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
type SurveyPhase = 'landing' | 'survey' | 'thankyou';

const SURVEY_THEME = {
  primary: 'var(--primary-blue)',
  optionBg: 'var(--one-health-theme-header)',
  optionText: 'var(--dark-blue-gray)',
  selectedText: '#fff'
} as const;
const ANONYMOUS_PATIENT_NAME = 'Anonymous';

type SurveyIdentityMode = 'named' | 'anonymous';

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
    previous: 'Previous',
    next: 'Next',
    submit: 'Submit',
    clearSelection: 'Clear Selection',
    requiredAnswer: 'Please answer all required questions to continue.',
    requiredCheckbox: 'Please agree to continue.',
    maxCharacters: (count: number) => `Max number of characters: ${count}`,
    submitFailed: 'Unable to submit the survey. Please try again.',
    thankYouTitle: 'Thank You',
    thankYouMessage:
      'Your feedback has been submitted successfully. Your responses will help us improve the quality of care.',
    instructionBody: (facility: string, department: string | null, visitDate: string) =>
      department
        ? `Please rate the services you received on your most recent visit to ${facility}. Select the response that best describes your experience. If a question does not apply to you, please skip to the next question. When you finish, please click on "Submit". Your identity will remain confidential if you want. This survey is to evaluate your visit to ${department} on ${visitDate}. All answers should relate to this visit only.`
        : `Please rate the services you received on your most recent visit to ${facility}. Select the response that best describes your experience. If a question does not apply to you, please skip to the next question. When you finish, please click on "Submit". Your identity will remain confidential if you want. This survey evaluates your visit on ${visitDate}. All answers should relate to this visit only.`
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
    previous: 'السابق',
    next: 'التالي',
    submit: 'إرسال',
    clearSelection: 'مسح الاختيار',
    requiredAnswer: 'يرجى الإجابة على جميع الأسئلة المطلوبة للمتابعة.',
    requiredCheckbox: 'يرجى الموافقة للمتابعة.',
    maxCharacters: (count: number) => `الحد الأقصى لعدد الأحرف: ${count}`,
    submitFailed: 'تعذر إرسال الاستبيان. يرجى المحاولة مرة أخرى.',
    thankYouTitle: 'شكراً لك',
    thankYouMessage: 'تم إرسال ملاحظاتك بنجاح. ستساعدنا إجاباتك في تحسين جودة الرعاية.',
    instructionBody: (facility: string, department: string | null, visitDate: string) =>
      department
        ? `يرجى تقييم الخدمات التي تلقيتها في زيارتك الأخيرة إلى ${facility}. اختر الإجابة التي تصف تجربتك بأفضل شكل. إذا كان السؤال لا ينطبق عليك، يرجى الانتقال إلى السؤال التالي. عند الانتهاء، يرجى النقر على "إرسال". ستبقى هويتك سرية اذا اردت. هذا الاستبيان لتقييم زيارتك إلى ${department} بتاريخ ${visitDate}. يجب أن تتعلق جميع الإجابات بهذه الزيارة فقط.`
        : `يرجى تقييم الخدمات التي تلقيتها في زيارتك الأخيرة إلى ${facility}. اختر الإجابة التي تصف تجربتك بأفضل شكل. إذا كان السؤال لا ينطبق عليك، يرجى الانتقال إلى السؤال التالي. عند الانتهاء، يرجى النقر على "إرسال". ستبقى هويتك سرية اذا اردت. هذا الاستبيان لتقييم زيارتك بتاريخ ${visitDate}. يجب أن تتعلق جميع الإجابات بهذه الزيارة فقط.`
  }
};

const isQuestionAnswered = (
  question: SurveyQuestion,
  answers: Record<string, SurveyAnswerValue>
) => {
  const selectedAnswer = answers[question.code];

  if (question.type === 'checkbox') {
    return selectedAnswer?.value === 'AGREED';
  }

  if (question.optional) return true;

  if (question.type === 'text') {
    return Boolean(selectedAnswer?.answer?.trim());
  }

  return Boolean(selectedAnswer);
};

const PatientSatisfactionSurveyPage = () => {
  const [searchParams] = useSearchParams();
  const [submitSurvey, { isLoading: isSubmitting }] = useSubmitPatientSatisfactionSurveyMutation();
  const branding = useBranding();

  const patientNameFromUrl = searchParams.get('patientName')?.trim() ?? '';
  const anonymousFromUrl = ['true', '1', 'yes'].includes(
    (searchParams.get('anonymous') ?? '').toLowerCase()
  );
  const departmentFromUrl = searchParams.get('department')?.trim() ?? '';
  const facility = searchParams.get('facility') ?? 'One Health';
  const visitDate = formatSurveyDate(searchParams.get('visitDate') ?? new Date().toISOString());

  const [language, setLanguage] = useState<SurveyLanguage>('en');
  const copy = COPY[language];
  const isRtl = language === 'ar';

  const [phase, setPhase] = useState<SurveyPhase>('landing');
  const [identityMode, setIdentityMode] = useState<SurveyIdentityMode | null>(() => {
    if (anonymousFromUrl) return 'anonymous';
    return null;
  });
  const [landingRecord, setLandingRecord] = useState({ patientName: patientNameFromUrl });
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, SurveyAnswerValue>>({});
  const [submitError, setSubmitError] = useState('');
  const [landingError, setLandingError] = useState('');

  const enteredPatientName = landingRecord.patientName?.trim() ?? '';
  const effectivePatientName = patientNameFromUrl || enteredPatientName;

  const resolvedPatientName = useMemo(() => {
    if (identityMode === 'anonymous') {
      return ANONYMOUS_PATIENT_NAME;
    }
    return effectivePatientName || ANONYMOUS_PATIENT_NAME;
  }, [identityMode, effectivePatientName]);

  const landingDisplayName = useMemo(() => {
    if (identityMode === 'anonymous') {
      return copy.anonymousPatientName;
    }
    if (identityMode === 'named' && effectivePatientName) {
      return effectivePatientName;
    }
    return effectivePatientName || copy.patientNameLabel;
  }, [identityMode, effectivePatientName, copy.anonymousPatientName, copy.patientNameLabel]);

  const currentSection = SURVEY_SECTIONS[sectionIndex];
  const visibleSectionQuestions = useMemo(
    () => (currentSection ? getVisibleQuestions(currentSection, answers) : []),
    [currentSection, answers]
  );

  const isLastSection = sectionIndex >= SURVEY_SECTIONS.length - 1;
  const isFirstSection = sectionIndex <= 0;

  const sectionTitle = currentSection
    ? language === 'ar'
      ? currentSection.titleAr
      : currentSection.titleEn
    : '';

  const stepperList = useMemo(
    () =>
      SURVEY_SECTIONS.map(section => ({
        key: section.id,
        value: <span>{language === 'ar' ? section.titleAr : section.titleEn}</span>,
        description: '',
        isError: false
      })),
    [language]
  );

  const getOptionLabel = (option: NonNullable<SurveyQuestion['options']>[number]) =>
    language === 'ar' ? option.labelAr : option.labelEn;

  const getQuestionText = (question: SurveyQuestion) =>
    language === 'ar' ? question.textAr : question.textEn;

  const isOptionQuestion = (question: SurveyQuestion) =>
    question.type === 'choice' ||
    question.type === 'rating' ||
    question.type === 'agreement' ||
    question.type === 'nps';

  const handleSelectOption = (question: SurveyQuestion, optionValue: string) => {
    const option = question.options?.find(item => item.value === optionValue);
    if (!option) return;

    setAnswers(prev => {
      let next = {
        ...prev,
        [question.code]: {
          questionCode: question.code,
          value: option.value,
          answer: language === 'ar' ? option.labelAr : option.labelEn,
          score: option.score ?? null
        }
      };

      const section = SURVEY_SECTIONS.find(item =>
        item.questions.some(sectionQuestion => sectionQuestion.code === question.code)
      );

      if (section && !question.showWhen) {
        next = clearDependentAnswers(section, question.code, next);
      }

      return next;
    });
    setSubmitError('');
  };

  const handleTextChange = (question: SurveyQuestion, text: string) => {
    const maxLength = question.maxLength ?? 1500;
    const nextValue = text.slice(0, maxLength);

    setAnswers(prev => {
      const next = { ...prev };

      if (!nextValue.trim()) {
        delete next[question.code];
        return next;
      }

      next[question.code] = {
        questionCode: question.code,
        value: nextValue,
        answer: nextValue,
        score: null
      };

      return next;
    });
    setSubmitError('');
  };

  const handleCheckboxChange = (question: SurveyQuestion, checked: boolean) => {
    if (!checked) {
      handleClearSelectionForQuestion(question.code);
      return;
    }

    const label = getQuestionText(question);
    setAnswers(prev => ({
      ...prev,
      [question.code]: {
        questionCode: question.code,
        value: 'AGREED',
        answer: label,
        score: null
      }
    }));
    setSubmitError('');
  };

  const handleClearSelectionForQuestion = (questionCode: string) => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[questionCode];
      return next;
    });
    setSubmitError('');
  };

  const canProceedFromSection = () =>
    visibleSectionQuestions.every(question => isQuestionAnswered(question, answers));

  const handleProceedFromLanding = () => {
    if (!identityMode) {
      setLandingError(copy.selectIdentity);
      return;
    }

    if (identityMode === 'named' && !effectivePatientName) {
      setLandingError(copy.enterPatientName);
      return;
    }

    setLandingError('');
    setPhase('survey');
  };

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

  const handlePrevious = () => {
    if (isFirstSection) return;
    setSubmitError('');
    setSectionIndex(prev => prev - 1);
  };

  const handleSubmit = async () => {
    const payloadAnswers = buildSubmitAnswers(answers);

    try {
      await submitSurvey({
        patientName: resolvedPatientName,
        answers: payloadAnswers
      }).unwrap();

      setPhase('thankyou');
      setSubmitError('');
    } catch {
      setSubmitError(copy.submitFailed);
    }
  };

  const handleNext = async () => {
    if (!canProceedFromSection()) {
      const incomplete = visibleSectionQuestions.find(
        question => !isQuestionAnswered(question, answers)
      );
      setSubmitError(
        incomplete?.type === 'checkbox' ? copy.requiredCheckbox : copy.requiredAnswer
      );
      return;
    }

    setSubmitError('');

    if (isLastSection) {
      await handleSubmit();
      return;
    }

    setSectionIndex(prev => prev + 1);
  };

  const renderQuestionInput = (question: SurveyQuestion) => {
    const selectedAnswer = answers[question.code];

    if (isOptionQuestion(question)) {
      return (
        <>
          <div
            className={`patient-satisfaction-survey-options ${question.type === 'nps'
              ? 'patient-satisfaction-survey-options-nps'
              : ''
              } ${question.type === 'rating' && question.code === 'OVERALL_SATISFACTION_RECOMMENDATION' 
                ? 'patient-satisfaction-survey-options-rating'
                : ''
              }`}
          >
            {(question.options ?? []).map(option => {
              const isSelected = selectedAnswer?.value === option.value;

              return (
                <MyButton
                  key={option.value}
                  appearance="ghost"
                  size="md"
                  width="100%"
                  radius={14}
                  className={`patient-satisfaction-survey-option-btn ${isSelected ? 'is-selected' : 'is-unselected'
                    } ${question.type === 'nps'
                      ? 'patient-satisfaction-survey-option-nps'
                      : ''
                    } ${question.type === 'rating' && question.code === 'OVERALL_SATISFACTION_RECOMMENDATION' 
                      ? 'patient-satisfaction-survey-option-rating'
                      : ''
                    }`}
                  onClick={() => handleSelectOption(question, option.value)}
                >
                  {question.type === 'rating' && option.icon && question.code === 'OVERALL_SATISFACTION_RECOMMENDATION' ? (
                    <FontAwesomeIcon
                      icon={option.icon}
                      className="patient-satisfaction-survey-rating-icon"
                    />
                  ) : null}

                  <span className="patient-satisfaction-survey-rating-label">
                    {getOptionLabel(option)}
                  </span>
                </MyButton>
              );
            })}
          </div>

          {selectedAnswer && (
            <div className="patient-satisfaction-survey-clear-selection">
              <MyButton
                appearance="subtle"
                onClick={() => handleClearSelectionForQuestion(question.code)}
              >
                <span>{copy.clearSelection}</span>
              </MyButton>
            </div>
          )}
        </>
      );
    }

    if (question.type === 'text') {
      const questionRecord = { [question.code]: selectedAnswer?.answer ?? '' };

      return (
        <Form fluid>
          <MyInput
            fieldType="textarea"
            fieldName={question.code}
            showLabel={false}
            record={questionRecord}
            setRecord={nextRecord => {
              handleTextChange(question, nextRecord[question.code] ?? '');
            }}
            width="100%"
            rows={8}
            height={220}
          />
          <div className="patient-satisfaction-survey-textarea-hint">
            {copy.maxCharacters(question.maxLength ?? 1500)}
          </div>
        </Form>
      );
    }


    if (question.type === 'checkbox') {
      const isChecked = selectedAnswer?.value === 'AGREED';

      return (
        <div
          className={`patient-satisfaction-survey-checkbox-field ${isRtl ? 'is-rtl' : 'is-ltr'
            }`}
        >
          <Checkbox
            checked={isChecked}
            onChange={(_, checked) => handleCheckboxChange(question, checked)}
          />
          <span className="patient-satisfaction-survey-checkbox-text">
            {getQuestionText(question)}
            {!question.optional && (
              <span className="patient-satisfaction-survey-required"> *</span>
            )}
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`patient-satisfaction-survey-page ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <Panel className="patient-satisfaction-survey-header-panel" bordered>
        <div className="patient-satisfaction-survey-header">
          <div className="patient-satisfaction-survey-logo-wrap">
            <img
              src={branding.logo || Logo}
              alt="Logo"
              className="patient-satisfaction-survey-logo"
            />
          </div>

          <div className="patient-satisfaction-survey-lang-toggle">
            <MyButton
              appearance={language === 'ar' ? 'primary' : 'subtle'}
              size="xs"
              backgroundColor={language === 'ar' ? SURVEY_THEME.primary : undefined}
              onClick={() => setLanguage('ar')}
            >
              <span>ع</span>
            </MyButton>
            <MyButton
              appearance={language === 'en' ? 'primary' : 'subtle'}
              size="xs"
              backgroundColor={language === 'en' ? SURVEY_THEME.primary : undefined}
              onClick={() => setLanguage('en')}
            >
              <span>EN</span>
            </MyButton>
          </div>
        </div>
      </Panel>

      <main className="patient-satisfaction-survey-body">
        <h1 className="patient-satisfaction-survey-title">{copy.surveyTitle}</h1>

        {phase === 'landing' && (
          <SectionContainer
            title={<span>{landingDisplayName}</span>}
            content={
              <Panel bordered className="patient-satisfaction-survey-card patient-satisfaction-survey-landing-card">
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

                  <div className="patient-satisfaction-survey-identity-prompt">{copy.identityPrompt}</div>
                  <div className="patient-satisfaction-survey-options">
                    <MyButton
                      appearance="ghost"
                      size="md"
                      width="100%"
                      radius={14}
                      className={`patient-satisfaction-survey-option-btn ${identityMode === 'named' ? 'is-selected' : 'is-unselected'
                        }`}
                      onClick={handleSelectNamedIdentity}
                    >
                      <span>
                        {copy.continueWithName(patientNameFromUrl || enteredPatientName)}
                      </span>
                    </MyButton>
                    <MyButton
                      appearance="ghost"
                      size="md"
                      width="100%"
                      radius={14}
                      className={`patient-satisfaction-survey-option-btn ${identityMode === 'anonymous' ? 'is-selected' : 'is-unselected'
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
                    {copy.instructionBody(
                      facility,
                      departmentFromUrl || null,
                      visitDate
                    )}
                  </span>
                </div>

                {landingError && <div className="patient-satisfaction-survey-error">{landingError}</div>}
              </Panel>
            }
            button={
              <div className="patient-satisfaction-survey-center-action">
                <MyButton
                  appearance="ghost"
                  color={SURVEY_THEME.primary}
                  radius={999}
                  width={220}
                  onClick={handleProceedFromLanding}
                >
                  <span>{copy.proceed}</span>
                </MyButton>
              </div>
            }
          />
        )}

        {phase === 'survey' && currentSection && (
          <>
            <Panel bordered className="patient-satisfaction-survey-stepper-card">
              <MyStepper
                activeStep={sectionIndex}
                stepsList={stepperList}
                modalColor={SURVEY_THEME.primary}
              />
            </Panel>

            <SectionContainer
              title={<span>{sectionTitle}</span>}
              content={
                <Panel bordered className="patient-satisfaction-survey-card">
                  <div className="patient-satisfaction-survey-questions">
                    {visibleSectionQuestions.map((question, index) => (
                      <div
                        key={question.code}
                        className="patient-satisfaction-survey-question-block"
                      >
                        {question.type !== 'checkbox' && (
                          <div className="patient-satisfaction-survey-question-label">
                            <MyLabel
                              label={
                                <span>
                                  {index + 1}. {getQuestionText(question)}
                                </span>
                              }
                              size="large"
                              required={!question.optional}
                            />
                          </div>
                        )}

                        {renderQuestionInput(question)}
                      </div>
                    ))}
                  </div>

                  {submitError && <div className="patient-satisfaction-survey-error">{submitError}</div>}
                </Panel>
              }
              button={
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
                    color={SURVEY_THEME.primary}
                    radius={999}
                    width={130}
                    loading={isSubmitting}
                    onClick={handleNext}
                  >
                    <span>{isLastSection ? copy.submit : copy.next}</span>
                  </MyButton>
                </div>
              }
            />
          </>
        )}

        {phase === 'thankyou' && (
          <SectionContainer
            title={<span>{copy.thankYouTitle}</span>}
            content={
              <Panel bordered className="patient-satisfaction-survey-card patient-satisfaction-survey-thankyou">
                <p>{copy.thankYouMessage}</p>
              </Panel>
            }
          />
        )}
      </main>
    </div>
  );
};

export default PatientSatisfactionSurveyPage;
