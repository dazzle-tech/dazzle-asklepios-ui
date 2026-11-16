import {
  systemConfigurationService,
  useResolveConfigurationQuery
} from '@/services/setup/systemConfiguration/systemConfigurationService';
import { store } from '@/store';

export type ResolvedConfiguration = {
  key: string;
  value: string;
  valueType?: string;
  scope?: string | null;
  configurationId?: number | null;
};

export type GetConfigArgs = {
  key: string;
  userId?: number | null;
  facilityId?: number | null;
  skip?: boolean;
};

const toQueryArgs = (key: string, userId?: number | null, facilityId?: number | null) => ({
  key,
  ...(userId ? { userId } : {}),
  ...(facilityId ? { facilityId } : {})
});

/** True when a BOOLEAN configuration value is on. Missing or unrecognized values are off. */
export const isConfigEnabled = (value: unknown): boolean => {
  if (value === true) return true;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return false;
};

/**
 * Resolve one configuration: user, then facility, then organization.
 * Returns null when no stored row matches.
 */
export async function getConfig(
  key: string,
  userId?: number | null,
  facilityId?: number | null
): Promise<ResolvedConfiguration | null> {
  const request = store.dispatch(
    systemConfigurationService.endpoints.resolveConfiguration.initiate(toQueryArgs(key, userId, facilityId))
  );

  try {
    return await request.unwrap();
  } catch (error: any) {
    if (error?.status === 404) return null;
    throw error;
  } finally {
    request.unsubscribe();
  }
}

/** React wrapper around {@link getConfig}. `enabled` is false while loading or when no row matches. */
export function useGetConfig({ key, userId, facilityId, skip }: GetConfigArgs) {
  const query = useResolveConfigurationQuery(toQueryArgs(key, userId, facilityId), {
    skip: Boolean(skip) || !key
  });

  return {
    config: query.data ?? null,
    enabled: query.isSuccess && isConfigEnabled(query.data?.value),
    isLoading: query.isLoading || query.isFetching,
    isMissing: query.isError && (query.error as { status?: number })?.status === 404
  };
}
