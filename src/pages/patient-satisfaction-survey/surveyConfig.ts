import type { SurveyQuestionOption, SurveySection } from './types';
import {
  faFaceSadTear,
  faFaceFrown,
  faFaceMeh,
  faFaceSmile,
  faFaceGrinStars
} from '@fortawesome/free-solid-svg-icons';

export const LIKERT_OPTIONS: SurveyQuestionOption[] = [
  {
    value: 'VERY_POOR',
    labelEn: 'Very Poor',
    labelAr: 'سيء جداً',
    score: 1,
    icon: faFaceSadTear
  },
  {
    value: 'POOR',
    labelEn: 'Poor',
    labelAr: 'سيء',
    score: 2,
    icon: faFaceFrown
  },
  {
    value: 'FAIR',
    labelEn: 'Fair',
    labelAr: 'مقبول',
    score: 3,
    icon: faFaceMeh
  },
  {
    value: 'GOOD',
    labelEn: 'Good',
    labelAr: 'جيد',
    score: 4,
    icon: faFaceSmile
  },
  {
    value: 'VERY_GOOD',
    labelEn: 'Very Good',
    labelAr: 'جيد جداً',
    score: 5,
    icon: faFaceGrinStars
  }
];

export const YES_NO_OPTIONS: SurveyQuestionOption[] = [
  { value: 'NO', labelEn: 'No', labelAr: 'لا' },
  { value: 'YES', labelEn: 'Yes', labelAr: 'نعم' }
];

export const RECOMMEND_OPTIONS: SurveyQuestionOption[] = [
  { value: 'DEFINITELY_NO', labelEn: 'Definitely No', labelAr: 'بالتأكيد لا', score: 1 },
  { value: 'PROBABLY_NO', labelEn: 'Probably No', labelAr: 'على الأرجح لا', score: 2 },
  { value: 'MAYBE', labelEn: 'Maybe', labelAr: 'ربما', score: 3 },
  { value: 'PROBABLY_YES', labelEn: 'Probably Yes', labelAr: 'على الأرجح نعم', score: 4 },
  { value: 'DEFINITELY_YES', labelEn: 'Definitely Yes', labelAr: 'بالتأكيد نعم', score: 5 }
];

export const AGREEMENT_OPTIONS: SurveyQuestionOption[] = [
  { value: 'STRONGLY_DISAGREE', labelEn: 'Strongly Disagree', labelAr: 'لا أوافق بشدة', score: 1 },
  { value: 'DISAGREE', labelEn: 'Disagree', labelAr: 'لا أوافق', score: 2 },
  { value: 'NEUTRAL', labelEn: 'Neutral', labelAr: 'محايد', score: 3 },
  { value: 'AGREE', labelEn: 'Agree', labelAr: 'أوافق', score: 4 },
  { value: 'STRONGLY_AGREE', labelEn: 'Strongly Agree', labelAr: 'أوافق بشدة', score: 5 }
];

export const NPS_OPTIONS: SurveyQuestionOption[] = Array.from({ length: 11 }, (_, score) => ({
  value: String(score),
  labelEn: String(score),
  labelAr: String(score),
  score
}));

