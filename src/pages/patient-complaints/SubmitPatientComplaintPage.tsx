import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Form } from 'rsuite';

import Logo from '@/images/Logo_BLUE_New1.svg';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { PhoneNumberInput } from '@/components';
import { useBranding } from '@/hooks/useBranding';
import { useAppDispatch } from '@/hooks';
import {
  useGetPublicActiveDepartmentsByFacilityQuery,
  useGetPublicActiveFacilitiesQuery,
  useLookupPatientComplaintByDocumentMutation,
  useRequestPatientPortalOtpMutation,
  useSubmitPatientComplaintMutation,
  useVerifyPatientPortalLoginOtpMutation,
  type PatientComplaintPublicLookupResult
} from '@/services/patient-complaints/patientComplaintService';
import { useEnumOptions } from '@/services/enumsApi';
import { extractErrorMessage } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import {
  ON_BEHALF_OPTIONS,
  PATIENT_COMPLAINT_FEEDBACK_TYPE_ENUM,
  PATIENT_COMPLAINT_FEEDBACK_TYPE_LABEL_OVERRIDES,
  PATIENT_COMPLAINT_PREFERRED_CONTACT_METHOD_ENUM,
  PATIENT_COMPLAINT_TYPE_ENUM,
  PATIENT_COMPLAINT_TYPE_LABEL_OVERRIDES,
  isValidComplaintEmail,
  isValidComplaintPhone,
  todayLocalDateInput,
  toDateInputValue,
  type ComplaintIdentityMode
} from './constants';

import './SubmitPatientComplaintPage.less';

type FormLanguage = 'en' | 'ar';

const OTP_RESEND_COOLDOWN_SECONDS = 60;

type FormRecord = {
  identityMode: ComplaintIdentityMode;
  patientName: string;
  documentType: string | null;
  documentNumber: string;
  contactEmail: string;
  contactPhone: string;
  preferredContactMethod: string | null;
  onBehalf: string | null;
  relationshipToPatient: string;
  consentToContact: boolean;
  facilityId: number | string | null;
  departmentId: number | string | null;
  feedbackType: string | null;
  complaintType: string | null;
  incidentDate: string | null;
  /** HH:mm:ss from MyInput fieldType="time". */
  incidentTime: string | null;
  description: string;
  involvedStaffNames: string;
  desiredResolution: string;
};

const EMPTY_FORM: FormRecord = {
  identityMode: 'identified',
  patientName: '',
  documentType: null,
  documentNumber: '',
  contactEmail: '',
  contactPhone: '',
  preferredContactMethod: null,
  onBehalf: null,
  relationshipToPatient: '',
  consentToContact: false,
  facilityId: null,
  departmentId: null,
  feedbackType: null,
  complaintType: null,
  incidentDate: null,
  incidentTime: null,
  description: '',
  involvedStaffNames: '',
  desiredResolution: ''
};

/** Fields populated from a matched patient record. */
const AUTOFILL_FIELD_KEYS = ['patientName', 'contactPhone', 'contactEmail'] as const;

