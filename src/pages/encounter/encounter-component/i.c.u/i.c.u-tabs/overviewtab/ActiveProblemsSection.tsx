import React, { useState } from "react";
import SectionContainer from '@/components/SectionsoContainer';
import MyButton from '@/components/MyButton/MyButton';
import DynamicCard from '@/components/DynamicCard';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import PlusIcon from '@rsuite/icons/Plus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyModal from "@/components/MyModal/MyModal";
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from "react-redux";
import "./style.less";

const columns: ColumnConfig[] = [
  { key: 'problemName', title: 'Problem', dataKey: 'problemName', width: 150 },
  { key: 'severity', title: 'Severity', dataKey: 'severity', width: 100 },
  { key: 'dateIdentified', title: 'Date Identified', dataKey: 'dateIdentified', width: 150 },
  { key: 'goal', title: 'Goal', dataKey: 'goal', width: 200 },
  { key: 'targetDue', title: 'Target Due', dataKey: 'targetDue', width: 150 },
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
    problemName: "ARDS - COVID-19",
    severity: "High",
    dateIdentified: "2025-09-20",
    goal: "Maintain SpO₂ > 92%",
    targetDue: "2025-09-25",
    createdBy: "Dr. Ahmad",
    createdAt: "2025-09-21 09:30 AM",
    color: "#ff2323"
  },
  {
    id: 2,
    problemName: "Septic Shock - resolved",
    severity: "Medium",
    dateIdentified: "2025-09-18",
    goal: "Hemodynamic stability",
    targetDue: "2025-09-23",
    createdBy: "Nurse Layla",
    createdAt: "2025-09-21 11:15 AM",
    color: "#ffc107"
  },
  {
    id: 3,
    problemName: "Delirium",
    severity: "Low",
    dateIdentified: "2025-09-19",
    goal: "Reorient daily",
    targetDue: "2025-09-24",
    createdBy: "Dr. Rami",
    createdAt: "2025-09-22 02:00 PM",
    color: "#28a745"
  }
];

const ActiveProblemsSection = () => {
  const [openActiveProblems, setOpenActiveProblems] = useState(false);
  const [record, setRecord] = useState<any>({});
  const [problemsData, setProblemsData] = useState<any[]>(initialSampleData);

  const { data: problemsLovResponse } = useGetLovValuesByCodeQuery('ICU_PROBLEMS');
  const { data: severityLovResponse } = useGetLovValuesByCodeQuery('SEVERITY');

  const mode = useSelector((state: any) => state.ui.mode);

  const ActiveProblemForm = (
    <>
      <Form fluid>
        <div className="flex-row-active-problems">
          <MyInput
            width="14vw"
            fieldName="problem"
            fieldType="select"
            fieldLabel="Problem"
            record={record}
            setRecord={(newVal) => setRecord(prev => ({ ...prev, ...newVal }))}
            selectData={problemsLovResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            searchable={false}
          />
          {record.problem === '13116877998508184' && (
            <MyInput
              width="14vw"
              fieldName="otherProblem"
              fieldType="text"
              fieldLabel="Other Problem"
              placeholder="Please specify"
              record={record}
              setRecord={setRecord}
            />
          )}
          <MyInput
            width="14vw"
            fieldLabel="Severity"
            fieldName="severity"
            fieldType="select"
            selectData={severityLovResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
            searchable={false}
          />
          <MyInput
            width="14vw"
            fieldLabel="Date Identified"
            fieldName="dateIdentified"
            fieldType="date"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            width="14vw"
            fieldLabel="Goal"
            fieldName="goal"
            fieldType="text"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            width="14vw"
            fieldLabel="Target Due"
            fieldName="targetDue"
            fieldType="date"
            record={record}
            setRecord={setRecord}
          />
        </div>
      </Form>

      <div style={{ marginTop: 20, maxHeight: '30vh', overflow: 'auto' }}>
        <MyTable
          data={problemsData}
          columns={columns}
          loading={false}
          sortColumn="createdAt"
          sortType="desc"
          page={0}
          rowsPerPage={5}
          totalCount={problemsData.length}
          onPageChange={() => { }}
          onRowsPerPageChange={() => { }}
        />
      </div>
    </>
  );

  return (
    <div className={`active-problems-section ${mode}`}>
      <SectionContainer
        title={<>
          <span className="today-goals-section-title">
            <FontAwesomeIcon color="#fde90f" icon={faTriangleExclamation} className="title-icon-main-title" />
            Active Problems
          </span>
          <div className="add-button-for-cards-over-view">
            <MyButton
              prefixIcon={() => <PlusIcon />}
              onClick={() => setOpenActiveProblems(true)}
            >
              Add
            </MyButton>
          </div>
        </>}
        content={
          <div className="drips-list">
            {problemsData.map((problem, index) => (
              <DynamicCard
                key={index}
                width="100%"
                margin="0 0 15px 0"
                data={[
                  {
                    value: (
                      <div className="drip-info">
                        <div className="drip-name">{problem.problemName}</div>
                      </div>
                    ),
                    section: 'left',
                    showLabel: false,
                  },
                  {
                    value: <MyBadgeStatus contant={problem.severity} color={problem.color} />,
                    section: 'right',
                    showLabel: false,
                    vertical: "bottom"
                  },
                ]}
              />
            ))}
          </div>
        }
      />

      <MyModal
        open={openActiveProblems}
        setOpen={setOpenActiveProblems}
        title="Add Active Problem"
        size="60vw"
        bodyheight="70vh"
        position="center"
        content={ActiveProblemForm}
        hideBack={true}
        actionButtonLabel="Save"
        actionButtonFunction={{}}
      />
    </div>
  );
};

export default ActiveProblemsSection;
