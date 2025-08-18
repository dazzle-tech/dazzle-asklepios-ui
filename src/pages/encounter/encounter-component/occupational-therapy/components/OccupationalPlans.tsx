import MyButton from '@/components/MyButton/MyButton';
import MyLabel from '@/components/MyLabel';
import MyNestedTable from '@/components/MyNestedTable';
import React, { useState } from 'react';
import { Checkbox, Form, Panel, Slider } from 'rsuite';
import PlusIcon from '@rsuite/icons/Plus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Translate from '@/components/Translate';
import MyModal from '@/components/MyModal/MyModal';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import Section from '@/components/Section';
import {
  faEye,
  faFilePdf,
  faClipboardList,
  faBullseye,
  faPaperclip,
  faFileAlt,
  faCalendarDays
} from '@fortawesome/free-solid-svg-icons';
import MyInput from '@/components/MyInput';
import AddProgressNotes from '@/components/ProgressNotes/ProgressNotes';
import { useLocation } from 'react-router-dom';
import PatientAttachment from '@/pages/patient/patient-profile/tabs/Attachment';

const OccupationalPlans = () => {
  const location = useLocation();
  const propsData = location.state;
  const [initiatePlanModalOpen, setInitiatePlanModalOpen] = useState(false); // modal open/close
  // Physiotherapy plan form data
  const [planData, setPlanData] = useState({
    shortTermGoals: '',
    longTermGoals: '',
    expectedOutcome: '',
    goalTargetDate: '',
    interventionType: '',
    frequency: '',
    timeUnit: '',
    durationPerSession: '',
    totalPlanDuration: '',
    environmentalRecommendations: '',
    assistiveDevicesRequired: false,
    assistiveDevicesText: '',
    precautions: '',
    progressNotes: '',
    painLevel: 0,
    functionalImprovement: '',
    nextReviewDate: ''
  });
  const [progressNotes, setProgressNotes] = useState([]);
  const [refetchAttachmentList, setRefetchAttachmentList] = useState(false);

  //
  // Fetch LOV (List of Values) from backend
  const { data: statusTableLovQueryResponse, isLoading: statusTableLoading } =
    useGetLovValuesByCodeQuery('DIAG_ORD_STATUS');
  const { data: interventionTypeLovQueryResponse, isLoading: interventionTypeLoading } =
    useGetLovValuesByCodeQuery('OT_INTEVENTION_TYPES');
  const { data: frequencyLovQueryResponse, isLoading: frequencyLoading } =
    useGetLovValuesByCodeQuery('TIME_UNITS');
  const { data: functionalImprovementLovQueryResponse, isLoading: mobilityLoading } =
    useGetLovValuesByCodeQuery('LOW_MOD_HIGH');
  //
  const getTrackColor = (value: number): string => {
    if (value === 0) return 'transparent';
    if (value >= 1 && value <= 3) return '#28a745';
    if (value >= 4 && value <= 7) return 'orange';
    return 'red';
  };
  // Modal content for initiating plan (Step 0)
  const initiatePlanContent = activeStep => {
    if (statusTableLoading || interventionTypeLoading || frequencyLoading || mobilityLoading) {
      return (
        <div className="center-class">
          <Translate>Loading...</Translate>
        </div>
      );
    }

    if (activeStep === 0) {
      return (
        <div className="plan-form-container">
          <Form fluid>
            {/* Sections for treatment goals and physiotherapy plan details */}
            <div className="section-column">
              {/* Treatment Goals */}
              <Section
                title={
                  <>
                    <FontAwesomeIcon icon={faBullseye} className="font-small" />
                    <p className="font-small">Treatment Goals</p>
                  </>
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
                        width={270}
                      />
                      <MyInput
                        fieldName="longTermGoals"
                        fieldType="textarea"
                        fieldLabel="Long-term Goals"
                        record={planData}
                        setRecord={setPlanData}
                        width={270}
                      />
                      <MyInput
                        fieldName="expectedOutcome"
                        fieldType="textarea"
                        fieldLabel="Expected Outcome"
                        record={planData}
                        setRecord={setPlanData}
                        width={270}
                      />
                      <MyInput
                        fieldName="goalTargetDate"
                        fieldType="date"
                        fieldLabel="Goal Target Date"
                        record={planData}
                        setRecord={setPlanData}
                        width={270}
                      />
                    </div>
                  </>
                }
              />
              {/* Physiotherapy Plan Details */}
              <Section
                title={
                  <>
                    <FontAwesomeIcon icon={faClipboardList} className="font-small" />
                    <p className="font-small">Physiotherapy Plan Details</p>
                  </>
                }
                content={
                  <>
                    {/* Therapy type, frequency, time unit */}
                    <div className="goals-container">
                      <MyInput
                        fieldName="interventionType"
                        fieldType="select"
                        fieldLabel="Intervention Type"
                        record={planData}
                        setRecord={setPlanData}
                        selectData={interventionTypeLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        width={200}
                        searchable={false}
                      />
                      <div className="flex-class">
                        <MyInput
                          fieldName="frequencyNumber"
                          fieldType="number"
                          fieldLabel="Session Frequency"
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
                        fieldName="environmentalRecommendations"
                        fieldType="textarea"
                        fieldLabel="Environmental Recommendations"
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
            </div>

            {/* Sections for progress notes and attachments */}
            <div className="section-column">
              <Section
                title={
                  <>
                    <FontAwesomeIcon icon={faFileAlt} className="font-small" />{' '}
                    <p className="font-small">Progress Notes</p>
                  </>
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
                        <label>
                          <Translate>Pain Level (1-10)</Translate>
                        </label>

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
                          fieldName="functionalImprovement"
                          fieldType="select"
                          fieldLabel="Functional Improvement"
                          record={planData}
                          setRecord={setPlanData}
                          selectData={functionalImprovementLovQueryResponse?.object ?? []}
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

              {/* Attachments section */}
              <Section
                title={
                  <div>
                    <FontAwesomeIcon icon={faPaperclip} className="font-small" />
                    <p className="font-small">Attachments</p>
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
            </div>
          </Form>
        </div>
      );
    }

    return null;
  };
  // Icons for actions column
  const iconsForActions = rowData => (
    <div className="container-of-icons">
      <FontAwesomeIcon
        title="View"
        icon={faEye}
        color="var(--primary-gray)"
        className="icons-style"
      />
      <FontAwesomeIcon
        icon={faCalendarDays}
        className="icons-style"
        color="var(--primary-gray)"
        title="Follow-up"
      />
    </div>
  );

  // Columns for main Occupational plans table
  const planColumns = [
    { key: 'interventionType', title: <Translate>Intervention Type</Translate> },
    { key: 'totalPlanDuration', title: <Translate>Total Plan Duration</Translate> },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      render: rowData => (
        <span className={`status-badge ${rowData.status?.toLowerCase()}`}>
          <Translate>{rowData.status}</Translate>
        </span>
      )
    },
    {
      key: 'initiatedByAt',
      title: <Translate>Initiated By/At</Translate>,
      render: rowData => {
        const [date, time] = (rowData?.initiatedAt || '').split(' ');
        return (
          <>
            {rowData?.initiatedBy}
            <br />
            <span className="date-table-style">
              {date}
              <br />
              {time}
            </span>
          </>
        );
      }
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      flexGrow: 4,
      render: rowData => iconsForActions(rowData)
    }
  ];

  // Dummy occupational therapy plans
  const plansData = [
    {
      id: 1,
      interventionType: 'ADL Training',
      totalPlanDuration: '8 weeks',
      status: 'Active',
      initiatedBy: 'Dr. Wilson',
      initiatedAt: '2024-01-10 09:00',
      followUps: [
        {
          id: 1,
          followUpBy: 'Therapist Mosa',
          followUpAt: '2024-01-17 11:00',
          progressNote: 'Patient improving in dressing and grooming tasks',
          painLevel: 2,
          functionalImprovement: 'Range of Motion',
          nextReviewDate: '2024-01-24'
        },
        {
          id: 2,
          followUpBy: 'Therapist Mohammad',
          followUpAt: '2024-01-20 14:30',
          progressNote: 'Patient reports more independence in feeding',
          painLevel: 2,
          functionalImprovement: 'High',
          nextReviewDate: '2024-01-27'
        }
      ]
    },
    {
      id: 2,
      interventionType: 'Cognitive Rehabilitation',
      totalPlanDuration: '6 weeks',
      status: 'Completed',
      initiatedBy: 'Dr. Brown',
      initiatedAt: '2024-01-05 10:15',
      followUps: [
        {
          id: 1,
          followUpBy: 'Therapist Ali',
          followUpAt: '2024-01-12 09:45',
          progressNote: 'Patient shows progress in memory recall tasks',
          painLevel: 1,
          functionalImprovement: 'Flexibility',
          nextReviewDate: '2024-01-19'
        }
      ]
    },
    {
      id: 3,
      interventionType: 'Balance Training',
      totalPlanDuration: '4 weeks',
      status: 'Cancelled',
      initiatedBy: 'Dr. Mark',
      initiatedAt: '2024-01-03 08:30',
      followUps: []
    }
  ];

  // Columns for nested follow-up table
  const followUpColumns = [
    {
      key: 'followUpByAt',
      title: <Translate>Follow-up By/At</Translate>,
      render: followUp => {
        const [date, time] = (followUp?.followUpAt || '').split(' ');
        return (
          <>
            {followUp?.followUpBy}
            <br />
            <span className="date-table-style">
              {date}
              <br />
              {time}
            </span>
          </>
        );
      }
    },
    { key: 'progressNote', title: <Translate>Progress Note</Translate> },
    {
      key: 'painLevel',
      title: <Translate>Pain Level</Translate>,
      render: followUp => `${followUp.painLevel}/10`
    },
    { key: 'functionalImprovement', title: <Translate>Functional Improvement</Translate> },
    { key: 'nextReviewDate', title: <Translate>Next Review Date</Translate> }
  ];

  // Return nested table configuration for each plan
  const getNestedTable = rowData =>
    rowData.followUps?.length > 0 ? { columns: followUpColumns, data: rowData.followUps } : null;

  // toggle canceled plans
  const [showCanceled, setShowCanceled] = useState(true);

  // filter showCanceled
  const filteredPlans = showCanceled
    ? plansData
    : plansData.filter(plan => plan.status !== 'Cancelled');

  // Handle exporting PDF
  const handleExportPDF = () => {
    console.log('Exporting PDF...');
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
  return (
    <Panel className="section-panel">
      <div className="section-header">
        <MyLabel className="section-title" label={<h6>Occupational Plans</h6>} />
      </div>
      <div className="section-header">
        {/* Toggle canceled plans */}
        <Checkbox checked={showCanceled} onChange={() => setShowCanceled(!showCanceled)}>
          Show Cancelled
        </Checkbox>
        <div className="section-buttons">
          <MyButton prefixIcon={() => <PlusIcon />} onClick={() => setInitiatePlanModalOpen(true)}>
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

      <MyNestedTable data={filteredPlans} columns={planColumns} getNestedTable={getNestedTable} />
      <MyModal
        open={initiatePlanModalOpen}
        setOpen={setInitiatePlanModalOpen}
        title="Initiate Physiotherapy Plan"
        size="80vw"
        bodyheight="75vh"
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
    </Panel>
  );
};

export default OccupationalPlans;
