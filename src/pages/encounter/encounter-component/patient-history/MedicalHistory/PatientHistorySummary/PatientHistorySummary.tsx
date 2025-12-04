import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import SectionContainer from '@/components/SectionsoContainer';

import { useGetClinicalSummaryQuery } from '@/services/encounterService';

const PatientHistorySummary = ({
  patient = undefined,
  encounter = undefined,
  edit = undefined,
  title = null,
  button = null
}) => {
  const patientKey = patient?.key || patient?.patientKey;
  const encounterKey = encounter?.key || encounter?.encounterKey;

  // Call RTK Query
  const { data, isLoading, error } = useGetClinicalSummaryQuery(
    {
      patientKey,
      encounterKey,
      lang: 'en'
    },
    {
      skip: !patientKey || !encounterKey
    }
  );

  // Extract summary output
  const summary = data?.object?.clinicalSummary;

  return (
    <div className="medical-container-div">
      <SectionContainer
        title={
          <div
            className="patient-history-title"
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <FontAwesomeIcon icon={faClipboardList} className="patient-history-icon" />
            <span>{title || 'Patient History Summary'} </span>
            {button && <div>{button}</div>}
          </div>
        }
        content={
          <div className="medical-table-div2">
            <div className="patient-history-card">
              <div className="patient-history-content">
                <div className="patient-history-text">
                  {/* ====================== Loading ====================== */}
                  {isLoading && <p>Loading patient summary...</p>}

                  {/* ====================== Error ====================== */}
                  {error && <p style={{ color: 'red' }}>Unable to load summary</p>}

                  {/* ====================== Summary Output ====================== */}
                  {!isLoading && !error && (
                    <>
                      {/* Clinical Summary */}
                      <p style={{ whiteSpace: 'pre-line' }}>{summary || 'No summary available'}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default PatientHistorySummary;
