declare global {
  interface Window {
    APP_CONFIG?: {
      backendBaseURL?: string;
      tenantId?: string;
      tenantSecurityToken?: string;
    };
  }
}

const config = {
  backendBaseURL:
    window.APP_CONFIG?.backendBaseURL || 'http://asklepiosapi.nereuscloud.de',
  tenantId:
    window.APP_CONFIG?.tenantId || '1',
  tenantSecurityToken:
    window.APP_CONFIG?.tenantSecurityToken || '4994'
};

console.log('APP_CONFIG', window.APP_CONFIG);
console.log('CONFIG', config);

export default config;