export const SURVEY_SECTIONS: SurveySection[] = [
  {
    id: 'access',
    titleEn: 'Access',
    titleAr: 'الوصول',
    questions: [
      {
        code: 'ACCESS_ARRIVAL_AND_CONTACT_EASE',
        textEn: 'The ease of accessing the center and communicating through social media channels.',
        textAr: 'سهولة الوصول للمركز والتواصل عبر قنوات التواصل الاجتماعي',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      },
      {
        code: 'ACCESS_RECEPTION_COURTESY_AND_REGISTRATION_EASE',
        textEn: 'The professionalism of the reception staff and the ease of registration upon arrival',
        textAr: 'احترافية موظفي الاستقبال وسهولة التسجيل عند الوصول',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      },
    ]
  },
  {
    id: 'moving_through_visit',
    titleEn: 'Moving Through Your Visit',
    titleAr: 'التنقل خلال زيارتك',
    questions: [
      {
        code: 'VISIT_DELAY_INFORMATION_AND_WAIT_TIME',
        textEn: 'Were you informed of any delays, and how would you rate the length of your wait at the clinic from the time you arrived until you left?',
        textAr: 'هل تم إبلاغك بوجود أي تأخير، وكيف تقيَم مدة انتظارك في العيادة من وقت الوصول حتى المغادرة؟',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      },
    ]
  },
  {
    id: 'nurse',
    titleEn: 'Nurse',
    titleAr: 'التمريض',
    questions: [
      {
        code: 'NURSE_LISTENING_CONCERN',
        textEn: 'To what extent did you feel that the nurse listened to you attentively, understood your concerns, and cared about your needs?',
        textAr: 'إلى أي مدى شعرت بأن الممرض/ة استمع/ت لك باهتمام وفهم/ت مشكلتك واهتم/ت باحتياجاتك',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      },
    ]
  },
  {
    id: 'physician',
    titleEn: 'Physician',
    titleAr: 'الطبيب',
    questions: [
      {
        code: 'PHYSICIAN_COMMUNICATION',
        textEn: 'To what extent did you feel that the physician cared about your questions and concerns and provided clear explanations about your condition and treatment options, including their benefits and risks?',
        textAr: 'إلى أي مدى شعرت بأن الطبيب اهتم بأسئلتك ومخاوفك، وقدم لك شرحًا واضحًا عن حالتك وخيارات العلاج وفوائدها ومخاطرها؟',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      },
      {
        code: 'PHYSICIAN_SHARED_DECISION',
        textEn: 'To what extent did you feel that the physician involved you in decisions about your care and treatment, and would you recommend this physician to others?',
        textAr: 'إلى أي مدى شعرت بأن الطبيب شاركك في اتخاذ قرارات الرعاية والعلاج، وهل توصي به للآخرين؟',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      }
    ]
  },
  {
    id: 'laboratory',
    titleEn: 'Laboratory',
    titleAr: 'المختبر',
    questions: [
      {
        code: 'LAB_RECEIVED_SERVICES',
        textEn: 'Did you receive laboratory services?',
        textAr: 'هل تلقيت خدمات المختبر؟',
        type: 'choice',
        options: YES_NO_OPTIONS
      },
      {
        code: 'LAB_BLOOD_DRAW_WAIT_COMFORT',
        textEn: 'How satisfied were you with the waiting time for your blood draw and the staff member’s concern for your comfort during the procedure?',
        textAr: 'إلى أي مدى كنت راضيًا عن وقت الانتظار لسحب الدم، واهتمام الموظف براحتك أثناء الإجراء؟',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true,
        showWhen: { questionCode: 'LAB_RECEIVED_SERVICES', values: ['YES'] }
      },
      {
        code: 'LAB_BLOOD_DRAW_SKILL',
        textEn: 'How would you rate the skill of the staff member who drew your blood in terms of speed, accuracy, and minimizing pain?',
        textAr: 'كيف تقيّم مهارة الموظف الذي قام بسحب الدم من حيث السرعة، والدقة، وتقليل الألم؟',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true,
        showWhen: { questionCode: 'LAB_RECEIVED_SERVICES', values: ['YES'] }
      }
    ]
  },
  {
    id: 'radiology',
    titleEn: 'Radiology',
    titleAr: 'الأشعة',
    questions: [
      {
        code: 'RAD_RECEIVED_SERVICES',
        textEn: 'Did you receive radiology services?',
        textAr: 'هل تلقيت خدمات الأشعة؟',
        type: 'choice',
        options: YES_NO_OPTIONS
      },
      {
        code: 'RAD_STAFF_SATISFACTION',
        textEn: 'How satisfied were you with the care and attention provided by the radiology staff?',
        textAr: 'ما مدى رضاك عن تعامل واهتمام طاقم الأشعة؟',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true,
        showWhen: { questionCode: 'RAD_RECEIVED_SERVICES', values: ['YES'] }
      },
      {
        code: 'RAD_EXPLANATION_AND_WAIT_SATISFACTION',
        textEn: 'How satisfied were you with the explanation provided and the waiting time before your radiology procedure?',
        textAr: 'ما مدى رضاك عن الشرح ووقت الانتظار قبل إجراء الأشعة؟',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true,
        showWhen: { questionCode: 'RAD_RECEIVED_SERVICES', values: ['YES'] }
      }
    ]
  },
  {
    id: 'pharmacy',
    titleEn: 'Pharmacy',
    titleAr: 'الصيدلية',
    questions: [
      {
        code: 'PHARMACY_RECEIVED_MEDICATIONS',
        textEn: "Did you receive your medications from the hospital's pharmacy?",
        textAr: 'هل حصلت على أدويتك من صيدلية المستشفى؟',
        type: 'choice',
        options: YES_NO_OPTIONS
      },
      {
        code: 'PHARMACY_SATISFACTION',
        textEn: 'How satisfied are you with the availability of prescribed medications, waiting time, and the pharmacist’s explanation of your prescription?',
        textAr: 'ما مدى رضاك عن توفر الأدوية الموصوفة، ووقت الانتظار، وشرح الصيدلي لوصفتك؟',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true,
        showWhen: { questionCode: 'PHARMACY_RECEIVED_MEDICATIONS', values: ['YES'] }
      }
    ]
  },
  {
    id: 'overall_assessment',
    titleEn: 'Overall Assessment',
    titleAr: 'التقييم العام',
    questions: [
      {
        code: 'OVERALL_ENVIRONMENT_STAFF_SATISFACTION',
        textEn: 'How satisfied were you with your privacy and safety, the cleanliness of the clinic, and the teamwork of the staff?',
        textAr: 'ما مدى رضاك عن خصوصيتك وسلامتك، ونظافة العيادة وتعاون الموظفين؟',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      },
      {
        code: 'OVERALL_SATISFACTION_RECOMMENDATION',
        textEn: 'How satisfied are you with the services you received, and how likely are you to recommend this center to others?',
        textAr: 'ما مدى رضاك عن الخدمات التي تلقيتها، وما مدى احتمالية أن توصي بهذا المركز للآخرين؟',
        type: 'rating',
        options: LIKERT_OPTIONS
      },
      {
        code: 'OVERALL_COMMENTS',
        textEn: 'Comments',
        textAr: 'ملاحظات',
        type: 'text',
        maxLength: 1500,
        optional: true
      }
    ]
  },
  {
    id: 'disclaimer',
    titleEn: 'Disclaimer',
    titleAr: 'إخلاء المسؤولية',
    questions: [
      {
        code: 'DISCLAIMER_SHARE_CONTACT',
        textEn: 'I agree on sharing my contact information along the comments with the center',
        textAr: 'أوافق على مشاركة معلومات الاتصال الخاصة بي مع المركز مع الملاحظات',
        type: 'checkbox'
      }
    ]
  }
];

export const getAllSurveyQuestions = () => SURVEY_SECTIONS.flatMap(section => section.questions);
