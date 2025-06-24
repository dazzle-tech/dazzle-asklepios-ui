import React from 'react';
import './styles.less';
import PatientMajorProblemTable from './PatientMajorProblem';
import PatientChronicMedicationTable from './PatientChronicMedication/PatientChronicMedication';
import ActiveAllergies from './ActiveAllergies/ActiveAllergies';
import MedicalWarnings from './MedicalWarnings/MedicalWarnings';
import RecentTestResults from './RecentTestResults/RecentTestResults';
import PreviuosVisitData from './PreviuosVisitData';
import BodyDiagram from './BodyDiagram/BodyDiagram';
import { useLocation } from 'react-router-dom';
import PreObservation from './PreObservation/PreObservation';
import Procedures from './Procedures/Procedures';

const PatientSummary = () => {
    const location = useLocation();
    const { patient, encounter } = location.state || {};
    return (
        <div className='patient-summary-container'>
            <div className='patient-summary-Column'>
                <BodyDiagram patient={patient} />
                <PreviuosVisitData patient={patient} encounter={encounter} />
            </div>
            <div className='patient-summary-Column'>
                <PatientMajorProblemTable patient={patient} />
                <PatientChronicMedicationTable patient={patient} />
                <PreObservation patient={patient}/>
            </div>
            <div className='patient-summary-Column'>
                <ActiveAllergies patient={patient} />
                <MedicalWarnings patient={patient} />
                <Procedures patient={patient}/>
                <RecentTestResults patient={patient} />
            </div>
        </div >
    );
};
export default PatientSummary;




