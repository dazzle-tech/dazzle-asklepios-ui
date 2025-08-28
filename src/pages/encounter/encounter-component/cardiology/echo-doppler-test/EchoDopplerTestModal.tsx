import React, { useState, useEffect } from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStethoscope } from '@fortawesome/free-solid-svg-icons';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch, useAppSelector } from '@/hooks';
import TestInformation from './EchoSections/TestInformation';
import TechnicalQuality from './EchoSections/TechnicalQuality';
import OtherFindings from './EchoSections/OtherFindings';
import Measurements from './EchoSections/Measurements';
import DopplerValves from './EchoSections/DopplerValves';
import Conclusion from './EchoSections/Conclusion';
import ColorDopplerFindings from './EchoSections/ColorDopplerFindings';
import './style.less';

//color sliders

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

  const content = (
    <Form fluid disabled={edit}>
      <div className="sections-handle-position">
        <TestInformation
          echoTest={echoTest}
          setEchoTest={setEchoTest}
          physicians={physicians}
          usersList={usersList}
          />

        <TechnicalQuality record={record} setRecord={setRecord}></TechnicalQuality>

        <Measurements record={record} setRecord={setRecord} />

        <DopplerValves record={record} setRecord={setRecord} />
        <ColorDopplerFindings></ColorDopplerFindings>

        <OtherFindings record={record} setRecord={setRecord} rwmaOptions={rwmaOptions} />
<Conclusion
  record={record}
  setRecord={setRecord}
  usersList={usersList}
  currentUserId={authSlice?.user?.id}
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
