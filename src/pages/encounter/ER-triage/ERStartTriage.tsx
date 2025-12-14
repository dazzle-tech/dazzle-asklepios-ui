import React, { useEffect, useState } from 'react';
import PatientSide from '../encounter-main-info-section/PatienSide';
import { useLocation } from 'react-router-dom';
import './styles.less';
import BackButton from '@/components/BackButton/BackButton';
import { useNavigate } from 'react-router-dom';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import Translate from '@/components/Translate';
import {
  useCompleteEncounterMutation,
  useGetEmergencyTriagesListQuery,
  useSaveEmergencyTriagesMutation
} from '@/services/encounterService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { Row, Col, Form, Divider, Panel } from 'rsuite';
import GeneralAssessmentTriage from './GeneralAssessmentTriage';
import ChiefComplainTriage from './ChiefComplainTriage';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import VitalSignsTriage from './VitalSignsTriage';
import { newApEmergencyTriage } from '@/types/model-types-constructor';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppSelector } from '@/hooks';
import { initialListRequest, ListRequest } from '@/types/types';
import MyLabel from '@/components/MyLabel';
import SendToModal from './SendToModal';
import { ApEncounter } from '@/types/model-types';
import SectionContainer from '@/components/SectionsoContainer';
import StartTriage from './StartTriage';
interface ERTriageProps {
  patient?: any;
  encounter?: any;
  edit?: boolean;

}

