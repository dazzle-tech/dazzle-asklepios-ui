import React, { useMemo } from 'react';
import {
  MdOutlineCalendarMonth,
  MdOutlineChat,
  MdOutlineEmail,
  MdOutlineFolderOpen,
  MdOutlineMedication,
  MdOutlinePhone,
  MdOutlineScience,
  MdOutlineAssignment,
  MdOutlineNotificationsActive,
  MdOutlinePersonOutline
} from 'react-icons/md';
import { FaFileInvoiceDollar, FaNotesMedical, FaStethoscope } from 'react-icons/fa';
import { formatEnumString } from '@/utils';
import {
  useGetActivityCategoriesQuery,
  useGetActivityPlansQuery,
  useGetActivityTemplatesQuery
} from '@/services/patients/patientActivityService';
import type { ActivityCategory, ActivityTemplate } from '@/types/model-types-new';

/** Icons a category can pick in the setup; the key is what the backend stores. */
export const ACTIVITY_ICONS: Record<string, React.ComponentType> = {
  calendar: MdOutlineCalendarMonth,
  stethoscope: FaStethoscope,
  flask: MdOutlineScience,
  'file-invoice': FaFileInvoiceDollar,
  phone: MdOutlinePhone,
  folder: MdOutlineFolderOpen,
  chat: MdOutlineChat,
  mail: MdOutlineEmail,
  pills: MdOutlineMedication,
  clipboard: MdOutlineAssignment,
  bell: MdOutlineNotificationsActive,
  person: MdOutlinePersonOutline,
  notes: FaNotesMedical
};

export const ACTIVITY_ICON_OPTIONS = Object.keys(ACTIVITY_ICONS).map(key => ({
  value: key,
  label: formatEnumString(key.replace('-', '_'))
}));

export const DEFAULT_CATEGORY_COLOR = '#3b82f6';

export const ActivityIcon = ({ icon }: { icon?: string | null }) => {
  const Icon = (icon && ACTIVITY_ICONS[icon]) || FaNotesMedical;
  return <Icon />;
};

/** Categories and templates by code, so rows that only carry codes can show names and icons. */
export const useActivityCatalog = () => {
  const { data: categories = [], isFetching: loadingCategories } = useGetActivityCategoriesQuery();
  const { data: templates = [], isFetching: loadingTemplates } = useGetActivityTemplatesQuery();
  const { data: plans = [] } = useGetActivityPlansQuery();

  return useMemo(() => {
    const categoryByCode = new Map<string, ActivityCategory>(categories.map(c => [c.code, c]));
    const templateByCode = new Map<string, ActivityTemplate>(templates.map(t => [t.code, t]));
    const planNameByCode = new Map<string, string>(plans.map(p => [p.code, p.name]));
    return {
      planName: (code?: string | null) => (code && planNameByCode.get(code)) || formatEnumString(code ?? ''),
      categories,
      templates,
      categoryByCode,
      templateByCode,
      loading: loadingCategories || loadingTemplates,
      categoryName: (code?: string | null) =>
        (code && categoryByCode.get(code)?.name) || formatEnumString(code ?? ''),
      templateName: (code?: string | null) =>
        (code && templateByCode.get(code)?.name) || formatEnumString(code ?? '')
    };
  }, [categories, templates, plans, loadingCategories, loadingTemplates]);
};

/** "2 days", "4 hours" — the template due rule as a phrase, or an empty string. */
export const describeDueRule = (template?: Pick<ActivityTemplate, 'dueOffset' | 'dueUnit'> | null) => {
  if (template?.dueOffset == null || !template?.dueUnit) return '';
  const unit = template.dueUnit === 'HOURS' ? 'hour' : 'day';
  return `${template.dueOffset} ${unit}${template.dueOffset === 1 ? '' : 's'}`;
};

/** Due time from the template rule, as an ISO string, counted from now. */
export const dueFromRule = (template?: Pick<ActivityTemplate, 'dueOffset' | 'dueUnit'> | null): string => {
  if (template?.dueOffset == null || !template?.dueUnit) return '';
  const hours = template.dueUnit === 'HOURS' ? template.dueOffset : template.dueOffset * 24;
  return new Date(Date.now() + hours * 3600 * 1000).toISOString();
};
