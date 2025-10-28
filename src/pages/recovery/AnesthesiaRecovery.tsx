import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import {
  useGetAnesthesiaRecoveryByOperationQuery,
  useGetRecoveryAntiemeticGivenListQuery,
  useSaveAnesthesiaRecoveryMutation,
  useSaveRecoveryAntiemeticGivenMutation
} from '@/services/RecoveryService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { newApOperationAnesthesiaRecovery } from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useState } from 'react';
import { Col, Radio, RadioGroup, Row, Text } from 'rsuite';
import GenericAdministeredMedications from '../encounter/encounter-component/procedure/Post-ProcedureCare/AdministeredMedications ';

const AnesthesiaRecovery = ({ operation }) => {
  const dispatch = useAppDispatch();
  const [anesthesia, setAnethesia] = useState({ ...newApOperationAnesthesiaRecovery });
  const [status, setStatus] = useState<string>('');
  const { data: anesthesiaData } = useGetAnesthesiaRecoveryByOperationQuery(operation?.key, {
    skip: !operation?.key,
    refetchOnMountOrArgChange: true
  });
  console.log('anesthesiaData', anesthesiaData);
  const [save] = useSaveAnesthesiaRecoveryMutation();
  // Fetch  consciousness Level Lov response
  const { data: consciousnessLevelLovQueryResponse } = useGetLovValuesByCodeQuery('LEVEL_OF_CONSC');
  // Fetch  pain Level Lov response
  const { data: painLevelLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');

  useEffect(() => {
    setAnethesia({ ...anesthesia, extubationStatus: status });
  }, [status]);

  useEffect(() => {
    if (anesthesiaData?.object) {
      setAnethesia(normalizeDates(anesthesiaData?.object));
      setStatus(anesthesiaData?.object.extubationStatus || '');
    }
  }, [anesthesiaData]);

  const normalizeDates = obj => ({
    ...obj,
    extubationTime: obj.extubationTime ? new Date(obj.extubationTime) : null
  });
  const handleSave = async () => {
    try {
      const response = await save({
        ...anesthesia,
        operationRequestKey: operation?.key,
        extubationTime: anesthesia.extubationTime
          ? new Date(anesthesia.extubationTime).getTime()
          : null
      }).unwrap();
      dispatch(
        notify({
          sev: 'success',
          msg: 'Saved successfully'
        })
      );
    } catch (error) {
      dispatch(
        notify({
          sev: 'error',
          msg: 'Failed to Save'
        })
      );
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
            <Text>Anesthesia Recovery</Text>
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
          <Row className="rows-gap">
            <Col md={12}>
              <MyInput
                width="100%"
                fieldName="anesthesiaType"
                record={operation}
                setRecord=""
                disabled
              />
            </Col>
            <Col md={12}>
              <MyInput
                width="100%"
                fieldName="airwayTypeOnArrival"
                record={anesthesia}
                setRecord={setAnethesia}
              />
            </Col>
          </Row>
          <Row className="rows-gap">
            <Col md={8}>
              <MyInput
                width="100%"
                fieldType="checkbox"
                fieldName="nauseaVomiting"
                record={anesthesia}
                setRecord={setAnethesia}
              />
            </Col>
            <Col md={8}>
              <MyInput
                width="100%"
                fieldType="checkbox"
                fieldName="oxygenGiven"
                record={anesthesia}
                setRecord={setAnethesia}
              />
            </Col>
            {anesthesia.oxygenGiven == true && (
              <Col md={8}>
                <MyInput
                  width="100%"
                  fieldType="number"
                  fieldName="oxygenFlowLpm"
                  fieldLabel="L/min"
                  record={anesthesia}
                  setRecord={setAnethesia}
                />
              </Col>
            )}
          </Row>

          <Row className="rows-gap">
            <RadioGroup
              name="extubationStatus"
              inline
              value={status}
              onChange={(value, _event) => setStatus(value as string)}
            >
              <Col md={8}>
                <Radio value="extubated">Extubated</Radio>
              </Col>
              <Col md={8}>
                <Radio value="Not extubated">Not extubated</Radio>
              </Col>
              <Col md={8}>
                <Radio value="na">NA</Radio>
              </Col>
            </RadioGroup>
          </Row>

          <Row className="rows-gap">
            <Col md={8}>
              <MyInput
                width="100%"
                fieldType="time"
                fieldName="extubationTime"
                record={anesthesia}
                setRecord={setAnethesia}
              />
            </Col>
            <Col md={8}>
              <MyInput
                width="100%"
                fieldLabel="Consciousness Level"
                fieldType="select"
                fieldName="consciousnessLevelLkey"
                selectData={consciousnessLevelLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={anesthesia}
                setRecord={setAnethesia}
                searchable={false}
              />
            </Col>
            <Col md={8}>
              <MyInput
                width="100%"
                fieldLabel="Pain Level"
                fieldType="select"
                fieldName="painLevelLkey"
                selectData={painLevelLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={anesthesia}
                setRecord={setAnethesia}
              />
            </Col>
          </Row>
            <br />
          <GenericAdministeredMedications
            parentKey={'operation?.key'}
            filterFieldName="operationRequestKey"
            medicationService={{
              useGetQuery: useGetRecoveryAntiemeticGivenListQuery,
              useSaveMutation: useSaveRecoveryAntiemeticGivenMutation
            }}
            newMedicationTemplate={newApOperationAnesthesiaRecovery}
            title="Antiemetics Given"
            noBorder
          />
          <br />
          <Row></Row>
        </>
      }
    />
  );
};
export default AnesthesiaRecovery;
