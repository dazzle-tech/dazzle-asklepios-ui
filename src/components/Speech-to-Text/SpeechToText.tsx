import React, { useState } from 'react';
import MyInput from '../MyInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone } from '@fortawesome/free-solid-svg-icons';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import Translate from '../Translate';
import { camelCaseToLabel } from '@/utils';
import './styles.less';
import { Tooltip, Whisper } from 'rsuite';

const SpeechToText = ({ record, setRecord, fieldName, ...props }) => {
  const fieldLabel = props?.fieldLabel ?? camelCaseToLabel(fieldName);
  const [recording, setRecording] = useState(false);

  // handle clear textarea
  const handleClear = () => {
     if (!props.disabled) {
    setRecord({ ...record, [fieldName]: '' });
     }
  };

  // change recording state
  const changeRecordingState = () => {
    setRecording(!recording);
  };

  return (
    <div
      className="container-of-speech-to-text"
      style={{
        width: props?.width ?? 200
      }}
    >
      <div className="container-of-header-speech-to-text">
        <Translate>{fieldLabel}</Translate>
        <div className="container-of-icons-speech-to-text">
          <Whisper placement="top" trigger="hover" speaker={<Tooltip>Clear</Tooltip>}>
            <FontAwesomeIcon className={props.disabled ? "disabled-icon icons-style" : "icons-style"} icon={faBroom} onClick={handleClear} />
          </Whisper>

          <div
            className={`icons-style ${recording ? 'recording' : ''}`}
            onClick={changeRecordingState}
            style={{ position: 'relative' }}
          >
            <FontAwesomeIcon icon={faMicrophone} className={props.disabled ? "disabled-icon icons-style" : "active-icon icons-style"} />
            {recording && <span className="pulse-ring"></span>}
          </div>
        </div>
      </div>
      <div>
        <MyInput
          fieldType="textarea"
          fieldName={fieldName}
          record={record}
          setRecord={setRecord}
          width={props?.width ?? 200}
          showLabel={false}
          height="100%"
          disabled={props.disabled ?? false}
        />
      </div>
    </div>
  );
};

export default SpeechToText;
