window.APP_CONFIG = {
  backendBaseURL: "${BACKEND_BASE_URL}",
  tenantId: "${TENANT_ID}",
  tenantSecurityToken: "${TENANT_SECURITY_TOKEN}",
  stimulsoftLicenseKey: "${STIMULSOFT_LICENSE_KEY}",
  stimulsoftDashboardLicenseKey: "${STIMULSOFT_DASHBOARD_LICENSE_KEY}",
  // Empty when the env var is unset -> app-config falls back to the default.
  idleTimeoutMinutes: "${IDLE_TIMEOUT_MINUTES}",
  idleWarningSeconds: "${IDLE_WARNING_SECONDS}"
};