import React from 'react';

import SectionContainer from '@/components/SectionsoContainer';

import ClaimEncounterCopySocialHistory from './ClaimEncounterCopySocialHistory';
import ClaimEncounterCopySurgicalHistoryTable from './ClaimEncounterCopySurgicalHistory';
import ClaimEncounterCopyPatientProblemsTable from './ClaimEncounterCopyPatientProblems';
import ClaimEncounterCopyFamilyHistoryTable from './ClaimEncounterCopyFamilyHistoryTable';
import ClaimEncounterCopyHospitalizations from './ClaimEncounterCopyHospitalizations';
import ClaimEncounterCopyCurrentMedicationTable from './ClaimEncounterCopyCurrentMedicationTable';

const PatientHistory = ({ claimEncounterCopyId }) => {
    if (!claimEncounterCopyId) {
        return null;
    }

    return (
        <div className="patient-history-container-claim">
            <SectionContainer
                title="Social History"
                content={
                    <ClaimEncounterCopySocialHistory
                        claimEncounterCopyId={claimEncounterCopyId}
                    />
                }
            />

            <SectionContainer
                title="Surgical History"
                content={
                    <ClaimEncounterCopySurgicalHistoryTable
                        claimEncounterCopyId={claimEncounterCopyId}
                    />
                }
            />
            <SectionContainer
                title="Patient Problems"
                content={
                    <ClaimEncounterCopyPatientProblemsTable
                        claimEncounterCopyId={claimEncounterCopyId}
                    />
                }
            />
             <SectionContainer
                title="Family History"
                content={
                    <ClaimEncounterCopyFamilyHistoryTable
                        claimEncounterCopyId={claimEncounterCopyId}
                    />
                }
            />
            <SectionContainer
                title="Hospitalizations"
                content={
                    <ClaimEncounterCopyHospitalizations
                        claimEncounterCopyId={claimEncounterCopyId}
                    />
                }
            />
            <SectionContainer
                title="Current Medications"
                content={
                    <ClaimEncounterCopyCurrentMedicationTable
                        claimEncounterCopyId={claimEncounterCopyId}
                    />
                }
            />
            
        </div>
    );
};

export default PatientHistory;