import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import React, { useEffect, useState } from 'react';
import {
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { IconButton, Input, Panel, Grid, Row, Col, InputGroup, Modal, Button, Toggle, Form } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import { newApEncounter } from '@/types/model-types-constructor';
import { useSaveEncounterChangesMutation } from '@/services/encounterService';
import VoiceCitation from '@/components/VoiceCitation';
import './styles.less';
const ChiefComplaint = () => {
  const patientSlice = useAppSelector(state => state.patient);
  const dispatch = useAppDispatch();
  const { data: painPatternLovQueryResponse } = useGetLovValuesByCodeQuery('PAIN_PATTERN');
  const { data: timeUnitsLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
  const { data: bodyPartsLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
  const [localEncounter, setLocalEncounter] = useState({ ...newApEncounter });

  const [saveEncounterChanges, saveEncounterChangesMutation] = useSaveEncounterChangesMutation();

  const [chiefComplaintTextAreaOpen, setChiefComplaintTextAreaOpen] = useState(false);
  const [hpiSummaryTextAreaOpen, setHpiSummaryTextAreaOpen] = useState(false);
  const [pastMedicalHistoryTextAreaOpen, setPastMedicalHistoryTextAreaOpen] = useState(false);
  const [progressNoteTextAreaOpen, setProgressNoteTextAreaOpen] = useState(false);
  const [openModal, setOpenModal] = useState(null);
  const [val, setVal] = useState('');
  const [val2, setVal2] = useState('');
  const [val3, setVal3] = useState('');
  const [result, setResult] = useState('');
  const closeModal = () => setOpenModal(null);
  const [toggleChecked, setToggleChecked] = useState(false); // State for Toggle

  const openSpecificModal = (modalId) => setOpenModal(modalId);
  const handleNext = () => {
    if (openModal === 'first') {
      //  setVal((selectValue||otherValue)+","+textAreaValue)
      setOpenModal('second');
    } else if (openModal === 'second') {
      // setVal2(selectSecValue || otherSecValue); // Save value for the second modal
      setOpenModal('third');
    }
  };
  const handleSave = () => {
    //     const combine=val+","+val2+","+val3;
    //    setAddChiefComplement({...addChiefComplement, result:combine}) ;
    //     setResult(combine); // Set the result to a combined value
    closeModal();

  };
  const handleSkip = () => {
    if (openModal === 'first') {
      setOpenModal('second');
    } else if (openModal === 'second') {
      setOpenModal('third');
    }
  };

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

      <Panel bordered style={{ padding: '5px', margin: '5px' }}>

        <Row gutter={15}>
          <IconButton
            style={{ margin: "3px" }} appearance="primary" size="sm"
            onClick={() => openSpecificModal('first')}
            icon={<icons.Search style={{ fontSize: '11px' }} />} >
            <Translate>use   Questionnair</Translate>
          </IconButton>



          <InputGroup>
            <InputGroup.Addon>
              {!progressNoteIsChanged() && <icons.CheckRound color="green" />}
              {progressNoteIsChanged() && <icons.Gear spin />}
            </InputGroup.Addon>
            <Input
              as={'textarea'}
              rows={4}
              style={{ fontSize: '12px', maxHeight: '150px', overflowY: 'auto', resize: 'vertical' }}
              value={localEncounter.progressNote}
              onChange={e => setLocalEncounter({ ...localEncounter, progressNote: e })}
              onBlur={progressNoteIsChanged() ? saveChanges : undefined}
            />
          </InputGroup>


        </Row>
        {/* First Modal */}
        <Modal open={openModal === 'first'} onClose={closeModal}>
          <Modal.Header>
            <Modal.Title>Chief Complain</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Since when do you have pain?</p>
            <Form fluid>
            
                
                  <MyInput
                    // disabled={true}
                    width={180}
                    row
                    fieldLabel="time Units"
                    fieldType="select"
                    fieldName="latestpainlevelLkey"
                    selectData={timeUnitsLovQueryResponse ?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={{}}
                    setRecord={{}}
                  />
              
                <input
                  type="text"
                  placeholder="other"
                  // onChange={handleFirstOtherInputChange}
                  // disabled={durationOtherDisabled}
                  style={{ flex: '1', borderRadius: '4px' }}
                />
             <MyInput
             fieldType="textarea"
            fieldName="duration"
             record={{}}
             setRecord={{}}
             ></MyInput>
             
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button style={{ backgroundColor: '#ffcc00' }} appearance="subtle" onClick={handleSkip}>
              Skip
            </Button>
            <Button appearance="primary" onClick={handleNext}>
              Next
            </Button>
            <Button appearance="default" onClick={closeModal}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Second Modal */}
        <Modal open={openModal === 'second'} onClose={closeModal}>
          <Modal.Header>
            <Modal.Title>Chief Complain</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>How do you describe your pain pattern?</p>
            <div style={{
              display: "flex",
              flexDirection: "column",
              width: "370px",
              height: "250px",
              backgroundColor: "#f7f7fa"
            }}>
              <div style={{ display: "flex", gap: "5px", marginBottom: "7px" }}>
              <Form>
                  <MyInput
                    // disabled={true}
                    width={180}
                    row
                    fieldLabel="Pain Pattern"
                    fieldType="select"
                    fieldName="latestpainlevelLkey"
                    selectData={painPatternLovQueryResponse ?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={{}}
                    setRecord={{}}
                  />
                </Form>
                <input
                  type="text"
                  placeholder="other"
                  // onChange={handleSecondOtherInputChange}
                  // disabled={durationSecOtherDisabled}
                  style={{ flex: "1", borderRadius: "4px" }}
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button style={{ backgroundColor: '#ffcc00' }} appearance="subtle" onClick={handleSkip}>
              Skip
            </Button>
            <Button appearance="primary" onClick={handleNext}>
              Next
            </Button>
            <Button appearance="default" onClick={closeModal}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Third Modal */}
        <Modal open={openModal === 'third'} onClose={closeModal}>
          <Modal.Header>
            <Modal.Title>Chief Complain</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Do you want to add a specific note to your complaint?</p>
            <div style={{
              display: "flex",
              flexDirection: "column",
              width: "370px",
              height: "250px",
              backgroundColor: "#f7f7fa"
            }}>
              <div style={{ display: "flex", gap: "5px", marginBottom: "7px" }}>
                <Toggle
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                  // checked={toggleChecked}
                  // onChange={handleToggleChange}
                  style={{ marginBottom: '10px' }}
                />
               <Form>
                  <MyInput
                    // disabled={true}
                    width={180}
                    row
                    fieldLabel="Body Parts"
                    fieldType="select"
                    fieldName="latestpainlevelLkey"
                    selectData={bodyPartsLovQueryResponse ?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={{}}
                    setRecord={{}}
                  />
                </Form> </div></div>
          </Modal.Body>
          <Modal.Footer>
            <Button style={{ backgroundColor: '#ffcc00' }} appearance="subtle" onClick={handleSkip}>
              Skip
            </Button>
            <Button appearance="primary" onClick={handleSave}>
              Save
            </Button>
            <Button appearance="default" onClick={closeModal}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </Panel>
    </>
  );
};

export default ChiefComplaint;
