import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import { Form, Panel, Checkbox } from 'rsuite';
import MyNestedTable from '@/components/MyNestedTable';
import { faEye, faFilePdf, faCalendarDays, faComments } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyButton from '@/components/MyButton/MyButton';
import PlusIcon from '@rsuite/icons/Plus';
import MyModal from '@/components/MyModal/MyModal';
import AttachmentModal from '@/components/AttachmentUploadModal';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import AssessmentSection from './AssessmentSection';
import DiagnosisAndGoalsSection from './DiagnosisAndGoalsSection';
import TreatmentPlan from './TreatmentPlan';
import SessionTrackingSection from './SessionTrackingSection';
import AttachmentsSection from './AttachmentsSection';

import './style.less';

const SpeechTherapy = () => {
  // State initialization
  const [width, setWidth] = useState(window.innerWidth);
  const [initiatePlanModalOpen, setInitiatePlanModalOpen] = useState(false);
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({});
  const [showCanceled, setShowCanceled] = useState(true);

  // Speech therapy plan form data
  const [planData, setPlanData] = useState({
    // Initial Assessment
    dateOfAssessment: '',
    primaryCommunicationMode: '',
    speechIntelligibility: '',
    voiceQuality: '',
    fluency: '',
    languageReceptive: false,
    languageExpressive: false,
    articulation: '',
    swallowingFunction: 0,
    cognitiveCommunication: 0,
    assessmentTools: [],
    otherAssessmentTool: '',
    functionalCommunicationLevel: '',
    patientFamilyConcerns: '',

    // Diagnosis & Goals
    shortTermGoals: '',
    longTermGoals: '',
    prognosis: 0,

    // Treatment Plan
    therapyType: [],
    sessionFrequencyNumber: '',
    sessionFrequency: '',
    durationPerSession: '',
    totalPlanDuration: '',
    totalPlanDurationUnit: '',
    therapyTechniques: [],
    otherTherapyTechnique: '',
    assistiveDevices: [],
    otherAssistiveDevice: '',
    patientCaregiverEducationPlan: '',
    homeExercises: '',

    // Session Tracking
    activitiesPerformed: '',
    patientResponse: '',
    progressTowardGoals: '',
    sessionNotes: '',
    nextSessionPlan: ''
  });

  // Dummy referral data
  const referralsData = [
    {
      id: 1,
      referredBy: 'Dr. Tariq',
      referredAt: '2024-01-15 10:30',
      department: 'Neurology',
      reason: 'Post-stroke speech difficulties',
      notes: 'Patient has difficulty with articulation and word finding',
      status: 'Requested'
    },
    {
      id: 2,
      referredBy: 'Dr. Yousef',
      referredAt: '2024-01-14 14:20',
      department: 'Pediatrics',
      reason: 'Delayed speech development',
      notes: 'Child shows limited vocabulary and unclear speech',
      status: 'Confirmed'
    },
    {
      id: 3,
      referredBy: 'Dr. Sarah',
      referredAt: '2024-01-13 09:45',
      department: 'ENT',
      reason: 'Voice disorder',
      notes: 'Patient experiencing hoarseness and vocal fatigue',
      status: 'Confirmed'
    }
  ];

  // Dummy speech therapy plans with nested follow-ups
  const plansData = [
    {
      id: 1,
      therapyType: 'Articulation, Language',
      totalPlanDuration: '8 weeks',
      status: 'Active',
      initiatedBy: 'Dr. Wilson',
      initiatedAt: '2024-01-10 09:00',
      followUps: [
        {
          id: 1,
          followUpBy: 'Therapist Sarah',
          followUpAt: '2024-01-17 11:00',
          activitiesPerformed: 'Articulation exercises, vocabulary building',
          patientResponse: 'Good cooperation, showing improvement',
          progressTowardGoals: 'On track',
          notes: 'Patient responding well to therapy techniques',
          nextSessionDate: '2024-01-24'
        },
        {
          id: 2,
          followUpBy: 'Therapist Ahmad',
          followUpAt: '2024-01-20 14:30',
          activitiesPerformed: 'Voice quality exercises, reading comprehension',
          patientResponse: 'Fair participation, some difficulty',
          progressTowardGoals: 'Delayed',
          notes: 'Need to adjust therapy approach',
          nextSessionDate: '2024-01-27'
        }
      ]
    },
    {
      id: 2,
      therapyType: 'Swallowing, Voice',
      totalPlanDuration: '6 weeks',
      status: 'Completed',
      initiatedBy: 'Dr. Brown',
      initiatedAt: '2024-01-05 10:15',
      followUps: [
        {
          id: 1,
          followUpBy: 'Therapist Mona',
          followUpAt: '2024-01-12 09:45',
          activitiesPerformed: 'Swallowing exercises, voice strengthening',
          patientResponse: 'Good progress in all areas',
          progressTowardGoals: 'Goal met',
          notes: 'Patient successfully completed all therapy goals',
          nextSessionDate: '2024-01-19'
        }
      ]
    },
    {
      id: 3,
      therapyType: 'Fluency, Cognitive-communication',
      totalPlanDuration: '10 weeks',
      status: 'Active',
      initiatedBy: 'Dr. Ahmed',
      initiatedAt: '2024-01-08 15:30',
      followUps: [
        {
          id: 1,
          followUpBy: 'Therapist Layla',
          followUpAt: '2024-01-15 10:00',
          activitiesPerformed: 'Fluency techniques, cognitive exercises',
          patientResponse: 'Good engagement with activities',
          progressTowardGoals: 'On track',
          notes: 'Steady progress in fluency improvement',
          nextSessionDate: '2024-01-22'
        }
      ]
    }
  ];

  // Fetch LOV (List of Values) from backend
  const { isLoading: statusTableLoading } = useGetLovValuesByCodeQuery('DIAG_ORD_STATUS');
  const { isLoading: encStatusLoading } = useGetLovValuesByCodeQuery('ENC_STATUS');
  const { isLoading: communicationModeLoading } = useGetLovValuesByCodeQuery('COMMUNICATION_MODE');
  const { isLoading: speechIntellLoading } = useGetLovValuesByCodeQuery('SPEECH_INTELL');
  const { isLoading: voiceQualityLoading } = useGetLovValuesByCodeQuery('SPEECH_VOICE_QUALITY');
  const { isLoading: fluencyLoading } = useGetLovValuesByCodeQuery('SPEECH_FLUENCY');
  const { isLoading: timeUnitLoading } = useGetLovValuesByCodeQuery('TIME_UNITS');

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
        onClick={() => console.log('View for:', rowData)}
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
      title: <Translate>Status</Translate>
    }
  ];

  // Columns for main speech therapy plans table
  const planColumns = [
    { key: 'therapyType', title: <Translate>Therapy Type</Translate> },
    { key: 'totalPlanDuration', title: <Translate>Total Plan Duration</Translate> },
    {
      key: 'status',
      title: <Translate>Status</Translate>
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
    { key: 'activitiesPerformed', title: <Translate>Activities Performed</Translate> },
    { key: 'patientResponse', title: <Translate>Patient Response</Translate> },
    { key: 'progressTowardGoals', title: <Translate>Progress Toward Goals</Translate> },
    { key: 'notes', title: <Translate>Notes</Translate> },
    { key: 'nextSessionDate', title: <Translate>Next Session Date</Translate> }
  ];

  // Return nested table configuration for each plan
  const getNestedTable = rowData =>
    rowData.followUps?.length > 0 ? { columns: followUpColumns, data: rowData.followUps } : null;

  // Modal content for initiating plan
  const initiatePlanContent = () => {
    if (
      statusTableLoading ||
      encStatusLoading ||
      communicationModeLoading ||
      speechIntellLoading ||
      voiceQualityLoading ||
      fluencyLoading ||
      timeUnitLoading
    ) {
      return (
        <div className="center-class">
          <Translate>Loading...</Translate>
        </div>
      );
    } else {
      return (
        <div className="plan-form-container">
          <Form fluid>
            <div className="section-column">
              {/* Initial Assessment Section */}
              <AssessmentSection />

              {/* Diagnosis & Goals Section */}
              <DiagnosisAndGoalsSection />

              {/* Treatment Plan */}
              <TreatmentPlan />

              {/* Session Tracking Section */}
              <SessionTrackingSection />

              {/* Attachments Section */}
              <AttachmentsSection />
            </div>
          </Form>
        </div>
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
    <>
      {/* Speech Therapy Referrals section */}
      <Panel className="section-panel">
        <div className="section-header">
          <h6 className="section-title">
            <p>Speech Therapy Referrals</p>
          </h6>
        </div>
        <MyNestedTable data={referralsData} columns={referralColumns} />
      </Panel>

      {/* <Divider /> */}

      {/* Speech Therapy Plans section */}
      <Panel className="section-panel">
        <div className="section-header">
          <h6 className="section-title">
            <p>Speech Therapy Plans</p>
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
        title="Initiate Speech Therapy Plan"
        size="80vw"
        bodyheight="75vh"
        hideActionBtn={true}
        content={initiatePlanContent}
        steps={[{ title: 'Speech Therapy Plan', icon: <FontAwesomeIcon icon={faComments} /> }]}
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
        attachmentSource={{ key: 'speech-therapy-plan' }}
        attatchmentType="SPEECH_THERAPY"
        patientKey="patient-123"
      />
    </>
  );
};

export default SpeechTherapy;
