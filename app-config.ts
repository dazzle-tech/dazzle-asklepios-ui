declare global {
  interface Window {
    APP_CONFIG?: {
      backendBaseURL?: string;
      tenantId?: string;
      tenantSecurityToken?: string;
      stimulsoftLicenseKey?: string;
      stimulsoftDashboardLicenseKey?: string;
      stimulsoftProxyUrl?: string;
      stimulsoftEncryptData?: boolean;
      liveVisitScribeUrl?: string;
      idleTimeoutMinutes?: number | string;
      idleWarningSeconds?: number | string;
    };
    Stimulsoft?: any;
  }
}

/**
 * config.js values may be numbers (local) or strings from envsubst in Docker,
 * where an unset env var becomes "". Empty / invalid -> default.
 */
const numberOrDefault = (value: number | string | undefined, fallback: number): number => {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const config = {
  backendBaseURL:
    window.APP_CONFIG?.backendBaseURL || 'http://asklepiosapi.nereuscloud.de',
  tenantId:
    window.APP_CONFIG?.tenantId || '1',
  tenantSecurityToken:
    window.APP_CONFIG?.tenantSecurityToken || '4994',
  stimulsoftLicenseKey: window.APP_CONFIG?.stimulsoftLicenseKey || '',
  stimulsoftDashboardLicenseKey:
    window.APP_CONFIG?.stimulsoftDashboardLicenseKey || '',
  /**
   * Same-origin SQL adapter URL. REST /api sources stay on the HIS proxy.
   * Webpack forwards /proxy to stimulsoft-data-adapter
   * (`npm run stimulsoft:adapter`).
   */
  stimulsoftProxyUrl: window.APP_CONFIG?.stimulsoftProxyUrl || '/proxy',
  stimulsoftEncryptData: window.APP_CONFIG?.stimulsoftEncryptData,
  liveVisitScribeUrl: window.APP_CONFIG?.liveVisitScribeUrl,
  /** Minutes without user activity before automatic logout (0 disables). */
  idleTimeoutMinutes: numberOrDefault(window.APP_CONFIG?.idleTimeoutMinutes, 10),
  /** Seconds before logout to show the "still there?" warning. */
  idleWarningSeconds: numberOrDefault(window.APP_CONFIG?.idleWarningSeconds, 60)
};

export default config;