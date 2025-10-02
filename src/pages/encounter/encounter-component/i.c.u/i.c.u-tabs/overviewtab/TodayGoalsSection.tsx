import React, { useState } from "react";
import SectionContainer from '@/components/SectionsoContainer';
import MyButton from '@/components/MyButton/MyButton';
import DynamicCard from '@/components/DynamicCard';
import PlusIcon from '@rsuite/icons/Plus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyModal from "@/components/MyModal/MyModal";
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import './style.less';
// Table columns config
const columns: ColumnConfig[] = [
  { key: 'planType', title: 'Plan Type', dataKey: 'planType', width: 100 },
  { key: 'parameter', title: 'Parameter', dataKey: 'parameter', width: 100 },
  { key: 'goal', title: 'Goal', dataKey: 'goal', width: 200 },
  { key: 'stopCriteria', title: 'Stop Criteria', dataKey: 'stopCriteria', width: 200 },
  {
    key: 'createdByAt',
    title: 'Created By\\At',
    dataKey: 'createdByAt',
    width: 200,
    render: row => (
      <>
        {row.createdBy}
        <br />
        <span className="date-table-style">{row.createdAt}</span>
      </>
    )
  }
];

const initialSampleData = [
  {
    id: 1,
    planType: "Weaning",
    parameter: "FiO₂",
    goal: "Reduce to 40%",
    stopCriteria: "SpO₂ < 88%",
    createdBy: "Dr. Ahmad",
    createdAt: "2025-09-21 09:30 AM"
  },
  {
    id: 2,
    planType: "Fluid Balance",
    parameter: "I/O",
    goal: "-500 mL balance",
    stopCriteria: "Hypotension",
    createdBy: "Nurse Layla",
    createdAt: "2025-09-21 11:15 AM"
  },
  {
    id: 3,
    planType: "Sedation",
    parameter: "RASS",
    goal: "-1 to 0",
    stopCriteria: "Agitation",
    createdBy: "Dr. Rami",
    createdAt: "2025-09-22 02:00 PM"
  }
];

const todayGoals = [
  { text: 'Wean FiO₂ to 40%' },
  { text: 'Negative fluid balance -500mL' },
  { text: 'RASS -1 to 0' },
  { text: 'Mobilize to chair' },
  { text: 'De-escalate norepinephrine' },
];

const TodayGoalsSection: React.FC = () => {
  const [openTodayGoal, setOpenTodayGoal] = useState(false);
  const [record, setRecord] = useState<any>({});
  const [goalsData, setGoalsData] = useState<any[]>(initialSampleData);



  const TodayGoalsForm = (
    <>
      <Form fluid>
        <div className="consultion-details-modal-handle-position">
          <MyInput
            width="12vw"
            fieldType="text"
            fieldLabel="Plan Type"
            fieldName="planType"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            width="12vw"
            fieldType="text"
            fieldLabel="Parameter"
            fieldName="parameter"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            width="12vw"
            fieldType="text"
            fieldLabel="Goal"
            fieldName="goal"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            width="12vw"
            fieldType="text"
            fieldLabel="Stop Criteria"
            fieldName="stopCriteria"
            record={record}
            setRecord={setRecord}
          />
        </div>
      </Form>

      <div style={{ marginTop: 20, maxHeight: '30vh', overflow: 'auto' }}>
        <MyTable
          data={goalsData}
          columns={columns}
          loading={false}
          sortColumn="createdAt"
          sortType="desc"
          page={0}
          rowsPerPage={5}
          totalCount={goalsData.length}
          onPageChange={() => { }}
          onRowsPerPageChange={() => { }}
        />
      </div>
    </>
  );

  return (
    <>
      <SectionContainer
        title={<>
          <span className="today-goals-section-title">
            <FontAwesomeIcon color="blue" icon={faBullseye} className="title-icon-main-title" />
            Today's Goal
          </span>

          <div className="add-button-for-cards-over-view">
            <MyButton
              prefixIcon={() => <PlusIcon />}
              onClick={() => setOpenTodayGoal(true)}
            >
              Add
            </MyButton></div>
        </>}
        content={
          <div className="goals-card-list">
            {todayGoals.map((goal, index) => (
              <DynamicCard
                key={index}
                width="100%"
                margin="0 0 10px 0"
                data={[
                  {
                    value: (
                      <span className="today-goal-item">
                        <FontAwesomeIcon icon={faCheckCircle} color="green" style={{ marginRight: 8 }} />
                        {goal.text}
                      </span>
                    ),
                    type: 'text',
                    section: 'left',
                    showLabel: false,
                  },
                ]}
              />
            ))}
          </div>
        }
      />

      <MyModal
        open={openTodayGoal}
        setOpen={setOpenTodayGoal}
        title="Add New Goal"
        size="50vw"
        bodyheight="70vh"
        position="center"
        content={TodayGoalsForm}
        hideBack={true}
        actionButtonLabel="Save"
        actionButtonFunction={{}}
      />
    </>
  );
};

export default TodayGoalsSection;
