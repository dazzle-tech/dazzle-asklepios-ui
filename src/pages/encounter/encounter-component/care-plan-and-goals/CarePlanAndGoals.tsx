import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AddEditPlan from './AddEditPlan';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { faRectangleList } from '@fortawesome/free-solid-svg-icons';
import ShowStatusChange from './showStatusChange';
const CarePlanAndGoals = () => {
  const [popupOpen, setPopupOpen] = useState<boolean>(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [plan, setPlan] = useState({});
  const [openStatusChangePopup, setOpenStatusChangePopup] = useState<boolean>(false);

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && plan && rowData.key === plan.key) {
      return 'selected-row';
    } else return '';
  };
  // dummy data
  const data = [
    {
      key: '1',
      creationDate: '2025-02-02',
      problem: 'problem1',
      goal: 'goal1',
      goalType: 'type1',
      intervention: 'intervention1',
      responsible: 'responsible1',
      targetPlannedDate: '2025-06-06',
      reassessmentPlannedDate: '2025-08-08',
      evaluationNotes: 'note1',
      status: 'Planned'
    },
    {
      key: '2',
      creationDate: '2025-03-03',
      problem: 'problem2',
      goal: 'goal2',
      goalType: 'type2',
      intervention: 'intervention2',
      responsible: 'responsible2',
      targetPlannedDate: '2025-07-07',
      reassessmentPlannedDate: '2025-09-09',
      evaluationNotes: 'note2',
      status: 'Reassess'
    },
    {
      key: '3',
      creationDate: '2025-04-04',
      problem: 'problem3',
      goal: 'goal3',
      goalType: 'type3',
      intervention: 'intervention3',
      responsible: 'responsible3',
      targetPlannedDate: '2025-08-08',
      reassessmentPlannedDate: '2025-10-10',
      evaluationNotes: 'note3',
      status: 'Complete '
    }
  ];
  // Icons column (start)
  const iconsForActions = () => (
    <div className="container-of-icons">
      <FontAwesomeIcon
        className="icons-style"
        title="Complete"
        color="var(--primary-gray)"
        icon={faCircleCheck}
      />
      <FontAwesomeIcon
        className="icons-style"
        title="Reassess"
        color="var(--primary-gray)"
        icon={faRotateRight}
      />
      <FontAwesomeIcon
        className="icons-style"
        title="Log"
        color="var(--primary-gray)"
        onClick={() => setOpenStatusChangePopup(true)}
        icon={faRectangleList}
      />
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'creationDate',
      title: <Translate>Creation Date</Translate>
    },
    {
      key: 'problem',
      title: <Translate>Problem</Translate>
    },
    {
      key: 'goal',
      title: <Translate>Goal</Translate>
    },
    {
      key: 'goalType',
      title: <Translate>Goal Type</Translate>
    },
    {
      key: 'intervention',
      title: <Translate>Intervention</Translate>
    },
    {
      key: 'responsible',
      title: <Translate>Responsible</Translate>
    },
    {
      key: 'targetPlannedDate',
      title: <Translate>Target Planned Date</Translate>,
      expandable: true
    },
    {
      key: 'reassessmentPlannedDate',
      title: <Translate>Reassessment Planned Date</Translate>,
      expandable: true
    },
    {
      key: 'evaluationNotes',
      title: <Translate>Evaluation Notes</Translate>,
      expandable: true
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      expandable: true
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: () => iconsForActions()
    }
  ];

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Panel>
      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={() => {
            setPopupOpen(true);
          }}
          width="109px"
        >
          Add New
        </MyButton>
      </div>
      <MyTable
        data={data}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setPlan(rowData);
        }}
      />
      <AddEditPlan
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        plan={plan}
        setPlan={setPlan}
      />
      <ShowStatusChange
        open={openStatusChangePopup}
        setOpen={setOpenStatusChangePopup}
        width={width}
      />
    </Panel>
  );
};

export default CarePlanAndGoals;
