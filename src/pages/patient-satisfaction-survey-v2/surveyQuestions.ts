export type SatisfactionSurveyV2Language = 'en' | 'ar';

export type SatisfactionSurveyV2Question = {
  /** Ref from the survey sheet + the construct it measures (C4_CLINICIAN_COMMUNICATION); sent to the backend */
  code: string;
  textEn: string;
  textAr: string;
  type: 'rating' | 'text';
  /** Same as the satisfaction survey: questions without it must be answered */
  optional?: boolean;
  maxLength?: number;
};

export type SatisfactionSurveyV2Section = {
  id: string;
  titleEn: string;
  titleAr: string;
  questions: SatisfactionSurveyV2Question[];
};

export const SATISFACTION_SURVEY_V2_SECTIONS: SatisfactionSurveyV2Section[] = [
  {
    id: 'access',
    titleEn: 'Access and Waiting',
    titleAr: 'الوصول والانتظار',
    questions: [
      {
        code: 'C1_ACCESS_TO_CARE',
        textEn: 'How easy it was to be seen when you needed to be',
        textAr: 'ما مدى سهولة حصولك على الرعاية في الوقت الذي احتجت إليه؟',
        type: 'rating'
      },
      {
        code: 'C2_DELAY_COMMUNICATION',
        textEn: 'How well you were kept informed while you waited',
        textAr: 'ما مدى إبقائك على اطلاع أثناء انتظارك؟',
        type: 'rating'
      },
      {
        code: 'C3_PERCEIVED_WAIT',
        textEn: 'How reasonable the time you waited was',
        textAr: 'ما مدى ملاءمة مدة انتظارك؟',
        type: 'rating'
      }
    ]
  },
  {
    id: 'doctor',
    titleEn: 'Your Doctor',
    titleAr: 'طبيبك',
    questions: [
      {
        code: 'C4_CLINICIAN_COMMUNICATION',
        textEn: 'How clearly the doctor explained your condition and what happens next',
        textAr: 'ما مدى وضوح شرح الطبيب لحالتك والخطوات التالية؟',
        type: 'rating'
      },
      {
        code: 'C5_SHARED_DECISION_MAKING',
        textEn: 'How much the doctor involved you in decisions about your care',
        textAr: 'ما مدى إشراك الطبيب لك في القرارات المتعلقة برعايتك؟',
        type: 'rating'
      }
    ]
  },
  {
    id: 'safety',
    titleEn: 'Privacy, Safety and Cleanliness',
    titleAr: 'الخصوصية والسلامة والنظافة',
    questions: [
      {
        code: 'E1_PRIVACY',
        textEn: 'How well your privacy was respected during your visit',
        textAr: 'ما مدى احترام خصوصيتك أثناء زيارتك؟',
        type: 'rating'
      },
      {
        code: 'E2_SAFETY_PRACTICE',
        textEn: 'How well staff followed safety practice, such as hand washing and wearing identification',
        textAr: 'ما مدى التزام الموظفين بإجراءات السلامة مثل غسل اليدين وارتداء بطاقة التعريف؟',
        type: 'rating'
      },
      {
        code: 'E3_CLEANLINESS',
        textEn: 'How clean the areas you used were',
        textAr: 'ما مدى نظافة الأماكن التي استخدمتها؟',
        type: 'rating'
      }
    ]
  },
  {
    id: 'results',
    titleEn: 'Your Results',
    titleAr: 'نتائجك',
    questions: [
      {
        code: 'RS1_RESULTS_TURNAROUND',
        textEn: 'Whether your results arrived when you were told they would',
        textAr: 'ما مدى وصول نتائجك في الوقت الذي أُبلغت به؟',
        type: 'rating',
        optional: true
      },
      {
        code: 'RS2_RESULTS_COMMUNICATION',
        textEn: 'How clearly your results were explained to you',
        textAr: 'ما مدى وضوح شرح نتائجك لك؟',
        type: 'rating',
        optional: true
      }
    ]
  },
  {
    id: 'billing',
    titleEn: 'Billing',
    titleAr: 'الفواتير',
    questions: [
      {
        code: 'BL1_PRICE_TRANSPARENCY',
        textEn: 'How clearly you understood what you would pay before you received care',
        textAr: 'ما مدى وضوح ما ستدفعه قبل تلقي الخدمة؟',
        type: 'rating',
        optional: true
      }
    ]
  },
  {
    id: 'lab',
    titleEn: 'Blood Tests',
    titleAr: 'فحوصات الدم',
    questions: [
      {
        code: 'LB1_PHLEBOTOMY_COMPETENCE',
        textEn: 'The skill of the person who took your blood sample',
        textAr: 'ما مدى مهارة الموظف الذي قام بسحب عينة الدم؟',
        type: 'rating',
        optional: true
      },
      {
        code: 'LB2_LAB_WAIT',
        textEn: 'How reasonable your wait for the blood sample was',
        textAr: 'ما مدى ملاءمة مدة انتظارك لسحب عينة الدم؟',
        type: 'rating',
        optional: true
      }
    ]
  },
  {
    id: 'radiology',
    titleEn: 'Imaging',
    titleAr: 'الأشعة',
    questions: [
      {
        code: 'RD1_PRE_PROCEDURE_EXPLANATION',
        textEn: 'How clearly the procedure was explained to you beforehand',
        textAr: 'ما مدى وضوح الشرح المقدم لك قبل إجراء الأشعة؟',
        type: 'rating',
        optional: true
      },
      {
        code: 'RD2_RADIOLOGY_WAIT',
        textEn: 'How reasonable your wait for the scan was',
        textAr: 'ما مدى ملاءمة مدة انتظارك لخدمة الأشعة؟',
        type: 'rating',
        optional: true
      }
    ]
  },
  {
    id: 'pharmacy',
    titleEn: 'Pharmacy',
    titleAr: 'الصيدلية',
    questions: [
      {
        code: 'PH1_FORMULARY_AVAILABILITY',
        textEn: 'Whether the medicines you were prescribed were available',
        textAr: 'ما مدى توفر الأدوية التي وُصفت لك؟',
        type: 'rating',
        optional: true
      },
      {
        code: 'PH2_PHARMACY_WAIT',
        textEn: 'How reasonable your wait at the pharmacy was',
        textAr: 'ما مدى ملاءمة مدة انتظارك في الصيدلية؟',
        type: 'rating',
        optional: true
      }
    ]
  },
  {
    id: 'nursing',
    titleEn: 'Nursing',
    titleAr: 'التمريض',
    questions: [
      {
        code: 'NU1_NURSING_INTERPERSONAL_QUALITY',
        textEn: 'How well the nurse listened to you and understood your problem',
        textAr: 'ما مدى إصغاء الممرض أو الممرضة إليك وفهم مشكلتك؟',
        type: 'rating',
        optional: true
      },
      {
        code: 'NU2_NURSING_COMMUNICATION',
        textEn: 'How clearly the nurse explained what would happen',
        textAr: 'ما مدى وضوح شرح الممرض أو الممرضة لما سيحدث؟',
        type: 'rating',
        optional: true
      }
    ]
  },
  {
    id: 'reception',
    titleEn: 'Reception and Registration',
    titleAr: 'الاستقبال والتسجيل',
    questions: [
      {
        code: 'RG1_RECEPTION_MANNER',
        textEn: 'How professional and courteous the reception staff were',
        textAr: 'ما مدى مهنية موظفي الاستقبال ولطفهم؟',
        type: 'rating',
        optional: true
      },
      {
        code: 'RG2_REGISTRATION_PROCESS',
        textEn: 'How easy registration was when you arrived',
        textAr: 'ما مدى سهولة إجراءات التسجيل عند وصولك؟',
        type: 'rating',
        optional: true
      }
    ]
  },
  {
    id: 'overall',
    titleEn: 'Overall',
    titleAr: 'بشكل عام',
    questions: [
      {
        code: 'C6_LOYALTY',
        textEn: 'How likely you are to recommend Our Clinical Center to family or friends',
        textAr: 'ما مدى احتمالية أن توصي بمركزنا الطبي لعائلتك أو أصدقائك؟',
        type: 'rating'
      },
      {
        code: 'C7_OPEN_FEEDBACK',
        textEn: 'What one thing would have made your visit better?',
        textAr: 'ما الشيء الوحيد الذي كان سيجعل زيارتك أفضل؟',
        type: 'text',
        optional: true,
        maxLength: 1500
      }
    ]
  }
];

export const SATISFACTION_SURVEY_V2_QUESTIONS: SatisfactionSurveyV2Question[] =
  SATISFACTION_SURVEY_V2_SECTIONS.flatMap(section => section.questions);
