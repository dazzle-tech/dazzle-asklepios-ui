import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { faHeartPulse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { Col, Form, Row } from 'rsuite';
const VitalSigns = ({ object, setObject, disabled, width = '100%', showNoteField = false }) => {
  const [map, setMap] = useState(null);
  const { data: BPMeasurmentLov } = useGetLovValuesByCodeQuery('BP_MEASURMENT_SITE');
  useEffect(() => {
    const diastolic = Number(object?.bloodPressureDiastolic);
    const systolic = Number(object?.bloodPressureSystolic);
    if (!isNaN(diastolic) && !isNaN(systolic)) {
      const calculatedMap = ((2 * diastolic + systolic) / 3).toFixed(2);
      setMap(calculatedMap);
    }
  }, [object?.bloodPressureSystolic, object?.bloodPressureDiastolic]);
  return (
    <div style={width ? { width } : {}}>
      <Form fluid>
        <Row>
          <Col md={8}>
            <MyInput
              width="100%"
              fieldType="number"
              fieldName="bloodPressureSystolic"
              record={object}
              setRecord={setObject}
              disabled={disabled}
            />
          </Col>
          <Col md={2}>
            <div style={{ padding: '20px', paddingTop: '30px' }}>/</div>
          </Col>
          <Col md={8}>
            <MyInput
              width="100%"
              fieldType="number"
              fieldName="bloodPressureDiastolic"
              record={object}
              setRecord={setObject}
              disabled={disabled}
            />
          </Col>
          <Col md={6}>
            <div className="container-Column">
              <MyLabel label="MAP" />
              <div>
                <FontAwesomeIcon icon={faHeartPulse} className="my-icon" />
                <text>{map}</text>
              </div>
            </div>
          </Col>
        </Row>
        <Row>
          <Col md={24}>
            <MyInput
              width="100%"
              fieldType="select"
              fieldName="measurementSiteLkey"
              selectData={BPMeasurmentLov?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={object}
              setRecord={setObject}
              disabled={disabled}
            />
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <MyInput
              width="100%"
              fieldType="number"
              fieldName="heartRate"
              rightAddon="bpm"
              rightAddonwidth={45}
              record={object}
              setRecord={setObject}
              disabled={disabled}
            />
          </Col>

          <Col md={12}>
            <MyInput
              width="100%"
              fieldType="number"
              rightAddon="C"
              fieldName="temperature"
              record={object}
              setRecord={setObject}
              disabled={disabled}
            />
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <MyInput
              width="100%"
              fieldType="number"
              rightAddon=" % "
              fieldName="oxygenSaturation"
              record={object}
              setRecord={setObject}
              disabled={disabled}
            />
          </Col>
          <Col md={12}>
            <MyInput
              width="100%"
              fieldType="number"
              rightAddon="bpm"
              rightAddonwidth={45}
              fieldName="respiratoryRate"
              fieldLabel="R.R"
              record={object}
              setRecord={setObject}
              disabled={disabled}
            />
          </Col>
        </Row>
        {showNoteField && (
          <Row className="rows-gap margin-left">
            <Col md={24}>
              <Form fluid>
                <MyInput
                  fieldLabel="Note"
                  height="100px"
                  width={430}
                  fieldName="latestnotes"
                  fieldType="textarea"
                  record={object}
                  setRecord={setObject}
                  disabled={disabled}
                />
              </Form>
            </Col>
          </Row>
        )}
      </Form>
    </div>
  );
};
export default VitalSigns;
