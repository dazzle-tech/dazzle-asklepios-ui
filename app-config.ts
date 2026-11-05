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
      idleTimeoutMinutes?: number;
      idleWarningSeconds?: number;
    };
    Stimulsoft?: any;
  }
}

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
  idleTimeoutMinutes: window.APP_CONFIG?.idleTimeoutMinutes ?? 10,
  /** Seconds before logout to show the "still there?" warning. */
  idleWarningSeconds: window.APP_CONFIG?.idleWarningSeconds ?? 60
};

export default config;