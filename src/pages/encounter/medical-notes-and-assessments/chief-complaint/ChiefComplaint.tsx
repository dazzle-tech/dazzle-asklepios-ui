import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
// import 'bootstrap-icons/font/bootstrap-icons.css';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import React, { useEffect, useState } from 'react';
import {
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import { notify } from '@/utils/uiReducerActions';
import { IconButton, Input, Panel, Grid, Row, Col, InputGroup, Modal, Button, Toggle, Form } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';

import { useSaveEncounterChangesMutation } from '@/services/encounterService';
import CheckOutlineIcon from '@rsuite/icons/CheckOutline';

import './styles.less';
const ChiefComplaint = () => {
  const patientSlice = useAppSelector(state => state.patient);
  const dispatch = useAppDispatch();
  const { data: painPatternLovQueryResponse } = useGetLovValuesByCodeQuery('PAIN_PATTERN');
  const { data: timeUnitsLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
  const { data: bodyPartsLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
  const [localEncounter, setLocalEncounter] = useState({ ...patientSlice.encounter });
  const [saveEncounterChanges, saveEncounterChangesMutation] = useSaveEncounterChangesMutation();
  console.log(patientSlice.encounter);
  console.log(localEncounter);

  const [openModal, setOpenModal] = useState(null);
  const closeModal = () => setOpenModal(null);
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

    closeModal();

  };
  const handleSkip = () => {
    if (openModal === 'first') {
      setOpenModal('second');
    } else if (openModal === 'second') {
      setOpenModal('third');
    }
  };



  const saveChanges = async () => {
    try {
      console.log(localEncounter)
      await saveEncounterChanges(localEncounter).unwrap();
      dispatch(notify('Chief Complain Saved Successfully'));
    } catch (error) {


      dispatch(notify('Chief Complain Saved  fill'));
    }
  };

  useEffect(() => {
    if (saveEncounterChangesMutation.status === 'fulfilled') {
      dispatch(setEncounter(saveEncounterChangesMutation.data));
      setLocalEncounter(saveEncounterChangesMutation.data);
    }
  }, [saveEncounterChangesMutation]);



  const chiefComplaintChanged = () => {
    return patientSlice.encounter.chiefComplaint !== localEncounter.chiefComplaint;
  };

  return (
    <>


      <Panel bordered style={{width:'100%', padding: '5px', margin: '5px', display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
         

          <IconButton
            circle
            style={{ margin: "3px" }}
            
            icon={<CheckOutlineIcon />}
            size="xs"
            appearance="primary"
            color="green"
            onClick={saveChanges}
          />
           <IconButton
           style={{ marginLeft: 'auto' }}
            appearance="primary"
            size="sm"
            onClick={() => openSpecificModal('first')}
            icon={<icons.Search style={{ fontSize: '11px' }} />}
          >
            <Translate>use Questionnair</Translate>
          </IconButton>
        </div>




        <Input
          as={'textarea'}
          rows={4}
          style={{ fontSize: '12px', maxHeight: '150px', overflowY: 'auto', resize: 'vertical' }}
          value={localEncounter.chiefComplaint}
          onChange={e => setLocalEncounter({ ...localEncounter, chiefComplaint: e })}
         
        />




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
                selectData={timeUnitsLovQueryResponse?.object ?? []}
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
                    selectData={painPatternLovQueryResponse?.object ?? []}
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
                    selectData={bodyPartsLovQueryResponse?.object ?? []}
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
