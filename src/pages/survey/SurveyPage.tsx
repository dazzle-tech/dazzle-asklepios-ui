import React, { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Form, Loader, Panel, Tooltip, Whisper } from 'rsuite';
import Logo from '@/images/Logo_BLUE_New1.svg';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import MyStepper from '@/components/MyStepper';
import SectionContainer from '@/components/SectionsoContainer';
import { useBranding } from '@/hooks/useBranding';
import {
  SurveyAnswer,
  SurveyFormQuestion,
  SurveyFormSection,
  useGetSurveyFormQuery,
  useRequestSurveyOtpMutation,
  useSubmitSurveyMutation,
  useVerifySurveyOtpMutation
} from '@/services/survey/surveyService';
import { DEFAULT_SURVEY_TEXTS, SurveyTextKey } from './surveyTexts';
import { formatSurveyDate } from '../patient-satisfaction-survey/surveyUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines, faListOl } from '@fortawesome/free-solid-svg-icons';
// Same look as the patient satisfaction survey
import '../patient-satisfaction-survey/styles.less';
import './styles.less';

type SurveyLanguage = 'en' | 'ar';

type SurveyPhase = 'landing' | 'survey' | 'thankyou';

type SurveyIdentityMode = 'named' | 'anonymous';

type SurveyLayout = 'single' | 'steps';

const PRIMARY = 'var(--primary-blue)';

// Same as the server limit on text answers
const TEXT_MAX_LENGTH = 2000;

type SurveyTexts = Record<string, { en: string | null; ar: string | null }>;

/**
 * The page texts: the survey_text table first, then the defaults in surveyTexts.ts.
 * Texts hold no variables: values such as the visit date are shown next to them.
 */
const buildCopy = (language: SurveyLanguage, texts?: SurveyTexts) => {
  const t = (key: SurveyTextKey) => texts?.[key]?.[language]?.trim() || DEFAULT_SURVEY_TEXTS[key][language];

  return {
    surveyTitle: t('SURVEY_TITLE'),
    instructionsTitle: t('INSTRUCTIONS_TITLE'),
    instructionBody: t('INSTRUCTION_BODY'),
    facility: t('FACILITY'),
    department: t('DEPARTMENT'),
    visitDate: t('VISIT_DATE'),
    proceed: t('PROCEED'),
    identityPrompt: t('IDENTITY_PROMPT'),
    documentNumber: t('DOCUMENT_NUMBER'),
    sendCode: t('SEND_CODE'),
    resendCode: t('RESEND_CODE'),
    codeSent: t('CODE_SENT'),
    verificationCode: t('VERIFICATION_CODE'),
    verify: t('VERIFY'),
    verified: t('VERIFIED'),
    enterDocument: t('ENTER_DOCUMENT'),
    enterOtp: t('ENTER_OTP'),
    otpInvalid: t('OTP_INVALID'),
    otpExpired: t('OTP_EXPIRED'),
    noMobile: t('NO_MOBILE'),
    lookupNotFound: t('PATIENT_NOT_FOUND'),
    lookupFailed: t('REQUEST_FAILED'),
    tooManyAttempts: t('TOO_MANY_ATTEMPTS'),
    continueWithDetails: t('CONTINUE_WITH_DETAILS'),
    continueAnonymous: t('CONTINUE_ANONYMOUSLY'),
    anonymousPatientName: t('ANONYMOUS'),
    yourDetails: t('YOUR_DETAILS'),
    selectIdentity: t('SELECT_IDENTITY'),
    searchFirst: t('VERIFY_FIRST'),
    layoutSingleHint: t('LAYOUT_SINGLE_HINT'),
    layoutStepsHint: t('LAYOUT_STEPS_HINT'),
    previous: t('PREVIOUS'),
    next: t('NEXT'),
    submit: t('SUBMIT'),
    clearSelection: t('CLEAR_SELECTION'),
    requiredAnswer: t('REQUIRED_ANSWER'),
    maxCharacters: t('MAX_CHARACTERS'),
    loadFailed: t('LOAD_FAILED'),
    noQuestions: t('NO_QUESTIONS'),
    submitFailed: t('SUBMIT_FAILED'),
    thankYouTitle: t('THANK_YOU_TITLE'),
    thankYouMessage: t('THANK_YOU_MESSAGE')
  };
};

