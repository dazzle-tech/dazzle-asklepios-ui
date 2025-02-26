import React, { useEffect, useState } from 'react';
import { Panel } from 'rsuite';
import EncounterMainInfoSection from '../encounter-main-info-section';
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
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import VaccinationTab from './vaccination-tab';
import Observations from './observations/Observations';
const EncounterPreObservations = () => {
  const location = useLocation();
  const propsData = location.state;
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();
  const [localEncounter, setLocalEncounter] = useState<ApEncounter>({ ...propsData.encounter })
  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [completeEncounter, completeEncounterMutation] = useCompleteEncounterMutation();
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
  return (
    <>
      {propsData?.patient && propsData?.encounter && (
        <div >
          <h4>Nurse Station</h4>
          <Panel header={<EncounterMainInfoSection patient={propsData.patient} encounter={propsData.encounter} />}>
          </Panel>

          <Panel>
            <Tabs
              selectedIndex={activeTab}
              onSelect={(index) => setActiveTab(index)}
            >
              <TabList style={{ display: 'flex' }}>
                <Tab>
                  <Translate>Observations</Translate>
                </Tab>
                <Tab>
                  <Translate>Allergies</Translate>
                </Tab>
                <Tab>
                  <Translate>Medical Warnings</Translate>
                </Tab>
                <Tab>
                  <Translate>Vaccination</Translate>
                </Tab>

                <Tab>
                  <Translate>Patient History </Translate>
                </Tab>

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
              </TabList>
              <TabPanel>
              {activeTab === 0 && <Observations  patient={propsData.patient} encounter={propsData.encounter} />}  
              </TabPanel>
              <TabPanel>
                {activeTab === 1 && <Allergies edit={false} patient={propsData.patient} encounter={propsData.encounter} />}
              </TabPanel>
              <TabPanel>
          {activeTab === 2&& <Warning edit={false} patient={propsData.patient} encounter={propsData.encounter} />}
        </TabPanel>
        <TabPanel>
          {activeTab === 3&& <VaccinationTab   disabled={isEncounterStatusClosed || readOnly} patient={propsData.patient} encounter={propsData.encounter} />}
        </TabPanel>
            </Tabs>
          </Panel>
        </div>
      )}
    </>
  );
};

export default EncounterPreObservations;
