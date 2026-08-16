import React, { useContext, useEffect, useState } from 'react';
import './styles.less';
import PatientMajorProblemTable from './PatientMajorProblem';
import PatientChronicMedicationTable from './PatientChronicMedication/PatientChronicMedication';
import ActiveAllergies from './ActiveAllergies/ActiveAllergies';
import MedicalWarnings from './MedicalWarnings/MedicalWarnings';
import RecentTestResults from './RecentTestResults/RecentTestResults';
import PreviuosVisitData from './PreviuosVisitData';
// import BodyDiagram from './BodyDiagram/BodyDiagram';
import { useLocation } from 'react-router-dom';
import PreObservation from './PreObservation/PreObservation';
import Procedures from './Procedures/Procedures';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ChooseDashboardScreen from './ChooseDashboardSections';
import { ActionContext } from './ActionContext';
import Last24HMedications from './Last24-hMedications';
import IntakeOutputs from './IntakeOutputs';
import ChiefComplainSummary from '../nursing-reports-summary/ChiefComplainSummary';
import PainAssessmentSummary from '../nursing-reports-summary/PainAssessmentSummary';
import GeneralAssessmentSummary from '../nursing-reports-summary/GeneralAssessmentSummary';
import FunctionalAssessmentSummary from '../nursing-reports-summary/FunctionalAssessmentSummary';
import { useGetUserDashboardComponentsQuery } from '@/services/encounterService';
import PatientPlan from './PatientPlan';
import PrimaryCareProviderTable from './PrimaryCareProviderTable/PrimaryCareProviderTable';
import PatientPreviousAssessments from './PatientPreviousAssessments';
// import MedicalTimeline from '../../encounter-screen/MedicalTimeLine';

const PatientSummary = ({
  patient: patientProp,
  encounter: encounterProp
}: { patient?: any; encounter?: any } = {}) => {
  const location = useLocation();
  const stateData = location.state || {};
  const patient = patientProp ?? stateData.patient;
  const encounter = encounterProp ?? stateData.encounter;
  const { setAction } = useContext(ActionContext);
  const [openChooseScreen, setOpenChooseScreen] = useState<boolean>(false);
  const user = JSON.parse(localStorage.getItem('user'));
  const userDashboardComponents = useGetUserDashboardComponentsQuery(user?.id);
  const [arrOfComponentKeys, setArrOfComponentKeys] = useState([]);
  const [displays, setDisplays] = useState({
    c1: false,
    c2: false,
    c3: true,
    c4: true,
    c5: false,
    c6: false,
    c7: true,
    c8: true,
    c9: true,
    c10: false,
    c11: false,
    c12: false,
    c13: false,
    c14: false,
    c15: false
  });

  const [columns, setColumns] = useState({
    col1: [
      // { id: 'c1', content: <BodyDiagram patient={patient} />, display: false },
      {
        id: 'c2',
        content: <PreviuosVisitData patient={patient} encounter={encounter} />,
        display: false
      },
      { id: 'c3', content: <PatientMajorProblemTable patient={patient} />, display: true },
      { id: 'c4', content: <PatientChronicMedicationTable patient={patient} />, display: true },
      { id: 'c5', content: <PreObservation patient={patient} />, display: false },
      // {
      //   id: 'c6',
      //   content: <FunctionalAssessmentSummary patient={patient} encounter={encounter} />,
      //   display: false
      // }
    ],
    col2: [
      { id: 'c7', content: <ActiveAllergies patient={patient} />, display: true },
      { id: 'c8', content: <MedicalWarnings patient={patient} />, display: true },
      {
        id: 'c9',
        content: <PatientPlan patient={patient} />,
        display: true
      },
      { id: 'c11', content: <Procedures patient={patient} />, display: false },
      { id: 'c12', content: <RecentTestResults patient={patient} />, display: false },
      // {
      //   id: 'c10',
      //   content: <GeneralAssessmentSummary patient={patient} encounter={encounter} />,
      //   display: false
      // }
    ],
    col3: [
      {
        id: 'c13',
        content: (
          <PrimaryCareProviderTable
            patient={patient}
            encounter={encounter}
          />
        ),
        display: false
      },
{
id:'c14',
content:(

<PatientPreviousAssessments
    encounter={encounter}
/>

),

display:false
}
      // { id: 'c13', content: <Last24HMedications patient={patient} />, display: false },
      // { id: 'c14', content: <IntakeOutputs patient={patient} />, display: false },
      // {
      //   id: 'c15',
      //   content: <ChiefComplainSummary patient={patient} encounter={encounter} />,
      //   display: false
      // }
    ]
    
  });

  useEffect(() => {
    const arr = userDashboardComponents?.data?.object ?? [];
    const newArr = arr.map(item => item.component_key);
    if (newArr.length > 0) {
      setArrOfComponentKeys(newArr);

      const updatedColumns = Object.fromEntries(
        Object.entries(columns).map(([colKey, colItems]) => [
          colKey,
          colItems.map(item => ({
            ...item,
            display: newArr.includes(item.id)
          }))
        ])
      );

      setColumns(updatedColumns);
    }
  }, [userDashboardComponents?.data]);

  useEffect(() => {
    setAction(() => () => setOpenChooseScreen(true));
    return () => setAction(() => () => {});
  }, [setAction]);

  useEffect(() => {
    const arr = userDashboardComponents?.data?.object ?? [];
    const newArr = arr.map(item => item.component_key);
    if (newArr.length > 0) {
      setArrOfComponentKeys(newArr);
      const updated = Object.fromEntries(
        Object.keys(displays).map(key => [key, newArr.includes(key)])
      );
      setDisplays(updated);
    }
  }, [userDashboardComponents?.data]);

  // Function triggered after drag ends
  const handleDragEnd = (result: any) => {
    const { source, destination } = result;

    // If no destination → do nothing
    if (!destination) return;

    // Case 1: same column → reorder
    if (source.droppableId === destination.droppableId) {
      // copy the column items
      const colItems = Array.from(columns[source.droppableId]);

      // remove dragged item
      const [movedItem] = colItems.splice(source.index, 1);

      // insert at new position
      colItems.splice(destination.index, 0, movedItem);

      // update state
      setColumns({
        ...columns,
        [source.droppableId]: colItems
      });
    } else {
      // Case 2: different column → move

      // copy source and destination
      const sourceItems = Array.from(columns[source.droppableId]);
      const destItems = Array.from(columns[destination.droppableId]);

      // remove dragged item from source
      const [movedItem] = sourceItems.splice(source.index, 1);

      // insert into destination
      destItems.splice(destination.index, 0, movedItem);

      // update both columns in state
      setColumns({
        ...columns,
        [source.droppableId]: sourceItems,
        [destination.droppableId]: destItems
      });
    }
  };

  return (
    <>
      {/* <MedicalTimeline patient={patient} encounter={encounter} /> */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="patient-summary-container">
          {Object.entries(columns).map(([colId, items]) => (
            <Droppable droppableId={colId} key={colId}>
              {provided => (
                <div
                  className="patient-summary-Column"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {items.map(
                    (item, index) =>
                      item.display && (
                        <Draggable draggableId={item.id} index={index} key={item.id}>
                          {provided => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              {item.content}
                            </div>
                          )}
                        </Draggable>
                      )
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
      <ChooseDashboardScreen
        open={openChooseScreen}
        setOpen={setOpenChooseScreen}
        displays={displays}
        setColumns={setColumns}
        setDisplays={setDisplays}
        arrOfComponentKeys={arrOfComponentKeys}
        userId={user?.id}
      />
    </>
  );
};

export default PatientSummary;
