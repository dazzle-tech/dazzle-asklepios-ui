import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import { Form, Panel, Slider, Divider, Checkbox, Row } from 'rsuite';
import MyNestedTable from '@/components/MyNestedTable';
import Section from '@/components/Section';
import {
  faEye,
  faPlus,
  faFilePdf,
  faClipboardList,
  faBullseye,
  faPaperclip,
  faFileAlt,
  faCalendarDays
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyButton from '@/components/MyButton/MyButton';
import PlusIcon from '@rsuite/icons/Plus';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import AttachmentModal from '@/components/AttachmentUploadModal';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import AddProgressNotes from '@/components/ProgressNotes';
import PatientAttachment from '@/pages/patient/patient-profile/tabs/Attachment';
import './style.less';
import { useLocation } from 'react-router-dom';
import MyLabel from '@/components/MyLabel';
import NursingReportAssesments from '../occupational-therapy/components/NursingReportAssesments';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import SectionContainer from '@/components/SectionsoContainer';

const Physiotherapy = () => {
  // State initialization
  const location = useLocation();
  const propsData = location.state;
  const [refetchAttachmentList, setRefetchAttachmentList] = useState(false);

  const [width, setWidth] = useState(window.innerWidth); // window width
  const [initiatePlanModalOpen, setInitiatePlanModalOpen] = useState(false); // modal open/close
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false); // attachment modal state
  const [selectedPlan, setSelectedPlan] = useState({}); // selected physiotherapy plan
  const [showCanceled, setShowCanceled] = useState(true); // toggle canceled plans
  const [progressNotes, setProgressNotes] = useState([]);
  // Physiotherapy plan form data
  const [planData, setPlanData] = useState({
    shortTermGoals: '',
    longTermGoals: '',
    expectedOutcome: '',
    therapyType: '',
    frequency: '',
    timeUnit: '',
    durationPerSession: '',
    totalPlanDuration: '',
    specificExercises: '',
    assistiveDevicesRequired: false,
    assistiveDevicesText: '',
    precautions: '',
    progressNotes: '',
    painLevel: 0,
    mobilityImprovement: '',
    nextReviewDate: ''
  });

  // Dummy referral data
  const referralsData = [
    {
      id: 1,
      referredBy: 'Dr. Tariq',
      referredAt: '2024-01-15 10:30',
      department: 'Orthopedics',
      reason: 'Post-surgery rehabilitation',
      notes: 'Patient requires intensive physiotherapy after knee surgery',
      status: 'Requested'
    },
    {
      id: 2,
      referredBy: 'Dr. Yousef',
      referredAt: '2024-01-14 14:20',
      department: 'Neurology',
      reason: 'Stroke rehabilitation',
      notes: 'Focus on mobility and speech therapy coordination',
      status: 'Confirmed'
    }
  ];

  // Dummy physiotherapy plans with nested follow-ups
  const plansData = [
    {
      id: 1,
      therapyType: 'Manual Therapy',
      totalPlanDuration: '6 weeks',
      status: 'Active',
      initiatedBy: 'Dr. Wilson',
      initiatedAt: '2024-01-10 09:00',
      followUps: [
        {
          id: 1,
          followUpBy: 'Therapist Mosa',
          followUpAt: '2024-01-17 11:00',
          progressNote: 'Patient showing good improvement in mobility',
          painLevel: 4,
          mobilityImprovement: 'Moderate',
          nextReviewDate: '2024-01-24'
        },
        {
          id: 2,
          followUpBy: 'Therapist Mohammad',
          followUpAt: '2024-01-20 14:30',
          progressNote: 'Continued progress, patient reports less pain',
          painLevel: 3,
          mobilityImprovement: 'High',
          nextReviewDate: '2024-01-27'
        }
      ]
    },
    {
      id: 2,
      therapyType: 'Exercise Therapy',
      totalPlanDuration: '4 weeks',
      status: 'Completed',
      initiatedBy: 'Dr. Brown',
      initiatedAt: '2024-01-05 10:15',
      followUps: [
        {
          id: 1,
          followUpBy: 'Therapist Ali',
          followUpAt: '2024-01-12 09:45',
          progressNote: 'Patient completed all exercises successfully',
          painLevel: 2,
          mobilityImprovement: 'High',
          nextReviewDate: '2024-01-19'
        }
      ]
    }
  ];

  const getTrackColor = (value: number): string => {
    if (value === 0) return 'transparent';
    if (value >= 1 && value <= 3) return '#28a745';
    if (value >= 4 && value <= 7) return 'orange';
    return 'red';
  };

  // Fetch LOV (List of Values) from backend

  const { data: statusTableLovQueryResponse, isLoading: statusTableLoading } =
    useGetLovValuesByCodeQuery('DIAG_ORD_STATUS');
  const { data: therapyTypeLovQueryResponse, isLoading: therapyTypeLoading } =
    useGetLovValuesByCodeQuery('PHYSIOTHERAPY_PLAN_TYPES');
  const { data: frequencyLovQueryResponse, isLoading: frequencyLoading } =
    useGetLovValuesByCodeQuery('TIME_UNITS');
  const { data: mobilityImprovementLovQueryResponse, isLoading: mobilityLoading } =
    useGetLovValuesByCodeQuery('LOW_MOD_HIGH');

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Icons for actions column
  const iconsForActions = rowData => (
    <div className="container-of-icons">
      <FontAwesomeIcon
        title="View"
        icon={faEye}
        color="var(--primary-gray)"
        className="icons-style"
        onClick={() => console.log('Follow-up for:', rowData)}
      />
      <FontAwesomeIcon
        title="Follow-up"
        icon={faCalendarDays}
        color="var(--primary-gray)"
        className="icons-style"
        onClick={() => console.log('Follow-up for:', rowData)}
      />
    </div>
  );

  // Columns for referrals table
  const referralColumns = [
    {
      key: 'referredByAt',
      title: <Translate>Referred By/At</Translate>,
      render: rowData => (
        <>
          {rowData?.referredBy}
          <br />
          <span className="date-table-style">
            {rowData?.referredAt?.split(' ')[0]}
            <br />
            {rowData?.referredAt?.split(' ')[1]}
          </span>
        </>
      )
    },
    { key: 'department', title: <Translate>Department</Translate> },
    { key: 'reason', title: <Translate>Reason</Translate> },
    { key: 'notes', title: <Translate>Notes</Translate> },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      render: rowData => {
        const status = rowData.status || 'Requested';

        const getStatusConfig = status => {
          switch (status) {
            case 'Requested':
              return {
                backgroundColor: 'var(--light-orange)',
                color: 'var(--primary-orange)',
                contant: 'Requested'
              };
            case 'Confirmed':
              return {
                backgroundColor: 'var(--light-green)',
                color: 'var(--primary-green)',
                contant: 'Confirmed'
              };
            default:
              return {
                backgroundColor: 'var(--background-gray)',
                color: 'var(--primary-gray)',
                contant: 'Unknown'
              };
          }
        };

        const config = getStatusConfig(status);
        return (
          <MyBadgeStatus
            backgroundColor={config.backgroundColor}
            color={config.color}
            contant={config.contant}
          />
        );
      }
    }
  ];

  // Columns for main physiotherapy plans table
  const planColumns = [
    { key: 'therapyType', title: <Translate>Therapy Type</Translate> },
    { key: 'totalPlanDuration', title: <Translate>Total Plan Duration</Translate> },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      width: 120,
      render: rowData => {
        const status = rowData.status || 'Active';

        const getStatusConfig = status => {
          switch (status) {
            case 'Active':
              return {
                backgroundColor: 'var(--very-light-blue)',
                color: 'var(--primary-blue)',
                contant: 'Active'
              };
            case 'Completed':
              return {
                backgroundColor: 'var(--light-green)',
                color: 'var(--primary-green)',
                contant: 'Completed'
              };
            case 'Cancelled':
              return {
                backgroundColor: 'var(--light-red)',
                color: 'var(--primary-red)',
                contant: 'Cancelled'
              };
            default:
              return {
                backgroundColor: 'var(--background-gray)',
                color: 'var(--primary-gray)',
                contant: 'Unknown'
              };
          }
        };

        const config = getStatusConfig(status);
        return (
          <MyBadgeStatus
            backgroundColor={config.backgroundColor}
            color={config.color}
            contant={config.contant}
          />
        );
      }
    },
    {
      key: 'initiatedByAt',
      title: <Translate>Initiated By/At</Translate>,
      render: rowData => (
        <>
          {rowData?.initiatedBy}
          <br />
          <span className="date-table-style">
            {rowData?.initiatedAt?.split(' ')[0]}
            <br />
            {rowData?.initiatedAt?.split(' ')[1]}
          </span>
        </>
      )
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      flexGrow: 4,
      render: rowData => iconsForActions(rowData)
    }
  ];

  // Columns for nested follow-up table
  const followUpColumns = [
    {
      key: 'followUpByAt',
      title: <Translate>Follow-up By/At</Translate>,
      render: followUp => (
        <>
          {followUp?.followUpBy}
          <br />
          <span className="date-table-style">
            {followUp?.followUpAt?.split(' ')[0]}
            <br />
            {followUp?.followUpAt?.split(' ')[1]}
          </span>
        </>
      )
    },
    { key: 'progressNote', title: <Translate>Progress Note</Translate> },
    {
      key: 'painLevel',
      title: <Translate>Pain Level</Translate>,
      render: followUp => `${followUp.painLevel}/10`
    },
    { key: 'mobilityImprovement', title: <Translate>Mobility Improvement</Translate> },
    { key: 'nextReviewDate', title: <Translate>Next Review Date</Translate> }
  ];

  // Return nested table configuration for each plan
  const getNestedTable = rowData =>
    rowData.followUps?.length > 0 ? { columns: followUpColumns, data: rowData.followUps } : null;

  // Modal content for initiating plan (Step 0)
  const initiatePlanContent = activeStep => {
    if (statusTableLoading || therapyTypeLoading || frequencyLoading || mobilityLoading) {
      return (
        <div className="center-class">
          <Translate>Loading...</Translate>
        </div>
      );
    }

    if (activeStep === 0) {
      return (
        // <div className="plan-form-container">
         <Row gutter={15} className="d">
      
          <Form fluid>
            {/* Sections for treatment goals and physiotherapy plan details */}
            {/* <div className="section-column"> */}
              {/* Treatment Goals */}
              <Row>
              <SectionContainer
                title={
                  <div>
                    <FontAwesomeIcon icon={faBullseye} className="font-small title-div-s" />
                    Treatment Goals
                  </div>
                }
                content={
                  <>
                    <div className="goals-container">
                      <MyInput
                        fieldName="shortTermGoals"
                        fieldType="textarea"
                        fieldLabel="Short-term Goals"
                        record={planData}
                        setRecord={setPlanData}
                        width={350}
                      />
                      <MyInput
                        fieldName="longTermGoals"
                        fieldType="textarea"
                        fieldLabel="Long-term Goals"
                        record={planData}
                        setRecord={setPlanData}
                        width={350}
                      />
                      <MyInput
                        fieldName="expectedOutcome"
                        fieldType="textarea"
                        fieldLabel="Expected Outcome"
                        record={planData}
                        setRecord={setPlanData}
                        width={350}
                      />
                    </div>
                  </>
                }
              />
              </Row>
              {/* Physiotherapy Plan Details */}
              <Row>
              <SectionContainer
                title={
                  <div>
                    <FontAwesomeIcon icon={faClipboardList} className="font-small title-div-s" />
                    Physiotherapy Plan Details
                  </div>
                }
                content={
                  <>
                    {/* Therapy type, frequency, time unit */}
                    <div className="goals-container">
                      <MyInput
                        fieldName="therapyType"
                        fieldType="select"
                        fieldLabel="Therapy Type"
                        record={planData}
                        setRecord={setPlanData}
                        selectData={therapyTypeLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        width={200}
                        searchable={false}
                      />
                      <div className="flex-class">
                        <MyInput
                          fieldName="frequencyNumber"
                          fieldType="number"
                          fieldLabel="Frequency"
                          record={planData}
                          setRecord={setPlanData}
                          width={120}
                        />
                        <div className="margin-class">
                          <MyInput
                            fieldName="frequency"
                            fieldType="select"
                            fieldLabel=""
                            record={planData}
                            setRecord={setPlanData}
                            selectData={frequencyLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            width={120}
                            searchable={false}
                          />
                        </div>
                      </div>
                      <MyInput
                        fieldName="timeUnit"
                        fieldType="select"
                        fieldLabel="Time Unit"
                        record={planData}
                        setRecord={setPlanData}
                        selectData={statusTableLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        width={120}
                        searchable={false}
                      />
                      {/* Duration, exercises, assistive devices, precautions */}
                      <MyInput
                        fieldName="durationPerSession"
                        fieldType="number"
                        fieldLabel="Duration per Session"
                        record={planData}
                        setRecord={setPlanData}
                        width={200}
                        rightAddon={'min'}
                        rightAddonwidth={50}
                      />
                      <div className="flex-class">
                        <MyInput
                          fieldName="totalPlanDuration"
                          fieldType="number"
                          fieldLabel="Total Plan Duration"
                          record={planData}
                          setRecord={setPlanData}
                          width={120}
                          searchable={false}
                        />
                        <div className="margin-class">
                          <MyInput
                            fieldName="totalPlanDuration"
                            fieldType="select"
                            fieldLabel=""
                            record={planData}
                            setRecord={setPlanData}
                            selectData={frequencyLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            width={120}
                            searchable={false}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="goals-container">
                      <MyInput
                        fieldName="specificExercises"
                        fieldType="textarea"
                        fieldLabel="Specific Exercises / Procedures"
                        record={planData}
                        setRecord={setPlanData}
                        rows={4}
                        width={550}
                      />

                      <MyInput
                        fieldName="precautions"
                        fieldType="textarea"
                        fieldLabel="Precautions"
                        record={planData}
                        setRecord={setPlanData}
                        rows={3}
                        width={550}
                      />
                      <MyInput
                        fieldName="assistiveDevicesRequired"
                        fieldType="checkbox"
                        fieldLabel="Assistive Devices Required"
                        record={planData}
                        setRecord={setPlanData}
                      />
                      {planData.assistiveDevicesRequired && (
                        <MyInput
                          fieldName="assistiveDevicesText"
                          fieldType="text"
                          fieldLabel="Specify Devices"
                          record={planData}
                          setRecord={setPlanData}
                          width={400}
                        />
                      )}
                    </div>
                  </>
                }
              />
              </Row>
            {/* </div> */}

            {/* Sections for progress notes and attachments */}
            {/* <div className="section-column"> */}
            <Row>
              <SectionContainer
                title={
                  <div>
                    <FontAwesomeIcon icon={faFileAlt} className="font-small title-div-s" />{' '}
                    Progress Notes
                  </div>
                }
                content={
                  <div className="notes">
                    <div className="flex2-class">
                      <AddProgressNotes
                        progressNotes={progressNotes}
                        setProgressNotes={setProgressNotes}
                        currentChart={{ key: 'physio-plan' }}
                        dispatch={action => {
                          console.log(action);
                        }}
                      />
                    </div>
                    <div className="form-row">
                      {/* Pain level slider */}
                      <div className="pain-level-container">
                        <MyLabel label="Pain Level (1-10)" />

                        <div className="slider-class">
                          <Slider
                            value={planData.painLevel}
                            onChange={value => setPlanData(prev => ({ ...prev, painLevel: value }))}
                            min={0}
                            max={10}
                            step={1}
                            progress
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: '52%',
                              left: 0,
                              height: '7px',
                              width: `${(planData.painLevel / 10) * 100}%`,
                              backgroundColor: getTrackColor(planData.painLevel),
                              transform: 'translateY(-50%)',
                              zIndex: 1,
                              transition: 'background-color 0.2s ease',
                              borderRadius: '4px'
                            }}
                          />
                        </div>
                      </div>
                      <div className="margin2-class">
                        <MyInput
                          fieldName="mobilityImprovement"
                          fieldType="select"
                          fieldLabel="Mobility Improvement"
                          record={planData}
                          setRecord={setPlanData}
                          selectData={mobilityImprovementLovQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          width={200}
                          searchable={false}
                        />
                      </div>
                      <MyInput
                        fieldName="nextReviewDate"
                        fieldType="date"
                        fieldLabel="Next Review Date"
                        record={planData}
                        setRecord={setPlanData}
                        width={200}
                      />
                    </div>
                  </div>
                }
              />
              </Row>
              {/* Attachments section */}
              <SectionContainer
                title={
                  <div>
                    <FontAwesomeIcon icon={faPaperclip} className="font-small title-div-s" />
                    Attachments
                  </div>
                }
                content={
                  <PatientAttachment
                    localPatient={propsData?.patient}
                    setRefetchAttachmentList={setRefetchAttachmentList}
                    refetchAttachmentList={refetchAttachmentList}
                  />
                }
              />
            {/* </div> */}
          </Form>
        {/* </div> */}
        </Row>
      );
    }

    return null;
  };

  // Handle saving draft
  const handleSaveDraft = () => {
    console.log('Saving draft...', planData);
    setInitiatePlanModalOpen(false);
  };

  // Handle submitting plan
  const handleSubmitPlan = () => {
    console.log('Submitting plan...', planData);
    setInitiatePlanModalOpen(false);
  };

  // Handle exporting PDF
  const handleExportPDF = () => {
    console.log('Exporting PDF...');
  };

  return (
    <div className="physiotherapy-container">
      {/* Referrals section */}
      <Panel className="section-panel">
        <div className="section-header">
          <h6 className="section-title">
            <p>Physiotherapy Referrals</p>
          </h6>
        </div>
        <MyNestedTable data={referralsData} columns={referralColumns} />
      </Panel>

      <Divider />
      <Panel>
        <NursingReportAssesments />
      </Panel>
      <Divider />

      {/* Physiotherapy plans section */}
      <Panel className="section-panel">
        <div className="section-header">
          <h6 className="section-title">
            <p>Physiotherapy Plans</p>
          </h6>
        </div>
        <div className="section-header">
          {/* Toggle canceled plans */}
          <Checkbox checked={!showCanceled} onChange={() => setShowCanceled(!showCanceled)}>
            Show Cancelled
          </Checkbox>
          <div className="section-buttons">
            <MyButton
              prefixIcon={() => <PlusIcon />}
              onClick={() => setInitiatePlanModalOpen(true)}
            >
              Initiate Plan
            </MyButton>
            <MyButton disabled>Cancel</MyButton>
            <MyButton
              prefixIcon={() => <FontAwesomeIcon icon={faFilePdf} />}
              onClick={handleExportPDF}
              appearance="ghost"
            >
              Export PDF
            </MyButton>
          </div>
        </div>

        <MyNestedTable
          data={plansData}
          columns={planColumns}
          getNestedTable={getNestedTable}
          onRowClick={rowData => setSelectedPlan(rowData)}
        />
      </Panel>

      {/* Modal for initiating plan */}
      <MyModal
        open={initiatePlanModalOpen}
        setOpen={setInitiatePlanModalOpen}
        title="Initiate Physiotherapy Plan"
        size="80vw"
        bodyheight="75vh"
        hideActionBtn={true}
        content={initiatePlanContent}
        steps={[{ title: 'Treatment Plan', icon: <FontAwesomeIcon icon={faBullseye} /> }]}
        footerButtons={
          <div className="modal-footer-buttons">
            <MyButton appearance="subtle" onClick={handleSaveDraft}>
              Save Draft
            </MyButton>
            <MyButton onClick={handleSubmitPlan}>Submit Plan</MyButton>
          </div>
        }
      />

      {/* Attachment upload modal */}
      <AttachmentModal
        isOpen={attachmentModalOpen}
        setIsOpen={setAttachmentModalOpen}
        attachmentSource={{ key: 'physiotherapy-plan' }}
        attatchmentType="PHYSIOTHERAPY"
        patientKey="patient-123"
      />
    </div>
  );
};

export default Physiotherapy;
