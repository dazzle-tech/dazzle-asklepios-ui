import { createApi } from "@reduxjs/toolkit/query/react";
import { BaseQuery,onQueryStarted } from "@/newApi";

export enum SystemConfigKey {
  SYSTEM_TITLE = 'SYSTEM_TITLE',
  PRIMARY_COLOR = 'PRIMARY_COLOR',
  SECONDARY_COLOR = 'SECONDARY_COLOR',
  FONT_FAMILY = 'FONT_FAMILY',
  SYSTEM_LOGO = 'SYSTEM_LOGO',
  FAVICON = 'FAVICON',
  LOGIN_BACKGROUND = 'LOGIN_BACKGROUND',
  ENABLE_DARK_MODE = 'ENABLE_DARK_MODE',
  SIDEBAR_LOGO = 'SIDEBAR_LOGO',
  SIDEBAR_LOGO_DARK='SIDEBAR_LOGO_DARK'
}

export type SystemConfigMap = Partial<Record<SystemConfigKey, string>>;

export type SystemConfiguration = {
  id: number;
  configKey: SystemConfigKey;
  configValue: string | null;
  configType: 'STRING' | 'COLOR' | 'IMAGE' | 'BOOLEAN' | 'NUMBER';
  description?: string;
};

export const systemConfigService = createApi({
  reducerPath: 'systemConfigApi',
  baseQuery: BaseQuery,
    tagTypes: ['SystemConfig'],

  endpoints: builder => ({
    getSystemConfig: builder.query<SystemConfigMap, void>({
      query: () => ({
        url: 'api/setup/system-config',
        method: 'GET'
      }),
      providesTags: ['SystemConfig'],
    }),

    getSystemConfigDetails: builder.query<SystemConfiguration[], void>({
      query: () => ({
        url: 'api/setup/system-config/details',
        method: 'GET'
      }),
      providesTags: ['SystemConfig'],
      onQueryStarted
    }),

    updateSystemConfig: builder.mutation<SystemConfiguration[], SystemConfigMap>({
      query: body => ({
        url: 'api/setup/system-config',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['SystemConfig'],
      onQueryStarted
    }),

    updateSystemConfigValue: builder.mutation<
      SystemConfiguration,
      { key: SystemConfigKey; value: string | null }
    >({
      query: ({ key, value }) => ({
        url: `api/setup/system-config/${key}`,
        method: 'PUT',
        body: { value }
      }),
      invalidatesTags: ['SystemConfig'],
      onQueryStarted
    }),

    uploadSystemLogo: builder.mutation<SystemConfiguration, File>({
      query: file => {
        const formData = new FormData();
        formData.append('file', file);

        return {
          url: 'api/setup/system-config/logo',
          method: 'POST',
          body: formData
        };
      },
      invalidatesTags: ['SystemConfig'],
      onQueryStarted
    }),

    uploadFavicon: builder.mutation<SystemConfiguration, File>({
      query: file => {
        const formData = new FormData();
        formData.append('file', file);

        return {
          url: 'api/setup/system-config/favicon',
          method: 'POST',
          body: formData
        };
      },
      invalidatesTags: ['SystemConfig'],
      onQueryStarted
    }),
    uploadLoginBackground: builder.mutation<SystemConfiguration, File>({
  query: file => {
    const formData = new FormData();
    formData.append('file', file);

    return {
      url: 'api/setup/system-config/login-background',
      method: 'POST',
      body: formData
    };
  },
  invalidatesTags: ['SystemConfig'],
  onQueryStarted
}),
uploadSidebarLogo: builder.mutation({
  query: file => {
    const formData = new FormData();
    formData.append('file', file);

    return {
      url: '/api/setup/system-config/sidebar-logo',
      method: 'POST',
      body: formData
    };
  }
}),
uploadSidebarLogoDark: builder.mutation({
  query: file => {
    const formData = new FormData();
    formData.append('file', file);

    return {
      url: '/api/setup/system-config/sidebar-logo-dark',
      method: 'POST',
      body: formData
    };
  }
})
  })
});

export const {
  useGetSystemConfigQuery,
  useGetSystemConfigDetailsQuery,
  useUpdateSystemConfigMutation,
  useUpdateSystemConfigValueMutation,
  useUploadSystemLogoMutation,
  useUploadFaviconMutation,
  useUploadLoginBackgroundMutation,
  useUploadSidebarLogoMutation,
  useUploadSidebarLogoDarkMutation
} = systemConfigService;