const range = (min: number, max: number) => Array.from({ length: max - min + 1 }, (_, i) => min + i);

/**
 * Patient satisfaction survey built from the survey questions setup.
 * The patient verifies with the survey OTP (primary ID number + code to their mobile), or answers anonymously.
 */
const SurveyPage = () => {
  const { data: form, isLoading: isLoadingForm, isError: isFormError } = useGetSurveyFormQuery();
  const [requestOtp, { isLoading: isSendingOtp }] = useRequestSurveyOtpMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifySurveyOtpMutation();
  const [submitSurvey, { isLoading: isSubmitting }] = useSubmitSurveyMutation();
  const branding = useBranding();

  const [language, setLanguage] = useState<SurveyLanguage>('en');
  const copy = useMemo(() => buildCopy(language, form?.texts), [language, form?.texts]);
  const isRtl = language === 'ar';

  const sections = useMemo(() => form?.sections ?? [], [form]);
  const questions = useMemo(() => sections.flatMap(section => section.questions), [sections]);

  const [phase, setPhase] = useState<SurveyPhase>('landing');
  // Same link parameters as the satisfaction survey
  const [searchParams] = useSearchParams();
  const anonymousFromUrl = ['true', '1', 'yes'].includes((searchParams.get('anonymous') ?? '').toLowerCase());
  const departmentFromUrl = searchParams.get('department')?.trim() ?? '';
  // Like the department: shown only when the link has them
  const facility = searchParams.get('facility')?.trim() ?? '';
  const visitDateFromUrl = searchParams.get('visitDate')?.trim() ?? '';
  const visitDate = visitDateFromUrl ? formatSurveyDate(visitDateFromUrl) : '';

  const [identityMode, setIdentityMode] = useState<SurveyIdentityMode | null>(
    anonymousFromUrl ? 'anonymous' : null
  );
  const [documentRecord, setDocumentRecord] = useState({ documentNumber: '' });
  // The OTP was sent to the patient's registered mobile
  const [otpSent, setOtpSent] = useState(false);
  const [otpRecord, setOtpRecord] = useState({ otp: '' });
  // Set once the OTP is verified; the token links the submitted survey to the patient
  const [verifiedPatient, setVerifiedPatient] = useState<{ name: string; token: string } | null>(null);
  const [landingError, setLandingError] = useState('');

  const landingDisplayName = useMemo(() => {
    if (identityMode === 'anonymous') return copy.anonymousPatientName;
    return verifiedPatient?.name || copy.yourDetails;
  }, [identityMode, verifiedPatient, copy.anonymousPatientName, copy.yourDetails]);

  const [scores, setScores] = useState<Record<number, number>>({});
  const [texts, setTexts] = useState<Record<number, string>>({});
  const [error, setError] = useState('');
  // Marks the unanswered required questions after a Submit attempt
  const [showMissing, setShowMissing] = useState(false);
  const startedAtRef = useRef<string | null>(null);

  const [layout, setLayout] = useState<SurveyLayout>('single');
  const [sectionIndex, setSectionIndex] = useState(0);
  const isFirstSection = sectionIndex === 0;
  const isLastSection = sectionIndex === sections.length - 1;

  const stepperList = useMemo(
    () =>
      sections.map(section => ({
        key: String(section.id),
        value: <span>{isRtl ? section.nameAr : section.nameEn}</span>,
        description: '',
        isError: false
      })),
    [sections, isRtl]
  );

  // Questions are numbered across the whole survey, not per section
  const questionNumbers = useMemo(
    () => new Map(questions.map((question, index) => [question.id, index + 1])),
    [questions]
  );

  const questionText = (question: SurveyFormQuestion) => (isRtl ? question.questionAr : question.questionEn);

  const isAnswered = (question: SurveyFormQuestion) =>
    question.answerType === 'TEXT' ? !!texts[question.id]?.trim() : scores[question.id] != null;

  const isMissing = (question: SurveyFormQuestion) => question.isRequired && !isAnswered(question);

  // Changing the document starts the verification over
  const handleDocumentChange = (nextRecord: typeof documentRecord) => {
    setDocumentRecord(nextRecord);
    setOtpSent(false);
    setOtpRecord({ otp: '' });
    setVerifiedPatient(null);
    if (identityMode === 'named') setIdentityMode(null);
    setLandingError('');
  };

  // Error keys of the patient portal OTP, which the survey OTP endpoints use
  const otpErrorMessage = (err: any) => {
    // The survey OTP endpoints limit how often a code is sent and checked
    if (err?.status === 429) return copy.tooManyAttempts;
    // patient-service sends the error key in messageKey (message holds the English text)
    const key = String(err?.data?.messageKey ?? err?.data?.message ?? '').replace(/^error\./, '');
    const messages: Record<string, string> = {
      'invalid.credentials': copy.lookupNotFound,
      'mobile.notfound': copy.noMobile,
      'sms.disabled': copy.noMobile,
      'invalid.otp': copy.otpInvalid,
      'otp.expired': copy.otpExpired,
      'otp.notfound': copy.otpExpired
    };
    return messages[key] ?? copy.lookupFailed;
  };

  const handleSendOtp = async () => {
    const primaryDocumentNumber = documentRecord.documentNumber?.trim() ?? '';
    if (!primaryDocumentNumber) {
      setLandingError(copy.enterDocument);
      return;
    }
    try {
      await requestOtp({ primaryDocumentNumber }).unwrap();
      setOtpSent(true);
      setOtpRecord({ otp: '' });
      setVerifiedPatient(null);
      setLandingError('');
    } catch (err: any) {
      // A resend that is too soon keeps the code already sent usable
      if (err?.status !== 429) setOtpSent(false);
      setLandingError(otpErrorMessage(err));
    }
  };

  const handleVerifyOtp = async () => {
    const otp = otpRecord.otp?.trim() ?? '';
    if (!/^\d{6}$/.test(otp)) {
      setLandingError(copy.enterOtp);
      return;
    }
    try {
      const result = await verifyOtp({
        primaryDocumentNumber: documentRecord.documentNumber.trim(),
        otp
      }).unwrap();
      setVerifiedPatient({ name: result.patientName ?? '', token: result.verificationToken });
      setIdentityMode('named');
      setLandingError('');
    } catch (err: any) {
      setLandingError(otpErrorMessage(err));
    }
  };

  const handleSelectNamedIdentity = () => {
    if (!verifiedPatient) {
      setLandingError(copy.searchFirst);
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
    if (identityMode === 'named' && !verifiedPatient) {
      setLandingError(copy.searchFirst);
      return;
    }
    setLandingError('');
    startedAtRef.current = new Date().toISOString();
    setPhase('survey');
  };

  const scrollToQuestion = (id: number) =>
    // After a step change the question renders on the next frame
    requestAnimationFrame(() =>
      document.getElementById(`survey-question-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    );

  const changeLayout = (next: SurveyLayout) => {
    setLayout(next);
    setSectionIndex(0);
    setError('');
  };

  const handleNext = () => {
    const missing = sections[sectionIndex].questions.find(isMissing);
    if (missing) {
      setShowMissing(true);
      setError(copy.requiredAnswer);
      scrollToQuestion(missing.id);
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
    const firstMissing = questions.find(isMissing);
    if (firstMissing) {
      setShowMissing(true);
      setError(copy.requiredAnswer);
      if (layout === 'steps') {
        setSectionIndex(sections.findIndex(section => section.questions.some(q => q.id === firstMissing.id)));
      }
      scrollToQuestion(firstMissing.id);
      return;
    }

    const answers = questions.flatMap((question): SurveyAnswer[] => {
      if (question.answerType === 'TEXT') {
        const text = texts[question.id]?.trim();
        return text ? [{ questionId: question.id, textValue: text }] : [];
      }
      const score = scores[question.id];
      return score != null ? [{ questionId: question.id, score }] : [];
    });

    try {
      await submitSurvey({
        // Anonymous answers are saved without the patient
        ...(identityMode === 'named' && verifiedPatient ? { verificationToken: verifiedPatient.token } : {}),
        startedAt: startedAtRef.current,
        answers
      }).unwrap();
      setPhase('thankyou');
      setError('');
    } catch {
      setError(copy.submitFailed);
    }
  };

  const setScore = (questionId: number, next: number | null) => {
    setScores(prev => {
      const updated = { ...prev };
      if (next == null) {
        delete updated[questionId];
      } else {
        updated[questionId] = next;
      }
      return updated;
    });
    setError('');
  };

  // Min to max as small round buttons side by side; in Arabic the page direction puts the min on the right
  const renderScale = (question: SurveyFormQuestion) => (
    <>
      <div className="survey-page-scale" role="radiogroup">
        {range(question.minValue ?? 1, question.maxValue ?? 5).map(value => {
          const selected = scores[question.id] === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={selected ? 'is-selected' : ''}
              onClick={() => setScore(question.id, value)}
            >
              {value}
            </button>
          );
        })}
      </div>

      {scores[question.id] != null && (
        <div className="patient-satisfaction-survey-clear-selection">
          <MyButton appearance="subtle" onClick={() => setScore(question.id, null)}>
            <span>{copy.clearSelection}</span>
          </MyButton>
        </div>
      )}
    </>
  );

  const renderText = (question: SurveyFormQuestion) => {
    const fieldName = `question_${question.id}`;
    return (
      <Form fluid>
        <MyInput
          fieldType="textarea"
          fieldName={fieldName}
          showLabel={false}
          record={{ [fieldName]: texts[question.id] ?? '' }}
          setRecord={nextRecord => {
            setTexts(prev => ({
              ...prev,
              [question.id]: String(nextRecord[fieldName] ?? '').slice(0, TEXT_MAX_LENGTH)
            }));
            setError('');
          }}
          width="100%"
          rows={8}
          height={220}
        />
        <div className="patient-satisfaction-survey-textarea-hint">{copy.maxCharacters}: {TEXT_MAX_LENGTH}</div>
      </Form>
    );
  };

  const renderSection = (section: SurveyFormSection) => (
    <div key={section.id} className="survey-page-section">
      <SectionContainer
        title={<span>{isRtl ? section.nameAr : section.nameEn}</span>}
        content={
          <Panel bordered className="patient-satisfaction-survey-card">
            <div className="patient-satisfaction-survey-questions">
              {section.questions.map(question => (
                <div
                  key={question.id}
                  id={`survey-question-${question.id}`}
                  className="patient-satisfaction-survey-question-block"
                >
                  <div className="patient-satisfaction-survey-question-label">
                    <MyLabel
                      label={
                        <span>
                          {questionNumbers.get(question.id)}. {questionText(question)}
                        </span>
                      }
                      size="large"
                      required={question.isRequired}
                    />
                  </div>
                  {question.answerType === 'TEXT' ? renderText(question) : renderScale(question)}
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

  const renderLanding = () => (
    <SectionContainer
      title={<span>{landingDisplayName}</span>}
      content={
        <Panel bordered className="patient-satisfaction-survey-card patient-satisfaction-survey-landing-card">
          {/* The visit being rated, from the survey link */}
          {(facility || departmentFromUrl || visitDate) && (
            <div className="survey-page-visit">
              {facility && (
                <div>
                  <strong>{copy.facility}:</strong> {facility}
                </div>
              )}
              {departmentFromUrl && (
                <div>
                  <strong>{copy.department}:</strong> {departmentFromUrl}
                </div>
              )}
              {visitDate && (
                <div>
                  <strong>{copy.visitDate}:</strong> {visitDate}
                </div>
              )}
            </div>
          )}

          <div className="patient-satisfaction-survey-identity-section">
            <div className="patient-satisfaction-survey-name-input">
              <Form fluid>
                <div className="survey-page-lookup">
                  <MyInput
                    fieldType="text"
                    fieldName="documentNumber"
                    fieldLabel={copy.documentNumber}
                    record={documentRecord}
                    setRecord={handleDocumentChange}
                    width="100%"
                    disabled={identityMode === 'anonymous'}
                  />
                  <MyButton
                    appearance="ghost"
                    color={PRIMARY}
                    loading={isSendingOtp}
                    disabled={identityMode === 'anonymous' || !!verifiedPatient}
                    onClick={handleSendOtp}
                  >
                    <span>{otpSent ? copy.resendCode : copy.sendCode}</span>
                  </MyButton>
                </div>

                {/* After the code is sent: the patient enters it to confirm it is them */}
                {otpSent && !verifiedPatient && identityMode !== 'anonymous' && (
                  <>
                    <div className="patient-satisfaction-survey-textarea-hint">{copy.codeSent}</div>
                    <div className="survey-page-lookup survey-page-otp">
                      <MyInput
                        fieldType="text"
                        fieldName="otp"
                        fieldLabel={copy.verificationCode}
                        record={otpRecord}
                        setRecord={next => {
                          setOtpRecord({ otp: String(next.otp ?? '').replace(/\D/g, '').slice(0, 6) });
                          setLandingError('');
                        }}
                        width="100%"
                      />
                      <MyButton
                        appearance="ghost"
                        color={PRIMARY}
                        loading={isVerifyingOtp}
                        onClick={handleVerifyOtp}
                      >
                        <span>{copy.verify}</span>
                      </MyButton>
                    </div>
                  </>
                )}

                {verifiedPatient && <div className="patient-satisfaction-survey-textarea-hint">{copy.verified}</div>}

                {/* Right under the ID number and code, where the patient is looking */}
                {landingError && <div className="patient-satisfaction-survey-error">{landingError}</div>}
              </Form>
            </div>

            <div className="patient-satisfaction-survey-identity-prompt">{copy.identityPrompt}</div>
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
                <span>{copy.continueWithDetails}</span>
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
            <span>{copy.instructionBody}</span>
          </div>

        </Panel>
      }
      button={
        <div className="patient-satisfaction-survey-center-action">
          <MyButton appearance="ghost" color={PRIMARY} radius={999} width={220} onClick={handleProceed}>
            <span>{copy.proceed}</span>
          </MyButton>
        </div>
      }
    />
  );

  const renderSurvey = () =>
    layout === 'single' ? (
      <>
        {sections.map(renderSection)}

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
          <MyStepper activeStep={sectionIndex} stepsList={stepperList} modalColor={PRIMARY} />
        </Panel>

        {renderSection(sections[sectionIndex])}

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
    );

  const renderBody = () => {
    if (isLoadingForm) return <Loader center size="md" />;
    if (isFormError) return <div className="patient-satisfaction-survey-error">{copy.loadFailed}</div>;
    if (sections.length === 0) return <div className="patient-satisfaction-survey-error">{copy.noQuestions}</div>;

    if (phase === 'landing') return renderLanding();
    if (phase === 'survey') return renderSurvey();
    return (
      <SectionContainer
        title={<span>{copy.thankYouTitle}</span>}
        content={
          <Panel bordered className="patient-satisfaction-survey-card patient-satisfaction-survey-thankyou">
            <p>{copy.thankYouMessage}</p>
          </Panel>
        }
      />
    );
  };

  return (
    <div className={`patient-satisfaction-survey-page ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <Panel className="patient-satisfaction-survey-header-panel" bordered>
        <div className="patient-satisfaction-survey-header">
          <div className="patient-satisfaction-survey-logo-wrap">
            <img src={branding.logo || Logo} alt="Logo" className="patient-satisfaction-survey-logo" />
          </div>

          <div className="survey-page-header-actions">
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
            <div className="survey-page-layout-toggle" role="group">
              <Whisper placement="bottom" trigger="hover" speaker={<Tooltip>{copy.layoutSingleHint}</Tooltip>}>
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
              <Whisper placement="bottom" trigger="hover" speaker={<Tooltip>{copy.layoutStepsHint}</Tooltip>}>
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
        {renderBody()}
      </main>
    </div>
  );
};

export default SurveyPage;
