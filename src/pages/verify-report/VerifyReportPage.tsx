import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader } from 'rsuite';
import Logo from '@/images/Logo_BLUE_New1.svg';
import { useBranding } from '@/hooks/useBranding';
import config from '../../../app-config';
import './styles.less';

type Verification = {
  valid: boolean;
  documentNumber?: string;
  facilityName?: string;
  procedureName?: string;
  statusCode?: string;
  patientInitials?: string;
  maskedMrn?: string;
  performedAt?: string;
  issuedAt?: string;
};

type Lang = 'en' | 'ar';

const TEXT: Record<Lang, Record<string, string>> = {
  en: {
    title: 'Report Verification',
    checking: 'Checking the report…',
    valid: 'Genuine report',
    validHint: 'This procedure report was issued by the system.',
    stepsTitle: 'To confirm the paper copy is genuine:',
    step1: 'Check the document number matches the one printed next to the QR code.',
    step2: 'Check the procedure, patient initials and dates match the paper.',
    step3: 'If anything differs, the paper may have been altered. Contact the facility.',
    invalid: 'Could not verify this report',
    invalidHint:
      'The code is not valid or the report was not issued by this system. Contact the facility that issued it.',
    error: 'The verification service is unavailable. Please try again later.',
    document: 'Document',
    facility: 'Facility',
    procedure: 'Procedure',
    patient: 'Patient',
    mrn: 'MRN',
    performedAt: 'Performed',
    issuedAt: 'Report printed',
    status: 'Current status',
    cancelledNote: 'This procedure has been cancelled since the report was printed.',
    privacy: 'Only limited details are shown to protect patient privacy.',
    switchLang: 'العربية'
  },
  ar: {
    title: 'التحقق من التقرير',
    checking: 'جارٍ التحقق من التقرير…',
    valid: 'تقرير أصلي',
    validHint: 'هذا التقرير صادر من النظام.',
    stepsTitle: 'للتأكد أن النسخة الورقية أصلية:',
    step1: 'تأكد أن رقم المستند يطابق الرقم المطبوع بجانب رمز QR.',
    step2: 'تأكد أن الإجراء والأحرف الأولى لاسم المريض والتواريخ تطابق الورقة.',
    step3: 'إذا اختلف أي شيء فقد تكون الورقة معدّلة، تواصل مع المنشأة.',
    invalid: 'تعذّر التحقق من هذا التقرير',
    invalidHint: 'الرمز غير صالح أو أن التقرير ليس صادرًا من هذا النظام. تواصل مع المنشأة التي أصدرته.',
    error: 'خدمة التحقق غير متاحة حاليًا. حاول لاحقًا.',
    document: 'رقم المستند',
    facility: 'المنشأة',
    procedure: 'الإجراء',
    patient: 'المريض',
    mrn: 'رقم الملف',
    performedAt: 'تاريخ التنفيذ',
    issuedAt: 'تاريخ طباعة التقرير',
    status: 'الحالة الحالية',
    cancelledNote: 'تم إلغاء هذا الإجراء بعد طباعة التقرير.',
    privacy: 'تُعرض بيانات محدودة فقط حفاظًا على خصوصية المريض.',
    switchLang: 'English'
  }
};

const STATUS: Record<Lang, Record<string, string>> = {
  en: {
    REQUESTED: 'Requested',
    STARTED: 'Started',
    CANCELLED: 'Cancelled',
    COMPLETED: 'Completed',
    AWAITING_CONSENT: 'Awaiting Consent',
    IN_PROGRESS: 'In Progress',
    SUBMITTED: 'Submitted',
    WAITING_PRE_AUTHORIZATION: 'Waiting Pre-Authorization',
    RETURNED_TO_BED: 'Returned To Bed'
  },
  ar: {
    REQUESTED: 'مطلوب',
    STARTED: 'بدأ',
    CANCELLED: 'ملغى',
    COMPLETED: 'مكتمل',
    AWAITING_CONSENT: 'بانتظار الموافقة',
    IN_PROGRESS: 'قيد التنفيذ',
    SUBMITTED: 'مُرسل',
    WAITING_PRE_AUTHORIZATION: 'بانتظار الموافقة المسبقة',
    RETURNED_TO_BED: 'أُعيد إلى السرير'
  }
};

