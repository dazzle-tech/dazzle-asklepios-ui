import type { SurveyQuestionOption, SurveySection } from './types';

export const LIKERT_OPTIONS: SurveyQuestionOption[] = [
  { value: 'VERY_POOR', labelEn: 'Very Poor', labelAr: 'سيء جداً', score: 1 },
  { value: 'POOR', labelEn: 'Poor', labelAr: 'سيء', score: 2 },
  { value: 'FAIR', labelEn: 'Fair', labelAr: 'مقبول', score: 3 },
  { value: 'GOOD', labelEn: 'Good', labelAr: 'جيد', score: 4 },
  { value: 'VERY_GOOD', labelEn: 'Very Good', labelAr: 'جيد جداً', score: 5 }
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
    id: 'basic_questions',
    titleEn: 'Basic Questions',
    titleAr: 'أسئلة أساسية',
    questions: [
      {
        code: 'BASIC_COMPLETER',
        textEn: 'Who is completing this survey?',
        textAr: 'من يقوم بتعبئة هذا الاستبيان؟',
        type: 'choice',
        options: [
          { value: 'PATIENT', labelEn: 'Patient', labelAr: 'المريض' },
          {
            value: 'PARENT_OR_GUARDIAN',
            labelEn: 'Parent Or Guardian (If The Patient Is A Minor)',
            labelAr: 'ولي الأمر (إذا كان المريض قاصراً)'
          }
        ]
      },
      {
        code: 'BASIC_FIRST_VISIT',
        textEn: 'Was this your first visit here?',
        textAr: 'هل كانت هذه زيارتك الأولى هنا؟',
        type: 'choice',
        options: YES_NO_OPTIONS
      }
    ]
  },
  {
    id: 'access',
    titleEn: 'Access',
    titleAr: 'الوصول',
    questions: [
      {
        code: 'ACCESS_ARRIVAL_METHOD',
        textEn: 'You got to the center',
        textAr: 'لقد وصلت إلى المركز',
        type: 'choice',
        options: [
          { value: 'BOOKED_APPOINTMENT', labelEn: 'Booked Appointment', labelAr: 'موعد محجوز' },
          { value: 'WITHOUT_APPOINTMENT', labelEn: 'Without An Appointment', labelAr: 'بدون موعد' }
        ]
      },
      {
        code: 'ACCESS_CONTACT_EASE',
        textEn: 'Ease of contacting (e.g., email, phone, web portal) the hospital',
        textAr: 'سهولة التواصل مع المستشفى (مثل البريد الإلكتروني أو الهاتف أو البوابة الإلكترونية)',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      },
      {
        code: 'ACCESS_RECEPTION_COURTESY',
        textEn: 'Courtesy of the receptionists',
        textAr: 'لطف موظفي الاستقبال',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      },
      {
        code: 'ACCESS_REGISTRATION_EASE',
        textEn: 'Ease of registration upon arrival',
        textAr: 'سهولة التسجيل عند الوصول',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      }
    ]
  },
  {
    id: 'moving_through_visit',
    titleEn: 'Moving Through Your Visit',
    titleAr: 'التنقل خلال زيارتك',
    questions: [
      {
        code: 'VISIT_DELAY_INFORMATION',
        textEn: 'Degree to which you were informed about any delays',
        textAr: 'مدى إبلاغك بأي تأخير',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      },
      {
        code: 'VISIT_WAIT_TIME',
        textEn: 'Wait time at clinic (from arriving to leaving)',
        textAr: 'وقت الانتظار في العيادة (من الوصول حتى المغادرة)',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      },
      {
        code: 'VISIT_WAITING_COMFORT',
        textEn: 'Comfort of the waiting area',
        textAr: 'راحة منطقة الانتظار',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      }
    ]
  },
  {
    id: 'nurse',
    titleEn: 'Nurse',
    titleAr: 'التمريض',
    questions: [
      {
        code: 'NURSE_LISTENING',
        textEn: 'How well the nurse listened to you',
        textAr: 'مدى استماع الممرض/ة إليك',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      },
      {
        code: 'NURSE_CONCERN',
        textEn: 'Concern the nurse showed for your problem',
        textAr: 'اهتمام الممرض/ة بمشكلتك',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      }
    ]
  },
  {
    id: 'physician',
    titleEn: 'Physician',
    titleAr: 'الطبيب',
    questions: [
      {
        code: 'PHYSICIAN_CONCERN',
        textEn: 'Concern the physician showed for your questions or worries',
        textAr: 'اهتمام الطبيب بأسئلتك أو مخاوفك',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      },
      {
        code: 'PHYSICIAN_EXPLANATION',
        textEn: 'Explanations the physician gave you about your problem or condition',
        textAr: 'الشروحات التي قدمها الطبيب عن مشكلتك أو حالتك',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      },
      {
        code: 'PHYSICIAN_SHARED_DECISIONS',
        textEn: "Physician's efforts to include you in decisions about your care",
        textAr: 'جهود الطبيب لإشراكك في قرارات رعايتك',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      },
      {
        code: 'PHYSICIAN_TREATMENT_DISCUSSION',
        textEn: "Physician's discussion of any proposed treatment (options, risks, benefits, etc.)",
        textAr: 'مناقشة الطبيب لأي علاج مقترح (الخيارات، المخاطر، الفوائد، إلخ)',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      },
      {
        code: 'PHYSICIAN_RECOMMEND',
        textEn: 'Likelihood of your recommending this physician to others',
        textAr: 'احتمالية توصيتك بهذا الطبيب للآخرين',
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
        code: 'LAB_BLOOD_DRAW_WAIT',
        textEn: 'Waiting time to get your blood drawn',
        textAr: 'وقت الانتظار لسحب الدم',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true,
        showWhen: { questionCode: 'LAB_RECEIVED_SERVICES', values: ['YES'] }
      },
      {
        code: 'LAB_BLOOD_DRAW_COMFORT',
        textEn: 'Concern shown for your comfort when your blood was drawn',
        textAr: 'الاهتمام براحتك أثناء سحب الدم',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true,
        showWhen: { questionCode: 'LAB_RECEIVED_SERVICES', values: ['YES'] }
      },
      {
        code: 'LAB_BLOOD_DRAW_SKILL',
        textEn: 'Skill of the person who took your blood (e.g., did it quickly, with minimal pain)',
        textAr: 'مهارة الشخص الذي سحب الدم (مثل السرعة وتقليل الألم)',
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
        textEn: 'How satisfied were you with the radiology staff?',
        textAr: 'ما مدى رضاك عن طاقم الأشعة؟',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true,
        showWhen: { questionCode: 'RAD_RECEIVED_SERVICES', values: ['YES'] }
      },
      {
        code: 'RAD_EXPLANATION_SATISFACTION',
        textEn: 'How satisfied were you with the explanation provided before the procedure?',
        textAr: 'ما مدى رضاك عن الشرح المقدم قبل الإجراء؟',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true,
        showWhen: { questionCode: 'RAD_RECEIVED_SERVICES', values: ['YES'] }
      },
      {
        code: 'RAD_WAIT_TIME_SATISFACTION',
        textEn: 'How satisfied were you with the waiting time for your radiology service?',
        textAr: 'ما مدى رضاك عن وقت الانتظار لخدمة الأشعة؟',
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
        code: 'PHARMACY_WAIT_TIME',
        textEn: 'Waiting time to get your medications',
        textAr: 'وقت الانتظار للحصول على الأدوية',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true,
        showWhen: { questionCode: 'PHARMACY_RECEIVED_MEDICATIONS', values: ['YES'] }
      },
      {
        code: 'PHARMACY_PRESCRIPTION_EXPLANATION',
        textEn: "Pharmacist's explanation of your prescription",
        textAr: 'شرح الصيدلي لوصفتك الطبية',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true,
        showWhen: { questionCode: 'PHARMACY_RECEIVED_MEDICATIONS', values: ['YES'] }
      },
      {
        code: 'PHARMACY_AVAILABILITY',
        textEn: 'Availability of prescribed medications',
        textAr: 'توفر الأدوية الموصوفة',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true,
        showWhen: { questionCode: 'PHARMACY_RECEIVED_MEDICATIONS', values: ['YES'] }
      }
    ]
  },
  {
    id: 'personal_issues',
    titleEn: 'Personal Issues',
    titleAr: 'مسائل شخصية',
    questions: [
      {
        code: 'PERSONAL_PRIVACY',
        textEn: 'Our concern for your privacy',
        textAr: 'اهتمامنا بخصوصيتك',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      },
      {
        code: 'PERSONAL_SAFETY',
        textEn: 'How well the staff protected your safety (by washing hands, wearing ID, etc.)',
        textAr: 'مدى حماية الموظفين لسلامتك (مثل غسل اليدين وارتداء بطاقة التعريف، إلخ)',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      },
      {
        code: 'PERSONAL_CLEANLINESS',
        textEn: 'Cleanliness of our clinics',
        textAr: 'نظافة عياداتنا',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      }
    ]
  },
  {
    id: 'overall_assessment',
    titleEn: 'Overall Assessment',
    titleAr: 'التقييم العام',
    questions: [
      {
        code: 'OVERALL_STAFF_TEAMWORK',
        textEn: 'How well the staff worked together to care for you',
        textAr: 'مدى تعاون الموظفين لتقديم الرعاية لك',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      },
      {
        code: 'OVERALL_RECOMMEND_PRACTICE',
        textEn: 'Likelihood of your recommending our practice to others',
        textAr: 'احتمالية توصيتك بممارستنا للآخرين',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      },
      {
        code: 'OVERALL_CARE_RATING',
        textEn: 'Overall rating of care received during your visit',
        textAr: 'التقييم العام للرعاية التي تلقيتها أثناء زيارتك',
        type: 'rating',
        options: LIKERT_OPTIONS,
        optional: true
      },
      {
        code: 'OVERALL_HELP_TIMING',
        textEn: 'I received exactly the help I want (and need) exactly when I want (and need) it',
        textAr: 'تلقيت بالضبط المساعدة التي أريدها (وأحتاجها) في الوقت الذي أريده (وأحتاجه)',
        type: 'agreement',
        options: AGREEMENT_OPTIONS,
        optional: true
      },
      {
        code: 'OVERALL_NPS',
        textEn:
          "On a scale from 0 to 10, where 0 means 'Not at all likely' and 10 means 'Extremely likely', how likely is it that you would recommend this hospital to a friend or family?",
        textAr:
          'على مقياس من 0 إلى 10، حيث 0 يعني "غير محتمل على الإطلاق" و10 يعني "محتمل للغاية"، ما مدى احتمالية أن توصي بهذا المستشفى لصديق أو فرد من العائلة؟',
        type: 'nps',
        options: NPS_OPTIONS
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
