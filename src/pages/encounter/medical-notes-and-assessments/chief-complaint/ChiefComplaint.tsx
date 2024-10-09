import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import React, { useEffect, useState } from 'react';
import { IconButton, Input, Panel, Grid, Row, Col, InputGroup, Modal, Button } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import { newApEncounter } from '@/types/model-types-constructor';
import { useSaveEncounterChangesMutation } from '@/services/encounterService';
import VoiceCitation from '@/components/VoiceCitation';
const ChiefComplaint = () => {
  const patientSlice = useAppSelector(state => state.patient);
  const dispatch = useAppDispatch();

  const [localEncounter, setLocalEncounter] = useState({ ...newApEncounter });

  const [saveEncounterChanges, saveEncounterChangesMutation] = useSaveEncounterChangesMutation();

  const [chiefComplaintTextAreaOpen, setChiefComplaintTextAreaOpen] = useState(false);
  const [hpiSummaryTextAreaOpen, setHpiSummaryTextAreaOpen] = useState(false);
  const [pastMedicalHistoryTextAreaOpen, setPastMedicalHistoryTextAreaOpen] = useState(false);
  const [progressNoteTextAreaOpen, setProgressNoteTextAreaOpen] = useState(false);

  useEffect(() => {
    if (patientSlice.encounter && patientSlice.encounter.key) {
      setLocalEncounter(patientSlice.encounter);
    } else {
    }
  }, []);

  const saveChanges = () => {
    saveEncounterChanges(localEncounter).unwrap();
  };

  useEffect(() => {
    if (saveEncounterChangesMutation.status === 'fulfilled') {
      dispatch(setEncounter(saveEncounterChangesMutation.data));
      setLocalEncounter(saveEncounterChangesMutation.data);
    }
  }, [saveEncounterChangesMutation]);

  const chiefComplaintIsChanged = () => {
    return patientSlice.encounter.chiefComplaint !== localEncounter.chiefComplaint;
  };
  const hpiSummaryIsChanged = () => {
    return patientSlice.encounter.hpiSummery !== localEncounter.hpiSummery;
  };
  const pastMedicalHistoryIsChanged = () => {
    return (
      patientSlice.encounter.pastMedicalHistorySummery !== localEncounter.pastMedicalHistorySummery
    );
  };
  const progressNoteIsChanged = () => {
    return patientSlice.encounter.progressNote !== localEncounter.progressNote;
  };

  return (
    <>
      {/* Chief Complaint Text Area Modal */}
      <Modal open={chiefComplaintTextAreaOpen} onClose={() => setChiefComplaintTextAreaOpen(false)}>
        <Modal.Header>
          <Modal.Title>
            <Translate>Chief Complaint</Translate>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <VoiceCitation
            originalRecord={patientSlice.encounter}
            record={localEncounter}
            setRecord={setLocalEncounter}
            fieldName="chiefComplaint"
            saveMethod={saveChanges}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setChiefComplaintTextAreaOpen(false)} appearance="primary">
            OK
          </Button>
        </Modal.Footer>
      </Modal>

      {/* HPI Text Area Modal */}
      <Modal open={hpiSummaryTextAreaOpen} onClose={() => setHpiSummaryTextAreaOpen(false)}>
        <Modal.Header>
          <Modal.Title>
            <Translate>HPI</Translate>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <VoiceCitation
            originalRecord={patientSlice.encounter}
            record={localEncounter}
            setRecord={setLocalEncounter}
            fieldName="hpiSummery"
            saveMethod={saveChanges}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setHpiSummaryTextAreaOpen(false)} appearance="primary">
            OK
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Past Medical Historyu Text Area Modal */}
      <Modal
        open={pastMedicalHistoryTextAreaOpen}
        onClose={() => setPastMedicalHistoryTextAreaOpen(false)}
      >
        <Modal.Header>
          <Modal.Title>
            <Translate>Past Medical History</Translate>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <VoiceCitation
            originalRecord={patientSlice.encounter}
            record={localEncounter}
            setRecord={setLocalEncounter}
            fieldName="pastMedicalHistorySummery"
            saveMethod={saveChanges}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setPastMedicalHistoryTextAreaOpen(false)} appearance="primary">
            OK
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Progress Note Text Area Modal */}
      <Modal open={progressNoteTextAreaOpen} onClose={() => setProgressNoteTextAreaOpen(false)}>
        <Modal.Header>
          <Modal.Title>
            <Translate>Progress Note</Translate>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <VoiceCitation
            originalRecord={patientSlice.encounter}
            record={localEncounter}
            setRecord={setLocalEncounter}
            fieldName="progressNote"
            saveMethod={saveChanges}
            rows={12}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setProgressNoteTextAreaOpen(false)} appearance="primary">
            OK
          </Button>
        </Modal.Footer>
      </Modal>

      <Panel bordered style={{ padding: '10px', margin: '5px' }}>
        <Grid fluid>
          <Row gutter={15}>
            <Col xs={4}>
              <label>
                <Translate>Chief Complaint</Translate>
              </label>
            </Col>
            <Col xs={16}>
              <InputGroup>
                <InputGroup.Addon>
                  {!chiefComplaintIsChanged() && <icons.CheckRound color="green" />}
                  {chiefComplaintIsChanged() && <icons.Gear spin />}
                </InputGroup.Addon>
                <Input
                  value={localEncounter.chiefComplaint}
                  onChange={e => setLocalEncounter({ ...localEncounter, chiefComplaint: e })}
                  onBlur={chiefComplaintIsChanged() ? saveChanges : undefined}
                />
              </InputGroup>
            </Col>
            <Col xs={2}>
              <IconButton disabled icon={<icons.List />} />
            </Col>
            <Col xs={2}>
              <IconButton
                onClick={() => setChiefComplaintTextAreaOpen(true)}
                icon={<icons.Others />}
              />
            </Col>
          </Row>
          <Row gutter={15}>
            <Col xs={4}>
              <label>
                <Translate>HPI</Translate>
              </label>
            </Col>
            <Col xs={16}>
              <InputGroup>
                <InputGroup.Addon>
                  {!hpiSummaryIsChanged() && <icons.CheckRound color="green" />}
                  {hpiSummaryIsChanged() && <icons.Gear spin />}
                </InputGroup.Addon>
                <Input
                  value={localEncounter.hpiSummery}
                  onChange={e => setLocalEncounter({ ...localEncounter, hpiSummery: e })}
                  onBlur={hpiSummaryIsChanged() ? saveChanges : undefined}
                />
              </InputGroup>
            </Col>
            <Col xs={2}>
              <IconButton icon={<icons.List />} />
            </Col>
            <Col xs={2}>
              <IconButton onClick={() => setHpiSummaryTextAreaOpen(true)} icon={<icons.Others />} />
            </Col>
          </Row>
          <Row gutter={15}>
            <Col xs={4}>
              <label>
                <Translate>History</Translate>
              </label>
            </Col>
            <Col xs={16}>
              <InputGroup>
                <InputGroup.Addon>
                  {!pastMedicalHistoryIsChanged() && <icons.CheckRound color="green" />}
                  {pastMedicalHistoryIsChanged() && <icons.Gear spin />}
                </InputGroup.Addon>
                <Input
                  value={localEncounter.pastMedicalHistorySummery}
                  onChange={e =>
                    setLocalEncounter({ ...localEncounter, pastMedicalHistorySummery: e })
                  }
                  onBlur={pastMedicalHistoryIsChanged() ? saveChanges : undefined}
                />
              </InputGroup>
            </Col>
            <Col xs={2}>
              <IconButton icon={<icons.List />} />
            </Col>
            <Col xs={2}>
              <IconButton
                onClick={() => setPastMedicalHistoryTextAreaOpen(true)}
                icon={<icons.Others />}
              />
            </Col>
          </Row>
          <Row gutter={15}>
            <Col xs={4}>
              <label>
                <Translate>Progress Note</Translate>
              </label>
            </Col>
            <Col xs={16}>
              <InputGroup>
                <InputGroup.Addon>
                  {!progressNoteIsChanged() && <icons.CheckRound color="green" />}
                  {progressNoteIsChanged() && <icons.Gear spin />}
                </InputGroup.Addon>
                <Input
                  as={'textarea'}
                  rows={8}
                  value={localEncounter.progressNote}
                  onChange={e => setLocalEncounter({ ...localEncounter, progressNote: e })}
                  onBlur={progressNoteIsChanged() ? saveChanges : undefined}
                />
              </InputGroup>
            </Col>
            <Col xs={2}>
              <IconButton icon={<icons.List />} />
            </Col>
            <Col xs={2}>
              <IconButton
                onClick={() => setProgressNoteTextAreaOpen(true)}
                icon={<icons.Others />}
              />
            </Col>
          </Row>
        </Grid>
      </Panel>
    </>
  );
};

export default ChiefComplaint;
