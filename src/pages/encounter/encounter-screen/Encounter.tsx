import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { ApPatient } from '@/types/model-types';
import { newApPatient } from '@/types/model-types-constructor';
import { Block, Check, DocPass, Edit, Icon, PlusRound } from '@rsuite/icons';
import Consultation from '../encounter-component/consultation';
import DiagnosticsOrder from '../encounter-component/diagnostics-order';
import DiagnosticsResult from '../encounter-component/diagnostics-result/DiagnosticsResult';
import MedicationsRecord from '../encounter-component/medications-record';
import PatientHistory from '../encounter-component/patient-history';
import PatientSummary from '../encounter-component/patient-summary';
import Prescription from '../encounter-component/prescription';
import Referrals from '../encounter-component/referrals';
import SOAP from '../encounter-component/s.o.a.p';
import VaccineReccord from '../encounter-component/vaccine-reccord';
import Allergies from '../encounter-component/allergies';
import React, { useEffect, useState } from 'react';
import {
  InputGroup,
  ButtonToolbar,
  FlexboxGrid,
  Form,
  IconButton,
  Input,
  Panel,
  Stack,
  List,
  Divider,
  Drawer,
  Table,
  Pagination,
  Button,
  Grid,
  Row,
  Col,
  Checkbox,
  SelectPicker,
  Sidenav, Nav, Toggle
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import { initialListRequest } from '@/types/types';
import { useGetDepartmentsQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useNavigate } from 'react-router-dom';
import Dental from '../dental-screen';
import {
  useCompleteEncounterMutation,
  useStartEncounterMutation
} from '@/services/encounterService';
import { BlockUI } from 'primereact/blockui';
import MedicalNotesAndAssessments from '../medical-notes-and-assessments';
import EncounterServices from '../encounter-services';
import EncounterMainInfoSection from '../encounter-main-info-section';
import CloseIcon from '@rsuite/icons/Close';
import Allergens from '@/pages/setup/allergens-setup';
const Encounter = () => {
  const encounterStatusNew = '91063195286200'; // TODO change this to be fetched from redis based on LOV CODE
  const patientSlice = useAppSelector(state => state.patient);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [startEncounter, startEncounterMutation] = useStartEncounterMutation();
  const [completeEncounter, completeEncounterMutation] = useCompleteEncounterMutation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeContent, setActiveContent] = useState(<PatientSummary/>);
  const handleMenuItemClick = (content) => {
    setActiveContent(content);
    setIsDrawerOpen(false); // Optionally close the drawer after selection
  };
  useEffect(() => {
    if (!patientSlice.encounter) {
      navigate('/encounter-list');
    }
  }, []);

  const handleGoBack = () => {
    dispatch(setEncounter(null));
    dispatch(setPatient(null));
    navigate('/encounter-list');
  };

  const handleStartEncounter = () => {
    if (patientSlice.encounter && patientSlice.encounter.editable) {
      startEncounter(patientSlice.encounter).unwrap();
    }
  };

  useEffect(() => {
    if (startEncounterMutation.status === 'fulfilled') {
      dispatch(setEncounter(startEncounterMutation.data));
    }
  }, [startEncounterMutation]);

  const handleCompleteEncounter = () => {
    if (patientSlice.encounter) {
      completeEncounter(patientSlice.encounter).unwrap();
    }
  };

  useEffect(() => {
    if (completeEncounterMutation.status === 'fulfilled') {
      navigate('/encounter-list');
    }
  }, [completeEncounterMutation]);

  return (
    <>
      {patientSlice.patient && patientSlice.encounter && (
        <BlockUI
          blocked={patientSlice.encounter.encounterStatusLkey === encounterStatusNew}
          template={
            <IconButton
              onClick={handleStartEncounter}
              size="lg"
              appearance="primary"
              color="cyan"
              icon={<icons.ArrowRight />}
            >
              <Translate>Start Encounter</Translate>
            </IconButton>
          }
        >
          <Panel header={<EncounterMainInfoSection patient={patientSlice.patient} encounter={patientSlice.encounter} />}>
            <Panel>
              <ButtonToolbar>
                <IconButton
                  appearance="primary"
                  color="violet"
                  icon={<icons.ArrowLeft />}
                  onClick={handleGoBack}
                >
                  <Translate>Go Back</Translate>
                </IconButton>
                
                <IconButton
                  appearance="primary"
                  color="blue"
                  icon={<icons.Menu />}
                  onClick={() => setIsDrawerOpen(true)}
                >
                  <Translate>Encounter  Menu</Translate>
                </IconButton>
                <IconButton appearance="primary" color="cyan" icon={<icons.ReviewRefuse />}>
                  <Translate>Problems</Translate>
                </IconButton>
                
                {patientSlice.encounter.editable && (
                  <IconButton
                    appearance="primary"
                    icon={<icons.CloseOutline />}
                    onClick={handleCompleteEncounter}
                  >
                    <Translate>Complete Visit (Close)</Translate>
                  </IconButton>
                )}
              </ButtonToolbar>
              <Divider />
              <Drawer
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                placement='left'
               
                style={{ width: '240px' }}
              >
                <Drawer.Header>
                  <Drawer.Title> Encounter Menu</Drawer.Title>
                </Drawer.Header>
                <Drawer.Body style={{ padding:'10px'}}>
                <List hover style={{ width: '100%', margin: 0 }}>
      <List.Item onClick={() => handleMenuItemClick(<PatientSummary/>)}>
        <Translate>Patient Summary</Translate>
      </List.Item>
      <List.Item onClick={() => handleMenuItemClick(<SOAP/>) }>
        <Translate>S.O.A.P</Translate>
      </List.Item>
      <List.Item onClick={() => handleMenuItemClick(<DiagnosticsOrder/>) }>
        <Translate>Diagnostics Order</Translate>
      </List.Item>
      <List.Item onClick={() => handleMenuItemClick(<Prescription/>) }>
        <Translate>Prescription</Translate>
      </List.Item>
      <List.Item onClick={() => handleMenuItemClick(<Consultation/>) }>
        <Translate>Consultation</Translate>
      </List.Item>
      <List.Item onClick={() => handleMenuItemClick(<Referrals/>) }>
        <Translate>Referrals</Translate>
      </List.Item>
      <List.Item onClick={() => handleMenuItemClick(<PatientHistory/>) }>
        <Translate>Patient History</Translate>
      </List.Item>
      <List.Item onClick={() => handleMenuItemClick(<Allergies/>) }>
        <Translate>Allergies</Translate>
      </List.Item>
      <List.Item onClick={() => handleMenuItemClick(<MedicationsRecord/>) }>
        <Translate>Medical Warnings</Translate>
      </List.Item>
      <List.Item onClick={() => handleMenuItemClick(<MedicationsRecord/>) }>
        <Translate>Medications Record</Translate>
      </List.Item>
      <List.Item onClick={() => handleMenuItemClick(<VaccineReccord/>) }>
        <Translate>Vaccine Reccord</Translate>
      </List.Item>
      <List.Item onClick={() => handleMenuItemClick(<DiagnosticsResult/>) }>
        <Translate>Diagnostics Result</Translate>
      </List.Item>
    </List>
                </Drawer.Body>
               
              </Drawer>
              {activeContent} {/* Render the selected content */}
              {/* <Tabs>
                <TabList>
                  <Tab>Medical Notes & Assessments</Tab>
                  <Tab>Dental</Tab>
                  <Tab>Applied Services</Tab>
                  <Tab>Diagnostic Orders</Tab>
                  <Tab>Prescription</Tab>
                  <Tab>Diagnostics Results</Tab>
                  <Tab>Medication Chart</Tab>
                </TabList>
                <TabPanel>
                 //Medical Notes & Assessments Tab 
                  <MedicalNotesAndAssessments />
                </TabPanel>
                <TabPanel>
                  // Dental Tab 
                  <Dental disabled={!patientSlice.encounter.editable} />
                </TabPanel>
                <TabPanel>
                  // Encounter Services Tab 
                  <EncounterServices />
                </TabPanel>
                <TabPanel></TabPanel>
                <TabPanel></TabPanel>
                <TabPanel></TabPanel>
                <TabPanel></TabPanel>
              </Tabs> */}
            </Panel>
          </Panel>
        </BlockUI>
      )}
    </>
  );
};

export default Encounter;
