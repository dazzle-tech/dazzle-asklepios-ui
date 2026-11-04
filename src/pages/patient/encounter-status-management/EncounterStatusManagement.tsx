import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import type { Patient } from '@/types/model-types-new';

import PatientSearch from './PatientSearch';
import PatientVisits, { PENDING_ENCOUNTER_OPEN_KEY } from './PatientVisits';

import './styles.less';

const EncounterStatusManagement = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const selectedDepartment = useAppSelector(state => state.auth.selectedDepartment);

  const dir = (
    localStorage.getItem('direction') || 'ltr'
  ).toLowerCase();

  const [selectedPatient, setSelectedPatient] =
    useState<Patient | null>(null);

  useEffect(() => {
    dispatch(
      setPageCode('ENCOUNTER_STATUS_MANAGEMENT')
    );

    dispatch(
      setDivContent('Encounter Status Management')
    );

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_ENCOUNTER_OPEN_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PENDING_ENCOUNTER_OPEN_KEY);

    let pending: {
      departmentId?: string | number | null;
      facilityId?: string | number | null;
      state?: Record<string, unknown>;
    };
    try {
      pending = JSON.parse(raw);
    } catch {
      return;
    }

    const departmentApplied =
      String(selectedDepartment?.departmentId ?? '') === String(pending.departmentId ?? '') &&
      String(selectedDepartment?.facilityId ?? '') === String(pending.facilityId ?? '');

    if (!departmentApplied || pending.state == null) {
      dispatch(
        notify({
          msg: 'The department could not be switched. The encounter was not opened.',
          sev: 'warning'
        })
      );
      return;
    }

    navigate('/encounter', { state: pending.state });
  }, [dispatch, navigate, selectedDepartment?.departmentId, selectedDepartment?.facilityId]);

  return (
    <div
      dir={dir}
      className="encounter-status-management"
    >
      <PatientSearch
        selectedPatientId={selectedPatient?.id}
        onSelectPatient={setSelectedPatient}
        onClear={() => setSelectedPatient(null)}
      />

      {selectedPatient?.id != null ? (
        <div className="encounter-status-management-visits">
          <PatientVisits
            key={selectedPatient.id}
            patient={selectedPatient}
          />
        </div>
      ) : (
        <div className="encounter-status-management-empty">
          <div className="empty-icon">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
            />
          </div>

          <strong>
            <Translate>
              No Patient Selected
            </Translate>
          </strong>

          <span>
            <Translate>
              Search and select a patient to view their visits.
            </Translate>
          </span>
        </div>
      )}
    </div>
  );
};

export default EncounterStatusManagement;