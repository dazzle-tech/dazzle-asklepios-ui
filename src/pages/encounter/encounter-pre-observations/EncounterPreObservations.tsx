import React, { useEffect, useState } from 'react';
import { Panel } from 'rsuite';
import EncounterMainInfoSection from '../encounter-main-info-section';
import PatientSide from '../encounter-main-info-section/PatienSide';
import { useAppSelector, useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import Allergies from './AllergiesNurse';
import Warning from './warning';
import './styles.less';
import { Block, Check, DocPass, Edit, History, Icon, PlusRound, Detail } from '@rsuite/icons';
import {
  FlexboxGrid,
  IconButton,
  Input,
  Table,
  Grid,
  Row,
  Col,
  ButtonToolbar,
  Text,
  InputGroup,
  SelectPicker,
  Form
} from 'rsuite';

import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import BlockIcon from '@rsuite/icons/Block';
import { notify } from '@/utils/uiReducerActions';
import {
  useGetObservationSummariesQuery,
  useRemoveObservationSummaryMutation,
  useSaveObservationSummaryMutation
} from '@/services/observationService';
import {
  useGetEncountersQuery,
  useCompleteEncounterRegistrationMutation
} from '@/services/encounterService';
import {
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import {
  ApEncounter,
  ApPatientObservationSummary
} from '@/types/model-types';
import {
  newApPatientObservationSummary
} from '@/types/model-types-constructor';
import {
  useCompleteEncounterMutation,

} from '@/services/encounterService';
import { ApPatient } from '@/types/model-types';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import { useLocation } from 'react-router-dom';
import { initialListRequest, ListRequest } from '@/types/types';
import { useNavigate } from 'react-router-dom';
import { Tab, TabList, TabPanel } from 'react-tabs';
import { Tabs, Placeholder } from 'rsuite'
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
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();
  const [localEncounter, setLocalEncounter] = useState<ApEncounter>({ ...propsData.encounter })
  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [completeEncounter, completeEncounterMutation] = useCompleteEncounterMutation();
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Nurse Station</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Nurse_Station'));
  dispatch(setDivContent(divContentHTML));
  // TODO update status to be a LOV value
  useEffect(() => {
    if (localEncounter?.encounterStatusLkey === '91109811181900') {
      setIsEncounterStatusClosed(true);
    }
  }, [localEncounter?.encounterStatusLkey]);

  const handleCompleteEncounter = () => {
    if (localEncounter) {
      completeEncounter(localEncounter).unwrap();
      setReadOnly(true);
    }
  };
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent("  "));
    };
  }, [location.pathname, dispatch])
  return (
    <>
      {propsData?.patient && propsData?.encounter && (
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flexGrow: '4', borderRadius: '5px', border: '1px solid var(--background-gray)',minWidth:'1170px' }}>
            <div >
              <Panel >
              </Panel>

              <Panel>
                <Form fluid layout='inline' style={{ display: 'flex', zoom: .8 }}>
                  <ButtonToolbar style={{ marginLeft: 'auto' }}>
                    <IconButton
                      appearance="primary"
                      disabled={isEncounterStatusClosed || readOnly}
                      color="cyan"
                      icon={<CloseOutlineIcon />}
                      onClick={() => { handleCompleteEncounter() }}
                    >
                      <Translate>Complete Visit</Translate>
                    </IconButton>
                    <IconButton
                      appearance="primary"
                      color="blue"
                      icon={<CloseOutlineIcon />}
                      onClick={() => { navigate('/encounter-list') }}
                    >
                      <Translate>Close</Translate>
                    </IconButton>
                  </ButtonToolbar>
                </Form>

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
            </div></div>
          <div style={{ flexGrow: '1', borderRadius: '5px', border: '1px solid var(--background-gray)' }}>
            <PatientSide patient={propsData.patient} encounter={propsData.encounter} />
          </div>
        </div>
      )}
    </>
  );
};

export default EncounterPreObservations;
