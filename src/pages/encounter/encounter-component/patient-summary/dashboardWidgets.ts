export const DASHBOARD_WIDGET_KEYS = [
  'c2',
  'c3',
  'c4',
  'c5',
  'c7',
  'c8',
  'c9',
  'c11',
  'c12',
  'c13',
  'c14'
] as const;

export type DashboardWidgetKey = (typeof DASHBOARD_WIDGET_KEYS)[number];

export const isDashboardWidgetKey = (key: string): key is DashboardWidgetKey =>
  (DASHBOARD_WIDGET_KEYS as readonly string[]).includes(key);
