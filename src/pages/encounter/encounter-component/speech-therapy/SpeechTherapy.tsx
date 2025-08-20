import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import { Form, Panel, Slider, Divider, Checkbox, RadioGroup, Radio } from 'rsuite';
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
  faCalendarDays,
  faComments,
  faBrain,
  faUserNurse
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

const SpeechTherapy = () => {
  // State initialization
  const location = useLocation();
  const propsData = location.state;
  const [refetchAttachmentList, setRefetchAttachmentList] = useState(false);

  const [width, setWidth] = useState(window.innerWidth);
  const [initiatePlanModalOpen, setInitiatePlanModalOpen] = useState(false);
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({});
  const [showCanceled, setShowCanceled] = useState(true);
  const [progressNotes, setProgressNotes] = useState([]);

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

  // Custom slider color functions
  const getSwallowingColor = value => {
    switch (value) {
      case 0:
        return '#28a745';
      case 1:
        return '#ffc107';
      case 2:
        return '#fd7e14';
      case 3:
        return '#dc3545';
      default:
        return '#28a745';
    }
  };

  const getSwallowingLabel = value => {
    switch (value) {
      case 0:
        return 'Normal';
      case 1:
        return 'Mild';
      case 2:
        return 'Moderate';
      case 3:
        return 'Severe';
      default:
        return 'Normal';
    }
  };

  const getPrognosisLabel = value => {
    switch (value) {
      case 0:
        return 'Excellent';
      case 1:
        return 'Good';
      case 2:
        return 'Fair';
      case 3:
        return 'Poor';
      default:
        return 'Excellent';
    }
  };

  // Fetch LOV (List of Values) from backend
  const { data: statusTableLovQueryResponse, isLoading: statusTableLoading } =
    useGetLovValuesByCodeQuery('DIAG_ORD_STATUS');
  const { data: encStatusLovQueryResponse, isLoading: encStatusLoading } =
    useGetLovValuesByCodeQuery('ENC_STATUS');
  const { data: communicationModeLovQueryResponse, isLoading: communicationModeLoading } =
    useGetLovValuesByCodeQuery('COMMUNICATION_MODE');
  const { data: speechIntellLovQueryResponse, isLoading: speechIntellLoading } =
    useGetLovValuesByCodeQuery('SPEECH_INTELL');
  const { data: voiceQualityLovQueryResponse, isLoading: voiceQualityLoading } =
    useGetLovValuesByCodeQuery('SPEECH_VOICE_QUALITY');
  const { data: fluencyLovQueryResponse, isLoading: fluencyLoading } =
    useGetLovValuesByCodeQuery('SPEECH_FLUENCY');
  const { data: timeUnitLovQueryResponse, isLoading: timeUnitLoading } =
    useGetLovValuesByCodeQuery('TIME_UNITS');

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

  // Assessment tools options
  const assessmentToolsOptions = [
    { value: 'GFTA', label: 'GFTA' },
    { value: 'CELF', label: 'CELF' },
    { value: 'Western Aphasia Battery', label: 'Western Aphasia Battery' },
    { value: 'Boston Naming Test', label: 'Boston Naming Test' },
    { value: 'Other', label: 'Other' }
  ];

  // Therapy type options
  const therapyTypeOptions = [
    { value: 'Articulation', label: 'Articulation' },
    { value: 'Language', label: 'Language' },
    { value: 'Voice', label: 'Voice' },
    { value: 'Fluency', label: 'Fluency' },
    { value: 'Cognitive-communication', label: 'Cognitive-communication' },
    { value: 'Swallowing', label: 'Swallowing' }
  ];

  // Therapy techniques options
  const therapyTechniquesOptions = [
    { value: 'Oral motor exercises', label: 'Oral motor exercises' },
    { value: 'Breath support', label: 'Breath support' },
    { value: 'Phonation drills', label: 'Phonation drills' },
    { value: 'AAC training', label: 'AAC training' },
    { value: 'Swallowing maneuvers', label: 'Swallowing maneuvers' },
    { value: 'Voice therapy', label: 'Voice therapy' }
  ];

  // Assistive devices options
  const assistiveDevicesOptions = [
    { value: 'AAC device', label: 'AAC device' },
    { value: 'Communication board', label: 'Communication board' },
    { value: 'Voice amplifier', label: 'Voice amplifier' },
    { value: 'Other', label: 'Other' }
  ];

  // Functional communication level options
  const functionalCommLevelOptions = [
    { value: 'Independent', label: 'Independent' },
    { value: 'Minimal assistance', label: 'Minimal assistance' },
    { value: 'Moderate assistance', label: 'Moderate assistance' },
    { value: 'Dependent', label: 'Dependent' }
  ];

  // Modal content for initiating plan
  const initiatePlanContent = activeStep => {
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
    }

    if (activeStep === 0) {
      return (
        <div className="plan-form-container">
          <Form fluid>
            <div className="section-column">
              {/* Initial Assessment Section */}
              <Section
                title={
                  <>
                    <FontAwesomeIcon icon={faComments} className="font-small" />
                    <p className="font-small">Initial Assessment</p>
                  </>
                }
                content={
                  <>
                    <div className="goals-container goal">
                      <MyInput
                        fieldName="dateOfAssessment"
                        fieldType="date"
                        fieldLabel="Date of Assessment"
                        record={planData}
                        setRecord={setPlanData}
                        width={200}
                      />
                      <MyInput
                        fieldName="primaryCommunicationMode"
                        fieldType="select"
                        fieldLabel="Primary Communication Mode"
                        record={planData}
                        setRecord={setPlanData}
                        selectData={communicationModeLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        width={230}
                        searchable={false}
                      />
                      <MyInput
                        fieldName="speechIntelligibility"
                        fieldType="select"
                        fieldLabel="Speech Intelligibility"
                        record={planData}
                        setRecord={setPlanData}
                        selectData={speechIntellLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        width={200}
                        searchable={false}
                      />
                      <MyInput
                        fieldName="voiceQuality"
                        fieldType="select"
                        fieldLabel="Voice Quality"
                        record={planData}
                        setRecord={setPlanData}
                        selectData={voiceQualityLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        width={200}
                        searchable={false}
                      />
                      <MyInput
                        fieldName="fluency"
                        fieldType="select"
                        fieldLabel="Fluency"
                        record={planData}
                        setRecord={setPlanData}
                        selectData={fluencyLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        width={200}
                        searchable={false}
                      />
                    </div>

                    <div className="goals-container">
                      <div className="language-assessment goal">
                        <MyLabel label={<p className="bolddd">Language Assessment</p>} />

                        <div className="toggles-container goal">
                          <MyInput
                            fieldName="languageReceptive"
                            fieldType="checkbox"
                            checkedLabel="normal"
                            unCheckedLabel="impaired"
                            fieldLabel="Receptive"
                            record={planData}
                            setRecord={setPlanData}
                            width={90}
                          />
                          <MyInput
                            fieldName="languageExpressive"
                            fieldType="checkbox"
                            checkedLabel="normal"
                            unCheckedLabel="impaired"
                            fieldLabel="Expressive"
                            record={planData}
                            setRecord={setPlanData}
                            width={90}
                          />

                          {/* Swallowing Function Slider */}
                          <div className="slider-container margin-1">
                            <MyLabel label={<p className="bolddd">Swallowing Function</p>} />
                            <div className="custom-slider">
                              <Slider
                                value={planData.swallowingFunction}
                                onChange={value =>
                                  setPlanData(prev => ({ ...prev, swallowingFunction: value }))
                                }
                                min={0}
                                max={3}
                                step={1}
                                progress
                              />
                              <div
                                className="sliders-class"
                                style={{
                                  top: '3px',
                                  width: `${(planData.swallowingFunction / 3) * 100}%`,
                                  backgroundColor: getSwallowingColor(planData.swallowingFunction)
                                }}
                              />
                              <span className="slider-label">
                                {getSwallowingLabel(planData.swallowingFunction)}
                              </span>
                            </div>
                          </div>

                          <MyInput
                            fieldName="functionalCommunicationLevel"
                            fieldType="select"
                            fieldLabel="Functional Communication Level"
                            record={planData}
                            setRecord={setPlanData}
                            selectData={functionalCommLevelOptions}
                            selectDataLabel="label"
                            selectDataValue="value"
                            width={200}
                            searchable={false}
                          />
                          <MyInput
                            fieldName="articulation"
                            fieldType="textarea"
                            fieldLabel="Articulation"
                            record={planData}
                            setRecord={setPlanData}
                            width={200}
                            height={40}
                          />
                          <MyInput
                            fieldName="patientFamilyConcerns"
                            fieldType="textarea"
                            fieldLabel="Patient/Family Concerns"
                            record={planData}
                            setRecord={setPlanData}
                            width={200}
                            height={40}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="goals-container">
                      <div className="assessment-tools">
                        <MyLabel label={<p className="bolddd">Assessment Tools Used</p>} />

                        <div className="checkbox-item">
                          {assessmentToolsOptions.map(option => (
                            <div key={option.value}>
                              <Checkbox
                                checked={planData.assessmentTools.includes(option.value)}
                                onChange={(value, checked) => {
                                  if (checked) {
                                    setPlanData(prev => ({
                                      ...prev,
                                      assessmentTools: [...prev.assessmentTools, option.value]
                                    }));
                                  } else {
                                    setPlanData(prev => ({
                                      ...prev,
                                      assessmentTools: prev.assessmentTools.filter(
                                        item => item !== option.value
                                      )
                                    }));
                                  }
                                }}
                              >
                                {option.label}
                              </Checkbox>
                            </div>
                          ))}
                          {planData.assessmentTools.includes('Other') && (
                            <MyInput
                              fieldName="otherAssessmentTool"
                              fieldType="text"
                              fieldLabel=""
                              record={planData}
                              setRecord={setPlanData}
                              width={300}
                              className="margin-buttom-2"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                }
              />

              {/* Diagnosis & Goals Section */}
              <Section
                title={
                  <>
                    <FontAwesomeIcon icon={faBullseye} className="font-small" />
                    <p className="font-small">Diagnosis & Goals</p>
                  </>
                }
                content={
                  <>
                    <div className="goals-container">
                      <MyInput
                        fieldName="shortTermGoals"
                        fieldType="textarea"
                        fieldLabel="Short-Term Goals"
                        record={planData}
                        setRecord={setPlanData}
                        width={400}
                        rows={4}
                      />
                      <MyInput
                        fieldName="longTermGoals"
                        fieldType="textarea"
                        fieldLabel="Long-Term Goals"
                        record={planData}
                        setRecord={setPlanData}
                        width={400}
                        rows={4}
                      />

                      {/* Prognosis Slider */}
                      <div className="slider-container">
                        <MyLabel label={<p className="bolddd">Prognosis</p>} />
                        <div className="custom-slider">
                          <Slider
                            value={planData.prognosis}
                            onChange={value => setPlanData(prev => ({ ...prev, prognosis: value }))}
                            min={0}
                            max={3}
                            step={1}
                            progress
                          />
                          <div
                            className="sliders-class"
                            style={{
                              top: '3px',
                              width: `${(planData.prognosis / 3) * 100}%`,
                              backgroundColor: getSwallowingColor(planData.prognosis)
                            }}
                          />
                          <span className="slider-label">
                            {getPrognosisLabel(planData.prognosis)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                }
              />
            </div>

            {/* Treatment Plan and Session Tracking Section */}
            <div className="section-column">
              <Section
                title={
                  <>
                    <FontAwesomeIcon icon={faClipboardList} className="font-small" />
                    <p className="font-small">Treatment Plan</p>
                  </>
                }
                content={
                  <>
                    <div className="goals-container">
                      <div className="therapy-type">
                        <label>
                          <Translate>Therapy Type</Translate>
                        </label>
                        <div className="checkbox-item">
                          {therapyTypeOptions.map(option => (
                            <div key={option.value}>
                              <Checkbox
                                checked={planData.therapyType.includes(option.value)}
                                onChange={(value, checked) => {
                                  if (checked) {
                                    setPlanData(prev => ({
                                      ...prev,
                                      therapyType: [...prev.therapyType, option.value]
                                    }));
                                  } else {
                                    setPlanData(prev => ({
                                      ...prev,
                                      therapyType: prev.therapyType.filter(
                                        item => item !== option.value
                                      )
                                    }));
                                  }
                                }}
                              >
                                {option.label}
                              </Checkbox>
                            </div>
                          ))}
                        </div>
                      </div>

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

                      <div className="flexs-class-no-gap">
                        <MyInput
                          fieldName="totalPlanDuration"
                          fieldType="number"
                          fieldLabel="Total Plan Duration"
                          record={planData}
                          setRecord={setPlanData}
                          width={120}
                        />
                        <div className="margin-class">
                          <MyInput
                            fieldName="totalPlanDurationUnit"
                            fieldType="select"
                            fieldLabel=""
                            record={planData}
                            setRecord={setPlanData}
                            selectData={timeUnitLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            width={120}
                            searchable={false}
                          />
                        </div>
                      </div>

                      <div className="flexs-class-no-gap">
                        <MyInput
                          fieldName="sessionFrequencyNumber"
                          fieldType="number"
                          fieldLabel="Session Frequency"
                          record={planData}
                          setRecord={setPlanData}
                          width={120}
                        />
                        <div className="margin-class">
                          <MyInput
                            fieldName="sessionFrequency"
                            fieldType="select"
                            fieldLabel=""
                            record={planData}
                            setRecord={setPlanData}
                            selectData={timeUnitLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            width={120}
                            searchable={false}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="goals-container">
                      <div className="goals-container">
                        <div className="therapy-techniques">
                          <label>
                            <Translate>Therapy Techniques</Translate>
                          </label>
                          <div className="checkbox-item">
                            {therapyTechniquesOptions.map(option => (
                              <div key={option.value}>
                                <Checkbox
                                  checked={planData.therapyTechniques.includes(option.value)}
                                  onChange={(value, checked) => {
                                    if (checked) {
                                      setPlanData(prev => ({
                                        ...prev,
                                        therapyTechniques: [...prev.therapyTechniques, option.value]
                                      }));
                                    } else {
                                      setPlanData(prev => ({
                                        ...prev,
                                        therapyTechniques: prev.therapyTechniques.filter(
                                          item => item !== option.value
                                        )
                                      }));
                                    }
                                  }}
                                >
                                  {option.label}
                                </Checkbox>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="goals-container">
                        <div className="assistive-devices">
                          <label>
                            <Translate>Assistive Devices Needed</Translate>
                          </label>

                          <div className="checkbox-item">
                            {assistiveDevicesOptions.map(option => (
                              <div key={option.value}>
                                <Checkbox
                                  checked={planData.assistiveDevices.includes(option.value)}
                                  onChange={(value, checked) => {
                                    if (checked) {
                                      setPlanData(prev => ({
                                        ...prev,
                                        assistiveDevices: [...prev.assistiveDevices, option.value]
                                      }));
                                    } else {
                                      setPlanData(prev => ({
                                        ...prev,
                                        assistiveDevices: prev.assistiveDevices.filter(
                                          item => item !== option.value
                                        )
                                      }));
                                    }
                                  }}
                                >
                                  {option.label}
                                </Checkbox>
                              </div>
                            ))}

                            {planData.assistiveDevices.includes('Other') && (
                              <MyInput
                                fieldName="otherAssistiveDevice"
                                fieldType="text"
                                fieldLabel=""
                                record={planData}
                                setRecord={setPlanData}
                                width={300}
                                className="margin-buttom-2"
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      <MyInput
                        fieldName="patientCaregiverEducationPlan"
                        fieldType="textarea"
                        fieldLabel="Patient/Caregiver Education Plan"
                        record={planData}
                        setRecord={setPlanData}
                        width={500}
                        rows={4}
                      />

                      <MyInput
                        fieldName="homeExercises"
                        fieldType="textarea"
                        fieldLabel="Home Exercises"
                        record={planData}
                        setRecord={setPlanData}
                        width={500}
                        rows={4}
                      />
                    </div>
                  </>
                }
              />

              {/* Session Tracking Section */}
              <Section
                title={
                  <>
                    <FontAwesomeIcon icon={faBrain} className="font-small" />
                    <p className="font-small">Session Tracking</p>
                  </>
                }
                content={
                  <>
                    <div className="goals-container">
                      <MyInput
                        fieldName="activitiesPerformed"
                        fieldType="text"
                        fieldLabel="Activities Performed"
                        record={planData}
                        setRecord={setPlanData}
                        width={400}
                        rows={3}
                      />

                      <div className="radio-group-container">
                        <label>
                          <Translate>Patient Response</Translate>
                        </label>
                        <RadioGroup
                          name="patientResponse"
                          value={planData.patientResponse}
                          onChange={value =>
                            setPlanData(prev => ({ ...prev, patientResponse: value }))
                          }
                          inline
                        >
                          <Radio value="Good">Good</Radio>
                          <Radio value="Fair">Fair</Radio>
                          <Radio value="Poor">Poor</Radio>
                        </RadioGroup>
                      </div>

                      <div className="radio-group-container">
                        <label>
                          <Translate>Progress Toward Goals</Translate>
                        </label>
                        <RadioGroup
                          name="progressTowardGoals"
                          value={planData.progressTowardGoals}
                          onChange={value =>
                            setPlanData(prev => ({ ...prev, progressTowardGoals: value }))
                          }
                          inline
                        >
                          <Radio value="On track">On track</Radio>
                          <Radio value="Delayed">Delayed</Radio>
                          <Radio value="Goal met">Goal met</Radio>
                        </RadioGroup>
                      </div>

                      <MyInput
                        fieldName="sessionNotes"
                        fieldType="textarea"
                        fieldLabel="Notes"
                        record={planData}
                        setRecord={setPlanData}
                        width={400}
                        rows={4}
                      />

                      <MyInput
                        fieldName="nextSessionPlan"
                        fieldType="date"
                        fieldLabel="Next Session Plan"
                        record={planData}
                        setRecord={setPlanData}
                        width={200}
                      />
                    </div>
                  </>
                }
              />

              {/* Attachments section */}
              <Section
                title={
                  <>
                    <FontAwesomeIcon icon={faPaperclip} className="font-small" />
                    <p className="font-small">Attachments</p>
                  </>
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

      <Divider />

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
