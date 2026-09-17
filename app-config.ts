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
   * Same-origin path in webpack dev. JSON REST sources use /api via the
   * webpack proxy; keep this empty unless you use Stimulsoft SQL adapter.
   */
  stimulsoftProxyUrl: window.APP_CONFIG?.stimulsoftProxyUrl || '',
  stimulsoftEncryptData: window.APP_CONFIG?.stimulsoftEncryptData,
};

export default config;