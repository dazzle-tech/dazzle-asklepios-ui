import { useMemo } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { useGetAmendmentsQuery } from '@/services/encounters/patientEncounterService';

type EncounterShellContext = {
  isAmendmentOpen?: boolean;
};

/**
 * Loads amendment sessions once for an encounter shell.
 * An OPEN session is Amendment Mode. A normal visit and old Reopen have none.
 */
export function useOpenAmendmentSession(encounterId?: number | null): boolean {
  const { data: amendments } = useGetAmendmentsQuery(encounterId as number, {
    skip: encounterId == null
  });

  return useMemo(
    () =>
      (amendments ?? []).some(
        session => String(session?.status ?? '').toUpperCase() === 'OPEN'
      ),
    [amendments]
  );
}

/**
 * Amendment mode is an OPEN admin amendment session, fetched once by the encounter shell.
 * Child sheets read it from outlet context, with navigation state as a fallback.
 * The old encounter Reopen action does not open an amendment session.
 */
export function useIsAmendmentOpen(): boolean {
  const outletContext = useOutletContext<EncounterShellContext | null>();
  const location = useLocation();
  const fromNavigation = Boolean(
    (location.state as { isAmendmentOpen?: boolean } | null)?.isAmendmentOpen
  );

  return Boolean(outletContext?.isAmendmentOpen || fromNavigation);
}
