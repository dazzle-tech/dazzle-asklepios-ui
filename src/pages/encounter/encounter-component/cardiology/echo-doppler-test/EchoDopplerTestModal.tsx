import React, { useState, useEffect } from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStethoscope } from '@fortawesome/free-solid-svg-icons';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Checkbox, RadioGroup, Radio } from 'rsuite';
import Section from '@/components/Section';
import { Slider } from 'rsuite';
import './style.less';

//color sliders
const getRegurgitationColor = (value: number): string => {
  switch (value) {
    case 0:
      return '#28a745';
    case 1:
      return '#FFD700';
    case 2:
      return '#FFA500';
    case 3:
      return '#FF8C00';
    case 4:
      return '#FF0000';
    default:
      return 'transparent';
  }
};

const ColorDopplerFindings = () => {
  const [regurgitation, setRegurgitation] = useState({
    aortic: 0,
    mitral: 0,
    tricuspid: 0,
    pulmonic: 0
  });

  const getRegurgitationColor = (value: number): string => {
    switch (value) {
      case 0:
        return '#28a745';
      case 1:
        return '#FFD700';
      case 2:
        return '#FFA500';
      case 3:
        return '#FF8C00';
      case 4:
        return '#FF0000';
      default:
        return 'transparent';
    }
  };

  const renderSlider = (label: string, valve: 'aortic' | 'mitral' | 'tricuspid' | 'pulmonic') => (
    <div className="slider-wrapper" key={valve}>
      <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>{label}</label>
      <Slider
        min={0}
        max={4}
        step={1}
        value={regurgitation[valve]}
        onChange={value => setRegurgitation(prev => ({ ...prev, [valve]: value }))}
        progress
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          height: '7px',
          width: `${(regurgitation[valve] / 4) * 100}%`,
          backgroundColor: getRegurgitationColor(regurgitation[valve]),
          transform: 'translateY(-50%)',
          zIndex: 1,
          transition: 'background-color 0.2s ease',
          borderRadius: '4px'
        }}
      />
      <div
        style={{
          marginTop: '8px',
          fontStyle: 'italic',
          color: getRegurgitationColor(regurgitation[valve])
        }}
      >
        {['None', 'Trace', 'Mild', 'Moderate', 'Severe'][regurgitation[valve]]}
      </div>
    </div>
  );

  return (
    <>
      {renderSlider('Aortic Regurgitation Severity', 'aortic')}
      {renderSlider('Mitral Regurgitation Severity', 'mitral')}
      {renderSlider('Tricuspid Regurgitation Severity', 'tricuspid')}
      {renderSlider('Pulmonic Regurgitation Severity', 'pulmonic')}
    </>
  );
};

// Dummy initial object for now
const defaultEchoDoppler = {
  testDate: '',
  testType: '',
  result: ''
};

interface RecordType {
  LVEDD?: number;
  LVEF?: number;
  pericardialEffusion?: string;
}

const rwmaOptions = [
  { RwmaValue: 'Normal', value: 'Normal' },
  { RwmaValue: 'Hypokinesia', value: 'Hypokinesia' },
  { RwmaValue: 'Akinesia', value: 'Akinesia' },
  { RwmaValue: 'Dyskinesia', value: 'Dyskinesia' },
  { RwmaValue: 'Aneurysm (per segment)', value: 'Aneurysm' }
];

