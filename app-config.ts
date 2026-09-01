declare global {
  interface Window {
    APP_CONFIG?: {
      backendBaseURL?: string;
      tenantId?: string;
      tenantSecurityToken?: string;
      stimulsoftLicenseKey?: string;
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
  /**
   * Same-origin path in webpack dev. JSON REST sources use /api via the
   * webpack proxy; keep this empty unless you use Stimulsoft SQL adapter.
   */
  stimulsoftProxyUrl: window.APP_CONFIG?.stimulsoftProxyUrl || '',
  stimulsoftEncryptData: window.APP_CONFIG?.stimulsoftEncryptData,
};

console.log('APP_CONFIG', window.APP_CONFIG);
console.log('CONFIG', config);

export default config;