const ERStartTriage = (props:ERTriageProps) => {
  const location = useLocation();
  const patient = props.patient ?? location.state?.patient ?? {};
  const encounterData = props.encounter ?? location.state?.encounter ?? {};
  const edit = props.edit ?? location.state?.edit ?? false;
  const propsData = location.state;
  const authSlice = useAppSelector(state => state.auth);
  const navigate = useNavigate();
  const [completeEncounter, completeEncounterMutation] = useCompleteEncounterMutation();
  const [saveTriage, saveTriageMutation] = useSaveEmergencyTriagesMutation();
  const dispatch = useAppDispatch();
  const [isHiddenFields, setIsHiddenFields] = useState(false);
  const [emergencyTriage, setEmergencyTriage] = useState<any>({ ...newApEmergencyTriage });
  const [refetchPatientObservations, setRefetchPatientObservations] = useState(false);
  const [openSendToModal, setOpenSendToModal] = useState(false);
  const [patientPriority, setPatientPriority] = useState({ key: '' });
  const [encounter, setEncounter] = useState<ApEncounter>({ ...encounterData });
  const YES_KEY = '1476229927081534';
  const NO_KEY = '1476240934233400';

  // Initialize list request with default filters
  const [triageListRequest, setTriageListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key
      },
      {
        fieldName: 'encounter_key',
        operator: 'match',
        value:encounter?.key
      }
    ]
  });
  // Fetch the list of Chief Complain based on the provided request, and provide a refetch function
  const {
    data: triageResponse,
    refetch,
    isLoading
  } = useGetEmergencyTriagesListQuery(triageListRequest);
  // Fetch LOV data for various fields
  const { data: sizeLovQueryResponse } = useGetLovValuesByCodeQuery('SIZE');
  const { data: booleanLovQuery } = useGetLovValuesByCodeQuery('BOOLEAN');
  const { data: painScoreLovQuery } = useGetLovValuesByCodeQuery('NUMBERS');
  const { data: levelOfConscLovQuery } = useGetLovValuesByCodeQuery('LEVEL_OF_CONSC');
  const { data: emergencyLevelLovQuery } = useGetLovValuesByCodeQuery('EMERGENCY_LEVEL');
  const { data: patientPriorityLov } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');
  // Find the selected emergency level object from the list based on the selected key
  const selectedEmergencyLevel = (emergencyLevelLovQuery?.object ?? []).find(
    item => item.key === emergencyTriage?.emergencyLevelLkey
  );

  // Header setup
  const divContent = (
    "ER Start Triage"
  );
  dispatch(setPageCode('Start_Triage'));
  dispatch(setDivContent(divContent));

  // handle Complete Encounter Function
  const handleCompleteEncounter = async () => {
    try {
      await completeEncounter(propsData.encounter).unwrap();
      dispatch(notify({ msg: 'Completed Successfully', sev: 'success' }));
    } catch (error) {
      console.error('Encounter completion error:', error);
      dispatch(notify({ msg: 'An error occurred while completing the encounter', sev: 'error' }));
    }
  };
  // handle Save Triage Function
  const handleSave = async () => {
    //  TODO convert key to code
    try {
      if (emergencyTriage.key === undefined) {
        await saveTriage({
          ...emergencyTriage,
          patientKey: patient?.key,
          encounterKey: encounterData?.key,
          createdBy: authSlice.user.key
        }).unwrap();
        refetch();
        dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
      } else {
        await saveTriage({
          ...emergencyTriage,
          patientKey: patient?.key,
          encounterKey: encounterData?.key,
          updatedBy: authSlice.user.key
        }).unwrap();
        dispatch(notify({ msg: ' Updated Successfully', sev: 'success' }));
        refetch();
      }
    } catch (error) {
      console.error('Error saving ', error);
      dispatch(notify({ msg: 'Failed to Save ', sev: 'error' }));
    }
  };

  // Effects
  // Effects
  useEffect(() => {
    if (saveTriageMutation && saveTriageMutation.status === 'fulfilled') {
      setEmergencyTriage(saveTriageMutation.data);
      setEncounter({ ...encounter, emergencyLevelLkey: emergencyTriage?.emergencyLevelLkey });
    }
  }, [saveTriageMutation]);
  // Effects

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);
  useEffect(() => {
    if (triageResponse?.object?.length === 1) {
      setEmergencyTriage(triageResponse.object[0]);
    }
  }, [triageResponse]);
  useEffect(() => {
    let newLevel = null;
    const YES_KEY = '1476229927081534';
    const criticalPainKeys = [
      '3108900351014435',
      '3108904932420860',
      '3108911826984089',
      '3108917698391821'
    ];

    if (
      emergencyTriage.lifeSavingLkey === YES_KEY ||
      emergencyTriage.unresponsiveLkey === YES_KEY
    ) {
      newLevel = '6859764100147954'; // critical
    } else if (
      emergencyTriage.highRiskLkey === YES_KEY ||
      emergencyTriage.avpuScaleLkey === '6044173055578557' ||
      (emergencyTriage.painScoreLkey && criticalPainKeys.includes(emergencyTriage.painScoreLkey))
    ) {
      newLevel = '6859787815891749'; // serious
    } else if (
      emergencyTriage.highRiskLkey != null &&
      emergencyTriage.avpuScaleLkey != null &&
      emergencyTriage.painScoreLkey != null &&
      emergencyTriage.highRiskLkey !== YES_KEY &&
      emergencyTriage.avpuScaleLkey !== '6044173055578557' &&
      !['3108900351014435', '3108904932420860', '3108911826984089', '3108917698391821'].includes(
        emergencyTriage.painScoreLkey
      )
    ) {
      setIsHiddenFields(true);
      const YES_KEY = '1476229927081534';

      const selectedServices = [
        emergencyTriage.labsLkey,
        emergencyTriage.imagingLkey,
        emergencyTriage.ivFluidsLkey,
        emergencyTriage.medicationLkey,
        emergencyTriage.ecgLkey,
        emergencyTriage.consultationLkey
      ];

      const count = selectedServices.filter(value => value === YES_KEY).length;
      if (count >= 2) {
        newLevel = '6859815212595414'; // high
      } else if (count === 1) {
        newLevel = '6859834949140744'; // medium
      } else {
        newLevel = '6859862840597358'; // low
      }
    }

    if (newLevel && newLevel !== emergencyTriage.emergencyLevelLkey) {
      setEmergencyTriage(prev => ({ ...prev, emergencyLevelLkey: newLevel }));
    }
  }, [
    emergencyTriage.lifeSavingLkey,
    emergencyTriage.unresponsiveLkey,
    emergencyTriage.highRiskLkey,
    emergencyTriage.avpuScaleLkey,
    emergencyTriage.painScoreLkey,
    emergencyTriage.labsLkey,
    emergencyTriage.imagingLkey,
    emergencyTriage.ivFluidsLkey,
    emergencyTriage.medicationLkey,
    emergencyTriage.ecgLkey,
    emergencyTriage.consultationLkey
  ]);
  useEffect(() => {
    setEncounter({ ...propsData?.encounter });
  }, [propsData]);
  return (
    <div className="er-main-container">
      <div className="left-box">
       <StartTriage
          patient={patient}
          encounter={encounter}
          sourcePage={"Emergency"}
          // edit={edit}
        />
      </div>
      <div className="right-box">
        <PatientSide
          patient={patient}
          encounter={encounterData}
          refetchList={refetchPatientObservations}
        />
      </div>
      <SendToModal
        open={openSendToModal}
        setOpen={setOpenSendToModal}
        encounter={encounter}
        triage={emergencyTriage}
      />
    </div>
  );
};

export default ERStartTriage;
