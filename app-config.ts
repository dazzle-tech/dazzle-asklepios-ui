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
   * Same-origin SQL adapter URL. REST /api sources stay on the HIS proxy.
   * Webpack forwards /proxy to stimulsoft-data-adapter
   * (`npm run stimulsoft:adapter`).
   */
  stimulsoftProxyUrl: window.APP_CONFIG?.stimulsoftProxyUrl || '/proxy',
  stimulsoftEncryptData: window.APP_CONFIG?.stimulsoftEncryptData,
};

export default config;