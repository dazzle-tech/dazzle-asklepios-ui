import React, { useEffect, useState, useRef } from 'react';
import { Panel, Divider } from 'rsuite';
import PatientSide from '../encounter-main-info-section/PatienSide';
import { useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import Translate from '@/components/Translate';
import Allergies from './AllergiesNurse';
import { Check } from '@rsuite/icons';
import BlockIcon from '@rsuite/icons/Block';
import Warning from './warning';
import './styles.less';
import MyButton from '@/components/MyButton/MyButton';
import { useCompleteEncounterMutation } from '@/services/encounterService';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Tabs } from 'rsuite';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import BackButton from '@/components/BackButton/BackButton';
import PatientHistory from '../encounter-component/patient-history';
import { notify } from '@/utils/uiReducerActions';
import PatientAttachment from '@/pages/patient/patient-profile/tabs/Attachment';
import InpatientObservations from './observations/InpatientObservations';
import PainAssessment from '../encounter-component/pain-assessment/PainAssessment';
import ReviewOfSystems from '../medical-notes-and-assessments/review-of-systems';
import ChiefComplain from '../encounter-component/chief-complain/ChiefComplain';
import GeneralAssessment from '../encounter-component/general-assessment';
import MedicationReconciliation from '../encounter-component/MedicationReconciliation/MedicationReconciliation';
import FunctionalAssessment from '../encounter-component/functional-assessment';
import Repositioning from '../encounter-component/repositioning';
import Encounter from '../encounter-screen';
import EncounterDischarge from '../encounter-component/encounter-discharge/EncounterDischarge';
import PhysicianOrderSummary from '../encounter-component/physician-order-summary/physician-order-summary-component';
import WoundCareDocumentation from '../encounter-component/wound-care-documentation';
import MyTab from '@/components/MyTab';
const InpatientNurseStation = ({}) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const propsData = location.state;
  const navigate = useNavigate();
  const [localEncounter] = useState<any>({ ...propsData.encounter });
  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [activeKey, setActiveKey] = useState<string | number>('1');
  const [completeEncounter] = useCompleteEncounterMutation();
  const [openDischargeModal, setOpenDischargeModal] = useState(false);
  const [refetchAttachmentList, setRefetchAttachmentList] = useState(false);
  // Page header setup
  const divContent = 'Nurse Anamnesis';
  dispatch(setPageCode('Nurse_Station'));
  dispatch(setDivContent(divContent));

  const handleCompleteEncounter = async () => {
    try {
      if (localEncounter) {
        await completeEncounter(localEncounter).unwrap();
        dispatch(notify({ msg: 'Completed Successfully', sev: 'success' }));
      }
      setReadOnly(true);
    } catch (error) {
      console.error('Encounter completion error:', error);
      dispatch(notify({ msg: 'An error occurred while completing the encounter', sev: 'error' }));
    }
  };

  // Effects
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);
  useEffect(() => {
    // TODO update status to be a LOV value
    if (localEncounter?.encounterStatusLkey === '91109811181900') {
      setIsEncounterStatusClosed(true);
    }
  }, [localEncounter?.encounterStatusLkey]);

  const obsRef = useRef(null);
  const handleSaveObsarvationClick = () => {
    obsRef.current?.handleSave();
  };
  const handleClearObsarvationClick = () => {
    obsRef.current?.handleClear();
  };

  const tabData = [
    {
      title: 'Observations',
      content: (
        <InpatientObservations
          editable={propsData.edit}
          localPatient={propsData.patient}
          localEncounter={propsData.encounter}
        />
      )
    },
    {
      title: 'Allergies',
      content: (
        <Allergies
          edit={propsData.edit}
          patient={propsData.patient}
          encounter={propsData.encounter}
        />
      )
    },
    {
      title: 'Medical Warnings',
      content: (
        <Warning
          edit={propsData.edit}
          patient={propsData.patient}
          encounter={propsData.encounter}
        />
      )
    },
    { title: 'Patient History', content: <PatientHistory /> },
    {
      title: 'Attachments',
      content: (
        <PatientAttachment
          localPatient={propsData?.patient}
          setRefetchAttachmentList={setRefetchAttachmentList}
          refetchAttachmentList={refetchAttachmentList}
        />
      )
    },
    {
      title: 'Chief Complain',
      content: (
        <ChiefComplain
          edit={propsData.edit}
          patient={propsData.patient}
          encounter={propsData.encounter}
        />
      )
    },
    {
      title: 'Physical Examination',
      content: (
        <ReviewOfSystems
          edit={propsData.edit}
          patient={propsData.patient}
          encounter={propsData.encounter}
        />
      )
    },
    {
      title: 'Pain Assessment',
      content: (
        <PainAssessment
          edit={propsData.edit}
          patient={propsData.patient}
          encounter={propsData.encounter}
        />
      )
    },
    {
      title: 'General Assessment',
      content: (
        <GeneralAssessment
          edit={propsData.edit}
          patient={propsData.patient}
          encounter={propsData.encounter}
        />
      )
    },
    {
      title: 'Functional Assessment',
      content: (
        <FunctionalAssessment
          edit={propsData.edit}
          patient={propsData.patient}
          encounter={propsData.encounter}
        />
      )
    },
    {
      title: 'Repositioning',
      content: (
        <Repositioning
          edit={propsData.edit}
          patient={propsData.patient}
          encounter={propsData.encounter}
        />
      )
    },
    {
      title: 'Medication Reconciliation',
      content: (
        <MedicationReconciliation
          edit={propsData.edit}
          patient={propsData.patient}
          encounter={propsData.encounter}
        />
      )
    },
    { title: 'Physician Order Summary', content: <PhysicianOrderSummary /> },
    { title: 'Wound Care Documentation', content: <WoundCareDocumentation /> }
  ];
  return (
    <>
      {propsData?.patient && propsData?.encounter && (
        <div className="main-box ">
          <div className="left-box">
            <Panel>
              <div className="left-buttons-container">
                <BackButton
                  onClick={() => {
                    if (localEncounter?.resourceTypeLvalue?.valueCode == 'BRT_INPATIENT') {
                      navigate('/inpatient-encounters-list');
                    } else {
                      navigate('/encounter-list');
                    }
                  }}
                />
                <div className="left-buttons-contant">
                  {/* TODO update status to be a LOV value */}
                  {!localEncounter.discharge &&
                    localEncounter.encounterStatusLkey !== '91109811181900' && (
                      <MyButton
                        prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                        onClick={() =>
                          localEncounter?.resourceTypeLvalue?.valueCode == 'BRT_INPATIENT'
                            ? setOpenDischargeModal(true)
                            : handleCompleteEncounter()
                        }
                        appearance="ghost"
                      >
                        <Translate>
                          {localEncounter?.resourceTypeLvalue?.valueCode == 'BRT_INPATIENT'
                            ? 'Discharge'
                            : 'Complete Visit'}
                        </Translate>
                      </MyButton>
                    )}
                  {activeKey == '1' && <Divider vertical />}
                  {activeKey == '1' && (
                    <MyButton
                      appearance="ghost"
                      onClick={handleClearObsarvationClick}
                      prefixIcon={() => <BlockIcon />}
                    >
                      Clear
                    </MyButton>
                  )}
                  {activeKey == '1' && (
                    <MyButton prefixIcon={() => <Check />} onClick={handleSaveObsarvationClick}>
                      Save
                    </MyButton>
                  )}
                </div>
              </div>
              <MyTab data={tabData} activeTab={activeKey} setActiveTab={setActiveKey} />
            </Panel>
          </div>
          <div className="right-box">
            <PatientSide patient={propsData.patient} encounter={propsData.encounter} />
          </div>
          <EncounterDischarge
            open={openDischargeModal}
            setOpen={setOpenDischargeModal}
            encounter={propsData.encounter}
          />
        </div>
      )}
    </>
  );
};

export default InpatientNurseStation;
