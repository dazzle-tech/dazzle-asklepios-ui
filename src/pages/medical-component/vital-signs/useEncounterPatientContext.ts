import { useLocation, useOutletContext } from 'react-router-dom';

type EncounterOutletContext = { patient?: any; encounter?: any };

/**
 * The current patient/encounter of an encounter screen, from the same sources other encounter components
 * use: router state first, then the Encounter screen's outlet context. Read live on every render, so
 * switching patients is reflected immediately. No context → undefined ids (the form then shows no
 * age-based styling).
 */
export const useEncounterPatientContext = () => {
  const location = useLocation();
  const outlet = useOutletContext<EncounterOutletContext | undefined>();
  const state = (location.state ?? {}) as EncounterOutletContext;

  const patient = state.patient ?? outlet?.patient;
  const encounter = state.encounter ?? outlet?.encounter;
  const patientId = Number(patient?.id);
  const encounterId = Number(encounter?.id);

  return {
    patient,
    encounter,
    patientId: Number.isFinite(patientId) && patientId > 0 ? patientId : undefined,
    encounterId: Number.isFinite(encounterId) && encounterId > 0 ? encounterId : undefined
  };
};