const COPY = {
  en: {
    pageLabel: 'PATIENT EXPERIENCE',
    title: 'Patient Feedback',
    subtitle: 'Please share your feedback using the form below.',
    requiredHint: 'Fields marked with * are required.',
    optional: 'optional',
    identityTitle: 'Submission Mode',
    identityDescription: 'Choose whether to submit anonymously or with your details.',
    identified: 'Identified',
    anonymous: 'Anonymous',
    contactTitle: 'Your Information',
    contactDescription: 'Tell us who you are and how we should contact you.',
    anonymousNote:
      'You chose anonymous submission. Identifying and contact fields are hidden. Consent is still required.',
    complaintTitle: 'Visit & Feedback Details',
    complaintDescription: 'Tell us about your visit and the feedback you would like to share.',
    patientName: 'Full Name',
    patientDocument: 'Patient Document',
    documentType: 'Document Type',
    documentNumber: 'Document Number',
    contactEmail: 'Email',
    contactPhone: 'Phone Number',
    preferredContactMethod: 'Preferred Contact Method',
    patientNotFound:
      'No matching patient found for this document. You can continue and enter your details manually.',
    patientAmbiguous:
      'Multiple patients match this document. Please enter your details manually.',
    documentFieldsRequired: 'Please select a document type and enter a document number.',
    patientAutofilled: 'Patient details were filled from the matched record. You can edit them if needed.',
    loadPatient: 'Load',
    otpTitle: 'Verify Document',
    otpDescription: 'Enter the verification code sent to the patient’s registered mobile number.',
    otpLabel: 'Verification Code',
    otpRequired: 'Please enter the verification code.',
    otpSent: 'A verification code was sent to the patient’s registered mobile number.',
    otpVerify: 'Verify',
    otpVerifying: 'Verifying…',
    otpResend: 'Resend code',
    otpResending: 'Sending…',
    otpRequestFailed: 'Unable to send a verification code. Please try again.',
    otpVerifyFailed: 'Invalid or expired verification code. Please try again.',
    onBehalf: 'On Behalf of Someone Else?',
    relationship: 'Relationship',
    consentLabel:
      'Consent to be contacted and to review the medical record for this complaint.',
    facility: 'Facility',
    department: 'Department or Clinic',
    feedbackType: 'Type of Feedback',
    complaintType: 'Category',
    incidentDate: 'Date of Visit',
    incidentTime: 'Time of Visit',
    description: 'Details',
    involvedStaff: 'Healthcare Professional Involved',
    desiredResolution: 'Outcome You Are Looking For',
    attachments: 'Attachment',
    attachmentsHint:
      'Optional photo or document. Allowed types follow hospital file settings (images and documents, max 50 MB).',
    clearFiles: 'Clear files',
    required: 'Please complete all required fields.',
    invalidEmail: 'Please enter a valid email address.',
    invalidPhone: 'Please enter a valid phone number.',
    emailRequiredForPreferred: 'Email is required when Email is the preferred contact method.',
    consentRequired: 'Please provide consent before submitting.',
    futureIncidentDate: 'Visit date cannot be in the future.',
    clear: 'Clear',
    submit: 'Submit Feedback',
    submitting: 'Submitting…',
    submitFailed: 'Unable to submit your feedback. Please try again.',
    facilitiesFailed: 'Unable to load facilities. Please refresh and try again.',
    departmentsLoading: 'Loading departments…',
    departmentsEmpty: 'No departments available for this facility.',
    departmentsFailed: 'Unable to load departments. Please select another facility or try again.',
    confirmationTitle: 'Feedback Submitted',
    confirmationMessage: 'Thank you. Your feedback has been received successfully.',
    referenceLabel: 'Reference',
    submitAnother: 'Start another form'
  },
  ar: {
    pageLabel: 'تجربة المريض',
    title: 'ملاحظات المريض',
    subtitle: 'يرجى مشاركة ملاحظاتك باستخدام النموذج أدناه.',
    requiredHint: 'الحقول المميزة بـ * مطلوبة.',
    optional: 'اختياري',
    identityTitle: 'طريقة التقديم',
    identityDescription: 'اختر التقديم بشكل مجهول أو مع بياناتك.',
    identified: 'معرّف',
    anonymous: 'مجهول',
    contactTitle: 'بياناتك',
    contactDescription: 'أخبرنا من أنت وكيف يمكننا التواصل معك.',
    anonymousNote:
      'اخترت التقديم بشكل مجهول. تم إخفاء حقول التعريف والتواصل. الموافقة لا تزال مطلوبة.',
    complaintTitle: 'تفاصيل الزيارة والملاحظة',
    complaintDescription: 'أخبرنا عن زيارتك والملاحظة التي تود مشاركتها.',
    patientName: 'الاسم الكامل',
    patientDocument: 'وثيقة المريض',
    documentType: 'نوع الوثيقة',
    documentNumber: 'رقم الوثيقة',
    contactEmail: 'البريد الإلكتروني',
    contactPhone: 'رقم الهاتف',
    preferredContactMethod: 'طريقة التواصل المفضلة',
    patientNotFound:
      'لم يتم العثور على مريض مطابق لهذه الوثيقة. يمكنك المتابعة وإدخال بياناتك يدوياً.',
    patientAmbiguous:
      'يوجد أكثر من مريض مطابق لهذه الوثيقة. يرجى إدخال بياناتك يدوياً.',
    documentFieldsRequired: 'يرجى اختيار نوع الوثيقة وإدخال رقم الوثيقة.',
    patientAutofilled: 'تم تعبئة بيانات المريض من السجل المطابق. يمكنك تعديلها عند الحاجة.',
    loadPatient: 'تحميل',
    otpTitle: 'تحقق من الوثيقة',
    otpDescription: 'أدخل رمز التحقق المرسل إلى رقم جوال المريض المسجل.',
    otpLabel: 'رمز التحقق',
    otpRequired: 'يرجى إدخال رمز التحقق.',
    otpSent: 'تم إرسال رمز التحقق إلى رقم جوال المريض المسجل.',
    otpVerify: 'تحقق',
    otpVerifying: 'جاري التحقق…',
    otpResend: 'إعادة إرسال الرمز',
    otpResending: 'جاري الإرسال…',
    otpRequestFailed: 'تعذر إرسال رمز التحقق. يرجى المحاولة مرة أخرى.',
    otpVerifyFailed: 'رمز التحقق غير صالح أو منتهٍ. يرجى المحاولة مرة أخرى.',
    onBehalf: 'هل التقديم نيابة عن شخص آخر؟',
    relationship: 'العلاقة',
    consentLabel: 'الموافقة على التواصل ومراجعة السجل الطبي بخصوص هذه الملاحظة.',
    facility: 'المنشأة',
    department: 'القسم أو العيادة',
    feedbackType: 'نوع الملاحظة',
    complaintType: 'التصنيف',
    incidentDate: 'تاريخ الزيارة',
    incidentTime: 'وقت الزيارة',
    description: 'التفاصيل',
    involvedStaff: 'مقدم الرعاية الصحية المعني',
    desiredResolution: 'النتيجة التي تتطلع إليها',
    attachments: 'مرفق',
    attachmentsHint:
      'صورة أو مستند اختياري. أنواع الملفات حسب إعدادات المنشأة (صور ومستندات، بحد أقصى 50 ميغابايت).',
    clearFiles: 'مسح الملفات',
    required: 'يرجى تعبئة جميع الحقول المطلوبة.',
    invalidEmail: 'يرجى إدخال بريد إلكتروني صالح.',
    invalidPhone: 'يرجى إدخال رقم هاتف صالح.',
    emailRequiredForPreferred: 'البريد الإلكتروني مطلوب عند اختيار البريد كطريقة تواصل مفضلة.',
    consentRequired: 'يرجى تقديم الموافقة قبل الإرسال.',
    futureIncidentDate: 'لا يمكن أن يكون تاريخ الزيارة في المستقبل.',
    clear: 'مسح',
    submit: 'إرسال الملاحظة',
    submitting: 'جاري الإرسال…',
    submitFailed: 'تعذر إرسال الملاحظة. يرجى المحاولة مرة أخرى.',
    facilitiesFailed: 'تعذر تحميل المنشآت. يرجى تحديث الصفحة والمحاولة مرة أخرى.',
    departmentsLoading: 'جاري تحميل الأقسام…',
    departmentsEmpty: 'لا توجد أقسام متاحة لهذه المنشأة.',
    departmentsFailed: 'تعذر تحميل الأقسام. يرجى اختيار منشأة أخرى أو المحاولة مرة أخرى.',
    confirmationTitle: 'تم إرسال الملاحظة',
    confirmationMessage: 'شكراً لك. تم استلام ملاحظتك بنجاح.',
    referenceLabel: 'الرقم المرجعي',
    submitAnother: 'تعبئة نموذج آخر'
  }
} as const;

