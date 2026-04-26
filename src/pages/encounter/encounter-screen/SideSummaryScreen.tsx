// imports
import React, { useState } from 'react';
import clsx from 'clsx';
import { Panel, Sidebar, Sidenav, Nav } from 'rsuite';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ActiveAllergies from '../encounter-component/patient-summary/ActiveAllergies';
import BodyDiagram from '../encounter-component/patient-summary/BodyDiagram';
import PreviuosVisitData from '../encounter-component/patient-summary/PreviuosVisitData';
import PatientMajorProblemTable from '../encounter-component/patient-summary/PatientMajorProblem';
import PatientChronicMedicationTable from '../encounter-component/patient-summary/PatientChronicMedication';
import PreObservation from '../encounter-component/patient-summary/PreObservation/PreObservation';
import MedicalWarnings from '../encounter-component/patient-summary/MedicalWarnings';
import Procedures from '../encounter-component/patient-summary/Procedures/Procedures';
import RecentTestResults from '../encounter-component/patient-summary/RecentTestResults';
import { useGetUserDashboardComponentsQuery } from '@/services/encounterService';
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
    case 'c1':
      return <BodyDiagram patient={patient} />;
    case 'c2':
      return <PreviuosVisitData patient={patient} encounter={encounter} />;
    case 'c3':
      return <PatientMajorProblemTable patient={patient} />;
    case 'c4':
      return <PatientChronicMedicationTable patient={patient} />;
    case 'c5':
      return <PreObservation patient={patient} />;
    case 'c7':
      return <ActiveAllergies patient={patient} />;
    case 'c8':
      return <MedicalWarnings patient={patient} />;
    case 'c11':
      return <Procedures patient={patient} />;
    case 'c12':
      return <RecentTestResults patient={patient} />;
    default:
      return null;
  }
};

const defaultSectionIds = ['c1', 'c2', 'c3', 'c4', 'c5', 'c7', 'c8', 'c11', 'c12'];

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
  const user = JSON.parse(localStorage.getItem('user'));
  const userDashboardComponents = useGetUserDashboardComponentsQuery(user?.id, {
    skip: !user?.id
  });

  const [columns, setColumns] = useState({
    col1: defaultSectionIds
  });

  React.useEffect(() => {
    const selectedKeys =
      userDashboardComponents?.data?.object?.map(item => item.component_key) ?? [];

    if (selectedKeys.length === 0) return;

    setColumns(prev => {
      const currentVisible = prev.col1.filter(id => selectedKeys.includes(id));
      const missingVisible = defaultSectionIds.filter(
        id => selectedKeys.includes(id) && !currentVisible.includes(id)
      );

      return {
        ...prev,
        col1: [...currentVisible, ...missingVisible]
      };
    });
  }, [userDashboardComponents?.data]);

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