const formatDate = (value: string | undefined, lang: Lang) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
};

/**
 * Public page opened by the QR code on procedure reports. Needs no login; the backend only
 * returns limited details for a correctly signed token.
 */
const VerifyReportPage = () => {
  const [params] = useSearchParams();
  const token = params.get('t') ?? '';
  const branding = useBranding();
  const [lang, setLang] = useState<Lang>(
    (navigator.language || '').toLowerCase().startsWith('ar') ? 'ar' : 'en'
  );
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  const [result, setResult] = useState<Verification | null>(null);

  useEffect(() => {
    if (!token) {
      setResult({ valid: false });
      setState('done');
      return;
    }
    const base = config.backendBaseURL || 'http://localhost:8080';
    const controller = new AbortController();
    fetch(`${base}/api/analytics/public/procedure-report/verify?t=${encodeURIComponent(token)}`, {
      signal: controller.signal,
      cache: 'no-store'
    })
      .then(res => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data: Verification) => {
        setResult(data);
        setState('done');
      })
      .catch(err => {
        if (err?.name !== 'AbortError') setState('error');
      });
    return () => controller.abort();
  }, [token]);

  const t = TEXT[lang];
  const valid = state === 'done' && result?.valid;
  const statusLabel = result?.statusCode
    ? STATUS[lang][result.statusCode] ?? result.statusCode
    : '—';

  return (
    <div className="verify-report-page" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="verify-report-card">
        <header className="verify-report-header">
          <img src={branding.logo || Logo} alt="" className="verify-report-logo" />
          <button
            type="button"
            className="verify-report-lang"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          >
            {t.switchLang}
          </button>
        </header>
        <h1 className="verify-report-title">{t.title}</h1>

        {state === 'loading' && (
          <div className="verify-report-loading">
            <Loader size="md" />
            <span>{t.checking}</span>
          </div>
        )}

        {state === 'error' && <div className="verify-report-result is-error">{t.error}</div>}

        {state === 'done' && (
          <div className={`verify-report-result ${valid ? 'is-valid' : 'is-invalid'}`}>
            <span className="verify-report-badge" aria-hidden>
              {valid ? '✓' : '!'}
            </span>
            <div>
              <strong>{valid ? t.valid : t.invalid}</strong>
              <p>{valid ? t.validHint : t.invalidHint}</p>
              {valid && (
                <>
                  <p className="verify-report-steps-title">{t.stepsTitle}</p>
                  <ol className="verify-report-steps">
                    <li>{t.step1}</li>
                    <li>{t.step2}</li>
                    <li>{t.step3}</li>
                  </ol>
                </>
              )}
            </div>
          </div>
        )}

        {valid && result && (
          <>
            {result.statusCode === 'CANCELLED' && (
              <div className="verify-report-warning">{t.cancelledNote}</div>
            )}
            <dl className="verify-report-details">
              <dt>{t.document}</dt>
              <dd dir="ltr">{result.documentNumber}</dd>
              <dt>{t.facility}</dt>
              <dd>{result.facilityName || '—'}</dd>
              <dt>{t.procedure}</dt>
              <dd>{result.procedureName || '—'}</dd>
              <dt>{t.patient}</dt>
              <dd dir="ltr">{result.patientInitials || '—'}</dd>
              <dt>{t.mrn}</dt>
              <dd dir="ltr">{result.maskedMrn || '—'}</dd>
              <dt>{t.performedAt}</dt>
              <dd>{formatDate(result.performedAt, lang)}</dd>
              <dt>{t.issuedAt}</dt>
              <dd>{formatDate(result.issuedAt, lang)}</dd>
              <dt>{t.status}</dt>
              <dd>
                <span className={`verify-report-status status-${result.statusCode?.toLowerCase()}`}>
                  {statusLabel}
                </span>
              </dd>
            </dl>
            <p className="verify-report-privacy">{t.privacy}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyReportPage;
