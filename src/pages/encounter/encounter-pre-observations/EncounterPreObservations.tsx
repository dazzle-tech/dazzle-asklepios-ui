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
import { ApEncounter } from '@/types/model-types';
import { useCompleteEncounterMutation } from '@/services/encounterService';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Tabs } from 'rsuite';
import VaccinationTab from './vaccination-tab';
import Observations from './observations/Observations';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import BackButton from '@/components/BackButton/BackButton';
import PreviousMeasurements from './previous-measurements';

const EncounterPreObservations = ({}) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const propsData = location.state;
  const navigate = useNavigate();
  const [localEncounter] = useState<ApEncounter>({ ...propsData.encounter });
  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [activeKey, setActiveKey] = useState<string | number>('1');
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
  return (
    <>
      {propsData?.patient && propsData?.encounter && (
        <div className="main-box ">
          <div className="left-box">
            <Panel>
              <div className="left-buttons-container">
                <BackButton
                  onClick={() => {
                    navigate('/encounter-list');
                  }}
                />
                <div className="left-buttons-contant">
                  <MyButton
                    prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                    onClick={handleCompleteEncounter}
                    appearance="ghost"
                  >
                    <Translate>Complete Visit</Translate>
                  </MyButton>
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
              <Tabs activeKey={activeKey} onSelect={setActiveKey} appearance="subtle">
                <Tabs.Tab eventKey="1" title="Observations">
                  <Observations
                  edit={propsData.edit}
                    ref={obsRef}
                    patient={propsData.patient}
                    encounter={propsData.encounter}
                  />
                </Tabs.Tab>
                <Tabs.Tab eventKey="2" title="Allergies">
                  <Allergies
                    edit={propsData.edit}
                    patient={propsData.patient}
                    encounter={propsData.encounter}
                  />
                </Tabs.Tab>
                <Tabs.Tab eventKey="3" title="Medical Warnings">
                  <Warning
                    edit={propsData.edit}
                    patient={propsData.patient}
                    encounter={propsData.encounter}
                  />
                </Tabs.Tab>
                <Tabs.Tab eventKey="4" title="Vaccination">
                  <VaccinationTab
                    edit={propsData.edit}
                    disabled={isEncounterStatusClosed || readOnly}
                    patient={propsData.patient}
                    encounter={propsData.encounter}
                  />
                </Tabs.Tab>
                <Tabs.Tab eventKey="5" title="Previous Measurements">
                  <PreviousMeasurements
                    patient={propsData.patient}
                  />
                </Tabs.Tab>
              </Tabs>
            </Panel>
          </div>
          <div className="right-box">
            <PatientSide patient={propsData.patient} encounter={propsData.encounter} />
          </div>
        </div>
      )}
    </>
  );
};

export default EncounterPreObservations;
