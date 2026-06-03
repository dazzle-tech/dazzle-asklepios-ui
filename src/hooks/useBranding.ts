import { useGetSystemConfigQuery } from '@/services/systemConfigService';

export const useBranding = () => {
  const { data } = useGetSystemConfigQuery();

  return {
    title: data?.SYSTEM_TITLE,
    logo: data?.SYSTEM_LOGO,
    favicon: data?.FAVICON,
    primaryColor: data?.PRIMARY_COLOR,
    fontFamily: data?.FONT_FAMILY
  };
};