const SubmitPatientComplaintPage: React.FC = () => {
  const branding = useBranding();
  const dispatch = useAppDispatch();

  const [language, setLanguage] = useState<FormLanguage>('en');
  const [formRecord, setFormRecord] = useState<FormRecord>({ ...EMPTY_FORM });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);
  /** Local portal host so the time menu scrolls with the field (body scroll + body portal drifts). */
  const timePickerContainerRef = useRef<HTMLDivElement>(null);
  /**
   * Snapshot of values written by the last successful lookup.
   * On document identity change, only clear fields that still match this snapshot
   * (preserve unrelated manual edits).
   */
  const autofillSnapshotRef = useRef<Partial<FormRecord> | null>(null);
  const documentLookupRequestIdRef = useRef(0);
  const [phoneResetKey, setPhoneResetKey] = useState(0);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpRecord, setOtpRecord] = useState<{ otp: string }>({ otp: '' });
  const [otpDocumentType, setOtpDocumentType] = useState<string | null>(null);
  const [otpDocumentNumber, setOtpDocumentNumber] = useState('');
  const [patientLookupJwt, setPatientLookupJwt] = useState<string | null>(null);
  const [otpResendCooldownSeconds, setOtpResendCooldownSeconds] = useState(0);
  const otpCooldownDocumentKeyRef = useRef<string | null>(null);
  const otpCooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    data: facilities = [],
    isLoading: facilitiesLoading,
    isError: facilitiesError
  } = useGetPublicActiveFacilitiesQuery();

  const selectedFacilityId =
    formRecord.facilityId != null && formRecord.facilityId !== ''
      ? Number(formRecord.facilityId)
      : null;

  const {
    data: departments = [],
    isFetching: departmentsFetching,
    isError: departmentsError,
    isSuccess: departmentsSuccess
  } = useGetPublicActiveDepartmentsByFacilityQuery(selectedFacilityId as number, {
    skip: selectedFacilityId == null || Number.isNaN(selectedFacilityId)
  });

  const [submitComplaint, { isLoading: isSubmitting }] = useSubmitPatientComplaintMutation();
  const [requestPortalOtp, { isLoading: isRequestingOtp }] = useRequestPatientPortalOtpMutation();
  const [verifyPortalOtp, { isLoading: isVerifyingOtp }] = useVerifyPatientPortalLoginOtpMutation();
  const [lookupByDocument, { isLoading: isLookingUpPatient }] =
    useLookupPatientComplaintByDocumentMutation();
  const isOtpBusy = isRequestingOtp || isVerifyingOtp || isLookingUpPatient;
  const currentDocumentKey = formRecord.documentNumber.trim();
  const isSameDocumentOtpCooldown =
    otpResendCooldownSeconds > 0 &&
    otpCooldownDocumentKeyRef.current != null &&
    otpCooldownDocumentKeyRef.current === currentDocumentKey;

  const clearOtpResendCooldown = () => {
    if (otpCooldownTimerRef.current != null) {
      clearInterval(otpCooldownTimerRef.current);
      otpCooldownTimerRef.current = null;
    }
    otpCooldownDocumentKeyRef.current = null;
    setOtpResendCooldownSeconds(0);
  };

  const startOtpResendCooldown = (documentNumber: string) => {
    if (otpCooldownTimerRef.current != null) {
      clearInterval(otpCooldownTimerRef.current);
      otpCooldownTimerRef.current = null;
    }
    otpCooldownDocumentKeyRef.current = documentNumber.trim();
    setOtpResendCooldownSeconds(OTP_RESEND_COOLDOWN_SECONDS);
    otpCooldownTimerRef.current = setInterval(() => {
      setOtpResendCooldownSeconds(prev => {
        if (prev <= 1) {
          if (otpCooldownTimerRef.current != null) {
            clearInterval(otpCooldownTimerRef.current);
            otpCooldownTimerRef.current = null;
          }
          otpCooldownDocumentKeyRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(
    () => () => {
      if (otpCooldownTimerRef.current != null) {
        clearInterval(otpCooldownTimerRef.current);
      }
    },
    []
  );

  const feedbackTypeOptions = useEnumOptions(PATIENT_COMPLAINT_FEEDBACK_TYPE_ENUM, {
    allowAnonymous: true,
    labelOverrides: PATIENT_COMPLAINT_FEEDBACK_TYPE_LABEL_OVERRIDES
  });
  const complaintTypeOptions = useEnumOptions(PATIENT_COMPLAINT_TYPE_ENUM, {
    allowAnonymous: true,
    labelOverrides: PATIENT_COMPLAINT_TYPE_LABEL_OVERRIDES
  });
  const preferredContactOptions = useEnumOptions(
    PATIENT_COMPLAINT_PREFERRED_CONTACT_METHOD_ENUM,
    { allowAnonymous: true }
  );
  // Same DocumentType source as CreateNewPatient / Extra Details.
  const documentTypeOptions = useEnumOptions('DocumentType', {
    allowAnonymous: true,
    exclude: ['NO_DOCUMENT', 'DRIVING_LICENSE', 'SOCIAL_CARD']
  });

  const copy = COPY[language];
  const isRtl = language === 'ar';
  const isAnonymous = formRecord.identityMode === 'anonymous';
  const onBehalf = formRecord.onBehalf === 'true';
  const maxIncidentDate = todayLocalDateInput();

  const facilityOptions = useMemo(
    () =>
      facilities.map(facility => ({
        label: facility.name,
        value: facility.id
      })),
    [facilities]
  );

  const departmentOptions = useMemo(
    () =>
      departments.map(department => ({
        label: department.name,
        value: department.id
      })),
    [departments]
  );

  const departmentFieldEnabled =
    selectedFacilityId != null &&
    !Number.isNaN(selectedFacilityId) &&
    !departmentsFetching &&
    !isSubmitting &&
    departmentsSuccess &&
    departmentOptions.length > 0;

  const clearIdentityFields = (next: FormRecord): FormRecord => ({
    ...next,
    patientName: '',
    documentType: null,
    documentNumber: '',
    contactEmail: '',
    contactPhone: '',
    preferredContactMethod: null,
    onBehalf: null,
    relationshipToPatient: ''
  });

  const resetOtpVerificationState = () => {
    setOtpModalOpen(false);
    setOtpRecord({ otp: '' });
    setOtpDocumentType(null);
    setOtpDocumentNumber('');
    setPatientLookupJwt(null);
    clearOtpResendCooldown();
  };

  const clearAutofilledPatientFields = (next: FormRecord): FormRecord => {
    const snapshot = autofillSnapshotRef.current;
    if (!snapshot) return next;

    autofillSnapshotRef.current = null;
    let phoneCleared = false;
    const cleared: FormRecord = { ...next };

    for (const key of AUTOFILL_FIELD_KEYS) {
      const snapValue = snapshot[key];
      if (snapValue === undefined) continue;
      if (cleared[key] === snapValue) {
        (cleared as Record<string, unknown>)[key] = '';
        if (key === 'contactPhone') phoneCleared = true;
      }
    }

    if (phoneCleared) {
      setPhoneResetKey(key => key + 1);
    }
    return cleared;
  };

  const applyLookupAutofill = (
    result: PatientComplaintPublicLookupResult,
    base: FormRecord
  ): FormRecord => {
    const snapshot: Partial<FormRecord> = {
      patientName: String(result.patientName ?? '').trim(),
      contactPhone: String(result.contactPhone ?? '').trim(),
      contactEmail: String(result.contactEmail ?? '').trim()
    };

    autofillSnapshotRef.current = snapshot;
    setPhoneResetKey(key => key + 1);

    return {
      ...base,
      ...snapshot
    };
  };

  const handleRecordChange = (next: FormRecord) => {
    setError(false);
    setSubmitError('');

    let updated = next;

    if (next.identityMode !== formRecord.identityMode) {
      if (next.identityMode === 'anonymous') {
        documentLookupRequestIdRef.current += 1;
        autofillSnapshotRef.current = null;
        resetOtpVerificationState();
        updated = clearIdentityFields(next);
        setPhoneResetKey(key => key + 1);
      }
    }

    const documentIdentityChanged =
      updated.documentType !== formRecord.documentType ||
      updated.documentNumber !== formRecord.documentNumber;

    if (documentIdentityChanged) {
      documentLookupRequestIdRef.current += 1;
      resetOtpVerificationState();
      updated = clearAutofilledPatientFields(updated);
    }

    if (updated.onBehalf !== 'true' && updated.relationshipToPatient) {
      updated = { ...updated, relationshipToPatient: '' };
    }

    if (updated.facilityId !== formRecord.facilityId) {
      updated = {
        ...updated,
        departmentId: null
      };
    }

    setFormRecord(updated);
  };

  const handleDocumentLoad = async (): Promise<boolean> => {
    if (isAnonymous || isSubmitting || isOtpBusy) {
      return false;
    }

    const documentType = formRecord.documentType;
    const documentNumber = formRecord.documentNumber.trim();

    if (!documentType || !documentNumber) {
      dispatch(notify({ msg: copy.documentFieldsRequired, sev: 'warning' }));
      return false;
    }

    if (
      otpResendCooldownSeconds > 0 &&
      otpCooldownDocumentKeyRef.current === documentNumber
    ) {
      return false;
    }

    const requestId = ++documentLookupRequestIdRef.current;
    setPatientLookupJwt(null);

    try {
      await requestPortalOtp({
        primaryDocumentNumber: documentNumber
      }).unwrap();

      if (requestId !== documentLookupRequestIdRef.current) {
        return false;
      }

      setOtpDocumentType(documentType);
      setOtpDocumentNumber(documentNumber);
      setOtpRecord({ otp: '' });
      setOtpModalOpen(true);
      startOtpResendCooldown(documentNumber);
      dispatch(notify({ msg: copy.otpSent, sev: 'success' }));
      return true;
    } catch (err) {
      if (requestId !== documentLookupRequestIdRef.current) {
        return false;
      }

      const message = extractErrorMessage(err) || copy.otpRequestFailed;
      const lower = message.toLowerCase();
      const toast =
        lower.includes('invalid') || lower.includes('credential') || lower.includes('document')
          ? copy.patientNotFound
          : message;

      dispatch(notify({ msg: toast, sev: 'warning' }));
      return false;
    }
  };

  const handleOtpResend = async () => {
    if (isAnonymous || isSubmitting || isOtpBusy || otpResendCooldownSeconds > 0) return;

    const documentType = otpDocumentType ?? formRecord.documentType;
    const documentNumber = (otpDocumentNumber || formRecord.documentNumber).trim();

    if (!documentType || !documentNumber) {
      dispatch(notify({ msg: copy.documentFieldsRequired, sev: 'warning' }));
      return;
    }

    const requestId = ++documentLookupRequestIdRef.current;
    setPatientLookupJwt(null);

    try {
      await requestPortalOtp({
        primaryDocumentNumber: documentNumber
      }).unwrap();

      if (requestId !== documentLookupRequestIdRef.current) {
        return;
      }

      setOtpDocumentType(documentType);
      setOtpDocumentNumber(documentNumber);
      setOtpRecord({ otp: '' });
      startOtpResendCooldown(documentNumber);
      dispatch(notify({ msg: copy.otpSent, sev: 'success' }));
    } catch (err) {
      if (requestId !== documentLookupRequestIdRef.current) {
        return;
      }
      dispatch(notify({ msg: extractErrorMessage(err) || copy.otpRequestFailed, sev: 'warning' }));
    }
  };

  const handleOtpVerify = async () => {
    if (isAnonymous || isSubmitting || isOtpBusy) return;

    const documentType = otpDocumentType ?? formRecord.documentType;
    const documentNumber = (otpDocumentNumber || formRecord.documentNumber).trim();
    const otp = otpRecord.otp.trim();

    if (!documentType || !documentNumber) {
      dispatch(notify({ msg: copy.documentFieldsRequired, sev: 'warning' }));
      return;
    }

    if (!otp) {
      dispatch(notify({ msg: copy.otpRequired, sev: 'warning' }));
      return;
    }

    const requestId = ++documentLookupRequestIdRef.current;

    try {
      const login = await verifyPortalOtp({
        primaryDocumentNumber: documentNumber,
        otp
      }).unwrap();

      if (requestId !== documentLookupRequestIdRef.current) {
        return;
      }

      const accessToken = String(login?.token ?? '').trim();
      if (!accessToken) {
        dispatch(notify({ msg: copy.otpVerifyFailed, sev: 'warning' }));
        return;
      }

      setPatientLookupJwt(accessToken);

      const result = await lookupByDocument({
        documentType,
        documentNumber,
        accessToken
      }).unwrap();

      if (requestId !== documentLookupRequestIdRef.current) {
        return;
      }

      setFormRecord(prev => applyLookupAutofill(result, prev));
      // Keep patientLookupJwt for submit linking; only close the OTP UI.
      setOtpModalOpen(false);
      setOtpRecord({ otp: '' });
      dispatch(notify({ msg: copy.patientAutofilled, sev: 'success' }));
    } catch (err) {
      if (requestId !== documentLookupRequestIdRef.current) {
        return;
      }

      setPatientLookupJwt(null);

      const message = extractErrorMessage(err) || copy.otpVerifyFailed;
      const lower = message.toLowerCase();
      const toast =
        lower.includes('multiple') || lower.includes('ambiguous')
          ? copy.patientAmbiguous
          : lower.includes('not found') || lower.includes('matching')
            ? copy.patientNotFound
            : lower.includes('otp') ||
                lower.includes('verification') ||
                lower.includes('expired') ||
                lower.includes('unauthorized')
              ? copy.otpVerifyFailed
              : message;

      dispatch(notify({ msg: toast, sev: 'warning' }));
    }
  };

  const handleClear = () => {
    if (isSubmitting) return;
    autofillSnapshotRef.current = null;
    documentLookupRequestIdRef.current += 1;
    resetOtpVerificationState();
    setFormRecord({ ...EMPTY_FORM });
    setSelectedFiles([]);
    setError(false);
    setSubmitError('');
    setPhoneResetKey(key => key + 1);
  };

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setSelectedFiles(files);
    setSubmitError('');
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const departmentSelected =
      formRecord.departmentId != null && formRecord.departmentId !== '';

    const identifiedOk =
      isAnonymous ||
      (formRecord.patientName.trim() &&
        formRecord.contactPhone.trim() &&
        formRecord.preferredContactMethod &&
        formRecord.onBehalf != null &&
        formRecord.onBehalf !== '');

    const requiredOk =
      formRecord.facilityId != null &&
      formRecord.facilityId !== '' &&
      departmentSelected &&
      formRecord.feedbackType &&
      formRecord.incidentDate &&
      Boolean(formRecord.incidentTime && String(formRecord.incidentTime).trim()) &&
      formRecord.description.trim() &&
      formRecord.consentToContact &&
      identifiedOk;

    if (!requiredOk) {
      setError(true);
      setSubmitError(!formRecord.consentToContact ? copy.consentRequired : '');
      return;
    }

    const incidentDateValue = toDateInputValue(formRecord.incidentDate as string);
    if (!incidentDateValue) {
      setError(true);
      setSubmitError('');
      return;
    }
    if (incidentDateValue > maxIncidentDate) {
      setError(false);
      setSubmitError(copy.futureIncidentDate);
      return;
    }

    if (
      !isAnonymous &&
      formRecord.contactEmail.trim() &&
      !isValidComplaintEmail(formRecord.contactEmail)
    ) {
      setError(false);
      setSubmitError(copy.invalidEmail);
      return;
    }

    if (!isAnonymous && formRecord.preferredContactMethod === 'EMAIL' && !formRecord.contactEmail.trim()) {
      setError(false);
      setSubmitError(copy.emailRequiredForPreferred);
      return;
    }

    if (
      !isAnonymous &&
      formRecord.preferredContactMethod === 'EMAIL' &&
      formRecord.contactEmail.trim() &&
      !isValidComplaintEmail(formRecord.contactEmail)
    ) {
      setError(false);
      setSubmitError(copy.invalidEmail);
      return;
    }

    if (!isAnonymous && !isValidComplaintPhone(formRecord.contactPhone)) {
      setError(false);
      setSubmitError(copy.invalidPhone);
      return;
    }

    setError(false);
    setSubmitError('');

    try {
      const facilityId = Number(formRecord.facilityId);
      const departmentId = Number(formRecord.departmentId);

      // Link patient only when OTP-verified JWT is for this person (not anonymous / on-behalf).
      const verifiedPatientToken =
        !isAnonymous && formRecord.onBehalf !== 'true' && patientLookupJwt
          ? patientLookupJwt
          : undefined;

      const response = await submitComplaint({
        anonymous: isAnonymous,
        consentToContact: true,
        ...(isAnonymous
          ? {}
          : {
              patientName: formRecord.patientName.trim(),
              ...(formRecord.documentType && formRecord.documentNumber.trim()
                ? {
                    documentType: formRecord.documentType,
                    documentNumber: formRecord.documentNumber.trim(),
                    patientIdentifier: formRecord.documentNumber.trim()
                  }
                : {}),
              contactPhone: formRecord.contactPhone.trim(),
              ...(formRecord.contactEmail.trim()
                ? { contactEmail: formRecord.contactEmail.trim() }
                : {}),
              preferredContactMethod: String(formRecord.preferredContactMethod),
              onBehalf: formRecord.onBehalf === 'true',
              ...(formRecord.onBehalf === 'true' && formRecord.relationshipToPatient.trim()
                ? { relationshipToPatient: formRecord.relationshipToPatient.trim() }
                : {})
            }),
        facilityId,
        departmentId,
        feedbackType: String(formRecord.feedbackType),
        ...(formRecord.complaintType ? { complaintType: String(formRecord.complaintType) } : {}),
        incidentDate: incidentDateValue,
        incidentTime: String(formRecord.incidentTime).trim(),
        description: formRecord.description.trim(),
        ...(formRecord.involvedStaffNames.trim()
          ? { involvedStaffNames: formRecord.involvedStaffNames.trim() }
          : {}),
        ...(formRecord.desiredResolution.trim()
          ? { desiredResolution: formRecord.desiredResolution.trim() }
          : {}),
        files: selectedFiles,
        ...(verifiedPatientToken ? { accessToken: verifiedPatientToken } : {})
      }).unwrap();

      autofillSnapshotRef.current = null;
      documentLookupRequestIdRef.current += 1;
      resetOtpVerificationState();
      setSubmittedReference(response.reference);
      setSelectedFiles([]);
      setFormRecord({ ...EMPTY_FORM });
      setPhoneResetKey(key => key + 1);
    } catch (err) {
      setSubmitError(extractErrorMessage(err) || copy.submitFailed);
    }
  };

  const handleSubmitAnother = () => {
    autofillSnapshotRef.current = null;
    documentLookupRequestIdRef.current += 1;
    resetOtpVerificationState();
    setSubmittedReference(null);
    setFormRecord({ ...EMPTY_FORM });
    setSelectedFiles([]);
    setError(false);
    setSubmitError('');
    setPhoneResetKey(key => key + 1);
  };

  return (
    <div
      className="patient-complaint-public-page"
      dir={isRtl ? 'rtl' : 'ltr'}
      lang={language}
    >
      <header className="patient-complaint-public-header">
        <div className="patient-complaint-header-content">
          <div className="patient-complaint-logo">
            <img src={branding?.logoUrl || Logo} alt="Asklepios" />
          </div>
          <div className="patient-complaint-lang-toggle">
            <MyButton
              appearance={language === 'en' ? 'primary' : 'ghost'}
              backgroundColor={language === 'en' ? 'var(--primary-blue)' : undefined}
              size="xs"
              onClick={() => setLanguage('en')}
            >
              EN
            </MyButton>
            <MyButton
              appearance={language === 'ar' ? 'primary' : 'ghost'}
              backgroundColor={language === 'ar' ? 'var(--primary-blue)' : undefined}
              size="xs"
              onClick={() => setLanguage('ar')}
            >
              عربي
            </MyButton>
          </div>
        </div>
      </header>

      <main className="patient-complaint-public-main">
        <div className="patient-complaint-page-heading">
          <div className="patient-complaint-page-label">{copy.pageLabel}</div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>

        {!submittedReference ? (
          <div className="patient-complaint-form-card">
            <div className="patient-complaint-card-heading">
              <div>
                <h2>{copy.title}</h2>
                <p>{copy.requiredHint}</p>
              </div>
            </div>

            <Form fluid className="patient-complaint-public-form">
              <section className="patient-complaint-form-section">
                <div className="patient-complaint-section-heading">
                  <span className="patient-complaint-section-number">01</span>
                  <div>
                    <h3>{copy.identityTitle}</h3>
                    <p>{copy.identityDescription}</p>
                  </div>
                </div>

                <div className="patient-complaint-identity-toggle">
                  <MyButton
                    appearance={formRecord.identityMode === 'identified' ? 'primary' : 'ghost'}
                    backgroundColor={
                      formRecord.identityMode === 'identified'
                        ? 'var(--primary-blue)'
                        : undefined
                    }
                    disabled={isSubmitting}
                    onClick={() =>
                      handleRecordChange({ ...formRecord, identityMode: 'identified' })
                    }
                  >
                    {copy.identified}
                  </MyButton>
                  <MyButton
                    appearance={formRecord.identityMode === 'anonymous' ? 'primary' : 'ghost'}
                    backgroundColor={
                      formRecord.identityMode === 'anonymous'
                        ? 'var(--primary-blue)'
                        : undefined
                    }
                    disabled={isSubmitting}
                    onClick={() =>
                      handleRecordChange({ ...formRecord, identityMode: 'anonymous' })
                    }
                  >
                    {copy.anonymous}
                  </MyButton>
                </div>
              </section>

              <section className="patient-complaint-form-section">
                <div className="patient-complaint-section-heading">
                  <span className="patient-complaint-section-number">02</span>
                  <div>
                    <h3>{copy.contactTitle}</h3>
                    <p>{isAnonymous ? copy.anonymousNote : copy.contactDescription}</p>
                  </div>
                </div>

                {!isAnonymous ? (
                  <>
                    <div className="patient-complaint-field">
                      <MyInput
                        fieldType="text"
                        fieldName="patientName"
                        fieldLabel={copy.patientName}
                        record={formRecord}
                        setRecord={handleRecordChange}
                        required
                        width="100%"
                      />
                    </div>

                    <div className="patient-complaint-document-block">
                      <div className="patient-complaint-document-heading">
                        {copy.patientDocument}{' '}
                        <span className="patient-complaint-optional">({copy.optional})</span>
                      </div>
                      <div className="patient-complaint-fields-row">
                        <div className="patient-complaint-field">
                          <MyInput
                            fieldType="select"
                            fieldName="documentType"
                            fieldLabel={copy.documentType}
                            record={formRecord}
                            setRecord={handleRecordChange}
                            selectData={documentTypeOptions}
                            selectDataLabel="label"
                            selectDataValue="value"
                            searchable={false}
                            disabled={isSubmitting || isOtpBusy}
                            width="100%"
                          />
                        </div>
                        <div className="patient-complaint-field">
                          <MyInput
                            fieldType="text"
                            fieldName="documentNumber"
                            fieldLabel={copy.documentNumber}
                            record={formRecord}
                            setRecord={handleRecordChange}
                            enterClick={handleDocumentLoad}
                            disabled={isSubmitting || isOtpBusy}
                            width="100%"
                          />
                        </div>
                        <div className="patient-complaint-field patient-complaint-load-field">
                          <MyButton
                            appearance="ghost"
                            disabled={isSubmitting || isOtpBusy || isSameDocumentOtpCooldown}
                            onClick={() => {
                              void handleDocumentLoad();
                            }}
                          >
                            {isRequestingOtp && !otpModalOpen
                              ? copy.otpResending
                              : isSameDocumentOtpCooldown
                                ? `${copy.loadPatient} (${otpResendCooldownSeconds}s)`
                                : copy.loadPatient}
                          </MyButton>
                        </div>
                      </div>

                    </div>

                    <div className="patient-complaint-fields-row">
                      <div className="patient-complaint-field">
                        <PhoneNumberInput
                          fieldName="contactPhone"
                          fieldLabel={copy.contactPhone}
                          record={formRecord}
                          setRecord={handleRecordChange}
                          required
                          defaultCountry="sa"
                          width="100%"
                          resetKey={phoneResetKey}
                        />
                      </div>
                      <div className="patient-complaint-field">
                        <MyInput
                          fieldType="text"
                          fieldName="contactEmail"
                          fieldLabel={`${copy.contactEmail} (${copy.optional})`}
                          record={formRecord}
                          setRecord={handleRecordChange}
                          width="100%"
                        />
                      </div>
                    </div>

                    <div className="patient-complaint-fields-row">
                      <div className="patient-complaint-field">
                        <MyInput
                          fieldType="select"
                          fieldName="preferredContactMethod"
                          fieldLabel={copy.preferredContactMethod}
                          record={formRecord}
                          setRecord={handleRecordChange}
                          selectData={preferredContactOptions}
                          selectDataLabel="label"
                          selectDataValue="value"
                          required
                          width="100%"
                        />
                      </div>
                      <div className="patient-complaint-field">
                        <MyInput
                          fieldType="select"
                          fieldName="onBehalf"
                          fieldLabel={copy.onBehalf}
                          record={formRecord}
                          setRecord={handleRecordChange}
                          selectData={ON_BEHALF_OPTIONS}
                          selectDataLabel="label"
                          selectDataValue="value"
                          required
                          width="100%"
                        />
                      </div>
                    </div>

                    {onBehalf ? (
                      <div className="patient-complaint-field">
                        <MyInput
                          fieldType="text"
                          fieldName="relationshipToPatient"
                          fieldLabel={`${copy.relationship} (${copy.optional})`}
                          record={formRecord}
                          setRecord={handleRecordChange}
                          width="100%"
                        />
                      </div>
                    ) : null}
                  </>
                ) : null}

                <div className="patient-complaint-consent">
                  <label className="patient-complaint-consent-label">
                    <input
                      type="checkbox"
                      checked={formRecord.consentToContact}
                      disabled={isSubmitting}
                      onChange={event =>
                        handleRecordChange({
                          ...formRecord,
                          consentToContact: event.target.checked
                        })
                      }
                    />
                    <span>
                      {copy.consentLabel} <em>*</em>
                    </span>
                  </label>
                </div>
              </section>

              <section className="patient-complaint-form-section">
                <div className="patient-complaint-section-heading">
                  <span className="patient-complaint-section-number">03</span>
                  <div>
                    <h3>{copy.complaintTitle}</h3>
                    <p>{copy.complaintDescription}</p>
                  </div>
                </div>

                <div className="patient-complaint-fields-row">
                  <div className="patient-complaint-field">
                    <MyInput
                      fieldType="select"
                      fieldName="facilityId"
                      fieldLabel={copy.facility}
                      record={formRecord}
                      setRecord={handleRecordChange}
                      selectData={facilityOptions}
                      selectDataLabel="label"
                      selectDataValue="value"
                      searchable
                      required
                      disabled={facilitiesLoading || isSubmitting}
                      width="100%"
                    />
                  </div>

                  <div className="patient-complaint-field">
                    <MyInput
                      fieldType="select"
                      fieldName="departmentId"
                      fieldLabel={copy.department}
                      record={formRecord}
                      setRecord={handleRecordChange}
                      selectData={departmentOptions}
                      selectDataLabel="label"
                      selectDataValue="value"
                      searchable
                      required
                      disabled={!departmentFieldEnabled}
                      width="100%"
                    />
                    {selectedFacilityId != null && departmentsFetching ? (
                      <div className="patient-complaint-field-hint" role="status">
                        {copy.departmentsLoading}
                      </div>
                    ) : null}
                    {selectedFacilityId != null &&
                    !departmentsFetching &&
                    departmentsError ? (
                      <div className="patient-complaint-field-hint is-error" role="alert">
                        {copy.departmentsFailed}
                      </div>
                    ) : null}
                    {selectedFacilityId != null &&
                    !departmentsFetching &&
                    departmentsSuccess &&
                    departmentOptions.length === 0 ? (
                      <div className="patient-complaint-field-hint" role="status">
                        {copy.departmentsEmpty}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="patient-complaint-fields-row">
                  <div className="patient-complaint-field">
                    <MyInput
                      fieldType="select"
                      fieldName="feedbackType"
                      fieldLabel={copy.feedbackType}
                      record={formRecord}
                      setRecord={handleRecordChange}
                      selectData={feedbackTypeOptions}
                      selectDataLabel="label"
                      selectDataValue="value"
                      required
                      width="100%"
                    />
                  </div>
                  <div className="patient-complaint-field">
                    <MyInput
                      fieldType="select"
                      fieldName="complaintType"
                      fieldLabel={`${copy.complaintType} (${copy.optional})`}
                      record={formRecord}
                      setRecord={handleRecordChange}
                      selectData={complaintTypeOptions}
                      selectDataLabel="label"
                      selectDataValue="value"
                      width="100%"
                    />
                  </div>
                </div>

                <div className="patient-complaint-fields-row">
                  <div className="patient-complaint-field">
                    <MyInput
                      fieldType="date"
                      fieldName="incidentDate"
                      fieldLabel={copy.incidentDate}
                      record={formRecord}
                      setRecord={handleRecordChange}
                      required
                      width="100%"
                    />
                  </div>
                  <div
                    className="patient-complaint-field patient-complaint-time-field"
                    ref={timePickerContainerRef}
                  >
                    <MyInput
                      fieldType="time"
                      fieldName="incidentTime"
                      fieldLabel={copy.incidentTime}
                      record={formRecord}
                      setRecord={handleRecordChange}
                      required
                      disabled={isSubmitting}
                      width="100%"
                      // MyInput time defaults container→body + preventOverflow. On this long
                      // public page body is the scroll root, so a body-portaled absolute menu
                      // is shifted by preventOverflow and then drifts on scroll. Host the menu
                      // on this field (position:relative) and disable overflow shifting.
                      container={() =>
                        timePickerContainerRef.current ?? document.body
                      }
                      preventOverflow={false}
                    />
                  </div>
                </div>

                <div className="patient-complaint-field">
                  <MyInput
                    fieldType="text"
                    fieldName="involvedStaffNames"
                    fieldLabel={`${copy.involvedStaff} (${copy.optional})`}
                    record={formRecord}
                    setRecord={handleRecordChange}
                    width="100%"
                  />
                </div>

                <div className="patient-complaint-field">
                  <MyInput
                    fieldType="textarea"
                    fieldName="description"
                    fieldLabel={copy.description}
                    record={formRecord}
                    setRecord={handleRecordChange}
                    required
                    width="100%"
                    rows={6}
                    height={150}
                  />
                </div>

                <div className="patient-complaint-field">
                  <MyInput
                    fieldType="textarea"
                    fieldName="desiredResolution"
                    fieldLabel={`${copy.desiredResolution} (${copy.optional})`}
                    record={formRecord}
                    setRecord={handleRecordChange}
                    width="100%"
                    rows={4}
                    height={110}
                  />
                </div>

                <div className="patient-complaint-field">
                  <label className="patient-complaint-native-label">{copy.attachments}</label>
                  <p className="patient-complaint-field-hint">{copy.attachmentsHint}</p>
                  <input
                    type="file"
                    multiple
                    disabled={isSubmitting}
                    onChange={handleFilesChange}
                  />
                  {selectedFiles.length > 0 ? (
                    <div className="patient-complaint-file-list">
                      {selectedFiles.map(file => (
                        <div key={`${file.name}-${file.size}`}>{file.name}</div>
                      ))}
                      <MyButton
                        appearance="ghost"
                        size="xs"
                        disabled={isSubmitting}
                        onClick={() => setSelectedFiles([])}
                      >
                        {copy.clearFiles}
                      </MyButton>
                    </div>
                  ) : null}
                </div>
              </section>
            </Form>

            {facilitiesError ? (
              <div className="patient-complaint-form-error" role="alert">
                {copy.facilitiesFailed}
              </div>
            ) : null}

            {error ? (
              <div className="patient-complaint-form-error" role="alert">
                {copy.required}
              </div>
            ) : null}

            {submitError ? (
              <div className="patient-complaint-form-error" role="alert">
                {submitError}
              </div>
            ) : null}

            <div className="patient-complaint-form-footer">
              <MyButton appearance="ghost" onClick={handleClear} disabled={isSubmitting}>
                {copy.clear}
              </MyButton>

              <MyButton onClick={handleSubmit} disabled={isSubmitting || facilitiesLoading}>
                {isSubmitting ? copy.submitting : copy.submit}
              </MyButton>
            </div>
          </div>
        ) : (
          <div className="patient-complaint-form-card patient-complaint-confirmation">
            <div className="patient-complaint-confirmation-icon">✓</div>
            <h2>{copy.confirmationTitle}</h2>
            <p>{copy.confirmationMessage}</p>
            <div className="patient-complaint-reference">
              <span>{copy.referenceLabel}</span>
              <strong>{submittedReference}</strong>
            </div>
            <MyButton onClick={handleSubmitAnother}>{copy.submitAnother}</MyButton>
          </div>
        )}
      </main>

      <MyModal
        open={otpModalOpen}
        setOpen={open => {
          if (!open) {
            if (isOtpBusy) return;
            resetOtpVerificationState();
            return;
          }
          setOtpModalOpen(true);
        }}
        title={copy.otpTitle}
        size="xs"
        bodyheight="auto"
        hideBack
        actionButtonLabel={
          isVerifyingOtp || isLookingUpPatient ? copy.otpVerifying : copy.otpVerify
        }
        isDisabledActionBtn={isOtpBusy || !otpRecord.otp.trim()}
        actionButtonLoading={isVerifyingOtp || isLookingUpPatient}
        actionButtonFunction={handleOtpVerify}
        handleCancelFunction={() => {
          if (isOtpBusy) return;
          resetOtpVerificationState();
        }}
        footerButtons={
          <MyButton
            appearance="ghost"
            disabled={isOtpBusy || otpResendCooldownSeconds > 0}
            onClick={() => {
              void handleOtpResend();
            }}
          >
            {isRequestingOtp
              ? copy.otpResending
              : otpResendCooldownSeconds > 0
                ? `${copy.otpResend} (${otpResendCooldownSeconds}s)`
                : copy.otpResend}
          </MyButton>
        }
        content={
          <div className="patient-complaint-otp-modal">
            <p className="patient-complaint-field-hint">{copy.otpDescription}</p>
            <Form fluid>
              <MyInput
                fieldType="text"
                fieldName="otp"
                fieldLabel={copy.otpLabel}
                record={otpRecord}
                setRecord={setOtpRecord}
                required
                disabled={isOtpBusy}
                width="100%"
              />
            </Form>
          </div>
        }
      />
    </div>
  );
};

export default SubmitPatientComplaintPage;
