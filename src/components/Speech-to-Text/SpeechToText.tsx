import React, { useState, useRef } from 'react';
import MyInput from '../MyInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone } from '@fortawesome/free-solid-svg-icons';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import Translate from '../Translate';
import { camelCaseToLabel } from '@/utils';
import './styles.less';
import { Tooltip, Whisper } from 'rsuite';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

const SpeechToText = ({ record, setRecord, fieldName, ...props }) => {
  const dispatch = useAppDispatch();
  const uiSlice = useAppSelector(state => state.ui);
  const mode = useAppSelector((state: any) => state.ui.mode);
  const fieldLabel = props?.fieldLabel ?? camelCaseToLabel(fieldName);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);

  // handle clear textarea
  const handleClear = () => {
    if (!props.disabled) {
      setRecord({ ...record, [fieldName]: '' });
    }
  };

  // start speech recognition
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      dispatch(notify({ msg: 'Your browser does not support Speech Recognition', sev: 'error' }));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = uiSlice.lang === 'SYS_LANG_ENG' ? 'en-US' : 'ar-SA';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = event => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setRecord({ ...record, [fieldName]: transcript });
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  // stop speech recognition
  const stopListening = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  };

  // change recording state
  const changeRecordingState = () => {
    if (!props.disabled) {
      if (recording) {
        stopListening();
      } else {
        startListening();
      }
      setRecording(!recording);
    }
  };

  return (
    <div
      className={`container-of-speech-to-text ${mode === 'light' ? 'light' : 'dark'}`}
      style={{
        width: props?.width ?? 200
      }}
    >
      <div className="container-of-header-speech-to-text">
        <Translate>{fieldLabel}</Translate>
        <div className="container-of-icons-speech-to-text">
          <Whisper placement="top" trigger="hover" speaker={<Tooltip>Clear</Tooltip>}>
            <FontAwesomeIcon
              className={props.disabled ? 'disabled-icon' : 'active-icon'}
              icon={faBroom}
              onClick={handleClear}
            />
          </Whisper>

          <div
            className={`${recording ? 'recording' : ''}`}
            onClick={changeRecordingState}
            style={{ position: 'relative' }}
          >
            <FontAwesomeIcon
              icon={faMicrophone}
              className={props.disabled ? 'disabled-icon' : 'active-icon'}
            />
            {recording && <span className="pulse-ring"></span>}
          </div>
        </div>
      </div>
      <div className='container-of-text-area-speech-to-text'>
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
