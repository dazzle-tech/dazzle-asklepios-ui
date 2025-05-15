import React from 'react';
import './styles.less';
import PatientMajorProblemTable from './PatientMajorProblem';
import PatientChronicMedicationTable from './PatientChronicMedication/PatientChronicMedication';
import ActiveAllergies from './ActiveAllergies/ActiveAllergies';
import MedicalWarnings from './MedicalWarnings/MedicalWarnings';
import RecentTestResults from './RecentTestResults/RecentTestResults';
import PreviuosVisitData from './PreviuosVisitData';
import BodyDiagram from './BodyDiagram/BodyDiagram';
import ReactDOMServer from 'react-dom/server';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { Text } from 'rsuite';
const PatientSummary = ({ patient, encounter }) => {
    const dispatch = useAppDispatch();
    const divContent = (
    
      <Text className='title-font-style'>Patient Visit &gt; Patient Dashboard</Text>
     
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('Patient_Dashboard'));
    dispatch(setDivContent(divContentHTML));
    return (
        <div className='patient-summary-container'>
            <div className='patient-summary-Column'>
                   <BodyDiagram patient={patient}/>
                   <PreviuosVisitData patient={patient} encounter={encounter}/>
            </div>
            <div className='patient-summary-Column'>
                    <PatientMajorProblemTable patient={patient} />
                    <PatientChronicMedicationTable patient={patient} />
            </div>
            <div className='patient-summary-Column'>
                    <ActiveAllergies patient={patient} />
                    <MedicalWarnings patient={patient} />
                   <RecentTestResults patient={patient} />
            </div>
        </div >
    );
};
export default PatientSummary;




