import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { faHeartPulse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { Tooltip, Whisper, IconButton } from 'rsuite';
import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { Form } from 'rsuite';
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
        <div className="fill-last-readings-main-position">
          <Whisper placement="top" trigger="hover" speaker={<Tooltip>Fill Last Readings</Tooltip>}>
            <IconButton
              icon={<FontAwesomeIcon icon={faClockRotateLeft} />}
              className="vital-icon"
              style={{ fontSize: 20, cursor: 'pointer' }}
              appearance="subtle"
            />
          </Whisper>
        </div>
        <div className="vital-signs-handle-position-row">
          <MyInput
            width="100%"
            fieldType="number"
            fieldName="bloodPressureSystolic"
            record={object}
            setRecord={setObject}
            disabled={disabled}
          />
          <div className="gap-betwen-blood-pressures">/</div>
          <MyInput
            width="100%"
            fieldType="number"
            fieldName="bloodPressureDiastolic"
            record={object}
            setRecord={setObject}
            disabled={disabled}
          />
          <div className="container-Column">
            <MyLabel label="MAP" />
            <div>
              <FontAwesomeIcon icon={faHeartPulse} className="my-icon" />
              <text>{map}</text>
            </div>
          </div>
        </div>
        <div className="margin-bot-10">
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
        </div>
        <div className="vital-signs-handle-position-row">
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
          <MyInput
            width="100%"
            fieldType="number"
            rightAddon="C"
            fieldName="temperature"
            record={object}
            setRecord={setObject}
            disabled={disabled}
          />
        </div>
        <div className="vital-signs-handle-position-row">
          <MyInput
            width="100%"
            fieldType="number"
            rightAddon=" % "
            fieldName="oxygenSaturation"
            record={object}
            setRecord={setObject}
            disabled={disabled}
          />
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
        </div>
        {showNoteField && (
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
        )}
      </Form>
    </div>
  );
};
export default VitalSigns;
