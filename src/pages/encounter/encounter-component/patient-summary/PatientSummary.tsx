import React, { useContext, useEffect, useState } from 'react';
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
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ChooseDashboardScreen from './ChooseDashboardSections';
import { ActionContext } from './ActionContext';
import Last24HMedications from './Last24-hMedications';
import IntakeOutputs from './IntakeOutputs';
import ChiefComplainSummary from '../nursing-reports-summary/ChiefComplainSummary';
import PainAssessmentSummary from '../nursing-reports-summary/PainAssessmentSummary';
import GeneralAssessmentSummary from '../nursing-reports-summary/GeneralAssessmentSummary';
import FunctionalAssessmentSummary from '../nursing-reports-summary/FunctionalAssessmentSummary';
import MedicalTimeline from '../../encounter-screen/MedicalTimeLine';

const PatientSummary = () => {
  const location = useLocation();
  const { patient, encounter } = location.state || {};

  // store the action in the context because the button exist in the encounter page
  const { setAction } = useContext(ActionContext);
  const [openChooseScreen, setOpenChooseScreen] = useState<boolean>(false);
  // object of visibility states of items for the customised dashboard popup
  const [displays, setDisplays] = useState({
    c1: true,
    c2: false,
    c3: true,
    c4: true,
    c5: true,
    c6: true,
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

  // items inside the columns(that can drags between columns)
  const [columns, setColumns] = useState({
    col1: [
      { id: 'c1', content: <BodyDiagram patient={patient} />, display: true },
      {
        id: 'c2',
        content: <PreviuosVisitData patient={patient} encounter={encounter} />,
        display: false
      },
      { id: 'c3', content: <PatientMajorProblemTable patient={patient} />, display: true },
      { id: 'c4', content: <PatientChronicMedicationTable patient={patient} />, display: true },
      { id: 'c5', content: <PreObservation patient={patient} />, display: true },
      {
        id: 'c6',
        content: <FunctionalAssessmentSummary patient={patient} encounter={encounter} />,
        display: false
      }
    ],
    col2: [
      { id: 'c7', content: <ActiveAllergies patient={patient} />, display: true },
      { id: 'c8', content: <MedicalWarnings patient={patient} />, display: true },
      {
        id: 'c9',
        content: <PainAssessmentSummary patient={patient} encounter={encounter} />,
        display: false
      },
      {
        id: 'c10',
        content: <GeneralAssessmentSummary patient={patient} encounter={encounter} />,
        display: false
      }
    ],
    col3: [
      { id: 'c11', content: <Procedures patient={patient} />, display: true },
      { id: 'c12', content: <RecentTestResults patient={patient} />, display: true },
      { id: 'c13', content: <Last24HMedications patient={patient} />, display: false },
      { id: 'c14', content: <IntakeOutputs patient={patient} />, display: false },
      {
        id: 'c15',
        content: <ChiefComplainSummary patient={patient} encounter={encounter} />,
        display: false
      }
    ]
  });

  // define the action for open cusomised dashboard popup
  useEffect(() => {
    setAction(() => () => {
      setOpenChooseScreen(true);
    });

    return () => setAction(() => () => {});
  }, [setAction]);

  // handle move (drag) item
  const handleDragEnd = result => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index)
      return;

    const sourceCol = Array.from(columns[source.droppableId]);
    const [movedItem] = sourceCol.splice(source.index, 1);

    const destCol = Array.from(columns[destination.droppableId]);
    destCol.splice(destination.index, 0, movedItem);

    setColumns({
      ...columns,
      [source.droppableId]: sourceCol,
      [destination.droppableId]: destCol
    });
  };

  return (
    <>
      {/*  */}
      <MedicalTimeline />
      {/*  */}
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
      />
    </>
  );
};

export default PatientSummary;
