import React, { useEffect, useState } from 'react';
import { Panel } from 'rsuite';;
import PatientSide from '../encounter-main-info-section/PatienSide';
import { useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import Translate from '@/components/Translate';
import Allergies from './AllergiesNurse';
import Warning from './warning';
import ArowBackIcon from '@rsuite/icons/ArowBack';
import './styles.less';
import { Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import { ApEncounter } from '@/types/model-types';
import { useCompleteEncounterMutation } from '@/services/encounterService';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Tabs } from 'rsuite'
import VaccinationTab from './vaccination-tab';
import Observations from './observations/Observations';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
const EncounterPreObservations = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const propsData = location.state;
  const navigate = useNavigate();
  const [localEncounter] = useState<ApEncounter>({ ...propsData.encounter })
  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [completeEncounter] = useCompleteEncounterMutation();

 // Page header setup
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Nurse Station</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Nurse_Station'));
  dispatch(setDivContent(divContentHTML));

 // handle Complete Encounter Function
  const handleCompleteEncounter = () => {
    if (localEncounter) {
      completeEncounter(localEncounter).unwrap();
      setReadOnly(true);
    }
  };

  // Effects
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent("  "));
    };
  }, [location.pathname, dispatch])
  useEffect(() => {
    // TODO update status to be a LOV value
    if (localEncounter?.encounterStatusLkey === '91109811181900') {
      setIsEncounterStatusClosed(true);
    }
  }, [localEncounter?.encounterStatusLkey]);
  return (
    <>
      {propsData?.patient && propsData?.encounter && (
        <div className='main-box '>
          <div className='left-box'>
              <Panel>
                <div className='left-buttons-container'>
                <Form fluid layout='inline' className='left-buttons-contant'>
                    <MyButton prefixIcon={() => <ArowBackIcon />} backgroundColor={'var(--primary-gray)'} onClick={() => { navigate('/encounter-list') }}>
                      Go Back
                    </MyButton>
                    <MyButton prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />} onClick={handleCompleteEncounter} appearance='ghost'>
                      <Translate>Complete Visit</Translate>
                    </MyButton>
                  </Form>
                </div>  
                <Tabs defaultActiveKey="1" appearance="subtle">
                  <Tabs.Tab eventKey="1" title="Observations">
                    <Observations patient={propsData.patient} encounter={propsData.encounter} />
                  </Tabs.Tab>
                  <Tabs.Tab eventKey="2" title="Allergies">
                    <Allergies edit={false} patient={propsData.patient} encounter={propsData.encounter} />
                  </Tabs.Tab>
                  <Tabs.Tab eventKey="3" title="Medical Warnings">
                    <Warning edit={false} patient={propsData.patient} encounter={propsData.encounter} />
                  </Tabs.Tab>
                  <Tabs.Tab eventKey="4" title="Vaccination">
                    <VaccinationTab disabled={isEncounterStatusClosed || readOnly} patient={propsData.patient} encounter={propsData.encounter} />
                  </Tabs.Tab>
                </Tabs>
              </Panel>
            </div>
          <div className='right-box'>
            <PatientSide patient={propsData.patient} encounter={propsData.encounter} />
          </div>
        </div>
      )}
    </>
  );
};

export default EncounterPreObservations;
