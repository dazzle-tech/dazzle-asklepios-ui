import { ClinicalRecommendation } from '@/services/ai-services/clinicalRecommendationsService';

export type Phase = 'idle' | 'loading' | 'success' | 'empty' | 'error';
export type Bucket = 'critical' | 'high' | 'moderate' | 'low' | 'routine';
export type Filter = 'all' | Bucket;

export const PRIORITY_ORDER: Bucket[] = ['critical', 'high', 'moderate', 'low', 'routine'];

export const PRIORITY_LABELS: Record<Bucket, string> = {
  critical: 'Critical',
  high: 'High',
  moderate: 'Moderate',
  low: 'Low',
  routine: 'Routine'
};

export const PRIORITY_ICONS: Record<Bucket, string> = {
  critical: '◆',
  high: '▲',
  moderate: '●',
  low: '▼',
  routine: '○'
};

export const DEFAULT_FOCUS_AREAS = ['medication optimization', 'diagnostic workup'];

export const LOADING_STEPS = [
  'Reading visit details',
  'Reviewing vitals',
  'Checking patient history',
  'Preparing recommendations'
];
export const STEP_GAP_MS = 1600;

const CATEGORY_LABELS: Record<string, string> = {
  medication: 'Medication',
  diagnostic: 'Diagnostic',
  treatment: 'Treatment',
  monitoring: 'Monitoring',
  lifestyle: 'Lifestyle',
  referral: 'Referral'
};

// The AI sends one of the five levels; anything else counts as moderate
export const toBucket = (priority?: string): Bucket => {
  const p = String(priority ?? '').toLowerCase();
  if (p === 'urgent') return 'critical';
  return (PRIORITY_ORDER as string[]).includes(p) ? (p as Bucket) : 'moderate';
};

export const categoryLabel = (type?: string) => {
  const key = String(type ?? '').toLowerCase();
  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key];
  return key ? key.charAt(0).toUpperCase() + key.slice(1) : 'General';
};

export const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const errorDetails = (error: any): string => {
  const detail = error?.data?.detail;
  if (Array.isArray(detail)) {
    const first = detail[0];
    const loc = Array.isArray(first?.loc) ? first.loc.join('.') : '';
    return `${loc}: ${first?.msg}`;
  }
  if (typeof detail === 'string') return detail;
  const message = error?.data?.message ?? error?.error ?? error?.message;
  return [error?.status, message].filter(Boolean).join(' - ');
};

// Same sections as the expanded row, so the copy matches the printout
export const buildCopyText = (summary: string | undefined, list: ClinicalRecommendation[]) => {
  const lines = ['Summary:', summary ?? '', ''];
  list.forEach(r => {
    lines.push(`[${PRIORITY_LABELS[toBucket(r.priority)]}] ${categoryLabel(r.type)} - ${r.title}`);
    if (r.description) lines.push(r.description);
    if (r.rationale) lines.push('Why this is suggested:', r.rationale);
    if (r.actionable_steps?.length) {
      lines.push('Suggested actions:', ...r.actionable_steps.map(s => `- ${s}`));
    }
    if (r.contraindications?.length) {
      lines.push('Cautions:', ...r.contraindications.map(c => `- ${c}`));
    }
    if (r.monitoring_requirements) lines.push('Monitoring:', r.monitoring_requirements);
    if (r.follow_up) lines.push('Follow-up:', r.follow_up);
    lines.push('');
  });
  return lines.join('\n').trim();
};

// The browser uses document.title as the default PDF file name
export const printFileName = (firstName?: string, lastName?: string) => {
  const name = [firstName, lastName]
    .filter(Boolean)
    .join(' ')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim();
  return name ? `AiRecommendations-${name}` : 'AiRecommendations';
};
