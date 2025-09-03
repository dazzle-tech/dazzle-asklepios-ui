// imports
import React, { useState } from 'react';
import clsx from 'clsx';
import { Panel, Sidebar, Sidenav, Nav } from 'rsuite';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ActiveAllergies from '../encounter-component/patient-summary/ActiveAllergies';
import BodyDiagram from '../encounter-component/patient-summary/BodyDiagram';
import IntakeOutputs from '../encounter-component/patient-summary/IntakeOutputs';
import Last24HMedications from '../encounter-component/patient-summary/Last24-hMedications';
import PreviuosVisitData from '../encounter-component/patient-summary/PreviuosVisitData';
import PatientMajorProblemTable from '../encounter-component/patient-summary/PatientMajorProblem';
import PatientChronicMedicationTable from '../encounter-component/patient-summary/PatientChronicMedication';
import PreObservation from '../encounter-component/patient-summary/PreObservation/PreObservation';
import FunctionalAssessmentSummary from '../encounter-component/nursing-reports-summary/FunctionalAssessmentSummary';
import MedicalWarnings from '../encounter-component/patient-summary/MedicalWarnings';
import PainAssessmentSummary from '../encounter-component/nursing-reports-summary/PainAssessmentSummary';
import GeneralAssessmentSummary from '../encounter-component/nursing-reports-summary/GeneralAssessmentSummary';
import Procedures from '../encounter-component/patient-summary/Procedures/Procedures';
import RecentTestResults from '../encounter-component/patient-summary/RecentTestResults';
import ChiefComplainSummary from '../encounter-component/nursing-reports-summary/ChiefComplainSummary';
import './styles.less';


interface SideSummaryScreenProps {
  expand: boolean;
  setExpand: (value: boolean) => void;
  windowHeight: number;
  patient: any;
  encounter: any;
  title?: string;
  direction?: 'left' | 'right';
  showButton?: boolean;
}

// Mapping component IDs to JSX elements
const componentMap = (id: string, patient: any, encounter: any) => {
  switch (id) {
    case 'ab1':
      return <BodyDiagram patient={patient} />;
    case 'ab2':
      return <PreviuosVisitData patient={patient} encounter={encounter} />;
    case 'ab3':
      return <PatientMajorProblemTable patient={patient} />;
    case 'ab4':
      return <PatientChronicMedicationTable patient={patient} />;
    case 'ab5':
      return <PreObservation patient={patient} />;
    case 'ab6':
      return <FunctionalAssessmentSummary patient={patient} encounter={encounter} />;
    case 'ab7':
      return <ActiveAllergies patient={patient} />;
    case 'ab8':
      return <MedicalWarnings patient={patient} />;
    case 'ab9':
      return <PainAssessmentSummary patient={patient} encounter={encounter} />;
    case 'ab10':
      return <GeneralAssessmentSummary patient={patient} encounter={encounter} />;
    case 'ab11':
      return <Procedures patient={patient} />;
    case 'ab12':
      return <RecentTestResults patient={patient} />;
    case 'ab13':
      return <Last24HMedications patient={patient} />;
    case 'ab14':
      return <IntakeOutputs patient={patient} />;
    case 'ab15':
      return <ChiefComplainSummary patient={patient} encounter={encounter} />;
    default:
      return null;
  }
};

const SideSummaryScreen: React.FC<SideSummaryScreenProps> = ({
  expand,
  setExpand,
  windowHeight,
  patient,
  encounter,
  title = 'Patient Summary',
  direction = 'left',
  showButton = true
}) => {
  const [columns, setColumns] = useState({
    col1: [
      'ab1',
      'ab2',
      'ab3',
      'ab4',
      'ab5',
      'ab6',
      'ab7',
      'ab8',
      'ab9',
      'ab10',
      'ab11',
      'ab12',
      'ab13',
      'ab14',
      'ab15'
    ]
  });

  const handleDragEnd = result => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index)
      return;

    const sourceCol = Array.from(columns[source.droppableId]);
    const [movedItem] = sourceCol.splice(source.index, 1);
    sourceCol.splice(destination.index, 0, movedItem);

    setColumns({
      ...columns,
      [source.droppableId]: sourceCol
    });
  };

  return (
    <div
      className={clsx('side-summary-sidebar-wrapper', {
        expanded: expand,
        'not-expanded': !expand
      })}
    >
      <Sidebar width={expand ? 370 : 56} collapsible className="profile-sidebar">
        <Sidenav expanded={expand} appearance="subtle" className="profile-sidenav">
          <Sidenav.Body>
            <Nav>
              {expand ? (
                <Panel header={title} className="sidebar-panel">
                  {showButton && (
                    <button
                      onClick={() => setExpand(false)}
                      className="expand-sidebar collapse-btn"
                      title="Collapse"
                    >
                      {'>'}
                    </button>
                  )}

                  {/* Drag & Drop container */}
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="col1">
                      {provided => (
                        <div
                          className="summary-list-wrapper"
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {columns.col1.map((id, index) => (
                            <Draggable draggableId={id} index={index} key={id}>
                              {provided => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="draggable-summary-item"
                                >
                                  {componentMap(id, patient, encounter)}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </Panel>
              ) : (
                <button
                  onClick={() => setExpand(true)}
                  className="user-search-btn expand-btn"
                  title="Expand"
                >
                  {'<'}
                </button>
              )}
            </Nav>
          </Sidenav.Body>
        </Sidenav>
      </Sidebar>
    </div>
  );
};

export default SideSummaryScreen;
