import { useGetSystemConfigQuery } from '@/services/systemConfigService';

export const useBranding = () => {
  const { data: systemConfig } = useGetSystemConfigQuery();

  return {
    title: systemConfig?.SYSTEM_TITLE,
    logo: systemConfig?.SYSTEM_LOGO,
    favicon: systemConfig?.FAVICON,
    loginBackground: systemConfig?.LOGIN_BACKGROUND,
    primaryColor: systemConfig?.PRIMARY_COLOR,
    fontFamily: systemConfig?.FONT_FAMILY
  };
};