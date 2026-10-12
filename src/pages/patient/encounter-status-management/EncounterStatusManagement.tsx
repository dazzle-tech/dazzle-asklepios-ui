import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import type { Patient } from '@/types/model-types-new';

import PatientSearch from './PatientSearch';
import PatientVisits from './PatientVisits';

import './styles.less';

const EncounterStatusManagement = () => {
  const dispatch = useAppDispatch();

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

  return (
    <div
      dir={dir}
      className="encounter-status-management"
    >
      <PatientSearch
        selectedPatientId={selectedPatient?.id}
        onSelectPatient={setSelectedPatient}
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