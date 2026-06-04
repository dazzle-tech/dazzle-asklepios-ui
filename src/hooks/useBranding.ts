import { useMemo } from 'react';
import { useGetSystemConfigQuery } from '@/services/systemConfigService';

const getCachedSystemConfig = () => {
  try {
    return JSON.parse(localStorage.getItem('systemConfig') || '{}');
  } catch {
    return {};
  }
};

export const useBranding = () => {
  const { data: systemConfig } = useGetSystemConfigQuery();

  const cachedConfig = useMemo(() => getCachedSystemConfig(), []);
  const activeConfig = systemConfig || cachedConfig;

  return {
    title: activeConfig?.SYSTEM_TITLE,
    logo: activeConfig?.SYSTEM_LOGO,
    favicon: activeConfig?.FAVICON,
    loginBackground: activeConfig?.LOGIN_BACKGROUND,
    primaryColor: activeConfig?.PRIMARY_COLOR,
    fontFamily: activeConfig?.FONT_FAMILY,
    sidebarLogo: activeConfig?.SIDEBAR_LOGO
  };
};