const EchoDopplerTestModal = ({
  open,
  setOpen,
  patient,
  encounter,
  echoTestObject,
  refetch,
  edit
}) => {
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const [echoTest, setEchoTest] = useState({
    indication: '',
    indicationOther: ''
  });

  const [record, setRecord] = useState<RecordType & { diastolicDysfunctionGrade?: number }>({
    LVEDD: undefined,
    LVEF: undefined,
    pericardialEffusion: '',
    diastolicDysfunctionGrade: 0
  });

  //LOV Api's
  const { data: echoIndicationsLov } = useGetLovValuesByCodeQuery('ECHO_INDICATIONS');
  const { data: echoTypesLov } = useGetLovValuesByCodeQuery('ECHO_TYPES');
  const { data: patientPositionLov } = useGetLovValuesByCodeQuery('PAT_POSITION');

  const otherIndicationKey = echoIndicationsLov?.object?.find(
    item => item.lovDisplayVale?.toLowerCase() === 'other'
  )?.key;
  useEffect(() => {
    setEchoTest({ ...echoTestObject });
  }, [echoTestObject]);
  const handleClearField = () => {
    setEchoTest({ ...defaultEchoDoppler });
  };
  const handleSave = async () => {
    try {
      // TODO: Replace this with real save API when ready
      console.log('Saving Echo Doppler Test:', {
        ...echoTest,
        patientKey: patient?.key,
        encounterKey: encounter?.key,
        createdBy: authSlice?.user?.key
      });

      dispatch(notify({ msg: 'Echo Doppler Test Saved Successfully', sev: 'success' }));
      setOpen(false);
      handleClearField();
      refetch?.();
    } catch (error) {
      console.error('Error saving echo doppler test:', error);
      dispatch(notify({ msg: 'Failed to save Echo Doppler Test', sev: 'error' }));
    }
  };

  const physicians = [
    { id: 'p1', fullName: 'Dr. Ahmed Ali' },
    { id: 'p2', fullName: 'Dr. Sara Hassan' },
    { id: 'p3', fullName: 'Dr. Omar Khaled' }
  ];
  const usersList = [
    { id: 'u1', fullName: 'Technician John' },
    { id: 'u2', fullName: 'Operator Layla' },
    { id: 'u3', fullName: 'Technician Mike' }
  ];

  const getDiastolicDysfunctionColor = (grade: number): string => {
    switch (grade) {
      case 0:
        return '#28a745';
      case 1:
        return '#FFD700';
      case 2:
        return '#FFA500';
      case 3:
        return '#FF0000';
      default:
        return 'transparent';
    }
  };

  const content = (
    <Form fluid disabled={edit}>
      <div className="sections-handle-position">
        <Section
          title="Test Information"
          content={
            <>
              <div className="handle-inputs-positions-size">
                <MyInput
                  width={200}
                  fieldType="select"
                  fieldLabel="Indication"
                  fieldName="indication"
                  selectData={echoIndicationsLov?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={echoTest}
                  setRecord={setEchoTest}
                />

                {echoTest?.indication === otherIndicationKey && (
                  <MyInput
                    width={300}
                    fieldType="text"
                    fieldLabel="Other Indication"
                    fieldName="indicationOther"
                    placeholder="Please specify"
                    record={echoTest}
                    setRecord={setEchoTest}
                  />
                )}
                <MyInput
                  width={200}
                  fieldType="select"
                  fieldLabel="Echo Type"
                  fieldName="echoType"
                  selectData={echoTypesLov?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={echoTest}
                  setRecord={setEchoTest}
                />
                <MyInput
                  width={300}
                  fieldType="select"
                  fieldLabel="Referring Physician"
                  fieldName="referringPhysician"
                  selectData={physicians}
                  selectDataLabel="fullName"
                  selectDataValue="id"
                  record={echoTest}
                  setRecord={setEchoTest}
                />
                <MyInput
                  width={300}
                  fieldType="select"
                  fieldLabel="Technician/Operator Name"
                  fieldName="technicianName"
                  selectData={usersList}
                  selectDataLabel="fullName"
                  selectDataValue="id"
                  record={echoTest}
                  setRecord={setEchoTest}
                />
              </div>
            </>
          }
        />
        <Section
          title="Technical Quality"
          content={
            <>
              <div className="handle-inputs-positions-size-coulmn">
                <MyInput
                  width={300}
                  fieldType="select"
                  fieldLabel="Patient Position"
                  fieldName="patientPosition"
                  selectData={patientPositionLov?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={record}
                  setRecord={setRecord}
                />
                <RadioGroup
                  name="imageQuality"
                  value={record?.imageQuality ?? ''}
                  onChange={value => setRecord({ ...record, imageQuality: value })}
                >
                  {' '}
                  <label>Image Quality</label>
                  <div className='radio-buttons-position-handle'>
                  <Radio value="Excellent">Excellent</Radio>
                  <Radio value="Good">Good</Radio>
                  <Radio value="Fair">Fair</Radio>
                  <Radio value="Poor">Poor</Radio></div>
                </RadioGroup>
              </div>
            </>
          }
        />

        <Section
          title="Measurements – M-mode / 2D"
          content={
            <>
              <div className="handle-inputs-positions-size">
                <div className='for-right-adons-position-align'>
                <MyInput
                  fieldLabel="LVEDD (LV End-Diastolic Diameter)"
                  fieldName="LVEDD"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  required
                  width={200}
                  inputColor={
                    (record?.LVEDD < 30 || record?.LVEDD > 70) && record?.LVEDD !== 0
                      ? 'danger'
                      : ''
                  }
                  rightAddon="mm"
                  rightAddonwidth='auto'
                />

                <MyInput
                  fieldLabel="LVESD (LV End-Systolic Diameter)"
                  fieldName="LVESD"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  required
                  rightAddon="mm"
                  rightAddonwidth='auto'
                  width={200}
                />
                <MyInput
                  fieldLabel="IVS Thickness (Diastole)"
                  fieldName="IVSThickness"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  required
                  rightAddon="mm"
                  rightAddonwidth='auto'
                  width={200}
                />
                <MyInput
                  fieldLabel="Posterior Wall Thickness (Diastole)"
                  fieldName="posteriorWallThickness"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  required
                  rightAddon="mm"
                  rightAddonwidth='auto'
                  width={200}
                />
                <MyInput
                  fieldLabel="LVEF"
                  fieldName="LVEF"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  required
                  width={200}
                  rightAddon="%"
                  rightAddonwidth='auto'
                  inputColor={
                    (record?.LVEF < 10 || record?.LVEF > 90) && record?.LVEF !== undefined
                      ? 'danger'
                      : ''
                  }
                />

                <MyInput
                  fieldLabel="LV Mass Index"
                  fieldName="LVMassIndex"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  required
                  rightAddon="g/m²"
                  rightAddonwidth='auto'
                  width={200}
                />
                <MyInput
                  fieldLabel="LA Diameter"
                  fieldName="LADiameter"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  required
                  rightAddon="mm"
                  rightAddonwidth='auto'
                  width={200}
                />
                <MyInput
                  fieldLabel="RA Area"
                  fieldName="RAArea"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  required
                  rightAddon="cm²"
                  rightAddonwidth='auto'
                  width={200}
                />
                <MyInput
                  fieldLabel="RV Diameter"
                  fieldName="RVDiameter"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  required
                  rightAddon="mm"
                  rightAddonwidth='auto'
                  width={200}
                />
                <MyInput
                  fieldLabel="Ascending Aorta Diameter"
                  fieldName="ascendingAortaDiameter"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  required
                  rightAddon="mm"
                  rightAddonwidth='auto'
                  width={200}
                />
              </div></div>
            </>
          }
        />
        <Section
          title="Doppler – Valves"
          content={
            <>
              <div className="handle-inputs-positions-size">
              <div className='for-right-adons-position-align'>
                <MyInput
                  fieldLabel="Aortic Valve Peak Velocity"
                  fieldName="aorticValvePeakVelocity"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  width={200}
                  rightAddon="m/s"
                  rightAddonwidth='auto'
                />
                <MyInput
                  fieldLabel="Aortic Valve Mean Gradient"
                  fieldName="aorticValveMeanGradient"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  width={180}
                  rightAddon="mmHg"
                  rightAddonwidth='auto'
                />
                <MyInput
                  fieldLabel="Aortic Valve Area"
                  fieldName="aorticValveArea"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  width={200}
                  rightAddon="cm²"
                  rightAddonwidth='auto'
                />
                <MyInput
                  fieldLabel="Mitral Valve E Velocity"
                  fieldName="mitralValveEVelocity"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  width={200}
                  rightAddon="m/s"
                  rightAddonwidth='auto'
                />
                <MyInput
                  fieldLabel="Mitral Valve A Velocity"
                  fieldName="mitralValveAVelocity"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  width={200}
                  rightAddon="m/s"
                  rightAddonwidth='auto'
                />
                <MyInput
                  fieldLabel="E/A Ratio"
                  fieldName="eaRatio"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  width={200}
                  rightAddon="ratio"
                  rightAddonwidth='auto'
                />
                <MyInput
                  fieldLabel="Mitral Valve Deceleration Time"
                  fieldName="mitralValveDecelerationTime"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  width={200}
                  rightAddon="ms"
                  rightAddonwidth='auto'
                />
                <MyInput
                  fieldLabel="Mitral Valve Area"
                  fieldName="mitralValveArea"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  width={200}
                  rightAddon="cm²"
                  rightAddonwidth='auto'
                />
                <MyInput
                  fieldLabel="Tricuspid Regurgitation Peak Velocity"
                  fieldName="tricuspidRegurgitationPeakVelocity"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  width={200}
                  rightAddon="m/s"
                  rightAddonwidth='auto'
                />
                <MyInput
                  fieldLabel="Estimated PASP"
                  fieldName="estimatedPASP"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  width={180}
                  rightAddon="mmHg"
                  rightAddonwidth='auto'
                />
                <MyInput
                  fieldLabel="Pulmonic Valve Peak Velocity"
                  fieldName="pulmonicValvePeakVelocity"
                  fieldType="number"
                  record={record}
                  setRecord={setRecord}
                  width={480}
                  rightAddon="m/s"
                  rightAddonwidth='auto'
                />
              </div></div>
            </>
          }
        />
        <Section title="Color Doppler Findings" content={<div className='color-dopler-findings-position'><ColorDopplerFindings /></div>} />
        <Section
          title="Other Findings"
          content={
            <>
              <div className="handle-other-findings-positions-sort">
                <RadioGroup
                  name="pericardialEffusion"
                  value={record?.pericardialEffusion ?? ''}
                  onChange={value => setRecord({ ...record, pericardialEffusion: value })}
                >
                  <label>Pericardial Effusion</label>
                  <div className='radio-buttons-position-handle'>
                  <Radio value="None">None</Radio>
                  <Radio value="Small">Small</Radio>
                  <Radio value="Moderate">Moderate</Radio>
                  <Radio value="Large">Large</Radio></div>
                </RadioGroup>

                <MyInput
                  width="100%"
                  fieldType="checkPicker"
                  fieldName="rwma"
                  record={record}
                  setRecord={setRecord}
                  fieldLabel="RWMA"
                  selectData={rwmaOptions}
                  selectDataLabel="RwmaValue"
                  selectDataValue="value"
                  searchable

                />

                <div style={{ position: 'relative', marginLeft: '1.5vw' }}>
                  <label style={{ fontWeight: 'bold', marginBottom: '0', display: 'block' }}>
                    LV Diastolic Dysfunction Grade
                  </label>
                  <Slider
                    min={0}
                    max={3}
                    step={1}
                    value={record.diastolicDysfunctionGrade ?? 0}
                    onChange={value => setRecord({ ...record, diastolicDysfunctionGrade: value })}
                    progress
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '24%',
                      left: 0,
                      height: '7px',
                      width: `${((record.diastolicDysfunctionGrade ?? 0) / 3) * 100}%`,
                      backgroundColor: getDiastolicDysfunctionColor(
                        record.diastolicDysfunctionGrade ?? 0
                      ),
                      transform: 'translateY(-50%)',
                      zIndex: 1,
                      transition: 'background-color 0.2s ease',
                      borderRadius: '4px'
                    }}
                  />
                  <div
                    style={{
                      marginTop: '8px',
                      fontStyle: 'italic',
                      color: getDiastolicDysfunctionColor(record.diastolicDysfunctionGrade ?? 0)
                    }}
                  >
                    {
                      ['Normal', 'Grade I', 'Grade II', 'Grade III'][
                        record.diastolicDysfunctionGrade ?? 0
                      ]
                    }
                  </div>
                </div>

                <MyInput
                  fieldLabel="Additional Notes"
                  fieldName="additionalNotes"
                  fieldType="textarea"
                  rows={4}
                  width="100%"
                  record={record}
                  setRecord={setRecord}
                />
              </div>
            </>
          }
        />
        <Section
          title="Conclusion"
          content={
            <>
              <div className="handle-inputs-positions-size">
                <MyInput
                  fieldLabel="Final Impression"
                  fieldName="finalImpression"
                  fieldType="textarea"
                  rows={4}
                  width="100%"
                  record={record}
                  setRecord={setRecord}
                />

                <MyInput
                  fieldLabel="Recommendation"
                  fieldName="recommendation"
                  fieldType="textarea"
                  rows={4}
                  width="100%"
                  record={record}
                  setRecord={setRecord}
                />

                <MyInput
                  width={300}
                  fieldType="select"
                  fieldLabel="Cardiologist Name & Signature"
                  fieldName="cardiologistName"
                  selectData={usersList}
                  selectDataLabel="fullName"
                  selectDataValue="id"
                  record={record}
                  setRecord={setRecord}
                />
              </div>
            </>
          }
        />
      </div>
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add/Edit Echo Doppler Test"
      actionButtonFunction={handleSave}
      position="center"
      isDisabledActionBtn={edit}
      size="70vw"
      steps={[
        {
          title: 'Echo Doppler',
          icon: <FontAwesomeIcon icon={faStethoscope} />,
          footer: (
            <MyButton appearance="ghost" onClick={handleClearField}>
              Clear
            </MyButton>
          )
        }
      ]}
      content={content}
    />
  );
};

export default EchoDopplerTestModal;
