import { BaseQuery } from '@/newApi';
import { createApi } from '@reduxjs/toolkit/dist/query/react';
import {
  AlertRules,
  EntryLimits,
  IndicatorId,
  Scope,
  SelectionRules,
  SetupState,
  StatusBand,
  ChartSet,
  alertedOf
} from '@/pages/setup/child-growth-setup/model';

export type ChildGrowthUserOption = {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  login?: string | null;
};

export type ChildGrowthSetupResponse = SetupState & {
  id: number | null;
  scope: Scope;
  facilityId: number | null;
  userIds: number[] | null;
  saved: boolean;
};

export type ChildGrowthSetupQuery = {
  scope: Scope;
  facilityId?: number;
  userIds?: number[];
};

const numberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const chartsPayload = (charts: ChartSet[]) =>
  charts.map(chart => ({
    ...chart,
    ageFrom: numberOrNull(chart.ageFrom),
    ageTo: numberOrNull(chart.ageTo)
  }));

const bandsPayload = (bands: Record<IndicatorId, StatusBand[]>) => {
  const payload: Record<string, StatusBand[]> = {};
  (Object.keys(bands) as IndicatorId[]).forEach(indicator => {
    payload[indicator] = bands[indicator].map(band => {
      const { alert: _legacy, ...rest } = band as StatusBand & { alert?: unknown };
      return {
        ...rest,
        min: numberOrNull(band.min),
        max: numberOrNull(band.max),
        alerted: alertedOf(band)
      };
    });
  });
  return payload;
};

const limitsPayload = (limits: EntryLimits): EntryLimits => ({
  weightMinKg: numberOrNull(limits.weightMinKg),
  weightMaxKg: numberOrNull(limits.weightMaxKg),
  lengthMinCm: numberOrNull(limits.lengthMinCm),
  lengthMaxCm: numberOrNull(limits.lengthMaxCm),
  headMinCm: numberOrNull(limits.headMinCm),
  headMaxCm: numberOrNull(limits.headMaxCm)
});

const alertsPayload = (alerts: AlertRules): AlertRules => ({
  consecutiveVisits: numberOrNull(alerts.consecutiveVisits),
  channelsCrossed: numberOrNull(alerts.channelsCrossed)
});

export const toChildGrowthSetupBody = (
  scope: Scope,
  facilityId: number | undefined,
  userIds: number[] | undefined,
  setup: SetupState
) => ({
  scope,
  facilityId: facilityId ?? null,
  userIds: userIds ?? [],
  charts: chartsPayload(setup.charts),
  rules: {
    ...setup.rules,
    correctedAgeUntilMonths: numberOrNull(setup.rules.correctedAgeUntilMonths)
  } as SelectionRules,
  bandsByIndicator: bandsPayload(setup.bandsByIndicator),
  limits: limitsPayload(setup.limits),
  alerts: alertsPayload(setup.alerts)
});

export const childGrowthSetupService = createApi({
  reducerPath: 'childGrowthSetupApi',
  baseQuery: BaseQuery,
  tagTypes: ['ChildGrowthSetup'],
  endpoints: builder => ({
    getActiveChildGrowthUsers: builder.query<ChildGrowthUserOption[], number>({
      query: facilityId => ({
        url: '/api/setup/child-growth-setup/users',
        method: 'GET',
        params: { facilityId }
      })
    }),
    getChildGrowthSetup: builder.query<ChildGrowthSetupResponse, ChildGrowthSetupQuery>({
      query: ({ scope, facilityId, userIds }) => {
        const params = new URLSearchParams();
        params.set('scope', scope);
        if (facilityId != null) params.set('facilityId', String(facilityId));
        (userIds ?? []).forEach(id => params.append('userIds', String(id)));
        return {
          url: `/api/setup/child-growth-setup?${params.toString()}`,
          method: 'GET'
        };
      },
      providesTags: ['ChildGrowthSetup']
    }),
    saveChildGrowthSetup: builder.mutation<ChildGrowthSetupResponse, ReturnType<typeof toChildGrowthSetupBody>>({
      query: body => ({
        url: '/api/setup/child-growth-setup',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['ChildGrowthSetup']
    })
  })
});

export const {
  useGetActiveChildGrowthUsersQuery,
  useGetChildGrowthSetupQuery,
  useSaveChildGrowthSetupMutation
} = childGrowthSetupService;
