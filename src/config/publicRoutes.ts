export const PUBLIC_AUTH_FREE_PATHS = [
  '/login',
  '/reset-password',
  '/create-password',
  '/create-patient-password',
  '/patient-satisfaction-survey'
] as const;

export const PUBLIC_PERMISSION_BYPASS_PATHS = new Set<string>([
  ...PUBLIC_AUTH_FREE_PATHS,
  '/error-403',
  '/error-404',
  '/error-500',
  '/error-503',
  '/error-department-type'
]);

const normalizePath = (pathname: string) => {
  const clean = (pathname ?? '').split('?')[0].replace(/\/+$/, '');
  return clean || '/';
};

export const isPublicAuthFreePath = (pathname: string) =>
  PUBLIC_AUTH_FREE_PATHS.includes(normalizePath(pathname) as (typeof PUBLIC_AUTH_FREE_PATHS)[number]);

export const isPublicHashRoute = () => {
  if (typeof window === 'undefined') return false;

  const hash = window.location.hash.replace(/^#/, '') || '/';
  const pathname = hash.split('?')[0];
  return isPublicAuthFreePath(pathname);
};
