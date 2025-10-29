import MyButton from '@/components/MyButton/MyButton';
import MyLabel from '@/components/MyLabel';
import MyTagInput from '@/components/MyTagInput/MyTagInput';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import {
  useGetNursingCareByOperationQuery,
  useSaveNursingCareMutation
} from '@/services/RecoveryService';
import { newApOperationNursingCareInterventions } from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import { set } from 'lodash';
import React, { useEffect, useState } from 'react';
import { Col, Divider, Radio, RadioGroup, Row, Text } from 'rsuite';
const NursingCare = ({ operation }) => {
  const dispatch = useAppDispatch();
  // Initialize the care object with default values
  const [care, setCare] = useState({ ...newApOperationNursingCareInterventions });
  const { data: careData } = useGetNursingCareByOperationQuery(operation?.key, {
    skip: !operation?.key,
    refetchOnMountOrArgChange: true
  });

  const [save] = useSaveNursingCareMutation();

  const [ivFluidsGiven, setIvFluidsGiven] = useState([]);
  const [analgesicsGiven, setAnalgesicsGiven] = useState([]);
  const [drainsAndTubes, setDrainsAndTubes] = useState([]);
  const [complicationsObserved, setComplicationsObserved] = useState([]);
  const [woundDressingStatus, setWoundDressingStatus] = useState<string>('');

  useEffect(() => {
    setCare({ ...care, woundDressingStatus: woundDressingStatus });
  }, [woundDressingStatus]);

  useEffect(() => {
    if (careData?.object) {
      setCare(careData.object);
      setIvFluidsGiven(
        careData.object.ivFluidsGiven ? careData.object.ivFluidsGiven.split(',') : []
      );
      setAnalgesicsGiven(
        careData.object.analgesicsGiven ? careData.object.analgesicsGiven.split(',') : []
      );
      setDrainsAndTubes(careData.object.drainsTubes ? careData.object.drainsTubes.split(',') : []);
      setComplicationsObserved(
        careData.object.complicationsObserved
          ? careData.object.complicationsObserved.split(',')
          : []
      );
      setWoundDressingStatus(careData.object.woundDressingStatus || '');
    }
  }, [careData]);
  const joinValuesFromArray = values => {
    return values?.filter(Boolean).join(', ');
  };
  const handleSave = async () => {
    try {
      const response = await save({
        ...care,
        operationRequestKey: operation?.key,
        ivFluidsGiven: joinValuesFromArray(ivFluidsGiven),
        analgesicsGiven: joinValuesFromArray(analgesicsGiven),
        drainsTubes: joinValuesFromArray(drainsAndTubes),
        complicationsObserved: joinValuesFromArray(complicationsObserved)
      });
      dispatch(notify({ sev: 'success', msg: 'Saved successfully!' }));
    } catch (error) {
      dispatch(notify({ sev: 'error', msg: 'Error saving nursing care interventions.' }));
      console.error('Error saving nursing care interventions:', error);
    }
  };
  return (
    <SectionContainer
      title={
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <div className="title-div">
            <Text>Nursing Care & Interventions</Text>
          </div>
          <div className="container-of-add-new-button-2">
            <MyButton color="var(--deep-blue)" width="90px" onClick={handleSave}>
              Save
            </MyButton>
          </div>
        </div>
      }
      content={
        <>
          <Row>
            <Col md={12}>
              <MyTagInput
                tags={ivFluidsGiven}
                setTags={setIvFluidsGiven}
                labelText="IV Fluids Given"
              />
            </Col>
            <Col md={12}>
              <MyTagInput
                tags={analgesicsGiven}
                setTags={setAnalgesicsGiven}
                labelText="Analgesics Given"
              />
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <MyTagInput
                tags={drainsAndTubes}
                setTags={setDrainsAndTubes}
                labelText="Drains & Tubes"
              />
            </Col>
            <Col md={12}>
              <MyTagInput
                tags={complicationsObserved}
                setTags={setComplicationsObserved}
                labelText="Complications Observed"
              />
            </Col>
          </Row>
          <Row className="container-of-radio-recovery">
            <Col md={8}>
              <MyLabel label={'Wound/Dressing Checked'} />
            </Col>

            <Col md={16}>
              <RadioGroup
                name="woundDressingStatus"
                inline
                value={woundDressingStatus}
                onChange={(value, _event) => setWoundDressingStatus(value as string)}
              >
                <Radio value="clean">Clean</Radio>
                <Radio value="Not extubated">Oozing</Radio>
                <Radio value="na">Reinforced</Radio>
              </RadioGroup>
            </Col>
          </Row>
          <br />
          <Row></Row>
        </>
      }
    />
  );
};
export default NursingCare;
